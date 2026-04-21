import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { applyWatermark } from "../watermark";

export const adminUploadRouter = router({
  uploadImage: publicProcedure
    .input(
      z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("image/jpeg"),
        applyWatermark: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      let buffer = Buffer.from(input.base64, "base64");
      const ext = input.filename.split(".").pop() || "jpg";
      const key = `products/${nanoid()}.${ext}`;

      // Apply brand watermark if enabled
      if (input.applyWatermark) {
        try {
          buffer = await applyWatermark(buffer);
        } catch (err) {
          console.error("[Watermark] Failed to apply watermark, uploading original:", err);
          // Fall back to original image if watermark fails
        }
      }

      const { url } = await storagePut(key, buffer, input.contentType);
      return { url, key };
    }),
});
