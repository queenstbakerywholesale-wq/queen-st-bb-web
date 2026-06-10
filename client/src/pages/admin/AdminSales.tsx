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

  // Fetch all-branch data for comparison (only when "All Branches" is selected)
  const { data: branchCompareData } = trpc.pos.salesSummary.useQuery(
    { startDate: dateRange.startDate, endDate: dateRange.endDate },
    { enabled: !selectedBranch }
  );

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
    color: "oklch(0.34 0.05 45)",
    padding: "8px 12px",
  };

  // Branch comparison data
  const branchSalesMap = useMemo(() => {
    if (!branchCompareData?.orders || branches.length === 0) return [];
    const map = new Map<number, { name: string; total: number; count: number }>();
    for (const b of branches) {
      map.set(b.id, { name: (b.name as string).replace("Queen St BB — ", ""), total: 0, count: 0 });
    }
    for (const order of branchCompareData.orders) {
      const entry = map.get(order.branchId);
      if (entry) {
        entry.total += parseFloat(order.total);
        entry.count += 1;
      }
    }
    return Array.from(map.values()).filter((b) => b.total > 0 || b.count > 0);
  }, [branchCompareData, branches]);

  // CSV export
  const exportCSV = () => {
    if (!salesData?.orders || salesData.orders.length === 0) return;
    const headers = ["Order #", "Date", "Time", "Branch", "Payment", "Total"];
    const rows = salesData.orders.map((o: any) => {
      const d = new Date(o.createdAt);
      const branchName = branches.find((b: any) => b.id === o.branchId)?.name?.replace("Queen St BB — ", "") || `Branch ${o.branchId}`;
      return [
        o.orderNumber,
        d.toLocaleDateString("en-AU"),
        d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
        branchName,
        o.paymentMethod,
        `$${parseFloat(o.total).toFixed(2)}`,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${dateRange.startDate}_${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <option key={b.id} value={b.id}>{(b.name as string).replace("Queen St BB — ", "")}</option>
          ))}
        </select>
        <input type="date" style={inputStyle} value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
        <span style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>—</span>
        <input type="date" style={inputStyle} value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
        {salesData?.orders && salesData.orders.length > 0 && (
          <button
            onClick={exportCSV}
            className="ml-auto text-[10px] uppercase px-4 py-2 transition-all hover:opacity-80"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
          >
            Export CSV
          </button>
        )}
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

          {/* Branch Comparison (only when All Branches selected) */}
          {!selectedBranch && branchSalesMap.length > 0 && (
            <div className="p-4" style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
              <h3 className="text-sm font-medium mb-4" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                Revenue by Branch
              </h3>
              <div className="space-y-3">
                {branchSalesMap.sort((a, b) => b.total - a.total).map((branch) => {
                  const maxTotal = Math.max(...branchSalesMap.map((b) => b.total), 1);
                  const width = (branch.total / maxTotal) * 100;
                  return (
                    <div key={branch.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                          {branch.name}
                        </span>
                        <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                          ${branch.total.toFixed(2)} ({branch.count} orders)
                        </span>
                      </div>
                      <div className="h-4 w-full" style={{ backgroundColor: "oklch(0.84 0.025 72 / 0.2)" }}>
                        <div
                          className="h-full transition-all"
                          style={{ width: `${width}%`, backgroundColor: "oklch(0.55 0.12 30)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Transaction Table */}
          {salesData.orders && salesData.orders.length > 0 && (
            <TransactionTable orders={salesData.orders} branches={branches} />
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

function TransactionTable({ orders, branches }: { orders: any[]; branches: any[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const totalPages = Math.ceil(orders.length / pageSize);
  const pagedOrders = orders.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="p-4" style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
          Transactions ({orders.length})
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="text-[10px] px-2 py-1 disabled:opacity-30"
              style={{ border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
            >
              Prev
            </button>
            <span className="text-[10px]" style={{ color: "oklch(0.34 0.05 45 / 0.5)" }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="text-[10px] px-2 py-1 disabled:opacity-30"
              style={{ border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: "2px solid oklch(0.84 0.025 72 / 0.5)" }}>
              <th className="text-[10px] uppercase py-2 px-2" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Order #</th>
              <th className="text-[10px] uppercase py-2 px-2" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Date</th>
              <th className="text-[10px] uppercase py-2 px-2" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Time</th>
              <th className="text-[10px] uppercase py-2 px-2" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Branch</th>
              <th className="text-[10px] uppercase py-2 px-2" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Payment</th>
              <th className="text-[10px] uppercase py-2 px-2 text-right" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order: any) => {
              const d = new Date(order.createdAt);
              const branchName = branches.find((b: any) => b.id === order.branchId)?.name?.replace("Queen St BB — ", "") || "-";
              return (
                <tr key={order.id} style={{ borderBottom: "1px solid oklch(0.84 0.025 72 / 0.2)" }}>
                  <td className="text-xs py-2 px-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>{order.orderNumber}</td>
                  <td className="text-xs py-2 px-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}>{d.toLocaleDateString("en-AU")}</td>
                  <td className="text-xs py-2 px-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}>{d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="text-xs py-2 px-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}>{branchName}</td>
                  <td className="text-xs py-2 px-2 uppercase" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}>{order.paymentMethod}</td>
                  <td className="text-xs py-2 px-2 text-right font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>${parseFloat(order.total).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
