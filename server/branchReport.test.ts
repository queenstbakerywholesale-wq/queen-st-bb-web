import { describe, expect, it } from "vitest";
import { branchReportHtml } from "./branchReport";

describe("branch period sales report", () => {
  it("renders branch, card sales, and the 0.6% Zeller fee in the email table", () => {
    const html = branchReportHtml([
      { branchId: 1, branchName: "Hawthorn", period: "Monday", totalSales: 100, cardSales: 50, cashSales: 50, zellerFee: 0.3, afterZellerFee: 99.7, orderCount: 4 },
    ], { startDate: "2026-10-04", endDate: "2026-10-04", group: "weekday" });
    expect(html).toContain("Hawthorn");
    expect(html).toContain("-$0.30");
    expect(html).toContain("Zeller fee (0.6%)");
    expect(html).toContain("$99.70");
  });
});
