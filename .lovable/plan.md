

# POS Screen for Employees + Admin Sales Dashboard

## Overview

The `/sales` route will show a different experience based on the user's role:
- **Admin** sees the current full sales management view (table of all invoices, status management, PDF downloads, etc.)
- **User (employee)** sees a touch-friendly POS (Point of Sale) interface with large product buttons, a cart sidebar, and quick checkout

## How It Works

The existing `Sales.tsx` page will check `userRole` from `AuthContext` and render one of two components:
- `AdminSalesView` -- the current sales page (moved into its own component)
- `POSScreen` -- a new, full-screen POS interface designed for speed and simplicity

No database changes are needed. The POS uses the same `useSales`, `useProducts`, `useCustomers`, and `useProductCategories` hooks.

## POS Screen Design

The POS screen will have a clean, touch-optimized layout:

**Left side (~65% width):** Product grid
- Category filter tabs at the top (using product categories + "All" tab)
- Search bar for quick product lookup
- Large product cards in a responsive grid (3-4 columns)
- Each card shows: product image/icon, name, price, and stock
- Tapping a card adds 1 unit to the cart (with visual feedback)

**Right side (~35% width):** Cart and checkout
- List of selected items with quantity controls (+/- buttons, editable qty)
- Running subtotal, tax, discount, and total
- Quick customer selector (optional, searchable dropdown)
- Payment method selector (Cash, Card, Crypto) with large icon buttons
- "Complete Sale" button (large, prominent)
- "Clear Cart" button

**Header:** Simplified header with receipt number, employee name, and a link/button to switch back to the full sales view (for admins who may want to toggle)

## File Structure

New files to create:
- `src/components/sales/POSScreen.tsx` -- Main POS layout component
- `src/components/sales/POSProductGrid.tsx` -- Product grid with category tabs and search
- `src/components/sales/POSCart.tsx` -- Cart sidebar with checkout controls
- `src/components/sales/AdminSalesView.tsx` -- Extracted current admin sales view

Modified files:
- `src/pages/Sales.tsx` -- Role-based routing between POS and admin view
- `src/i18n/locales/en.json` -- New POS translation keys
- `src/i18n/locales/es.json` -- Spanish POS translations

## Technical Details

### Sales.tsx (modified)
```text
- Import useAuth to get userRole
- If userRole === 'admin': render <AdminSalesView />
- If userRole === 'user': render <POSScreen />
- Both views share the same data hooks (useSales, useProducts, etc.)
```

### AdminSalesView.tsx (new)
- Extract the entire current content of Sales.tsx into this component
- No logic changes, just a refactor into its own file

### POSScreen.tsx (new)
- Full-screen layout (no AppLayout sidebar -- uses a minimal header instead)
- Uses `useProducts`, `useCustomers`, `useSales`, `useProductCategories`
- Manages cart state (selected products, quantities)
- Handles sale submission via `useSales.create`
- Shows success feedback with receipt number after checkout
- Responsive: stacks vertically on mobile (products on top, cart below)

### POSProductGrid.tsx (new)
- Fetches categories from `useProductCategories`
- Renders horizontal category filter tabs
- Search input for product name/SKU filtering
- Large, touch-friendly product cards (min ~120px x 120px)
- Shows product image (or placeholder icon), name, price
- Tap to add to cart with brief animation/highlight
- Grayed out products with 0 stock

### POSCart.tsx (new)
- Scrollable list of cart items
- Each item: name, unit price, quantity controls (-, qty input, +), line total, remove button
- Summary section: subtotal, tax, discount input, total
- Optional customer search dropdown (simplified)
- Payment method: 3 large buttons (Cash, Card, Crypto) side by side
- "Complete Sale" button -- full width, large, prominent color
- "Clear Cart" button -- secondary/outline style

### Translation Keys (new entries under "pos" namespace)
- `pos.title`, `pos.searchProducts`, `pos.allCategories`, `pos.cart`, `pos.clearCart`, `pos.checkout`, `pos.completeSale`, `pos.saleComplete`, `pos.newSale`, `pos.quickCustomer`, `pos.noProductsInCategory`, `pos.itemAdded`, `pos.viewAllSales`

### Role Check Logic
The `userRole` is already available from `useAuth()` and is fetched from the `user_roles` table. No database changes needed:
- `'admin'` role: full sales dashboard
- `'user'` role: POS screen

Admins will also have a toggle button to switch to POS view if they want to use it.

