/**
 * Confirmation email rendering and dispatch.
 *
 * Lives under supabase/functions rather than lib/ deliberately: this only ever
 * runs server-side, and anything in lib/ risks being pulled into the guest
 * bundle by an innocent-looking import.
 *
 * Constraints, in order of importance:
 *
 * 1. The primary reader is Gmail on a mid-range Android. Gmail strips <style>
 *    blocks, so every rule is inlined, and layout is tables — flexbox and grid
 *    are not reliable there.
 * 2. Gmail clips messages over ~102 KB, hiding the edit link behind a "View
 *    entire message" tap. These templates render well under 10 KB.
 * 3. Colours come from eventConfig.theme so the white-label promise holds for
 *    email too, not just the site.
 */

import { eventConfig } from '../../../config/event.config.ts';

// Declared locally so the pure render functions can be unit-tested from the
// browser-side Vitest project, which has no Deno types.
declare const Deno: { env: { get(key: string): string | undefined } };

const { celebrant, event, host, confirmation, theme } = eventConfig;

export interface ConfirmationEmailInput {
  guestFullName: string;
  email: string;
  isAttending: boolean;
  editToken: string;
  totalHeadcount: number;
  childCount: number;
  hasPlusOne: boolean;
  nannyCount: number;
}

/**
 * Minimal HTML entity escape. Guest names and notes are attacker-controlled
 * text arriving from a public form, and they get interpolated into markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function editUrl(editToken: string): string {
  return `${confirmation.siteUrl}/rsvp/edit?token=${encodeURIComponent(editToken)}`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#555555;border-bottom:1px solid #EEEEEE;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:${theme.ink};font-weight:bold;text-align:right;border-bottom:1px solid #EEEEEE;">${escapeHtml(value)}</td>
  </tr>`;
}

function layout(accent: string, heading: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${theme.newsprint};font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.newsprint};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border:3px solid ${theme.ink};border-radius:8px;">
    <tr>
      <td style="background-color:${accent};padding:24px;text-align:center;border-bottom:3px solid ${theme.ink};">
        <h1 style="margin:0;font-size:24px;line-height:1.2;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(heading)}</h1>
      </td>
    </tr>
    <tr><td style="padding:24px;">${body}</td></tr>
    <tr>
      <td style="padding:16px 24px;background-color:#F5F5F5;border-top:1px solid #DDDDDD;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#666666;">
          Questions? Message ${escapeHtml(host.contactName)} on WhatsApp at ${escapeHtml(host.contactPhone)}.
        </p>
        <p style="margin:0;font-size:11px;color:#999999;">
          ${escapeHtml(event.title)}
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function attendingBody(input: ConfirmationEmailInput): string {
  const partyParts = [
    `${1 + (input.hasPlusOne ? 1 : 0)} adult${input.hasPlusOne ? 's' : ''}`,
    input.childCount > 0
      ? `${input.childCount} child${input.childCount === 1 ? '' : 'ren'}`
      : null,
    input.nannyCount > 0
      ? `${input.nannyCount} nann${input.nannyCount === 1 ? 'y' : 'ies'}`
      : null,
  ].filter((part): part is string => part !== null);

  return `
    <p style="margin:0 0 16px;font-size:16px;color:${theme.ink};">
      Hi ${escapeHtml(input.guestFullName.split(' ')[0])},
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#444444;">
      ${escapeHtml(confirmation.attendingMessage)}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      ${row('Date', event.dateDisplay)}
      ${row('Time', event.timeDisplay)}
      ${row('Venue', event.venueName)}
      ${row('Address', event.venueAddress)}
      ${row('Dress code', event.dressCode)}
      ${row('Your party', partyParts.join(', '))}
      ${row('Total expected', `${input.totalHeadcount} ${input.totalHeadcount === 1 ? 'person' : 'people'}`)}
    </table>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#444444;">
      ${escapeHtml(confirmation.additionalInfo)}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="background-color:${theme.heroBlue};border-radius:6px;">
          <a href="${event.googleMapsUrl}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">Get directions</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#444444;">
      Need to change your numbers? Nothing is final until ${escapeHtml(event.rsvpDeadlineDisplay)}:
    </p>
    <p style="margin:0;font-size:14px;">
      <a href="${editUrl(input.editToken)}" style="color:${theme.heroBlue};font-weight:bold;">Update my RSVP</a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#888888;">
      Keep this email — that link is the only way back into your RSVP.
    </p>
  `;
}

function decliningBody(input: ConfirmationEmailInput): string {
  return `
    <p style="margin:0 0 16px;font-size:16px;color:${theme.ink};">
      Hi ${escapeHtml(input.guestFullName.split(' ')[0])},
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#444444;">
      ${escapeHtml(confirmation.decliningMessage)}
    </p>
    <p style="margin:0 0 8px;font-size:14px;color:#444444;">
      If your plans change before ${escapeHtml(event.rsvpDeadlineDisplay)}, you can still join us:
    </p>
    <p style="margin:0;font-size:14px;">
      <a href="${editUrl(input.editToken)}" style="color:${theme.heroBlue};font-weight:bold;">Change my RSVP</a>
    </p>
  `;
}

export function renderConfirmationEmail(input: ConfirmationEmailInput): {
  subject: string;
  html: string;
} {
  if (input.isAttending) {
    return {
      subject: confirmation.attendingSubject,
      html: layout(
        theme.heroRed,
        `${celebrant.name} turns ${celebrant.age}!`,
        attendingBody(input),
      ),
    };
  }

  return {
    subject: confirmation.decliningSubject,
    html: layout(theme.heroBlue, 'RSVP received', decliningBody(input)),
  };
}

/**
 * Sends via Resend.
 *
 * Never throws. A failed email must not turn a saved RSVP into a visible error
 * for the guest — they filled the form, the row landed, and that is the thing
 * that matters. Failures are logged for the operator instead.
 */
export async function sendConfirmationEmail(
  input: ConfirmationEmailInput,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set; skipping confirmation email');
    return { sent: false, reason: 'not-configured' };
  }

  const { subject, html } = renderConfirmationEmail(input);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${confirmation.fromName} <${confirmation.fromEmail}>`,
        to: [input.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error(`[email] Resend rejected the send (${res.status}): ${detail}`);
      return { sent: false, reason: `resend-${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] confirmation send threw:', err);
    return { sent: false, reason: 'network' };
  }
}
