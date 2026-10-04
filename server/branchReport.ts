import { and, desc, eq, gte, lte } from "drizzle-orm";
import { branches, posOrders } from "../drizzle/schema";

export type BranchReportGroup = "day" | "weekday" | "month" | "year";

export type BranchReportRow = {
  branchId: number;
  branchName: string;
  period: string;
  totalSales: number;
  cardSales: number;
  cashSales: number;
  zellerFee: number;
  afterZellerFee: number;
  orderCount: number;
};

function periodKey(date: Date, group: BranchReportGroup): string {
  if (group === "day") return date.toISOString().slice(0, 10);
  if (group === "month") return date.toISOString().slice(0, 7);
  if (group === "year") return date.toISOString().slice(0, 4);
  return new Intl.DateTimeFormat("en-AU", { weekday: "long", timeZone: "Australia/Melbourne" }).format(date);
}

export async function buildBranchPeriodReport(
  db: any,
  input: { startDate: string; endDate: string; group: BranchReportGroup },
): Promise<BranchReportRow[]> {
  const [branchRows, orders] = await Promise.all([
    db.select({ id: branches.id, name: branches.name }).from(branches).where(eq(branches.isActive, true)).orderBy(branches.id),
    db.select().from(posOrders).where(and(
      gte(posOrders.createdAt, new Date(input.startDate)),
      lte(posOrders.createdAt, new Date(`${input.endDate}T23:59:59`)),
      eq(posOrders.paymentStatus, "paid"),
    )).orderBy(desc(posOrders.createdAt)),
  ]);

  const branchById = new Map<number, string>(branchRows.map((branch: { id: number; name: string }) => [branch.id, branch.name]));
  const rows = new Map<string, BranchReportRow>();
  for (const order of orders) {
    const branchName = branchById.get(order.branchId) || `Branch ${order.branchId}`;
    const period = periodKey(new Date(order.createdAt), input.group);
    const key = `${order.branchId}:${period}`;
    const current = rows.get(key) || {
      branchId: order.branchId,
      branchName,
      period,
      totalSales: 0,
      cardSales: 0,
      cashSales: 0,
      zellerFee: 0,
      afterZellerFee: 0,
      orderCount: 0,
    };
    const amount = Number(order.total || 0);
    current.totalSales += amount;
    current.orderCount += 1;
    if (order.paymentMethod === "card") {
      current.cardSales += amount;
      current.zellerFee += amount * 0.006;
    } else if (order.paymentMethod === "cash") {
      current.cashSales += amount;
    }
    current.afterZellerFee = current.totalSales - current.zellerFee;
    rows.set(key, current);
  }

  return Array.from(rows.values()).sort((a, b) => a.branchName.localeCompare(b.branchName) || a.period.localeCompare(b.period));
}

export function branchReportHtml(rows: BranchReportRow[], input: { startDate: string; endDate: string; group: BranchReportGroup }): string {
  const total = rows.reduce((sum, row) => sum + row.totalSales, 0);
  const card = rows.reduce((sum, row) => sum + row.cardSales, 0);
  const fee = rows.reduce((sum, row) => sum + row.zellerFee, 0);
  const body = rows.length
    ? rows.map((row, index) => `<tr style="background:${index % 2 ? "#fbf7f1" : "#ffffff"}"><td style="padding:11px 10px;border-bottom:1px solid #eee5da;font-weight:600">${row.branchName}</td><td style="padding:11px 10px;border-bottom:1px solid #eee5da;color:#77665b">${row.period}</td><td style="padding:11px 10px;border-bottom:1px solid #eee5da;text-align:right">${row.orderCount}</td><td style="padding:11px 10px;border-bottom:1px solid #eee5da;text-align:right;font-weight:600">$${row.totalSales.toFixed(2)}</td><td style="padding:11px 10px;border-bottom:1px solid #eee5da;text-align:right">$${row.cardSales.toFixed(2)}</td><td style="padding:11px 10px;border-bottom:1px solid #eee5da;text-align:right;color:#8b5b43">-$${row.zellerFee.toFixed(2)}</td><td style="padding:11px 10px;border-bottom:1px solid #eee5da;text-align:right">$${row.afterZellerFee.toFixed(2)}</td></tr>`).join("")
    : `<tr><td colspan="7" style="padding:24px;text-align:center;color:#88786b">No paid POS sales for this period.</td></tr>`;
  const stat = (label: string, value: string, accent: string) => `<td style="width:33.33%;padding:0 5px"><div style="background:#fff;border:1px solid #eadfd2;border-radius:8px;padding:14px 12px"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9b8a7b">${label}</div><div style="font-family:Georgia,serif;font-size:22px;color:${accent};margin-top:5px">${value}</div></div></td>`;
  return `<!doctype html><html><head><meta name="color-scheme" content="light"></head><body style="margin:0;background:#f3eee7;font-family:Arial,Helvetica,sans-serif;color:#35271f"><div style="max-width:760px;margin:0 auto;padding:28px 14px"><div style="background:#3d2c24;border-radius:12px 12px 0 0;padding:22px 24px;color:#fffaf2"><table role="presentation" width="100%" style="border-collapse:collapse"><tr><td><div style="display:inline-block;width:38px;height:38px;line-height:38px;border-radius:50%;background:#fffaf2;color:#3d2c24;text-align:center;font-family:Georgia,serif;font-size:24px;font-style:italic">Q</div></td><td style="padding-left:12px"><div style="font-family:Georgia,serif;font-size:18px;letter-spacing:.12em">QUEEN ST BB</div><div style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#d9c8b6;margin-top:4px">A dessert atelier</div></td><td style="text-align:right;font-size:10px;letter-spacing:.14em;color:#d9c8b6">DAILY REPORT</td></tr></table></div><div style="background:#fffaf2;padding:26px 24px;border:1px solid #eadfd2;border-top:0;border-radius:0 0 12px 12px"><div style="margin-bottom:20px"><h1 style="font-family:Georgia,serif;font-size:27px;font-weight:400;margin:0 0 7px;color:#3d2c24">Branch sales overview</h1><p style="font-size:13px;line-height:1.5;color:#77665b;margin:0">${input.startDate} to ${input.endDate} · grouped by ${input.group}</p></div><table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:22px"><tr>${stat("Total sales", `AUD $${total.toFixed(2)}`, "#3d2c24")}${stat("Card sales", `AUD $${card.toFixed(2)}`, "#7b5b49")}${stat("Zeller fee · 0.6%", `AUD $${fee.toFixed(2)}`, "#a86f52")}</tr></table><div style="overflow-x:auto"><table role="presentation" style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr style="background:#3d2c24;color:#fffaf2">${["Branch","Period","Orders","Total sales","Card sales","Zeller fee","After fee"].map((label) => `<th style="padding:11px 10px;text-align:${["Orders","Total sales","Card sales","Zeller fee","After fee"].includes(label) ? "right" : "left"};font-size:10px;letter-spacing:.05em;font-weight:600">${label}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div><p style="font-size:11px;line-height:1.5;color:#8b7a6c;margin:20px 0 0">Zeller fee is calculated as 0.6% of card POS sales. This report covers paid POS orders from Hawthorn, Windsor, and CBD.</p></div><div style="text-align:center;padding:16px 10px;color:#9b8a7b;font-size:10px;letter-spacing:.05em">QUEEN ST BB · MELBOURNE</div></div></body></html>`;
}
