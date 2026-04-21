import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const adminUploadRouter = router({
  uploadImage: publicProcedure
    .input(
      z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.filename.split(".").pop() || "jpg";
      const key = `products/${nanoid()}.${ext}`;

      const { url } = await storagePut(key, buffer, input.contentType);
      return { url, key };
    }),
});
