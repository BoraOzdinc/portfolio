import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { projects } from "@/data/projects";

const projectPresentation: Record<string, { category: string; summary: string }> = {
  arcura: { category: "Healthcare", summary: "A clearer path from patient scans to surgical plans." },
  "inventory-ark": { category: "Commerce operations", summary: "Products, stock, and fulfillment. One connected workspace." },
  "aslident-dental-clinic": { category: "Clinic website", summary: "An approachable digital front door for a dental clinic." },
  "melsashopp-dashboard": { category: "Production management", summary: "Connecting the dots from customer order to 3D-printed product." },
  "data-crispy": { category: "AI & analytics", summary: "Ask a question. Turn business data into something useful." },
};

export function Projects() {
  return (
    <section id="projects" className="home-work home-container" aria-labelledby="work-title">
      <div className="home-section-heading">
        <h2 id="work-title">Selected work<span className="home-count">({projects.length})</span></h2>
        <p>Real products. Different challenges.<br />The same attention to how they work.</p>
      </div>
      <div className="home-project-grid">
        {projects.map((project) => {
          const presentation = projectPresentation[project.slug];
          return (
            <article key={project.slug} className={`home-project home-project-${project.slug}`}>
              <Link to={`/projects/${project.slug}`} className="home-project-image" aria-label={`Explore ${project.title}`}>
                <img src={project.image} alt={`${project.title} interface preview`} loading="lazy" decoding="async" />
                <span className="home-project-open"><ArrowUpRight size={22} aria-hidden="true" /></span>
              </Link>
              <div className="home-project-meta">
                <div>
                  <p className="home-project-category">{presentation?.category ?? project.tags[0]}</p>
                  <h3><Link to={`/projects/${project.slug}`}>{project.title}</Link></h3>
                </div>
                {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="home-live-link" aria-label={`Visit ${project.title} website (opens in a new tab)`}>Live site <ArrowUpRight size={15} aria-hidden="true" /></a>}
              </div>
              <p className="home-project-summary">{presentation?.summary ?? project.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
