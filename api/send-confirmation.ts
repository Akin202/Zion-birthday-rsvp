// Vercel serverless function: POST /api/send-confirmation
// Sends the guest a themed RSVP confirmation email via Resend, and (optionally)
// forwards a copy of the full RSVP details to the host.
//
// Required env var (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY     — API key from https://resend.com
// Optional env vars:
//   RSVP_FROM_EMAIL    — verified sender, e.g. `Zion's Spider HQ <rsvp@yourdomain.com>`
//                        (defaults to Resend's onboarding sender, which can only
//                        deliver to the Resend account owner's own inbox)
//   HOST_NOTIFY_EMAIL  — if set, the host receives a copy of every RSVP

import { eventConfig } from "../config/event.config";

interface ChildEntry {
  age?: number;
  gender?: string;
}

interface RsvpPayload {
  guestFullName?: string;
  email?: string;
  phone?: string;
  isAttending?: boolean;
  hasPlusOne?: boolean;
  plusOneName?: string;
  children?: ChildEntry[];
  hasNanny?: boolean;
  nannyCount?: number;
  dietaryNotes?: string;
  messageToCelebrant?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function headcount(p: RsvpPayload): number {
  if (!p.isAttending) return 0;
  const children = Array.isArray(p.children) ? p.children.length : 0;
  const nannies = p.hasNanny ? Number(p.nannyCount) || 0 : 0;
  return 1 + (p.hasPlusOne ? 1 : 0) + children + nannies;
}

const { event, celebrant, host } = eventConfig;
const whatsappUrl = `https://wa.me/${host.whatsappNumber}`;

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px;font-size:12px;font-weight:bold;color:#64748b;white-space:nowrap;">${label}</td>
    <td style="padding:6px 12px;font-size:14px;font-weight:bold;color:#111111;">${value}</td>
  </tr>`;
}

function buildGuestEmail(p: RsvpPayload): { subject: string; html: string } {
  const firstName = esc((p.guestFullName || "Hero").trim().split(/\s+/)[0]);
  const total = headcount(p);

  const rows: string[] = [detailRow("Primary Guest", esc(p.guestFullName))];
  if (p.isAttending) {
    if (p.hasPlusOne && p.plusOneName) rows.push(detailRow("Plus-One", esc(p.plusOneName)));
    if (Array.isArray(p.children) && p.children.length > 0) {
      rows.push(
        detailRow(
          "Little Heroes",
          `${p.children.length} (${p.children.map((c) => `Age ${esc(c.age)}`).join(", ")})`
        )
      );
    }
    if (p.hasNanny && Number(p.nannyCount) > 0)
      rows.push(detailRow("Caretakers", `${Number(p.nannyCount)}`));
    rows.push(detailRow("Total Heroes", `${total}`));
    if (p.dietaryNotes) rows.push(detailRow("Dietary Notes", esc(p.dietaryNotes)));
  }

  const attendingBlock = `
    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 16px;">
      Hi <strong>${firstName}</strong>, your spot at <strong>${esc(celebrant.name)}'s ${celebrant.age}th Birthday
      Spider-Verse Celebration</strong> is confirmed! 🕷️ Here is your mission briefing:
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:3px solid #111111;background:#FDF6E3;margin:0 0 20px;">
      ${detailRow("📅 Date", esc(event.dateDisplay))}
      ${detailRow("⏰ Time", esc(event.timeDisplay))}
      ${detailRow("📍 Venue", esc(event.venueAddress))}
      ${detailRow("🦸 Dress Code", esc(event.dressCode))}
    </table>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:3px solid #111111;background:#ffffff;margin:0 0 20px;">
      <tr><td colspan="2" style="padding:8px 12px;background:#111111;color:#FFD700;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Your RSVP Summary</td></tr>
      ${rows.join("")}
    </table>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:2px dashed #E62429;background:#FFF7ED;margin:0 0 20px;">
      <tr><td style="padding:12px 14px;font-size:14px;color:#111111;line-height:1.5;">
        <strong>🎒 Hero tip:</strong> Spider-suits can get warm after all that web-slinging!
        Please pack a spare change of clothes for your little hero so they can switch into
        something comfy if the costume gets too hot.
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
      <tr>
        <td style="padding:0 6px;">
          <a href="${event.googleMapsUrl}" style="display:inline-block;background:#114593;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 18px;border:3px solid #111111;">📍 Get Directions</a>
        </td>
        <td style="padding:0 6px;">
          <a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 18px;border:3px solid #111111;">💬 Message ${esc(host.contactName)}</a>
        </td>
      </tr>
    </table>`;

  const declinedBlock = `
    <p style="font-size:16px;line-height:1.6;color:#111111;margin:0 0 16px;">
      Hi <strong>${firstName}</strong>, thank you for letting us know you can't make it to
      <strong>${esc(celebrant.name)}'s ${celebrant.age}th Birthday Celebration</strong>. You'll be missed at
      Spider HQ! 💛
    </p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 16px;">
      If your plans change before ${esc(event.rsvpDeadlineDisplay)}, just message
      <a href="${whatsappUrl}" style="color:#114593;font-weight:bold;">${esc(host.contactName)} on WhatsApp</a>
      and we'll save you a spot.
    </p>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FDF6E3;font-family:Verdana,Geneva,sans-serif;">
    <table cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;padding:24px 12px;">
      <tr><td>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#114593;border:4px solid #111111;">
          <tr><td style="padding:24px;text-align:center;">
            <div style="display:inline-block;background:#FFD700;color:#111111;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;padding:6px 14px;border:2px solid #111111;margin-bottom:12px;">
              🕷️ Spider HQ Dispatch
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;text-transform:uppercase;letter-spacing:1px;">
              ${p.isAttending ? "THWIP! YOU'RE IN!" : "WE'LL MISS YOU, HERO!"}
            </h1>
          </td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#ffffff;border:4px solid #111111;border-top:0;">
          <tr><td style="padding:24px;">
            ${p.isAttending ? attendingBlock : declinedBlock}
            <p style="font-size:12px;color:#64748b;margin:16px 0 0;text-align:center;">
              Need to change anything? Message ${esc(host.contactName)} on
              <a href="${whatsappUrl}" style="color:#114593;">WhatsApp</a>.
            </p>
          </td></tr>
        </table>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">
          ${esc(event.title)} • ${esc(event.dateDisplay)}
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

