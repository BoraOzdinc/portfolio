import { Braces, Database, PanelsTopLeft } from "lucide-react";

const capabilities = [
  { icon: PanelsTopLeft, title: "Interfaces that make sense", description: "Responsive websites and application flows that help people get where they need to go.", tools: "React, Next.js, TypeScript, Tailwind CSS" },
  { icon: Database, title: "The system behind the screen", description: "Data models, authentication, and APIs built around the way your product actually works.", tools: "Node.js, PostgreSQL, tRPC, Drizzle ORM" },
  { icon: Braces, title: "Everything working together", description: "Connecting services, files, and operational tools into a cohesive product experience.", tools: "REST APIs, AWS S3, Better Auth, Git" },
];

export function Skills() {
  return (
    <section id="capabilities" className="home-capabilities" aria-labelledby="capabilities-title">
      <div className="home-container">
        <div className="home-section-heading">
          <h2 id="capabilities-title">Built from end to end.</h2>
          <p>I care about what happens after the click<br />as much as what’s on the screen.</p>
        </div>
        <div className="home-capability-grid">
          {capabilities.map(({ icon: Icon, title, description, tools }) => (
            <div className="home-capability" key={title}>
              <Icon size={29} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
              <p className="home-tools">{tools}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
