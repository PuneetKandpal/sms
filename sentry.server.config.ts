// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  getSentryConfig,
  getCurrentEnvironment,
  getEnvironmentConfig,
} from "./src/config/sentry.config.js";

// Get environment-specific configuration
const sentryConfig = getSentryConfig();
const currentEnvironment = getCurrentEnvironment();

console.log(
  `🔧 Initializing Sentry Server for environment: ${currentEnvironment}`
);

Sentry.init({
  ...sentryConfig,

  // Server-specific integrations
  integrations: [
    // Add server-specific integrations based on environment
    ...(currentEnvironment === "development"
      ? [
          // Development-specific server integrations
        ]
      : []),

    // Console logging integration with environment-specific levels
    Sentry.consoleLoggingIntegration({
      levels:
        currentEnvironment === "development"
          ? ["log", "error", "warn", "info"]
          : ["error", "warn"],
    }),
  ],

  // Server-specific beforeSend hook
  beforeSend: (event, hint) => {
    // Add server-side context to all events
    event.tags = {
      ...event.tags,
      environment: currentEnvironment,
      server_side: true,
      node_version: process.version,
    };

    // Add server-specific context
    event.contexts = {
      ...event.contexts,
      app: {
        name: "jbi-frontend-server",
        version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        environment: currentEnvironment,
        node_version: process.version,
      },
      server: {
        environment: currentEnvironment,
        platform: process.platform,
        arch: process.arch,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      deployment: {
        environment: currentEnvironment,
        vercel_env: process.env.VERCEL_ENV,
        vercel_url: process.env.VERCEL_URL,
        railway_env: process.env.RAILWAY_ENVIRONMENT,
      },
    };

    // Call the environment-specific beforeSend function
    return sentryConfig.beforeSend(event);
  },

  // Server-specific error filtering
  ignoreErrors: [
    // Common server errors to ignore
    "ECONNRESET",
    "EPIPE",
    "ENOTFOUND",

    // Environment-specific ignores
    ...(currentEnvironment === "development"
      ? ["Module not found", "Cannot resolve module"]
      : []),
  ],
});

// Set server-side tags
Sentry.setTag("environment", currentEnvironment);
Sentry.setTag("server_side", true);
Sentry.setTag("node_version", process.version);

// Environment-specific console logging
if (currentEnvironment === "development") {
  const envConfig = getEnvironmentConfig();
  console.log("🎯 Sentry Server initialized with config:", {
    environment: currentEnvironment,
    dsn: sentryConfig.dsn ? "configured" : "missing",
    tracesSampleRate: envConfig.tracesSampleRate,
    debug: envConfig.debug,
  });
}
