"use client";
import EnhancedSocialSchedulerPage from "./enhanced-page";
import useFeatureTracking from "../../hooks/useFeatureTracking";
import useTrackFeatureExploration from "../hooks/useTrackFeatureExploration";

export default function SocialSchedulerPage() {
  useTrackFeatureExploration("social_scheduler");

  useFeatureTracking("Social Scheduler", {
    feature_category: "content_management",
    page_section: "social_scheduler",
  });

  return <EnhancedSocialSchedulerPage />;
}
