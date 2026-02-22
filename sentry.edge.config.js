// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  getSentryConfig,
  getCurrentEnvironment,
} from "./src/config/sentry.config.js";

// Get environment-specific configuration
const sentryConfig = getSentryConfig();
const currentEnvironment = getCurrentEnvironment();

console.log(
  `🔧 Initializing Sentry Edge for environment: ${currentEnvironment}`
);

Sentry.init({
  ...sentryConfig,

  // Edge-specific beforeSend hook
  beforeSend: (event, hint) => {
    // Add edge runtime context to all events
    event.tags = {
      ...event.tags,
      environment: currentEnvironment,
      edge_runtime: true,
    };

    // Add edge-specific context
    event.contexts = {
      ...event.contexts,
      app: {
        name: "jbi-frontend-edge",
        version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        environment: currentEnvironment,
      },
      edge: {
        environment: currentEnvironment,
        runtime: "edge",
      },
      deployment: {
        environment: currentEnvironment,
        vercel_env: process.env.VERCEL_ENV,
        vercel_url: process.env.VERCEL_URL,
      },
    };

    // Call the environment-specific beforeSend if it exists
    if (sentryConfig.beforeSend) {
      return sentryConfig.beforeSend(event, hint);
    }

    return event;
  },
});

// Set edge runtime tags
Sentry.setTag("environment", currentEnvironment);
Sentry.setTag("edge_runtime", true);

// Environment-specific console logging
if (currentEnvironment === "development") {
  console.log("🎯 Sentry Edge initialized with config:", {
    environment: currentEnvironment,
    dsn: sentryConfig.dsn ? "configured" : "missing",
    tracesSampleRate: sentryConfig.tracesSampleRate,
    debug: sentryConfig.debug,
  });
}
