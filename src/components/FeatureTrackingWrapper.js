import React from "react";
import useFeatureTracking from "../hooks/useFeatureTracking";

/**
 * A reusable wrapper component that adds feature tracking to any page component
 *
 * Usage:
 * <FeatureTrackingWrapper
 *   featureName="Page Name"
 *   metadata={{ feature_category: "category", page_section: "section" }}
 * >
 *   <YourPageComponent />
 * </FeatureTrackingWrapper>
 */
const FeatureTrackingWrapper = ({
  children,
  featureName,
  metadata = {},
  trackActions = false,
}) => {
  // Track feature usage
  useFeatureTracking(featureName, metadata);

  // If trackActions is enabled, we could add action tracking logic here
  // For now, the component just tracks page views

  return <>{children}</>;
};

export default FeatureTrackingWrapper;
