import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";

const experiences = [
  {
    title: "Frontend Engineer",
    company: "Firefly",
    location: "Remote",
    period: "June 2023 - August 2025",
    description:
      "Built and maintained client-side systems for enterprise products, with a focus on modular React architecture, analytics tooling, and tightly coordinated backend integrations.",
    achievements: [
      "Engineered and maintained multiple React-based client-side microservices, improving system modularity and reducing deployment times by 25%.",
      "Integrated an interactive geographic mapping module for marketing teams, increasing campaign setup efficiency by 40%.",
      "Built analytical calculation utilities directly into core platforms, accelerating reporting workflows by more than 30%.",
      "Partnered with backend engineers on REST API design and data structures, reducing API latency by 20% while keeping the UI responsive.",
    ],
  },
];

export function Experience() {
  return (
    <section id="experience" className="py-8 sm:py-10">
      <div className="h-full space-y-8">
        <SectionHeading
          eyebrow="Experience"
          title="Engineering production frontend systems at scale."
          description="A record of delivering enterprise-grade web applications and internal tooling."
        />

        <div className="space-y-5">
          {experiences.map((experience, index) => (
            <motion.div
              key={`${experience.company}-${experience.period}`}
              className="panel-surface rounded-[1.75rem] p-6 sm:p-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Career Highlight
                    </p>
                    <div className="space-y-2">
                      <h3 className="font-display text-3xl font-semibold tracking-[-0.05em]">
                        {experience.title}
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        {experience.company}{" "}
                        <span className="text-foreground/40">&bull;</span>{" "}
                        {experience.location}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-fit rounded-full border border-white/10 bg-white/[0.05] px-4 py-2"
                  >
                    {experience.period}
                  </Badge>
                </div>

                <p className="max-w-2xl text-pretty text-sm leading-7 text-muted-foreground">
                  {experience.description}
                </p>

                <div className="grid gap-3">
                  {experience.achievements.map((achievement) => (
                    <div
                      key={achievement}
                      className="flex gap-3 rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        {achievement}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
