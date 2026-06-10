/**
 * AdminEcardDesigns — Manage e-card background designs
 * Admin can upload up to 6 designs, toggle visibility, delete
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, Trash2, Eye, EyeOff, Plus, Palette } from "lucide-react";
import { toast } from "sonner";

const brown = "#5A3A2E";
const cream = "#FAF7F2";

export default function AdminEcardDesigns() {
  const utils = trpc.useUtils();
  const { data: designs = [], isLoading } = trpc.giftCards.adminListDesigns.useQuery();
  const uploadMutation = trpc.giftCards.adminUploadDesign.useMutation({
    onSuccess: () => {
      utils.giftCards.adminListDesigns.invalidate();
      toast.success("Design uploaded successfully");
      setUploadName("");
      setPreviewUrl(null);
      setFileData(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.giftCards.adminDeleteDesign.useMutation({
    onSuccess: () => {
      utils.giftCards.adminListDesigns.invalidate();
      toast.success("Design deleted");
    },
  });
  const toggleMutation = trpc.giftCards.adminToggleDesign.useMutation({
    onSuccess: () => {
      utils.giftCards.adminListDesigns.invalidate();
      toast.success("Design visibility updated");
    },
  });

  const [uploadName, setUploadName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      const base64 = result.split(",")[1];
      setFileData({ base64, mimeType: file.type });
      if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!fileData || !uploadName.trim()) {
      toast.error("Please select a file and enter a name");
      return;
    }
    uploadMutation.mutate({
      name: uploadName.trim(),
      imageData: fileData.base64,
      mimeType: fileData.mimeType,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: brown }}>
            E-Card Designs
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Upload background designs for customer e-cards (recommended: 6 designs, 800x500px)
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: cream, color: brown }}>
          {designs.length} / 6
        </span>
      </div>

      {/* Upload Form */}
      <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: cream, border: `1px solid #E8DDD0` }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: brown }}>
          <Plus className="w-4 h-4 inline mr-1" /> Upload New Design
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-neutral-200"
                />
                <button
                  onClick={() => { setPreviewUrl(null); setFileData(null); }}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-neutral-400 transition-colors"
              >
                <Upload className="w-5 h-5 text-neutral-400" />
                <span className="text-xs text-neutral-500">Click to select image</span>
                <span className="text-[10px] text-neutral-400">JPG, PNG, WEBP • Max 5MB</span>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:w-48">
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Design name"
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
            />
            <button
              onClick={handleUpload}
              disabled={!fileData || !uploadName.trim() || uploadMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: brown }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>

      {/* Designs Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-neutral-400">Loading designs...</div>
      ) : designs.length === 0 ? (
        <div className="text-center py-16">
          <Palette className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">No designs uploaded yet</p>
          <p className="text-xs text-neutral-300 mt-1">Upload background images for your e-cards</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {designs.map((design: any) => (
            <div
              key={design.id}
              className={`relative rounded-xl overflow-hidden border transition-all ${
                design.isActive ? "border-neutral-200" : "border-neutral-100 opacity-50"
              }`}
            >
              <img
                src={design.imageUrl}
                alt={design.name}
                className="w-full aspect-[1.6/1] object-cover"
              />
              <div className="p-3 bg-white">
                <p className="text-xs font-medium text-neutral-700 truncate">{design.name}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: design.id, isActive: !design.isActive })}
                    className="p-1.5 rounded hover:bg-neutral-100 transition-colors"
                    title={design.isActive ? "Hide" : "Show"}
                  >
                    {design.isActive ? (
                      <Eye className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this design?")) {
                        deleteMutation.mutate({ id: design.id });
                      }
                    }}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
