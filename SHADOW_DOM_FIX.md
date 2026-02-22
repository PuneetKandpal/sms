# Shadow DOM Fix - Sentry Feedback Email Field

## Problem Discovered

Your logs revealed the root cause:
```
🔍 All input fields found: 0
```

**Sentry's feedback widget uses Shadow DOM!** This encapsulates the form inputs, making them inaccessible via normal `document.querySelector()` calls.

## What is Shadow DOM?

Shadow DOM creates an isolated DOM tree that's separate from the main document. Elements inside a shadow tree are NOT accessible from the main document's JavaScript unless you specifically query inside the shadow root.

## The Fix

### Before (Not Working):
```javascript
const emailField = document.querySelector('input[type="email"]');
// Returns null because inputs are in shadow DOM
```

### After (Working):
```javascript
// 1. Find the shadow host (the element containing the shadow root)
const sentryWidget = document.querySelector('[data-sentry-feedback]');

// 2. Access the shadow root
const shadowRoot = sentryWidget.shadowRoot;

// 3. Query INSIDE the shadow DOM
const emailField = shadowRoot.querySelector('input[type="email"]');
```

## Updated Code

### File: `src/instrumentation-client.ts`

The code now:

1. **Finds the Sentry widget** (shadow host) using multiple selectors:
   - `[data-sentry-feedback]`
   - `.widget__actor`
   - `[class*="sentry"]`

2. **Accesses the shadow root**: `sentryWidget.shadowRoot`

3. **Queries inside the shadow DOM**: `shadowRoot.querySelector(...)`

4. **Logs everything in development** to help debug:
   - Widget found status
   - Shadow root status
   - All inputs in shadow DOM
   - Which selector matched

## Testing

Now when you open the feedback widget, you'll see:

**Expected logs:**
```
🔍 Sentry widget found: true
🔍 All input fields found in shadow DOM: 3
Input 0: {type: "text", name: "name", ...}
Input 1: {type: "email", name: "email", ...}
Input 2: {type: "textarea", name: "message", ...}
✅ Email field found in shadow DOM with selector: input[type="email"]
✅ Email field disabled and set to: your@email.com
✅ Name field found in shadow DOM with selector: input[name="name"]
✅ Name field set to: Akshay test
```

If you see different results, the logs will tell us exactly what selectors Sentry is using.

## Why This is Better

1. **Shadow DOM aware** - Properly accesses encapsulated elements
2. **Multiple fallbacks** - Tries different selectors to find the widget
3. **Better debugging** - Comprehensive logs show exactly what's happening
4. **More retries** - 5 attempts (100ms, 300ms, 600ms, 1000ms, 1500ms)
5. **Graceful degradation** - If shadow DOM isn't found, it just logs a warning

## Test Now

1. **Restart your dev server** (the updated code is loaded)
2. **Login to your app** 
3. **Open the feedback widget**
4. **Check the console logs** - you should see the success messages
5. **Verify the email field** is grayed out and disabled
6. **Verify the name field** shows "Akshay test" (not email)

## If It Still Doesn't Work

Share the console logs showing:
- `🔍 Sentry widget found: ???`
- `🔍 All input fields found in shadow DOM: ???`

And I'll adjust the selectors to match your specific Sentry configuration!

