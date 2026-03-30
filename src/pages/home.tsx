import { motion } from "motion/react";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { Experience } from "@/components/experience";
import { Contact } from "@/components/contact";

export function HomePage() {
  return (
    <motion.main
      className="mx-auto max-w-[90rem] px-4 pb-20 pt-6 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <Hero />
      <Projects />
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Skills />
        <Experience />
      </div>
      <Contact />
    </motion.main>
  );
}
