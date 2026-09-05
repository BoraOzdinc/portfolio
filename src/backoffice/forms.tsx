import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { X } from "lucide-react";
import type { Snapshot } from "../../server/backoffice/router";
import { api, dateLabel } from "./api";

type Project = Snapshot["projects"][number];
type Resource = Snapshot["resources"][number];
type Plan = Snapshot["plans"][number];
type Monitor = Snapshot["monitors"][number];
export type Editor =
  | { kind: "project"; row?: Project }
  | { kind: "resource"; row?: Resource }
  | { kind: "plan"; resource?: Resource }
  | { kind: "planChange"; row: Plan }
  | { kind: "monitor"; row?: Monitor }
  | { kind: "renew"; row: Resource };

export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      className="bo-dialog"
      ref={ref}
      onCancel={close}
      aria-labelledby="dialog-title"
    >
      <header>
        <h2 id="dialog-title">{title}</h2>
        <button
          type="button"
          className="bo-icon"
          onClick={close}
          aria-label="Kapat"
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="bo-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Input({
  label,
  name,
  value,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string | number | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <Field label={label}>
      <input
        name={name}
        defaultValue={value ?? ""}
        required={required}
        type={type}
        maxLength={4000}
      />
    </Field>
  );
}
const types = {
  domain: "Domain",
  vps: "VPS",
  email: "E-posta",
  api: "API / SaaS",
  custom: "Diğer hizmet",
};
export function EditorDialog({
  editor,
  data,
  projectId,
  close,
  saved,
}: {
  editor: Editor;
  data: Snapshot;
  projectId?: string;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [type, setType] = useState(
    editor.kind === "resource" ? editor.row?.type || "domain" : "domain",
  );
  const [owner, setOwner] = useState(
    editor.kind === "resource"
      ? editor.row?.ownerProjectId || projectId || data.projects[0]?.id || ""
      : projectId || data.projects[0]?.id || "",
  );
  const [monitorProject, setMonitorProject] = useState(
    editor.kind === "monitor"
      ? editor.row?.projectId || projectId || data.projects[0]?.id || ""
      : "",
  );
  const title = {
    project: "Proje bilgileri",
    resource: "Hizmet bilgileri",
    plan: "Ödeme planı ekle",
    planChange: "Planı güncelle",
    monitor: "Sağlık kontrolü",
    renew: "Domain yenilemesini kaydet",
  }[editor.kind];
  const projects = (name: string, value: string, disabled = false) => (
    <Field label="Proje">
      <select name={name} defaultValue={value} required disabled={disabled}>
        {data.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.archived ? " (Arşiv)" : ""}
          </option>
        ))}
      </select>
    </Field>
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(event.currentTarget),
      val = (key: string) => String(fd.get(key) ?? "");
    try {
      if (editor.kind === "project")
        await api(
          `/projects${editor.row ? `/${editor.row.id}` : ""}`,
          editor.row ? "PATCH" : "POST",
          {
            name: val("name"),
            contact: val("contact"),
            description: val("description"),
            url: val("url"),
            portfolioSlug: val("portfolioSlug"),
          },
        );
      if (editor.kind === "resource")
        await api(
          `/resources${editor.row ? `/${editor.row.id}` : ""}`,
          editor.row ? "PATCH" : "POST",
          {
            name: val("name"),
            type,
            ownerProjectId: owner,
            sharedProjectIds: fd.getAll("sharedProjectIds").map(String),
            provider: val("provider"),
            panelUrl: val("panelUrl"),
            notes: val("notes"),
            domain: val("domain"),
            expiresOn: val("expiresOn") || null,
            autoRenew: fd.has("autoRenew"),
            hostname: val("hostname"),
            region: val("region"),
            capacity: val("capacity"),
            addresses: val("addresses")
              .split(/[\n,]/)
              .map((s) => s.trim())
              .filter(Boolean),
            customType: val("customType"),
          },
        );
      if (editor.kind === "plan")
        await api("/plans", "POST", {
          projectId: editor.resource?.ownerProjectId || val("projectId"),
          resourceId: editor.resource?.id || null,
          name: val("name"),
          direction: editor.resource ? "expense" : val("direction"),
          amount: Math.round(Number(val("amount")) * 100),
          currency: val("currency"),
          frequency: val("frequency"),
          firstDue: val("firstDue"),
        });
      if (editor.kind === "planChange")
        await api(`/plans/${editor.row.id}`, "PATCH", {
          amount: Math.round(Number(val("amount")) * 100),
          frequency: val("frequency"),
        });
      if (editor.kind === "monitor")
        await api(
          `/monitors${editor.row ? `/${editor.row.id}` : ""}`,
          editor.row ? "PATCH" : "POST",
          {
            projectId: monitorProject,
            resourceId: val("resourceId") || null,
            name: val("name"),
            url: editor.row?.url || val("url"),
            method: editor.row?.method || val("method"),
            statusMin: editor.row?.statusMin ?? Number(val("statusMin")),
            statusMax: editor.row?.statusMax ?? Number(val("statusMax")),
            active: editor.row?.active ?? true,
          },
        );
      if (editor.kind === "renew")
        await api(`/resources/${editor.row.id}/renew`, "POST", {
          expiresOn: val("expiresOn"),
        });
      await saved();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={title} close={close}>
      <form onSubmit={submit} className="bo-form">
        {editor.kind === "project" && (
          <>
            <Input
              label="Proje adı"
              name="name"
              value={editor.row?.name}
              required
            />
            <Input
              label="Müşteri / ilgili kişi"
              name="contact"
              value={editor.row?.contact}
            />
            <Input
              label="Site bağlantısı"
              name="url"
              type="url"
              value={editor.row?.url}
            />
            <Input
              label="Portfolio slug (isteğe bağlı)"
              name="portfolioSlug"
              value={editor.row?.portfolioSlug}
            />
            <Field label="Açıklama">
              <textarea
                name="description"
                defaultValue={editor.row?.description}
                rows={3}
              />
            </Field>
          </>
        )}
        {editor.kind === "resource" && (
          <>
            <div className="bo-form-grid">
              <Input
                label="Hizmet adı"
                name="name"
                value={editor.row?.name}
                required
              />
              <Field label="Tür">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Resource["type"])}
                >
                  {Object.entries(types).map(([v, label]) => (
                    <option value={v} key={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Masraf sahibi proje">
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <fieldset>
              <legend>Bu hizmeti kullanan diğer projeler</legend>
              {data.projects
                .filter((p) => p.id !== owner)
                .map((p) => (
                  <label key={p.id} className="bo-check">
                    <input
                      type="checkbox"
                      name="sharedProjectIds"
                      value={p.id}
                      defaultChecked={editor.row?.sharedProjectIds.includes(
                        p.id,
                      )}
                    />
                    {p.name}
                  </label>
                ))}
              <small>Maliyet yalnızca masraf sahibi projeye yazılır.</small>
            </fieldset>
            <div className="bo-form-grid">
              <Input
                label="Sağlayıcı"
                name="provider"
                value={editor.row?.provider}
              />
              <Input
                label="Yönetim paneli"
                name="panelUrl"
                type="url"
                value={editor.row?.panelUrl}
              />
            </div>
            {type === "domain" && (
              <>
                <Input
                  label="Alan adı"
                  name="domain"
                  value={editor.row?.domain}
                />
                <Input
                  label="Kayıt bitiş tarihi"
                  name="expiresOn"
                  type="date"
                  value={editor.row?.expiresOn}
                />
                <label className="bo-check">
                  <input
                    name="autoRenew"
                    type="checkbox"
                    defaultChecked={editor.row?.autoRenew}
                  />
                  Sağlayıcıda otomatik yenileme açık
                </label>
              </>
            )}
            {type === "vps" && (
              <>
                <Input
                  label="Hostname / IP"
                  name="hostname"
                  value={editor.row?.hostname}
                />
                <div className="bo-form-grid">
                  <Input
                    label="Bölge"
                    name="region"
                    value={editor.row?.region}
                  />
                  <Input
                    label="Paket / kapasite"
                    name="capacity"
                    value={editor.row?.capacity}
                  />
                </div>
              </>
            )}
            {type === "email" && (
              <>
                <Input
                  label="Paket"
                  name="capacity"
                  value={editor.row?.capacity}
                />
                <Field label="E-posta adresleri (her satıra bir adres)">
                  <textarea
                    name="addresses"
                    defaultValue={editor.row?.addresses.join("\n")}
                    rows={4}
                  />
                </Field>
                <small>
                  Bu paketin altındaki adresler tek ödeme planı kullanır.
                </small>
              </>
            )}
            {type === "custom" && (
              <Input
                label="Özel hizmet türü"
                name="customType"
                value={editor.row?.customType}
              />
            )}
            <Field label="Notlar">
              <textarea
                name="notes"
                defaultValue={editor.row?.notes}
                rows={3}
              />
            </Field>
            <small>
              Parola veya API anahtarı kaydetmeyin. Ödeme planını hizmeti
              kaydettikten sonra ekleyebilirsiniz.
            </small>
          </>
        )}
        {(editor.kind === "plan" || editor.kind === "planChange") && (
          <>
            {editor.kind === "plan" && (
              <>
                {projects(
                  "projectId",
                  editor.resource?.ownerProjectId ||
                    projectId ||
                    data.projects[0]?.id ||
                    "",
                  !!editor.resource,
                )}
                <Input
                  label="Açıklama"
                  name="name"
                  value={editor.resource?.name}
                  required
                />
                {!editor.resource && (
                  <Field label="Hareket türü">
                    <select name="direction">
                      <option value="expense">Gider</option>
                      <option value="income">Müşteri tahsilatı</option>
                    </select>
                  </Field>
                )}
              </>
            )}
            {editor.kind === "planChange" && (
              <p>
                Değişiklik{" "}
                <strong>
                  {dateLabel(editor.row.pendingFrom || editor.row.nextDue)}
                </strong>{" "}
                döneminden itibaren uygulanır. Oluşmuş hareketler korunur.
              </p>
            )}
            <div className="bo-form-grid">
              <Field label="Dönem tutarı">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="1000000000"
                  required
                  name="amount"
                  defaultValue={
                    editor.kind === "planChange"
                      ? (editor.row.pendingAmount ?? editor.row.amount) / 100
                      : undefined
                  }
                />
              </Field>
              {editor.kind === "plan" && (
                <Field label="Para birimi">
                  <select name="currency">
                    <option>TRY</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </Field>
              )}
            </div>
            <Field label="Ödeme sıklığı">
              <select
                name="frequency"
                defaultValue={
                  editor.kind === "planChange"
                    ? editor.row.pendingFrequency || editor.row.frequency
                    : "monthly"
                }
              >
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
                <option value="once">Tek seferlik</option>
              </select>
            </Field>
            {editor.kind === "plan" && (
              <Input
                label="İlk vade"
                name="firstDue"
                type="date"
                value={data.today}
                required
              />
            )}
          </>
        )}
        {editor.kind === "monitor" && (
          <>
            <Field label="Proje">
              <select
                value={monitorProject}
                onChange={(e) => setMonitorProject(e.target.value)}
              >
                {data.projects.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Input
              label="Kontrol adı"
              name="name"
              value={editor.row?.name}
              required
            />
            <Field label="İlgili hizmet (isteğe bağlı)">
              <select
                name="resourceId"
                defaultValue={editor.row?.resourceId || ""}
              >
                <option value="">Doğrudan projeye bağlı</option>
                {data.resources
                  .filter(
                    (r) =>
                      r.ownerProjectId === monitorProject ||
                      r.sharedProjectIds.includes(monitorProject),
                  )
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </Field>
            {editor.row ? (
              <p>
                Hedef: {editor.row.url}. Hedefi değiştirmek için yeni kontrol
                ekleyin.
              </p>
            ) : (
              <>
                <Input
                  label="HTTP/HTTPS adresi"
                  name="url"
                  type="url"
                  required
                />
                <Field label="İstek yöntemi">
                  <select name="method">
                    <option>GET</option>
                    <option>HEAD</option>
                  </select>
                </Field>
                <div className="bo-form-grid">
                  <Input
                    label="En düşük başarı kodu"
                    name="statusMin"
                    type="number"
                    value={200}
                    required
                  />
                  <Input
                    label="En yüksek başarı kodu"
                    name="statusMax"
                    type="number"
                    value={399}
                    required
                  />
                </div>
              </>
            )}
            <small>
              15 dakikada bir kontrol edilir. İki ardışık hata ile kesinti
              bildirimi yaklaşık 15–30 dakikada oluşur.
            </small>
          </>
        )}
        {editor.kind === "renew" && (
          <>
            <p>
              {editor.row.domain || editor.row.name} · Mevcut bitiş:{" "}
              {dateLabel(editor.row.expiresOn)}
            </p>
            <Input
              label="Yeni kayıt bitişi"
              name="expiresOn"
              type="date"
              required
            />
            <small>Bu işlem ödeme durumunu değiştirmez.</small>
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
