import { ArrowUpRight } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";

export function Contact() {
  return (
    <section id="contact" className="home-contact" aria-labelledby="contact-title">
      <div className="home-contact-grid home-container">
        <div className="home-contact-copy">
          <p className="home-availability"><span className="home-status-dot" />Open to new projects</p>
          <h2 id="contact-title">Have a project in mind?</h2>
          <p>Tell me a little about what you’re working on. I’m happy to talk through an idea, a new website, or an existing project.</p>
          <a className="home-contact-email" href="mailto:boraozdinc@hotmail.com">boraozdinc@hotmail.com <ArrowUpRight size={21} aria-hidden="true" /></a>
          <p className="home-contact-note">You can use the form or email me directly.</p>
        </div>
        <InquiryForm />
      </div>
    </section>
  );
}
