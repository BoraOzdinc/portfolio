const BRAND = {
  mark: "ozdinc.dev_",
  name: "Bora Ozdinc",
  role: "Full-Stack Web Engineer",
  siteUrl: "https://ozdinc.dev",
};

export function buildInquiryEmailTemplate({
  name,
  email,
  company,
  subject,
  inquiryType,
  timeline,
  message,
}) {
  const safeName = name.trim();
  const safeEmail = email.trim();
  const safeCompany = company?.trim() || "Not provided";
  const safeSubject = subject.trim();
  const safeInquiryType = inquiryType.trim();
  const safeTimeline = timeline?.trim() || "Not provided";
  const safeMessage = message.trim();

  const previewText = `${safeName} sent a ${safeInquiryType.toLowerCase()} inquiry: ${truncate(safeSubject, 96)}`;

  return {
    text: buildInquiryEmailText({
      name: safeName,
      email: safeEmail,
      company: safeCompany,
      subject: safeSubject,
      inquiryType: safeInquiryType,
      timeline: safeTimeline,
      message: safeMessage,
    }),
    html: buildInquiryEmailHtml({
      name: safeName,
      email: safeEmail,
      company: safeCompany,
      subject: safeSubject,
      inquiryType: safeInquiryType,
      timeline: safeTimeline,
      message: safeMessage,
      previewText,
    }),
  };
}

function buildInquiryEmailText({
  name,
  email,
  company,
  subject,
  inquiryType,
  timeline,
  message,
}) {
  return [
    "New portfolio inquiry",
    "",
    `Subject: ${subject}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company}`,
    `Inquiry Type: ${inquiryType}`,
    `Timeline: ${timeline}`,
    "",
    "Message:",
    message,
    "",
    `Reply directly to continue with ${name}.`,
  ].join("\n");
}

