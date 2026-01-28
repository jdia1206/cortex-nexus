

# Plan: Apply Sales Structure to Purchases

## Overview
This plan will refactor the Purchases page to match the modern, polished structure of the Sales page. The key improvements include creating a dedicated dialog component, adding a visual product catalog, auto-generating purchase order numbers, proper currency formatting, and a supplier info section similar to customer info in Sales.

## What Will Change

### 1. Create `PurchasesFormDialog` Component
A new component `src/components/purchases/PurchasesFormDialog.tsx` that mirrors `SalesFormDialog`:

| Feature | Current (Purchases) | New (Matching Sales) |
|---------|---------------------|----------------------|
| Form location | Inline in page | Dedicated dialog component |
| PO number | Manual input | Auto-generated (PO-YYMMDD-XXXX) |
| Product selection | Dropdown per line | Visual ProductCatalog with cards |
| Currency display | Hardcoded `$` | `formatCurrency()` from context |
| Layout | Single column | Two-column (supplier/catalog + cart/summary) |
| Supplier info | Just dropdown | Dropdown + shows selected supplier details |

### 2. Create `PurchaseProductCatalog` Component
A new component `src/components/purchases/PurchaseProductCatalog.tsx` similar to `ProductCatalog`:
- Visual grid of product cards with search
- Shows product name, SKU, and **cost** (instead of price)
- Plus/minus buttons for quantity selection
- Highlights selected products

### 3. Refactor `Purchases.tsx` Page
Simplify the page by:
- Moving all form logic to `PurchasesFormDialog`
- Removing inline state management for form fields
- Adding `formatCurrency` for table display
- Matching the clean structure of `Sales.tsx`

### 4. Add Translation Keys
New keys for purchases in `en.json` and `es.json`:
- `purchases.newPurchase` - Dialog title
- `purchases.purchaseOrderNumber` - PO number label
- `purchases.supplierInfo` - Supplier section header
- `purchases.selectProducts` - Product selection label
- `purchases.searchProducts` - Search placeholder
- `purchases.noProductsFound` - Empty search state
- `purchases.cart` - Cart section header
- `purchases.emptyCart` - Empty cart message
- `purchases.completePurchase` - Submit button text
- `purchases.notesPlaceholder` - Notes placeholder

## New Component Structure

```text
src/components/purchases/
  ├── PurchasesFormDialog.tsx    (new - main dialog)
  └── PurchaseProductCatalog.tsx (new - product grid)
```

## UI Layout (PurchasesFormDialog)

```text
┌─────────────────────────────────────────────────────────────┐
│ New Purchase                                                 │
├─────────────────────────────┬───────────────────────────────┤
│ Left Column                 │ Right Column                  │
│                             │                               │
│ ┌─────────────────────────┐ │ ┌───────────────────────────┐ │
│ │ PO # (auto-generated)   │ │ │ Cart (X items)            │ │
│ └─────────────────────────┘ │ │ ┌───────────────────────┐ │ │
│                             │ │ │ Product 1    $50.00   │ │ │
│ ┌─────────────────────────┐ │ │ │ 2 x $25.00      [X]   │ │ │
│ │ Supplier [Dropdown]     │ │ │ └───────────────────────┘ │ │
│ └─────────────────────────┘ │ │ ┌───────────────────────┐ │ │
│                             │ │ │ Product 2    $30.00   │ │ │
│ ┌─────────────────────────┐ │ │ │ 1 x $30.00      [X]   │ │ │
│ │ Warehouse [Dropdown]    │ │ │ └───────────────────────┘ │ │
│ └─────────────────────────┘ │ └───────────────────────────┘ │
│                             │                               │
│ ─────────────────────────── │ ┌───────────────────────────┐ │
│                             │ │ Notes                     │ │
│ ┌─────────────────────────┐ │ │ [___________________]    │ │
│ │ Product Catalog         │ │ └───────────────────────────┘ │
│ │ [Search products...]    │ │                               │
│ │ ┌─────────┐┌─────────┐  │ │ ┌───────────────────────────┐ │
│ │ │Product 1││Product 2│  │ │ │ Subtotal:        $80.00  │ │
│ │ │$25 cost ││$30 cost │  │ │ │ Total:           $80.00  │ │
│ │ │[- 2 +]  ││[- 1 +]  │  │ │ └───────────────────────────┘ │
│ │ └─────────┘└─────────┘  │ │                               │
│ │ ┌─────────┐┌─────────┐  │ │ ┌───────────────────────────┐ │
│ │ │Product 3││Product 4│  │ │ │ [Cancel] [Complete Order] │ │
│ │ └─────────┘└─────────┘  │ │ └───────────────────────────┘ │
│ └─────────────────────────┘ │                               │
└─────────────────────────────┴───────────────────────────────┘
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/purchases/PurchasesFormDialog.tsx` | Create | Main dialog with two-column layout, supplier/warehouse dropdowns, product catalog, cart, and totals |
| `src/components/purchases/PurchaseProductCatalog.tsx` | Create | Visual product grid showing cost, with quantity selectors |
| `src/pages/Purchases.tsx` | Modify | Simplify to use new dialog, add currency formatting to table |
| `src/i18n/locales/en.json` | Modify | Add new purchases translation keys |
| `src/i18n/locales/es.json` | Modify | Add Spanish translations for new keys |

## Technical Details

### Auto-generated PO Number
```typescript
function generatePONumber(count: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = (count + 1).toString().padStart(4, '0');
  return `PO-${year}${month}${day}-${sequence}`;
}
```

### Currency Formatting in Table
Change from:
```typescript
render: (purchase) => `$${Number(purchase.total).toFixed(2)}`
```
To:
```typescript
render: (purchase) => formatCurrency(Number(purchase.total))
```

### Product Selection Types
```typescript
type SelectedProduct = {
  product_id: string;
  name: string;
  quantity: number;
  unit_cost: number;  // Using cost instead of price for purchases
  subtotal: number;
};
```

## Key Differences from Sales

| Aspect | Sales | Purchases |
|--------|-------|-----------|
| Number prefix | RCP- (Receipt) | PO- (Purchase Order) |
| Partner | Customer (optional inline fields) | Supplier (dropdown) |
| Location | Branch (optional) | Warehouse (dropdown) |
| Product price field | `price` (selling price) | `cost` (purchase cost) |
| Email feature | Send receipt | Not included (future enhancement) |

