/**
 * Admin Staff Management — Create, edit, deactivate staff accounts per branch
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminStaff() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);

  const { data: staff = [], refetch } = trpc.adminStaff.list.useQuery();
  const { data: branches = [] } = trpc.adminStaff.branches.useQuery();

  const createMutation = trpc.adminStaff.create.useMutation({
    onSuccess: () => { toast.success("Staff member created"); refetch(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.adminStaff.update.useMutation({
    onSuccess: () => { toast.success("Staff updated"); refetch(); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const resetPwMutation = trpc.adminStaff.resetPassword.useMutation({
    onSuccess: () => { toast.success("Password reset"); setResetPasswordId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.adminStaff.delete.useMutation({
    onSuccess: () => { toast.success("Staff deactivated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "oklch(0.34 0.05 45 / 0.5)",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
            Staff Management
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            직원 계정을 관리합니다. 직원은 POS와 온라인 주문을 처리할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-xs uppercase transition-all hover:opacity-80"
          style={{
            fontFamily: "var(--font-body)",
            letterSpacing: "0.15em",
            backgroundColor: "oklch(0.34 0.05 45)",
            color: "oklch(0.94 0.015 80)",
          }}
        >
          + Add Staff
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <CreateStaffForm
          branches={branches}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowCreate(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordId && (
        <ResetPasswordForm
          staffId={resetPasswordId}
          onSubmit={(newPassword) => resetPwMutation.mutate({ id: resetPasswordId, newPassword })}
          onCancel={() => setResetPasswordId(null)}
          isLoading={resetPwMutation.isPending}
        />
      )}

      {/* Staff List */}
      <div className="space-y-3">
        {staff.length === 0 ? (
          <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
            <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>No staff members yet</p>
          </div>
        ) : (
          staff.map((s: any) => (
            <div
              key={s.id}
              className="p-4 flex items-center justify-between"
              style={{
                backgroundColor: s.isActive ? "oklch(0.94 0.015 80)" : "oklch(0.92 0.01 80)",
                border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                opacity: s.isActive ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
                >
                  {s.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                    {s.displayName}
                  </p>
                  <p className="text-[10px] uppercase" style={{ ...labelStyle }}>
                    @{s.username} · {s.branchName} · {s.role}
                  </p>
                  {s.lastLoginAt && (
                    <p className="text-[9px] mt-0.5" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
                      Last login: {new Date(s.lastLoginAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setResetPasswordId(s.id)}
                  className="px-3 py-1.5 text-[10px] uppercase transition-all hover:opacity-70"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.1em",
                    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                    color: "oklch(0.34 0.05 45 / 0.6)",
                  }}
                >
                  Reset PW
                </button>
                {s.isActive && (
                  <button
                    onClick={() => {
                      if (confirm(`Deactivate ${s.displayName}?`)) {
                        deleteMutation.mutate({ id: s.id });
                      }
                    }}
                    className="px-3 py-1.5 text-[10px] uppercase transition-all hover:opacity-70"
                    style={{
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.1em",
                      border: "1px solid oklch(0.7 0.1 25 / 0.3)",
                      color: "oklch(0.5 0.15 25)",
                    }}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CreateStaffForm({
  branches,
  onSubmit,
  onCancel,
  isLoading,
}: {
  branches: { id: number; name: string }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    displayName: "",
    branchId: branches[0]?.id || 1,
    role: "staff" as "staff" | "manager",
    pin: "",
  });

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
    color: "oklch(0.34 0.05 45)",
    padding: "8px 12px",
    width: "100%",
  };

  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: "oklch(0.97 0.008 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
        New Staff Member
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Display Name
          </label>
          <input style={inputStyle} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="John" />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Username
          </label>
          <input style={inputStyle} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="john.h" />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Password
          </label>
          <input style={inputStyle} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 4 characters" />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            PIN (POS Quick Login)
          </label>
          <input style={inputStyle} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="4-digit PIN" maxLength={10} />
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Branch
          </label>
          <select style={inputStyle} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: Number(e.target.value) })}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Role
          </label>
          <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
            <option value="staff">Staff (POS + Orders)</option>
            <option value="manager">Manager (Staff + Reports)</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSubmit(form)}
          disabled={isLoading || !form.username || !form.password || !form.displayName}
          className="px-4 py-2 text-xs uppercase transition-all hover:opacity-80 disabled:opacity-40"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
        >
          {isLoading ? "Creating..." : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs uppercase transition-all hover:opacity-70"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ResetPasswordForm({
  staffId,
  onSubmit,
  onCancel,
  isLoading,
}: {
  staffId: number;
  onSubmit: (pw: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.5)" }}>
      <div className="p-6 space-y-4 w-full max-w-sm" style={{ backgroundColor: "oklch(0.94 0.015 80)" }}>
        <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
          Reset Password
        </h3>
        <input
          type="password"
          placeholder="New password (min 4 chars)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 text-sm"
          style={{ fontFamily: "var(--font-body)", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
        />
        <div className="flex gap-3">
          <button
            onClick={() => onSubmit(newPassword)}
            disabled={isLoading || newPassword.length < 4}
            className="px-4 py-2 text-xs uppercase disabled:opacity-40"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
          >
            {isLoading ? "..." : "Reset"}
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-xs uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
