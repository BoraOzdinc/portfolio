import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Projects() {
  return (
    <section id="projects" className="py-10 sm:py-14">
      <div className="space-y-8 sm:space-y-10">
        <SectionHeading
          eyebrow="Featured Projects"
          title="Production-ready web systems built to handle complexity."
          description="A selection of web products, from healthcare platforms to data-rich dashboards."
        />

        <div className="space-y-6">
          {projects.map((project, index) => {
            const isReversed = index % 2 === 1;

            return (
              <motion.article
                key={project.slug}
                className="panel-surface overflow-hidden rounded-[2rem]"
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
                  <Link
                    to={`/projects/${project.slug}`}
                    className={cn(
                      "group relative min-h-[18rem] overflow-hidden border-b border-white/10 bg-black/30 lg:min-h-[28rem] lg:border-b-0",
                      isReversed ? "lg:order-2 lg:border-l" : "lg:border-r"
                    )}
                  >
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
                          Case Study
                        </p>
                        <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
                          {project.title}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-white/70">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </Link>

                  <div
                    className={cn(
                      "flex flex-col justify-between p-6 sm:p-8",
                      isReversed && "lg:order-1"
                    )}
                  >
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {project.tags[0]}
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-balance font-display text-3xl font-semibold tracking-[-0.05em]">
                            {project.title}
                          </h3>
                          <p className="text-pretty text-base leading-7 text-muted-foreground">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          My Role
                        </p>
                        <p className="text-pretty text-sm leading-7 text-muted-foreground">
                          {project.role}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="rounded-full border-white/10 bg-white/[0.03] px-3 py-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button asChild className="rounded-full">
                        <Link to={`/projects/${project.slug}`}>
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      {project.link && (
                        <Button
                          variant="outline"
                          className="rounded-full border-white/15 bg-white/[0.02]"
                          onClick={() => window.open(project.link, "_blank")}
                        >
                          Visit Live Site
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
