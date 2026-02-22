import posthog from "posthog-js";

export const trackFeatureEnter = (featureName, metadata = {}) => {
  if (typeof window === "undefined") return;

  const userData = localStorage.getItem("user");

  const user = JSON.parse(userData);
  // TEST LOG - Simple console.log to verify logging works
  console.log(
    "🟢 TRACKING TEST: trackFeatureEnter called with:",
    featureName,
    metadata
  );

  // Get existing page metadata
  const pageMetadata = {
    page_url: window.location.pathname,
    page_title: document.title,
    ...metadata,
    userEmail: user.email,
  };

  // Send feature viewed event
  posthog.capture("feature_viewed", {
    feature: featureName,
    ...pageMetadata,
  });

  // Store enter time and current feature
  window.__featureEnterTime = Date.now();
  window.__currentFeature = featureName;
  window.__currentFeatureMetadata = pageMetadata;
};

export const trackFeatureExit = () => {
  if (typeof window === "undefined") return;

  const userData = localStorage.getItem("user");

  console.log("posthog -  userData -----", userData);

  const user = JSON.parse(userData);

  const enterTime = window.__featureEnterTime;
  const feature = window.__currentFeature;
  const metadata = window.__currentFeatureMetadata || {};

  if (!enterTime || !feature) return;

  const timeSpent = (Date.now() - enterTime) / 1000; // seconds

  posthog.capture("feature_left", {
    feature,
    time_spent_seconds: timeSpent,
    ...metadata,
    email: user.email,
  });

  // Clean up
  window.__featureEnterTime = null;
  window.__currentFeature = null;
  window.__currentFeatureMetadata = null;
};

export const trackFeatureAction = (action, actionMetadata = {}) => {
  if (typeof window === "undefined") return;

  const userData = localStorage.getItem("user");

  console.log("posthog -  userData -----", userData);

  const user = JSON.parse(userData);

  const feature = window.__currentFeature || "unknown";

  posthog.capture("feature_used", {
    feature,
    action,
    ...actionMetadata,
    email: user.email,
  });
};

// Page visibility change handler
const handleVisibilityChange = () => {
  if (document.visibilityState === "hidden") {
    trackFeatureExit();
  }
};

// Set up visibility change listener
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibilityChange, false);
}
