# Enable Screenshot Attachments in Sentry Feedback

## Current Status

✅ Your Sentry SDK version: **v10.21.0** (Screenshot support included)  
✅ Code configuration: **Correct** (screenshot feature is enabled by default)  
✅ `sendDefaultPii: true` is set in config  

## Why Screenshots Might Not Show

The screenshot feature in Sentry feedback requires **both**:
1. ✅ SDK configuration (already done in your code)
2. ⚠️ **Sentry project settings** (needs to be enabled in Sentry dashboard)

## How to Enable Screenshots in Sentry Dashboard

### Step 1: Go to Your Sentry Project Settings

1. Log in to [https://sentry.io](https://sentry.io)
2. Select your project (`jbi-frontend` or whatever you named it)
3. Click **Settings** (⚙️ icon) in the left sidebar

### Step 2: Enable Attachments

1. In Settings, go to **Security & Privacy**
2. Scroll down to **Store Additional Data** section
3. Find **"Attachments"** toggle
4. **Enable it** (turn it ON)
5. Click **Save Changes**

### Step 3: Enable User Feedback Attachments (If Available)

Some Sentry versions have a specific setting for feedback attachments:

1. Still in Settings, look for **User Feedback** section
2. If you see **"Allow screenshot attachments"** toggle
3. **Enable it** (turn it ON)
4. Click **Save Changes**

### Step 4: Check Your Plan Limits

1. Go to **Settings** → **Subscription**
2. Check your **Attachment Storage** quota
   - Free tier: 1GB (good for thousands of screenshots)
   - If you're over quota, screenshots won't work

---

## Alternative: Test with Built-in Screenshot Button

After enabling the settings above:

1. **Hard refresh your browser** (Ctrl+Shift+R)
2. **Open the feedback widget**
3. **Look for**:
   - 📷 **Camera icon** button
   - **"Attach Screenshot"** button
   - **File attachment icon** near the description field

The button location can vary:
- Usually below or next to the "Description" field
- Might be a small icon rather than a text button
- Could be in the form footer

---

## Testing Screenshot Feature

### Test 1: Check Console Logs

Open the feedback form and check console for:
```
userContext for feedback-------> {
  id: "...",
  email: "...",
  name: "Akshay test",
  username: "Akshay test"
}
```

### Test 2: Inspect the Feedback Form

1. Open feedback widget
2. Right-click on the form → **Inspect**
3. Look for elements with these keywords:
   - `screenshot`
   - `attachment`
   - `upload`
   - `camera`
   - `file-input`

### Test 3: Check Shadow DOM

Since Sentry uses Shadow DOM:

1. Open feedback widget
2. Open DevTools Console
3. Run this code:
```javascript
// Find the feedback widget
const widget = document.querySelector('[data-sentry-feedback]');
const shadowRoot = widget?.shadowRoot;

// Check for screenshot elements
if (shadowRoot) {
  const screenshotBtn = shadowRoot.querySelector('[class*="screenshot"]') || 
                        shadowRoot.querySelector('[class*="attach"]') ||
                        shadowRoot.querySelector('input[type="file"]');
  console.log('Screenshot button found:', !!screenshotBtn);
  console.log('Element:', screenshotBtn);
}
```

---

## If Screenshot Still Not Showing

### Option 1: Update Sentry SDK

Try updating to the absolute latest version:

```bash
npm install @sentry/nextjs@latest
```

Then restart your dev server.

### Option 2: Check Sentry Feedback Widget Version

The feedback integration might need to be explicitly imported:

```typescript
import { feedbackIntegration } from "@sentry/nextjs";

Sentry.init({
  integrations: [
    feedbackIntegration({
      // Screenshot is enabled by default
    }),
  ],
});
```

(This is what you're already doing, so it should work)

### Option 3: Enable Debug Mode

Add this to see what's happening:

```typescript
Sentry.feedbackIntegration({
  // ... your existing options ...
  
  onFormOpen: () => {
    console.log('🎯 Feedback form opened');
    console.log('🔍 Checking for screenshot button...');
    
    // Log the widget structure
    const widget = document.querySelector('[data-sentry-feedback]');
    console.log('Widget found:', !!widget);
    console.log('Shadow root:', !!widget?.shadowRoot);
    
    // Your existing code...
  },
})
```

### Option 4: Contact Sentry Support

If none of the above works:

1. Check [Sentry Status](https://status.sentry.io/) - make sure service is operational
2. Check [Sentry Changelog](https://github.com/getsentry/sentry-javascript/releases) for your SDK version
3. Open a support ticket with Sentry explaining:
   - SDK version: 10.21.0
   - Feature: Screenshot attachment in feedback widget
   - Attachments enabled in project settings
   - Screenshot button not visible in form

---

## What We've Done in the Code

✅ **Removed incorrect options**: `enableScreenshot`, `showScreenshot` (these don't exist in the API)

✅ **Using default behavior**: In SDK v10+, screenshot attachment is **enabled by default** - no configuration needed

✅ **Set `sendDefaultPii: true`**: Required for attachments

✅ **Fixed name field**: Uses full name instead of email

---

## Expected Result

Once enabled in Sentry dashboard, the feedback form should show:

```
┌─────────────────────────────────────────┐
│ Send us your feedback                   │
├─────────────────────────────────────────┤
│ Your Name                               │
│ Akshay test                             │
├─────────────────────────────────────────┤
│ Your Email (required)                   │
│ vayakakshay08@gmail.com                 │
├─────────────────────────────────────────┤
│ Description (required)                  │
│ What's the bug? What did you expect?    │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ [📷 Attach Screenshot] [📎 Attach File] │ ← Should appear here
├─────────────────────────────────────────┤
│ [Send Bug Report]  [Cancel]             │
└─────────────────────────────────────────┘
```

---

## Quick Checklist

- [x] Sentry SDK v10+ installed
- [x] Code configuration correct
- [x] `sendDefaultPii: true` enabled
- [ ] **Attachments enabled in Sentry dashboard** ← DO THIS
- [ ] **User Feedback attachments enabled** ← DO THIS
- [ ] Enough attachment storage quota
- [ ] Hard refresh browser after changes

---

## Next Steps

1. **Go to Sentry Dashboard** → Settings → Security & Privacy
2. **Enable "Attachments"**
3. **Save and hard refresh** your browser
4. **Test the feedback form**

If you complete these steps and the screenshot button still doesn't appear, let me know and I'll investigate further!

