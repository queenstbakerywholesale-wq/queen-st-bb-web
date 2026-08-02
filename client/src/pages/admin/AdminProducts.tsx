import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Truck, Store } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_TYPES, isPickupOnlyType } from "@shared/const";

function FulfillmentBadge({ productType }: { productType: string }) {
  const pickupOnly = isPickupOnlyType(productType);
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        fontFamily: "var(--font-body)",
        backgroundColor: pickupOnly ? "#FFF3E0" : "#E8F5E9",
        color: pickupOnly ? "#E65100" : "#2E7D32",
      }}
    >
      {pickupOnly ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
      {pickupOnly ? "Pickup Only" : "Ship + Pickup"}
    </span>
  );
}

function ProductForm({
  initial,
  onSave,
  onCancel,
  categories = [],
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  categories?: any[];
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    shortDescription: initial?.shortDescription ?? "",
    price: initial?.price ?? "",
    compareAtPrice: initial?.compareAtPrice ?? "",
    stock: initial?.stock ?? 0,
    lowStockThreshold: initial?.lowStockThreshold ?? 5,
    isActive: initial?.isActive ?? true,
    isFeatured: initial?.isFeatured ?? false,
    productType: initial?.productType ?? "merchandise",
    imageUrl: initial?.imageUrl ?? "",
    categoryId: initial?.categoryId ?? undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    });
  };

  const inputStyle = {
    fontFamily: "var(--font-body)",
    backgroundColor: "#fff",
    borderColor: "#5A3A2E20",
    color: "#5A3A2E",
  };

  const labelStyle = {
    fontFamily: "var(--font-body)",
    color: "#5A3A2E80",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontWeight: 500,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle} className="block mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
            placeholder="auto-generated from name"
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Price</label>
          <input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Compare at Price</label>
          <input
            value={form.compareAtPrice}
            onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Product Type</label>
          <select
            value={form.productType}
            onChange={(e) => setForm({ ...form, productType: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {isPickupOnlyType(t) ? " (Pickup Only)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[10px] mt-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>
            {isPickupOnlyType(form.productType)
              ? "This product type is pickup only — shipping will be disabled automatically."
              : "This product type allows both shipping and store pickup."}
          </p>
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Category</label>
          <select
            value={form.categoryId ?? ""}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Image URL</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Stock</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1">Low Stock Threshold</label>
          <input
            type="number"
            value={form.lowStockThreshold}
            onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle} className="block mb-1">Short Description</label>
        <input
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle} className="block mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
          style={inputStyle}
          rows={3}
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
          />
          Featured
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md transition-all"
          style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          {initial ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md border transition-all"
          style={{ borderColor: "#5A3A2E30", color: "#5A3A2E", fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminProducts.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });
  const { data: categoriesData } = trpc.adminProducts.listCategories.useQuery();

  const createMutation = trpc.adminProducts.create.useMutation({
    onSuccess: () => {
      utils.adminProducts.list.invalidate();
      setShowForm(false);
      toast.success("Product created");
    },
  });

  const updateMutation = trpc.adminProducts.update.useMutation({
    onSuccess: () => {
      utils.adminProducts.list.invalidate();
      setEditingProduct(null);
      setShowForm(false);
      toast.success("Product updated");
    },
  });

  const deleteMutation = trpc.adminProducts.delete.useMutation({
    onSuccess: () => {
      utils.adminProducts.list.invalidate();
      toast.success("Product deleted");
    },
  });

  const handleSave = (data: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate({ id });
    }
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.01em", color: "#5A3A2E" }}
        >
          Products
        </h1>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md transition-all"
          style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {/* Fulfillment Legend */}
      <div className="flex items-center gap-4 p-3 rounded-md" style={{ backgroundColor: "#5A3A2E06", border: "1px solid #5A3A2E0A" }}>
        <span className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.05em", color: "#5A3A2E80" }}>
          Fulfillment:
        </span>
        <span className="inline-flex items-center gap-1 text-[10px]" style={{ fontFamily: "var(--font-body)", color: "#2E7D32" }}>
          <Truck className="w-3 h-3" /> Non-cake = Shipping + Pickup
        </span>
        <span className="inline-flex items-center gap-1 text-[10px]" style={{ fontFamily: "var(--font-body)", color: "#E65100" }}>
          <Store className="w-3 h-3" /> Cake = Pickup Only
        </span>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-5 rounded-lg border" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
          <h3 className="text-sm mb-4" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.02em", color: "#5A3A2E" }}>
            {editingProduct ? "Edit Product" : "New Product"}
          </h3>
          <ProductForm
            initial={editingProduct}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingProduct(null); }}
            categories={categoriesData || []}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A3A2E50" }} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-md focus:outline-none"
          style={{ fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E15", color: "#5A3A2E" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4" style={{ color: "#5A3A2E50" }} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#5A3A2E05", fontFamily: "var(--font-body)" }}>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Product</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Type</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Fulfillment</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Price</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Stock</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Status</th>
                <th className="text-right text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td colSpan={7} className="px-5 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#5A3A2E08" }} /></td>
                  </tr>
                ))
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((product) => (
                  <tr key={product.id} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{product.name}</p>
                          <p className="text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E50" }}>{product.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: "#5A3A2E10", color: "#5A3A2E" }}>
                        {product.productType}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <FulfillmentBadge productType={product.productType} />
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>
                      ${Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: product.stock <= product.lowStockThreshold ? "#C0392B" : "#5A3A2E" }}>
                      {product.stock}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full" style={{
                        fontFamily: "var(--font-body)", fontWeight: 500,
                        backgroundColor: product.isActive ? "#E8F5E9" : "#FFEBEE",
                        color: product.isActive ? "#2E7D32" : "#C62828",
                      }}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 rounded hover:bg-black/5 transition-colors cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" style={{ color: "#5A3A2E" }} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#C0392B" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E50" }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className="w-8 h-8 text-xs rounded-md transition-all cursor-pointer"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                backgroundColor: page === i + 1 ? "#5A3A2E" : "transparent",
                color: page === i + 1 ? "#F5F0EB" : "#5A3A2E",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