  const subject = p.isAttending
    ? `🕷️ You're confirmed for ${celebrant.name}'s ${celebrant.age}th Birthday — ${event.dateDisplay}`
    : `We'll miss you at ${celebrant.name}'s ${celebrant.age}th Birthday`;

  return { subject, html };
}

function buildHostEmail(p: RsvpPayload): { subject: string; html: string } {
  const total = headcount(p);
  const rows = [
    detailRow("Guest", esc(p.guestFullName)),
    detailRow("Email", esc(p.email)),
    detailRow("Phone", esc(p.phone)),
    detailRow("Attending", p.isAttending ? "YES" : "NO"),
    detailRow("Plus-One", p.hasPlusOne ? esc(p.plusOneName || "Yes") : "No"),
    detailRow(
      "Children",
      Array.isArray(p.children) && p.children.length > 0
        ? p.children.map((c) => `Age ${esc(c.age)} (${esc(c.gender)})`).join(", ")
        : "None"
    ),
    detailRow("Caretakers", p.hasNanny ? `${Number(p.nannyCount) || 0}` : "None"),
    detailRow("Total Headcount", `${total}`),
    detailRow("Dietary Notes", esc(p.dietaryNotes || "—")),
    detailRow("Message to " + esc(celebrant.name), esc(p.messageToCelebrant || "—")),
    detailRow("Submitted", new Date().toISOString()),
  ];

  return {
    subject: `RSVP: ${p.guestFullName} — ${p.isAttending ? `ATTENDING (${total})` : "NOT ATTENDING"}`,
    html: `<table cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;border:2px solid #111111;font-family:Verdana,Geneva,sans-serif;">${rows.join("")}</table>`,
  };
}

async function sendViaResend(
  apiKey: string,
  payload: { from: string; to: string[]; reply_to?: string; subject: string; html: string }
): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Email service is not configured (missing RESEND_API_KEY)" });
  }

  const p: RsvpPayload = req.body && typeof req.body === "object" ? req.body : {};

  if (!p.guestFullName || String(p.guestFullName).trim().length < 3) {
    return res.status(400).json({ error: "A valid guest name is required" });
  }
  if (!p.email || !EMAIL_RE.test(String(p.email))) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (Date.now() > new Date(event.rsvpDeadline).getTime()) {
    return res.status(403).json({ error: "The RSVP deadline has passed" });
  }

  const from = process.env.RSVP_FROM_EMAIL || `${celebrant.name}'s Spider HQ <onboarding@resend.dev>`;
  const hostEmail = process.env.HOST_NOTIFY_EMAIL;

  const guestEmail = buildGuestEmail(p);
  const guestSend = await sendViaResend(apiKey, {
    from,
    to: [String(p.email)],
    ...(hostEmail ? { reply_to: hostEmail } : {}),
    subject: guestEmail.subject,
    html: guestEmail.html,
  });

  if (!guestSend.ok) {
    const detail = await guestSend.text().catch(() => "");
    console.error("Resend guest email failed:", guestSend.status, detail);
    return res.status(502).json({ error: "Failed to send confirmation email" });
  }

  // Best-effort copy to the host so every RSVP lands in their inbox too.
  if (hostEmail) {
    try {
      const hostMsg = buildHostEmail(p);
      const hostSend = await sendViaResend(apiKey, {
        from,
        to: [hostEmail],
        ...(EMAIL_RE.test(String(p.email)) ? { reply_to: String(p.email) } : {}),
        subject: hostMsg.subject,
        html: hostMsg.html,
      });
      if (!hostSend.ok) {
        console.error("Resend host copy failed:", hostSend.status, await hostSend.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Resend host copy threw:", err);
    }
  }

  return res.status(200).json({ ok: true });
}
