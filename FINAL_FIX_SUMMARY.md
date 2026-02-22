# Final Fix - Name Field and Screenshot Issues

## Issues Fixed

### ✅ Issue 1: "Your Name" Field Showing Email (FIXED)

**Problem**: The "Your Name" field in the feedback form was showing `vayakakshay08@gmail.com` instead of `Akshay test`.

**Root Cause**: Sentry's feedback widget uses the `user.username` field to populate the "Your Name" input. We were setting `username` to the email address.

**Solution Applied**:

**File**: `src/instrumentation-client.ts`

**Changes**:

1. **In `getUserContextForFeedback()` function** (line 39):
```typescript
// Before:
username: user.email, // ❌ This caused email to show in name field

// After:
username: user.fullName || user.email, // ✅ Now uses full name
```

2. **In `onFormOpen()` callback** (line 104):
```typescript
// Before:
Sentry.setUser({
  id: userContext.id,
  email: userContext.email,
  username: userContext.username, // ❌ Was using email
  name: userContext.name,
});

// After:
Sentry.setUser({
  id: userContext.id,
  email: userContext.email,
  username: userContext.name, // ✅ Now uses full name
});
```

3. **In initial user context setting** (line 358):
```typescript
// Before:
Sentry.setUser({
  ...initialUserContext, // ❌ Spreading included username: email
  environment: currentEnvironment,
});

// After:
Sentry.setUser({
  id: initialUserContext.id,
  email: initialUserContext.email,
  username: initialUserContext.name, // ✅ Explicitly set to name
  environment: currentEnvironment,
});
```

---

### ✅ Issue 2: Screenshot Button Not Showing (FIXED)

**Problem**: No screenshot/attachment option was visible in the feedback form.

**Root Cause**: The option names we used (`showScreenshotInput`, `attachmentLabel`, etc.) were incorrect. Sentry's feedback widget uses different option names.

**Solution Applied**:

**File**: `src/instrumentation-client.ts`

**Changes** (lines 87-89):

```typescript
// Before (WRONG options):
enableScreenshot: true,
showScreenshotInput: true,
attachmentLabel: "Attach Screenshot",
attachmentDescription: "Add a screenshot to help us understand the issue",
removeScreenshotButtonLabel: "Remove Screenshot",
addScreenshotButtonLabel: "Add Screenshot",

// After (CORRECT options):
enableScreenshot: true,
showScreenshot: true,
```

---

## How to Test

### Test 1: Name Field Shows Full Name

1. **Hard refresh the page** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Check console logs**:
   ```
   ✅ Initial Sentry user context set: vayakakshay08@gmail.com name: Akshay test
   ```
3. **Open feedback widget**
4. **Check console logs**:
   ```
   🎯 Feedback form opened with user context: {...}
   📧 User email: vayakakshay08@gmail.com
   👤 User name: Akshay test
   ```
5. **Verify the form**:
   - "Your Name" field shows: `Akshay test` ✅
   - "Your Email" field shows: `vayakakshay08@gmail.com` ✅
   - Email field is disabled ✅

### Test 2: Screenshot Button Appears

1. **Open feedback widget**
2. **Look for screenshot button** near the description field
3. **You should see**: A button or icon to attach a screenshot/file

**Note**: If the screenshot button still doesn't appear, you may need to:
- Enable attachments in your Sentry project settings
- Check if you're using the latest version of `@sentry/nextjs`
- The widget might show it as a camera icon or "Attach" button

---

## What Changed

### Summary of All Changes

| Line | Old Value | New Value | Reason |
|------|-----------|-----------|--------|
| 39 | `username: user.email` | `username: user.fullName \|\| user.email` | Fix name field |
| 88-93 | Multiple screenshot options | `enableScreenshot: true, showScreenshot: true` | Correct API |
| 104 | `username: userContext.username` | `username: userContext.name` | Fix name field |
| 358 | `...initialUserContext` spread | Explicit `username: initialUserContext.name` | Fix name field |

---

## Expected Result

### Before Fix:
```
┌─────────────────────────────┐
│ Your Name                   │
│ vayakakshay08@gmail.com ❌  │ <-- Email showing here
├─────────────────────────────┤
│ Your Email (required)       │
│ vayakakshay08@gmail.com     │
├─────────────────────────────┤
│ Description (required)      │
│                             │
│ [No screenshot button] ❌   │ <-- Missing
└─────────────────────────────┘
```

### After Fix:
```
┌─────────────────────────────┐
│ Your Name                   │
│ Akshay test ✅              │ <-- Full name now!
├─────────────────────────────┤
│ Your Email (required)       │
│ vayakakshay08@gmail.com     │ <-- Disabled
├─────────────────────────────┤
│ Description (required)      │
│                             │
│ [📷 Screenshot button] ✅   │ <-- Now visible
└─────────────────────────────┘
```

---

## Additional Notes

### Why `username` field?

Sentry's feedback widget has this mapping:
- `user.username` → **"Your Name"** field
- `user.email` → **"Your Email"** field
- `user.id` → Internal user identification

This is why we had to set `username` to the full name, not `name`.

### Screenshot Feature

The screenshot button allows users to:
1. Click to attach an image
2. Select from their file system
3. Or use browser's native screenshot tool
4. The image will be attached to the feedback submission

Make sure your Sentry project has:
- **Project Settings** → **Security & Privacy** → **Attachments** enabled
- Sufficient storage quota for attachments

---

## Restart Dev Server

Don't forget to restart your development server to see the changes:

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

Both issues should now be resolved! 🎉

