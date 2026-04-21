/**
 * Order Confirmation Email & Admin Notification System
 * 
 * Sends branded HTML emails to customers after successful payment,
 * and notifies the admin/owner of each new order.
 */
import { getDb } from "./db";
import { orders, orderItems, notifications, branches } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./emailService";

// ─── Types ───────────────────────────────────────────────────────
type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    size?: string | null;
  }>;
  subtotal: string;
  shippingFee: string;
  total: string;
  fulfillmentType: string;
  shippingAddress?: string | null;
  shippingService?: string | null;
  pickupBranchName?: string | null;
  pickupBranchAddress?: string | null;
  pickupDate?: string | null;
  pickupTime?: string | null;
  hasCakeItems: boolean;
};

// ─── Email HTML Template ─────────────────────────────────────────
function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E8DDD0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #3A2A1E;">
          ${item.productName}${item.size ? ` <span style="color: #8B7355;">(${item.size})</span>` : ""}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E8DDD0; text-align: center; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #3A2A1E;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E8DDD0; text-align: right; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #3A2A1E;">
          $${item.totalPrice} AUD
        </td>
      </tr>`
    )
    .join("");

  const fulfillmentSection =
    data.fulfillmentType === "shipping"
      ? `
      <div style="background: #FAF7F2; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 500; color: #3A2A1E; margin: 0 0 12px 0;">
          Shipping Details
        </h3>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E; margin: 4px 0;">
          <strong>Method:</strong> ${data.shippingService || "Standard Parcel"}
        </p>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E; margin: 4px 0;">
          <strong>Address:</strong> ${data.shippingAddress || "N/A"}
        </p>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #8B7355; margin: 8px 0 0 0; font-style: italic;">
          Tracking information will be sent separately once your order has been dispatched.
        </p>
      </div>`
      : `
      <div style="background: #FAF7F2; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 500; color: #3A2A1E; margin: 0 0 12px 0;">
          Pickup Details
        </h3>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E; margin: 4px 0;">
          <strong>Location:</strong> ${data.pickupBranchName || "Queen St BB"}
        </p>
        ${data.pickupBranchAddress ? `<p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E; margin: 4px 0;"><strong>Address:</strong> ${data.pickupBranchAddress}</p>` : ""}
        ${data.pickupDate ? `<p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E; margin: 4px 0;"><strong>Pickup Date:</strong> ${formatDate(data.pickupDate)}</p>` : ""}
        ${data.pickupTime ? `<p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E; margin: 4px 0;"><strong>Pickup Time:</strong> ${data.pickupTime}</p>` : ""}
        ${data.hasCakeItems ? `<p style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #8B7355; margin: 8px 0 0 0; font-style: italic;">Please ensure you arrive at the selected time for cake pickup.</p>` : ""}
      </div>`;

  const shippingRow =
    parseFloat(data.shippingFee) > 0
      ? `
      <tr>
        <td colspan="2" style="padding: 8px 16px; text-align: right; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E;">
          Shipping
        </td>
        <td style="padding: 8px 16px; text-align: right; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #3A2A1E;">
          $${data.shippingFee} AUD
        </td>
      </tr>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Queen St BB</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: 'Inter', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0E8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(90,58,46,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #3A2A1E; padding: 32px 40px; text-align: center;">
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; color: #FFFFFF; margin: 0; letter-spacing: 0.01em;">
                Queen St BB
              </h1>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #D8C3A8; margin: 8px 0 0 0; letter-spacing: 0.05em; text-transform: uppercase;">
                A Dessert Atelier
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;">
              <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #3A2A1E; margin: 0 0 16px 0;">
                Thank You for Your Order
              </h2>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: #5A4A3E; line-height: 1.6; margin: 0;">
                Dear ${data.customerName}, your order has been confirmed and is being prepared with care.
              </p>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #8B7355; margin: 12px 0 0 0;">
                Order Number: <strong style="color: #3A2A1E;">${data.orderNumber}</strong>
              </p>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <th style="padding: 12px 16px; border-bottom: 2px solid #3A2A1E; text-align: left; font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #8B7355; text-transform: uppercase; letter-spacing: 0.05em;">
                    Item
                  </th>
                  <th style="padding: 12px 16px; border-bottom: 2px solid #3A2A1E; text-align: center; font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #8B7355; text-transform: uppercase; letter-spacing: 0.05em;">
                    Qty
                  </th>
                  <th style="padding: 12px 16px; border-bottom: 2px solid #3A2A1E; text-align: right; font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #8B7355; text-transform: uppercase; letter-spacing: 0.05em;">
                    Price
                  </th>
                </tr>
                ${itemRows}
                <tr>
                  <td colspan="2" style="padding: 8px 16px; text-align: right; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5A4A3E;">
                    Subtotal
                  </td>
                  <td style="padding: 8px 16px; text-align: right; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #3A2A1E;">
                    $${data.subtotal} AUD
                  </td>
                </tr>
                ${shippingRow}
                <tr>
                  <td colspan="2" style="padding: 12px 16px; text-align: right; border-top: 2px solid #3A2A1E; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 500; color: #3A2A1E;">
                    Total
                  </td>
                  <td style="padding: 12px 16px; text-align: right; border-top: 2px solid #3A2A1E; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 500; color: #3A2A1E;">
                    $${data.total} AUD
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fulfillment Details -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              ${fulfillmentSection}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 24px 40px; text-align: center; border-top: 1px solid #E8DDD0;">
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #8B7355; margin: 0;">
                If you have any questions, please contact us at our Customer Care page.
              </p>
              <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: #3A2A1E; margin: 12px 0 0 0;">
                Queen St BB — A Dessert Atelier
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Send Order Confirmation Email ───────────────────────────────
/**
 * Sends order confirmation email to customer and notifies admin.
 * Called from the Stripe webhook after successful payment.
 */
export async function sendOrderConfirmation(orderNumber: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Fetch order with items
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (orderRows.length === 0) {
      console.warn(`[OrderEmail] Order ${orderNumber} not found`);
      return false;
    }

    const order = orderRows[0];
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Get branch info if pickup
    let branchName = "";
    let branchAddress = "";
    if (order.pickupBranchId) {
      const branchRows = await db
        .select()
        .from(branches)
        .where(eq(branches.id, order.pickupBranchId))
        .limit(1);
      if (branchRows.length > 0) {
        branchName = branchRows[0].name;
        branchAddress = branchRows[0].address;
      }
    }

    const emailData: OrderEmailData = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      items: items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        size: item.size,
      })),
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      fulfillmentType: order.fulfillmentType,
      shippingAddress: order.shippingAddress,
      pickupBranchName: branchName || null,
      pickupBranchAddress: branchAddress || null,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      hasCakeItems: order.hasCakeItems,
    };

    // Build the HTML email
    const emailHtml = buildOrderConfirmationHtml(emailData);

    // Send customer email (via Resend if configured, otherwise fallback to owner notification)
    const customerNotifSent = await sendCustomerNotification(emailData, emailHtml);

    // Send admin notification
    const adminNotifSent = await sendAdminOrderNotification(emailData);

    // Log notification in DB
    try {
      await db.insert(notifications).values({
        type: "order_confirmation",
        recipientType: "customer",
        recipientEmail: order.customerEmail,
        subject: `Order Confirmation - ${order.orderNumber}`,
        content: emailHtml,
        relatedOrderId: order.id,
        isSent: customerNotifSent,
        sentAt: customerNotifSent ? new Date() : null,
      });

      await db.insert(notifications).values({
        type: "admin_new_order",
        recipientType: "admin",
        subject: `New Order: ${order.orderNumber}`,
        content: buildAdminNotificationText(emailData),
        relatedOrderId: order.id,
        isSent: adminNotifSent,
        sentAt: adminNotifSent ? new Date() : null,
      });
    } catch (e) {
      console.warn("[OrderEmail] Failed to log notification:", e);
    }

    return true;
  } catch (err) {
    console.error("[OrderEmail] Failed to send order confirmation:", err);
    return false;
  }
}

