import { Braces, Database, PanelsTopLeft } from "lucide-react";

const capabilities = [
  { icon: PanelsTopLeft, title: "Frontend", description: "Responsive websites and application flows that help people get where they need to go.", tools: "React, Next.js, TypeScript, Tailwind CSS" },
  { icon: Database, title: "Backend", description: "Data models, authentication, and APIs built around the way your product actually works.", tools: "Node.js, PostgreSQL, tRPC, Drizzle ORM" },
  { icon: Braces, title: "Integrations", description: "Connecting services, files, and operational tools into a cohesive product experience.", tools: "REST APIs, AWS S3, Better Auth, Git" },
];

export function Skills() {
  return (
    <section id="capabilities" className="home-capabilities" aria-labelledby="capabilities-title">
      <div className="home-container">
        <div className="home-section-heading">
          <h2 id="capabilities-title">What I work with</h2>
          <p>The tools I use to bring a product together.</p>
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
