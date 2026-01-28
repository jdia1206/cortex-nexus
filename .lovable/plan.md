
Goal
- Fix the /admin redirect-to-/dashboard behavior while the user is already logged in by eliminating a timing/race condition in the admin “gate” logic.

What’s happening (root cause)
- /admin is protected by AdminProtectedRoute.
- AdminProtectedRoute immediately redirects to /dashboard when `isPlatformAdmin` is false and `adminLoading` is false.
- Your AdminProvider currently sets `isLoading(true)` inside a `useEffect` when the route changes (`pathname` dependency).
- React `useEffect` runs after the render commit, so on the first render after navigating to /admin, `adminLoading` may still be false from the previous route while the new admin-check hasn’t started yet.
- That creates a brief window where:
  - user is logged in
  - adminLoading is false
  - isPlatformAdmin is still false (stale)
  - AdminProtectedRoute redirects to /dashboard before the new check can begin

Why the “pathname dependency” diff didn’t fully solve it
- It ensures a re-check happens, but it doesn’t prevent the redirect during the first render immediately after navigation because the re-check starts too late (effect timing).

Proposed solution (design)
- Add a “check freshness” concept to AdminContext so the route guard can know whether the admin status is valid for the current logged-in user + navigation attempt.
- Key idea: compute a stable “current key” for the needed admin check and compare it to the last successfully completed key.
  - Example key: `${user?.id ?? 'anon'}`
  - Optionally include `pathname` if you truly want a re-check on every route, but the safer pattern is:
    - re-check on user id changes
    - provide an explicit `refreshAdminStatus()` function
    - optionally re-check on focus/visibility change
- In AdminContext, expose:
  - `isLoading` (true if a check is in progress OR if status is “stale” for the current user)
  - `refreshAdminStatus()` (force re-check)
  - (optional) `lastError` (to help debug RLS/permission issues)

Then update AdminProtectedRoute so that:
- If auth is still loading, show loading.
- If admin status is stale or currently checking, show loading (do NOT redirect).
- Only after a “fresh” check is complete:
  - if not logged in -> redirect to /login
  - if logged in but not platform admin -> redirect to /dashboard
  - else render the admin page

Implementation steps (code changes)
1) Update AdminContext.tsx
   - Add internal state:
     - `checkedKey` (string | null): the last key for which the admin status has been confirmed
     - `checkingKey` (string | null): the key currently being checked (optional, but helpful)
     - `lastError` (string | null) (optional)
   - Define `currentKey` as:
     - if user exists: `user.id`
     - else: null
   - Compute a derived boolean:
     - `isStale = user != null && checkedKey !== currentKey`
   - Make the effective loading state:
     - `effectiveLoading = isLoading || isStale`
   - Adjust the check function:
     - When starting a check for a user:
       - set `isLoading(true)`
       - clear `lastError`
       - set `checkingKey = currentKey`
     - Run the `platform_admins` query
     - On success:
       - set flags (isPlatformAdmin/isSuperAdmin/platformRole)
       - set `checkedKey = currentKey`
     - On failure:
       - store error for debugging
       - set `checkedKey = currentKey` anyway (important to avoid infinite “loading”; alternatively keep stale but then you must show an error UI)
       - set admin flags to false
     - finally:
       - set `isLoading(false)`
       - set `checkingKey = null`
   - Change when checks run:
     - Always check when `user?.id` changes (this is the main trigger).
     - Keep the current `pathname` trigger ONLY if you truly need it, but it’s not required once “refresh” exists.
   - Add a `refreshAdminStatus` function to context that triggers the check again (can be called from admin pages, or from a “Try again” button if needed).

2) Update AdminProtectedRoute.tsx
   - Obtain from context: `isLoading` (effective) and optionally `lastError`.
   - Guard logic:
     - If `authLoading` OR `adminLoading` => show the loading spinner (no redirects).
     - If `!user` => redirect to /login.
     - If `!isPlatformAdmin` => redirect to /dashboard.
     - If `requireSuperAdmin && !isSuperAdmin` => redirect to /admin.
     - Else render children.
   - Optional: if `lastError` exists, show a minimal “Admin access check failed” message with a “Retry” button calling `refreshAdminStatus()` rather than redirecting (helps diagnose permission/RLS errors without bouncing).

3) Add targeted debug output (temporary)
   - In AdminContext, when the query fails, log:
     - user id
     - error message/code
   - In AdminProtectedRoute, if redirecting to /dashboard due to `!isPlatformAdmin`, log a single debug line to confirm it is a genuine “not admin” result rather than a stale state.

4) Verification checklist (what you should test)
   - While logged in, type `/admin` in the address bar:
     - Expected: brief “Loading…” then AdminDashboard renders.
   - Refresh on `/admin`:
     - Expected: still works after reload.
   - Navigate /dashboard -> /admin using in-app navigation or manual URL change:
     - Expected: no bounce back to /dashboard.
   - If you remove your platform_admins row (later), verify it properly redirects to /dashboard (expected behavior).
   - Confirm non-admin users are redirected away from /admin.

Potential backend/RLS edge case (secondary)
- If the database policies on `platform_admins` prevent the current user from reading their row, the select will fail or return null and you will be redirected.
- The plan above will surface this as an error (instead of a silent redirect loop), and we can adjust policies later if needed.

Scope boundaries
- This plan focuses on stabilizing access control timing and reducing redirect flicker.
- It does not remove the admin panel; it makes it reliably accessible to authorized users.

Files to change
- src/contexts/AdminContext.tsx
- src/components/admin/AdminProtectedRoute.tsx

Rollback strategy
- If anything goes wrong, revert AdminProtectedRoute to always show “Loading…” (no redirects) when there is uncertainty; that guarantees no bounce loops, then we refine.
