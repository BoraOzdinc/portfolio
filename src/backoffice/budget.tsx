import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import type { BudgetSnapshot } from "../../server/backoffice/budget";
import { api, money, dateLabel, timeLabel } from "./api";
import { Field, Input, Modal } from "./forms";

type Item = BudgetSnapshot["items"][number];
type Card = BudgetSnapshot["cards"][number];
type Statement = BudgetSnapshot["statements"][number];
type Account = BudgetSnapshot["accounts"][number];
type Lot = BudgetSnapshot["investments"]["lots"][number];
type Editor =
  | { kind: "item"; row?: Item }
  | { kind: "card"; row?: Card }
  | { kind: "statement"; card: Card; row?: Statement }
  | { kind: "pay"; row: Statement }
  | { kind: "account"; row?: Account }
  | { kind: "holding"; row?: Lot }
  | { kind: "price"; asset: string; price?: number };

const sections = [
  { id: "summary", label: "Özet" },
  { id: "flows", label: "Gelir ve giderler" },
  { id: "cards", label: "Kredi kartları" },
  { id: "assets", label: "Hesaplar ve yatırımlar" },
] as const;
type Section = (typeof sections)[number]["id"];
const periods = { once: "Tek seferlik", monthly: "Aylık", yearly: "Yıllık" };
const assetPresets = ["Gram altın", "Çeyrek altın", "USD", "EUR"];
const tl = (amount: number) => money(amount, "TRY");
const signed = (amount: number) => (amount > 0 ? "+" : "") + tl(amount);
const quantity = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 8 }).format(n);
const monthLabel = (month: string, style: "long" | "short" = "long") =>
  new Intl.DateTimeFormat("tr-TR", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
const shiftMonth = (month: string, n: number) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
/** Next occurrence of a card's due day on or after today. */
function nextDueOn(today: string, day: number) {
  for (const n of [0, 1]) {
    const month = shiftMonth(today.slice(0, 7), n);
    const [y, m] = month.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const date = `${month}-${String(Math.min(day, last)).padStart(2, "0")}`;
    if (date >= today) return date;
  }
  return today;
}
function statementState(st: Statement, today: string) {
  if (st.paidAmount >= st.balance) return ["paid", "Tamamı ödendi"];
  if (st.paidAmount >= st.minimum) return ["up", "Asgari ödendi"];
  if (st.dueOn < today) return ["overdue", "Gecikmiş"];
  return ["pending", "Bekliyor"];
}
function Gain({ value, cost }: { value: number | null; cost: number }) {
  if (value === null) return <span className="bo-muted">Fiyat yok</span>;
  const gain = value - cost;
  return (
    <span className={gain < 0 ? "bo-danger" : gain > 0 ? "bo-gain" : ""}>
      {signed(gain)}
      <small>
        {cost
          ? `${gain >= 0 ? "+" : ""}${((gain / cost) * 100).toFixed(1)}%`
          : ""}
      </small>
    </span>
  );
}

export function Budget() {
  const [params, setParams] = useSearchParams();
  const section: Section =
    sections.find((s) => s.id === params.get("section"))?.id || "summary";
  const [from, setFrom] = useState<string | null>(null),
    [full, setFull] = useState(false),
    [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<BudgetSnapshot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editor, setEditor] = useState<Editor | null>(null),
    [confirm, setConfirm] = useState<{
      title: string;
      body: string;
      path: string;
    } | null>(null);
  const latest = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++latest.current;
    try {
      const result = await api<BudgetSnapshot>(
        `/budget${from ? `?from=${from}` : ""}`,
      );
      if (requestId === latest.current) setData(result);
    } catch (e) {
      if (requestId === latest.current)
        setError(e instanceof Error ? e.message : "Veriler alınamadı.");
    }
  }, [from]);
  useEffect(() => {
    const timer = setTimeout(() => void reload(), 0);
    return () => clearTimeout(timer);
  }, [reload]);
  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      await api(confirm.path, "DELETE");
      await reload();
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi.");
    } finally {
      setBusy(false);
    }
  };
  const go = (id: Section) => setParams({ view: "budget", section: id });

  if (!data)
    return (
      <main className="bo-main">
        <p
          role={error ? "alert" : "status"}
          className={error ? "bo-error" : ""}
        >
          {error || "Bütçe yükleniyor…"}
        </p>
      </main>
    );
  const month = selected || data.today.slice(0, 7);
  const detail = data.table.find((r) => r.month === month) ?? data.table[0];
  const investedCost = data.investments.assets.reduce(
    (a, x) => a + (x.value === null ? 0 : x.cost),
    0,
  );
  const unpaid = data.statements.filter((st) => st.paidAmount < st.balance);

  return (
    <main className="bo-main">
      <header className="bo-page-header">
        <div>
          <p className="bo-breadcrumb">Kişisel</p>
          <h1>Bütçe</h1>
          <p>Gelir, gider, kart borçları ve birikimler. Tutarlar TL.</p>
        </div>
        <div className="bo-actions">
          <button
            className="bo-button"
            aria-label="Yenile"
            onClick={() => void reload()}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="bo-error">
          {error}
          <button className="bo-link" onClick={() => setError("")}>
            Kapat
          </button>
        </div>
      )}
      <nav className="bo-tabs" aria-label="Bütçe bölümleri">
        {sections.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? "selected" : ""}
            aria-current={section === s.id ? "page" : undefined}
            onClick={() => go(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {section === "summary" && (
        <>
          <div className="bo-money-grid four">
            <article>
              <span>Net varlık</span>
              <strong>{tl(data.totals.netWorth)}</strong>
              <p>Hesaplar + yatırımlar − kart borcu</p>
            </article>
            <article>
              <span>Hesaplarda</span>
              <strong>{tl(data.totals.cash)}</strong>
              <p>{data.accounts.length} hesap</p>
            </article>
            <article>
              <span>Yatırımlar</span>
              <strong>{tl(data.totals.invested)}</strong>
              <p>
                <Gain value={data.totals.invested} cost={investedCost} />
              </p>
            </article>
            <article>
              <span>Kart borcu</span>
              <strong className={data.totals.cardDebt ? "bo-danger" : ""}>
                {tl(data.totals.cardDebt)}
              </strong>
              <p>{unpaid.length} ekstre kapanmadı</p>
            </article>
          </div>
          {data.totals.unpriced.length > 0 && (
            <p className="bo-notice">
              Güncel fiyatı girilmemiş varlıklar toplama katılmadı:{" "}
              {data.totals.unpriced.join(", ")}.{" "}
              <button className="bo-link" onClick={() => go("assets")}>
                Fiyat gir
              </button>
            </p>
          )}
          <section className="bo-section">
            <div className="bo-section-heading">
              <h2>Gelir-gider tablosu</h2>
              <div className="bo-actions">
                <div
                  className="bo-segmented"
                  role="group"
                  aria-label="Kart ödemesi"
                >
                  <button aria-pressed={!full} onClick={() => setFull(false)}>
                    Asgari ödeme
                  </button>
                  <button aria-pressed={full} onClick={() => setFull(true)}>
                    Tam borç
                  </button>
                </div>
                <button
                  className="bo-button"
                  aria-label="Önceki aylar"
                  onClick={() => setFrom(shiftMonth(data.from, -12))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="bo-button"
                  aria-label="Sonraki aylar"
                  onClick={() => setFrom(shiftMonth(data.from, 12))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <p className="bo-muted">
              Tahmini bakiye bugünkü hesap bakiyelerinden başlar; yalnız henüz
              gerçekleşmemiş gelir, gider ve kart ödemelerini ekler. Ekstresi
              girilmemiş aylarda kart ödemesi sıfır görünür.
            </p>
            <div className="bo-table-wrap">
              <table className="bo-ledger">
                <thead>
                  <tr>
                    <th>Ay</th>
                    <th>Gelir</th>
                    <th>Gider</th>
                    <th>Kart ödemesi</th>
                    <th>Net</th>
                    <th>Tahmini bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {data.table.map((r) => {
                    const net = full ? r.netFull : r.netMin;
                    const projected = full ? r.projectedFull : r.projectedMin;
                    return (
                      <tr
                        key={r.month}
                        className={r.month === detail.month ? "selected" : ""}
                      >
                        <td>
                          <button
                            className="bo-link"
                            aria-pressed={r.month === detail.month}
                            onClick={() => setSelected(r.month)}
                          >
                            {monthLabel(r.month)}
                          </button>
                          {r.month === data.today.slice(0, 7) && (
                            <small>Bu ay</small>
                          )}
                        </td>
                        <td>{tl(r.income)}</td>
                        <td>{tl(r.expense)}</td>
                        <td>{tl(full ? r.cardFull : r.cardMin)}</td>
                        <td className={net < 0 ? "bo-danger" : ""}>
                          {signed(net)}
                        </td>
                        <td
                          className={
                            projected !== null && projected < 0
                              ? "bo-danger"
                              : ""
                          }
                        >
                          {projected === null ? "—" : tl(projected)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="bo-section">
            <h2>{monthLabel(detail.month)} ayrıntısı</h2>
            <div className="bo-columns bo-three">
              {(["income", "expense"] as const).map((dir) => {
                const lines = detail.lines.filter((l) => l.direction === dir);
                return (
                  <div key={dir}>
                    <h3>{dir === "income" ? "Gelirler" : "Giderler"}</h3>
                    {lines.length ? (
                      lines.map((l) => (
                        <div className="bo-list-row" key={l.id}>
                          <span>{l.name}</span>
                          <strong>{tl(l.amount)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="bo-muted">Kalem yok.</p>
                    )}
                  </div>
                );
              })}
              <div>
                <h3>Kart ödemeleri</h3>
                {detail.cards.length ? (
                  detail.cards.map((c) => (
                    <div className="bo-list-row" key={c.id}>
                      <div>
                        <span>{c.name}</span>
                        <small>
                          Son ödeme {dateLabel(c.dueOn)} · Asgari{" "}
                          {tl(c.minimum)}
                          {c.paid > 0 && ` · Ödenen ${tl(c.paid)}`}
                        </small>
                      </div>
                      <strong>{tl(c.balance)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="bo-muted">Bu ay için ekstre yok.</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {section === "flows" && (
        <section className="bo-section">
          <div className="bo-section-heading">
            <h2>Düzenli ve tek seferlik kalemler</h2>
            <button
              className="bo-button primary"
              onClick={() => setEditor({ kind: "item" })}
            >
              <Plus size={16} /> Kalem ekle
            </button>
          </div>
          <p className="bo-muted">
            Maaş, kira, aidat, abonelik… Kartla yaptığın harcamaları buraya
            ekleme; onlar kart ödemesi olarak sayılır.
          </p>
          {data.items.length ? (
            <div className="bo-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kalem</th>
                    <th>Tutar</th>
                    <th>Sıklık</th>
                    <th>Dönem</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.name}</strong>
                        <small>
                          {i.direction === "income" ? "Gelir" : "Gider"}
                        </small>
                      </td>
                      <td className={i.direction === "income" ? "bo-gain" : ""}>
                        {tl(i.amount)}
                      </td>
                      <td>{periods[i.frequency]}</td>
                      <td>
                        {dateLabel(i.startOn)}
                        {i.frequency !== "once" && (
                          <small>
                            {i.endOn
                              ? `${dateLabel(i.endOn)} bitiş`
                              : "Süresiz"}
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="bo-actions">
                          <button
                            className="bo-link"
                            onClick={() => setEditor({ kind: "item", row: i })}
                          >
                            Düzenle
                          </button>
                          <button
                            className="bo-link danger"
                            onClick={() =>
                              setConfirm({
                                title: "Kalemi sil",
                                body: `${i.name} tüm aylardan kaldırılacak. Yalnız bundan sonrasını durdurmak için bitiş tarihi gir.`,
                                path: `/budget/items/${i.id}`,
                              })
                            }
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bo-empty">Maaşını ve kiranı ekleyerek başla.</div>
          )}
        </section>
      )}

      {section === "cards" && (
        <>
          <div className="bo-section-heading">
            <p className="bo-muted">
              Asgari ödeme, limit 100.000 TL'ye kadar ekstrenin %20'si, üzerinde
              %40'ıdır (BDDK, Ekim 2026). Bankan farklı hesaplıyorsa karta oran
              gir.
            </p>
            <button
              className="bo-button primary"
              onClick={() => setEditor({ kind: "card" })}
            >
              <Plus size={16} /> Kart ekle
            </button>
          </div>
          {!data.cards.length && (
            <div className="bo-empty">Henüz kart yok.</div>
          )}
          {data.cards.map((c) => {
            const rows = data.statements
              .filter((st) => st.cardId === c.id)
              .reverse();
            return (
              <section className="bo-section" key={c.id}>
                <div className="bo-section-heading">
                  <div>
                    <h2>{c.name}</h2>
                    <small>
                      {[
                        c.bank,
                        `Limit ${tl(c.creditLimit)}`,
                        `Son ödeme günü ${c.dueDay}`,
                        `Asgari %${c.rate}${c.minRate ? "" : " (otomatik)"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                  <div className="bo-actions">
                    <button
                      className="bo-button primary"
                      onClick={() => setEditor({ kind: "statement", card: c })}
                    >
                      <Plus size={16} /> Ekstre ekle
                    </button>
                    <button
                      className="bo-link"
                      onClick={() => setEditor({ kind: "card", row: c })}
                    >
                      Düzenle
                    </button>
                    <button
                      className="bo-link danger"
                      onClick={() =>
                        setConfirm({
                          title: "Kartı sil",
                          body: `${c.name} ve ${rows.length} ekstresi silinecek.`,
                          path: `/budget/cards/${c.id}`,
                        })
                      }
                    >
                      Sil
                    </button>
                  </div>
                </div>
                {rows.length ? (
                  <div className="bo-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Son ödeme</th>
                          <th>Ekstre borcu</th>
                          <th>Asgari</th>
                          <th>Ödenen</th>
                          <th>Durum</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((st) => {
                          const [status, label] = statementState(
                            st,
                            data.today,
                          );
                          return (
                            <tr key={st.id}>
                              <td>
                                <strong>{dateLabel(st.dueOn)}</strong>
                                <small>{monthLabel(st.period)}</small>
                              </td>
                              <td>{tl(st.balance)}</td>
                              <td>{tl(st.minimum)}</td>
                              <td>
                                {tl(st.paidAmount)}
                                {st.paidAt && (
                                  <small>{dateLabel(st.paidAt)}</small>
                                )}
                              </td>
                              <td>
                                <span className={`bo-badge ${status}`}>
                                  {label}
                                </span>
                              </td>
                              <td>
                                <div className="bo-actions">
                                  <button
                                    className="bo-link"
                                    onClick={() =>
                                      setEditor({ kind: "pay", row: st })
                                    }
                                  >
                                    Ödeme gir
                                  </button>
                                  <button
                                    className="bo-link"
                                    onClick={() =>
                                      setEditor({
                                        kind: "statement",
                                        card: c,
                                        row: st,
                                      })
                                    }
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    className="bo-link danger"
                                    onClick={() =>
                                      setConfirm({
                                        title: "Ekstreyi sil",
                                        body: `${monthLabel(st.period)} ekstresi silinecek.`,
                                        path: `/budget/statements/${st.id}`,
                                      })
                                    }
                                  >
                                    Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="bo-muted">
                    Ekstre geldiğinde tutarını ve son ödeme tarihini gir.
                  </p>
                )}
              </section>
            );
          })}
        </>
      )}

      {section === "assets" && (
        <>
          <section className="bo-section">
            <div className="bo-section-heading">
              <h2>
                Hesaplar<span>{tl(data.totals.cash)}</span>
              </h2>
              <button
                className="bo-button primary"
                onClick={() => setEditor({ kind: "account" })}
              >
                <Plus size={16} /> Hesap ekle
              </button>
            </div>
            {data.accounts.length ? (
              data.accounts.map((a) => (
                <div className="bo-list-row" key={a.id}>
                  <div>
                    <strong>{a.name}</strong>
                    <small>Güncellendi: {timeLabel(a.updatedAt)}</small>
                  </div>
                  <div className="bo-row-end">
                    <strong className={a.balance < 0 ? "bo-danger" : ""}>
                      {tl(a.balance)}
                    </strong>
                    <button
                      className="bo-link"
                      onClick={() => setEditor({ kind: "account", row: a })}
                    >
                      Güncelle
                    </button>
                    <button
                      className="bo-link danger"
                      onClick={() =>
                        setConfirm({
                          title: "Hesabı sil",
                          body: `${a.name} silinecek.`,
                          path: `/budget/accounts/${a.id}`,
                        })
                      }
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bo-empty">
                Vadesiz hesabını, nakitini veya birikim hesabını ekle.
              </div>
            )}
          </section>
          <section className="bo-section">
            <div className="bo-section-heading">
              <h2>
                Yatırımlar<span>{tl(data.totals.invested)}</span>
              </h2>
              <button
                className="bo-button primary"
                onClick={() => setEditor({ kind: "holding" })}
              >
                <Plus size={16} /> Alım ekle
              </button>
            </div>
            <p className="bo-muted">
              USD ve EUR, TCMB döviz alış kurundan 6 saatte bir güncellenir.
              Altın ve diğer varlıkların fiyatını sen girersin.
            </p>
            {data.investments.assets.length ? (
              <>
                <div className="bo-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Varlık</th>
                        <th>Miktar</th>
                        <th>Ort. alış</th>
                        <th>Güncel fiyat</th>
                        <th>Değer</th>
                        <th>Kâr / zarar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.investments.assets.map((a) => (
                        <tr key={a.asset}>
                          <td>
                            <strong>{a.asset}</strong>
                          </td>
                          <td>{quantity(a.quantity)}</td>
                          <td>{tl(a.averagePrice)}</td>
                          <td>
                            {a.price ? (
                              tl(a.price.price)
                            ) : (
                              <span className="bo-muted">Girilmedi</span>
                            )}
                            {a.price && (
                              <small>
                                {a.price.source === "tcmb" ? "TCMB" : "Elle"} ·{" "}
                                {timeLabel(a.price.updatedAt)}
                              </small>
                            )}
                            <button
                              className="bo-link"
                              onClick={() =>
                                setEditor({
                                  kind: "price",
                                  asset: a.asset,
                                  price: a.price?.price,
                                })
                              }
                            >
                              Fiyat gir
                            </button>
                          </td>
                          <td>{a.value === null ? "—" : tl(a.value)}</td>
                          <td>
                            <Gain value={a.value} cost={a.cost} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3 className="bo-subheading">Alımlar</h3>
                <div className="bo-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Alım</th>
                        <th>Miktar</th>
                        <th>Alış fiyatı</th>
                        <th>Maliyet</th>
                        <th>Kâr / zarar</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.investments.lots].reverse().map((l) => (
                        <tr key={l.id}>
                          <td>
                            <strong>{l.asset}</strong>
                            <small>
                              {dateLabel(l.boughtOn)}
                              {l.note && ` · ${l.note}`}
                            </small>
                          </td>
                          <td>{quantity(l.quantity)}</td>
                          <td>{tl(l.buyPrice)}</td>
                          <td>{tl(l.cost)}</td>
                          <td>
                            <Gain value={l.value} cost={l.cost} />
                          </td>
                          <td>
                            <div className="bo-actions">
                              <button
                                className="bo-link"
                                onClick={() =>
                                  setEditor({ kind: "holding", row: l })
                                }
                              >
                                Düzenle
                              </button>
                              <button
                                className="bo-link danger"
                                onClick={() =>
                                  setConfirm({
                                    title: "Alımı sil",
                                    body: `${dateLabel(l.boughtOn)} tarihli ${quantity(l.quantity)} ${l.asset} alımı silinecek.`,
                                    path: `/budget/holdings/${l.id}`,
                                  })
                                }
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bo-empty">
                Altın, döviz veya hisse alımlarını tek tek ekle; ortalama
                maliyet otomatik hesaplanır.
              </div>
            )}
          </section>
        </>
      )}

      {editor && (
        <BudgetEditor
          editor={editor}
          data={data}
          close={() => setEditor(null)}
          saved={reload}
        />
      )}
      {confirm && (
        <Modal title={confirm.title} close={() => setConfirm(null)}>
          <p>{confirm.body} Bu işlem geri alınamaz.</p>
          {error && (
            <p role="alert" className="bo-error">
              {error}
            </p>
          )}
          <footer>
            <button className="bo-button" onClick={() => setConfirm(null)}>
              Vazgeç
            </button>
            <button
              className="bo-button primary"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Siliniyor…" : "Sil"}
            </button>
          </footer>
        </Modal>
      )}
    </main>
  );
}

function Amount({
  label,
  name,
  value,
  required = true,
  negative = false,
  placeholder,
}: {
  label: string;
  name: string;
  value?: number | null;
  required?: boolean;
  negative?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        name={name}
        step="0.01"
        min={negative ? "-1000000000" : "0"}
        max="1000000000"
        required={required}
        placeholder={placeholder}
        defaultValue={value == null ? undefined : value / 100}
      />
    </Field>
  );
}

function BudgetEditor({
  editor,
  data,
  close,
  saved,
}: {
  editor: Editor;
  data: BudgetSnapshot;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [frequency, setFrequency] = useState(
      editor.kind === "item" ? editor.row?.frequency || "monthly" : "monthly",
    ),
    [paid, setPaid] = useState(
      editor.kind === "pay"
        ? String((editor.row.paidAmount || editor.row.minimum) / 100)
        : "",
    );
  const title = {
    item:
      editor.kind === "item" && editor.row ? "Kalemi düzenle" : "Kalem ekle",
    card: editor.kind === "card" && editor.row ? "Kartı düzenle" : "Kart ekle",
    statement:
      editor.kind === "statement" ? `${editor.card.name} ekstresi` : "",
    pay: editor.kind === "pay" ? `${editor.row.cardName} ödemesi` : "",
    account:
      editor.kind === "account" && editor.row
        ? "Bakiyeyi güncelle"
        : "Hesap ekle",
    holding:
      editor.kind === "holding" && editor.row ? "Alımı düzenle" : "Alım ekle",
    price: editor.kind === "price" ? `${editor.asset} güncel fiyatı` : "",
  }[editor.kind];
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(event.currentTarget),
      val = (key: string) => String(fd.get(key) ?? "").trim(),
      kurus = (key: string) =>
        val(key) === "" ? null : Math.round(Number(val(key)) * 100);
    const save = (path: string, id: string | undefined, body: object) =>
      api(`/budget/${path}${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", body);
    try {
      if (editor.kind === "item")
        await save("items", editor.row?.id, {
          name: val("name"),
          direction: val("direction"),
          amount: kurus("amount"),
          frequency,
          startOn: val("startOn"),
          endOn: frequency === "once" ? null : val("endOn") || null,
        });
      if (editor.kind === "card")
        await save("cards", editor.row?.id, {
          name: val("name"),
          bank: val("bank"),
          creditLimit: kurus("creditLimit"),
          dueDay: Number(val("dueDay")),
          minRate: val("minRate") ? Number(val("minRate")) : null,
        });
      if (editor.kind === "statement")
        await save("statements", editor.row?.id, {
          cardId: editor.card.id,
          dueOn: val("dueOn"),
          balance: kurus("balance"),
          minimum: kurus("minimum"),
        });
      if (editor.kind === "pay")
        await api(`/budget/statements/${editor.row.id}/pay`, "POST", {
          paidAmount: Math.round(Number(paid) * 100),
        });
      if (editor.kind === "account")
        await save("accounts", editor.row?.id, {
          name: val("name"),
          balance: kurus("balance"),
        });
      if (editor.kind === "holding")
        await save("holdings", editor.row?.id, {
          asset: val("asset"),
          quantity: Number(val("quantity")),
          buyPrice: kurus("buyPrice"),
          boughtOn: val("boughtOn"),
          note: val("note"),
        });
      if (editor.kind === "price")
        await api(`/budget/prices/${encodeURIComponent(editor.asset)}`, "PUT", {
          price: kurus("price"),
        });
      await saved();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };
  const assetNames = [
    ...new Set([
      ...assetPresets,
      ...data.investments.assets.map((a) => a.asset),
    ]),
  ];
  return (
    <Modal title={title} close={close}>
      <form onSubmit={submit} className="bo-form">
        {editor.kind === "item" && (
          <>
            <div className="bo-form-grid">
              <Input label="Ad" name="name" value={editor.row?.name} required />
              <Field label="Tür">
                <select
                  name="direction"
                  defaultValue={editor.row?.direction || "expense"}
                >
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
              </Field>
            </div>
            <div className="bo-form-grid">
              <Amount
                label="Tutar (TL)"
                name="amount"
                value={editor.row?.amount}
              />
              <Field label="Sıklık">
                <select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as Item["frequency"])
                  }
                >
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                  <option value="once">Tek seferlik</option>
                </select>
              </Field>
            </div>
            <div className="bo-form-grid">
              <Input
                label={frequency === "once" ? "Tarih" : "İlk tarih"}
                name="startOn"
                type="date"
                value={editor.row?.startOn || data.today}
                required
              />
              {frequency !== "once" && (
                <Input
                  label="Bitiş (isteğe bağlı)"
                  name="endOn"
                  type="date"
                  value={editor.row?.endOn}
                />
              )}
            </div>
            <small>
              Ayın günü, tahmini bakiyede ödemenin bu ay gerçekleşip
              gerçekleşmediğini belirler.
            </small>
          </>
        )}
        {editor.kind === "card" && (
          <>
            <div className="bo-form-grid">
              <Input
                label="Kart adı"
                name="name"
                value={editor.row?.name}
                required
              />
              <Input label="Banka" name="bank" value={editor.row?.bank} />
            </div>
            <div className="bo-form-grid">
              <Amount
                label="Kart limiti (TL)"
                name="creditLimit"
                value={editor.row?.creditLimit}
              />
              <Input
                label="Son ödeme günü"
                name="dueDay"
                type="number"
                value={editor.row?.dueDay ?? 1}
                required
              />
            </div>
            <Input
              label="Asgari ödeme oranı % (boşsa otomatik)"
              name="minRate"
              type="number"
              value={editor.row?.minRate}
            />
            <small>
              Oran değişikliği yalnız yeni eklenen ekstrelere uygulanır.
            </small>
          </>
        )}
        {editor.kind === "statement" && (
          <>
            <Input
              label="Son ödeme tarihi"
              name="dueOn"
              type="date"
              value={
                editor.row?.dueOn || nextDueOn(data.today, editor.card.dueDay)
              }
              required
            />
            <div className="bo-form-grid">
              <Amount
                label="Ekstre borcu (TL)"
                name="balance"
                value={editor.row?.balance}
              />
              <Amount
                label="Asgari ödeme (TL)"
                name="minimum"
                value={editor.row?.minimum}
                required={false}
                placeholder="Boşsa hesaplanır"
              />
            </div>
            <small>
              Asgari tutarı bankanın ekstresinde yazan değerle
              değiştirebilirsin.
            </small>
          </>
        )}
        {editor.kind === "pay" && (
          <>
            <p>
              Ekstre {tl(editor.row.balance)} · Asgari {tl(editor.row.minimum)}{" "}
              · Son ödeme {dateLabel(editor.row.dueOn)}
            </p>
            <Field label="Bu ekstreye ödenen toplam (TL)">
              <input
                type="number"
                step="0.01"
                min="0"
                max={editor.row.balance / 100}
                required
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
              />
            </Field>
            <div className="bo-actions">
              <button
                type="button"
                className="bo-link"
                onClick={() => setPaid(String(editor.row.minimum / 100))}
              >
                Asgari
              </button>
              <button
                type="button"
                className="bo-link"
                onClick={() => setPaid(String(editor.row.balance / 100))}
              >
                Tamamı
              </button>
              <button
                type="button"
                className="bo-link"
                onClick={() => setPaid("0")}
              >
                Ödenmedi
              </button>
            </div>
            <small>Bu yalnızca kayıttır; para transferi yapmaz.</small>
          </>
        )}
        {editor.kind === "account" && (
          <>
            <Input
              label="Hesap adı"
              name="name"
              value={editor.row?.name}
              required
            />
            <Amount
              label="Güncel bakiye (TL)"
              name="balance"
              value={editor.row?.balance}
              negative
            />
          </>
        )}
        {editor.kind === "holding" && (
          <>
            <div className="bo-form-grid">
              <Field label="Varlık">
                <input
                  name="asset"
                  list="bo-assets"
                  defaultValue={editor.row?.asset}
                  required
                  maxLength={40}
                />
                <datalist id="bo-assets">
                  {assetNames.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </Field>
              <Field label="Miktar">
                <input
                  name="quantity"
                  type="number"
                  step="any"
                  min="0"
                  required
                  defaultValue={editor.row?.quantity}
                />
              </Field>
            </div>
            <div className="bo-form-grid">
              <Amount
                label="Birim alış fiyatı (TL)"
                name="buyPrice"
                value={editor.row?.buyPrice}
              />
              <Input
                label="Alış tarihi"
                name="boughtOn"
                type="date"
                value={editor.row?.boughtOn || data.today}
                required
              />
            </div>
            <Input label="Not" name="note" value={editor.row?.note} />
            <small>
              Aynı adı kullanan alımlar tek varlıkta toplanır ve ortalaması
              alınır.
            </small>
          </>
        )}
        {editor.kind === "price" && (
          <>
            <Amount
              label={`1 ${editor.asset} (TL)`}
              name="price"
              value={editor.price}
            />
            {["USD", "EUR"].includes(editor.asset) && (
              <small>TCMB kuru 6 saat içinde bu değerin üzerine yazılır.</small>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="bo-error">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={close} className="bo-button">
            Vazgeç
          </button>
          <button className="bo-button primary" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
