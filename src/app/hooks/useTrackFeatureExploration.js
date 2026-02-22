"use client";

import { useEffect } from "react";
import { useFeatureExploration } from "../context/FeatureExplorationContext";

export default function useTrackFeatureExploration(featureKey) {
  const { markFeatureExplored } = useFeatureExploration();

  useEffect(() => {
    if (!featureKey) return;

    markFeatureExplored([featureKey]).catch((error) => {
      console.error(
        `Error tracking feature exploration for ${featureKey}`,
        error
      );
    });
  }, [featureKey, markFeatureExplored]);
}
