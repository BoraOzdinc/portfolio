import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { Resend } from "resend";
import { buildInquiryEmailTemplate } from "./inquiry-email-template.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);
const distPath = path.resolve(__dirname, "../dist");
const inquiryToEmail =
  process.env.INQUIRY_TO_EMAIL || "boraozdinc@hotmail.com";
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

app.use(express.json({ limit: "1mb" }));

function getResendClient() {
  if (!resendApiKey || !resendFromEmail) {
    throw new Error(
      "Resend configuration is incomplete. Set RESEND_API_KEY and RESEND_FROM_EMAIL."
    );
  }

  return {
    resend: new Resend(resendApiKey),
    fromEmail: resendFromEmail,
  };
}

function isValidString(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isValidOptionalString(value, maxLength) {
  return value === undefined || value === null || value === "" || (typeof value === "string" && value.trim().length <= maxLength);
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

app.post("/api/inquiry", async (req, res) => {
  const {
    name,
    email,
    company,
    subject,
    inquiryType,
    timeline,
    message,
    website,
  } = req.body ?? {};

  if (website) {
    return res.status(400).json({ error: "Invalid submission." });
  }

  if (!isValidString(name, 120)) {
    return res.status(400).json({ error: "A valid name is required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required." });
  }

  if (!isValidString(subject, 160)) {
    return res.status(400).json({ error: "A valid subject is required." });
  }

  if (!isValidString(inquiryType, 80)) {
    return res.status(400).json({ error: "A valid inquiry type is required." });
  }

  if (!isValidString(message, 4000)) {
    return res.status(400).json({ error: "A message is required." });
  }

  if (!isValidOptionalString(company, 120) || !isValidOptionalString(timeline, 120)) {
    return res.status(400).json({ error: "One or more optional fields are invalid." });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedCompany = typeof company === "string" ? company.trim() : "";
  const trimmedSubject = subject.trim();
  const trimmedInquiryType = inquiryType.trim();
  const trimmedTimeline = typeof timeline === "string" ? timeline.trim() : "";
  const trimmedMessage = message.trim();
  const inquiryEmail = buildInquiryEmailTemplate({
    name: trimmedName,
    email: trimmedEmail,
    company: trimmedCompany,
    subject: trimmedSubject,
    inquiryType: trimmedInquiryType,
    timeline: trimmedTimeline,
    message: trimmedMessage,
  });

  try {
    const { resend, fromEmail } = getResendClient();
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [inquiryToEmail],
      replyTo: trimmedEmail,
      subject: `[Portfolio Inquiry] ${trimmedSubject}`,
      text: inquiryEmail.text,
      html: inquiryEmail.html,
    });

    if (error) {
      console.error("Failed to send inquiry email:", error);
      return res.status(500).json({
        error: "The inquiry could not be sent right now. Please try again later.",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to send inquiry email:", error);
    return res.status(500).json({
      error: "The inquiry could not be sent right now. Please try again later.",
    });
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api\/).*/, (_req, res) => {
    return res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Inquiry server listening on http://localhost:${port}`);
});
