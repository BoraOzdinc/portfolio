import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { WorkSnapshot } from "../../server/backoffice/work";
import { api, dateLabel } from "./api";
import { Field, Modal } from "./forms";

type Session = WorkSnapshot["sessions"][number];
type Kind = Session["kind"];
const PLANNED_EXIT = "18:00";
const kinds: Record<Kind, string> = {
  office: "Ofisten çıkış",
  remote: "Ofis dışı çalışma",
};
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
    [editing, setEditing] = useState<Session | null>(null),
    [removing, setRemoving] = useState<Session | null>(null);
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
      start: val("start"),
      end: val("end"),
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
    setEditing(w);
    form.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  return (
    <main className="bo-main">
      <header className="bo-page-header">
        <div>
          <p className="bo-breadcrumb">Kişisel</p>
          <h1>Mesai</h1>
          <p>Ofisten çıkış saatin ve ofis dışında çalıştığın saatler.</p>
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

      <section className="bo-section bo-work-form">
        <h2>{editing ? "Kaydı düzenle" : "Yeni kayıt"}</h2>
        <form
          ref={form}
          key={editing?.id ?? `new-${kind}`}
          onSubmit={submit}
          className="bo-form"
        >
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
          <div className="bo-form-grid bo-work-grid">
            <Field label="Tarih">
              <input
                type="date"
                name="date"
                required
                defaultValue={editing?.date ?? data.today}
              />
            </Field>
            <Field label={kind === "office" ? "Planlanan çıkış" : "Başlangıç"}>
              <input
                type="time"
                name="start"
                required
                defaultValue={
                  editing?.start ?? (kind === "office" ? PLANNED_EXIT : "")
                }
              />
            </Field>
            <Field label={kind === "office" ? "Çıktığın saat" : "Bitiş"}>
              <input
                type="time"
                name="end"
                required
                defaultValue={editing?.end}
              />
            </Field>
          </div>
          <Field label="Açıklama / neden">
            <input
              name="note"
              maxLength={4000}
              defaultValue={editing?.note}
              placeholder={
                kind === "office"
                  ? "Ör. sürüm çıkışı için kaldım"
                  : "Ör. canlı ortamda acil hata düzeltmesi"
              }
            />
          </Field>
          <small>
            {kind === "office"
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
              onClick={() => setMonth(shiftMonth(data.month, -1))}
            >
              <ChevronLeft size={16} />
            </button>
            <h2>{monthLabel(data.month)}</h2>
            <button
              className="bo-button"
              aria-label="Sonraki ay"
              onClick={() => setMonth(shiftMonth(data.month, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="bo-money-grid">
          <article>
            <span>Toplam ek çalışma</span>
            <strong>{duration(data.totals.all)}</strong>
            <p>{data.totals.days} gün</p>
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
        {data.sessions.length ? (
          <div className="bo-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tür</th>
                  <th>Saat</th>
                  <th>Süre</th>
                  <th>Açıklama</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {days.flatMap((day) =>
                  data.sessions
                    .filter((w) => w.date === day)
                    .map((w, i) => (
                      <tr key={w.id}>
                        <td>{i === 0 ? dateLabel(w.date) : ""}</td>
                        <td>{kinds[w.kind]}</td>
                        <td>
                          {w.start} → {w.end}
                        </td>
                        <td>{duration(w.minutes)}</td>
                        <td className="bo-work-note">{w.note || "—"}</td>
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
      {removing && (
        <Modal title="Kaydı sil" close={() => setRemoving(null)}>
          <p>
            {dateLabel(removing.date)} · {kinds[removing.kind]} {removing.start}
            –{removing.end} silinecek. Bu işlem geri alınamaz.
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
