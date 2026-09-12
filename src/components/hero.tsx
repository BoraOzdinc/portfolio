import { ArrowDown, ArrowUpRight } from "lucide-react";

export function Hero() {
  return (
    <section className="home-hero home-container" aria-labelledby="hero-title">
      <div className="home-hero-copy">
        <p className="home-intro">Hi, I’m Bora. A full-stack developer.</p>
        <h1 id="hero-title">Complex problems.<br />Clear interfaces.<br />Carefully built.</h1>
        <p className="home-hero-description">I build web products that make everyday work easier. From healthcare platforms to commerce tools, I take care of the details on both sides of the screen.</p>
        <div className="home-hero-actions">
          <a className="home-button" href="#projects">Explore my work <ArrowDown size={18} aria-hidden="true" /></a>
          <a className="home-text-link" href="#contact">Have something in mind? <ArrowUpRight size={18} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="home-portrait">
        <div className="home-portrait-backdrop" />
        <img src="/image.png" alt="Bora Özdinç" width="1852" height="1734" fetchPriority="high" />
        <div className="home-portrait-caption"><span className="home-status-dot" />Available for project work</div>
      </div>
      <div className="home-hero-bottom">
        <p>Interfaces with purpose. Systems with staying power.</p>
        <span>React <span aria-hidden="true">/</span> TypeScript <span aria-hidden="true">/</span> Node.js</span>
      </div>
    </section>
  );
}
