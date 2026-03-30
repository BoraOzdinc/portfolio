import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
}

const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      className={cn(
        "space-y-4",
        align === "center" && "mx-auto max-w-3xl text-center",
        className
      )}
      variants={headingVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
    >
      <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {eyebrow}
      </div>
      <div className="space-y-3">
        <h2 className="text-balance font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[2.8rem]">
          {title}
        </h2>
        <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