// ─── Customer Notification ───────────────────────────────────────
async function sendCustomerNotification(data: OrderEmailData, emailHtml: string): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.warn("[OrderEmail] No customer email address — skipping customer notification");
      return false;
    }

    return await sendEmail({
      to: data.customerEmail,
      subject: `Order Confirmation — ${data.orderNumber} | Queen St BB`,
      html: emailHtml,
    });
  } catch (err) {
    console.warn("[OrderEmail] Failed to send customer email:", err);
    return false;
  }
}

// ─── Admin Notification ──────────────────────────────────────────
async function sendAdminOrderNotification(data: OrderEmailData): Promise<boolean> {
  try {
    return await notifyOwner({
      title: `New Paid Order: ${data.orderNumber}`,
      content: buildAdminNotificationText(data),
    });
  } catch {
    return false;
  }
}

function buildAdminNotificationText(data: OrderEmailData): string {
  const itemsList = data.items
    .map((i) => `  - ${i.productName}${i.size ? ` (${i.size})` : ""} x${i.quantity} — $${i.totalPrice}`)
    .join("\n");

  const fulfillmentInfo =
    data.fulfillmentType === "shipping"
      ? `SHIPPING\nAddress: ${data.shippingAddress}\nService: ${data.shippingService || "Standard"}\nFee: $${data.shippingFee} AUD`
      : `STORE PICKUP${data.pickupBranchName ? `\nBranch: ${data.pickupBranchName}` : ""}${data.pickupDate ? `\nDate: ${data.pickupDate}` : ""}${data.pickupTime ? `\nTime: ${data.pickupTime}` : ""}`;

  return `NEW ORDER: ${data.orderNumber}\n\nCustomer: ${data.customerName}\nEmail: ${data.customerEmail}\n\nItems:\n${itemsList}\n\nSubtotal: $${data.subtotal} AUD${parseFloat(data.shippingFee) > 0 ? `\nShipping: $${data.shippingFee} AUD` : ""}\nTotal: $${data.total} AUD\n\nFulfillment: ${fulfillmentInfo}${data.hasCakeItems ? "\n\n⚠️ This order contains cake items (pickup required)" : ""}`;
}
