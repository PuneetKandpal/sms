// Custom hooks for Social Post Agent functionality

import { useState, useCallback, useEffect } from "react";
import {
  generateStrategyBrief,
  generatePosts,
  fetchAssetIdeas,
  generateAssetIdea,
  fetchQualityMetrics,
  fetchAudienceData,
  simulateGenerationProcess,
} from "../api/mockApi";
import {
  DEFAULT_FORM_DATA,
  DEFAULT_UTM_PARAMS,
  DEFAULT_MOBILE_PREVIEW,
} from "../constants";
import toast from "react-hot-toast";

// Hook for managing strategy brief generation
export const useStrategyBrief = () => {
  const [briefState, setBriefState] = useState({
    isGenerating: false,
    currentActivity: "",
    completedTasks: [],
    tasks: [
      "Content fetch",
      "AI agent retrieving audience & voice from your knowledge base",
      "Planning",
      "Recommending Sequences and Hooks",
    ],
  });

  const [strategyData, setStrategyData] = useState(null);
  const [error, setError] = useState(null);

  const generateBrief = useCallback(
    async (formData) => {
      setBriefState((prev) => ({ ...prev, isGenerating: true }));
      setError(null);

      try {
        // Simulate progress for better UX
        const tasks = briefState.tasks;
        let currentTaskIndex = 0;

        const updateProgress = () => {
          if (currentTaskIndex < tasks.length) {
            setBriefState((prev) => ({
              ...prev,
              currentActivity: `Processing: ${tasks[currentTaskIndex]}`,
              completedTasks: tasks.slice(0, currentTaskIndex),
            }));
            currentTaskIndex++;
            setTimeout(updateProgress, 1000);
          }
        };

        updateProgress();

        const data = await generateStrategyBrief(formData);

        const hasStrategyPayload =
          !!data?.documentId ||
          !!data?.companyInfo ||
          !!data?.hooksAndPatterns ||
          !!data?.articleSummary ||
          !!data?.contentExtraction;

        setStrategyData(hasStrategyPayload ? data : null);

        setBriefState((prev) => ({
          ...prev,
          isGenerating: false,
          currentActivity: "Generation complete",
          completedTasks: tasks,
        }));

        // Reset after showing completion
        setTimeout(() => {
          setBriefState((prev) => ({
            ...prev,
            currentActivity: "",
            completedTasks: [],
          }));
        }, 2000);

        return data;
      } catch (err) {
        console.error("Strategy brief generation failed:", err);
        toast.error(
          err.response.data.error || "Strategy brief generation failed"
        );
        setBriefState((prev) => ({
          ...prev,
          isGenerating: false,
          currentActivity: "",
          completedTasks: [],
        }));
        throw err;
      }
    },
    [briefState.tasks]
  );

  return {
    briefState,
    strategyData,
    error,
    generateBrief,
  };
};

// Hook for managing post generation state
export const usePostGeneration = () => {
  const [generationState, setGenerationState] = useState({
    isGenerating: false,
    currentActivity: "",
    completedTasks: [],
    tasks: [
      "AI Agent Planning",
      "Creating Posts",
      "Creating Visual Prompts",
      "Evaluating",
      "Quality & Review",
    ],
  });

  const [postData, setPostData] = useState(null);
  const [error, setError] = useState(null);

  const generatePostsFromBrief = useCallback(
    async (strategyData, formData) => {
      setGenerationState((prev) => ({ ...prev, isGenerating: true }));
      setError(null);

      try {
        // Simulate progress for better UX
        const tasks = generationState.tasks;
        let currentTaskIndex = 0;

        const updateProgress = () => {
          if (currentTaskIndex < tasks.length) {
            setGenerationState((prev) => ({
              ...prev,
              currentActivity: `Processing: ${tasks[currentTaskIndex]}`,
              completedTasks: tasks.slice(0, currentTaskIndex),
            }));
            currentTaskIndex++;
            setTimeout(updateProgress, 1500);
          }
        };

        updateProgress();

        const data = await generatePosts(strategyData, formData);
        const hasPosts =
          Array.isArray(data?.posts?.posts) && data.posts.posts.length > 0;
        setPostData(hasPosts ? data : null);

        setGenerationState((prev) => ({
          ...prev,
          isGenerating: false,
          currentActivity: "Generation complete",
          completedTasks: tasks,
        }));

        // Reset after showing completion
        setTimeout(() => {
          setGenerationState((prev) => ({
            ...prev,
            currentActivity: "",
            completedTasks: [],
          }));
        }, 2000);

        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Post generation failed");
        setGenerationState((prev) => ({
          ...prev,
          isGenerating: false,
          currentActivity: "",
          completedTasks: [],
        }));
        throw err;
      }
    },
    [generationState.tasks]
  );

  return {
    generationState,
    postData,
    setPostData,
    error,
    generatePostsFromBrief,
  };
};

