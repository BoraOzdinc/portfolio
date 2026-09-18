import { Hero } from "@/components/hero";
import { FeaturedProject } from "@/components/featured-project";
import { Skills } from "@/components/skills";
import { Experience } from "@/components/experience";
import { Contact } from "@/components/contact";
import "./home-overview.css";

export function HomePage() {
  return (
    <main id="main-content" className="home-overview">
      <Hero />
      <FeaturedProject />
      <Skills />
      <Experience />
      <Contact />
    </main>
  );
}
