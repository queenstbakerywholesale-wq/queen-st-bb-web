import { getDb } from "../server/db";
import { sendEmail } from "../server/emailService";
import { branchReportHtml, buildBranchPeriodReport } from "../server/branchReport";

const REPORT_TO = process.env.DAILY_REPORT_EMAIL || "queenstreet.australia@gmail.com";

function melbourneIsoDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const date = melbourneIsoDate(yesterday);
  const input = { startDate: date, endDate: date, group: "day" as const };
  const rows = await buildBranchPeriodReport(db, input);
  const sent = await sendEmail({
    to: REPORT_TO,
    subject: `Queen St BB daily sales report · ${date}`,
    html: branchReportHtml(rows, input),
  });
  if (!sent) throw new Error("Daily branch report email was not accepted");
  console.log(`[Daily branch report] Sent ${date} report to ${REPORT_TO}`);
}

main().catch((error) => {
  console.error("[Daily branch report] Failed", error);
  process.exitCode = 1;
});
