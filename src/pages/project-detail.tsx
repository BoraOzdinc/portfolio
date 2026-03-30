import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectBySlug, projects } from "@/data/projects";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const revealTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!lightboxSrc) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [closeLightbox, lightboxSrc]);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const projectIndex =
    projects.findIndex((entry) => entry.slug === project.slug) + 1;
  const hasScreenshots = Boolean(project.screenshots?.length);

  const stats = [
    {
      label: "features",
      value: String(project.features.length).padStart(2, "0"),
    },
    {
      label: "stack items",
      value: String(project.tags.length).padStart(2, "0"),
    },
  ];

  if (hasScreenshots) {
    stats.splice(1, 0, {
      label: "screens",
      value: String(project.screenshots?.length ?? 0).padStart(2, "0"),
    });
  }

  return (
    <motion.main
      className="mx-auto max-w-[90rem] px-4 pb-20 pt-6 sm:px-6 lg:px-8"
      {...pageTransition}
    >
      <motion.section
        className="panel-surface grid-overlay overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={revealTransition}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" asChild className="rounded-full">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {project.link && (
            <Button asChild className="rounded-full">
              <a href={project.link} target="_blank" rel="noreferrer">
                Visit Live Site
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        <div className="mt-10 grid gap-10 xl:grid-cols-[0.92fr_1.08fr] xl:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Project {String(projectIndex).padStart(2, "0")}
            </div>
            <div className="space-y-4">
              <h1 className="text-balance font-display text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                {project.title}
              </h1>
              <p className="max-w-3xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
                {project.description}
              </p>
              <p className="max-w-3xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
                {project.longDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4"
                >
                  <p className="font-display text-3xl font-semibold tracking-[-0.05em]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/30"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...revealTransition, delay: 0.08 }}
          >
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </motion.section>

      <div
        className={
          hasScreenshots
            ? "mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]"
            : "mx-auto mt-8 max-w-5xl space-y-6"
        }
      >
        {hasScreenshots ? (
          <div className="space-y-8">
            <motion.section
              className="space-y-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={revealTransition}
            >
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Walkthrough
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">
                  Interface highlights and workflow screens
                </h2>
              </div>

              <div className="space-y-5">
                {project.screenshots?.map((screenshot, index) => (
                  <motion.article
                    key={screenshot.title}
                    className="panel-surface overflow-hidden rounded-[1.75rem] p-5 sm:p-6"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.18 }}
                    transition={{
                      ...revealTransition,
                      delay: Math.min(index * 0.05, 0.2),
                    }}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          Screen {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                          {screenshot.title}
                        </h3>
                        <p className="text-pretty text-sm leading-7 text-muted-foreground">
                          {screenshot.description}
                        </p>
                      </div>

                      {screenshot.image ? (
                        <button
                          type="button"
                          className="group block w-full cursor-zoom-in overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/30"
                          onClick={() => setLightboxSrc(screenshot.image ?? null)}
                        >
                          <img
                            src={screenshot.image}
                            alt={screenshot.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        </button>
                      ) : null}
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          </div>
        ) : null}

        <div
          className={
            hasScreenshots
              ? "space-y-6 xl:sticky xl:top-28 xl:self-start"
              : "space-y-6"
          }
        >
          <motion.section
            className="panel-surface rounded-[1.75rem] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={revealTransition}
          >
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                My Role
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                End-to-end contribution
              </h2>
              <p className="text-pretty text-sm leading-7 text-muted-foreground">
                {project.role}
              </p>
            </div>
          </motion.section>

          <motion.section
            className="panel-surface rounded-[1.75rem] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...revealTransition, delay: 0.05 }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Key Features
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                  What the product had to do
                </h2>
              </div>
              <div className="space-y-3">
                {project.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex gap-3 rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <p className="text-sm leading-7 text-muted-foreground">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            className="panel-surface rounded-[1.75rem] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...revealTransition, delay: 0.1 }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Navigation
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                  Continue browsing
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {project.link && (
                  <Button asChild className="rounded-full">
                    <a href={project.link} target="_blank" rel="noreferrer">
                      Visit Live Site
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/[0.02]"
                >
                  <Link to="/">Back to Portfolio</Link>
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/40 p-2 text-white transition hover:bg-black/60"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </button>
            <motion.img
              src={lightboxSrc}
              alt="Screenshot preview"
              className="max-h-[90vh] max-w-[90vw] rounded-[1.25rem] object-contain"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
