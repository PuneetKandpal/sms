import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackFeatureEnter,
  trackFeatureExit,
} from "../lib/analytics/featureTracking";

export default function useFeatureTracking(featureName, metadata = {}) {
  const pathname = usePathname();
  const isMounted = useRef(true);
  const cleanupDone = useRef(false);
  const lastTrackedRef = useRef({
    feature: null,
    path: null,
    timestamp: 0,
  });

  // Track component mount state
  useEffect(() => {
    console.log(
      `🟢 [${new Date().toISOString()}] COMPONENT MOUNTED for:`,
      featureName
    );
    isMounted.current = true;

    return () => {
      console.log(
        `🔴 [${new Date().toISOString()}] COMPONENT UNMOUNTED for:`,
        featureName
      );
      isMounted.current = false;
    };
  }, [featureName]);

  // Track feature entry/exit
  useEffect(() => {
    if (!isMounted.current) return;

    const now = Date.now();
    const lastTracked = lastTrackedRef.current;
    const featureChanged = lastTracked.feature !== featureName;
    const pathChanged = lastTracked.path !== pathname;
    const cooldownPassed = now - lastTracked.timestamp > 5000; // 5 second cooldown

    // Only track if feature changed, path changed, or cooldown passed
    if (featureChanged || pathChanged || cooldownPassed) {
      console.log("🎯 Tracking feature enter:", featureName);
      trackFeatureEnter(featureName, metadata);

      lastTrackedRef.current = {
        feature: featureName,
        path: pathname,
        timestamp: now,
      };
    }

    const handleBeforeUnload = () => {
      if (!isMounted.current || cleanupDone.current) return;
      console.log(
        `⚠️ [${new Date().toISOString()}] BROWSER NAVIGATION: Tracking exit for`,
        featureName
      );
      trackFeatureExit();
      cleanupDone.current = true;
    };

    // Set up event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleBeforeUnload();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      if (cleanupDone.current) return;
      console.log("🧹 Cleaning up tracking for:", featureName);
      handleBeforeUnload();

      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      cleanupDone.current = true;
    };
  }, [featureName, pathname, metadata]);

  return null;
}
