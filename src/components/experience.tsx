const experiences = [
  { company: "Gümüşdoğa Su Ürünleri", role: "SAP Project Assistant", period: "Jul 2026 – Present", location: "Milas / Muğla", description: "Assisting the SAP project team, building on SAP Learning’s SAP Fiori course covering Fiori concepts, application development, and deployment." },
  { company: "Firefly", role: "Frontend Developer", period: "Jul 2023 – Jun 2025", location: "Remote", description: "Built React and TypeScript features for the Opportunity Manager platform, including map-based targeting and campaign planning tools within a micro-frontend team." },
];

export function Experience() {
  return (
    <section id="experience" className="home-experience home-container" aria-labelledby="experience-title">
      <div className="home-experience-intro">
        <h2 id="experience-title">Experience</h2>
        <p>My background spans frontend development and SAP projects.</p>
      </div>
      <div className="home-experience-list">
        {experiences.map((experience) => (
          <article className="home-experience-item" key={experience.company}>
            <div className="home-experience-top"><h3>{experience.company}</h3><span>{experience.period}</span></div>
            <p className="home-experience-role">{experience.role} <span>{experience.location}</span></p>
            <p>{experience.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
