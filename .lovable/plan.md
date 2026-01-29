
# Activity Log Page for Admins

## Overview
Create a dedicated Activity Log page where admin users can view all transaction logs across the organization. The logs are already being stored in the `tenant_audit_log` table and the `useAuditLog` hook already fetches them - we just need to build the UI to display them.

## What Will Be Built

### 1. Activity Log Page
A new settings page at `/settings/activity` that displays all audit logs in a searchable, filterable table format:
- **User column**: Shows who performed the action
- **Action column**: What they did (create, update, delete, mark_paid, etc.)
- **Entity column**: What type of item was affected (sale, purchase, product, etc.)
- **Details column**: Additional context about the action
- **Date column**: When the action occurred

### 2. Filtering Capabilities
- **Search**: Filter by user name
- **Action filter**: Dropdown to filter by action type (all, create, update, delete, etc.)
- **Entity filter**: Dropdown to filter by entity type (all, sale, purchase, product, etc.)
- **Date range**: Optional date filtering

### 3. Navigation Update
Add "Activity Log" to the Settings menu in the sidebar (only visible to admin users)

### 4. Admin-Only Access
The page will check the user's role and only allow admins to view the activity logs.

---

## Technical Details

### Files to Create
1. **`src/pages/settings/ActivityLog.tsx`** - New page component with:
   - Uses existing `useAuditLog` hook to fetch logs
   - DataTable component for display
   - Filter dropdowns for action and entity type
   - Badge styling for different action types
   - Date formatting with `date-fns`
   - Admin-only check using `userRole` from AuthContext

### Files to Modify
1. **`src/App.tsx`** - Add route for `/settings/activity`
2. **`src/components/layout/AppSidebar.tsx`** - Add Activity Log to settings nav items
3. **`src/i18n/locales/en.json`** - Add translation strings for the activity log page

### Component Structure
```text
ActivityLog.tsx
+------------------------------------------+
|  Activity Log                            |
|  View all user actions and transactions  |
+------------------------------------------+
| [Search by user...] [Action v] [Entity v]|
+------------------------------------------+
| User    | Action  | Entity | Date       |
|---------|---------|--------|------------|
| John    | create  | sale   | 2 mins ago |
| Sarah   | update  | product| 1 hour ago |
| ...     | ...     | ...    | ...        |
+------------------------------------------+
| Showing 1-10 of 50        [<] 1/5 [>]   |
+------------------------------------------+
```

### Translation Keys to Add
- `nav.activityLog` - "Activity Log"
- `activityLog.title` - "Activity Log"
- `activityLog.description` - "View all user actions and transactions"
- `activityLog.user` - "User"
- `activityLog.action` - "Action"
- `activityLog.entity` - "Entity"
- `activityLog.date` - "Date"
- `activityLog.details` - "Details"
- `activityLog.filterByAction` - "Filter by action"
- `activityLog.filterByEntity` - "Filter by entity"
- `activityLog.allActions` - "All actions"
- `activityLog.allEntities` - "All entities"
- `activityLog.empty` - "No activity logs yet"
- `activityLog.emptyDescription` - "User actions will appear here"
- `activityLog.searchPlaceholder` - "Search by user name..."
