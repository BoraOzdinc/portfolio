import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Expand, X } from "lucide-react";
import { getProjectBySlug, projects } from "@/data/projects";
import "./project-detail.css";

type Preview = { src: string; title: string };

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const reduceMotion = useReducedMotion();
  const [preview, setPreview] = useState<Preview | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closePreview = useCallback(() => setPreview(null), []);

  useEffect(() => {
    const element = dialog.current;
    if (!preview || !element) return;

    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [preview]);

  if (!project) return <Navigate to="/projects" replace />;

  const nextProject = projects[(projects.indexOf(project) + 1) % projects.length];

  return (
    <main id="main-content" className="project-detail home-container">
      <div className="project-breadcrumb">
        <Link to="/projects"><ArrowLeft size={16} aria-hidden="true" />All projects</Link>
        {project.link && (
          <a href={project.link} target="_blank" rel="noreferrer">
            Visit website <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
      </div>

      <motion.div
        className="project-intro"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>{project.title}</h1>
        <p>{project.description}</p>
      </motion.div>

      <button
        className="project-cover project-image-button"
        type="button"
        aria-label={`Enlarge ${project.title} overview`}
        onClick={() => setPreview({ src: project.image, title: project.title })}
      >
        <img src={project.image} alt={`${project.title} overview`} fetchPriority="high" />
        <span className="project-expand"><Expand size={18} aria-hidden="true" /></span>
      </button>

      <div className="project-overview">
        <section aria-labelledby="project-about-title">
          <h2 id="project-about-title">About the project</h2>
          <p>{project.longDescription}</p>
          <h2 className="project-role-title">My role</h2>
          <p>{project.role}</p>
        </section>
        <aside aria-labelledby="project-stack-title" className="project-stack">
          <h2 id="project-stack-title">Built with</h2>
          <ul>{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          <Link className="home-text-link" to="/#contact">Talk about a project <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </aside>
      </div>

      <section className="project-features" aria-labelledby="project-features-title">
        <h2 id="project-features-title">What it does</h2>
        <ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      </section>

      {Boolean(project.screenshots?.length) && (
        <section className="project-walkthrough" aria-labelledby="project-screens-title">
          <div className="home-section-heading">
            <h2 id="project-screens-title">A closer look</h2>
            <p>Select an image to expand it.</p>
          </div>
          <div className="project-screens">
            {project.screenshots?.map((screenshot) => (
              <article key={screenshot.title} className={screenshot.image ? "project-screen" : "project-screen project-screen-note"}>
                {screenshot.image && (
                  <button
                    className="project-image-button"
                    type="button"
                    aria-label={`Enlarge ${screenshot.title}`}
                    onClick={() => { if (screenshot.image) setPreview({ src: screenshot.image, title: screenshot.title }); }}
                  >
                    <img src={screenshot.image} alt={screenshot.title} loading="lazy" decoding="async" />
                    <span className="project-expand"><Expand size={17} aria-hidden="true" /></span>
                  </button>
                )}
                <h3>{screenshot.title}</h3>
                <p>{screenshot.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="project-next">
        <Link to="/projects" className="home-text-link"><ArrowLeft size={16} aria-hidden="true" />All projects</Link>
        {nextProject && (
          <Link className="project-next-link" to={`/projects/${nextProject.slug}`}>
            <span><small>Next project</small><strong>{nextProject.title}</strong></span>
            <ArrowUpRight size={26} aria-hidden="true" />
          </Link>
        )}
      </div>

      <dialog
        ref={dialog}
        className="project-lightbox"
        aria-label={preview ? `${preview.title} image preview` : "Image preview"}
        onCancel={closePreview}
        onClose={closePreview}
        onClick={(event) => { if (event.target === event.currentTarget) closePreview(); }}
      >
        {preview && (
          <>
            <button type="button" className="project-lightbox-close" aria-label="Close image" onClick={closePreview} autoFocus><X size={22} /></button>
            <figure>
              <img src={preview.src} alt={preview.title} />
              <figcaption>{preview.title}</figcaption>
            </figure>
          </>
        )}
      </dialog>
    </main>
  );
}
