import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { WorkSnapshot } from "../../server/backoffice/work";
import { api, dateLabel, money } from "./api";
import { Field, Modal } from "./forms";

type Session = WorkSnapshot["sessions"][number];
type Kind = Session["kind"];
type Mode = "range" | "duration";
const PLANNED_EXIT = "18:00";
const kinds: Record<Kind, string> = {
  office: "Ofisten çıkış",
  remote: "Ofis dışı çalışma",
};
const tl = (amount: number) => money(amount, "TRY");
const duration = (m: number) =>
  m ? `${Math.floor(m / 60)} sa ${String(m % 60).padStart(2, "0")} dk` : "—";
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
const shiftMonth = (month: string, n: number) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};

export function Work() {
  const [month, setMonth] = useState<string | null>(null),
    [data, setData] = useState<WorkSnapshot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [kind, setKind] = useState<Kind>("remote"),
    [mode, setMode] = useState<Mode>("range"),
    [editing, setEditing] = useState<Session | null>(null),
    [removing, setRemoving] = useState<Session | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [paying, setPaying] = useState(false),
    [salaryOpen, setSalaryOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const latest = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++latest.current;
    try {
      const result = await api<WorkSnapshot>(
        `/work${month ? `?month=${month}` : ""}`,
      );
      if (requestId === latest.current) setData(result);
    } catch (e) {
      if (requestId === latest.current)
        setError(e instanceof Error ? e.message : "Kayıtlar alınamadı.");
    }
  }, [month]);
  useEffect(() => {
    const timer = setTimeout(() => void reload(), 0);
    return () => clearTimeout(timer);
  }, [reload]);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await reload();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget),
      val = (key: string) => String(fd.get(key) ?? "").trim();
    const body = {
      date: val("date"),
      kind,
      start: mode === "range" ? val("start") : null,
      end: mode === "range" ? val("end") : null,
      duration:
        mode === "duration" ? Math.round(Number(val("hours")) * 60) : null,
      note: val("note"),
    };
    const ok = await run(() =>
      editing
        ? api(`/work/${editing.id}`, "PATCH", body)
        : api("/work", "POST", body),
    );
    if (ok) {
      setEditing(null);
      form.current?.reset();
    }
  };
  const edit = (w: Session) => {
    setKind(w.kind);
    setMode(w.duration === null ? "range" : "duration");
    setEditing(w);
    form.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const changeMonth = (n: number) => {
    setSelected([]);
    setMonth(shiftMonth(data!.month, n));
  };

  if (!data)
    return (
      <main className="bo-main">
        <p
          role={error ? "alert" : "status"}
          className={error ? "bo-error" : ""}
        >
          {error || "Mesai kayıtları yükleniyor…"}
        </p>
      </main>
    );
  const days = [...new Set(data.sessions.map((w) => w.date))];
  const allSelected =
    data.sessions.length > 0 && selected.length === data.sessions.length;
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  return (
    <main className="bo-main">
      <header className="bo-page-header">
        <div>
          <p className="bo-breadcrumb">Kişisel</p>
          <h1>Mesai</h1>
          <p>Ofisten geç çıkışların ve ofis dışında çalıştığın saatler.</p>
        </div>
        <div className="bo-actions">
          <a
            className="bo-button"
            href={`/api/backoffice/work/export?month=${data.month}`}
            download
          >
            <Download size={16} /> Excel’e aktar
          </a>
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

      <section className="bo-section bo-unpaid">
        {data.salary === null ? (
          <p>
            Ödenmemiş saatlerin kaç TL ettiğini görmek için net maaşını gir.{" "}
            <button className="bo-link" onClick={() => setSalaryOpen(true)}>
              Net maaşı gir
            </button>
          </p>
        ) : (
          <>
            <div>
              <span>Henüz ödenmemiş</span>
              <strong>{duration(data.unpaid.minutes)}</strong>
              <p>
                ≈ {tl(data.unpaid.amount ?? 0)} net beklenen fazla mesai ücreti
              </p>
            </div>
            <small>
              Saatlik {tl(data.hourly ?? 0)} = net maaş {tl(data.salary)} ÷ 225
              × 1,5 · BES kesintisi (~brütün %3’ü) hariç.{" "}
              <button className="bo-link" onClick={() => setSalaryOpen(true)}>
                Değiştir
              </button>
            </small>
          </>
        )}
      </section>

      <section className="bo-section bo-work-form">
        <h2>{editing ? "Kaydı düzenle" : "Yeni kayıt"}</h2>
        <form
          ref={form}
          key={editing?.id ?? `new-${kind}-${mode}`}
          onSubmit={submit}
          className="bo-form"
        >
          <div className="bo-work-toggles">
            <div className="bo-segmented" role="group" aria-label="Kayıt türü">
              {(Object.keys(kinds) as Kind[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                >
                  {kinds[k]}
                </button>
              ))}
            </div>
            <div className="bo-segmented" role="group" aria-label="Giriş şekli">
              <button
                type="button"
                aria-pressed={mode === "range"}
                onClick={() => setMode("range")}
              >
                Saat aralığı
              </button>
              <button
                type="button"
                aria-pressed={mode === "duration"}
                onClick={() => setMode("duration")}
              >
                Sadece süre
              </button>
            </div>
          </div>
          <div className="bo-form-grid bo-work-grid">
            <Field label="Tarih">
              <input
                type="date"
                name="date"
                required
                defaultValue={editing?.date ?? data.today}
              />
            </Field>
            {mode === "range" ? (
              <>
                <Field
                  label={kind === "office" ? "Planlanan çıkış" : "Başlangıç"}
                >
                  <input
                    type="time"
                    name="start"
                    required
                    defaultValue={
                      editing?.start ??
                      (kind === "office" ? PLANNED_EXIT : undefined)
                    }
                  />
                </Field>
                <Field label={kind === "office" ? "Çıktığın saat" : "Bitiş"}>
                  <input
                    type="time"
                    name="end"
                    required
                    defaultValue={editing?.end ?? undefined}
                  />
                </Field>
              </>
            ) : (
              <Field label="Süre (saat)">
                <input
                  type="number"
                  name="hours"
                  min="0.25"
                  max="24"
                  step="0.25"
                  required
                  defaultValue={
                    editing?.duration ? editing.duration / 60 : undefined
                  }
                />
              </Field>
            )}
          </div>
          <Field label="Açıklama / neden">
            <input
              name="note"
              maxLength={4000}
              defaultValue={editing?.note}
              placeholder={
                kind === "office"
                  ? "Ör. sürüm çıkışı için kaldım"
                  : "Ör. SAP upgrade sonrası sorunların çözümü için evden çalışma"
              }
            />
          </Field>
          <small>
            {mode === "duration"
              ? "1,5 saat için 1.5 yaz. Yolculuk gibi saati belirsiz işler için uygun."
              : kind === "office"
                ? "Planlanan saatten sonraki süre fazla mesai sayılır; erken çıkış 0 sayılır."
                : "Gece yarısını geçen çalışmalar doğru hesaplanır (ör. 23:30–01:00 = 1,5 saat)."}
          </small>
          <footer>
            {editing && (
              <button
                type="button"
                className="bo-button"
                onClick={() => setEditing(null)}
              >
                Vazgeç
              </button>
            )}
            <button className="bo-button primary" disabled={busy}>
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </footer>
        </form>
      </section>

      <section className="bo-section">
        <div className="bo-section-heading">
          <div className="bo-actions">
            <button
              className="bo-button"
              aria-label="Önceki ay"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={16} />
            </button>
            <h2>{monthLabel(data.month)}</h2>
            <button
              className="bo-button"
              aria-label="Sonraki ay"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="bo-money-grid">
          <article>
            <span>Toplam ek çalışma</span>
            <strong>{duration(data.totals.all)}</strong>
            <p>
              {data.totals.days} gün
              {data.totals.amount !== null &&
                ` · ≈ ${tl(data.totals.amount)} net`}
            </p>
          </article>
          <article>
            <span>Ofiste fazla mesai</span>
            <strong>{duration(data.totals.office)}</strong>
          </article>
          <article>
            <span>Ofis dışı çalışma</span>
            <strong>{duration(data.totals.remote)}</strong>
          </article>
        </div>
        {selected.length > 0 && (
          <div className="bo-notice bo-bulk" role="region" aria-label="Seçim">
            <span>{selected.length} kayıt seçildi</span>
            <button
              className="bo-button primary"
              onClick={() => setPaying(true)}
            >
              Ödendi işaretle
            </button>
            <button
              className="bo-button"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  api("/work/pay", "POST", { ids: selected, paidPeriod: null }),
                ).then((ok) => ok && setSelected([]))
              }
            >
              Ödenmedi yap
            </button>
          </div>
        )}
        {data.sessions.length ? (
          <div className="bo-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Tümünü seç"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected ? [] : data.sessions.map((w) => w.id),
                        )
                      }
                    />
                  </th>
                  <th>Tarih</th>
                  <th>Tür</th>
                  <th>Süre</th>
                  <th>Açıklama</th>
                  <th>Ödeme</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {days.flatMap((day) =>
                  data.sessions
                    .filter((w) => w.date === day)
                    .map((w, i) => (
                      <tr key={w.id}>
                        <td className="bo-check-cell">
                          <input
                            type="checkbox"
                            aria-label={`${dateLabel(w.date)} kaydını seç`}
                            checked={selected.includes(w.id)}
                            onChange={() => toggle(w.id)}
                          />
                        </td>
                        <td>{i === 0 ? dateLabel(w.date) : ""}</td>
                        <td>{kinds[w.kind]}</td>
                        <td>
                          {duration(w.minutes)}
                          {w.start && (
                            <small>
                              {w.start} → {w.end}
                            </small>
                          )}
                        </td>
                        <td className="bo-work-note">{w.note || "—"}</td>
                        <td>
                          {w.paidPeriod ? (
                            <span className="bo-badge paid">
                              {monthLabel(w.paidPeriod)} bordrosu
                            </span>
                          ) : (
                            <span className="bo-badge pending">Bekliyor</span>
                          )}
                        </td>
                        <td>
                          <div className="bo-actions">
                            <button className="bo-link" onClick={() => edit(w)}>
                              Düzenle
                            </button>
                            <button
                              className="bo-link danger"
                              onClick={() => setRemoving(w)}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bo-empty">Bu ay kayıt yok.</div>
        )}
      </section>

      {paying && (
        <Modal title="Ödendi işaretle" close={() => setPaying(false)}>
          <form
            className="bo-form"
            onSubmit={(e) => {
              e.preventDefault();
              const paidPeriod = String(
                new FormData(e.currentTarget).get("period"),
              );
              void run(() =>
                api("/work/pay", "POST", { ids: selected, paidPeriod }),
              ).then((ok) => {
                if (!ok) return;
                setSelected([]);
                setPaying(false);
              });
            }}
          >
            <p>
              {selected.length} kayıt, bu saatlerin göründüğü bordronun dönemine
              işlenecek.
            </p>
            <Field label="Bordro dönemi">
              <input
                type="month"
                name="period"
                required
                defaultValue={data.today.slice(0, 7)}
              />
            </Field>
            <footer>
              <button
                type="button"
                className="bo-button"
                onClick={() => setPaying(false)}
              >
                Vazgeç
              </button>
              <button className="bo-button primary" disabled={busy}>
                Kaydet
              </button>
            </footer>
          </form>
        </Modal>
      )}
      {salaryOpen && (
        <Modal title="Net maaş" close={() => setSalaryOpen(false)}>
          <form
            className="bo-form"
            onSubmit={(e) => {
              e.preventDefault();
              const value = Number(new FormData(e.currentTarget).get("salary"));
              void run(() =>
                api("/work/salary", "PUT", {
                  netSalary: Math.round(value * 100),
                }),
              ).then((ok) => ok && setSalaryOpen(false));
            }}
          >
            <Field label="Sözleşmedeki aylık net maaş (TL)">
              <input
                type="number"
                name="salary"
                min="1"
                step="0.01"
                required
                defaultValue={data.salary ? data.salary / 100 : undefined}
              />
            </Field>
            <small>
              Fazla mesai saat ücreti bordrodaki gibi net maaş ÷ 225 × 1,5
              olarak hesaplanır.
            </small>
            <footer>
              <button
                type="button"
                className="bo-button"
                onClick={() => setSalaryOpen(false)}
              >
                Vazgeç
              </button>
              <button className="bo-button primary" disabled={busy}>
                Kaydet
              </button>
            </footer>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Kaydı sil" close={() => setRemoving(null)}>
          <p>
            {dateLabel(removing.date)} · {kinds[removing.kind]} ·{" "}
            {duration(removing.minutes)} silinecek. Bu işlem geri alınamaz.
          </p>
          <footer>
            <button className="bo-button" onClick={() => setRemoving(null)}>
              Vazgeç
            </button>
            <button
              className="bo-button primary"
              disabled={busy}
              onClick={() =>
                void run(() => api(`/work/${removing.id}`, "DELETE")).then(
                  (ok) => ok && setRemoving(null),
                )
              }
            >
              Sil
            </button>
          </footer>
        </Modal>
      )}
    </main>
  );
}
