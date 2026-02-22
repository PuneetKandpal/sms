/**
 * Sentry Feedback Utilities
 * Helper functions for managing Sentry feedback with user context
 */

import * as Sentry from "@sentry/nextjs";
import { getCurrentUser } from "./auth.js";

/**
 * Open Sentry feedback widget with current user context
 * This ensures the feedback form has the latest user information
 */
export function openFeedbackWidget() {
  try {
    // Update user context before opening feedback
    const user = getCurrentUser();

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.email,
        name: user.fullName || user.email,
      });

      // Add current page context
      Sentry.setContext("feedback_page", {
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        pathname:
          typeof window !== "undefined" ? window.location.pathname : "unknown",
        timestamp: new Date().toISOString(),
      });

      console.log("🎯 Opening feedback widget for user:", user.email);
    }

    // Open the feedback widget
    const feedbackIntegration =
      Sentry.getClient()?.getIntegrationByName?.("Feedback");
    if (feedbackIntegration) {
      feedbackIntegration.openDialog();
    } else {
      console.warn("Sentry feedback integration not found");
    }
  } catch (error) {
    console.error("Failed to open feedback widget:", error);
  }
}

/**
 * Submit programmatic feedback with user context
 * Useful for automated feedback submission or custom feedback forms
 */
export function submitFeedback(message, additionalData = {}) {
  try {
    const user = getCurrentUser();

    // Create feedback event
    const feedbackEvent = {
      message,
      level: "info",
      user: user
        ? {
            id: user.id,
            email: user.email,
            username: user.email,
            name: user.fullName || user.email,
          }
        : {
            id: "anonymous",
            email: "anonymous@unknown.com",
            username: "anonymous",
            name: "Anonymous User",
          },
      tags: {
        feedback_type: "programmatic",
        environment: process.env.NODE_ENV || "development",
        ...additionalData.tags,
      },
      extra: {
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        userAgent:
          typeof window !== "undefined"
            ? window.navigator?.userAgent
            : "unknown",
        ...additionalData.extra,
      },
    };

    // Send feedback to Sentry
    Sentry.captureUserFeedback({
      event_id: Sentry.captureMessage(message, "info"),
      name: feedbackEvent.user.name,
      email: feedbackEvent.user.email,
      comments: message,
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      message: "Programmatic feedback submitted",
      category: "feedback",
      level: "info",
      data: {
        user_email: feedbackEvent.user.email,
        message_length: message.length,
      },
    });

    console.log("✅ Programmatic feedback submitted:", {
      user: feedbackEvent.user.email,
      message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit programmatic feedback:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user context for feedback
 * Call this when user data changes to ensure feedback has latest info
 */
export function updateFeedbackUserContext() {
  try {
    const user = getCurrentUser();

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.email,
        name: user.fullName || user.email,
      });

      Sentry.setTag("user_authenticated", true);
      Sentry.setTag("user_id", user.id);
    } else {
      Sentry.setUser({
        id: "anonymous",
        email: "anonymous@unknown.com",
        username: "anonymous",
        name: "Anonymous User",
      });

      Sentry.setTag("user_authenticated", false);
    }

    console.log("🎯 Feedback user context updated");
  } catch (error) {
    console.warn("Failed to update feedback user context:", error);
  }
}

/**
 * Check if feedback integration is available
 */
export function isFeedbackAvailable() {
  try {
    const client = Sentry.getClient();
    const feedbackIntegration = client?.getIntegrationByName?.("Feedback");
    return !!feedbackIntegration;
  } catch (error) {
    console.warn("Failed to check feedback availability:", error);
    return false;
  }
}
