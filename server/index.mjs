import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { InquiryError, parseInquiryPayload, sendInquiryEmail } from "./inquiry-service.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);
const distPath = path.resolve(__dirname, "../dist");

app.use(express.json({ limit: "1mb" }));

app.post("/api/inquiry", async (req, res) => {
  try {
    const payload = parseInquiryPayload(req.body);
    await sendInquiryEmail(payload);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to send inquiry email:", error);

    if (error instanceof InquiryError && error.status < 500) {
      return res.status(error.status).json({ error: error.message });
    }

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
