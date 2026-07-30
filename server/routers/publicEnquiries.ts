import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { enquiries } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

export const publicEnquiriesRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        type: z.enum(["wholesale", "franchise", "customer_care"]),
        name: z.string().min(1).max(200),
        email: z.string().email().max(320),
        phone: z.string().max(50).optional(),
        company: z.string().max(300).optional(),
        interest: z.string().max(200).optional(),
        subject: z.string().max(500).optional(),
        message: z.string().min(1).max(5000),
        // Wholesale-specific
        storeAddress: z.string().max(500).optional(),
        deliveryAddress: z.string().max(500).optional(),
        estimatedOrderQuantity: z.string().max(200).optional(),
        businessType: z.string().max(200).optional(),
        // Franchise-specific
        preferredLocation: z.string().max(300).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(enquiries).values({
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        company: input.company || null,
        interest: input.interest || null,
        subject: input.subject || null,
        message: input.message,
        storeAddress: input.storeAddress || null,
        deliveryAddress: input.deliveryAddress || null,
        estimatedOrderQuantity: input.estimatedOrderQuantity || null,
        businessType: input.businessType || null,
        preferredLocation: input.preferredLocation || null,
      });

      // Notify owner
      const typeLabel = input.type === "wholesale" ? "Wholesale" : input.type === "franchise" ? "Franchise" : "Customer Care";
      await notifyOwner({
        title: `New ${typeLabel} Enquiry from ${input.name}`,
        content: [
          `Type: ${typeLabel}`,
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          input.phone ? `Phone: ${input.phone}` : null,
          input.company ? `Company: ${input.company}` : null,
          input.businessType ? `Business Type: ${input.businessType}` : null,
          input.storeAddress ? `Store Address: ${input.storeAddress}` : null,
          input.deliveryAddress ? `Delivery Address: ${input.deliveryAddress}` : null,
          input.estimatedOrderQuantity ? `Est. Order Qty: ${input.estimatedOrderQuantity}` : null,
          input.preferredLocation ? `Preferred Location: ${input.preferredLocation}` : null,
          input.interest ? `Interest: ${input.interest}` : null,
          `\nMessage:\n${input.message}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      return { success: true };
    }),

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
