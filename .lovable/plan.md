

# Phase 2 & 3: Build All VentaSaaS Modules

## Overview
This plan covers the creation of all remaining modules for the VentaSaaS application. We will build 11 new pages with full CRUD functionality, reusable components, and React Query integration for data management.

---

## Current State
- Phase 1 Complete: Authentication, database schema with RLS, basic layout
- Existing Pages: Login, Register, Dashboard
- Database: All 13 tables created with RLS policies
- i18n: English and Spanish translations ready

---

## New Pages to Create

### Business Modules
| Module | Route | Features |
|--------|-------|----------|
| Products | `/products` | List, Add, Edit, Delete products |
| Inventory | `/inventory` | Stock levels by warehouse, adjustments |
| Customers | `/customers` | Customer directory with CRUD |
| Suppliers | `/suppliers` | Supplier directory with CRUD |
| Sales | `/sales` | Invoice list, create new sale |
| Purchases | `/purchases` | Invoice list, create new purchase |

### Settings Modules
| Module | Route | Features |
|--------|-------|----------|
| Company | `/settings/company` | Company profile settings |
| Users | `/settings/users` | User management, role assignment |
| Branches | `/settings/branches` | Branch management |
| Warehouses | `/settings/warehouses` | Warehouse management |
| Billing | `/settings/billing` | Subscription info (placeholder) |

---

## Implementation Structure

### 1. Shared Components
Create reusable components in `src/components/shared/`:

- **DataTable**: Generic table with sorting, pagination, search
- **PageHeader**: Consistent page headers with title and action buttons
- **DeleteDialog**: Confirmation dialog for delete actions
- **FormDialog**: Modal for create/edit forms
- **EmptyState**: Placeholder when no data exists

### 2. Custom Hooks
Create data hooks in `src/hooks/`:

- **useProducts**: CRUD operations for products
- **useCustomers**: CRUD operations for customers
- **useSuppliers**: CRUD operations for suppliers
- **useBranches**: CRUD operations for branches
- **useWarehouses**: CRUD operations for warehouses
- **useInventory**: Inventory queries and adjustments
- **useSales**: Sales invoice operations
- **usePurchases**: Purchase invoice operations

### 3. Page Components
Each page follows a consistent pattern:
```text
+------------------------------------------+
| PageHeader: Title + "Add New" Button     |
+------------------------------------------+
| Search/Filter Bar                        |
+------------------------------------------+
| DataTable with columns                   |
| - Edit/Delete actions per row            |
+------------------------------------------+
| Pagination                               |
+------------------------------------------+
```

---

## File Structure

```text
src/
├── components/
│   ├── shared/
│   │   ├── DataTable.tsx
│   │   ├── PageHeader.tsx
│   │   ├── DeleteDialog.tsx
│   │   └── EmptyState.tsx
│   ├── products/
│   │   └── ProductForm.tsx
│   ├── customers/
│   │   └── CustomerForm.tsx
│   ├── suppliers/
│   │   └── SupplierForm.tsx
│   ├── sales/
│   │   ├── SalesForm.tsx
│   │   └── SalesItemRow.tsx
│   ├── purchases/
│   │   ├── PurchaseForm.tsx
│   │   └── PurchaseItemRow.tsx
│   └── settings/
│       ├── BranchForm.tsx
│       ├── WarehouseForm.tsx
│       └── UserForm.tsx
├── hooks/
│   ├── useProducts.ts
│   ├── useCustomers.ts
│   ├── useSuppliers.ts
│   ├── useBranches.ts
│   ├── useWarehouses.ts
│   ├── useInventory.ts
│   ├── useSales.ts
│   └── usePurchases.ts
└── pages/
    ├── Products.tsx
    ├── Inventory.tsx
    ├── Customers.tsx
    ├── Suppliers.tsx
    ├── Sales.tsx
    ├── Purchases.tsx
    └── settings/
        ├── Company.tsx
        ├── Users.tsx
        ├── Branches.tsx
        ├── Warehouses.tsx
        └── Billing.tsx
```