function buildInquiryEmailHtml({
  name,
  email,
  company,
  subject,
  inquiryType,
  timeline,
  message,
  previewText,
}) {
  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedCompany = escapeHtml(company);
  const escapedSubject = escapeHtml(subject);
  const escapedInquiryType = escapeHtml(inquiryType);
  const escapedTimeline = escapeHtml(timeline);
  const escapedMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");
  const escapedPreview = escapeHtml(previewText);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Portfolio Inquiry</title>
  </head>
  <body style="margin:0; padding:0; background-color:#050505; color:#f5f5f5;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapedPreview}
    </div>
    <table
      role="presentation"
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      style="width:100%; border-collapse:collapse; background-color:#050505;"
    >
      <tr>
        <td
          align="center"
          style="padding:24px 14px 40px; background:
            radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 32%),
            radial-gradient(circle at 85% 16%, rgba(255,255,255,0.05), transparent 22%),
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0));"
        >
          <table
            role="presentation"
            width="100%"
            border="0"
            cellspacing="0"
            cellpadding="0"
            style="width:100%; max-width:680px; border-collapse:collapse;"
          >
            <tr>
              <td style="padding-bottom:16px;">
                <table
                  role="presentation"
                  width="100%"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="width:100%; border-collapse:collapse;"
                >
                  <tr>
                    <td style="padding:0 4px 0 0;">
                      <span style="
                        display:inline-block;
                        border:1px solid #202020;
                        border-radius:999px;
                        background-color:#0c0c0c;
                        padding:10px 16px;
                        font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
                        font-size:11px;
                        line-height:1;
                        letter-spacing:0.22em;
                        text-transform:uppercase;
                        color:#9ca3af;
                      ">
                        Portfolio Inquiry
                      </span>
                    </td>
                    <td align="right" style="font-family:'Space Grotesk','Segoe UI',Arial,sans-serif; font-size:15px; font-weight:600; letter-spacing:-0.03em; color:#f5f5f5;">
                      ${escapeHtml(BRAND.mark)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-bottom:16px;">
                <table
                  role="presentation"
                  width="100%"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="
                    width:100%;
                    border-collapse:separate;
                    border:1px solid #1f1f1f;
                    border-radius:28px;
                    background:
                      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)),
                      rgba(10,10,10,0.92);
                    box-shadow:0 32px 90px -56px rgba(255,255,255,0.35);
                  "
                >
                  <tr>
                    <td style="padding:32px 28px 28px;">
                      <div style="
                        display:inline-block;
                        border:1px solid #232323;
                        border-radius:999px;
                        background-color:#101010;
                        padding:8px 12px;
                        font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
                        font-size:11px;
                        line-height:1;
                        letter-spacing:0.18em;
                        text-transform:uppercase;
                        color:#9ca3af;
                      ">
                        New inquiry received
                      </div>

                      <h1 style="
                        margin:18px 0 12px;
                        font-family:'Space Grotesk','Segoe UI',Arial,sans-serif;
                        font-size:34px;
                        line-height:1.08;
                        letter-spacing:-0.05em;
                        color:#f5f5f5;
                      ">
                        ${escapedSubject}
                      </h1>

                      <p style="
                        margin:0 0 22px;
                        font-family:'Segoe UI',Arial,sans-serif;
                        font-size:16px;
                        line-height:1.7;
                        color:#b6b6b6;
                      ">
                        ${escapedName} sent a ${escapedInquiryType.toLowerCase()} inquiry${
    company === "Not provided" ? "" : ` for ${escapedCompany}`
  }. Reply directly to this email to continue the thread.
                      </p>

                      <div style="font-size:0; line-height:0;">
                        ${renderTag("Contact", escapedName)}
                        ${renderTag("Type", escapedInquiryType)}
                        ${renderTag("Timeline", escapedTimeline)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-bottom:16px;">
                <table
                  role="presentation"
                  width="100%"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="
                    width:100%;
                    border-collapse:separate;
                    border:1px solid #1b1b1b;
                    border-radius:24px;
                    background-color:#0b0b0b;
                  "
                >
                  <tr>
                    <td style="padding:24px 24px 12px;">
                      <p style="
                        margin:0;
                        font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
                        font-size:11px;
                        line-height:1;
                        letter-spacing:0.22em;
                        text-transform:uppercase;
                        color:#8b8b8b;
                      ">
                        Inquiry Snapshot
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 16px 16px;">
                      ${renderDetailCard("Name", escapedName)}
                      ${renderDetailCard(
    "Email",
    `<a href="mailto:${encodeURIComponent(email)}" style="color:#f5f5f5; text-decoration:none;">${escapedEmail}</a>`,
  )}
                      ${renderDetailCard("Company", escapedCompany)}
                      ${renderDetailCard("Inquiry Type", escapedInquiryType)}
                      ${renderDetailCard("Timeline", escapedTimeline)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-bottom:16px;">
                <table
                  role="presentation"
                  width="100%"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="
                    width:100%;
                    border-collapse:separate;
                    border:1px solid #1b1b1b;
                    border-radius:24px;
                    background-color:#0b0b0b;
                  "
                >
                  <tr>
                    <td style="padding:24px 24px 12px;">
                      <p style="
                        margin:0;
                        font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
                        font-size:11px;
                        line-height:1;
                        letter-spacing:0.22em;
                        text-transform:uppercase;
                        color:#8b8b8b;
                      ">
                        Project Brief
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px;">
                      <div style="
                        border:1px solid #222222;
                        border-radius:20px;
                        background:
                          linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)),
                          #101010;
                        padding:20px 20px 22px;
                      ">
                        <p style="
                          margin:0;
                          font-family:'Segoe UI',Arial,sans-serif;
                          font-size:16px;
                          line-height:1.85;
                          color:#e5e5e5;
                          white-space:normal;
                          word-break:break-word;
                        ">
                          ${escapedMessage}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td>
                <table
                  role="presentation"
                  width="100%"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="
                    width:100%;
                    border-collapse:separate;
                    border:1px solid #171717;
                    border-radius:22px;
                    background-color:#070707;
                  "
                >
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="
                        margin:0 0 8px;
                        font-family:'Space Grotesk','Segoe UI',Arial,sans-serif;
                        font-size:18px;
                        font-weight:600;
                        letter-spacing:-0.03em;
                        color:#f5f5f5;
                      ">
                        Reply workflow
                      </p>
                      <p style="
                        margin:0 0 14px;
                        font-family:'Segoe UI',Arial,sans-serif;
                        font-size:14px;
                        line-height:1.7;
                        color:#a3a3a3;
                      ">
                        Use your mail client&apos;s reply action to answer ${escapedName} directly. Their address is
                        <a href="mailto:${encodeURIComponent(email)}" style="color:#f5f5f5; text-decoration:none;"> ${escapedEmail}</a>.
                      </p>
                      <p style="
                        margin:0;
                        font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
                        font-size:11px;
                        line-height:1.6;
                        letter-spacing:0.14em;
                        text-transform:uppercase;
                        color:#7d7d7d;
                      ">
                        ${escapeHtml(BRAND.name)} | ${escapeHtml(BRAND.role)} | <a href="${BRAND.siteUrl}" style="color:#9ca3af; text-decoration:none;">${escapeHtml(BRAND.mark)}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderTag(label, value) {
  return `<span style="
    display:inline-block;
    margin:0 10px 10px 0;
    border:1px solid #222222;
    border-radius:999px;
    background-color:#0f0f0f;
    padding:10px 14px;
    vertical-align:top;
  ">
    <span style="
      display:block;
      margin-bottom:6px;
      font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
      font-size:10px;
      line-height:1;
      letter-spacing:0.2em;
      text-transform:uppercase;
      color:#7d7d7d;
    ">${label}</span>
    <span style="
      display:block;
      font-family:'Space Grotesk','Segoe UI',Arial,sans-serif;
      font-size:14px;
      line-height:1.4;
      color:#f5f5f5;
    ">${value}</span>
  </span>`;
}

function renderDetailCard(label, value) {
  return `<table
    role="presentation"
    width="100%"
    border="0"
    cellspacing="0"
    cellpadding="0"
    style="
      width:100%;
      border-collapse:collapse;
      border:1px solid #1f1f1f;
      border-radius:18px;
      background-color:#101010;
      margin-bottom:10px;
    "
  >
    <tr>
      <td style="padding:14px 16px 16px;">
        <p style="
          margin:0 0 7px;
          font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
          font-size:10px;
          line-height:1;
          letter-spacing:0.2em;
          text-transform:uppercase;
          color:#7d7d7d;
        ">${label}</p>
        <p style="
          margin:0;
          font-family:'Space Grotesk','Segoe UI',Arial,sans-serif;
          font-size:15px;
          line-height:1.6;
          color:#f5f5f5;
          word-break:break-word;
        ">${value}</p>
      </td>
    </tr>
  </table>`;
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
