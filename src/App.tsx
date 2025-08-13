import { useRef } from "react";
import AnimatedNavbar from "./components/AnimatedNavbar.tsx";
import { Section } from "./components/Section";
import { useScrollReveal } from "./hooks/useScrollReveal";
import TextType from "./components/TextType.tsx";
import GradientText from "./components/GradientText.tsx";
import Iridescence from "./components/Iridescence.tsx";
import ScrollReveal from "./components/ScrollReveal.tsx";
import RotatingText from "./components/RotatingText.tsx";

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useScrollReveal<HTMLDivElement>({ delay: 100 });
  const projectsRef = useScrollReveal<HTMLDivElement>({ delay: 100 });
  const contactRef = useScrollReveal<HTMLDivElement>({ delay: 100 });
  // Removed scroll progress bar from navbar; hook retained import for potential future use
  // (Removed intro + scroll spy logic as navbar simplified)

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-start gap-0 md:gap-6 pb-20 "
    >
      <AnimatedNavbar />
      {/* Hero / Home (plain, no liquid glass) */}
      <div className=" flex flex-col items-center justify-center w-full gap-80">
        <header
          id="home"
          className="w-full max-w-5xl max-h-screen flex flex-col items-start gap-8 pt-28 md:pt-40 pb-32 md:pb-48"
        >
          <Iridescence
            color={[0.4, 0.4, 0.7]}
            mouseReact={false}
            speed={0.5}
            className="fixed inset-0 -z-10 pointer-events-none"
          />
          <p className=" tracking-widest uppercase text-sky-400 font-semibold">
            Hi, my name is
          </p>
          <GradientText
            colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
            animationSpeed={3}
            showBorder={false}
            className="flex items-start justify-start text-5xl"
          >
            Bora Kaan Ozdinc
          </GradientText>
          <TextType
            text={[
              "I craft performant web apps",
              "I design scalable UI systems",
              "I optimize front-end performance",
              "I integrate TypeScript & React at scale",
              "I deliver smooth interactive experiences",
              "I focus on DX & maintainability",
            ]}
            typingSpeed={20}
            pauseDuration={2000}
            deletingSpeed={30}
            showCursor={true}
            cursorCharacter="|"
            className="text-5xl"
          />
          <p className="text-neutral-300 leading-relaxed max-w-2xl">
            I&apos;m a frontend engineer focused on creating immersive,
            performant interfaces with React, TypeScript, and thoughtful motion.
          </p>
          <div className="flex gap-4 pt-2">
            <a
              href="#projects"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-fuchsia-500 text-white font-medium shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-shadow"
            >
              View Work
            </a>
            <a
              href="#contact"
              className="px-5 py-2.5 rounded-lg border border-white/15 text-neutral-200 hover:border-sky-400/50 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </header>

        {/* Portfolio Sections */}
        <Section id="about" title="About Me" accent>
          <div
            ref={aboutRef}
            className="flex gap-10 items-center relative z-20"
          >
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={5}
              blurStrength={10}
              textClassName="leading-relaxed  max-w-2xl"
            >
              I build performant, accessible web experiences with a focus on
              delightful micro-interactions and maintainable architectures.
              Passionate about TypeScript, animation, and design systems.
            </ScrollReveal>
            <RotatingText
              texts={[
                "Frontend Engineering",
                "Design Systems & UI kits",
                "Web Performance & DX",
                "Motion & Interaction Design",
              ]}
              mainClassName="px-2 sm:px-2 md:px-3 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </div>
        </Section>
        <Section id="projects" title="Selected Projects" accent>
          <div className="w-full max-w-5xl mx-auto">
            <div
              ref={projectsRef}
              className="grid w-full sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  title: "InventoryArk",
                  stack: [
                    "React",
                    "TypeScript",
                    "Node.js",
                    "SQLite",
                    "Drizzle",
                    "Tailwind CSS",
                    "TRPC",
                    "SST / AWS",
                  ],
                  description:
                    "Full‑stack inventory & stock tracking platform featuring real‑time quantity updates, low‑stock alerts, role based access and import/export workflows.",
                  link: "https://inventoryark.com",
                  repo: undefined, // private for now
                },
                {
                  title: "Portfolio Site",
                  stack: ["React", "Tailwind", "Anime.js"],
                  description:
                    "This very site showcasing animation, liquid glass effect and scroll reveal sections.",
                  link: "#home",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="project-card group relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 overflow-hidden hover:border-sky-400/40 transition-colors will-change-transform"
                >
                  <div className="absolute inset-px rounded-lg bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <h3 className="font-semibold mb-2 text-white flex items-start justify-between gap-3">
                    <span>{p.title}</span>
                    {p.stack && (
                      <span className="text-[10px] uppercase tracking-wide text-sky-300/70 font-medium">
                        {p.stack[0]}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed mb-3">
                    {p.description}
                  </p>
                  {p.stack && (
                    <ul className="flex flex-wrap gap-1.5 mb-4">
                      {p.stack.map((tech) => (
                        <li
                          key={tech}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-neutral-300"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    {p.link && (
                      <a
                        href={p.link}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors relative overflow-hidden"
                      >
                        <span className="relative">Live</span>
                        <span className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-400/30 to-fuchsia-500/0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out" />
                      </a>
                    )}
                    {p.repo && (
                      <a
                        href={p.repo}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border border-sky-400/30 text-sky-300 hover:border-sky-400/60 transition-colors"
                      >
                        Code
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section id="experience" title="Experience" accent>
          <div className="space-y-10">
            <div className="relative pl-5 border-l border-white/10">
              <div className="absolute -left-2 top-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-500" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white">
                  Firefly · Frontend Developer
                </h3>
                <span className="text-xs font-medium text-neutral-400">
                  July 2023 – Present · Istanbul
                </span>
              </div>
              <a
                href="https://fireflyon.com"
                target="_blank"
                className="text-sky-400 text-sm inline-flex items-center gap-1 hover:underline"
              >
                fireflyon.com
              </a>
              <ul className="mt-4 list-disc list-inside space-y-2 text-neutral-300 text-sm leading-relaxed">
                <li>
                  Spearheaded key features for an internal "Opportunity Manager"
                  using React & TypeScript in a micro-frontend architecture.
                </li>
                <li>
                  Implemented interactive map feature enabling visual geographic
                  targeting.
                </li>
                <li>
                  Developed complex calculation tools powering data-driven
                  decisions across teams.
                </li>
                <li>
                  Collaborated with backend to refine data structures ensuring
                  optimal performance.
                </li>
              </ul>
            </div>
          </div>
        </Section>
        <Section id="education" title="Education" accent>
          <div className="space-y-8">
            <div className="relative pl-5 border-l border-white/10">
              <div className="absolute -left-2 top-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-500" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white">
                  Nisantasi University · Software Engineering
                </h3>
                <span className="text-xs font-medium text-neutral-400">
                  Sep 2021 – Jul 2025 · Bachelors · 3.2 / 4
                </span>
              </div>
              <a
                href="https://www.nisantasi.edu.tr/inde.php"
                target="_blank"
                className="text-sky-400 text-sm hover:underline"
              >
                nisantasi.edu.tr
              </a>
            </div>
          </div>
        </Section>
        <Section id="skills" title="Skills" accent>
          <div className="grid md:grid-cols-3 gap-10 text-sm text-neutral-300">
            <div>
              <h4 className="font-semibold text-white mb-3">Core</h4>
              <ul className="space-y-1">
                <li>React JS</li>
                <li>TypeScript</li>
                <li>HTML / CSS</li>
                <li>JavaScript (ESNext)</li>
                <li>React Native</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Tooling & Infra</h4>
              <ul className="space-y-1">
                <li>Docker (Self Hosting)</li>
                <li>tRPC / TanStack (Router, Query)</li>
                <li>Design Systems & UI Kits</li>
                <li>Performance Optimization</li>
                <li>Micro-frontend Patterns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Languages</h4>
              <ul className="space-y-1">
                <li>Turkish (Native)</li>
                <li>English (Good)</li>
              </ul>
            </div>
          </div>
        </Section>
        <Section id="contact" title="Get In Touch" accent>
          <div ref={contactRef} className="max-w-2xl space-y-6">
            <p className="text-neutral-300 leading-relaxed">
              I&apos;m open to collaboration, freelance opportunities, and
              interesting conversations. Feel free to reach out if you have a
              project or just want to say hi.
            </p>
            <a
              href="mailto:hello@example.com"
              className="inline-block rounded-lg bg-gradient-to-r from-sky-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-shadow focus:outline-none focus-visible:ring focus-visible:ring-sky-500/50"
            >
              Say Hello
            </a>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default App;
