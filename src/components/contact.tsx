import { ArrowUpRight } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";

export function Contact() {
  return (
    <section id="contact" className="home-contact" aria-labelledby="contact-title">
      <div className="home-contact-grid home-container">
        <div className="home-contact-copy">
          <p className="home-availability"><span className="home-status-dot" />Open to new projects</p>
          <h2 id="contact-title">Let’s make<br />it work.</h2>
          <p>Have a product to build, a workflow to simplify, or a website that needs a fresh perspective? Tell me about it.</p>
          <a className="home-contact-email" href="mailto:boraozdinc@hotmail.com">boraozdinc@hotmail.com <ArrowUpRight size={21} aria-hidden="true" /></a>
          <p className="home-contact-note">A brief outline is a great place to start.</p>
        </div>
        <InquiryForm />
      </div>
    </section>
  );
}
