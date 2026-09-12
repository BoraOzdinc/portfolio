import { type ChangeEvent, type FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";
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
  "inquiry-field";

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
        "Thanks for sharing your project. Your inquiry has been sent."
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
    <div className="home-inquiry">
      <div className="relative space-y-6">
        <div className="space-y-3">
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
                autoComplete="name"
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
                autoComplete="email"
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
                autoComplete="organization"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="Studio or brand"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted-foreground">Inquiry type</span>
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

          <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="Your target date"
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
              {isSubmitting ? "Sending..." : "Send inquiry"}
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
    </div>
  );
}
