import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createAuthClient } from "better-auth/react";
import {
  Activity,
  ArrowLeft,
  Bell,
  Boxes,
  CircleDollarSign,
  FolderOpen,
  Github,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { Snapshot } from "../../server/backoffice/router";
import type { checks } from "../../server/backoffice/schema";
import { ApiError, api, money, dateLabel, timeLabel } from "./api";
import { EditorDialog, Modal, type Editor } from "./forms";
import "./backoffice.css";

const auth = createAuthClient();
const statusLabels: Record<string, string> = {
  up: "Çalışıyor",
  down: "Kesinti",
  stale: "Kontrol gecikti",
  unknown: "Henüz ölçülmedi",
  warning: "İlk hata",
  paused: "Duraklatıldı",
  pending: "Bekliyor",
  paid: "Tamamlandı",
  cancelled: "İptal",
  overdue: "Gecikmiş",
};
const periods = { once: "Tek seferlik", monthly: "Aylık", yearly: "Yıllık" };
const types = {
  domain: "Domain",
  vps: "VPS",
  email: "E-posta",
  api: "API / SaaS",
  custom: "Diğer hizmet",
};
type Tab = "overview" | "resources" | "finance" | "monitors" | "alerts";
const tabs = [
  { id: "overview", label: "Genel bakış", icon: LayoutDashboard },
  { id: "resources", label: "Hizmetler", icon: Boxes },
  { id: "finance", label: "Finans", icon: CircleDollarSign },
  { id: "monitors", label: "İzleme", icon: Activity },
  { id: "alerts", label: "Uyarılar", icon: Bell },
] as const;
function Badge({ status }: { status: string }) {
  return (
    <span className={`bo-badge ${status}`}>
      {statusLabels[status] || status}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="bo-empty">{text}</div>;
}

export default function Backoffice() {
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") || undefined;
  const tab: Tab =
    tabs.find((t) => t.id === params.get("tab"))?.id || "overview";
  const [data, setData] = useState<Snapshot | null>(null),
    [error, setError] = useState(""),
    [authStatus, setAuthStatus] = useState(0);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [editor, setEditor] = useState<Editor | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => Promise<void>;
  } | null>(null);
  const [history, setHistory] = useState<{
    name: string;
    rows: (typeof checks.$inferSelect)[];
  } | null>(null);
  const [projectSearch, setProjectSearch] = useState(""),
    [showArchive, setShowArchive] = useState(false),
    [resourceSearch, setResourceSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all"),
    [paymentSearch, setPaymentSearch] = useState(""),
    [page, setPage] = useState(1);
  const latestRequest = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const query = new URLSearchParams({
      page: String(page),
      status: paymentStatus,
      q: paymentSearch,
    });
    if (projectId) query.set("projectId", projectId);
    try {
      const result = await api<Snapshot>(`/snapshot?${query}`);
      if (requestId !== latestRequest.current) return;
      setData(result);
      setAuthStatus(0);
    } catch (e) {
      if (requestId !== latestRequest.current) return;
      if (e instanceof ApiError && [401, 403, 503].includes(e.status)) {
        setAuthStatus(e.status);
        setData(null);
      }
      setError(e instanceof Error ? e.message : "Veriler alınamadı.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [projectId, page, paymentStatus, paymentSearch]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) void reload();
    }, 0);
    const interval = setInterval(() => void reload(), 30_000);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [reload]);
  const navigate = (id: string | undefined, selected: Tab = tab) => {
    setPage(1);
    setParams({ ...(id ? { project: id } : {}), tab: selected });
  };
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await reload();
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  };
  const ask = (
    title: string,
    body: string,
    path: string,
    method = "POST",
    payload?: unknown,
  ) =>
    setConfirm({
      title,
      body,
      action: async () => {
        await api(path, method, payload);
      },
    });
  const signIn = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await auth.signIn.social({
        provider: "github",
        callbackURL: `${window.location.origin}/backoffice`,
      });
      if (result.error)
        setError(result.error.message || "Giriş başlatılamadı.");
    } catch {
      setError("GitHub bağlantısı kurulamadı.");
    } finally {
      setBusy(false);
    }
  };
  if (!data)
    return (
      <div className="bo bo-entry">
        <Link to="/" className="bo-back">
          <ArrowLeft size={16} /> Portfolio
        </Link>
        <section>
          <span className="bo-mark">
            <FolderOpen size={30} />
          </span>
          <h1>Projelerin çalışma masası.</h1>
          <p>Hizmetlerin, ödemelerin ve teknik sağlığın tek yerde.</p>
          {loading ? (
            <p role="status">Yönetim alanı yükleniyor…</p>
          ) : (
            <>
              {error && (
                <p className="bo-error" role="alert">
                  {error}
                </p>
              )}
              {authStatus === 401 && (
                <button
                  className="bo-button primary"
                  onClick={() => void signIn()}
                  disabled={busy}
                >
                  <Github size={18} /> GitHub ile giriş yap
                </button>
              )}
              {authStatus === 403 && (
                <button
                  className="bo-button"
                  onClick={() => void auth.signOut().then(() => reload())}
                >
                  Farklı hesapla giriş yap
                </button>
              )}
              <button className="bo-button" onClick={() => void reload()}>
                <RefreshCw size={16} /> Yeniden kontrol et
              </button>
            </>
          )}
        </section>
      </div>
    );
  const project = data.projects.find((p) => p.id === projectId);
  const projectName = (id: string) =>
    data.projects.find((p) => p.id === id)?.name || "Proje";
  const attention = data.monitors.filter((m) =>
    ["down", "stale", "warning"].includes(m.state),
  );
  const dueDomains = data.resources.filter(
    (r) =>
      r.active &&
      r.type === "domain" &&
      r.expiresOn &&
      r.expiresOn <=
        new Date(Date.parse(data.today) + 30 * 86400000)
          .toISOString()
          .slice(0, 10),
  );
  const viewResources = data.resources.filter((r) =>
    `${r.name} ${r.provider} ${r.domain}`
      .toLocaleLowerCase("tr")
      .includes(resourceSearch.toLocaleLowerCase("tr")),
  );
  const openEditor = (value: Editor) => {
    setError("");
    setEditor(value);
  };
  return (
    <div className="bo">
      <aside className="bo-sidebar">
        <Link to="/" className="bo-brand">
          ozdinc.dev<span>Backoffice</span>
        </Link>
        <button
          className={`bo-nav ${!projectId ? "selected" : ""}`}
          onClick={() => navigate(undefined, "overview")}
        >
          <LayoutDashboard size={18} /> Tüm projeler
        </button>
        <div className="bo-sidebar-title">
          <span>Projeler</span>
          <button
            className="bo-icon"
            aria-label="Proje ekle"
            onClick={() => openEditor({ kind: "project" })}
          >
            <Plus size={17} />
          </button>
        </div>
        <input
          className="bo-search"
          aria-label="Proje ara"
          placeholder="Proje ara…"
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
        />
        <nav aria-label="Projeler">
          {data.projects
            .filter(
              (p) =>
                (showArchive || !p.archived) &&
                p.name
                  .toLocaleLowerCase("tr")
                  .includes(projectSearch.toLocaleLowerCase("tr")),
            )
            .map((p) => (
              <button
                key={p.id}
                className={`bo-nav ${projectId === p.id ? "selected" : ""}`}
                onClick={() => navigate(p.id, "overview")}
              >
                <span className="bo-project-initial">{p.name.slice(0, 1)}</span>
                <span>
                  {p.name}
                  {p.archived && <small>Arşiv</small>}
                </span>
              </button>
            ))}
        </nav>
        <label className="bo-check bo-archive">
          <input
            type="checkbox"
            checked={showArchive}
            onChange={(e) => setShowArchive(e.target.checked)}
          />
          Arşivlenenleri göster
        </label>
        <div className="bo-sidebar-footer">
          <span className="bo-muted">Kişisel yönetim alanı</span>
          <button
            className="bo-nav"
            onClick={() =>
              void act(async () => {
                await auth.signOut();
                setData(null);
              })
            }
          >
            <LogOut size={17} /> Çıkış yap
          </button>
        </div>
      </aside>
      <main className="bo-main">
        <header className="bo-page-header">
          <div>
            <p className="bo-breadcrumb">
              {project ? "Projeler / " + project.name : "Proje operasyonları"}
            </p>
            <h1>{project?.name || "Çalışma masası"}</h1>
            <p>
              {project
                ? project.contact ||
                  project.description ||
                  "Bu projenin hizmetleri ve operasyonları."
                : "Yaklaşan vadeler, hizmetler ve dikkat isteyen işler."}
            </p>
          </div>
          <div className="bo-actions">
            <button
              className="bo-button"
              disabled={busy}
              aria-label="Yenile"
              onClick={() => void reload()}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="bo-button primary"
              onClick={() =>
                openEditor(project ? { kind: "resource" } : { kind: "project" })
              }
            >
              <Plus size={17} /> {project ? "Hizmet ekle" : "Proje ekle"}
            </button>
          </div>
        </header>
        {project?.archived && (
          <p className="bo-notice">
            Bu proje arşivlenmiş. Ödeme planları ve kontroller ayrı olarak
            durdurulana kadar devam eder.
          </p>
        )}
        {projectId && !project && <p className="bo-error">Proje bulunamadı.</p>}
        {error && !authStatus && (
          <div role="alert" className="bo-error">
            {error}
            <button className="bo-link" onClick={() => setError("")}>
              Kapat
            </button>
          </div>
        )}
        <nav className="bo-tabs" aria-label="Yönetim bölümleri">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "selected" : ""}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => navigate(projectId, t.id)}
            >
              <t.icon size={17} />
              {t.label}
              {t.id === "alerts" &&
                data.notifications.some((n) => !n.readAt) && (
                  <span className="bo-dot" />
                )}
            </button>
          ))}
        </nav>
        {tab === "overview" && (
          <>
            <section className="bo-overview-top">
              <div>
                <h2>
                  {attention.length
                    ? `${attention.length} kontrol dikkat istiyor`
                    : "Teknik durum"}
                </h2>
                <p>
                  {data.monitors.length
                    ? `${data.monitors.filter((m) => m.state === "up").length} / ${data.monitors.length} kontrol güncel ve başarılı.`
                    : "Henüz site veya API kontrolü eklenmedi."}
                </p>
                <button
                  className="bo-link"
                  onClick={() => navigate(projectId, "monitors")}
                >
                  Kontrolleri aç
                </button>
              </div>
              <div>
                <h2>Yaklaşan domainler</h2>
                <p>
                  {dueDomains.length
                    ? `${dueDomains.length} domain için yenileme zamanı yaklaşıyor veya geçmiş.`
                    : "Önümüzdeki 30 günde bekleyen domain yenilemesi yok."}
                </p>
                <button
                  className="bo-link"
                  onClick={() => navigate(projectId, "resources")}
                >
                  Hizmetleri aç
                </button>
              </div>
            </section>
            <section className="bo-section">
              <div className="bo-section-heading">
                <h2>İşletme maliyeti</h2>
                <span>Aktif aboneliklerin eşdeğeri</span>
              </div>
              <div className="bo-money-grid">
                {data.finance.map((f) => (
                  <article key={f.currency}>
                    <span>{f.currency}</span>
                    <strong>
                      {money(f.monthly, f.currency)}
                      <small> / ay</small>
                    </strong>
                    <p>{money(f.yearly, f.currency)} / yıl</p>
                    <dl>
                      <dt>30 günde ödenecek</dt>
                      <dd>{money(f.upcomingExpense, f.currency)}</dd>
                      <dt>Gecikmiş gider</dt>
                      <dd className={f.overdueExpense ? "bo-danger" : ""}>
                        {money(f.overdueExpense, f.currency)}
                      </dd>
                      <dt>Beklenen tahsilat</dt>
                      <dd>{money(f.receivable, f.currency)}</dd>
                    </dl>
                  </article>
                ))}
              </div>
              <p className="bo-muted">
                Aylık eşdeğer bütçe içindir; ödeme vadelerini değiştirmez. Ortak
                hizmet masrafı yalnız sahibine yazılır.
              </p>
            </section>
            <div className="bo-columns">
              <section className="bo-section">
                <h2>Yenileme takvimi</h2>
                {dueDomains.length ? (
                  dueDomains.map((r) => (
                    <div className="bo-list-row" key={r.id}>
                      <div>
                        <strong>{r.domain || r.name}</strong>
                        <small>{projectName(r.ownerProjectId)}</small>
                      </div>
                      <div>
                        <span>{dateLabel(r.expiresOn)}</span>
                        <button
                          className="bo-link"
                          onClick={() => openEditor({ kind: "renew", row: r })}
                        >
                          Yenilendi
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty text="Yaklaşan domain yenilemesi yok." />
                )}
              </section>
              <section className="bo-section">
                <h2>Son uyarılar</h2>
                {data.notifications.length ? (
                  data.notifications.slice(0, 5).map((n) => (
                    <div className="bo-list-row" key={n.id}>
                      <div>
                        <strong>{n.title}</strong>
                        <small>{n.body}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty text="Yeni uyarılar burada görünecek." />
                )}
              </section>
            </div>
            <section className="bo-section">
              <div className="bo-section-heading">
                <h2>Yaklaşan ve gecikmiş hareketler</h2>
                <button
                  className="bo-link"
                  onClick={() => navigate(projectId, "finance")}
                >
                  Tüm hareketler
                </button>
              </div>
              {data.upcoming.length ? (
                data.upcoming.map((p) => (
                  <div className="bo-list-row" key={p.id}>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {projectName(p.projectId)} ·{" "}
                        {p.direction === "expense" ? "Ödeme" : "Tahsilat"}
                      </small>
                    </div>
                    <span>{money(p.amount, p.currency)}</span>
                    <div>
                      <span>{dateLabel(p.dueOn)}</span>
                      {p.dueOn < data.today && <Badge status="overdue" />}
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="Önümüzdeki 30 günde bekleyen hareket yok." />
              )}
            </section>
            {project && (
              <section className="bo-section">
                <h2>Proje bilgileri</h2>
                <p>{project.description || "Açıklama eklenmedi."}</p>
                <div className="bo-actions">
                  {project.url && (
                    <a
                      className="bo-button"
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Siteyi aç
                    </a>
                  )}
                  <button
                    className="bo-button"
                    onClick={() =>
                      openEditor({ kind: "project", row: project })
                    }
                  >
                    Düzenle
                  </button>
                  <button
                    className="bo-button"
                    onClick={() =>
                      ask(
                        project.archived
                          ? "Projeyi geri getir"
                          : "Projeyi arşivle",
                        "Bu işlem ödeme planlarını ve kontrolleri durdurmaz. Onları ilgili sekmeden yönetebilirsiniz.",
                        `/projects/${project.id}`,
                        "PATCH",
                        { archived: !project.archived },
                      )
                    }
                  >
                    {project.archived ? "Arşivden çıkar" : "Arşivle"}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
        {tab === "resources" && (
          <section className="bo-section">
            <div className="bo-section-heading">
              <h2>
                Hizmet envanteri <span>{viewResources.length}</span>
              </h2>
              <button
                className="bo-button primary"
                disabled={!data.projects.length}
                onClick={() => openEditor({ kind: "resource" })}
              >
                <Plus size={16} /> Hizmet ekle
              </button>
            </div>
            <input
              className="bo-search"
              placeholder="Hizmet, domain veya sağlayıcı ara…"
              aria-label="Hizmet ara"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
            />
            {!viewResources.length && (
              <Empty text="Önce bir proje, ardından domain, VPS veya e-posta hizmeti ekleyin." />
            )}
            <div className="bo-resource-list">
              {viewResources.map((r) => {
                const plan = data.plans.find((p) => p.resourceId === r.id);
                const shared = projectId && r.ownerProjectId !== projectId;
                return (
                  <article
                    key={r.id}
                    className={`bo-resource ${!r.active ? "inactive" : ""}`}
                  >
                    <div className="bo-resource-title">
                      <span className="bo-type">{types[r.type]}</span>
                      <h3>{r.name}</h3>
                      {shared && <span className="bo-badge">Ortak hizmet</span>}
                      {!r.active && <Badge status="cancelled" />}
                    </div>
                    <p>
                      {r.provider || "Sağlayıcı belirtilmedi"} · Masraf sahibi:{" "}
                      {projectName(r.ownerProjectId)}
                    </p>
                    <div className="bo-resource-details">
                      {r.domain && (
                        <span>
                          {r.domain} · {dateLabel(r.expiresOn)}
                          {r.autoRenew ? " · Otomatik yenileme açık" : ""}
                        </span>
                      )}
                      {r.hostname && (
                        <span>
                          {r.hostname} {r.region} {r.capacity}
                        </span>
                      )}
                      {r.type === "email" && (
                        <span>
                          {r.capacity} ·{" "}
                          {r.addresses.join(", ") || "Hesap eklenmedi"}
                        </span>
                      )}
                      {r.customType && <span>{r.customType}</span>}
                      {r.notes && <p>{r.notes}</p>}
                    </div>
                    <div className="bo-resource-bottom">
                      <div>
                        {shared ? (
                          <small>
                            Maliyet {projectName(r.ownerProjectId)} projesinde.
                          </small>
                        ) : plan ? (
                          <strong>
                            {money(plan.amount, plan.currency)}{" "}
                            <small>
                              / {periods[plan.frequency]}
                              {!plan.active ? " · Plan kapalı" : ""}
                            </small>
                          </strong>
                        ) : (
                          <small>
                            Ödeme planı yok · Ücretsiz veya pakete dahil
                            olabilir
                          </small>
                        )}
                      </div>
                      <div className="bo-actions">
                        {r.panelUrl && (
                          <a
                            href={r.panelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bo-link"
                          >
                            Sağlayıcı
                          </a>
                        )}
                        <button
                          className="bo-link"
                          onClick={() =>
                            openEditor({ kind: "resource", row: r })
                          }
                        >
                          Düzenle
                        </button>
                        {!shared && !plan && r.active && (
                          <button
                            className="bo-link"
                            onClick={() =>
                              openEditor({ kind: "plan", resource: r })
                            }
                          >
                            Ödeme planı
                          </button>
                        )}
                        {r.type === "domain" && r.active && (
                          <button
                            className="bo-link"
                            onClick={() =>
                              openEditor({ kind: "renew", row: r })
                            }
                          >
                            Yenilendi
                          </button>
                        )}
                        {r.active && (
                          <button
                            className="bo-link danger"
                            onClick={() =>
                              ask(
                                "Hizmeti iptal et",
                                "Yeni ödeme dönemleri durur. Oluşmuş borçlar korunur; bağlı sağlık kontrollerini İzleme sekmesinden duraklatabilirsiniz.",
                                `/resources/${r.id}`,
                                "PATCH",
                                { active: false },
                              )
                            }
                          >
                            İptal et
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {tab === "finance" && (
          <>
            <section className="bo-section">
              <div className="bo-section-heading">
                <h2>Ödeme ve tahsilat planları</h2>
                <button
                  className="bo-button primary"
                  disabled={!data.projects.length}
                  onClick={() => openEditor({ kind: "plan" })}
                >
                  <Plus size={16} /> Plan ekle
                </button>
              </div>
              <p className="bo-muted">
                Dönemler vade takvimine göre açılır. Gecikmiş borçlar sonraki
                dönemi durdurmaz.
              </p>
              {!data.plans.length && (
                <Empty text="Hizmet gideri veya müşteri tahsilat planı ekleyin." />
              )}
              <div className="bo-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Dönem</th>
                      <th>Tutar</th>
                      <th>Sonraki dönem</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.plans.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <small>
                            {projectName(p.projectId)} ·{" "}
                            {p.direction === "expense" ? "Gider" : "Tahsilat"}
                          </small>
                        </td>
                        <td>{periods[p.frequency]}</td>
                        <td>{money(p.amount, p.currency)}</td>
                        <td>
                          {dateLabel(p.nextDue)}
                          {p.pendingFrom && (
                            <small>
                              {dateLabel(p.pendingFrom)} itibarıyla{" "}
                              {money(p.pendingAmount!, p.currency)} /{" "}
                              {periods[p.pendingFrequency!]}
                            </small>
                          )}
                        </td>
                        <td>
                          {p.active ? (
                            <div className="bo-actions">
                              <button
                                className="bo-link"
                                onClick={() =>
                                  openEditor({ kind: "planChange", row: p })
                                }
                              >
                                Değiştir
                              </button>
                              <button
                                className="bo-link danger"
                                onClick={() =>
                                  ask(
                                    "Ödeme planını iptal et",
                                    "Yeni dönemler oluşturulmayacak. Oluşmuş bekleyen hareketler korunacak.",
                                    `/plans/${p.id}/cancel`,
                                  )
                                }
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <span className="bo-muted">Kapalı</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="bo-section">
              <h2>Ödeme takvimi ve gerçekleşen hareketler</h2>
              <div className="bo-filters">
                <input
                  className="bo-search"
                  placeholder="Hareket ara…"
                  aria-label="Hareket ara"
                  value={paymentSearch}
                  onChange={(e) => {
                    setPaymentSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <select
                  aria-label="Ödeme durumu"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tüm durumlar</option>
                  <option value="pending">Bekleyenler</option>
                  <option value="overdue">Gecikmiş</option>
                  <option value="paid">Tamamlananlar</option>
                  <option value="cancelled">İptal edilenler</option>
                </select>
              </div>
              <div className="bo-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hareket</th>
                      <th>Vade</th>
                      <th>Tutar</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <small>
                            {projectName(p.projectId)} ·{" "}
                            {p.direction === "expense" ? "Gider" : "Tahsilat"}
                          </small>
                        </td>
                        <td>
                          {dateLabel(p.dueOn)}
                          {p.paidAt && (
                            <small>Tamamlandı: {dateLabel(p.paidAt)}</small>
                          )}
                        </td>
                        <td>{money(p.amount, p.currency)}</td>
                        <td>
                          <Badge
                            status={
                              p.status === "pending" && p.dueOn < data.today
                                ? "overdue"
                                : p.status
                            }
                          />
                        </td>
                        <td>
                          {p.status === "pending" && (
                            <div className="bo-actions">
                              <button
                                className="bo-link"
                                onClick={() =>
                                  ask(
                                    p.direction === "expense"
                                      ? "Ödemeyi kaydet"
                                      : "Tahsilatı kaydet",
                                    `${p.name}: ${money(p.amount, p.currency)} tutarının tamamı gerçekleşmiş olarak kaydedilecek.`,
                                    `/payments/${p.id}`,
                                    "PATCH",
                                    { status: "paid" },
                                  )
                                }
                              >
                                {p.direction === "expense"
                                  ? "Ödendi"
                                  : "Tahsil edildi"}
                              </button>
                              <button
                                className="bo-link danger"
                                onClick={() =>
                                  ask(
                                    "Hareketi iptal et",
                                    "Yalnızca bu dönem iptal edilir. Ödeme planı devam eder.",
                                    `/payments/${p.id}`,
                                    "PATCH",
                                    { status: "cancelled" },
                                  )
                                }
                              >
                                İptal
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.payments.length && (
                <Empty text="Bu filtreye uygun hareket yok." />
              )}
              <div className="bo-pagination">
                <span>
                  {data.paymentTotal} kayıt · Sayfa {page}
                </span>
                <button
                  className="bo-button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Önceki
                </button>
                <button
                  className="bo-button"
                  disabled={page * 50 >= data.paymentTotal}
                  onClick={() => setPage(page + 1)}
                >
                  Sonraki
                </button>
              </div>
              <div className="bo-finance-totals">
                {data.finance.map((f) => (
                  <p key={f.currency}>
                    {f.currency} · Ödenen gider:{" "}
                    <strong>{money(f.paidExpense, f.currency)}</strong> · Alınan
                    tahsilat: <strong>{money(f.received, f.currency)}</strong>
                  </p>
                ))}
              </div>
            </section>
          </>
        )}
        {tab === "monitors" && (
          <section className="bo-section">
            <div className="bo-section-heading">
              <h2>Site ve API sağlığı</h2>
              <button
                className="bo-button primary"
                disabled={!data.projects.length}
                onClick={() => openEditor({ kind: "monitor" })}
              >
                <Plus size={16} /> Kontrol ekle
              </button>
            </div>
            <p className="bo-muted">
              15 dakikalık örnekleme · 10 saniye timeout · Kesinti bildirimi
              15–30 dakika sürebilir. Ölçüm boşlukları başarı sayılmaz.
            </p>
            {!data.monitors.length && (
              <Empty text="İlk sitenin veya API’nin HTTP/HTTPS adresini ekleyin." />
            )}
            <div className="bo-monitor-grid">
              {data.monitors.map((m) => (
                <article className="bo-monitor" key={m.id}>
                  <header>
                    <h3>{m.name}</h3>
                    <Badge status={m.state} />
                  </header>
                  <p className="bo-url">{m.url}</p>
                  <small>
                    {projectName(m.projectId)} · {m.method} · Başarı:{" "}
                    {m.statusMin}–{m.statusMax}
                  </small>
                  <div className="bo-uptime">
                    {m.uptime.map((u) => (
                      <div key={u.days}>
                        <span>{u.days} gün</span>
                        <strong>
                          {u.percent === null
                            ? "—"
                            : `${u.percent.toFixed(2)}%`}
                        </strong>
                        <small>{u.samples} ölçüm</small>
                      </div>
                    ))}
                  </div>
                  <dl>
                    <dt>Son kontrol</dt>
                    <dd>{timeLabel(m.lastCheckedAt)}</dd>
                    <dt>Son başarılı</dt>
                    <dd>{timeLabel(m.lastSuccessAt)}</dd>
                    <dt>Yanıt / süre</dt>
                    <dd>
                      {m.lastStatus ?? "—"} /{" "}
                      {m.lastLatency !== null ? `${m.lastLatency} ms` : "—"}
                    </dd>
                  </dl>
                  {m.lastError && <p className="bo-error">{m.lastError}</p>}
                  <div className="bo-actions">
                    <button
                      className="bo-button"
                      disabled={busy || !m.active}
                      onClick={() =>
                        void act(() => api(`/monitors/${m.id}/run`, "POST"))
                      }
                    >
                      Şimdi kontrol et
                    </button>
                    <button
                      className="bo-link"
                      onClick={() =>
                        void act(async () =>
                          setHistory({
                            name: m.name,
                            rows: await api(`/monitors/${m.id}/history`),
                          }),
                        )
                      }
                    >
                      Geçmiş
                    </button>
                    <button
                      className="bo-link"
                      onClick={() => openEditor({ kind: "monitor", row: m })}
                    >
                      Düzenle
                    </button>
                    <button
                      className="bo-link"
                      disabled={busy}
                      onClick={() =>
                        void act(() =>
                          api(`/monitors/${m.id}`, "PATCH", {
                            ...m,
                            active: !m.active,
                          }),
                        )
                      }
                    >
                      {m.active ? "Duraklat" : "Devam et"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <h2 className="bo-subheading">Kesinti geçmişi</h2>
            {data.incidents.length ? (
              data.incidents.map((i) => (
                <div className="bo-list-row" key={i.id}>
                  <div>
                    <strong>
                      {data.monitors.find((m) => m.id === i.monitorId)?.name}
                    </strong>
                    <small>
                      {timeLabel(i.openedAt)} —{" "}
                      {i.resolvedAt ? timeLabel(i.resolvedAt) : "Devam ediyor"}
                    </small>
                  </div>
                  <Badge status={i.resolvedAt ? "up" : "down"} />
                </div>
              ))
            ) : (
              <Empty text="Kaydedilmiş kesinti yok." />
            )}
          </section>
        )}
        {tab === "alerts" && (
          <section className="bo-section">
            <h2>Uyarı merkezi</h2>
            <p className="bo-muted">
              Tarih hatırlatmaları her gün 09.00’dan sonra tek e-postada
              gruplanır. Kesinti ve düzelmeler ayrı gönderilir.
            </p>
            {!data.emailEnabled && (
              <p className="bo-notice">
                E-posta gönderimi kapalı. Uyarılar burada birikmeye devam eder.
              </p>
            )}
            {!data.notifications.length && <Empty text="Uyarı bulunmuyor." />}
            {data.notifications.map((n) => {
              const delivery = data.deliveries.find(
                (d) => d.id === n.deliveryId,
              );
              return (
                <article className="bo-notification" key={n.id}>
                  <div>
                    <h3>
                      {!n.readAt && <span className="bo-dot" />}
                      {n.title}
                    </h3>
                    <p>{n.body}</p>
                    <small>
                      {timeLabel(n.createdAt)} ·{" "}
                      {delivery?.sentAt
                        ? "E-posta gönderildi"
                        : delivery?.lastError
                          ? `Gönderim bekliyor: ${delivery.lastError}`
                          : "Bildirim kuyruğunda"}
                    </small>
                  </div>
                  <div className="bo-actions">
                    {!n.readAt && (
                      <button
                        className="bo-link"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            api(`/notifications/${n.id}/read`, "POST"),
                          )
                        }
                      >
                        Okundu
                      </button>
                    )}
                    {delivery?.lastError && !delivery.sentAt && (
                      <button
                        className="bo-link"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            api(`/deliveries/${delivery.id}/retry`, "POST"),
                          )
                        }
                      >
                        Tekrar dene
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
        <footer className="bo-footer">
          Europe/Istanbul · Kontroller tek sunucudan yapılır. Bu sunucunun kendi
          kesintileri izlenmez.
        </footer>
      </main>
      {editor && (
        <EditorDialog
          editor={editor}
          data={data}
          projectId={projectId}
          close={() => setEditor(null)}
          saved={reload}
        />
      )}
      {confirm && (
        <Modal title={confirm.title} close={() => setConfirm(null)}>
          <p>{confirm.body}</p>
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
              onClick={() => void act(confirm.action)}
            >
              {busy ? "Kaydediliyor…" : "Onayla"}
            </button>
          </footer>
        </Modal>
      )}
      {history && (
        <Modal
          title={`${history.name} · Son 100 kontrol`}
          close={() => setHistory(null)}
        >
          {history.rows.length ? (
            history.rows.map((row) => (
              <div className="bo-list-row" key={row.id}>
                <span>{timeLabel(row.checkedAt)}</span>
                <span>
                  {row.status ?? "—"} · {row.latency} ms
                </span>
                <Badge status={row.ok ? "up" : "down"} />
                {row.error && <small>{row.error}</small>}
              </div>
            ))
          ) : (
            <Empty text="Henüz kontrol kaydı yok." />
          )}
        </Modal>
      )}
    </div>
  );
}
