import { Button } from "@/components/ui/button";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { ArrowUpRight, Mail } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Projects", hash: "#projects" },
  { label: "Capabilities", hash: "#capabilities" },
  { label: "Experience", hash: "#experience" },
  { label: "Contact", hash: "#contact" },
];

const dockTransition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 0.9,
} as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const progress = useScrollProgress();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;

      setScrolled(currentY > 18);

      if (currentY < 72) {
        setHidden(false);
      } else if (currentY > lastY + 6) {
        setHidden(true);
      } else if (currentY < lastY - 6) {
        setHidden(false);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const buildHref = (hash: string) =>
    location.pathname === "/" ? hash : `/${hash}`;

  return (
    <motion.header
      className="pointer-events-none sticky top-0 z-50 px-4 py-4 sm:px-6 lg:px-8"
      initial={reduceMotion ? undefined : { y: -28, opacity: 0 }}
      animate={
        reduceMotion
          ? undefined
          : {
              y: hidden ? -26 : 0,
              opacity: hidden ? 0.92 : 1,
            }
      }
      transition={dockTransition}
    >
      <div className="pointer-events-auto mx-auto max-w-[90rem]">
        <motion.div
          className={`panel-surface relative overflow-hidden rounded-full border px-3 py-3 transition-[background-color,box-shadow] duration-500 ${
            scrolled
              ? "bg-background/80 shadow-2xl shadow-black/30"
              : "bg-background/58"
          }`}
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: scrolled ? 0.985 : 1,
                  y: scrolled ? -2 : 0,
                }
          }
          transition={dockTransition}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.18),transparent_38%),linear-gradient(120deg,rgba(255,255,255,0.07),transparent_48%,rgba(255,255,255,0.02))]"
            animate={
              reduceMotion
                ? { opacity: scrolled ? 0.95 : 0.65 }
                : {
                    opacity: scrolled ? 0.95 : 0.65,
                    scale: scrolled ? 1.04 : 1,
                  }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <div className="navbar-shimmer pointer-events-none absolute inset-y-0 left-[-24%] w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-70" />
          <motion.div
            className="absolute inset-x-4 bottom-0 h-px overflow-hidden rounded-full bg-white/12"
          >
            <motion.div
              className="h-full origin-left rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.92)_45%,rgba(255,255,255,0))]"
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ scaleX: progress }}
            />
          </motion.div>

          <div className="relative flex items-center justify-between gap-4">
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      x: 0,
                    }
              }
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
            >
              <Link
                to="/"
                className="group flex items-center gap-3 rounded-full px-3 py-1.5 transition hover:bg-white/[0.04]"
              >
                <div className="block">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                    Portfolio
                  </p>
                  <p className="font-display text-sm font-medium tracking-[-0.03em] transition-transform duration-300 group-hover:translate-x-0.5">
                    ozdinc.dev_
                  </p>
                </div>
              </Link>
            </motion.div>

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item, index) => {
                const isHovered = hoveredItem === item.hash;

                return (
                  <motion.a
                    key={item.hash}
                    href={buildHref(item.hash)}
                    className="relative rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
                    initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            y: 0,
                          }
                    }
                    transition={{
                      duration: 0.35,
                      ease: "easeOut",
                      delay: 0.12 + index * 0.05,
                    }}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    onHoverStart={() => setHoveredItem(item.hash)}
                    onHoverEnd={() => setHoveredItem(null)}
                    onFocus={() => setHoveredItem(item.hash)}
                    onBlur={() => setHoveredItem(null)}
                  >
                    {isHovered ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.08] shadow-[0_18px_30px_-24px_rgba(255,255,255,0.9)]"
                        transition={dockTransition}
                      />
                    ) : null}
                    <span className="relative z-10">{item.label}</span>
                  </motion.a>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-white/8 bg-white/[0.03] shadow-[0_12px_30px_-24px_rgba(255,255,255,0.75)] transition-all duration-300 hover:border-white/16 hover:bg-white/[0.08]"
                  onClick={() =>
                    window.open("https://github.com/BoraOzdinc", "_blank")
                  }
                >
                  <FaGithub className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-white/8 bg-white/[0.03] shadow-[0_12px_30px_-24px_rgba(255,255,255,0.75)] transition-all duration-300 hover:border-white/16 hover:bg-white/[0.08]"
                  onClick={() =>
                    window.open(
                      "https://www.linkedin.com/in/boraozdinc",
                      "_blank",
                    )
                  }
                >
                  <FaLinkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-white/8 bg-white/[0.03] shadow-[0_12px_30px_-24px_rgba(255,255,255,0.75)] transition-all duration-300 hover:border-white/16 hover:bg-white/[0.08]"
                  onClick={() =>
                    (window.location.href = "mailto:boraozdinc@hotmail.com")
                  }
                >
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Email</span>
                </Button>
              </motion.div>
              <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, x: 12 }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        x: 0,
                      }
                }
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.22 }}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              >
                <Button
                  asChild
                  className="group hidden rounded-full border border-white/10 bg-white text-background shadow-[0_24px_40px_-28px_rgba(255,255,255,0.9)] transition-all duration-300 hover:bg-white/92 sm:inline-flex"
                >
                  <a href={buildHref("#contact")}>
                    Start Inquiry
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
