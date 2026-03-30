import { InquiryError, parseInquiryPayload, sendInquiryEmail } from "../server/inquiry-service.mjs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const payload = parseInquiryPayload(body);

    await sendInquiryEmail(payload);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to send inquiry email:", error);

    if (error instanceof InquiryError && error.status < 500) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      {
        error: "The inquiry could not be sent right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}
