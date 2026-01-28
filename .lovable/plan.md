

## Password Reset Feature Implementation

This plan implements a complete password reset flow so users can recover access to their accounts when they forget their passwords.

### How It Works

1. **User clicks "Forgot Password?"** on the login page
2. **User enters their email** on the forgot password page
3. **System sends a reset email** with a secure link
4. **User clicks the link** and is taken to a page to set a new password
5. **User sets new password** and can log in again

### What Will Be Created

#### New Pages
- **Forgot Password Page** (`/forgot-password`) - Where users enter their email to request a reset
- **Reset Password Page** (`/reset-password`) - Where users set their new password after clicking the email link

#### Backend Function
- **Password Reset Email Function** - Sends beautifully formatted password reset emails matching your app's branding

#### Authentication Updates
- Add password reset functions to the authentication system
- Handle the secure token from email links

---

### Technical Details

#### 1. Create Forgot Password Page
**File:** `src/pages/auth/ForgotPassword.tsx`

- Email input form with validation
- Success message after email is sent
- Link back to login page
- Language switcher (consistent with login page)
- Uses the built-in Supabase `resetPasswordForEmail` method

#### 2. Create Reset Password Page
**File:** `src/pages/auth/ResetPassword.tsx`

- New password input with confirmation
- Password visibility toggle (consistent with login)
- Validates passwords match
- Shows success message and redirects to login
- Uses `updateUser` to set the new password

#### 3. Update AuthContext
**File:** `src/contexts/AuthContext.tsx`

Add two new methods:
```text
resetPassword(email) - Sends password reset email
updatePassword(newPassword) - Sets the new password
```

#### 4. Create Edge Function for Email
**File:** `supabase/functions/send-password-reset/index.ts`

- Uses existing RESEND_API_KEY (already configured)
- Sends branded email matching your company style
- Includes secure reset link with token

#### 5. Update App Routes
**File:** `src/App.tsx`

Add routes:
```text
/forgot-password → ForgotPassword page
/reset-password → ResetPassword page
```

#### 6. Add Translations
**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/es.json`

New translation keys for:
- Page titles and descriptions
- Form labels and buttons
- Success/error messages
- Email content

### File Summary

| Action | File |
|--------|------|
| Create | `src/pages/auth/ForgotPassword.tsx` |
| Create | `src/pages/auth/ResetPassword.tsx` |
| Create | `supabase/functions/send-password-reset/index.ts` |
| Modify | `src/contexts/AuthContext.tsx` |
| Modify | `src/App.tsx` |
| Modify | `src/i18n/locales/en.json` |
| Modify | `src/i18n/locales/es.json` |

