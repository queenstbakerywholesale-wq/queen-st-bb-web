/**
 * Hook to fetch admin-managed page images with fallback to defaults.
 * Usage: const heroUrl = usePageImage("tiramisu", "hero", DEFAULT_HERO_URL);
 */
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function usePageImage(
  pageSlug: string,
  slotKey: string,
  fallback: string
): string {
  const { data: images } = trpc.publicPageImages.getByPage.useQuery(
    { pageSlug },
    { staleTime: 5 * 60 * 1000 } // cache for 5 min
  );

  return useMemo(() => {
    if (!images || images.length === 0) return fallback;
    const match = images.find((img: any) => img.slotKey === slotKey);
    return match?.imageUrl || fallback;
  }, [images, slotKey, fallback]);
}

/**
 * Hook to fetch all images for a page at once.
 * Returns a map of slotKey -> imageUrl.
 */
export function usePageImages(
  pageSlug: string,
  defaults: Record<string, string>
): Record<string, string> {
  const { data: images } = trpc.publicPageImages.getByPage.useQuery(
    { pageSlug },
    { staleTime: 5 * 60 * 1000 }
  );

  return useMemo(() => {
    const result = { ...defaults };
    if (images) {
      for (const img of images as any[]) {
        if (img.slotKey && img.imageUrl) {
          result[img.slotKey] = img.imageUrl;
        }
      }
    }
    return result;
  }, [images, defaults]);
}
