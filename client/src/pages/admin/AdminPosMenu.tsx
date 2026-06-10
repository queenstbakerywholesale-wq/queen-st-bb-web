/**
 * Admin POS Menu Management — Configure menu items per branch for POS system
 * Features: per-item images, modifiers/options, edit items, weight/custom pricing
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminPosMenu() {
  const { data: branches = [] } = trpc.adminStaff.branches.useQuery();
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modifierItem, setModifierItem] = useState<any>(null);

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
  const updateItemMutation = trpc.pos.updateMenuItem.useMutation({
    onSuccess: () => { toast.success("Item updated"); refetchItems(); setEditingItem(null); },
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
            각 지점별 POS 메뉴 아이템을 관리합니다. 이미지, 가격, 옵션(modifier) 설정 가능.
          </p>
        </div>
        <div className="flex gap-3">
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

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          onSave={(data: any) => updateItemMutation.mutate(data)}
          onClose={() => setEditingItem(null)}
          isLoading={updateItemMutation.isPending}
        />
      )}

      {/* Modifier Management Modal */}
      {modifierItem && (
        <ModifierManager
          item={modifierItem}
          onClose={() => setModifierItem(null)}
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
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "oklch(0.34 0.05 45)" }} />
                <h3 className="text-sm font-medium uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45)" }}>
                  {cat.name}
                </h3>
                <span className="text-[10px]" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>
                  ({items.length} items)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 flex gap-3 items-start"
                    style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}
                  >
                    {/* Item Image */}
                    <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-neutral-100 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-neutral-300">No img</span>
                      )}
                    </div>
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                        {item.name}
                      </p>
                      <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                        {item.priceType === "weight" ? `$${item.unitPrice}/100g` : item.priceType === "custom" ? "Custom price" : `$${item.unitPrice}`}
                      </p>
                      {/* Action buttons */}
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-[10px] px-2 py-0.5 hover:opacity-70 rounded"
                          style={{ color: "oklch(0.34 0.05 45)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setModifierItem(item)}
                          className="text-[10px] px-2 py-0.5 hover:opacity-70 rounded"
                          style={{ color: "oklch(0.4 0.1 260)", border: "1px solid oklch(0.7 0.1 260 / 0.3)" }}
                        >
                          Options
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this item?")) deleteItemMutation.mutate({ id: item.id }); }}
                          className="text-[10px] px-2 py-0.5 hover:opacity-70 rounded"
                          style={{ color: "oklch(0.5 0.15 25)" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
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

// ─── Category Form ─────────────────────────────────────────────
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

// ─── Menu Item Form ────────────────────────────────────────────
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

// ─── Edit Item Modal ───────────────────────────────────────────
function EditItemModal({ item, categories, onSave, onClose, isLoading }: any) {
  const [form, setForm] = useState({
    name: item.name,
    priceType: item.priceType,
    unitPrice: item.unitPrice,
    unit: item.unit || "each",
    imageUrl: item.imageUrl || "",
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.adminUpload.uploadImage.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: `pos-item-${item.id}-${Date.now()}.${file.name.split(".").pop()}`,
          contentType: file.type,
          applyWatermark: false,
        });
        setForm((f) => ({ ...f, imageUrl: result.url }));
        setUploading(false);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Upload failed");
    }
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "13px", backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)", padding: "8px 12px", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h4 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
          Edit: {item.name}
        </h4>

        {/* Image Upload */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded overflow-hidden bg-neutral-100 flex items-center justify-center border border-neutral-200">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-neutral-300">No image</span>
            )}
          </div>
          <div className="space-y-1">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs px-3 py-1.5 rounded"
              style={{ border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
            {form.imageUrl && (
              <button
                onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                className="text-[10px] block text-red-400 hover:text-red-600"
              >
                Remove image
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-3">
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
          <select style={inputStyle} value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value, unit: e.target.value === "weight" ? "100g" : "each" })}>
            <option value="fixed">Fixed Price</option>
            <option value="weight">Weight-based (per 100g)</option>
            <option value="custom">Custom (enter at POS)</option>
          </select>
          <input style={inputStyle} type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            placeholder={form.priceType === "weight" ? "Price per 100g" : "Price"} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave({ id: item.id, name: form.name, priceType: form.priceType, unitPrice: form.unitPrice, unit: form.unit, imageUrl: form.imageUrl || null })}
            disabled={isLoading}
            className="px-4 py-2 text-xs uppercase disabled:opacity-40"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-xs uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modifier Manager ──────────────────────────────────────────
function ModifierManager({ item, onClose }: { item: any; onClose: () => void }) {
  const { data: modifiers = [], refetch } = trpc.pos.listModifiers.useQuery({ menuItemId: item.id });
  const [showAdd, setShowAdd] = useState(false);
  const [newModifier, setNewModifier] = useState({ name: "", required: false, options: [{ label: "", priceAdjustment: 0 }] });

  const createMutation = trpc.pos.createModifier.useMutation({
    onSuccess: () => { toast.success("Modifier added"); refetch(); setShowAdd(false); setNewModifier({ name: "", required: false, options: [{ label: "", priceAdjustment: 0 }] }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.pos.deleteModifier.useMutation({
    onSuccess: () => { toast.success("Modifier deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const addOption = () => {
    setNewModifier((m) => ({ ...m, options: [...m.options, { label: "", priceAdjustment: 0 }] }));
  };
  const removeOption = (i: number) => {
    setNewModifier((m) => ({ ...m, options: m.options.filter((_, idx) => idx !== i) }));
  };
  const updateOption = (i: number, field: string, value: any) => {
    setNewModifier((m) => ({
      ...m,
      options: m.options.map((opt, idx) => idx === i ? { ...opt, [field]: value } : opt),
    }));
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "12px", backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)", padding: "6px 10px", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
            Modifiers: {item.name}
          </h4>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-lg">×</button>
        </div>

        <p className="text-[11px]" style={{ color: "oklch(0.34 0.05 45 / 0.5)" }}>
          Modifiers let staff choose options when adding this item (e.g. Size: S/M/L, Temperature: Hot/Iced, Extras: Cream +$1)
        </p>

        {/* Existing Modifiers */}
        {modifiers.length > 0 && (
          <div className="space-y-2">
            {modifiers.map((mod: any) => (
              <div key={mod.id} className="p-3 rounded" style={{ backgroundColor: "oklch(0.97 0.008 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium" style={{ color: "oklch(0.34 0.05 45)" }}>{mod.name}</span>
                    {mod.required && <span className="text-[9px] ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-500">Required</span>}
                  </div>
                  <button
                    onClick={() => { if (confirm("Delete this modifier?")) deleteMutation.mutate({ id: mod.id }); }}
                    className="text-[10px] text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(mod.options as any[]).map((opt: any, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200" style={{ color: "oklch(0.34 0.05 45)" }}>
                      {opt.label} {opt.priceAdjustment !== 0 && <span className="text-neutral-400">{opt.priceAdjustment > 0 ? `+$${opt.priceAdjustment}` : `-$${Math.abs(opt.priceAdjustment)}`}</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Modifier */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs px-3 py-1.5 rounded"
            style={{ border: "1px solid oklch(0.34 0.05 45)", color: "oklch(0.34 0.05 45)" }}
          >
            + Add Modifier
          </button>
        ) : (
          <div className="p-3 space-y-3 rounded" style={{ backgroundColor: "oklch(0.97 0.008 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
            <div className="flex gap-3 items-center">
              <input
                style={inputStyle}
                value={newModifier.name}
                onChange={(e) => setNewModifier((m) => ({ ...m, name: e.target.value }))}
                placeholder="Modifier name (e.g. Size, Temperature, Extras)"
                className="flex-1"
              />
              <label className="flex items-center gap-1 text-[10px] whitespace-nowrap" style={{ color: "oklch(0.34 0.05 45 / 0.7)" }}>
                <input
                  type="checkbox"
                  checked={newModifier.required}
                  onChange={(e) => setNewModifier((m) => ({ ...m, required: e.target.checked }))}
                />
                Required
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-medium" style={{ color: "oklch(0.34 0.05 45 / 0.6)" }}>Options:</p>
              {newModifier.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    style={{ ...inputStyle, width: "auto" }}
                    className="flex-1"
                    value={opt.label}
                    onChange={(e) => updateOption(i, "label", e.target.value)}
                    placeholder="Option label (e.g. Large)"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: "oklch(0.34 0.05 45 / 0.5)" }}>+$</span>
                    <input
                      style={{ ...inputStyle, width: "70px" }}
                      type="number"
                      step="0.5"
                      value={opt.priceAdjustment}
                      onChange={(e) => updateOption(i, "priceAdjustment", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {newModifier.options.length > 1 && (
                    <button onClick={() => removeOption(i)} className="text-red-400 text-xs">×</button>
                  )}
                </div>
              ))}
              <button onClick={addOption} className="text-[10px] text-blue-500 hover:text-blue-700">+ Add option</button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const validOptions = newModifier.options.filter((o) => o.label.trim());
                  if (!newModifier.name.trim() || validOptions.length === 0) {
                    toast.error("Name and at least one option required");
                    return;
                  }
                  createMutation.mutate({
                    menuItemId: item.id,
                    name: newModifier.name.trim(),
                    options: validOptions,
                    required: newModifier.required,
                  });
                }}
                disabled={createMutation.isPending}
                className="px-3 py-1.5 text-xs uppercase disabled:opacity-40"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
              >
                {createMutation.isPending ? "..." : "Save Modifier"}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs" style={{ color: "oklch(0.34 0.05 45 / 0.5)" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
