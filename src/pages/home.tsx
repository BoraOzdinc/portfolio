import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { HomeHeader } from "@/components/home-header";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { Experience } from "@/components/experience";
import { Contact } from "@/components/contact";
import "./home.css";

export function HomePage() {
  return (
    <div className="portfolio-home" id="top">
      <a className="home-skip-link" href="#main-content">Skip to content</a>
      <HomeHeader />
      <main id="main-content">
        <Hero />
        <Projects />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <footer className="home-footer home-container">
        <a className="home-wordmark" href="#top">ozdinc.dev<span className="home-cursor" aria-hidden="true">_</span></a>
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
