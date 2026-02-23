// Sentry Environment Configuration
// This file contains environment-specific settings for Sentry

const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
};

// Get current environment
const getCurrentEnvironment = () => {
  // Check explicit environment variable first
  if (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) {
    return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  }

  // Fallback to NODE_ENV
  const nodeEnv = process.env.NODE_ENV;

  // Map NODE_ENV to Sentry environments
  switch (nodeEnv) {
    case "development":
      return ENVIRONMENTS.DEVELOPMENT;
    case "production":
      // Check if this is staging based on URL or other indicators
      if (
        process.env.NEXT_PUBLIC_APP_URL?.includes("staging") ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
      ) {
        return ENVIRONMENTS.STAGING;
      }
      return ENVIRONMENTS.PRODUCTION;
    default:
      return ENVIRONMENTS.DEVELOPMENT;
  }
};

// //Environment-specific DSNs (you can use the same DSN for all environments)
// const SENTRY_DSN =
//   process.env.NEXT_PUBLIC_SENTRY_DSN ||
//   "https://f9d89ed574692c80288ed3a0ef2a18e2@o935625.ingest.us.sentry.io/4510242216083456";

const SENTRY_DSN = "";

// Environment-specific configuration
const getEnvironmentConfig = () => {
  const environment = getCurrentEnvironment();

  const baseConfig = {
    dsn: SENTRY_DSN,
    environment,
    enableLogs: true,
    sendDefaultPii: true,
  };

  switch (environment) {
    case ENVIRONMENTS.DEVELOPMENT:
      return {
        ...baseConfig,
        debug: true, // Enable debug mode in development
        tracesSampleRate: 1.0, // Capture 100% of traces in development
        replaysSessionSampleRate: 1.0, // Capture 100% of sessions
        replaysOnErrorSampleRate: 1.0, // Capture 100% of error sessions
        integrations: [
          // Add development-specific integrations
        ],
      };

    case ENVIRONMENTS.STAGING:
      return {
        ...baseConfig,
        debug: false,
        tracesSampleRate: 0.5, // Capture 50% of traces in staging
        replaysSessionSampleRate: 0.3, // Capture 30% of sessions
        replaysOnErrorSampleRate: 1.0, // Capture 100% of error sessions
        integrations: [
          // Add staging-specific integrations
        ],
      };

    case ENVIRONMENTS.PRODUCTION:
      return {
        ...baseConfig,
        debug: false,
        tracesSampleRate: 0.1, // Capture 10% of traces in production
        replaysSessionSampleRate: 0.1, // Capture 10% of sessions
        replaysOnErrorSampleRate: 1.0, // Capture 100% of error sessions
        integrations: [
          // Add production-specific integrations
        ],
      };

    default:
      return baseConfig;
  }
};

// Environment-specific beforeSend function
const getBeforeSendFunction = () => {
  const environment = getCurrentEnvironment();

  switch (environment) {
    case ENVIRONMENTS.DEVELOPMENT:
      return (event) => {
        // Log events to console in development
        console.log("Sentry Event (Development):", event);
        return event;
      };

    case ENVIRONMENTS.STAGING:
      return (event) => {
        // Add staging-specific processing
        event.tags = {
          ...event.tags,
          deployment: "staging",
          version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        };
        return event;
      };

    case ENVIRONMENTS.PRODUCTION:
      return (event) => {
        // Add production-specific processing
        event.tags = {
          ...event.tags,
          deployment: "production",
          version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        };

        // Filter out development-only errors in production
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (
            error?.value?.includes("development") ||
            error?.value?.includes("localhost")
          ) {
            return null; // Don't send development errors
          }
        }

        return event;
      };

    default:
      return (event) => event;
  }
};

// Release configuration
const getReleaseConfig = () => {
  const environment = getCurrentEnvironment();

  // Generate release name based on environment
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
    "unknown";

  return {
    release: `jbi-frontend@${version}-${environment}`,
    dist: environment,
  };
};

// Export configuration functions
export {
  ENVIRONMENTS,
  getCurrentEnvironment,
  getEnvironmentConfig,
  getReleaseConfig,
  getBeforeSendFunction,
  SENTRY_DSN,
};

// Export the complete Sentry configuration
export const getSentryConfig = () => {
  const environmentConfig = getEnvironmentConfig();
  const releaseConfig = getReleaseConfig();
  const beforeSend = getBeforeSendFunction();

  return {
    ...environmentConfig,
    ...releaseConfig,
    beforeSend,
  };
};
