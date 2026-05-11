import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Upload, Trash2, Eye, EyeOff, GripVertical, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const brown = "#5A3A2E";
const cream = "#FAF7F2";

export default function AdminBrandStickers() {
  const utils = trpc.useUtils();
  const { data: stickers, isLoading } = trpc.adminBrandStickers.list.useQuery();
  const uploadMutation = trpc.adminBrandStickers.upload.useMutation({
    onSuccess: () => {
      utils.adminBrandStickers.list.invalidate();
      toast.success("Sticker uploaded successfully");
      setUploadName("");
      setPreviewUrl(null);
      setFileData(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.adminBrandStickers.delete.useMutation({
    onSuccess: () => {
      utils.adminBrandStickers.list.invalidate();
      toast.success("Sticker deleted");
    },
  });
  const toggleMutation = trpc.adminBrandStickers.toggleActive.useMutation({
    onSuccess: () => {
      utils.adminBrandStickers.list.invalidate();
      toast.success("Sticker visibility updated");
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
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!fileData || !uploadName.trim()) {
      toast.error("Please provide a name and select an image");
      return;
    }
    uploadMutation.mutate({
      name: uploadName.trim(),
      imageBase64: fileData.base64,
      mimeType: fileData.mimeType,
    });
  };

  const inputStyle = {
    fontFamily: "var(--font-body)",
    backgroundColor: "#fff",
    borderColor: `${brown}15`,
    color: brown,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-medium tracking-[0.04em]"
          style={{ fontFamily: "var(--font-display)", color: brown }}
        >
          Brand Stickers
        </h1>
        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}60` }}>
          Upload logos & stickers for the gift card editor
        </p>
      </div>

      {/* Upload Section */}
      <div
        className="rounded-lg p-6 border"
        style={{ backgroundColor: cream, borderColor: `${brown}10` }}
      >
        <h2
          className="text-sm font-medium mb-4 tracking-[0.06em] uppercase"
          style={{ fontFamily: "var(--font-body)", color: brown }}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Upload New Sticker
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Drop Zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-opacity-50 transition-colors relative"
            style={{ borderColor: `${brown}30` }}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 object-contain mx-auto"
              />
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: `${brown}40` }} />
                <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}60` }}>
                  Click to select JPG, PNG, or WEBP
                </p>
                <p className="text-[10px] mt-1" style={{ color: `${brown}40` }}>
                  Max 5MB. Transparent PNG recommended.
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Name Input */}
          <div className="flex flex-col justify-center">
            <label
              className="text-[10px] uppercase tracking-[0.1em] mb-1.5 block"
              style={{ fontFamily: "var(--font-body)", color: `${brown}60` }}
            >
              Sticker Name
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="e.g. Queen St BB Logo"
              className="px-3 py-2 rounded border text-sm"
              style={inputStyle}
            />
          </div>

          {/* Upload Button */}
          <div className="flex items-end">
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !fileData || !uploadName.trim()}
              className="w-full px-4 py-2.5 rounded text-xs uppercase tracking-[0.1em] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: brown,
                color: cream,
              }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Sticker"}
            </button>
          </div>
        </div>
      </div>

      {/* Sticker List */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: `${brown}10` }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ backgroundColor: cream, borderColor: `${brown}10` }}
        >
          <h2
            className="text-xs font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: "var(--font-body)", color: brown }}
          >
            <ImageIcon className="w-3.5 h-3.5 inline mr-2" />
            Uploaded Stickers ({stickers?.length || 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-xs" style={{ color: `${brown}60` }}>Loading...</p>
          </div>
        ) : !stickers?.length ? (
          <div className="p-8 text-center">
            <ImageIcon className="w-10 h-10 mx-auto mb-2" style={{ color: `${brown}20` }} />
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}40` }}>
              No stickers uploaded yet. Upload your first brand sticker above.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: `${brown}08` }}>
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-opacity-50 transition-colors"
                style={{ backgroundColor: sticker.isActive ? "transparent" : `${brown}05` }}
              >
                <GripVertical className="w-4 h-4 flex-shrink-0 cursor-grab" style={{ color: `${brown}30` }} />

                <div
                  className="w-14 h-14 rounded border flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ borderColor: `${brown}15`, backgroundColor: "#fff" }}
                >
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ fontFamily: "var(--font-body)", color: brown }}
                  >
                    {sticker.name}
                  </p>
                  <p className="text-[10px]" style={{ color: `${brown}50` }}>
                    {new Date(sticker.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: sticker.id,
                        isActive: !sticker.isActive,
                      })
                    }
                    className="p-1.5 rounded hover:bg-opacity-10 transition-colors"
                    style={{ color: sticker.isActive ? brown : `${brown}40` }}
                    title={sticker.isActive ? "Hide from editor" : "Show in editor"}
                  >
                    {sticker.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this sticker?")) {
                        deleteMutation.mutate({ id: sticker.id });
                      }
                    }}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    style={{ color: "#c62828" }}
                    title="Delete sticker"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px]" style={{ fontFamily: "var(--font-body)", color: `${brown}40` }}>
        Uploaded stickers will appear in the Gift Card editor for customers to use when customising their cards.
        Toggle visibility to show/hide stickers without deleting them.
      </p>
    </div>
  );
}
