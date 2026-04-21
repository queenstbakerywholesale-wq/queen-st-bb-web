import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { enquiries } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

export const publicEnquiriesRouter = router({
  submitWholesale: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email().max(320),
        phone: z.string().max(50).optional(),
        company: z.string().max(300).optional(),
        interest: z.string().max(200).optional(),
        message: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(enquiries).values({
        type: "wholesale",
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        company: input.company || null,
        interest: input.interest || null,
        subject: null,
        message: input.message,
      });

      // Notify owner
      await notifyOwner({
        title: `New Wholesale Enquiry from ${input.name}`,
        content: [
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          input.phone ? `Phone: ${input.phone}` : null,
          input.company ? `Company: ${input.company}` : null,
          input.interest ? `Interest: ${input.interest}` : null,
          `\nMessage:\n${input.message}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      return { success: true };
    }),

  submitCustomerCare: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email().max(320),
        phone: z.string().max(50).optional(),
        subject: z.string().max(500).optional(),
        message: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(enquiries).values({
        type: "customer_care",
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        company: null,
        interest: null,
        subject: input.subject || null,
        message: input.message,
      });

      // Notify owner
      await notifyOwner({
        title: `New Customer Care Enquiry from ${input.name}`,
        content: [
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          input.phone ? `Phone: ${input.phone}` : null,
          input.subject ? `Subject: ${input.subject}` : null,
          `\nMessage:\n${input.message}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      return { success: true };
    }),
});
