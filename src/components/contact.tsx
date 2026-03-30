import { motion } from "motion/react";
import {
  ArrowUpRight,
  Github,
  Linkedin,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InquiryForm } from "@/components/inquiry-form";
import { SectionHeading } from "@/components/section-heading";

const contactLinks = [
  {
    title: "Email",
    description: "Direct project briefs or quick questions",
    value: "boraozdinc@hotmail.com",
    href: "mailto:boraozdinc@hotmail.com",
    icon: Mail,
  },
  {
    title: "LinkedIn",
    description: "Professional connection and outreach",
    value: "linkedin.com/in/boraozdinc",
    href: "https://www.linkedin.com/in/boraozdinc",
    icon: Linkedin,
  },
  {
    title: "GitHub",
    description: "Code samples and public work",
    value: "github.com/BoraOzdinc",
    href: "https://github.com/BoraOzdinc",
    icon: Github,
  },
];

const processSteps = [
  "Share the project, redesign scope, or the question you want answered.",
  "I review the brief, follow up on missing details, and outline the next step.",
  "From there we can move into scoping, delivery, or a focused technical discussion.",
];

export function Contact() {
  return (
    <section id="contact" className="py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Contact"
            title="Open to new projects, redesign work, and direct product questions."
            description="This section is built as a proper inquiry entry point, not just a set of social links. Use the form for scoped work or a straightforward technical question."
          />

          <motion.div
            className="panel-surface rounded-[1.75rem] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                Direct Channels
              </div>
              <div className="grid gap-3">
                {contactLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="group flex items-center justify-between gap-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4 transition hover:border-white/20 hover:bg-black/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.05]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-display text-lg font-medium tracking-[-0.03em]">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-muted-foreground xl:inline">
                          {item.value}
                        </span>
                        <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="panel-surface rounded-[1.75rem] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: 0.6,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                What To Include
              </p>
              <div className="space-y-3">
                {processSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/15 bg-white/[0.02]"
              >
                <a href="mailto:boraozdinc@hotmail.com">
                  Email Directly
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        <InquiryForm />
      </div>
    </section>
  );
}
