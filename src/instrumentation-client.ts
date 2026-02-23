// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import {
  getSentryConfig,
  getCurrentEnvironment,
  getEnvironmentConfig,
} from "./config/sentry.config";
import { getCurrentUser } from "./app/utils/auth.js";

// posthog
import posthog from "posthog-js";

// Initialize PostHog if available
// if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
//   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
//     api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
//     defaults: "2025-05-24",
//   });
// } else {
//   console.log("PostHog key not found, skipping initialization");
// }

// Get environment-specific configuration
const sentryConfig = getSentryConfig();
const currentEnvironment = getCurrentEnvironment();

console.log(
  `🔧 Initializing Sentry Client for environment: ${currentEnvironment}`
);

// Helper function to get user context for feedback
const getUserContextForFeedback = () => {
  try {
    const user = getCurrentUser();

    if (currentEnvironment === "development") {
      console.log("📊 Getting user context for feedback:", {
        userId: user?.id,
        userEmail: user?.email,
        userFullName: user?.fullName,
      });
    }

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.fullName || user.email, // Use fullName, fallback to email
        username: user.fullName || user.email, // IMPORTANT: username is used for "Your Name" field
      };
    }
  } catch (error) {
    console.warn("Failed to get user context for feedback:", error);
  }

  return {
    id: "anonymous",
    email: "anonymous@unknown.com",
    name: "Anonymous User",
    username: "anonymous",
  };
};

Sentry.init({
  ...sentryConfig,

  // Client-specific integrations
  integrations: [
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
      submitButtonText: "Submit Feedback",
      submitButtonAriaLabel: "Submit Feedback",
      feedbackLabel: "Feedback",
      feedbackPlaceholder: "Please enter your feedback here...",
      feedbackSuccessMessage: "Thank you for your feedback!",
      feedbackErrorMessage: "Failed to submit feedback. Please try again.",
      feedbackRequired: true,
      feedbackRequiredMessage: "Please enter your feedback.",
      feedbackRequiredError: "Please enter your feedback.",

      // Custom form fields for additional metadata
      formTitle: "Send us your feedback",
      nameLabel: "Your Name",
      emailLabel: "Your Email",
      removeScreenshotButtonLabel: "Remove Screenshot",
      addScreenshotButtonLabel: "Add Screenshot",
      isNameRequired: false,
      isEmailRequired: true,

      // Auto-populate user data if available
      onFormOpen: () => {
        // Get FRESH user context each time form opens
        const userContext = getUserContextForFeedback();

        console.log("userContext for feedback------->", userContext);

        // Update Sentry user context when feedback form opens
        Sentry.setUser({
          id: userContext.id,
          email: userContext.email,
          username: userContext.name, // Use name for "Your Name" field
        });

        // Add additional context
        Sentry.setTag("feedback_session", true);
        Sentry.setContext("feedback_metadata", {
          timestamp: new Date().toISOString(),
          environment: currentEnvironment,
          userAgent:
            typeof window !== "undefined"
              ? window.navigator?.userAgent
              : "unknown",
          url: typeof window !== "undefined" ? window.location.href : "unknown",
        });

        if (currentEnvironment === "development") {
          console.log(
            "🎯 Feedback form opened with user context:",
            userContext
          );
          console.log("📧 User email:", userContext.email);
          console.log("👤 User name:", userContext.name);
        }
      },

      // Handle feedback submission
      onFormSubmitted: () => {
        const userContext = getUserContextForFeedback();

        // Log feedback submission
        if (currentEnvironment === "development") {
          console.log("✅ Feedback submitted by user:", userContext.email);
          console.log("📸 Check if screenshot was attached");
        }

        // Add breadcrumb for feedback submission
        Sentry.addBreadcrumb({
          message: "User submitted feedback",
          category: "user_interaction",
          level: "info",
          data: {
            user_email: userContext.email,
            user_name: userContext.name,
            environment: currentEnvironment,
          },
        });
      },
    }),

    Sentry.replayIntegration({
      // Environment-specific replay settings
      maskAllText: currentEnvironment === "production", // Mask text in production only
      blockAllMedia: currentEnvironment === "production", // Block media in production only
    }),
    Sentry.browserTracingIntegration(),
    // Console logging integration with environment-specific levels
    Sentry.consoleLoggingIntegration({
      levels:
        currentEnvironment === "development"
          ? ["log", "error", "warn", "info", "debug"]
          : ["error", "warn"],
    }),
  ],

  // Environment-specific beforeSend hook
  beforeSend: (event, hint) => {
    // Add environment context to all events
    event.tags = {
      ...event.tags,
      environment: currentEnvironment,
      client_side: true,
      build_time:
        process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    };

    // Add environment-specific context
    event.contexts = {
      ...event.contexts,
      app: {
        name: "jbi-frontend",
        version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        environment: currentEnvironment,
        build_time: process.env.NEXT_PUBLIC_BUILD_TIME,
      },
      deployment: {
        environment: currentEnvironment,
        url: typeof window !== "undefined" ? window.location.origin : "unknown",
        vercel_env: process.env.NEXT_PUBLIC_VERCEL_ENV,
        vercel_url: process.env.NEXT_PUBLIC_VERCEL_URL,
      },
    };

    // Call the environment-specific beforeSend function
    return sentryConfig.beforeSend(event);
  },

  // Environment-specific error filtering
  ignoreErrors: [
    // Common browser errors to ignore in all environments
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    "Script error.",

    // Development-only errors to ignore in production
    ...(currentEnvironment === "production"
      ? ["ChunkLoadError", "Loading chunk", "Loading CSS chunk"]
      : []),
  ],
});

// Set initial user context - will update when user logs in
// Try to get user from localStorage if available
if (typeof window !== "undefined") {
  // Defer user context setting to ensure localStorage is loaded
  setTimeout(() => {
    const initialUserContext = getUserContextForFeedback();
    Sentry.setUser({
      id: initialUserContext.id,
      email: initialUserContext.email,
      username: initialUserContext.name, // Use name for "Your Name" field
      environment: currentEnvironment,
    });

    if (
      currentEnvironment === "development" &&
      initialUserContext.id !== "anonymous"
    ) {
      console.log(
        "✅ Initial Sentry user context set:",
        initialUserContext.email,
        "name:",
        initialUserContext.name
      );
    }
  }, 100);
}

// Set global tags
Sentry.setTag("environment", currentEnvironment);
Sentry.setTag("client_side", true);

// Environment-specific console logging
if (currentEnvironment === "development") {
  const envConfig = getEnvironmentConfig();
  console.log("🎯 Sentry Client initialized with config:", {
    environment: currentEnvironment,
    dsn: sentryConfig.dsn ? "configured" : "missing",
    tracesSampleRate: envConfig.tracesSampleRate,
    replaysSessionSampleRate: envConfig.replaysSessionSampleRate,
    debug: envConfig.debug,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
