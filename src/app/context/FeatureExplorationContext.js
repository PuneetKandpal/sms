"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  FEATURE_EXPLORATION_ITEMS,
  TOTAL_FEATURE_COUNT,
} from "../constants/featureExploration";

const FeatureExplorationContext = createContext();

export function useFeatureExploration() {
  const context = useContext(FeatureExplorationContext);
  if (!context) {
    throw new Error(
      "useFeatureExploration must be used within FeatureExplorationProvider"
    );
  }
  return context;
}

export function FeatureExplorationProvider({ children }) {
  const [featureLog, setFeatureLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch user's feature exploration log
  const fetchFeatureLog = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/agent-notifications/user-feature-log/");
      if (response.data.success) {
        setFeatureLog(response.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching feature log:", error);
      }
      setFeatureLog(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update feature exploration log
  const updateFeatureLog = useCallback(async (featureData) => {
    try {
      setIsSyncing(true);
      const response = await api.post(
        "/agent-notifications/user-feature-log/",
        featureData
      );
      if (response.data.success) {
        setFeatureLog(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating feature log:", error);
      toast.error("Failed to update feature exploration");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Mark a feature as explored
  const markFeatureExplored = useCallback(
    async (featurePath) => {
      // Build nested structure from path array
      // e.g., ["knowledge_base", "addSources"] -> { children: { knowledge_base: { children: { addSources: {} } } } }
      const buildNestedStructure = (path) => {
        if (path.length === 0) {
          return { isExp: true, children: {} };
        }

        const [current, ...rest] = path;
        return {
          isExp: true,
          children: {
            [current]: buildNestedStructure(rest),
          },
        };
      };

      const featureData = buildNestedStructure(featurePath);
      const success = await updateFeatureLog(featureData);

      if (success) {
        return true;
      }
      return false;
    },
    [updateFeatureLog]
  );

  // Check if a feature is explored
  const isFeatureExplored = useCallback(
    (featurePath) => {
      if (!featureLog || !featureLog.children) return false;

      let current = featureLog.children;
      for (const key of featurePath) {
        if (!current[key]) return false;
        if (current[key].isExp !== true) return false;
        current = current[key].children || {};
      }
      return true;
    },
    [featureLog]
  );

  // Get exploration statistics
  const getExplorationStats = useCallback(() => {
    const total = TOTAL_FEATURE_COUNT;
    if (total === 0) {
      return { explored: 0, total: 0, percentage: 0 };
    }

    let explored = 0;
    FEATURE_EXPLORATION_ITEMS.forEach((item) => {
      if (isFeatureExplored([item.key])) {
        explored += 1;
      }
    });

    const percentage = Math.round((explored / total) * 100);
    return { explored, total, percentage };
  }, [isFeatureExplored]);

  // Initialize on mount
  useEffect(() => {
    fetchFeatureLog();
  }, [fetchFeatureLog]);

  const value = {
    featureLog,
    isLoading,
    isSyncing,
    fetchFeatureLog,
    updateFeatureLog,
    markFeatureExplored,
    isFeatureExplored,
    getExplorationStats,
    featureList: FEATURE_EXPLORATION_ITEMS,
    totalFeatureCount: TOTAL_FEATURE_COUNT,
  };

  return (
    <FeatureExplorationContext.Provider value={value}>
      {children}
    </FeatureExplorationContext.Provider>
  );
}
