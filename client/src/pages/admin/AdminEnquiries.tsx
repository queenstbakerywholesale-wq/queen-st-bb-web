/**
 * Admin Enquiries — Manage wholesale and customer care enquiries
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  responded: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

const TYPE_LABELS: Record<string, string> = {
  wholesale: "Wholesale",
  customer_care: "Customer Care",
};

export default function AdminEnquiries() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: enquiries = [], refetch } = trpc.adminEnquiries.list.useQuery({
    type: typeFilter ? (typeFilter as "wholesale" | "customer_care") : undefined,
    status: statusFilter
      ? (statusFilter as "new" | "in_progress" | "responded" | "closed")
      : undefined,
    search: search || undefined,
  });

  const { data: stats } = trpc.adminEnquiries.stats.useQuery();
  const { data: detail } = trpc.adminEnquiries.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const updateStatus = trpc.adminEnquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refetch();
    },
  });

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "oklch(0.34 0.05 45 / 0.5)",
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "oklch(0.34 0.05 45)",
    backgroundColor: "oklch(0.94 0.015 80)",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
    padding: "8px 12px",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1
            className="text-2xl font-light"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.34 0.05 45)",
            }}
          >
            Enquiries
          </h1>
          <p
            className="mt-1 text-sm font-light"
            style={{
              fontFamily: "var(--font-body)",
              color: "oklch(0.34 0.05 45 / 0.5)",
            }}
          >
            Manage wholesale and customer care enquiries
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "New", value: stats.new },
            { label: "Wholesale", value: stats.wholesale },
            { label: "Customer Care", value: stats.customerCare },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4"
              style={{
                backgroundColor: "oklch(0.94 0.015 80)",
                border: "1px solid oklch(0.84 0.025 72 / 0.5)",
              }}
            >
              <span style={labelStyle}>{s.label}</span>
              <p
                className="text-2xl font-light mt-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.34 0.05 45)",
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="">All Types</option>
          <option value="wholesale">Wholesale</option>
          <option value="customer_care">Customer Care</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="responded">Responded</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="text"
          placeholder="Search name, email, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: "250px" }}
        />
      </div>

      {/* List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enquiry List */}
        <div className="space-y-3">
          {enquiries.length === 0 ? (
            <p
              className="text-center py-12 text-sm font-light"
              style={{
                fontFamily: "var(--font-body)",
                color: "oklch(0.34 0.05 45 / 0.4)",
              }}
            >
              No enquiries found
            </p>
          ) : (
            enquiries.map((enq: any) => (
              <button
                key={enq.id}
                onClick={() => setSelectedId(enq.id)}
                className={`w-full text-left p-4 transition-all duration-200 ${
                  selectedId === enq.id ? "ring-1" : ""
                }`}
                style={{
                  backgroundColor:
                    selectedId === enq.id
                      ? "oklch(0.91 0.02 75)"
                      : "oklch(0.94 0.015 80)",
                  border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                  outline: selectedId === enq.id ? "1px solid oklch(0.34 0.05 45 / 0.3)" : "none",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45)",
                      }}
                    >
                      {enq.name}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45 / 0.5)",
                      }}
                    >
                      {enq.email}
                      {enq.company ? ` — ${enq.company}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[9px] uppercase px-2 py-0.5 rounded-sm"
                      style={{
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.1em",
                        backgroundColor:
                          enq.type === "wholesale"
                            ? "oklch(0.45 0.06 45 / 0.1)"
                            : "oklch(0.55 0.04 250 / 0.1)",
                        color:
                          enq.type === "wholesale"
                            ? "oklch(0.45 0.06 45)"
                            : "oklch(0.45 0.04 250)",
                      }}
                    >
                      {TYPE_LABELS[enq.type] || enq.type}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded-sm ${
                        STATUS_COLORS[enq.status] || ""
                      }`}
                      style={{
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {enq.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <p
                  className="text-xs mt-2 line-clamp-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45 / 0.4)",
                  }}
                >
                  {enq.message}
                </p>
                <p
                  className="text-[10px] mt-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45 / 0.3)",
                  }}
                >
                  {enq.createdAt
                    ? format(new Date(enq.createdAt), "MMM d, yyyy h:mm a")
                    : ""}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div
          className="p-6 sticky top-6"
          style={{
            backgroundColor: "oklch(0.94 0.015 80)",
            border: "1px solid oklch(0.84 0.025 72 / 0.5)",
            minHeight: "300px",
          }}
        >
          {detail ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    className="text-lg font-light"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "oklch(0.34 0.05 45)",
                    }}
                  >
                    {detail.name}
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.34 0.05 45 / 0.5)",
                    }}
                  >
                    {detail.email}
                  </p>
                </div>
                <select
                  value={detail.status}
                  onChange={(e) =>
                    updateStatus.mutate({
                      id: detail.id,
                      status: e.target.value as any,
                    })
                  }
                  style={{ ...inputStyle, fontSize: "11px" }}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {detail.phone && (
                  <div>
                    <span style={labelStyle}>Phone</span>
                    <p
                      className="text-sm mt-1"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45)",
                      }}
                    >
                      {detail.phone}
                    </p>
                  </div>
                )}
                {detail.company && (
                  <div>
                    <span style={labelStyle}>Company</span>
                    <p
                      className="text-sm mt-1"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45)",
                      }}
                    >
                      {detail.company}
                    </p>
                  </div>
                )}
                {detail.interest && (
                  <div>
                    <span style={labelStyle}>Interest</span>
                    <p
                      className="text-sm mt-1"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45)",
                      }}
                    >
                      {detail.interest}
                    </p>
                  </div>
                )}
                {detail.subject && (
                  <div>
                    <span style={labelStyle}>Subject</span>
                    <p
                      className="text-sm mt-1"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45)",
                      }}
                    >
                      {detail.subject}
                    </p>
                  </div>
                )}
                <div>
                  <span style={labelStyle}>Type</span>
                  <p
                    className="text-sm mt-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.34 0.05 45)",
                    }}
                  >
                    {TYPE_LABELS[detail.type] || detail.type}
                  </p>
                </div>
                <div>
                  <span style={labelStyle}>Received</span>
                  <p
                    className="text-sm mt-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.34 0.05 45)",
                    }}
                  >
                    {detail.createdAt
                      ? format(
                          new Date(detail.createdAt),
                          "MMM d, yyyy h:mm a"
                        )
                      : ""}
                  </p>
                </div>
              </div>

              <div>
                <span style={labelStyle}>Message</span>
                <p
                  className="text-sm font-light leading-relaxed mt-2 whitespace-pre-wrap"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45 / 0.7)",
                  }}
                >
                  {detail.message}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <span style={labelStyle}>Admin Notes</span>
                <textarea
                  rows={3}
                  defaultValue={detail.adminNotes || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (detail.adminNotes || "")) {
                      updateStatus.mutate({
                        id: detail.id,
                        status: detail.status,
                        adminNotes: e.target.value,
                      });
                    }
                  }}
                  className="w-full mt-2 p-3 outline-none resize-none"
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                  }}
                  placeholder="Add internal notes..."
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p
                className="text-sm font-light"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "oklch(0.34 0.05 45 / 0.3)",
                }}
              >
                Select an enquiry to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
