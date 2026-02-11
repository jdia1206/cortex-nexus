

# User Login Analytics -- Admin Panel Only

## Overview
Track all user login events across every tenant and display the analytics exclusively in the **Platform Admin panel** (`/admin/user-analytics`). Regular tenant users will have no access to this data.

## What Gets Tracked (Per Login)
- Timestamp
- User ID, email, and tenant
- IP address
- Browser name, OS, device type (desktop/mobile/tablet)
- Approximate location (country/city from IP)
- Session duration (updated on logout)

## Dashboard Metrics (Admin Panel)
- Total logins (all-time and last 30 days)
- Login frequency trend chart (daily/weekly)
- Most active users across all tenants
- Device breakdown (pie chart)
- Browser distribution (pie chart)
- Geographic access breakdown (country/city table)
- Peak usage hours (bar chart)
- Failed login attempt count (future enhancement)

## Technical Details

### 1. Database: `user_login_sessions` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (NOT NULL) | References auth user |
| user_email | text | Captured at login time |
| tenant_id | uuid | From user's profile |
| logged_in_at | timestamptz | Default now() |
| logged_out_at | timestamptz | Nullable, set on logout |
| ip_address | text | Nullable |
| user_agent | text | Raw UA string |
| browser | text | Parsed from UA |
| os | text | Parsed from UA |
| device_type | text | desktop/mobile/tablet |
| country | text | From IP geolocation |
| city | text | From IP geolocation |

**RLS policies:**
- Only platform admins can SELECT (using a security definer function that checks `platform_admins`)
- Authenticated users can INSERT their own row (user_id = auth.uid())
- No UPDATE or DELETE for regular users; platform admins can UPDATE (for logging logout time via a function)

### 2. Session Tracking Hook: `useSessionTracker.ts`
- Called inside `AuthContext.signIn` on success
- Parses `navigator.userAgent` for browser/OS/device
- Fetches IP + geolocation from `https://ipapi.co/json/`
- Inserts a row into `user_login_sessions`
- On `signOut`, updates `logged_out_at` for the active session

### 3. Admin Analytics Hook: `useAdminUserAnalytics.ts`
- Queries `user_login_sessions` with aggregation
- Groups data by day, device, browser, country, hour
- Only works for platform admins (RLS enforced)

### 4. New Admin Page: `/admin/user-analytics`
- Summary cards: total logins (30d), unique users, avg sessions/user
- Login trend line chart (Recharts)
- Device + browser pie charts
- Country/city breakdown table
- Peak hours bar chart
- User activity table with login count, last seen, common device

### 5. Admin Sidebar Update
- Add "User Analytics" nav item with an activity icon to `AdminSidebar.tsx`

### 6. Routing
- Add `/admin/user-analytics` route in `App.tsx` wrapped in `AdminProtectedRoute`

### 7. Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | **Create** -- `user_login_sessions` table + RLS + helper function |
| `src/hooks/useSessionTracker.ts` | **Create** -- login/logout tracking |
| `src/hooks/useAdminUserAnalytics.ts` | **Create** -- admin data queries |
| `src/pages/admin/AdminUserAnalytics.tsx` | **Create** -- dashboard page |
| `src/contexts/AuthContext.tsx` | **Modify** -- call tracker on sign-in/sign-out |
| `src/components/admin/AdminSidebar.tsx` | **Modify** -- add nav item |
| `src/pages/admin/index.ts` | **Modify** -- export new page |
| `src/App.tsx` | **Modify** -- add admin route |

