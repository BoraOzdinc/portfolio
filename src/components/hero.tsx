import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projects } from "@/data/projects";

const introBadges = [
  "React",
  "TypeScript",
  "Next.js",
  "Node.js",
  "PostgreSQL",
];

const heroVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  const liveProjects = projects.filter((project) => Boolean(project.link)).length;
  const technologyCount = new Set(projects.flatMap((project) => project.tags)).size;
  const featuredProjects = projects.slice(0, 3);

  const stats = [
    {
      value: String(projects.length).padStart(2, "0"),
      label: "selected builds",
    },
    {
      value: String(liveProjects).padStart(2, "0"),
      label: "live products",
    },
    {
      value: String(technologyCount).padStart(2, "0"),
      label: "tech stack items",
    },
  ];

  return (
    <section className="py-6 sm:py-10 lg:py-14">
      <motion.div
        className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-8">
          <motion.div variants={itemVariants} className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Available for full-stack product work and web engineering
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-balance font-display text-5xl font-semibold tracking-[-0.06em] sm:text-6xl lg:text-[5rem]">
                Full-Stack Web Engineer building sharp digital products with
                precision.
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
                I design and build web products end to end, from polished
                interfaces to backend systems that support real business
                workflows.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
            {introBadges.map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em]"
              >
                {badge}
              </Badge>
            ))}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="rounded-full px-6">
              <a href="#projects">
                Explore Projects
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/15 bg-white/[0.02] px-6"
            >
              <a href="#contact">
                Start an Inquiry
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid gap-3 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="panel-surface rounded-[1.5rem] px-5 py-4"
              >
                <p className="font-display text-3xl font-semibold tracking-[-0.06em]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="panel-surface grid-overlay relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute left-8 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-6 right-6 h-36 w-36 rounded-full bg-white/5 blur-3xl" />

          <div className="relative space-y-6">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Selected Snapshot
              </p>
              <h2 className="text-balance font-display text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                Product work across healthcare, AI analytics, commerce, and
                internal operations.
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                The details stay the same. The redesign frames them with more
                intent, stronger composition, and cleaner motion.
              </p>
            </div>

            <div className="space-y-3">
              {featuredProjects.map((project, index) => (
                <Link
                  key={project.slug}
                  to={`/projects/${project.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4 transition hover:border-white/20 hover:bg-black/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-display text-lg font-medium tracking-[-0.04em]">
                        {project.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.tags.slice(0, 2).join(" / ")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
