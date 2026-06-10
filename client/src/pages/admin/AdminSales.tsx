/**
 * Admin Sales Dashboard — View sales by item, hour, branch, and totals
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export default function AdminSales() {
  const { data: branches = [] } = trpc.adminStaff.branches.useQuery();
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: today.toISOString().slice(0, 10),
    };
  });

  const { data: salesData, isLoading } = trpc.pos.salesSummary.useQuery({
    branchId: selectedBranch,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
    color: "oklch(0.34 0.05 45)",
    padding: "8px 12px",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
          Sales Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
          POS 매출 현황을 확인합니다.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select style={inputStyle} value={selectedBranch || ""} onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All Branches</option>
          {branches.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name.replace("Queen St BB — ", "")}</option>
          ))}
        </select>
        <input type="date" style={inputStyle} value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
        <span style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>—</span>
        <input type="date" style={inputStyle} value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>Loading...</div>
      ) : salesData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Total Sales" value={`$${salesData.totalSales.toFixed(2)}`} />
            <SummaryCard label="Orders" value={salesData.orderCount.toString()} />
            <SummaryCard label="Avg Order" value={`$${salesData.avgOrder.toFixed(2)}`} />
          </div>

          {/* Hourly Chart */}
          {salesData.hourly && (
            <div className="p-4" style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
              <h3 className="text-sm font-medium mb-4" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                Hourly Sales
              </h3>
              <div className="flex items-end gap-1 h-32">
                {salesData.hourly.map((val: number, hour: number) => {
                  const max = Math.max(...salesData.hourly, 1);
                  const height = (val / max) * 100;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full transition-all"
                        style={{ height: `${height}%`, backgroundColor: val > 0 ? "oklch(0.34 0.05 45)" : "oklch(0.84 0.025 72 / 0.3)", minHeight: "2px" }}
                        title={`${hour}:00 — $${val.toFixed(2)}`}
                      />
                      {hour % 3 === 0 && (
                        <span className="text-[8px]" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>{hour}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Trend */}
          {salesData.orders && salesData.orders.length > 0 && (
            <DailyTrendChart orders={salesData.orders} />
          )}

          {/* Top Items */}
          {salesData.items && salesData.items.length > 0 && (
            <div className="p-4" style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
              <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                Top Items
              </h3>
              <div className="space-y-2">
                {salesData.items.slice(0, 15).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid oklch(0.84 0.025 72 / 0.3)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] w-5" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>#{i + 1}</span>
                      <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                        ×{item.quantity}
                      </span>
                      <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                        ${item.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
          <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>No sales data for this period</p>
        </div>
      )}
    </div>
  );
}

function DailyTrendChart({ orders }: { orders: any[] }) {
  const dailyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      const date = new Date(order.createdAt).toISOString().slice(0, 10);
      map.set(date, (map.get(date) || 0) + parseFloat(order.total));
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders]);

  if (dailyMap.length === 0) return null;
  const maxVal = Math.max(...dailyMap.map(([, v]) => v), 1);

  return (
    <div className="p-4" style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <h3 className="text-sm font-medium mb-4" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
        Daily Revenue
      </h3>
      <div className="flex items-end gap-1 h-32">
        {dailyMap.map(([date, val]) => {
          const height = (val / maxVal) * 100;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full transition-all"
                style={{ height: `${height}%`, backgroundColor: "oklch(0.45 0.15 145)", minHeight: "2px" }}
                title={`${date}: $${val.toFixed(2)}`}
              />
              <span className="text-[7px] whitespace-nowrap" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>
                {date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 text-center" style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <p className="text-[10px] uppercase mb-1" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
        {label}
      </p>
      <p className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
        {value}
      </p>
    </div>
  );
}
