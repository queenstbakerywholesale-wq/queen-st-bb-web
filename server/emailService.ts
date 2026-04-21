/**
 * Email Service — sends transactional emails to customers.
 *
 * When RESEND_API_KEY is configured, emails are delivered via Resend.
 * Otherwise, a summary is sent to the project owner through the
 * built-in notification channel as a fallback.
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(ENV.resendApiKey);
  }
  return resendClient;
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Send an email to a customer.
 *
 * Returns `true` when the email was accepted for delivery (Resend)
 * or when the fallback owner notification succeeded.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const resend = getResend();

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: `Queen St BB <${ENV.senderEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo,
      });

      if (error) {
        console.warn("[Email] Resend error:", error.message);
        // Fall through to owner notification
      } else {
        console.log(`[Email] Sent to ${payload.to}: ${payload.subject}`);
        return true;
      }
    } catch (err) {
      console.warn("[Email] Resend exception:", err);
      // Fall through to owner notification
    }
  }

  // Fallback: notify the project owner with a summary
  console.log(`[Email] No email provider configured — sending summary to owner for: ${payload.to}`);
  try {
    return await notifyOwner({
      title: `Customer Email (${payload.to}): ${payload.subject}`,
      content: `An order confirmation email was generated for ${payload.to} but could not be delivered because no email provider (Resend) is configured.\n\nTo enable customer emails, add your RESEND_API_KEY in Settings > Secrets.\n\nSubject: ${payload.subject}`,
    });
  } catch {
    return false;
  }
}
