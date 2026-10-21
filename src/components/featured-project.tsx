import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getProjectBySlug, projects } from "@/data/projects";

export function FeaturedProject() {
  const project = getProjectBySlug("melsashopp-dashboard");

  if (!project) return null;

  return (
    <section id="projects" className="home-featured home-container" aria-labelledby="featured-title">
      <div className="home-section-heading">
        <h2 id="featured-title">A closer look at my work</h2>
        <p>From the first screen to the final handoff.</p>
      </div>
      <article className="home-featured-story">
        <div className="home-featured-copy">
          <p className="home-featured-label">Featured project</p>
          <h3>{project.title}</h3>
          <p>An online store for 3D printers and filament, with payments, invoicing, and shipping running behind it.</p>
          <dl className="home-featured-details">
            <div>
              <dt>The challenge</dt>
              <dd>Take real orders and real money without losing track of one, from checkout to the carrier.</dd>
            </div>
            <div>
              <dt>My part</dt>
              <dd>Designed, built, and run the whole product, from the storefront to the operator dashboard.</dd>
            </div>
          </dl>
          <Link className="home-featured-link" to={`/projects/${project.slug}`}>
            Explore {project.title} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <Link className="home-featured-preview" to={`/projects/${project.slug}`} aria-label={`View ${project.title} project details`}>
          <img src={project.image} alt={`${project.title} storefront`} loading="lazy" decoding="async" />
        </Link>
      </article>
      <div className="home-featured-browse">
        <p>There’s more: clinic platforms, commerce tools, and data products.</p>
        <Link className="home-featured-link" to="/projects">View all {projects.length} projects <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
