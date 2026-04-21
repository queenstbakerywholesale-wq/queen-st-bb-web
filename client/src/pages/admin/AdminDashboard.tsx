import { trpc } from "@/lib/trpc";
import {
  ShoppingCart,
  Cake,
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="p-5 rounded-lg border"
      style={{
        backgroundColor: "#fff",
        borderColor: "#5A3A2E10",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ backgroundColor: accent || "#5A3A2E10" }}
        >
          <Icon className="w-4 h-4" style={{ color: "#5A3A2E" }} />
        </div>
      </div>
      <p
        className="text-2xl font-medium mb-1"
        style={{
          fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
          color: "#5A3A2E",
        }}
      >
        {value}
      </p>
      <p
        className="text-[11px] uppercase tracking-[0.04em]"
        style={{
          fontFamily: "var(--font-body, 'Jost', sans-serif)",
          color: "#5A3A2E80",
        }}
      >
        {label}
      </p>
      {sub && (
        <p
          className="text-[10px] mt-1"
          style={{
            fontFamily: "var(--font-body, 'Jost', sans-serif)",
            color: "#5A3A2E50",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = trpc.adminDashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1
          className="text-xl font-medium tracking-[0.04em]"
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            color: "#5A3A2E",
          }}
        >
          Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg animate-pulse"
              style={{ backgroundColor: "#5A3A2E08" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1
        className="text-xl font-medium tracking-[0.04em]"
        style={{
          fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
          color: "#5A3A2E",
        }}
      >
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Today's Orders"
          value={data?.todayOrders ?? 0}
        />
        <StatCard
          icon={Cake}
          label="Today's Bookings"
          value={data?.todayBookings ?? 0}
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={data?.pendingOrders ?? 0}
        />
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`$${Number(data?.todayRevenue ?? 0).toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`$${Number(data?.totalRevenue ?? 0).toFixed(2)}`}
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={data?.totalCustomers ?? 0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={data?.lowStockProducts?.length ?? 0}
          accent={
            (data?.lowStockProducts?.length ?? 0) > 0
              ? "#FFF3E0"
              : "#5A3A2E10"
          }
        />
        <StatCard
          icon={MessageSquare}
          label="Pending Enquiries"
          value={data?.pendingEnquiries ?? 0}
          sub={`${data?.todayEnquiries ?? 0} today · ${data?.totalEnquiries ?? 0} total`}
          accent={
            (data?.pendingEnquiries ?? 0) > 0
              ? "#E8F5E9"
              : "#5A3A2E10"
          }
        />
      </div>

      {/* Low Stock Alert */}
      {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: "#FFF8F0",
            borderColor: "#D4A574",
          }}
        >
          <h3
            className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              color: "#8B5E3C",
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock Alert
          </h3>
          <div className="space-y-2">
            {data.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm"
                style={{
                  fontFamily: "var(--font-body, 'Jost', sans-serif)",
                  color: "#5A3A2E",
                }}
              >
                <span>{p.name}</span>
                <span className="font-medium">
                  {p.stock} / {p.lowStockThreshold}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "#5A3A2E10" }}
        >
          <h3
            className="text-sm font-medium tracking-[0.05em]"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              color: "#5A3A2E",
            }}
          >
            Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  backgroundColor: "#5A3A2E05",
                  fontFamily: "var(--font-body, 'Jost', sans-serif)",
                }}
              >
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Order #
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Customer
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Total
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                data.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t"
                    style={{ borderColor: "#5A3A2E08" }}
                  >
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {order.orderNumber}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {order.customerName}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full"
                        style={{
                          fontFamily: "var(--font-body, 'Jost', sans-serif)",
                          backgroundColor: "#5A3A2E10",
                          color: "#5A3A2E",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm"
                    style={{
                      fontFamily: "var(--font-body, 'Jost', sans-serif)",
                      color: "#5A3A2E50",
                    }}
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "#5A3A2E10" }}
        >
          <h3
            className="text-sm font-medium tracking-[0.05em]"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              color: "#5A3A2E",
            }}
          >
            Upcoming Bookings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  backgroundColor: "#5A3A2E05",
                  fontFamily: "var(--font-body, 'Jost', sans-serif)",
                }}
              >
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Booking #
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Customer
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Pickup
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
                data.upcomingBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-t"
                    style={{ borderColor: "#5A3A2E08" }}
                  >
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {booking.bookingNumber}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {booking.customerName}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {booking.pickupDate} {booking.pickupTime}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full"
                        style={{
                          fontFamily: "var(--font-body, 'Jost', sans-serif)",
                          backgroundColor: "#5A3A2E10",
                          color: "#5A3A2E",
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm"
                    style={{
                      fontFamily: "var(--font-body, 'Jost', sans-serif)",
                      color: "#5A3A2E50",
                    }}
                  >
                    No upcoming bookings
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Customers */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "#5A3A2E10" }}
        >
          <h3
            className="text-sm font-medium tracking-[0.05em]"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              color: "#5A3A2E",
            }}
          >
            Recent Customers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  backgroundColor: "#5A3A2E05",
                  fontFamily: "var(--font-body, 'Jost', sans-serif)",
                }}
              >
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Name
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Email
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Phone
                </th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>
                  Orders
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.recentCustomers && data.recentCustomers.length > 0 ? (
                data.recentCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t"
                    style={{ borderColor: "#5A3A2E08" }}
                  >
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {customer.name}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {customer.email || '—'}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {customer.phone || '—'}
                    </td>
                    <td
                      className="px-5 py-3 text-sm"
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        color: "#5A3A2E",
                      }}
                    >
                      {customer.totalOrders}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm"
                    style={{
                      fontFamily: "var(--font-body, 'Jost', sans-serif)",
                      color: "#5A3A2E50",
                    }}
                  >
                    No customers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
