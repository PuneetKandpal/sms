# Sentry Feedback with User Metadata

This document explains how to use the enhanced Sentry feedback integration that automatically includes user metadata like email addresses.

## Features

✅ **Automatic User Context**: Feedback automatically includes user email, name, and ID  
✅ **Environment-Aware**: Different behavior for development vs production  
✅ **Real-time Updates**: User context updates when users log in/out  
✅ **Custom Components**: Ready-to-use React components for feedback buttons  
✅ **Programmatic API**: Submit feedback programmatically with full context  

## How It Works

### Automatic User Context

The feedback integration automatically detects the current user and includes their information:

```javascript
// User context automatically included:
{
  id: "user_123",
  email: "john.doe@company.com", 
  name: "John Doe",
  username: "john.doe@company.com"
}
```

### Additional Metadata

Each feedback submission includes:

- **Environment**: development, staging, or production
- **Page URL**: Current page where feedback was submitted
- **User Agent**: Browser information
- **Timestamp**: When feedback was submitted
- **App Version**: Current application version

## Usage Examples

### 1. Using the Feedback Button Component

```jsx
import FeedbackButton, { FloatingFeedbackButton } from './components/FeedbackButton';

// Regular button
<FeedbackButton variant="primary">
  Send Feedback
</FeedbackButton>

// Floating button (stays in corner)
<FloatingFeedbackButton position="bottom-right" />
```

### 2. Programmatic Feedback

```javascript
import { submitFeedback, openFeedbackWidget } from './utils/sentryFeedback';

// Open feedback widget
openFeedbackWidget();

// Submit feedback programmatically
submitFeedback("This feature is amazing!", {
  tags: { feature: "dashboard" },
  extra: { rating: 5 }
});
```

### 3. Manual User Context Updates

```javascript
import { updateSentryUserContext } from './utils/auth';

// Update user context after login/profile changes
updateSentryUserContext();
```

## Integration Points

### Automatic Updates

User context is automatically updated when:

- ✅ User logs in (`storeUserData()` called)
- ✅ User logs out (`logout()` called)  
- ✅ Page loads (initial context set)
- ✅ Feedback form opens (context refreshed)

### Manual Updates

You can manually update context by calling:

```javascript
import { updateFeedbackUserContext } from './utils/sentryFeedback';
updateFeedbackUserContext();
```

## Configuration

### Environment-Specific Behavior

**Development:**
- Debug logging enabled
- All feedback captured
- Console logs for feedback events

**Production:**
- Minimal logging
- Sensitive data masked
- Optimized performance

### Customization

You can customize the feedback integration in `src/instrumentation-client.ts`:

```javascript
Sentry.feedbackIntegration({
  // Customize form appearance
  colorScheme: "system",
  formTitle: "Send us your feedback",
  
  // Customize messages
  feedbackSuccessMessage: "Thank you for your feedback!",
  feedbackErrorMessage: "Failed to submit feedback. Please try again.",
  
  // Add custom metadata
  tags: {
    environment: currentEnvironment,
    app_version: process.env.NEXT_PUBLIC_APP_VERSION,
  }
})
```

## Viewing Feedback in Sentry

### Feedback Dashboard

1. Go to your Sentry project dashboard
2. Navigate to **User Feedback** section
3. View feedback with full user context and metadata

### Search and Filter

Filter feedback by:
- User email
- Environment (dev/staging/prod)
- Date range
- Custom tags

### User Context

Each feedback entry shows:
- User email and name
- User ID for tracking
- Environment where submitted
- Page URL and timestamp
- Browser/device information

## Troubleshooting

### Feedback Widget Not Appearing

```javascript
import { isFeedbackAvailable } from './utils/sentryFeedback';

if (!isFeedbackAvailable()) {
  console.log("Feedback integration not loaded");
}
```

### User Context Not Updating

```javascript
import { getCurrentUser } from './utils/auth';

const user = getCurrentUser();
console.log("Current user:", user);

// Manually update if needed
updateFeedbackUserContext();
```

### Debug Mode

Enable debug logging in development:

```javascript
// Check console for feedback-related logs
console.log("🎯 Feedback form opened with user context:", userContext);
console.log("✅ Feedback submitted by user:", userEmail);
```

## Security Considerations

- ✅ Sensitive fields automatically redacted
- ✅ Production data masking enabled
- ✅ User consent implied through feedback submission
- ✅ No passwords or tokens included in feedback

## Best Practices

1. **Place feedback buttons strategically** - After key user actions
2. **Use floating button** - For always-available feedback
3. **Monitor feedback regularly** - Set up Sentry alerts
4. **Respond to feedback** - Use email context to follow up
5. **Tag feedback appropriately** - For better organization

## API Reference

### Functions

- `openFeedbackWidget()` - Opens Sentry feedback form
- `submitFeedback(message, data)` - Submit programmatic feedback  
- `updateFeedbackUserContext()` - Refresh user context
- `isFeedbackAvailable()` - Check if feedback is enabled

### Components

- `<FeedbackButton>` - Standard feedback button
- `<FloatingFeedbackButton>` - Fixed position feedback button

### Hooks

User context automatically managed through existing auth system.