// Hook for managing asset ideas
export const useAssetIdeas = () => {
  const [assetIdeas, setAssetIdeas] = useState({
    linkedin: { A: [], B: [], C: [] },
    x: { A: [], B: [], C: [] },
    instagram: { A: [], B: [], C: [] },
    facebook: { A: [], B: [], C: [] },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAssetIdeas = useCallback(async (platform, variant) => {
    setLoading(true);
    setError(null);

    try {
      const ideas = await fetchAssetIdeas(platform, variant);
      setAssetIdeas((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          [variant]: ideas,
        },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load asset ideas"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addAssetIdea = useCallback(async (platform, variant) => {
    setLoading(true);
    setError(null);

    try {
      const newIdea = await generateAssetIdea(platform, variant);
      setAssetIdeas((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          [variant]: [...prev[platform][variant], newIdea],
        },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate asset idea"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addAssetVariant = useCallback(
    (platform, variant) => {
      const ideas = assetIdeas[platform][variant];
      if (ideas.length === 0) return;

      const lastIdea = ideas[ideas.length - 1];
      const newIdea = {
        ...lastIdea,
        id: Date.now(),
        overview: lastIdea.overview + " (alt)",
        textOnImage: lastIdea.textOnImage + " (alt)",
        prompt:
          lastIdea.prompt +
          " Alternative version with different visual approach.",
      };

      setAssetIdeas((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          [variant]: [...prev[platform][variant], newIdea],
        },
      }));
    },
    [assetIdeas]
  );

  return {
    assetIdeas,
    loading,
    error,
    loadAssetIdeas,
    addAssetIdea,
    addAssetVariant,
  };
};

// Hook for quality metrics
export const useQualityMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeContent = useCallback(async (content, platform) => {
    if (!content.trim()) {
      setMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qualityMetrics = await fetchQualityMetrics(content, platform);
      setMetrics(qualityMetrics);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze content"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const averageScore = metrics
    ? Math.round(
        Object.values(metrics).reduce((a, b) => a + b, 0) /
          Object.keys(metrics).length
      )
    : 0;

  return {
    metrics,
    averageScore,
    loading,
    error,
    analyzeContent,
  };
};

// Hook for audience data
export const useAudienceData = () => {
  const [audienceData, setAudienceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAudienceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAudienceData();
      setAudienceData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audience data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadAudienceData();
  }, [loadAudienceData]);

  return {
    audienceData,
    loading,
    error,
    loadAudienceData,
  };
};

// Hook for form state management
export const useFormState = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [utmParams, setUtmParams] = useState(DEFAULT_UTM_PARAMS);
  const [mobilePreview, setMobilePreview] = useState(DEFAULT_MOBILE_PREVIEW);

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateBrandSettings = useCallback((updates) => {
    setFormData((prev) => ({
      ...prev,
      brandSettings: { ...prev.brandSettings, ...updates },
    }));
  }, []);

  const buildUtmUrl = useCallback(() => {
    const baseUrl =
      formData.destinationUrl || formData.sourceUrl || "https://example.com";

    try {
      const url = new URL(baseUrl);
      url.searchParams.set("utm_source", utmParams.source || "linkedin");
      url.searchParams.set("utm_medium", utmParams.medium || "social");
      url.searchParams.set(
        "utm_campaign",
        utmParams.campaign || "brand_awareness_q4"
      );
      return url.toString();
    } catch {
      return baseUrl;
    }
  }, [formData.destinationUrl, formData.sourceUrl, utmParams]);

  return {
    formData,
    utmParams,
    mobilePreview,
    updateFormData,
    updateBrandSettings,
    setUtmParams,
    setMobilePreview,
    buildUtmUrl,
  };
};

// Hook for managing hooks and patterns
export const useContentStrategy = () => {
  const [hooks, setHooks] = useState([
    "Stop shipping posts that sound the same.",
    "Your team has incredible insights.",
    "Ready to see what happens when your content strategy gets a 15-minute AI makeover?",
  ]);
  const [selectedHook, setSelectedHook] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [selectedAngle, setSelectedAngle] = useState("ROI");

  const addHook = useCallback((hook) => {
    if (hook.trim()) {
      setHooks((prev) => [...prev, hook.trim()]);
    }
  }, []);

  const removeHook = useCallback(
    (index) => {
      setHooks((prev) => prev.filter((_, i) => i !== index));
      if (selectedHook >= hooks.length - 1) {
        setSelectedHook(Math.max(0, hooks.length - 2));
      }
    },
    [hooks.length, selectedHook]
  );

  const generateHook = useCallback(() => {
    const cannedHooks = [
      "Try a contrarian opener.",
      "What if everything you know about [topic] is wrong?",
      "The [industry] secret nobody talks about:",
      "I used to believe [common belief]. Then this happened:",
      "Everyone's doing [common practice]. Here's why that's backwards:",
    ];
    const randomHook =
      cannedHooks[Math.floor(Math.random() * cannedHooks.length)];
    addHook(randomHook);
  }, [addHook]);

  return {
    hooks,
    selectedHook,
    selectedPattern,
    selectedAngle,
    setSelectedHook,
    setSelectedPattern,
    setSelectedAngle,
    addHook,
    removeHook,
    generateHook,
  };
};
