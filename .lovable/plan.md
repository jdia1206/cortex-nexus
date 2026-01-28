

# VentaSaaS - Sales, Purchase & Inventory Management System

## Overview
A multi-tenant SaaS application for managing sales, purchases, and inventory. Each company (tenant) gets isolated access to their own data using Row-Level Security, with Stripe integration for subscription billing.

---

## 🏗️ Architecture

### Multi-Tenancy Approach
- **Single database** with RLS policies for complete data isolation
- Each table includes a `tenant_id` column linked to the subscribing company
- Users can only access data belonging to their company

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Payments**: Stripe (subscription billing)
- **UI Style**: Enterprise/Business with sidebar navigation

---

## 📦 Core Modules

### 1. Authentication & Onboarding
- User registration with email/password
- Company (tenant) creation during signup
- Subscription selection via Stripe checkout
- User invitation system (Admin invites team members)

### 2. Company & Branches Management
- Company profile settings (name, address, contact info, social media)
- Multiple branches (sucursales) per company
- Multiple warehouses (depósitos) per branch

### 3. Product Catalog (Artículos)
- Product management (name, description, size, cost, price, tax rate)
- Optional serial number tracking per product
- Product categories (future enhancement)

### 4. Inventory Management
- Stock levels per warehouse
- Inventory adjustments with reason tracking
- Stock transfers between warehouses
- Low stock alerts

### 5. Suppliers (Proveedores)
- Supplier directory with contact information
- Supplier representative tracking

### 6. Customers (Clientes)
- Customer database with contact details
- Customer purchase history

### 7. Purchase Module (Compras)
- Purchase invoice creation
- Supplier selection
- Serial number capture for serialized products
- Purchase returns (Devoluciones)
- Purchase history and reporting

### 8. Sales Module (Ventas)
- Sales invoice creation
- Customer selection
- Serial number assignment for serialized products
- Sales returns (Devoluciones)
- Sales history and reporting

### 9. User Roles & Permissions
- **Admin**: Full access, user management, company settings
- **User**: Day-to-day operations (sales, purchases, inventory)

---

## 🌍 Internationalization (i18n)
- Support for Spanish and English
- Language switcher in the header
- All labels, messages, and dates localized

---

## 💳 Stripe Subscription
- Subscription plans for access to the system
- Payment method management
- Billing history
- Subscription upgrade/downgrade

---

## 🎨 User Interface

### Layout
- **Sidebar navigation** with collapsible menu
- **Header** with company name, user profile, language switcher
- **Main content area** with tables, forms, and dashboards

### Key Screens
1. **Dashboard**: Overview of sales, purchases, inventory levels
2. **Products**: Grid/table view with search and filters
3. **Inventory**: Stock levels by warehouse
4. **Sales**: Invoice list + create new sale
5. **Purchases**: Invoice list + create new purchase
6. **Customers/Suppliers**: Directory with search
7. **Settings**: Company profile, users, branches, warehouses
8. **Billing**: Subscription status, payment history

---

## 🗄️ Database Schema (Adapted for Supabase)

The schema will be redesigned with:
- UUID primary keys (instead of composite keys)
- `tenant_id` on all business tables
- `created_at`, `updated_at` timestamps
- Proper RLS policies for tenant isolation
- Integration with Supabase Auth

---

## 🚀 Implementation Phases

### Phase 1: Foundation
- Supabase setup with authentication
- Multi-tenant database schema with RLS
- Basic UI layout with sidebar navigation
- Company and user management

### Phase 2: Core Business Logic
- Product catalog management
- Supplier and customer directories
- Branch and warehouse setup
- Inventory tracking

### Phase 3: Transactions
- Purchase invoice creation and listing
- Sales invoice creation and listing
- Serial number tracking
- Returns processing

### Phase 4: Polish & Billing
- Stripe subscription integration
- Dashboard with key metrics
- Internationalization (Spanish/English)
- Reports and exports

---

## ✅ Success Criteria
- Complete data isolation between tenants
- Intuitive enterprise-style interface
- Working sales and purchase flows
- Inventory accurately tracked across warehouses
- Stripe payments functional
- Multilingual support

