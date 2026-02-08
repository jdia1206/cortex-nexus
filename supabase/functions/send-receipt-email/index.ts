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
  const accentBlue = '#4285CC';

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${item.name}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #333; font-size: 14px; text-align: right;">${formatCurrency(item.unit_price, data.currency_symbol)}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #333; font-size: 14px; text-align: right;">${formatCurrency(item.subtotal, data.currency_symbol)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Top accent bar -->
    <div style="height: 6px; background-color: ${accentBlue};"></div>
    
    <div style="padding: 30px 30px 0 30px;">
      <!-- Company info -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 4px;">${data.company_name}</div>
        ${data.company_address ? `<div style="font-size: 13px; color: #555;">${data.company_address}</div>` : ''}
        ${data.company_phone ? `<div style="font-size: 13px; color: #555;">${data.company_phone}</div>` : ''}
        ${data.company_email ? `<div style="font-size: 13px; color: #555;">${data.company_email}</div>` : ''}
      </div>

      <!-- Divider -->
      <div style="border-top: 1px solid #ddd; margin-bottom: 20px;"></div>

      <!-- Bill To + Receipt Info -->
      <table style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: top; width: 50%;">
            <div style="font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Bill To</div>
            <div style="font-size: 14px; color: #333;">${data.customer_name || 'Walk-in Customer'}</div>
            ${data.customer_email ? `<div style="font-size: 13px; color: #555;">${data.customer_email}</div>` : ''}
            ${data.customer_phone ? `<div style="font-size: 13px; color: #555;">${data.customer_phone}</div>` : ''}
          </td>
          <td style="vertical-align: top; width: 50%; text-align: right;">
            <table style="margin-left: auto;" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; padding: 2px 12px 2px 0;">Receipt #</td>
                <td style="font-size: 13px; color: #333; text-align: right;">${data.receipt_number}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; padding: 2px 12px 2px 0;">Date</td>
                <td style="font-size: 13px; color: #333; text-align: right;">${data.receipt_date}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="border-top: 1px solid #ddd; margin-bottom: 20px;"></div>

      <!-- Receipt Total -->
      <table style="width: 100%; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size: 22px; color: #333;">Receipt Total</td>
          <td style="font-size: 28px; font-weight: bold; color: ${accentBlue}; text-align: right;">${formatCurrency(data.total, data.currency_symbol)}</td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="border-top: 1px solid #ddd; margin-bottom: 16px;"></div>

      <!-- Items table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ddd;">Qty</th>
            <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ddd;">Description</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ddd;">Unit Price</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <table style="width: 50%; margin-left: auto; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #555; text-align: right; padding-right: 16px;">Subtotal</td>
          <td style="padding: 4px 0; font-size: 14px; color: #333; text-align: right;">${formatCurrency(data.subtotal, data.currency_symbol)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #555; text-align: right; padding-right: 16px;">Tax</td>
          <td style="padding: 4px 0; font-size: 14px; color: #333; text-align: right;">${formatCurrency(data.tax_amount, data.currency_symbol)}</td>
        </tr>
        ${data.discount_amount > 0 ? `
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #dc2626; text-align: right; padding-right: 16px;">Discount</td>
          <td style="padding: 4px 0; font-size: 14px; color: #dc2626; text-align: right;">-${formatCurrency(data.discount_amount, data.currency_symbol)}</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="2" style="border-top: 1px solid #ddd; padding-top: 8px;"></td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 16px; font-weight: bold; color: #000; text-align: right; padding-right: 16px;">Total</td>
          <td style="padding: 4px 0; font-size: 16px; font-weight: bold; color: #000; text-align: right;">${formatCurrency(data.total, data.currency_symbol)}</td>
        </tr>
      </table>

      ${data.notes ? `
      <!-- Notes -->
      <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 6px;">Terms & Conditions</div>
        <div style="font-size: 13px; color: #555;">${data.notes}</div>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
        Thank you for your business!
      </div>
    </div>

    <!-- Bottom accent bar -->
    <div style="height: 6px; background-color: ${accentBlue};"></div>
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

    if (!data.to_email || !data.receipt_number || !data.items?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_email, receipt_number, and items are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const htmlContent = generateReceiptHTML(data);

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
