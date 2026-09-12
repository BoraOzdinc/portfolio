import type { ReactNode } from "react";
import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import "@/pages/home.css";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portfolio-home min-h-screen overflow-x-clip" id="top">
      <a className="home-skip-link" href="#main-content">Skip to content</a>
      <ScrollToTop />
      <Header />
      {children}
      <footer className="home-footer home-container">
        <Link className="home-wordmark" to="/">ozdinc.dev<span className="home-cursor" aria-hidden="true">_</span></Link>
        <p>Thanks for stopping by.</p>
        <div className="home-footer-links">
          <a href="https://github.com/BoraOzdinc" target="_blank" rel="noreferrer" aria-label="GitHub (opens in a new tab)"><Github size={19} /></a>
          <a href="https://www.linkedin.com/in/boraozdinc" target="_blank" rel="noreferrer" aria-label="LinkedIn (opens in a new tab)"><Linkedin size={19} /></a>
          <a href="#top">Back to top <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </footer>
    </div>
  );
}
