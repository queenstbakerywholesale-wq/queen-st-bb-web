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
    ? rows.map((row) => `<tr><td>${row.branchName}</td><td>${row.period}</td><td>${row.orderCount}</td><td>$${row.totalSales.toFixed(2)}</td><td>$${row.cardSales.toFixed(2)}</td><td>-$${row.zellerFee.toFixed(2)}</td><td>$${row.afterZellerFee.toFixed(2)}</td></tr>`).join("")
    : `<tr><td colspan="7">No paid POS sales for this period.</td></tr>`;
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#35271f"><h1 style="font-family:Georgia,serif">Queen St BB · Branch Sales Report</h1><p>${input.startDate} to ${input.endDate} · grouped by ${input.group}</p><p><strong>Total sales:</strong> AUD $${total.toFixed(2)} &nbsp; <strong>Card sales:</strong> AUD $${card.toFixed(2)} &nbsp; <strong>Zeller fee:</strong> AUD $${fee.toFixed(2)}</p><table style="border-collapse:collapse;width:100%"><thead><tr>${["Branch","Period","Orders","Total sales","Card sales","Zeller fee (0.6%)","After fee"].map((label) => `<th style="text-align:left;border-bottom:1px solid #cdb9a8;padding:8px">${label}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table><p style="color:#806c5d;font-size:12px">Zeller fee is calculated as 0.6% of card POS sales.</p></body></html>`;
}
