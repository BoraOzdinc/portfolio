import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";

const experiences = [
  {
    title: "Frontend Developer",
    company: "Firefly",
    location: "Remote",
    period: "July 2023 - June 2025",
    description:
      "Developed features for the Opportunity Manager platform within a micro-frontend product team, collaborating across product, design, and backend.",
    achievements: [
      "Developed features for the Opportunity Manager platform using React, TypeScript, and a micro-frontend architecture.",
      "Built interactive map-based targeting and calculation tools to support campaign planning and internal decision-making workflows.",
      "Improved UI responsiveness and collaborated with cross-functional teams to deliver maintainable production features.",
    ],
  },
  {
    title: "IT Technician",
    company: "Ramex Trading",
    location: "UAE - Remote",
    period: "October 2025 - Present",
    description:
      "Providing IT support and operational assistance across employee hardware and infrastructure coordination.",
    achievements: [
      "Troubleshoot employee computers, printers, and network-connected devices while supporting onboarding device setup.",
      "Coordinate with the development team on server resource monitoring and operational support needs.",
    ],
  },
];

export function Experience() {
  return (
    <section id="experience" className="py-8 sm:py-10">
      <div className="h-full space-y-8">
        <SectionHeading
          eyebrow="Experience"
          title="Professional experience across development and IT support."
          description="A record of frontend product delivery and operational support."
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
                      Career History
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
