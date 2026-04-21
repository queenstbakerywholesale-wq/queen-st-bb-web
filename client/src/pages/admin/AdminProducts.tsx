import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

const PRODUCT_TYPES = ["tiramisu", "gelato", "cake", "merchandise", "wholesale"] as const;

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
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
    productType: initial?.productType ?? "tiramisu",
    imageUrl: initial?.imageUrl ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    });
  };

  const inputStyle = {
    fontFamily: "var(--font-body, 'Jost', sans-serif)",
    backgroundColor: "#fff",
    borderColor: "#5A3A2E20",
    color: "#5A3A2E",
  };

  const labelStyle = {
    fontFamily: "var(--font-body, 'Jost', sans-serif)",
    color: "#5A3A2E80",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
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
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
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
          className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md transition-all"
          style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}
        >
          {initial ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md border transition-all"
          style={{ borderColor: "#5A3A2E30", color: "#5A3A2E", fontFamily: "var(--font-body)" }}
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
          className="text-xl font-light tracking-[0.1em]"
          style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}
        >
          Products
        </h1>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md transition-all"
          style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-5 rounded-lg border" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
          <h3 className="text-sm font-medium mb-4 tracking-[0.05em]" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
            {editingProduct ? "Edit Product" : "New Product"}
          </h3>
          <ProductForm
            initial={editingProduct}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingProduct(null); }}
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
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Product</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Type</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Price</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Stock</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Status</th>
                <th className="text-right text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td colSpan={6} className="px-5 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#5A3A2E08" }} /></td>
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
                          <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{product.name}</p>
                          <p className="text-[11px]" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>{product.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-body)", backgroundColor: "#5A3A2E10", color: "#5A3A2E" }}>
                        {product.productType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                      ${Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: product.stock <= product.lowStockThreshold ? "#C0392B" : "#5A3A2E" }}>
                      {product.stock}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full`} style={{
                        fontFamily: "var(--font-body)",
                        backgroundColor: product.isActive ? "#E8F5E9" : "#FFEBEE",
                        color: product.isActive ? "#2E7D32" : "#C62828",
                      }}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 rounded hover:bg-black/5 transition-colors">
                          <Pencil className="w-3.5 h-3.5" style={{ color: "#5A3A2E" }} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#C0392B" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>
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
              className="w-8 h-8 text-xs rounded-md transition-all"
              style={{
                fontFamily: "var(--font-body)",
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
