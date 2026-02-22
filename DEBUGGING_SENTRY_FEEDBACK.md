# Debugging Sentry Feedback Issues

## Current Issues and Solutions

### Issue 1: Email Field Not Disabled
**Problem**: The email field in the feedback form is still editable.

**Solution**: The code now tries multiple CSS selectors and retries several times to find and disable the email field. This is because the Sentry feedback widget DOM might load asynchronously.

**How to Debug**:
1. Open your browser's Developer Console (F12)
2. Open the feedback widget
3. Look for these log messages:
   - `🎯 Feedback form opened with user context:` - Shows the user data
   - `✅ Email field disabled and set to:` - Confirms email field was found and disabled
   - `⚠️ Email field not found, retrying...` - Means the field wasn't found yet

4. If you see warnings, manually inspect the feedback form in DevTools:
   ```javascript
   // Run this in console while feedback form is open
   document.querySelectorAll('input')
   ```
   Find the email input and note its selector/attributes.

### Issue 2: Name Field Shows Email Instead of Full Name
**Problem**: The name field displays the user's email instead of their full name.

**Root Causes**:
1. `userName` is not stored in localStorage during login
2. User data is loaded before it's properly stored
3. The user object doesn't have `fullName` populated

**How to Debug**:

#### Step 1: Check localStorage
Open browser console and run:
```javascript
// Check what's stored
console.log('userId:', localStorage.getItem('userId'));
console.log('userEmail:', localStorage.getItem('userEmail'));
console.log('userName:', localStorage.getItem('userName'));
console.log('Full user object:', localStorage.getItem('user'));
```

**Expected Output**:
```
userId: "123"
userEmail: "john.doe@example.com"
userName: "John Doe"
```

**If userName is null or undefined**, the issue is in the login/registration flow.

#### Step 2: Check the Login Response
Add this temporarily to your login handler to see what the backend returns:

```javascript
// In your login component
const response = await loginUser(email, password);
console.log('🔍 Login response data:', response.data);
console.log('🔍 User object:', response.data.user);
console.log('🔍 Full name:', response.data.user?.full_name);
```

#### Step 3: Verify storeUserData is Called Correctly
The `storeUserData` function expects userData with a `full_name` property:

```javascript
// This should be called after login
storeUserData({
  id: "123",
  email: "john.doe@example.com",
  full_name: "John Doe",  // ← This is what we need
  // ... other fields
});
```

#### Step 4: Check getCurrentUser Output
```javascript
// Run in console
import { getCurrentUser } from './src/app/utils/auth.js';
const user = getCurrentUser();
console.log('Current user:', user);
// Should show: { id: "123", email: "...", fullName: "John Doe" }
```

## Quick Fix Solutions

### Solution 1: Manual localStorage Fix (Temporary)
If you need to test immediately, manually set the userName:

```javascript
// In browser console
localStorage.setItem('userName', 'John Doe');
// Then refresh the page
```

### Solution 2: Update Login/Registration Flow
Ensure that when you call `storeUserData`, you're passing the correct user object structure:

**In `authService.js` (loginUser function)**:
```javascript
if (response.data.tokens) {
  setTokens(response.data.tokens.access, response.data.tokens.refresh);
  
  // Make sure we're passing the right data structure
  const userData = {
    ...response.data.user,
    // If backend returns different field names, map them:
    full_name: response.data.user.full_name || 
               response.data.user.fullName ||
               `${response.data.user.first_name} ${response.data.user.last_name}`
  };
  
  storeUserData(userData);
}
```

### Solution 3: Add Debug Logging to storeUserData

Temporarily add logging to see what's being stored:

```javascript
// In auth.js - storeUserData function
export function storeUserData(userData) {
  console.log("📝 Storing user data:", userData);
  console.log("📝 full_name field:", userData.full_name);
  
  // ... rest of the function
  
  if (userData.full_name) {
    localStorage.setItem("userName", userData.full_name);
    console.log("✅ userName stored:", userData.full_name);
  } else {
    console.warn("⚠️ full_name is missing from userData!");
  }
}
```

## Testing the Feedback Integration

### Using the Feedback Debugger Component

1. **Add to your layout/page**:
```jsx
import FeedbackDebugger from './components/FeedbackDebugger';

export default function YourPage() {
  return (
    <div>
      {/* Your page content */}
      
      {/* Add debugger in development */}
      {process.env.NODE_ENV === 'development' && <FeedbackDebugger />}
    </div>
  );
}
```

2. **Click the "🐛 Debug" button** in the bottom-left corner

3. **Check the displayed user data** - it should show your full name, not email

4. **Click "Open Feedback Widget"** and verify:
   - Name field shows your full name
   - Email field is disabled (grayed out)
   - Email field shows your email address

### Manual Verification Steps

1. **Login to your application**
2. **Open browser DevTools Console** (F12)
3. **Look for these logs**:
   ```
   📊 Getting user context for feedback:
   {
     userId: "123",
     userEmail: "john.doe@example.com",
     userFullName: "John Doe"  // ← Should be your name, not email
   }
   ```

4. **Open the feedback widget**
5. **Check the console for**:
   ```
   🎯 Feedback form opened with user context:
   {
     id: "123",
     email: "john.doe@example.com",
     name: "John Doe",  // ← Should be your full name
     username: "john.doe@example.com"
   }
   ```

6. **Look for email field status**:
   ```
   ✅ Email field disabled and set to: john.doe@example.com
   ✅ Name field set to: John Doe
   ```

## Common Issues and Solutions

### Issue: "userName is null"
**Fix**: Check your login/registration API response. The backend might be returning `fullName`, `full_name`, or separate `first_name`/`last_name` fields. Update the mapping in `storeUserData`.

### Issue: "Email field not found"
**Fix**: The Sentry feedback widget might use different DOM structure. Check the console for warnings, then inspect the actual form HTML to find the correct selector.

### Issue: "Anonymous User" appears
**Fix**: User is not logged in or localStorage is empty. Verify the login flow stores data correctly.

### Issue: Changes don't take effect
**Fix**: 
1. Clear your browser cache and localStorage
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if you're looking at the right environment (dev/prod)

## Backend API Requirements

Your backend login/registration endpoints should return:

```json
{
  "tokens": {
    "access": "...",
    "refresh": "..."
  },
  "user": {
    "id": "123",
    "email": "john.doe@example.com",
    "full_name": "John Doe",  // ← This is crucial
    "first_name": "John",      // Optional but helpful
    "last_name": "Doe",        // Optional but helpful
    "role": "user",
    // ... other fields
  }
}
```

If your backend returns different field names, update the `storeUserData` function to map them correctly.

