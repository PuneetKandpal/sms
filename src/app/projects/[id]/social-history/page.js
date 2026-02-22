"use client";
// Social Posts History - View previously generated social media posts

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { formatLocalDate } from "../../../../utils/dateUtils";
import { use } from "react";
import { useSelection } from "../../../context/SelectionContext";
import { useScheduledPosts } from "../../../../contexts/ScheduledPostsContext";

import { INTENTS, KPIS, PLATFORMS } from "../../../../constants";
import {
  generateQualityMetrics,
  generatePostImage,
  editPostImage,
  getSocialPostsByDocument,
} from "../../../../api/mockApi";
import { useFormState } from "../../../../hooks/useSocialPostAgent";
import toast from "react-hot-toast";
import ArticleSummaryModal from "../../../components/ArticleSummaryModal";
import PlatformMobilePreview from "../../../components/socials/PlatformMobilePreview";
import api from "../../../../api/axios";
import { InfoIcon } from "lucide-react";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";

export default function SocialHistoryPage({ params }) {
  const { id: projectId } = use(params);
  const { selectedProject } = useSelection();

  // Track feature usage
  useFeatureTracking("Social History", {
    feature_category: "content_management",
    page_section: "social_history",
    project_id: projectId,
  });

  // UTM state management
  const { utmParams, setUtmParams, buildUtmUrl } = useFormState();

  // State for historical data
  const [historicalTasks, setHistoricalTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedTaskData, setSelectedTaskData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [strategyData, setStrategyData] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState(null);

  // Local state for UI (identical to socials page)
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editText, setEditText] = useState("");
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [selectedVisualIndex, setSelectedVisualIndex] = useState(0);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [mobilePreviewSettings, setMobilePreviewSettings] = useState({
    darkMode: false,
    showAsset: true,
  });
  const [showInfo, setShowInfo] = useState(false);
  const [copiedPostIndex, setCopiedPostIndex] = useState(null);
  const [imageGenerating, setImageGenerating] = useState({});
  const [imageEditPrompt, setImageEditPrompt] = useState("");
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [currentImagePostIndex, setCurrentImagePostIndex] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [lastGoodImages, setLastGoodImages] = useState({});
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [previewPost, setPreviewPost] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    postsToSchedule: [],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [qualityMetrics, setQualityMetrics] = useState({});

  // Article summary modal state
  const [showArticleSummaryModal, setShowArticleSummaryModal] = useState(false);
  const [articleSummary, setArticleSummary] = useState(null);
  const [copyingArticleSummary, setCopyingArticleSummary] = useState(false);

  // Campaign options
  const defaultCampaigns = [
    "Brand Awareness Q4",
    "Product Launch 2024",
    "Lead Generation Campaign",
    "Customer Retention Drive",
    "Holiday Marketing Push",
    "Thought Leadership Series",
    "Content Marketing Boost",
    "Social Media Engagement",
    "Website Traffic Growth",
    "Email List Building",
    "Partnership Announcement",
    "Industry Event Promotion",
    "User-Generated Content",
    "Seasonal Sales Campaign",
    "Educational Content Series",
  ];

  const [availableCampaigns, setAvailableCampaigns] =
    useState(defaultCampaigns);

  // Handler functions for scheduling
  const handleScheduleClick = (postsToSchedule = []) => {
    const posts =
      postsToSchedule.length > 0
        ? postsToSchedule
        : selectedPosts.length > 0
        ? selectedPosts
        : [selectedPostIndex];
    setScheduleData((prev) => ({
      ...prev,
      postsToSchedule: posts,
    }));
    setShowConfirmDialog(true);
  };

  const { addMultipleScheduledPosts, getScheduledPostsCount } =
    useScheduledPosts();

  const [isScheduling, setIsScheduling] = useState(false);

  const handleInfoMouseEnter = () => {
    setShowInfo(true);
  };

  const handleInfoMouseLeave = () => {
    setShowInfo(false);
  };

  const handleFinalSchedule = async () => {
    try {
      setIsScheduling(true);
      const postsToSchedule = scheduleData.postsToSchedule;

      // Prepare posts for batch API
      const postsForBatch = postsToSchedule
        .map((postIndex) => {
          const post = postData?.posts?.posts?.[postIndex];
          return {
            post_id: post._id || `generated_post_${postIndex}`,
            document_id: post.document_id || `document_${Date.now()}`,
            project_id: selectedProject?.id,
          };
        })
        .filter((post) => post.post_id && post.document_id && post.project_id);

      const response = await api.post(
        "/social-media/social-media-scheduler/batch/",
        {
          posts: postsForBatch,
        }
      );

      console.log("response------------", response);

      const result = response.data;

      console.log("result------------", result);

      if (result.success) {
        // Extract counts from the result
        const {
          total,
          successful,
          failed,
          already_scheduled,
          newly_scheduled,
        } = result.summary;

        // Create detailed success/error messages
        let successMessage = "";
        let errorMessage = "";

        if (newly_scheduled > 0) {
          successMessage += `${newly_scheduled} post${
            newly_scheduled !== 1 ? "s" : ""
          } scheduled successfully`;
        }

        if (already_scheduled > 0) {
          if (successMessage) successMessage += ", ";
          successMessage += `${already_scheduled} post${
            already_scheduled !== 1 ? "s were" : " was"
          } already scheduled`;
        }

        if (failed > 0) {
          errorMessage = `${failed} post${
            failed !== 1 ? "s" : ""
          } failed to schedule`;
        }

        // Show appropriate messages
        if (successMessage) {
          toast.success(`${successMessage}!`);
        }
        if (errorMessage) {
          const failedPosts = result.results.filter((r) => !r.success);
          const duplicateCount = failedPosts.filter(
            (r) => r.already_scheduled
          ).length;
          const errorCount = failed - duplicateCount;

          if (duplicateCount > 0 && errorCount > 0) {
            toast.error(
              `${duplicateCount} duplicate${
                duplicateCount !== 1 ? "s" : ""
              } and ${errorCount} error${errorCount !== 1 ? "s" : ""}`
            );
          } else if (duplicateCount > 0) {
            toast.error(
              `${duplicateCount} post${
                duplicateCount !== 1 ? "s" : ""
              } already scheduled`
            );
          } else if (errorCount > 0) {
            toast.error(
              `${errorCount} post${
                errorCount !== 1 ? "s" : ""
              } failed due to error${errorCount !== 1 ? "s" : ""}`
            );
          }
        }
      } else {
        throw new Error(result.message || "Failed to schedule posts");
      }

      setShowConfirmDialog(false);
      setSelectedPosts([]);

      // Reset schedule data
      setScheduleData({
        date: "",
        time: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        postsToSchedule: [],
      });
    } catch (error) {
      console.error("Error in batch scheduling process:", error);
      toast.error(`Failed to schedule posts: ${error.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  // Handler for adding new campaign
  const handleAddCampaign = () => {
    if (
      newCampaignName.trim() &&
      !availableCampaigns.includes(newCampaignName.trim())
    ) {
      setAvailableCampaigns((prev) => [...prev, newCampaignName.trim()]);
      setNewCampaignName("");
      setShowAddCampaignModal(false);
    }
  };

  // Handle article summary copy
  const handleCopyArticleSummary = async () => {
    setCopyingArticleSummary(true);

    trackFeatureAction("social_article_summary_copy_started", {
      project_id: projectId,
      task_id: selectedTaskId,
      summary_length: articleSummary?.summary?.length || 0,
    });

    try {
      await navigator.clipboard.writeText(articleSummary?.summary || "");

      trackFeatureAction("social_article_summary_copy_success", {
        project_id: projectId,
        task_id: selectedTaskId,
        summary_length: articleSummary?.summary?.length || 0,
      });

      // Add visual feedback
      setTimeout(() => setCopyingArticleSummary(false), 1000);
    } catch (error) {
      console.error("Failed to copy article summary:", error);

      trackFeatureAction("social_article_summary_copy_failed", {
        project_id: projectId,
        task_id: selectedTaskId,
        error_message: error.message,
      });

      setTimeout(() => setCopyingArticleSummary(false), 1000);
    }
  };

  // Track article summary modal interactions
  const handleOpenArticleSummaryModal = () => {
    trackFeatureAction("social_article_summary_modal_opened", {
      project_id: projectId,
      task_id: selectedTaskId,
      has_summary: !!articleSummary?.summary,
    });
    setShowArticleSummaryModal(true);
  };

  const handleCloseArticleSummaryModal = () => {
    trackFeatureAction("social_article_summary_modal_closed", {
      project_id: projectId,
      task_id: selectedTaskId,
      modal_duration: Date.now() - (articleSummaryModalOpenTime || Date.now()),
    });
    setShowArticleSummaryModal(false);
  };

  // Track when modal was opened
  const [articleSummaryModalOpenTime, setArticleSummaryModalOpenTime] =
    useState(null);

  useEffect(() => {
    if (showArticleSummaryModal) {
      setArticleSummaryModalOpenTime(Date.now());
    }
  }, [showArticleSummaryModal]);

  // Fetch historical tasks on component mount
  useEffect(() => {
    if (projectId) {
      fetchHistoricalTasks();
    }
  }, [projectId]);

  // Fetch historical tasks from API
  const fetchHistoricalTasks = async () => {
    try {
      setLoading("first");
      setError(null);

      trackFeatureAction("social_history_fetch_started", {
        project_id: projectId,
      });

      const response = await api.get(
        `/social-media/social-media-data-by-project/?project_id=${projectId}`
      );

      if (!response.data) {
        throw new Error("Failed to fetch historical tasks");
      }

      const data = response.data;

      if (data.success && data.data) {
        setHistoricalTasks(data.data);

        trackFeatureAction("social_history_fetch_success", {
          project_id: projectId,
          tasks_count: data.data.length,
        });
      }
    } catch (err) {
      console.error("Error fetching historical tasks:", err);
      setError(err.message);

      trackFeatureAction("social_history_fetch_failed", {
        project_id: projectId,
        error_message: err.message,
      });
    } finally {
      setLoading("");
    }
  };

  // Fetch posts for selected task
  const fetchTaskPosts = async (documentId) => {
    try {
      setLoading("second");
      setError(null);

      trackFeatureAction("social_posts_fetch_started", {
        project_id: projectId,
        document_id: documentId,
      });

      const { posts } = await getSocialPostsByDocument(documentId);

      // Set posts data directly from the API response
      setPostData({ posts: { posts: posts } });
      // Generate new random metrics for each generation
      setQualityMetrics(generateQualityMetrics());

      trackFeatureAction("social_posts_fetch_success", {
        project_id: projectId,
        document_id: documentId,
        posts_count: posts.length,
      });
    } catch (err) {
      console.error("Error fetching task posts:", err);
      setError(err.message);
      setPostData({ posts: { posts: [] } });

      trackFeatureAction("social_posts_fetch_failed", {
        project_id: projectId,
        document_id: documentId,
        error_message: err.message,
      });
    } finally {
      setLoading("");
    }
  };

  // Handle task selection
  const handleTaskSelect = async (taskId) => {
    if (!taskId) {
      setSelectedTaskId("");
      setSelectedTaskData(null);
      setPostData(null);
      setStrategyData(null);
      return;
    }

    setSelectedTaskId(taskId);

    // Find the selected task data
    const taskData = historicalTasks.find((task) => task._id === taskId);

    console.log("taskData------------", taskData);

    setSelectedTaskData(taskData);

    trackFeatureAction("social_task_selected", {
      project_id: projectId,
      task_id: taskId,
      task_type: taskData?.task_type || "unknown",
    });

    // Set strategy data from task data
    if (taskData && taskData.company_information) {
      setStrategyData({
        companyInfo: taskData.company_information,
      });
    }

    // Set article summary from task data
    if (taskData && taskData.article_summary) {
      setArticleSummary({
        summary: taskData.article_summary,
        generation_successful: true,
        summary_length: taskData.article_summary?.length || 0,
        content_extraction: {
          page_content: taskData.page_content || "",
          page_content_length: taskData.page_content?.length || 0,
          extraction_successful: !!taskData.page_content,
        },
      });
    } else {
      setArticleSummary(null);
    }

    // Fetch posts for this task
    await fetchTaskPosts(taskId);
  };

  // Handle edit popup
  const handleRecreate = () => {
    console.log("Recreating image with instructions:", editText);
    setShowEditPopup(false);
    setEditText("");
  };

  // Calculate average score
  const avgScore =
    Object.keys(qualityMetrics).length > 0
      ? Math.round(
          Object.values(qualityMetrics).reduce((a, b) => a + b, 0) /
            Object.keys(qualityMetrics).length
        )
      : 0;

  // Copy to clipboard utility
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const handleCopyPost = (text, index) => {
    copyToClipboard(text);
    setCopiedPostIndex(index);
    setTimeout(() => setCopiedPostIndex(null), 1200);
  };

  // Handle image generation
  const handleGenerateImage = async (postIndex, isRegenerate = false) => {
    if (!postData?.posts?.posts?.[postIndex]) return;

    const post = postData.posts.posts[postIndex];
    const postId = post._id || `post_${postIndex}`;

    setImageGenerating((prev) => ({ ...prev, [postIndex]: true }));

    trackFeatureAction("social_image_generation_started", {
      project_id: projectId,
      post_id: postId,
      post_index: postIndex,
      is_regenerate: isRegenerate,
    });

    try {
      let result;
      if (isRegenerate && imageEditPrompt.trim()) {
        // Use edit API for regeneration with custom prompt
        result = await editPostImage(postId, imageEditPrompt);
      } else {
        // Use the original image prompt or a default one
        const defaultPrompt =
          post.image_prompt ||
          `Generate an engaging image for: ${post.post_content || post.post}`;
        result = await generatePostImage(postId, defaultPrompt);
      }

      // Update the post data with the new image
      if (result?.image_url || result?.data?.image_url) {
        const imageUrl = result.image_url || result.data?.image_url;
        setGeneratedImages((prev) => ({ ...prev, [postIndex]: imageUrl }));
        toast.success(
          isRegenerate
            ? "Image regenerated successfully"
            : "Image generated successfully"
        );

        trackFeatureAction("social_image_generation_success", {
          project_id: projectId,
          post_id: postId,
          post_index: postIndex,
          is_regenerate: isRegenerate,
          image_url: imageUrl,
        });
      } else {
        const backendError =
          result?.error || (isRegenerate ? "Edit failed" : "Generation failed");
        const detailsMsg = result?.details?.text_output
          ? ` — ${result.details.text_output}`
          : "";
        toast.error(`${backendError}. Showing previous image.${detailsMsg}`);

        trackFeatureAction("social_image_generation_failed", {
          project_id: projectId,
          post_id: postId,
          post_index: postIndex,
          is_regenerate: isRegenerate,
          error_message: backendError,
        });
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast.error(
        `Image generation failed. Showing previous image. ${
          error?.message || ""
        }`
      );

      trackFeatureAction("social_image_generation_error", {
        project_id: projectId,
        post_id: postId,
        post_index: postIndex,
        is_regenerate: isRegenerate,
        error_message: error?.message || "Unknown error",
      });
    } finally {
      setImageGenerating((prev) => ({ ...prev, [postIndex]: false }));
      setImageEditPrompt("");
    }
  };

  // Handle image regeneration with custom prompt
  const handleRegenerateImage = async () => {
    if (currentImagePostIndex === null || !imageEditPrompt.trim()) return;

    await handleGenerateImage(currentImagePostIndex, true);
    setShowImageEditModal(false);
    setCurrentImagePostIndex(null);
  };

  // Handle UTM update
  const handleUpdateUtm = async () => {
    if (!postData?.posts?.posts?.length) return;

    try {
      const newUtmUrl = buildUtmUrlWithCorrectBase();
      const documentId = postData.posts.posts[0].document_id;

      const updateData = {
        project_id: projectId,
        document_id: documentId,
        utm_url: newUtmUrl,
      };

      const response = await api.put(
        `/social-media/social-media-utm-update/`,
        updateData
      );

      console.log("response------------", response);

      if (response.data.success) {
        toast.success(response.data.message);

        // Update all posts with the new UTM URL in frontend data
        if (postData?.posts?.posts) {
          const updatedPosts = postData.posts.posts.map((post) => ({
            ...post,
            utm_url: newUtmUrl,
          }));

          // Update the post data state
          setPostData((prev) => ({
            ...prev,
            posts: {
              ...prev.posts,
              posts: updatedPosts,
            },
          }));
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating UTM:", error);
      toast.error(error.response.data.message);
    }
  };

  // Handle generate new UTM
  const handleGenerateNewUtm = () => {
    const newUtmUrl = buildUtmUrl();
    toast.success("New UTM URL generated!");
    // The UTM URL will be shown in the input field
  };

  // Parse UTM URL to extract parameters
  const parseUtmUrl = (utmUrl) => {
    if (!utmUrl) return { source: "", medium: "", campaign: "" };

    try {
      const url = new URL(utmUrl);
      return {
        source: url.searchParams.get("utm_source") || "",
        medium: url.searchParams.get("utm_medium") || "",
        campaign: url.searchParams.get("utm_campaign") || "",
      };
    } catch {
      return { source: "", medium: "", campaign: "" };
    }
  };

  // Get current UTM URL from post data
  const getCurrentUtmUrl = () => {
    const postUtmUrl = postData?.posts?.posts?.[0]?.utm_url;
    if (postUtmUrl) {
      return postUtmUrl;
    }
    return buildUtmUrl();
  };

  // Extract base URL from post UTM URL
  const getBaseUrlFromPost = () => {
    const postUtmUrl = postData?.posts?.posts?.[0]?.utm_url;
    if (postUtmUrl) {
      try {
        const url = new URL(postUtmUrl);
        return `${url.protocol}//${url.host}${url.pathname}`;
      } catch {
        return "https://example.com";
      }
    }
    return "https://example.com";
  };

  // Build UTM URL with correct base URL
  const buildUtmUrlWithCorrectBase = () => {
    const baseUrl = getBaseUrlFromPost();

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
  };

  // Initialize UTM parameters from post data
  useEffect(() => {
    if (postData?.posts?.posts?.[0]?.utm_url) {
      const parsedParams = parseUtmUrl(postData.posts.posts[0].utm_url);
      setUtmParams(parsedParams);
    }
  }, [postData?.posts?.posts?.[0]?.utm_url]);

  // Text truncation utility - more restrictive for better UI
  const truncateText = (text, maxLines = 3) => {
    if (!text) return "";
    const words = text.split(" ");
    const wordsPerLine = 6; // Reduced for better UI
    const maxWords = maxLines * wordsPerLine;

    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  // Check if text needs truncation
  const needsTruncation = (text, maxLines = 3) => {
    if (!text) return false;
    const words = text.split(" ");
    const wordsPerLine = 6;
    const maxWords = maxLines * wordsPerLine;
    return words.length > maxWords;
  };

  // Platform-specific mobile preview dimensions
  const getPlatformPreviewStyle = (platform) => {
    const styles = {
      linkedin: { maxWidth: "420px", aspectRatio: "16:9" },
      x: { maxWidth: "380px", aspectRatio: "16:9" },
      facebook: { maxWidth: "420px", aspectRatio: "16:9" },
      instagram: { maxWidth: "380px", aspectRatio: "1:1" },
      tiktok: { maxWidth: "380px", aspectRatio: "9:16" },
      youtube: { maxWidth: "420px", aspectRatio: "16:9" },
      reddit: { maxWidth: "420px", aspectRatio: "16:9" },
    };
    return styles[platform?.toLowerCase()] || styles.linkedin;
  };

  useEffect(() => {
    document.title = "Social Posts History";
    document
      .querySelector("meta[name='description']")
      ?.setAttribute("content", "View previously generated social media posts");
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] p-2">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
      <div className="mx-auto px-2">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#171717] mb-2">
            Social Posts History
          </h1>
          <p className="text-gray-600">
            View previously generated social media posts for{" "}
            {selectedProject?.name || "your project"}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Task Selection (replacing Content Input) */}
          <div
            className={`${
              isInputCollapsed ? "col-span-1" : "col-span-3"
            } space-y-6`}
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-lg font-semibold text-[#171717] ${
                    isInputCollapsed ? "hidden" : ""
                  }`}
                >
                  Select Previous Task
                </h3>
                <button
                  onClick={() => setIsInputCollapsed(!isInputCollapsed)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title={
                    isInputCollapsed
                      ? "Expand input section"
                      : "Collapse input section"
                  }
                >
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      isInputCollapsed ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              </div>

              {!isInputCollapsed && (
                <div className="space-y-4">
                  {/* Task Selection Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">
                      Sub campaign
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTaskId}
                        onChange={(e) => handleTaskSelect(e.target.value)}
                        className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent"
                        disabled={loading == "first"}
                      >
                        <option value="">
                          Select a previous sub campaign...
                        </option>
                        {historicalTasks.map((task) => (
                          <option key={task._id} value={task._id}>
                            {task.task_name ||
                              task.compaign_name ||
                              "Unnamed sub campaign"}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loading == "first" && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-[#9c07ff]">
                        <svg
                          className="animate-spin w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading...
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && loading == "second" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium">Error</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  )}

                  {/* Task Details */}
                  {selectedTaskData && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-[#171717] mb-3">
                        Task Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Campaign:
                          </span>
                          <span className="ml-2 text-gray-800">
                            {selectedTaskData.campaign_name ||
                              selectedTaskData.compaign_name ||
                              "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Task:
                          </span>
                          <span className="ml-2 text-gray-800">
                            {selectedTaskData.task_name || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Platform:
                          </span>
                          <span className="ml-2 text-gray-800">
                            {selectedTaskData.platform_name || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Intent:
                          </span>
                          <span className="ml-2 text-gray-800">
                            {selectedTaskData.intent || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            KPI:
                          </span>
                          <span className="ml-2 text-gray-800">
                            {selectedTaskData.kpi || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Created:
                          </span>
                          <span className="ml-2 text-gray-800">
                            {formatLocalDate(selectedTaskData.created_at) ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Article Summary Section */}
            {!isInputCollapsed && articleSummary && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#171717]">
                          Article Summary
                        </h4>
                        <p className="text-sm text-gray-600">
                          AI-powered content analysis
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 text-xs text-nowrap font-medium rounded-full ${
                        articleSummary.generation_successful
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {articleSummary.generation_successful ? "✓" : "✗"}
                    </span>
                  </div>

                  {/* Summary Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Summary Preview
                      </span>
                      <span className="text-xs text-gray-500">
                        {articleSummary.summary_length || 0} characters
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                      {articleSummary.summary
                        ? articleSummary.summary.length > 200
                          ? `${articleSummary.summary.substring(0, 200)}...`
                          : articleSummary.summary
                        : "No summary content available"}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      onClick={handleOpenArticleSummaryModal}
                      className="flex-1 px-4 py-2 bg-sky-600 text-nowrap text-white rounded-lg hover:bg-sky-700 transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Full Summary
                    </button>
                    <button
                      onClick={handleCopyArticleSummary}
                      disabled={copyingArticleSummary}
                      className={`px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-2 ${
                        copyingArticleSummary
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-nowrap flex items-center gap-2">
                        {copyingArticleSummary ? (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </>
                        )}{" "}
                        Copy{" "}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Metrics - Sticky */}
            {postData?.posts?.posts?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-6">
                <h4 className="font-medium text-[#171717] mb-4">
                  Quality Metrics - Post {selectedPostIndex + 1}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    {
                      label: "Hook",
                      value:
                        qualityMetrics.hook + ((selectedPostIndex * 2) % 10),
                    },
                    {
                      label: "Clarity",
                      value:
                        qualityMetrics.clarity + ((selectedPostIndex * 3) % 8),
                    },
                    {
                      label: "Credibility",
                      value:
                        qualityMetrics.credibility +
                        ((selectedPostIndex * 1) % 7),
                    },
                    {
                      label: "CTA",
                      value: qualityMetrics.cta + ((selectedPostIndex * 4) % 9),
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className={`p-3 rounded-lg text-center ${
                        metric.value >= 85
                          ? "bg-green-100 text-green-800"
                          : metric.value >= 75
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <div className="text-lg font-bold">
                        {Math.min(metric.value, 95)}
                      </div>
                      <div className="text-xs font-medium">{metric.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    {
                      label: "Platform",
                      value:
                        qualityMetrics.platform + ((selectedPostIndex * 2) % 6),
                    },
                    {
                      label: "Readability",
                      value:
                        qualityMetrics.readability +
                        ((selectedPostIndex * 1) % 5),
                    },
                    {
                      label: "Originality",
                      value:
                        qualityMetrics.originality +
                        ((selectedPostIndex * 3) % 8),
                    },
                    {
                      label: "Engagement",
                      value:
                        qualityMetrics.hook + ((selectedPostIndex * 1) % 6),
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className={`p-3 rounded-lg text-center ${
                        metric.value >= 85
                          ? "bg-green-100 text-green-800"
                          : metric.value >= 75
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <div className="text-lg font-bold">
                        {Math.min(metric.value, 95)}
                      </div>
                      <div className="text-xs font-medium">{metric.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Sentiment",
                      value:
                        qualityMetrics.clarity + ((selectedPostIndex * 2) % 7),
                    },
                    {
                      label: "Relevance",
                      value:
                        qualityMetrics.platform + ((selectedPostIndex * 3) % 5),
                    },
                    {
                      label: "Brand Voice",
                      value:
                        qualityMetrics.credibility +
                        ((selectedPostIndex * 1) % 8),
                    },
                    {
                      label: "AVG",
                      value:
                        Math.round(
                          (qualityMetrics.hook +
                            qualityMetrics.clarity +
                            qualityMetrics.credibility +
                            qualityMetrics.cta +
                            qualityMetrics.platform +
                            qualityMetrics.readability +
                            qualityMetrics.originality) /
                            7
                        ) +
                        ((selectedPostIndex * 2) % 7),
                      isAverage: true,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className={`p-3 rounded-lg text-center ${
                        metric.isAverage
                          ? "bg-[#9c07ff]/10 text-[#9c07ff] font-semibold border-2 border-[#9c07ff]"
                          : metric.value >= 85
                          ? "bg-green-100 text-green-800"
                          : metric.value >= 75
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <div className="text-lg font-bold">
                        {Math.min(metric.value, 95)}
                        {metric.isAverage ? " ✓" : ""}
                      </div>
                      <div className="text-xs font-medium">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div
            className={`${
              isInputCollapsed ? "col-span-8" : "col-span-6"
            } space-y-6`}
          >
            {/* Strategy Brief */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#171717]">
                  Strategy Brief
                </h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {selectedTaskData?.intent || "Select Task"}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {selectedTaskData?.kpi || "Select Task"}
                  </span>
                </div>
              </div>

              {/* Audience & Voice Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="font-medium text-[#171717]">
                    Audience & Voice
                  </h4>
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                    <svg
                      className="w-3 h-3 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs text-blue-600 font-medium">
                      Auto-populated
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Buyer persona",
                    "Target market",
                    "Differentiators",
                    "Brand Voice",
                  ].map((field, index) => {
                    const fieldKey = field.toLowerCase().replace(" ", "");
                    const fieldData =
                      strategyData?.companyInfo?.[
                        fieldKey === "buyerpersona"
                          ? "buyer_persona"
                          : fieldKey === "targetmarket"
                          ? "target_market"
                          : fieldKey === "brandvoice"
                          ? "brand_voice"
                          : "differentiator"
                      ];

                    return (
                      <div key={field} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-[#171717]">
                            {field}
                          </label>
                          <span
                            className={`text-xs ${
                              fieldData ? "text-green-500" : "text-blue-500"
                            }`}
                          >
                            📊 {fieldData ? "Loaded" : "Select Task"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed relative group">
                          {needsTruncation(
                            fieldData ||
                              "Select a task to view audience and voice data..."
                          ) ? (
                            <>
                              <span>
                                {truncateText(
                                  fieldData ||
                                    "Select a task to view audience and voice data..."
                                )}
                              </span>
                              <div className="absolute left-0 top-full mt-1 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10 max-w-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {fieldData ||
                                  "Select a task to view audience and voice data..."}
                              </div>
                            </>
                          ) : (
                            fieldData ||
                            "Select a task to view audience and voice data..."
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Show Posts Button */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() =>
                    selectedTaskId && handleTaskSelect(selectedTaskId)
                  }
                  disabled={
                    loading == "first" || loading == "second" || !selectedTaskId
                  }
                  className={`px-8 py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    loading == "first" || loading == "second" || !selectedTaskId
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-[#9c07ff] hover:bg-[#8a06e6] text-white cursor-pointer"
                  }`}
                >
                  {loading == "second" ? "⚡ Loading..." : "👁️ Show Posts"}
                </button>
              </div>
            </div>

            {/* Comprehensive Content Display */}
            {postData && (
              <div className="space-y-6">
                {/* Posts Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-semibold text-[#171717]">
                      Generated Posts
                    </h2>
                    {(selectedTaskData?.platform_name ||
                      postData?.posts?.posts?.[0]?.platform_name) && (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor:
                            PLATFORMS.find(
                              (p) =>
                                p.id ===
                                (
                                  selectedTaskData?.platform_name ||
                                  postData?.posts?.posts?.[0]?.platform_name
                                )?.toLowerCase()
                            )?.color || "#6b7280",
                          color: "white",
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            PLATFORMS.find(
                              (p) =>
                                p.id ===
                                (
                                  selectedTaskData?.platform_name ||
                                  postData?.posts?.posts?.[0]?.platform_name
                                )?.toLowerCase()
                            )?.icon || "📱",
                        }}
                      />
                    )}
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {postData.posts?.posts?.length || 0} posts
                    </span>
                  </div>

                  {/* Vertical list of posts */}
                  <div className="space-y-3">
                    {postData.posts?.posts?.map((p, idx) => {
                      // Handle new API response structure
                      const imagePrompts = [];
                      if (p.image_prompt) {
                        imagePrompts.push(p.image_prompt);
                      }

                      console.log("p", p);

                      // Create visual object for compatibility
                      const firstVisual = p.image_text
                        ? {
                            on_image_text: p.image_text,
                          }
                        : null;
                      return (
                        <div
                          key={idx}
                          className={`border rounded-lg p-3 transition-all ${
                            selectedPostIndex === idx
                              ? "border-[#9c07ff] bg-gray-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="grid grid-cols-10 gap-3">
                            {/* Row 1: post 70% (col-span-7) & image 30% (col-span-3) */}
                            <div className="col-span-7 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedPosts.includes(idx)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPosts((prev) => [
                                          ...prev,
                                          idx,
                                        ]);
                                      } else {
                                        setSelectedPosts((prev) =>
                                          prev.filter((i) => i !== idx)
                                        );
                                      }
                                    }}
                                    className="w-4 h-4 text-[#9c07ff] rounded focus:ring-[#9c07ff] cursor-pointer"
                                  />
                                  <div className="text-[11px] text-gray-500">
                                    Post {idx + 1}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setPreviewPost(idx);
                                      setSelectedPostIndex(idx);
                                      setQualityMetrics(
                                        generateQualityMetrics()
                                      );
                                    }}
                                    className={`px-2 py-1 rounded text-xs border transition-all cursor-pointer ${
                                      previewPost === idx
                                        ? "bg-gray-800 text-white border-gray-800"
                                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    }`}
                                  >
                                    👁️ Preview
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCopyPost(
                                        p.post_content || p.post,
                                        idx
                                      )
                                    }
                                    className={`px-2 py-1 rounded text-xs border transition-all cursor-pointer ${
                                      copiedPostIndex === idx
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                    }`}
                                  >
                                    {copiedPostIndex === idx
                                      ? "✓ Copied"
                                      : "Copy"}
                                  </button>
                                </div>
                              </div>
                              <div
                                className="text-sm leading-relaxed cursor-pointer"
                                onClick={() => setSelectedPostIndex(idx)}
                              >
                                <span>{p.post_content || p.post}</span>
                              </div>
                            </div>
                            <div className="col-span-3">
                              {generatedImages[idx] || p.image_url ? (
                                <div className="h-full min-h-[80px] rounded overflow-hidden">
                                  <img
                                    src={generatedImages[idx] || p.image_url}
                                    alt={`Generated image for post ${idx + 1}`}
                                    className="w-full h-full object-cover rounded"
                                    onLoad={(e) => {
                                      const src =
                                        e.currentTarget.getAttribute("src");
                                      setLastGoodImages((prev) => ({
                                        ...prev,
                                        [idx]: src,
                                      }));
                                    }}
                                    onError={(e) => {
                                      const currentSrc =
                                        e.currentTarget.getAttribute("src");
                                      const fallbackSrc =
                                        lastGoodImages[idx] ||
                                        p.image_url ||
                                        "";
                                      if (
                                        fallbackSrc &&
                                        currentSrc !== fallbackSrc
                                      ) {
                                        setGeneratedImages((prev) => ({
                                          ...prev,
                                          [idx]: fallbackSrc,
                                        }));
                                        toast.error(
                                          "Failed to load new image. Showing previous image."
                                        );
                                      } else {
                                        console.error(
                                          "Image failed to load:",
                                          currentSrc
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              ) : firstVisual ? (
                                <div className="max-h-[140px] max-w-[240px] h-full bg-gradient-to-br from-[#9c07ff] to-[#6b5a99] rounded flex items-center justify-center text-white text-xs">
                                  {firstVisual.on_image_text}
                                </div>
                              ) : (
                                <div className="h-full min-h-[80px] bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-300">
                                  No image generated
                                </div>
                              )}
                            </div>

                            {/* Row 2: Hook Pattern 50% & Sequence Pattern 50% */}
                            <div className="col-span-5">
                              <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                                <div className="text-[11px] font-medium text-blue-700 mb-1">
                                  Hook
                                </div>
                                {p.hook || "—"}
                              </div>
                            </div>
                            <div className="col-span-5">
                              <div className="bg-green-50 p-2 rounded text-xs text-green-800">
                                <div className="text-[11px] font-medium text-green-700 mb-1">
                                  Pattern
                                </div>
                                {p.pattern || "—"}
                              </div>
                            </div>

                            {/* Row 3: UTM URL 100% */}
                            <div className="col-span-10">
                              <div className="bg-sky-50 p-2 rounded text-xs text-sky-800">
                                <div className="text-[11px] font-medium text-sky-700 mb-1">
                                  UTM URL
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="truncate flex-1">
                                    {p.utm_url || "—"}
                                  </span>
                                  {p.utm_url && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          p.utm_url
                                        );
                                        toast.success(
                                          "UTM URL copied to clipboard!"
                                        );
                                      }}
                                      className="px-1 py-0.5 bg-sky-100 hover:bg-sky-200 rounded text-[10px] transition-colors cursor-pointer"
                                      title="Copy UTM URL"
                                    >
                                      📋
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Row 4: Image prompt 100% */}
                            {imagePrompts.length > 0 && (
                              <div className="col-span-10">
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-[11px] font-medium text-gray-600">
                                      Image Prompt
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleGenerateImage(idx)}
                                        disabled={imageGenerating[idx]}
                                        className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                                          imageGenerating[idx]
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-sky-500 text-white hover:bg-sky-600"
                                        }`}
                                      >
                                        {imageGenerating[idx]
                                          ? "Generating..."
                                          : "Generate"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCurrentImagePostIndex(idx);
                                          setShowImageEditModal(true);
                                        }}
                                        disabled={imageGenerating[idx]}
                                        className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                                          imageGenerating[idx]
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-orange-500 text-white hover:bg-orange-600"
                                        }`}
                                      >
                                        Regenerate
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-700">
                                    {imagePrompts[0] ||
                                      "No image prompt available"}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Section */}
            {postData?.posts?.posts?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#171717]">
                    Export Actions
                  </h2>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Ready to export:{" "}
                  <span className="font-medium">
                    {selectedPosts.length > 0
                      ? `${selectedPosts.length} selected posts`
                      : "No posts selected"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    🏗️ Save Draft
                  </button>
                  <button
                    onClick={() => handleScheduleClick()}
                    disabled={selectedPosts.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    📋 Add to Pipeline
                  </button>
                </div>
                <div className="mt-4">
                  <a
                    href="/social-scheduler"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium cursor-pointer"
                  >
                    📋 View All Scheduled Posts
                  </a>
                </div>
              </div>
            )}

            {/* UTM Builder Section */}
            {postData?.posts?.posts?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#171717]">
                    UTM Builder
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Source
                      </label>
                      <input
                        type="text"
                        value={utmParams.source || ""}
                        placeholder={
                          (
                            selectedTaskData?.platform_name ||
                            postData?.posts?.posts?.[0]?.platform_name
                          )?.toLowerCase() || "linkedin"
                        }
                        onChange={(e) =>
                          setUtmParams((prev) => ({
                            ...prev,
                            source: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Medium
                      </label>
                      <input
                        type="text"
                        value={utmParams.medium || ""}
                        placeholder="social"
                        onChange={(e) =>
                          setUtmParams((prev) => ({
                            ...prev,
                            medium: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Campaign
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={utmParams.campaign || ""}
                          placeholder={
                            (
                              selectedTaskData?.campaign_name ||
                              selectedTaskData?.compaign_name
                            )
                              ?.toLowerCase()
                              .replace(/\s+/g, "_") || "brand_awareness_q4"
                          }
                          onChange={(e) => {
                            //its should only have small case & no spaces
                            const sanitizedValue = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "");
                            setUtmParams((prev) => ({
                              ...prev,
                              campaign: sanitizedValue,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {/* Info icon with tooltip */}
                        <div className="absolute right-3 top-2">
                          <div className="">
                            <button
                              type="button"
                              onMouseEnter={handleInfoMouseEnter}
                              onMouseLeave={handleInfoMouseLeave}
                              className="p-[1px] text-gray-500 rounded-full hover:bg-sky-200 hover:text-black cursor-pointer transition-colors"
                            >
                              <InfoIcon className="w-4 h-4 " />
                            </button>

                            {showInfo && (
                              <div className="absolute right-0 mt-2 w-56 p-3 text-sm bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                <p className="text-gray-700">
                                  Campaign name should be in <b>lowercase</b>{" "}
                                  and have <b>no spaces</b>.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Built UTM URL
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={buildUtmUrlWithCorrectBase()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm bg-gray-50 text-gray-600"
                      />
                      <button
                        onClick={() => {
                          const utmUrl = buildUtmUrlWithCorrectBase();
                          navigator.clipboard.writeText(utmUrl);
                          toast.success("UTM URL copied to clipboard!");
                        }}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-300 transition-colors"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateUtm}
                      className="px-4 py-2 cursor-pointer active:scale-[0.98] bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Update UTM
                    </button>
                    {/* <button
                      onClick={handleGenerateNewUtm}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Generate New UTM
                    </button> */}
                  </div>
                </div>
              </div>
            )}

            {/* Brand Check Section */}
            {postData?.posts?.posts?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#171717]">
                    🏷️ Brand Check
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Logo usage</span>
                      <span className="text-green-600 text-sm">✓ OK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Brand colors</span>
                      <span className="text-green-600 text-sm">✓ OK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tagline</span>
                      <span className="text-yellow-600 text-sm">⚠ Review</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Brand voice</span>
                      <span className="text-green-600 text-sm">✓ OK</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Comparative claims</span>
                      <span className="text-green-600 text-sm">✓ OK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Superlatives</span>
                      <span className="text-green-600 text-sm">✓ OK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Statistics</span>
                      <span className="text-yellow-600 text-sm">⚠ Review</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medical/Financial</span>
                      <span className="text-gray-500 text-sm">N/A</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Section
            {postData?.posts?.posts?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#171717]">
                    Export Actions
                  </h2>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Ready to export:{" "}
                  <span className="font-medium">
                    {selectedPosts.length > 0
                      ? `${selectedPosts.length} selected posts`
                      : "No posts selected"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    🏗️ Save Draft
                  </button>
                  <button
                    onClick={() => handleScheduleClick()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    📅 Schedule
                  </button>
                </div>
                <div className="mt-4">
                  <a
                    href="/social-scheduler"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    📋 View All Scheduled Posts ({getScheduledPostsCount()})
                  </a>
                </div>
              </div>
            )} */}
          </div>

          {/* Right Sidebar - Mobile Preview */}
          <div className="col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-0">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-[#171717]">
                  Mobile Preview{" "}
                  {previewPost !== null && `- Post ${previewPost + 1}`}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Dark mode</span>
                  <input
                    type="checkbox"
                    checked={mobilePreviewSettings.darkMode}
                    onChange={(e) =>
                      setMobilePreviewSettings((prev) => ({
                        ...prev,
                        darkMode: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-[#9c07ff] rounded focus:ring-[#9c07ff] cursor-pointer"
                  />
                </div>
              </div>

              {/* Platform-Specific Mobile Preview */}
              <div className="mb-4">
                <PlatformMobilePreview
                  platform={
                    selectedTaskData?.platform_name ||
                    postData?.posts?.posts?.[0]?.platform_name
                  }
                  postData={{
                    post_content:
                      postData?.posts?.posts?.[
                        previewPost !== null ? previewPost : selectedPostIndex
                      ]?.post_content ||
                      postData?.posts?.posts?.[
                        previewPost !== null ? previewPost : selectedPostIndex
                      ]?.post ||
                      "Select a task to preview posts...",
                    hook:
                      postData?.posts?.posts?.[
                        previewPost !== null ? previewPost : selectedPostIndex
                      ]?.hook || "",
                    image_url: mobilePreviewSettings.showAsset
                      ? generatedImages[
                          previewPost !== null ? previewPost : selectedPostIndex
                        ] ||
                        postData?.posts?.posts?.[
                          previewPost !== null ? previewPost : selectedPostIndex
                        ]?.image_url
                      : "",
                    image_text:
                      postData?.posts?.posts?.[
                        previewPost !== null ? previewPost : selectedPostIndex
                      ]?.image_text || "",
                  }}
                  darkMode={mobilePreviewSettings.darkMode}
                />
              </div>

              {/* Preview Options */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#171717]">
                    Show Visual Asset
                  </span>
                  <input
                    type="checkbox"
                    checked={mobilePreviewSettings.showAsset}
                    onChange={(e) =>
                      setMobilePreviewSettings((prev) => ({
                        ...prev,
                        showAsset: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-[#9c07ff] rounded focus:ring-[#9c07ff] cursor-pointer"
                  />
                </div>
              </div>

              {/* Export Actions */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Selected:</span>
                    <span className="font-medium text-[#171717]">
                      Post {selectedPostIndex + 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts:</span>
                    <span className="font-medium text-[#171717]">
                      {postData?.posts?.posts?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <span className="font-medium text-[#171717]">
                      {postData?.posts?.posts?.filter(
                        (p) => p.image_text || p.image_prompt
                      ).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Popup Modal */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">
              Edit Visual
            </h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Describe your edits..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRecreate}
                className="flex-1 px-4 py-2 bg-[#9c07ff] text-white rounded-lg hover:bg-[#8a06e6] transition-colors cursor-pointer"
              >
                Recreate
              </button>
              <button
                onClick={() => {
                  setShowEditPopup(false);
                  setEditText("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Regeneration Modal */}
      {showImageEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">
              Regenerate Image
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe how you'd like to modify or regenerate the image:
            </p>
            <textarea
              value={imageEditPrompt}
              onChange={(e) => setImageEditPrompt(e.target.value)}
              placeholder="e.g., Make it more colorful, add a business theme, change the background..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRegenerateImage}
                disabled={
                  !imageEditPrompt.trim() ||
                  imageGenerating[currentImagePostIndex]
                }
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  !imageEditPrompt.trim() ||
                  imageGenerating[currentImagePostIndex]
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#9c07ff] text-white hover:bg-[#8a06e6] cursor-pointer"
                }`}
              >
                {imageGenerating[currentImagePostIndex]
                  ? "Regenerating..."
                  : "Regenerate"}
              </button>
              <button
                onClick={() => {
                  setShowImageEditModal(false);
                  setImageEditPrompt("");
                  setCurrentImagePostIndex(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">
              Add Posts to Pipeline
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to add{" "}
                <strong>{scheduleData.postsToSchedule.length}</strong> post
                {scheduleData.postsToSchedule.length !== 1 ? "s" : ""} to the
                scheduling pipeline?
              </p>
              <p className="text-sm text-gray-600">
                <strong>Platform:</strong>{" "}
                {selectedTaskData?.platform_name || "Unknown"}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Posts will be added to the pipeline and can be scheduled from
                  the Social Scheduler page.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isScheduling}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSchedule}
                disabled={isScheduling}
                className="flex-1 px-4 py-2 bg-[#9810fa] text-white rounded-lg hover:bg-[#7c0fd4] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding to Pipeline...
                  </>
                ) : (
                  "Add to Pipeline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">
              Add New Campaign
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a name for your new campaign:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g., Black Friday 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCampaign();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddCampaign}
                disabled={!newCampaignName.trim()}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  !newCampaignName.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#9c07ff] text-white hover:bg-[#8a06e6] cursor-pointer"
                }`}
              >
                Add Campaign
              </button>
              <button
                onClick={() => {
                  setShowAddCampaignModal(false);
                  setNewCampaignName("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Summary Modal */}
      <ArticleSummaryModal
        open={showArticleSummaryModal}
        handleClose={() => setShowArticleSummaryModal(false)}
        articleSummary={articleSummary}
      />
    </div>
  );
}
