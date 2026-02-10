

## Remove App Description from Login & Register Pages

Revert the login and register pages to show their original subtitles instead of the app description.

### Changes

1. **`src/pages/auth/Login.tsx`** (line 83): Change `t('common.appDescription')` back to `t('auth.loginSubtitle')`

2. **`src/pages/auth/Register.tsx`** (line 102): Change `t('common.appDescription')` back to `t('auth.signUpSubtitle')`

No other files need to change — the `appDescription` key can remain in the locale files for potential future use.

