import { Resend } from "resend";
import { buildInquiryEmailTemplate } from "./inquiry-email-template.mjs";

const DEFAULT_INQUIRY_TO_EMAIL = "boraozdinc@hotmail.com";

export class InquiryError extends Error {
  constructor(status, message, cause) {
    super(message);
    this.name = "InquiryError";
    this.status = status;
    this.cause = cause;
  }
}

export function parseInquiryPayload(input) {
  const {
    name,
    email,
    company,
    subject,
    inquiryType,
    timeline,
    message,
    website,
  } = input ?? {};

  if (website) {
    throw new InquiryError(400, "Invalid submission.");
  }

  if (!isValidString(name, 120)) {
    throw new InquiryError(400, "A valid name is required.");
  }

  if (!isValidEmail(email)) {
    throw new InquiryError(400, "A valid email is required.");
  }

  if (!isValidString(subject, 160)) {
    throw new InquiryError(400, "A valid subject is required.");
  }

  if (!isValidString(inquiryType, 80)) {
    throw new InquiryError(400, "A valid inquiry type is required.");
  }

  if (!isValidString(message, 4000)) {
    throw new InquiryError(400, "A message is required.");
  }

  if (!isValidOptionalString(company, 120) || !isValidOptionalString(timeline, 120)) {
    throw new InquiryError(400, "One or more optional fields are invalid.");
  }

  return {
    name: name.trim(),
    email: email.trim(),
    company: typeof company === "string" ? company.trim() : "",
    subject: subject.trim(),
    inquiryType: inquiryType.trim(),
    timeline: typeof timeline === "string" ? timeline.trim() : "",
    message: message.trim(),
  };
}

export async function sendInquiryEmail(payload, environment = process.env) {
  const resendApiKey = environment.RESEND_API_KEY;
  const resendFromEmail = environment.RESEND_FROM_EMAIL;
  const inquiryToEmail =
    environment.INQUIRY_TO_EMAIL || DEFAULT_INQUIRY_TO_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    throw new InquiryError(
      500,
      "Resend configuration is incomplete. Set RESEND_API_KEY and RESEND_FROM_EMAIL."
    );
  }

  const inquiryEmail = buildInquiryEmailTemplate(payload);
  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: [inquiryToEmail],
    replyTo: payload.email,
    subject: `[Portfolio Inquiry] ${payload.subject}`,
    text: inquiryEmail.text,
    html: inquiryEmail.html,
  });

  if (error) {
    throw new InquiryError(
      500,
      "The inquiry could not be sent right now. Please try again later.",
      error
    );
  }
}

function isValidString(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function isValidOptionalString(value, maxLength) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "string" && value.trim().length <= maxLength)
  );
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
