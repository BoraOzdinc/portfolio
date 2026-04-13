import { motion } from "motion/react";
import { Code2, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";
import { projects } from "@/data/projects";

const skills = [
  {
    icon: Code2,
    title: "Web Application Engineering",
    description: "Building responsive, product-focused interfaces and application flows",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    icon: Database,
    title: "Backend Systems",
    description: "Designing APIs, data models, and integrations that support production apps",
    items: ["Node.js", "PostgreSQL", "REST APIs"],
  },
];

const revealTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function Skills() {
  const stack = Array.from(
    new Set(projects.flatMap((project) => project.tags))
  ).sort((left, right) => left.localeCompare(right));

  return (
    <section id="capabilities" className="py-8 sm:py-10">
      <div className="h-full space-y-8">
        <SectionHeading
          eyebrow="Capabilities"
          title="Full-stack delivery with a product focus."
          description="A breakdown of core technical skills across frontend, backend, and web infrastructure."
        />

        <div className="grid gap-4">
          {skills.map((skill, index) => {
            const Icon = skill.icon;

            return (
              <motion.div
                key={skill.title}
                className="panel-surface rounded-[1.75rem] p-6"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ ...revealTransition, delay: index * 0.08 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.05]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                        {skill.title}
                      </h3>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {skill.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skill.items.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="panel-surface rounded-[1.75rem] p-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={revealTransition}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Stack Footprint
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                Technologies used across shipped work
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {stack.map((tag) => (
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
        </motion.div>
      </div>
    </section>
  );
}