---

## Detailed Module Specifications

### Products Module (`/products`)
**Features:**
- Table columns: Name, SKU, Cost, Price, Tax Rate, Status, Actions
- Add/Edit form with all product fields
- Toggle active/inactive status
- Search by name or SKU

**Form Fields:**
- Name (required), Description, SKU, Barcode
- Cost, Price, Tax Rate (%), Size
- Serial Tracking toggle, Active toggle, Min Stock

### Customers Module (`/customers`)
**Features:**
- Table columns: Name, Tax ID, Phone, Email, City, Actions
- Add/Edit form with customer details
- Search by name, tax ID, or email

**Form Fields:**
- Name (required), Tax ID, Contact Person
- Phone, Email, Address, City

### Suppliers Module (`/suppliers`)
**Features:**
- Table columns: Name, Tax ID, Phone, Email, Representative, Actions
- Add/Edit form with supplier details
- Search by name or tax ID

**Form Fields:**
- Name (required), Tax ID, Representative
- Phone, Email, Address

### Inventory Module (`/inventory`)
**Features:**
- Display stock levels grouped by warehouse
- Filter by warehouse
- Low stock alerts (items below min_stock)
- Stock adjustment capability

**Display:**
- Product name, Warehouse, Current Quantity, Min Stock, Status

### Sales Module (`/sales`)
**Features:**
- Invoice list with status badges
- Create new sale with line items
- Select customer, add products
- Auto-calculate subtotal, tax, total
- Invoice status management (pending/paid/cancelled)

**Invoice Form:**
- Customer selection, Invoice date
- Line items: Product, Quantity, Unit Price, Tax
- Notes, Discount

### Purchases Module (`/purchases`)
**Features:**
- Invoice list with status badges
- Create new purchase with line items
- Select supplier and target warehouse
- Auto-calculate totals

**Invoice Form:**
- Supplier selection, Warehouse, Invoice date
- Line items: Product, Quantity, Unit Cost
- Notes

### Settings: Company (`/settings/company`)
**Features:**
- Edit company profile
- Fields: Name, Tax ID, Email, Phone, Address, Website, Logo

### Settings: Users (`/settings/users`)
**Features:**
- List team members with roles
- Admin can invite new users (future)
- Admin can change user roles
- Admin can remove users

### Settings: Branches (`/settings/branches`)
**Features:**
- List all branches
- Add/Edit branches
- Mark main branch

### Settings: Warehouses (`/settings/warehouses`)
**Features:**
- List warehouses with associated branch
- Add/Edit warehouses
- Capacity tracking

### Settings: Billing (`/settings/billing`)
**Features:**
- Placeholder for Stripe integration
- Display subscription status
- Payment history (future)

---

## Technical Details

### React Query Pattern
Each hook will follow this pattern:
```typescript
// Example: useProducts.ts
export function useProducts() {
  const { profile } = useAuth();
  
  const query = useQuery({
    queryKey: ['products', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const createMutation = useMutation({...});
  const updateMutation = useMutation({...});
  const deleteMutation = useMutation({...});

  return { ...query, create, update, delete };
}
```

### Tenant ID Injection
All mutations will automatically inject the `tenant_id` from the auth context, ensuring proper RLS compliance.

### Form Validation
Use `react-hook-form` with `zod` schemas for validation on all forms.

---

## Route Configuration
Update `App.tsx` to include all new routes with ProtectedRoute wrapper.

---

## Implementation Order

1. **Shared Components** - DataTable, PageHeader, DeleteDialog, EmptyState
2. **Data Hooks** - All useX hooks for data operations
3. **Business Pages** - Products, Customers, Suppliers (foundational data)
4. **Inventory Page** - Depends on Products and Warehouses
5. **Settings Pages** - Company, Branches, Warehouses, Users, Billing
6. **Transaction Pages** - Sales and Purchases (depends on all above)

---

## Estimated Changes
- **New Files**: ~35 files (pages, components, hooks)
- **Modified Files**: 2 (App.tsx for routes, potentially locale files)

