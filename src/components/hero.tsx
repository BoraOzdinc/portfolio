import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="home-hero home-container" aria-labelledby="hero-title">
      <div className="home-hero-light" aria-hidden="true" />
      <motion.div
        className="home-hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="home-intro">Hi, I’m Bora. A full-stack developer.</p>
        <h1 id="hero-title">Useful websites.<br />Thoughtful web apps.</h1>
        <p className="home-hero-description">
          I build websites and web apps, from the interface to the systems
          behind it. I like keeping things simple, useful, and easy to work with.
        </p>
        <div className="home-hero-actions">
          <a className="home-button" href="#contact">Get in touch <ArrowUpRight size={17} aria-hidden="true" /></a>
          <Link className="home-text-link" to="/projects">Explore my projects <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </motion.div>
      <div className="home-hero-bottom">
        <p className="home-availability"><span className="home-status-dot" />Open to project work</p>
        <span>React <span aria-hidden="true">/</span> TypeScript <span aria-hidden="true">/</span> Node.js</span>
      </div>
    </section>
  );
}
