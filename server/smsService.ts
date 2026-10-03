import { ENV } from "./_core/env";

export async function sendReceiptSms(to: string, receiptUrl: string, orderNumber: string) {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken || !ENV.twilioFromNumber) return false;
  const body = new URLSearchParams({ To: to, From: ENV.twilioFromNumber, Body: `Queen St BB receipt ${orderNumber}: ${receiptUrl}` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(ENV.twilioAccountSid)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    console.error("[SMS] Twilio send failed", response.status, await response.text());
    return false;
  }
  return true;
}
