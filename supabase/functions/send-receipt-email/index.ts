import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
}

interface ReceiptData {
  to_email: string;
  receipt_number: string;
  receipt_date: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  company_name: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency_symbol: string;
  notes?: string;
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

function generateReceiptHTML(data: ReceiptData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price, data.currency_symbol)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.subtotal, data.currency_symbol)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .company-name { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px; }
    .receipt-title { font-size: 18px; color: #6b7280; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-block { margin-bottom: 20px; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background-color: #f9fafb; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .totals { margin-left: auto; width: 250px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.discount { color: #dc2626; }
    .total-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #111827; padding-top: 12px; margin-top: 8px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
    .notes { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
    .notes-title { font-weight: 600; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-name">${data.company_name}</div>
      <div class="receipt-title">Receipt</div>
    </div>

    <table style="width: 100%; margin-bottom: 30px;">
      <tr>
        <td style="vertical-align: top; width: 50%;">
          <div class="info-block">
            <div class="info-label">Receipt Number</div>
            <div class="info-value" style="font-weight: 600; font-family: monospace;">${data.receipt_number}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Date</div>
            <div class="info-value">${data.receipt_date}</div>
          </div>
        </td>
        <td style="vertical-align: top; width: 50%; text-align: right;">
          <div class="info-block">
            <div class="info-label">Customer</div>
            <div class="info-value">${data.customer_name || 'Walk-in Customer'}</div>
            ${data.customer_email ? `<div class="info-value">${data.customer_email}</div>` : ''}
            ${data.customer_phone ? `<div class="info-value">${data.customer_phone}</div>` : ''}
          </div>
        </td>
      </tr>
    </table>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(data.subtotal, data.currency_symbol)}</span>
      </div>
      <div class="total-row">
        <span>Tax</span>
        <span>${formatCurrency(data.tax_amount, data.currency_symbol)}</span>
      </div>
      ${data.discount_amount > 0 ? `
      <div class="total-row discount">
        <span>Discount</span>
        <span>-${formatCurrency(data.discount_amount, data.currency_symbol)}</span>
      </div>
      ` : ''}
      <div class="total-row final">
        <span>Total</span>
        <span>${formatCurrency(data.total, data.currency_symbol)}</span>
      </div>
    </div>

    ${data.notes ? `
    <div class="notes">
      <div class="notes-title">Notes</div>
      <div>${data.notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for your business!</p>
      ${data.company_email ? `<p>${data.company_email}</p>` : ''}
      ${data.company_phone ? `<p>${data.company_phone}</p>` : ''}
      ${data.company_address ? `<p>${data.company_address}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReceiptData = await req.json();

    // Validate required fields
    if (!data.to_email || !data.receipt_number || !data.items?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_email, receipt_number, and items are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate HTML receipt
    const htmlContent = generateReceiptHTML(data);

    // Send email with Resend
    const emailResponse = await resend.emails.send({
      from: `${data.company_name} <onboarding@resend.dev>`,
      to: [data.to_email],
      subject: `Receipt ${data.receipt_number} from ${data.company_name}`,
      html: htmlContent,
    });

    console.log("Receipt email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Receipt sent successfully", id: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error sending receipt email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
