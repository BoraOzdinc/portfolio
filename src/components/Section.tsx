import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface SectionProps {
  id: string;
  title?: string;
  children: ReactNode;
  className?: string;
  headingClassName?: string;
  accent?: boolean;
  glass?: boolean;
}

export function Section({ id, title, children, className }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "w-full mx-auto px-10 md:px-28 py-28 md:py-40 relative min-w-full items-center  flex flex-col gap-10",
        className
      )}
    >
      {title && (
        <h2 className="text-3xl md:text-5xl font-bold mb-10 tracking-tight">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
