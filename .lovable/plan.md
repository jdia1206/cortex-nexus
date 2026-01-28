

# Plan: Send PDF Receipt via Email

## Overview
This feature will allow you to send a professional PDF receipt to customers via email after completing a sale. Since emails cannot be sent from the browser, we'll create a backend function to handle PDF generation and email delivery.

## What You'll Need First

**Email Service Setup (Resend)**
1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your email domain at [resend.com/domains](https://resend.com/domains) (required for sending emails)
3. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
4. Provide the API key when prompted

## How It Will Work

```text
+-------------------+     +------------------+     +---------------+
|   Complete Sale   | --> | Backend Function | --> | Customer Gets |
| (Click "Send      |     | - Generate PDF   |     | Email with    |
|  Receipt Email")  |     | - Send via Email |     | PDF Attached  |
+-------------------+     +------------------+     +---------------+
```

## Changes to Be Made

### 1. Backend Function: `send-receipt-email`
Create a new backend function that:
- Receives sale data (receipt number, items, totals, customer info, company info)
- Generates a professional PDF receipt using a library like `jsPDF`
- Sends the email with the PDF attached using Resend
- Returns success/failure status

### 2. Update Sales Form Dialog
- Add a "Send receipt to email" checkbox (enabled when email is provided)
- After successful sale creation, call the backend function if checkbox is checked
- Show a toast notification confirming the email was sent

### 3. Add "Resend Receipt" Option
- Add a button on existing sales to resend the receipt email
- Opens a dialog to enter/confirm the email address
- Calls the same backend function

### 4. Receipt PDF Contents
The PDF will include:
- Company name, logo (if available), and contact info from your tenant settings
- Receipt number and date
- Customer name and contact details
- Itemized list of products with quantities, unit prices, and subtotals
- Tax breakdown
- Discount (if applied)
- Total amount
- Currency formatting based on your selected currency

## Technical Details

### Backend Function Structure
```text
supabase/functions/send-receipt-email/
  └── index.ts
```

The function will:
1. Validate input data
2. Generate PDF in-memory using Deno-compatible PDF library
3. Send email via Resend API with PDF as base64 attachment
4. Handle errors gracefully

### New UI Elements
- Checkbox: "Send receipt to customer's email"
- Button: "Resend Receipt" in sales list
- Loading states during email sending
- Success/error toast notifications

### New Translation Keys
- `sales.sendReceiptEmail`
- `sales.sendingReceipt`
- `sales.receiptSent`
- `sales.receiptSendError`
- `sales.resendReceipt`

## Security Considerations
- The Resend API key will be stored securely as a secret
- Email sending only works for authenticated users
- Rate limiting can be added if needed

