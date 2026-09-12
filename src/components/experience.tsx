const experiences = [
  { company: "Ramex Trading", role: "IT Technician", period: "Oct 2025 – Present", location: "UAE / Remote", description: "Supporting employee hardware, troubleshooting connected devices, and coordinating infrastructure needs with the development team." },
  { company: "Firefly", role: "Frontend Developer", period: "Jul 2023 – Jun 2025", location: "Remote", description: "Built React and TypeScript features for the Opportunity Manager platform, including map-based targeting and campaign planning tools within a micro-frontend team." },
];

export function Experience() {
  return (
    <section id="experience" className="home-experience home-container" aria-labelledby="experience-title">
      <div className="home-experience-intro">
        <h2 id="experience-title">A little background.</h2>
        <p>Product development and hands-on IT experience. An understanding of the interface, and the infrastructure it depends on.</p>
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
