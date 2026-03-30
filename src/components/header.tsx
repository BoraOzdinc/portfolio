import { Button } from "@/components/ui/button";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { ArrowUpRight, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Projects", hash: "#projects" },
  { label: "Capabilities", hash: "#capabilities" },
  { label: "Experience", hash: "#experience" },
  { label: "Contact", hash: "#contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const progress = useScrollProgress();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const buildHref = (hash: string) =>
    location.pathname === "/" ? hash : `/${hash}`;

  return (
    <header className="sticky top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[90rem]">
        <div
          className={`panel-surface relative overflow-hidden rounded-full px-3 py-3 transition-all duration-300 ${
            scrolled
              ? "bg-background/75 shadow-2xl shadow-black/25"
              : "bg-background/55"
          }`}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-white/40"
            style={{ scaleX: progress }}
          />

          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-full px-3 py-1.5 transition hover:bg-white/[0.04]"
            >
              <div className="block">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Portfolio
                </p>
                <p className="font-display text-sm font-medium tracking-[-0.03em]">
                  ozdinc.dev_
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.hash}
                  href={buildHref(item.hash)}
                  className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() =>
                  window.open("https://github.com/BoraOzdinc", "_blank")
                }
              >
                <FaGithub className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
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
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() =>
                  (window.location.href = "mailto:boraozdinc@hotmail.com")
                }
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Button>
              <Button
                asChild
                className="hidden rounded-full pl-4 sm:inline-flex"
              >
                <a href={buildHref("#contact")}>
                  Start Inquiry
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
