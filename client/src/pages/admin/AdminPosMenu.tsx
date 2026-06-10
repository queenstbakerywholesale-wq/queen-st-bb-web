/**
 * Admin POS Menu Management — Configure menu items per branch for POS system
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminPosMenu() {
  const { data: branches = [] } = trpc.adminStaff.branches.useQuery();
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);

  // Use first branch as default
  const branchId = selectedBranch || branches[0]?.id || 1;

  const { data: categories = [], refetch: refetchCategories } = trpc.pos.listCategories.useQuery(
    { branchId },
    { enabled: !!branchId }
  );
  const { data: menuItems = [], refetch: refetchItems } = trpc.pos.listMenuItems.useQuery(
    { branchId },
    { enabled: !!branchId }
  );

  const createCategoryMutation = trpc.pos.createCategory.useMutation({
    onSuccess: () => { toast.success("Category created"); refetchCategories(); setShowCategoryCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const createItemMutation = trpc.pos.createMenuItem.useMutation({
    onSuccess: () => { toast.success("Menu item created"); refetchItems(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteItemMutation = trpc.pos.deleteMenuItem.useMutation({
    onSuccess: () => { toast.success("Item deleted"); refetchItems(); },
    onError: (e) => toast.error(e.message),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
            POS Menu
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            각 지점별 POS 메뉴 아이템을 관리합니다.
          </p>
        </div>
        <div className="flex gap-3">
          {/* Branch selector */}
          <select
            style={inputStyle}
            className="w-48"
            value={branchId}
            onChange={(e) => setSelectedBranch(Number(e.target.value))}
          >
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name.replace("Queen St BB — ", "")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCategoryCreate(true)}
          className="px-4 py-2 text-xs uppercase transition-all hover:opacity-80"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", border: "1px solid oklch(0.34 0.05 45)", color: "oklch(0.34 0.05 45)" }}
        >
          + Category
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-xs uppercase transition-all hover:opacity-80"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
        >
          + Menu Item
        </button>
      </div>

      {/* Category Create */}
      {showCategoryCreate && (
        <CategoryForm
          branchId={branchId}
          onSubmit={(data: any) => createCategoryMutation.mutate(data)}
          onCancel={() => setShowCategoryCreate(false)}
          isLoading={createCategoryMutation.isPending}
        />
      )}

      {/* Item Create */}
      {showCreate && (
        <MenuItemForm
          branchId={branchId}
          categories={categories}
          onSubmit={(data: any) => createItemMutation.mutate(data)}
          onCancel={() => setShowCreate(false)}
          isLoading={createItemMutation.isPending}
        />
      )}

      {/* Categories & Items */}
      {categories.length === 0 ? (
        <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
          <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>
            No categories yet. Create a category first, then add menu items.
          </p>
        </div>
      ) : (
        categories.map((cat: any) => {
          const items = menuItems.filter((item: any) => item.categoryId === cat.id);
          return (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "oklch(0.34 0.05 45)" }} />
                <h3 className="text-sm font-medium uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45)" }}>
                  {cat.name}
                </h3>
                <span className="text-[10px]" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>
                  ({items.length} items)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between"
                    style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}
                  >
                    <div>
                      <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                        {item.name}
                      </p>
                      <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                        {item.priceType === "weight" ? `$${item.unitPrice}/100g` : item.priceType === "custom" ? "Custom price" : `$${item.unitPrice}`}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (confirm("Delete?")) deleteItemMutation.mutate({ id: item.id }); }}
                      className="text-[10px] px-2 py-1 hover:opacity-70"
                      style={{ color: "oklch(0.5 0.15 25)" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function CategoryForm({ branchId, onSubmit, onCancel, isLoading }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#5A3A2E");
  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "13px", backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)", padding: "8px 12px", width: "100%",
  };
  return (
    <div className="p-4 space-y-3" style={{ backgroundColor: "oklch(0.97 0.008 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <h4 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>New Category</h4>
      <div className="flex gap-3">
        <input style={inputStyle} className="flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name (e.g. Tiramisu, Gelato, Drinks)" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 cursor-pointer" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSubmit({ branchId, name, color })} disabled={isLoading || !name}
          className="px-4 py-2 text-xs uppercase disabled:opacity-40"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}>
          {isLoading ? "..." : "Create"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-xs uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Cancel</button>
      </div>
    </div>
  );
}

function MenuItemForm({ branchId, categories, onSubmit, onCancel, isLoading }: any) {
  const [form, setForm] = useState({ name: "", categoryId: categories[0]?.id || 0, priceType: "fixed", unitPrice: "", unit: "each" });
  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "13px", backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)", padding: "8px 12px", width: "100%",
  };
  return (
    <div className="p-4 space-y-3" style={{ backgroundColor: "oklch(0.97 0.008 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <h4 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>New Menu Item</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
        <select style={inputStyle} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={inputStyle} value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value, unit: e.target.value === "weight" ? "100g" : "each" })}>
          <option value="fixed">Fixed Price (per item)</option>
          <option value="weight">Weight-based (per 100g)</option>
          <option value="custom">Custom (enter at POS)</option>
        </select>
        <input style={inputStyle} type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
          placeholder={form.priceType === "weight" ? "Price per 100g" : form.priceType === "custom" ? "Default price (optional)" : "Price"} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSubmit({ branchId, ...form, categoryId: form.categoryId, unitPrice: form.unitPrice || "0" })} disabled={isLoading || !form.name}
          className="px-4 py-2 text-xs uppercase disabled:opacity-40"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}>
          {isLoading ? "..." : "Create"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-xs uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Cancel</button>
      </div>
    </div>
  );
}
