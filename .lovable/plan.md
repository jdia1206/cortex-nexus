

## Super Admin Operations Center

This plan creates a centralized **Platform Operations Center** where you (as the platform owner) can manage all aspects of Nexus - from customer subscriptions to support tickets to platform analytics.

### What You'll Get

#### 1. Platform Dashboard
A bird's-eye view of your entire SaaS business:
- Total active tenants (companies using Nexus)
- Monthly Recurring Revenue (MRR)
- New signups this month
- Active support tickets
- Platform health indicators

#### 2. Tenant Management
Complete oversight of all companies on your platform:
- List all tenants with search and filters
- View tenant details (company info, users, usage stats)
- See subscription status and plan type
- Manually activate/deactivate accounts
- Impersonate tenant for support (view their data)

#### 3. Subscription & Billing Management
Track and manage all subscriptions:
- View active subscriptions with plan details
- See payment history and failed payments
- Manually upgrade/downgrade plans
- Handle refunds and credits
- Export billing reports
- Integration with Stripe for payment processing

#### 4. Support Ticketing System
Built-in customer support:
- Incoming ticket queue
- Assign tickets to support agents
- Ticket priority levels (low, medium, high, urgent)
- Ticket categories (billing, technical, feature request)
- Internal notes on tickets
- Response templates

#### 5. AI-Powered Support Assistant
Use AI to enhance support:
- Auto-suggest responses based on ticket content
- Summarize long ticket threads
- Categorize incoming tickets automatically
- Generate knowledge base articles from common issues

#### 6. User Analytics
Understand how customers use Nexus:
- Daily/weekly/monthly active users
- Feature usage breakdown
- Churn indicators
- Engagement metrics

#### 7. Platform Announcements
Communicate with all users:
- Create system-wide announcements
- Schedule maintenance notices
- Send targeted messages to specific plans

---

### How It Works

The Super Admin area will be completely separate from the tenant-level app. You'll access it through a special `/admin` route that only platform administrators can see.

**Security Model:**
- A new `platform_roles` table tracks super admins
- Super admins are NOT tenant admins - they're platform operators
- All admin actions are logged for audit trails
- Super admin routes are protected with additional security checks

---

### Technical Implementation

#### Database Changes

**New Tables:**

| Table | Purpose |
|-------|---------|
| `platform_admins` | Users who can access the admin panel |
| `subscriptions` | Track tenant subscription status and plans |
| `subscription_plans` | Define available plans (Free, Pro, Enterprise) |
| `support_tickets` | Customer support ticket system |
| `ticket_messages` | Threaded messages on tickets |
| `platform_announcements` | System-wide notifications |
| `admin_audit_log` | Track all admin actions |

#### New Pages

| Route | Page |
|-------|------|
| `/admin` | Admin Dashboard Overview |
| `/admin/tenants` | Tenant Management |
| `/admin/tenants/:id` | Individual Tenant Details |
| `/admin/subscriptions` | Subscription Management |
| `/admin/support` | Support Ticket Queue |
| `/admin/support/:id` | Individual Ticket View |
| `/admin/analytics` | Platform Analytics |
| `/admin/announcements` | Announcements Manager |

#### New Components

- `AdminLayout` - Separate layout for admin panel
- `AdminSidebar` - Navigation for admin area
- `TenantCard` - Display tenant info
- `TicketList` - Support ticket queue
- `TicketChat` - Ticket conversation view
- `SubscriptionBadge` - Show plan status
- `AIAssistantPanel` - AI support helper

#### Backend Functions

| Function | Purpose |
|----------|---------|
| `admin-dashboard-stats` | Aggregate platform metrics |
| `admin-impersonate` | Safe tenant impersonation |
| `ai-ticket-assistant` | AI-powered support suggestions |
| `subscription-webhook` | Handle Stripe events |

#### Stripe Integration

- Create subscription plans in Stripe
- Handle checkout sessions for upgrades
- Process webhooks for payment events
- Sync subscription status with database

---

### File Summary

| Action | File/Area |
|--------|-----------|
| Create | Database migrations for new tables |
| Create | `src/pages/admin/*` - All admin pages |
| Create | `src/components/admin/*` - Admin components |
| Create | `src/contexts/AdminContext.tsx` - Admin state |
| Create | `src/hooks/useAdmin*.ts` - Admin data hooks |
| Create | `supabase/functions/admin-*` - Edge functions |
| Modify | `src/App.tsx` - Add admin routes |
| Modify | Translation files - Add admin translations |

---

### Recommended Implementation Order

1. **Phase 1: Foundation**
   - Database schema for subscriptions and admin roles
   - Admin authentication and route protection
   - Basic admin layout and navigation

2. **Phase 2: Core Features**
   - Tenant management with list/detail views
   - Subscription tracking and display
   - Basic support ticket system

3. **Phase 3: Payments**
   - Stripe integration for subscriptions
   - Payment history and invoice management
   - Plan upgrade/downgrade flows

4. **Phase 4: AI & Analytics**
   - AI-powered ticket assistant
   - Platform analytics dashboard
   - User engagement metrics

5. **Phase 5: Polish**
   - Announcements system
   - Audit logging
   - Admin notification system

