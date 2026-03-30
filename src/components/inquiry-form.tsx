import { type ChangeEvent, type FormEvent, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMAIL_ADDRESS = "boraozdinc@hotmail.com";

type InquiryFormState = {
  name: string;
  email: string;
  company: string;
  subject: string;
  inquiryType: string;
  timeline: string;
  message: string;
};

const initialFormState: InquiryFormState = {
  name: "",
  email: "",
  company: "",
  subject: "",
  inquiryType: "New project",
  timeline: "",
  message: "",
};

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/75 focus:border-white/25 focus:bg-black/30 focus:ring-2 focus:ring-white/10";

export function InquiryForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          website: "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "The inquiry could not be sent right now."
        );
      }

      setFormData(initialFormState);
      setStatusMessage(
        "Inquiry sent successfully. I will receive it in my inbox."
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "The inquiry could not be sent right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="panel-surface grid-overlay relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-white/10 blur-3xl" />
      <div className="relative space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Inquiry Form
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
              Tell me what you&apos;re building
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Use this for new projects, redesign work, or direct questions.
              Submitting sends the inquiry directly to my inbox.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Name</span>
              <input
                className={fieldClassName}
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Email</span>
              <input
                className={fieldClassName}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Company</span>
              <input
                className={fieldClassName}
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="Studio or brand"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Inquiry Type</span>
              <select
                className={fieldClassName}
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleChange}
              >
                <option>New project</option>
                <option>Website redesign</option>
                <option>Full-stack contract</option>
                <option>General question</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.35fr_0.65fr]">
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Subject</span>
              <input
                className={fieldClassName}
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief subject line"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Timeline</span>
              <input
                className={fieldClassName}
                name="timeline"
                type="text"
                value={formData.timeline}
                onChange={handleChange}
                placeholder="e.g. April launch"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="block text-muted-foreground">
              Project or question
            </span>
            <textarea
              className={`${fieldClassName} min-h-36 resize-y`}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Share the scope, goals, audience, or the question you want answered."
              required
            />
          </label>

          <label className="hidden">
            <span>Website</span>
            <input
              tabIndex={-1}
              autoComplete="off"
              name="website"
              type="text"
              value=""
              readOnly
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              Prefer direct email?{" "}
              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="text-foreground transition hover:text-primary"
              >
                {EMAIL_ADDRESS}
              </a>
            </p>
            <Button
              type="submit"
              className="rounded-full px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Inquiry"}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div
          aria-live="polite"
          className="min-h-6 text-sm text-muted-foreground"
        >
          {statusMessage}
        </div>
      </div>
    </motion.div>
  );
}
