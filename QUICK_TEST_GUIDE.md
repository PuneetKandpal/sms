# 🧪 Quick Test Guide - Screenshot Feature

## What Changed

Added the missing `feedbackScreenshotIntegration()` integration that was preventing screenshots from working.

## Test Steps

### 1. Restart Your Dev Server
```bash
# Stop the server (Ctrl+C) then:
npm run dev
```

### 2. Open Your App
```bash
http://localhost:3000
```

### 3. Log In
- Use your test credentials
- Ensure you're on a logged-in page

### 4. Open Feedback Form
- Look for the feedback button/widget
- Click it to open the form

### 5. Check for Screenshot Option
You should now see:
- ✅ Name field (pre-filled with your name)
- ✅ Email field (pre-filled and disabled)
- ✅ Message field
- ✅ **"Add a screenshot" button** ← THIS IS NEW!

### 6. Test Screenshot Capture
1. Click **"Add a screenshot"** button
2. Screenshot should be captured automatically
3. You'll see an editor with tools:
   - Yellow highlighter tool
   - Black redaction tool
   - Delete tool
4. Confirm or cancel

### 7. Submit Feedback
- Write a message
- Keep the screenshot attached
- Click "Submit Feedback"

### 8. Verify in Sentry Dashboard
- Go to your Sentry project
- Navigate to "User Feedback" section
- Find your feedback entry
- Click to expand
- Verify screenshot attachment is present

## What to Look For

### Success Indicators ✅
- Screenshot button appears in form
- Can capture screenshots
- Can edit screenshots (highlight/hide)
- Screenshot shows in preview before submit
- Feedback submits successfully
- Screenshot appears in Sentry dashboard

### Still Not Working? ❌
Check console for errors:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for Sentry-related errors
4. Check for "feedbackScreenshotIntegration" errors

## Console Debug Messages

In development mode, you should see:
```
🔧 Initializing Sentry Client for environment: development
🎯 Sentry Client initialized with config: ...
✅ Initial Sentry user context set: ...
```

When opening feedback form:
```
📊 Getting user context for feedback: { userId: ..., userEmail: ..., userFullName: ... }
userContext for feedback-------> { id: ..., email: ..., name: ... }
🎯 Feedback form opened with user context: ...
```

## Screenshot Feature Details

### Screenshot Button Labels (from SDK)
- **Add**: "Add a screenshot"
- **Remove**: "Remove screenshot"
- **Highlight**: "Highlight"
- **Hide**: "Hide"
- **Confirm**: "Confirm"

### Image Editor Controls
- **Highlighter**: Yellow rectangle to draw attention
- **Redactor**: Black rectangle to hide sensitive info
- **Delete**: Remove last annotation
- **Zoom**: Zoom in/out on screenshot

## Troubleshooting

### "Screenshot button not appearing"
1. Verify integration is loaded:
   ```javascript
   // Open browser console:
   console.log(window.Sentry._integrations)
   ```
   Should include "FeedbackScreenshot"

2. Check network tab for screenshot library loading

### "Screenshot capture fails"
- Ensure browser supports screenshot API
- Check browser permissions
- Try in Chrome/Edge (best support)

### "Screenshot not in Sentry dashboard"
1. Check Sentry project settings
2. Go to Settings → General → Attachments
3. Ensure "Store crash reports" or "Attachments" is enabled
4. Check attachment size limits

## Expected File Changes

Only one file was changed:
- ✅ `src/instrumentation-client.ts`
  - Added import: `feedbackScreenshotIntegration`
  - Added to integrations array
  - Added `enableScreenshot: true` config

No other files needed changes.

## Browser Compatibility

Screenshot feature requires:
- ✅ Chrome/Edge 92+
- ✅ Firefox 90+
- ✅ Safari 15.4+
- ❌ IE11 (not supported)

## Performance Note

Screenshot capture is:
- Client-side only
- No server processing
- ~100-500KB file size typically
- Async - won't block form

---

**If everything works**: You should see the screenshot button, be able to capture/edit screenshots, and see them attached to feedback in Sentry! 🎉

