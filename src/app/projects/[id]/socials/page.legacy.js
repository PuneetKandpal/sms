"use client";
// Social Post Agent - Integrated with project structure and consistent theming

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { use } from "react";
import { useSelection } from "../../../context/SelectionContext";
import { useScheduledPosts } from "../../../../contexts/ScheduledPostsContext";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";

import { INTENTS, KPIS, PLATFORMS } from "../../../../constants";
import {
  useFormState,
  usePostGeneration,
  useStrategyBrief,
} from "../../../../hooks/useSocialPostAgent";
import {
  generateQualityMetrics,
  generatePostImage,
  editPostImage,
  getSocialPostsByDocument,
  queueSocialPostGeneration,
  getCampaignsByProject,
  generatePostsApi,
} from "../../../../api/mockApi";
import { MultiStepLoader } from "../../../ui/multi-step-loader";
import CircularLoader from "../../../ui/circular-loader";
import { IconSquareRoundedX } from "@tabler/icons-react";
import ArticleSummaryModal from "../../../components/ArticleSummaryModal";
import PlatformMobilePreview from "../../../components/socials/PlatformMobilePreview";
import PostVariants from "../../../components/socials/PostVariants";
import VisualsPanel from "../../../components/socials/VisualsPanel";
import toast from "react-hot-toast";
import api from "../../../../api/axios";
import {
  InfoIcon,
  AlertCircle,
  Search,
  Loader2,
  ChevronsDown,
  ChevronsUp,
  Layers,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function SocialsPage({ params }) {
  const { id: projectId } = use(params);
  const { selectedProject } = useSelection();
  const router = useRouter();
  const searchParams = useSearchParams();

  useTrackFeatureExploration("socials");

  const { setIsDrawerOpen, instantRefreshAfterTaskStart } = useTaskMonitor();

  // Knowledge base gate state
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);

  // Check if company research data exists
  useEffect(() => {
    if (!projectId) return;

    const checkCompanyResearch = async () => {
      try {
        const response = await api.get(
          `/keyword-api/company-research-data/exists/?project_id=${projectId}`
        );

        if (response.data?.exists) {
          setHasCompanyResearch(true);
        } else {
          setHasCompanyResearch(false);
        }
      } catch (err) {
        console.error("Error checking company research data:", err);
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };

    checkCompanyResearch();
  }, [projectId]);

  // Track feature usage
  useFeatureTracking("Social Media Posts", {
    feature_category: "content_creation",
    page_section: "social_media",
    project_id: projectId,
  });

  // Custom hooks for state management
  const {
    briefState,
    strategyData,
    error: briefError,
    generateBrief,
  } = useStrategyBrief();
  const {
    generationState,
    postData,
    setPostData,
    error: postError,
    generatePostsFromBrief,
  } = usePostGeneration();
  const {
    formData,
    utmParams,
    mobilePreview,
    updateFormData,
    updateBrandSettings,
    setUtmParams,
    setMobilePreview,
    buildUtmUrl,
  } = useFormState();

  // Local state for UI
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
  const [copiedPostIndex, setCopiedPostIndex] = useState(null);
  const [imageGenerating, setImageGenerating] = useState({});
  const [imageEditPrompt, setImageEditPrompt] = useState("");
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [currentImagePostIndex, setCurrentImagePostIndex] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [lastGoodImages, setLastGoodImages] = useState({});
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [previewPost, setPreviewPost] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    postsToSchedule: [],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Existing task selector drawer state
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [existingTasks, setExistingTasks] = useState([]);
  const [existingTasksLoading, setExistingTasksLoading] = useState(false);
  const [existingTasksError, setExistingTasksError] = useState("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [expandedCampaignKeys, setExpandedCampaignKeys] = useState([]);
  const [selectedExistingTaskId, setSelectedExistingTaskId] = useState(null);
  const didAutoExpandLatestCampaignRef = useRef(false);
  const didHandleExistingSubcampaignsDeeplinkRef = useRef(false);
  const didFetchExistingTasksForOpenRef = useRef(false);
  const existingTasksRequestInFlightRef = useRef(false);

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [prefilledCompanyInfo, setPrefilledCompanyInfo] = useState(null);

  const [existingGeneratedPostsLoading, setExistingGeneratedPostsLoading] =
    useState(false);
  const [existingGeneratedPostsError, setExistingGeneratedPostsError] =
    useState("");
  const activeExistingPostsRequestRef = useRef(0);
  const handleGeneratePostsFromBriefRef = useRef(null);

  // Multi-step loader states
  const [showBriefLoader, setShowBriefLoader] = useState(false);

  // Article summary modal state
  const [showArticleSummaryModal, setShowArticleSummaryModal] = useState(false);
  const [articleSummary, setArticleSummary] = useState(null);

  // Campaign autocomplete state
  const [campaignInputValue, setCampaignInputValue] = useState("");
  const [showCampaignSuggestions, setShowCampaignSuggestions] = useState(false);

  // UI state
  const [copyingArticleSummary, setCopyingArticleSummary] = useState(false);

  // Campaign state
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Filtered campaigns for autocomplete
  const filteredCampaigns = useMemo(() => {
    if (!campaignInputValue) return availableCampaigns;
    return availableCampaigns.filter((campaign) =>
      campaign.campaign_name
        .toLowerCase()
        .includes(campaignInputValue.toLowerCase())
    );
  }, [campaignInputValue, availableCampaigns]);

  // Loading states for multi-step loader
  const briefLoadingStates = [
    {
      text: "Analyzing Content Requirements",
      description: "Extracting key insights from your source URL and content",
    },
    {
      text: "Fetching Audience Intelligence",
      description:
        "Retrieving audience personas and voice guidelines from knowledge base",
    },
    {
      text: "Processing Brand Voice",
      description: "AI agent analyzing your brand tone and communication style",
    },
    {
      text: "Strategic Planning",
      description: "Generating content strategy and platform recommendations",
    },
    {
      text: "Creating Hook Suggestions",
      description: "Developing engaging opening lines and content sequences",
    },
    {
      text: "Finalizing Strategy Brief",
      description:
        "Compiling comprehensive strategy document with actionable insights",
    },
  ];

  const postLoadingStates = [
    {
      text: "Processing Strategy Brief",
      description: "Analyzing your strategy brief and content requirements",
    },
    {
      text: "Generating Creative Concepts",
      description: "AI brainstorming unique angles and creative approaches",
    },
    {
      text: "Crafting Platform Content",
      description: "Adapting content for optimal platform-specific engagement",
    },
    {
      text: "Optimizing for Engagement",
      description: "Fine-tuning copy for maximum audience interaction",
    },
    {
      text: "Creating Visual Assets",
      description: "Generating complementary images and visual elements",
    },
    {
      text: "Finalizing Post Variations",
      description: "Preparing multiple post options with quality metrics",
    },
  ];

  // open set info when hover over info icon

  const handleInfoMouseEnter = () => {
    setShowInfo(true);
  };

  const handleInfoMouseLeave = () => {
    setShowInfo(false);
  };

  const handleOpenTaskDrawer = () => {
    setIsTaskDrawerOpen(true);
    setExpandedCampaignKeys([]);
    didAutoExpandLatestCampaignRef.current = false;
    trackFeatureAction("social_existing_tasks_drawer_opened", {
      project_id: projectId,
    });
    fetchExistingTasks({ force: true });
    if (didHandleExistingSubcampaignsDeeplinkRef.current) return;

    const openParam = searchParams?.get("open_existing_subcampaigns") || "";
    const shouldOpen = ["1", "true", "yes"].includes(
      openParam.toString().toLowerCase()
    );
    if (!shouldOpen) return;

    const taskIdParam = searchParams?.get("task_id") || "";
    const documentIdParam = searchParams?.get("document_id") || "";

    if (taskIdParam) {
      setSelectedExistingTaskId(taskIdParam);
    }

    if (documentIdParam) {
      setSelectedDocumentId(documentIdParam);
    }
  };

  useEffect(() => {
    if (didHandleExistingSubcampaignsDeeplinkRef.current) return;

    const openParam = searchParams?.get("open_existing_subcampaigns") || "";
    const shouldOpen = ["1", "true", "yes"].includes(
      openParam.toString().toLowerCase()
    );
    if (!shouldOpen) return;

    didHandleExistingSubcampaignsDeeplinkRef.current = true;

    const taskIdParam = searchParams?.get("task_id") || "";
    const documentIdParam = searchParams?.get("document_id") || "";

    handleOpenTaskDrawer();

    if (taskIdParam) {
      setSelectedExistingTaskId(taskIdParam);
    }

    if (documentIdParam) {
      setSelectedDocumentId(documentIdParam);
    }
  }, [handleOpenTaskDrawer, searchParams]);

  const handleCloseTaskDrawer = () => {
    setIsTaskDrawerOpen(false);
    setTaskSearchQuery("");
    setExpandedCampaignKeys([]);
    didAutoExpandLatestCampaignRef.current = false;
    didFetchExistingTasksForOpenRef.current = false;
    existingTasksRequestInFlightRef.current = false;
    trackFeatureAction("social_existing_tasks_drawer_closed", {
      project_id: projectId,
    });
  };

  const fetchExistingTasks = useCallback(
    async ({ force = false } = {}) => {
      if (!projectId) return;

      if (!force) {
        if (didFetchExistingTasksForOpenRef.current) return;
        didFetchExistingTasksForOpenRef.current = true;
      }

      if (existingTasksRequestInFlightRef.current) return;
      existingTasksRequestInFlightRef.current = true;

      setExistingTasksLoading(true);
      setExistingTasksError("");

      try {
        const response = await api.get(
          `/social-media/social-media-data-by-project/?project_id=${projectId}`
        );

        if (response.data?.success && Array.isArray(response.data?.data)) {
          setExistingTasks(response.data.data);
        } else {
          throw new Error("Unexpected response while fetching tasks");
        }
      } catch (err) {
        console.error("Failed to load existing tasks:", err);
        setExistingTasksError(
          err?.message || "Failed to load tasks. Please try again."
        );
      } finally {
        existingTasksRequestInFlightRef.current = false;
        setExistingTasksLoading(false);
      }
    },
    [projectId]
  );

  const normalizeSelectValue = (value, options, fallback) => {
    if (!value) return fallback;
    const normalized = value?.toString?.().toLowerCase?.().trim?.();
    if (!normalized) return fallback;

    const safeOptions = Array.isArray(options) ? options : [];
    const directMatch = safeOptions.find((option) => {
      const id = option?.id;
      if (id === undefined || id === null) return false;
      return id.toString().toLowerCase() === normalized;
    });
    if (directMatch?.id !== undefined && directMatch?.id !== null)
      return directMatch.id;

    const labelMatch = safeOptions.find((option) => {
      const label = option?.label;
      if (label === undefined || label === null) return false;
      return label.toString().toLowerCase() === normalized;
    });
    return labelMatch?.id ?? fallback;
  };

  const normalizePlatformValue = (value, fallback) => {
    if (!value) return fallback;
    const normalized = value.toString().toLowerCase().trim();
    const sanitizedInput = normalized.replace(/[\s_-]+/g, "");

    const match = PLATFORMS.find((platform) => {
      const label = platform.label.toLowerCase();
      const id = platform.id.toLowerCase();
      return (
        label === normalized ||
        id === normalized ||
        label.replace(/[\s_-]+/g, "") === sanitizedInput ||
        id.replace(/[\s_-]+/g, "") === sanitizedInput
      );
    });

    return match?.id || fallback;
  };

  const getIsSocialPostGenerated = (task) => {
    const value = task?.is_social_post_generated;
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    const normalized = value?.toString?.().toLowerCase?.().trim?.();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  };

  const fetchExistingPostsByDocumentId = useCallback(
    async ({ documentId, taskId } = {}) => {
      if (!documentId) return;

      const requestId = activeExistingPostsRequestRef.current + 1;
      activeExistingPostsRequestRef.current = requestId;
      setExistingGeneratedPostsLoading(true);
      setExistingGeneratedPostsError("");
      setPostData(null);
      setGeneratedImages({});
      setSelectedPosts([]);
      setPreviewPost(null);

      trackFeatureAction("social_existing_posts_fetch_started", {
        project_id: projectId,
        document_id: documentId,
        task_id: taskId,
      });

      try {
        const { posts } = await getSocialPostsByDocument(documentId);
        if (activeExistingPostsRequestRef.current !== requestId) return;

        setPostData({ posts: { posts: posts } });
        setQualityMetrics(generateQualityMetrics());

        const imageUrls = {};
        posts.forEach((post, index) => {
          if (post?.image_url) {
            imageUrls[index] = post.image_url;
          }
        });
        setGeneratedImages(imageUrls);
        setSelectedPosts([]);
        setPreviewPost(null);
        setSelectedPostIndex(0);

        trackFeatureAction("social_existing_posts_fetch_success", {
          project_id: projectId,
          document_id: documentId,
          posts_count: Array.isArray(posts) ? posts.length : 0,
        });
      } catch (err) {
        if (activeExistingPostsRequestRef.current !== requestId) return;

        console.error("Failed to fetch existing social posts:", err);
        setExistingGeneratedPostsError(
          err?.message ||
            "Failed to fetch existing social posts. Please try again."
        );
        setPostData(null);
        setGeneratedImages({});
        setSelectedPosts([]);
        setPreviewPost(null);

        trackFeatureAction("social_existing_posts_fetch_failed", {
          project_id: projectId,
          document_id: documentId,
          error_message:
            err?.message || "Failed to fetch existing social posts",
        });
      } finally {
        if (activeExistingPostsRequestRef.current !== requestId) return;
        setExistingGeneratedPostsLoading(false);
      }
    },
    [projectId, setGeneratedImages, setPostData]
  );

  const filteredExistingTasks = useMemo(() => {
    if (!taskSearchQuery.trim()) return existingTasks;

    const query = taskSearchQuery.trim().toLowerCase();
    return existingTasks.filter((task) => {
      const searchableFields = [
        task.task_name,
        task.campaign_name,
        task.intent,
        task.kpi,
        task.platform_name,
        task.url,
        task.source_url,
        task.destination_url,
      ];

      return searchableFields.some((field) =>
        field?.toString().toLowerCase().includes(query)
      );
    });
  }, [existingTasks, taskSearchQuery]);

  const groupedExistingTasks = useMemo(() => {
    const getTaskTimestamp = (task) => {
      const candidate =
        task?.created_at ||
        task?.updated_at ||
        task?.createdAt ||
        task?.updatedAt ||
        task?.created_on ||
        task?.updated_on;

      const ts = candidate ? new Date(candidate).getTime() : 0;
      return Number.isFinite(ts) ? ts : 0;
    };

    const groups = new Map();

    filteredExistingTasks.forEach((task) => {
      const campaignName =
        (task?.campaign_name && task.campaign_name.toString().trim()) ||
        "No campaign";
      const campaignId =
        (task?.campaign_id && task.campaign_id.toString().trim()) || "";
      const key = campaignId ? `id:${campaignId}` : `name:${campaignName}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          campaignId: campaignId || null,
          campaignName,
          tasks: [],
          latestTs: 0,
        });
      }

      const group = groups.get(key);
      const ts = getTaskTimestamp(task);
      group.latestTs = Math.max(group.latestTs, ts);
      group.tasks.push({ ...task, __ts: ts });
    });

    const campaigns = Array.from(groups.values()).map((group) => {
      const tasks = [...group.tasks]
        .sort((a, b) => (b.__ts || 0) - (a.__ts || 0))
        .map(({ __ts, ...task }) => task);

      return {
        ...group,
        tasks,
      };
    });

    campaigns.sort((a, b) => {
      if (b.latestTs !== a.latestTs) return b.latestTs - a.latestTs;
      return a.campaignName.localeCompare(b.campaignName);
    });

    return {
      campaigns,
      totalCampaigns: new Set(
        existingTasks.map(
          (t) =>
            (t?.campaign_id && `id:${t.campaign_id}`) ||
            (t?.campaign_name && `name:${t.campaign_name}`) ||
            "name:No campaign"
        )
      ).size,
    };
  }, [existingTasks, filteredExistingTasks]);

  const getPlatformMeta = (task) => {
    const raw = task?.platform_name;
    if (!raw) return null;
    const normalizedId = normalizePlatformValue(raw, "");
    return PLATFORMS.find((p) => p.id === normalizedId) || null;
  };

  useEffect(() => {
    if (!isTaskDrawerOpen) return;
    if (existingTasks.length !== 0) return;
    fetchExistingTasks();
  }, [isTaskDrawerOpen, existingTasks.length, fetchExistingTasks]);

  useEffect(() => {
    if (!isTaskDrawerOpen) return;
    if (didAutoExpandLatestCampaignRef.current) return;

    const openParam = searchParams?.get("open_existing_subcampaigns") || "";
    const shouldOpen = ["1", "true", "yes"].includes(
      openParam.toString().toLowerCase()
    );
    if (shouldOpen) return;

    const latestCampaignKey = groupedExistingTasks?.campaigns?.[0]?.key;
    if (!latestCampaignKey) return;

    setExpandedCampaignKeys([latestCampaignKey]);
    didAutoExpandLatestCampaignRef.current = true;
  }, [isTaskDrawerOpen, groupedExistingTasks?.campaigns, searchParams]);

  useEffect(() => {
    if (!isTaskDrawerOpen) return;

    const openParam = searchParams?.get("open_existing_subcampaigns") || "";
    const shouldOpen = ["1", "true", "yes"].includes(
      openParam.toString().toLowerCase()
    );
    if (!shouldOpen) return;

    const taskIdParam = searchParams?.get("task_id") || "";
    const documentIdParam = searchParams?.get("document_id") || "";
    if (!taskIdParam && !documentIdParam) return;

    if (!groupedExistingTasks?.campaigns?.length) return;

    const match = groupedExistingTasks.campaigns.find((campaign) =>
      campaign.tasks.some((task) => {
        const resolvedTaskId = task.task_id || task._id;
        if (taskIdParam && resolvedTaskId === taskIdParam) return true;
        const resolvedDocId = task.document_id || task.documentId || task._id;
        if (documentIdParam && resolvedDocId === documentIdParam) return true;
        return false;
      })
    );

    if (!match?.key) return;

    setExpandedCampaignKeys([match.key]);
    didAutoExpandLatestCampaignRef.current = true;
  }, [groupedExistingTasks?.campaigns, isTaskDrawerOpen, searchParams]);

  const handlePrefillFromTask = useCallback(
    async (task) => {
      if (!task) return;

      setSelectedExistingTaskId(task.task_id || task._id || null);

      const normalizedIntent = normalizeSelectValue(
        task.intent,
        INTENTS,
        formData.intent
      );
      const normalizedKpi = normalizeSelectValue(task.kpi, KPIS, formData.kpi);
      const normalizedPlatform = normalizePlatformValue(
        task.platform_name,
        formData.selectedPlatform
      );

      const sourceUrl =
        task.url || task.source_url || task.company_details?.source_url || "";

      updateFormData({
        campaignId: "",
        campaignName: task.campaign_name || "",
        taskName: task.task_name || "",
        sourceUrl,
        destinationUrl: task.destination_url || "",
        rawText: task.optional_details || "",
        intent: normalizedIntent,
        kpi: normalizedKpi,
        selectedPlatform: normalizedPlatform,
      });

      const resolvedDocumentId =
        task.document_id ||
        task.documentId ||
        task._id ||
        task.task_id ||
        task.taskId ||
        "";

      setSelectedDocumentId(resolvedDocumentId);

      const isSocialPostGenerated = getIsSocialPostGenerated(task);

      if (task.company_information || task.companyInfo || task.company_info) {
        setPrefilledCompanyInfo(
          task.company_information || task.companyInfo || task.company_info
        );
      }

      updateBrandSettings({
        emoji: (task.allow_emoji || "").toLowerCase() === "yes",
      });

      setCampaignInputValue(task.campaign_name || "");

      setExistingGeneratedPostsError("");

      // Cancel any in-flight fetch and reset view before applying selection state.
      activeExistingPostsRequestRef.current += 1;
      setExistingGeneratedPostsLoading(false);
      setExistingGeneratedPostsError("");
      setPostData(null);
      setGeneratedImages({});
      setSelectedPosts([]);
      setPreviewPost(null);

      if (isSocialPostGenerated && resolvedDocumentId) {
        await fetchExistingPostsByDocumentId({
          documentId: resolvedDocumentId,
          taskId: task.task_id || task._id,
        });
      }

      trackFeatureAction("social_prefill_from_existing_task", {
        project_id: projectId,
        task_id: task.task_id || task._id,
        platform: normalizedPlatform,
      });
    },
    [
      formData.intent,
      formData.kpi,
      formData.selectedPlatform,
      instantRefreshAfterTaskStart,
      projectId,
      queueSocialPostGeneration,
      setGeneratedImages,
      setIsDrawerOpen,
      setSelectedExistingTaskId,
      trackFeatureAction,
      updateBrandSettings,
      updateFormData,
      setPostData,
      fetchExistingPostsByDocumentId,
    ]
  );

  const selectedExistingTask = useMemo(() => {
    if (!selectedExistingTaskId) return null;
    return (
      existingTasks.find((t) => {
        const id = t?.task_id || t?._id;
        return id && id === selectedExistingTaskId;
      }) || null
    );
  }, [existingTasks, selectedExistingTaskId]);

  const selectedExistingTaskIsGenerated = useMemo(() => {
    if (!selectedExistingTask) return false;
    return getIsSocialPostGenerated(selectedExistingTask);
  }, [selectedExistingTask]);

  const selectedExistingTaskPlatformMeta = useMemo(() => {
    if (!selectedExistingTask) return null;
    return getPlatformMeta(selectedExistingTask);
  }, [selectedExistingTask]);

  // Clear existing sub-campaign selection and reset to fresh mode
  const handleClearExistingSelection = useCallback(() => {
    setSelectedExistingTaskId(null);
    setSelectedDocumentId("");
    setPostData(null);
    setGeneratedImages({});
    setSelectedPosts([]);
    setPreviewPost(null);
    setExistingGeneratedPostsLoading(false);
    setExistingGeneratedPostsError("");
    setPrefilledCompanyInfo(null);
    setArticleSummary(null);
    setCampaignInputValue("");
    updateFormData({
      campaignId: "",
      campaignName: "",
      taskName: "",
      sourceUrl: "",
      destinationUrl: "",
      rawText: "",
      intent: "promote",
      kpi: "ctr",
      selectedPlatform: "linkedin",
    });
    updateBrandSettings({ emoji: false });

    trackFeatureAction("social_existing_selection_cleared", {
      project_id: projectId,
    });
  }, [
    projectId,
    setPostData,
    setGeneratedImages,
    updateFormData,
    updateBrandSettings,
  ]);

  // Check if user can generate (has campaign name or existing selection)
  const canGenerateStrategyBrief = useMemo(() => {
    // If existing sub-campaign is selected, don't allow generating new brief
    if (selectedExistingTask) return false;
    // Need campaign name and source URL for new generation
    return !!(formData.campaignName?.trim() && formData.sourceUrl?.trim());
  }, [selectedExistingTask, formData.campaignName, formData.sourceUrl]);

  // Check if user can generate posts
  const canGeneratePosts = useMemo(() => {
    // If existing sub-campaign selected, allow based on document ID
    if (selectedExistingTask) {
      return !!(
        selectedExistingTask.document_id ||
        selectedExistingTask.documentId ||
        selectedExistingTask._id ||
        selectedDocumentId
      );
    }
    // For new flow, need strategy data with document ID
    return !!(strategyData?.documentId || selectedDocumentId);
  }, [selectedExistingTask, selectedDocumentId, strategyData?.documentId]);

  const handleGeneratePostsClick = useCallback(async () => {
    if (selectedExistingTask) {
      const resolvedDocId =
        selectedExistingTask.document_id ||
        selectedExistingTask.documentId ||
        selectedExistingTask._id ||
        selectedExistingTask.task_id ||
        selectedExistingTask.taskId ||
        selectedDocumentId ||
        "";

      if (!resolvedDocId) {
        toast.error("Missing document id. Please reselect the sub campaign.");
        return;
      }

      if (selectedExistingTaskIsGenerated) {
        await fetchExistingPostsByDocumentId({
          documentId: resolvedDocId,
          taskId: selectedExistingTask.task_id || selectedExistingTask._id,
        });
        return;
      }

      if (!projectId) {
        toast.error("Missing project id. Please refresh and try again.");
        return;
      }

      const toastId = toast.loading("Queuing social post generation...");
      try {
        const queueResult = await generatePostsApi(projectId, resolvedDocId);
        toast.success(
          "Post generation started! You will be notified once it completes.",
          { id: toastId }
        );
        instantRefreshAfterTaskStart?.();
        setIsDrawerOpen?.(true);
        trackFeatureAction("social_post_generation_queue_success", {
          project_id: projectId,
          requested_document_id: resolvedDocId,
          queued_document_id:
            queueResult?.data?.document_id || queueResult?.data?.documentId,
          queued_task_id:
            queueResult?.data?.task_id || queueResult?.data?.taskId,
        });
      } catch (err) {
        console.error("Failed to queue social post generation:", err);
        toast.error(
          err?.message ||
            "Failed to queue social post generation. Please try again.",
          { id: toastId }
        );
        trackFeatureAction("social_post_generation_queue_failed", {
          project_id: projectId,
          document_id: resolvedDocId,
          error_message:
            err?.message || "Failed to queue social post generation",
        });
      }
      return;
    }

    await handleGeneratePostsFromBriefRef.current?.();
  }, [
    fetchExistingPostsByDocumentId,
    instantRefreshAfterTaskStart,
    projectId,
    queueSocialPostGeneration,
    selectedDocumentId,
    selectedExistingTask,
    selectedExistingTaskIsGenerated,
    setIsDrawerOpen,
  ]);

  // Timezone options
  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
    "UTC",
  ];

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

  // 8-step Strategy Brief progress (UI simulation)
  const BRIEF_STEPS = [
    { key: "content fetch", label: "Content fetch" },
    {
      key: "rag voice",
      label: "AI agent retreiving audience & voice from your knowledge base",
    },
    { key: "plan build", label: "AI agent planning" },
    { key: "seq hooks", label: "Recommending Sequences & Hooks" },
    { key: "validate run", label: "Validation" },
    { key: "fact check", label: "Brief synthesis" },
  ];
  const [uiIsGenerating, setUiIsGenerating] = useState(false);
  const [uiCurrentStep, setUiCurrentStep] = useState(0);
  const [uiCompletedKeys, setUiCompletedKeys] = useState([]);

  // Enriched Strategy Brief steps for loader UI
  const briefTasksToShow = useMemo(() => {
    return briefState?.tasks || [];
  }, [briefState?.tasks]);

  const [qualityMetrics, setQualityMetrics] = useState(
    generateQualityMetrics()
  );

  // Update project ID in form data when project changes
  useEffect(() => {
    if (projectId) {
      updateFormData({ projectId });
    }
  }, [projectId, updateFormData]);

  useEffect(() => {
    setPrefilledCompanyInfo(null);
  }, [projectId]);

  // Fetch campaigns when project changes
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!projectId) return;

      setCampaignsLoading(true);
      try {
        const { campaigns } = await getCampaignsByProject(projectId);
        setAvailableCampaigns(campaigns || []);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchCampaigns();
  }, [projectId]);

  // Initialize campaign input value from formData
  useEffect(() => {
    if (formData.campaignName && !campaignInputValue) {
      setCampaignInputValue(formData.campaignName);
    }
  }, [formData.campaignName]);

  // Handle strategy brief generation
  const handleGenerateStrategyBrief = useCallback(async () => {
    if (!formData.sourceUrl.trim()) {
      alert("Please enter a URL to generate strategy brief");
      return;
    }

    if (!formData.campaignName.trim()) {
      alert("Please select a campaign");
      return;
    }

    try {
      trackFeatureAction("strategy_brief_generation_started", {
        action_type: "ai_generation",
        source_url: formData.sourceUrl,
        campaign_name: formData.campaignName,
      });

      setUiIsGenerating(true);

      console.log("formData------------", formData);

      const result = await generateBrief({
        ...formData,
        projectId,
        campaign_name: formData.campaignName,
      });

      console.log("result------------", result);

      if (result?.companyInfo || result?.company_information) {
        setPrefilledCompanyInfo(
          result.companyInfo || result.company_information
        );
      }

      // Handle article_summary if present in response
      if (result?.articleSummary) {
        setArticleSummary({
          ...result.articleSummary,
          content_extraction: result.contentExtraction,
        });
      }

      setSelectedDocumentId(result?.documentId || "");

      if (result?.taskId || result?.task_id) {
        toast.success(
          "Strategy generation started! You will be notified once it completes."
        );

        if (instantRefreshAfterTaskStart) {
          await instantRefreshAfterTaskStart();
        }

        setIsDrawerOpen?.(true);

        // Clear form inputs after successful submission
        updateFormData({
          sourceUrl: "",
          rawText: "",
          destinationUrl: "",
          taskName: "",
        });
        setCampaignInputValue("");
      }

      // Generate new random metrics for each generation
      setQualityMetrics(generateQualityMetrics());

      trackFeatureAction("strategy_brief_generation_success", {
        action_type: "ai_generation_success",
      });
    } catch (err) {
      console.error("Strategy brief generation failed:", err);

      trackFeatureAction("strategy_brief_generation_failed", {
        action_type: "ai_generation_failed",
        error: err.message,
      });
    } finally {
      setUiIsGenerating(false);
    }
  }, [
    generateBrief,
    formData,
    projectId,
    setIsDrawerOpen,
    instantRefreshAfterTaskStart,
  ]);

  // Handle post generation from brief
  const handleGeneratePostsFromBrief = useCallback(async () => {
    const documentId = strategyData?.documentId || selectedDocumentId;

    if (!documentId) {
      alert(
        "Please generate strategy brief first and wait for it to complete (document_id not available yet)."
      );
      return;
    }

    const effectiveStrategyData = strategyData || { documentId };

    try {
      trackFeatureAction("post_generation_started", {
        action_type: "ai_generation",
        platforms: formData.platforms,
        intents: formData.intents,
      });

      // Show multi-step loader
      const result = await generatePostsFromBrief(effectiveStrategyData, {
        ...formData,
        projectId,
      });

      if (result?.taskId || result?.task_id) {
        toast.success(
          "Post generation started! You will be notified once it completes."
        );
        setIsDrawerOpen(true);
        await instantRefreshAfterTaskStart();
      }

      // Store image URLs from generated posts
      if (result?.posts?.posts) {
        const imageUrls = {};
        result.posts.posts.forEach((post, index) => {
          if (post.image_url) {
            imageUrls[index] = post.image_url;
          }
        });
        setGeneratedImages(imageUrls);
      }

      // Generate new random metrics for post generation
      setQualityMetrics(generateQualityMetrics());

      trackFeatureAction("post_generation_success", {
        action_type: "ai_generation_success",
        posts_generated: result?.posts?.posts?.length || 0,
      });
    } catch (err) {
      console.error("Post generation failed:", err);

      trackFeatureAction("post_generation_failed", {
        action_type: "ai_generation_failed",
        error: err.message,
      });
    }
  }, [
    generatePostsFromBrief,
    strategyData,
    selectedDocumentId,
    formData,
    projectId,
    setIsDrawerOpen,
    instantRefreshAfterTaskStart,
  ]);

  handleGeneratePostsFromBriefRef.current = handleGeneratePostsFromBrief;

  // Handle campaign autocomplete
  const handleCampaignInputChange = (value) => {
    setCampaignInputValue(value);
    // Clear campaign_id when typing manually
    updateFormData({
      campaignId: "",
      campaignName: value,
    });
    // Always show suggestions when input is focused and there are campaigns
    setShowCampaignSuggestions(true);
  };

  const handleCampaignSelect = (campaign) => {
    setCampaignInputValue(campaign.campaign_name);
    updateFormData({
      campaignId: "",
      campaignName: campaign.campaign_name,
    });
    setShowCampaignSuggestions(false);
  };

  // Handle post selection for mobile preview
  const handlePostSelection = (sequenceIndex, postIndex, visualIndex) => {
    setSelectedSequenceIndex(sequenceIndex);
    setSelectedPostIndex(postIndex);
    setSelectedVisualIndex(visualIndex);

    // Generate new quality metrics for the selected post
    setQualityMetrics(generateQualityMetrics());

    // Update mobile preview with selected post data
    if (postData?.posts?.posts?.[postIndex]) {
      const selectedPost = postData.posts.posts[postIndex];
      setMobilePreview({
        ...mobilePreview,
        content: selectedPost.content || selectedPost.text,
        imageUrl: generatedImages[postIndex] || selectedPost.image_url,
      });
    }
  };

  // Handle article summary copy
  const handleCopyArticleSummary = async () => {
    setCopyingArticleSummary(true);
    try {
      await navigator.clipboard.writeText(articleSummary.summary || "");
      // Add visual feedback
      setTimeout(() => setCopyingArticleSummary(false), 1000);
    } catch (error) {
      console.error("Failed to copy article summary:", error);
      setCopyingArticleSummary(false);
    }
  };

  // Handle edit popup
  const handleRecreate = () => {
    console.log("Recreating image with instructions:", editText);
    setShowEditPopup(false);
    setEditText("");
  };

  // Calculate average score
  const avgScore = Math.round(
    Object.values(qualityMetrics).reduce((a, b) => a + b, 0) /
      Object.keys(qualityMetrics).length
  );

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

        console.log("imageUrl", imageUrl);
        // Store the generated image in our local state
        setGeneratedImages((prev) => ({
          ...prev,
          [postIndex]: imageUrl,
        }));
        console.log("Image generated successfully:", imageUrl);
        toast.success(
          isRegenerate
            ? "Image regenerated successfully"
            : "Image generated successfully"
        );
      } else {
        // Treat as failure and keep previous image
        const backendError =
          result?.error || (isRegenerate ? "Edit failed" : "Generation failed");
        const detailsMsg = result?.details?.text_output
          ? ` — ${result.details.text_output}`
          : "";
        toast.error(`${backendError}. Showing previous image.${detailsMsg}`);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast.error(
        `Image generation failed. Showing previous image. ${
          error?.message || ""
        }`
      );
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

      const response = await api.put(`/social-media/social-media-utm-update/`, {
        project_id: projectId,
        document_id: documentId,
        utm_url: newUtmUrl,
      });

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
    return styles[platform] || styles.linkedin;
  };

  // Knowledge base gate - show modal if company research doesn't exist
  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-2">
        <div className="mx-auto px-2">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#171717] mb-2">
              Social Media Posts
            </h1>
            <p className="text-gray-600">
              Generate AI-powered social media content for{" "}
              {selectedProject?.name || "your project"}
            </p>
          </div>

          <div className="flex items-center justify-center pt-28">
            <KnowledgeBaseGateAlert
              projectId={projectId}
              description="Add your school research sources in the knowledge base before generating social media posts."
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking
  if (!companyResearchChecked) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

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
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="mx-auto px-2">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#171717] mb-2">
            Social Media Posts
          </h1>
          <p className="text-gray-600">
            Generate AI-powered social media content for{" "}
            {selectedProject?.name || "your project"}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Input Section */}
          <div
            className={`${
              isInputCollapsed ? "col-span-1" : "col-span-3"
            } space-y-6`}
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3
                  className={`text-lg font-semibold text-[#171717] ${
                    isInputCollapsed ? "hidden" : ""
                  }`}
                >
                  Content Input
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenTaskDrawer}
                    title="Existing sub campaigns"
                    aria-label="Existing sub campaigns"
                    className={`inline-flex items-center gap-2 rounded-lg border border-[#f0d9ff] bg-[#fdf7ff] text-[#9c07ff] hover:bg-[#f7ebff] transition-colors cursor-pointer ${
                      isInputCollapsed ? "p-2" : "px-3 py-2 text-sm font-medium"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    {!isInputCollapsed && <span>Existing sub campaigns</span>}
                  </button>

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
              </div>

              {!isInputCollapsed && (
                <div className="space-y-4">
                  {/* Existing Sub-Campaign Selection Banner */}
                  {selectedExistingTask && (
                    <div className="rounded-2xl border border-sky-200/60 bg-white shadow-sm px-5 py-4 flex flex-col gap-3">
                      {/* Row 1 — Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-500">
                            Existing Sub-Campaign
                          </p>
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {selectedExistingTask.task_name ||
                              "Unnamed sub-campaign"}
                          </p>
                        </div>
                      </div>

                      {/* Row 2 — Status + Action */}
                      <div className="flex items-center justify-between gap-3 flex-wrap pl-13">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            selectedExistingTaskIsGenerated
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              selectedExistingTaskIsGenerated
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {selectedExistingTaskIsGenerated
                            ? "Posts Generated"
                            : "Posts Pending"}
                        </span>

                        <button
                          onClick={handleClearExistingSelection}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Clear selection and start fresh"
                        >
                          <X className="w-3.5 h-3.5" />
                          Start Fresh
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Campaign Name Autocomplete */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">
                      Campaign Name
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={campaignInputValue}
                          onChange={(e) =>
                            handleCampaignInputChange(e.target.value)
                          }
                          onFocus={() => setShowCampaignSuggestions(true)}
                          onBlur={() =>
                            setTimeout(
                              () => setShowCampaignSuggestions(false),
                              200
                            )
                          }
                          placeholder="Type or select a campaign..."
                          disabled={!!selectedExistingTask}
                          className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent ${
                            selectedExistingTask
                              ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                              : "bg-white border-gray-300"
                          }`}
                        />

                        {showCampaignSuggestions && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {campaignsLoading ? (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                Loading campaigns...
                              </div>
                            ) : filteredCampaigns.length > 0 ? (
                              filteredCampaigns.map((campaign) => (
                                <button
                                  key={campaign.campaign_id}
                                  onClick={() => handleCampaignSelect(campaign)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                >
                                  {campaign.campaign_name}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No campaigns found. Type a new campaign name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">
                      Sub campaign
                    </label>
                    <input
                      type="text"
                      placeholder="Enter sub campaign..."
                      value={formData.taskName || ""}
                      onChange={(e) =>
                        updateFormData({ taskName: e.target.value })
                      }
                      disabled={!!selectedExistingTask}
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent ${
                        selectedExistingTask
                          ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  {/* URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">
                      Source URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/article"
                      value={formData.sourceUrl}
                      onChange={(e) =>
                        updateFormData({ sourceUrl: e.target.value })
                      }
                      disabled={!!selectedExistingTask}
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent ${
                        selectedExistingTask
                          ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>

                  {/* Destination URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">
                      Destination URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://landing-page.com"
                      value={formData.destinationUrl || ""}
                      onChange={(e) =>
                        updateFormData({ destinationUrl: e.target.value })
                      }
                      disabled={!!selectedExistingTask}
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent ${
                        selectedExistingTask
                          ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>

                  {/* Optional Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-2">
                      Optional Instructions
                    </label>
                    <textarea
                      placeholder="Additional details to guide the AI agent..."
                      value={formData.rawText}
                      onChange={(e) =>
                        updateFormData({ rawText: e.target.value })
                      }
                      rows={3}
                      disabled={!!selectedExistingTask}
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent resize-none ${
                        selectedExistingTask
                          ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>

                  {/* Intent and KPI */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#171717] mb-1">
                        Intent
                      </label>
                      <div className="relative">
                        <select
                          value={formData.intent}
                          onChange={(e) =>
                            updateFormData({ intent: e.target.value })
                          }
                          disabled={!!selectedExistingTask}
                          className={`w-full appearance-none px-3 py-2 border rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent transition-colors ${
                            selectedExistingTask
                              ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                              : "bg-white border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {INTENTS.map((intent) => (
                            <option key={intent} value={intent}>
                              {intent}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
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
                    <div>
                      <label className="block text-sm font-medium text-[#171717] mb-1">
                        KPI
                      </label>
                      <div className="relative">
                        <select
                          value={formData.kpi}
                          onChange={(e) =>
                            updateFormData({ kpi: e.target.value })
                          }
                          disabled={!!selectedExistingTask}
                          className={`w-full appearance-none px-3 py-2 border rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent transition-colors ${
                            selectedExistingTask
                              ? "bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                              : "bg-white border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {KPIS.map((kpi) => (
                            <option key={kpi} value={kpi}>
                              {kpi}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
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
                  </div>

                  {/* Emoji Toggle */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emoji-toggle"
                        checked={formData.brandSettings.emoji}
                        onChange={(e) =>
                          updateBrandSettings({ emoji: e.target.checked })
                        }
                        className="w-4 h-4 text-[#9c07ff] rounded focus:ring-[#9c07ff] cursor-pointer"
                        disabled={!!selectedExistingTask}
                      />
                      <label
                        htmlFor="emoji-toggle"
                        className="text-sm font-medium text-[#171717]"
                      >
                        Allow emojis in posts
                      </label>
                    </div>
                  </div>

                  {/* Platform Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-3">
                      Target Platform
                    </label>
                    <div className="flex flex-wrap justify-between">
                      {PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => {
                            if (selectedExistingTask) return;
                            updateFormData({ selectedPlatform: platform.id });
                          }}
                          className={`flex items-center p-[2px] justify-center border border-white rounded-xl transition-all duration-200 ${
                            formData.selectedPlatform === platform.id
                              ? "border border-sky-200 bg-[#9c07ff]/10 shadow-md  "
                              : ""
                          } ${
                            selectedExistingTask
                              ? "opacity-60 cursor-not-allowed pointer-events-none"
                              : "cursor-pointer"
                          }`}
                          disabled={!!selectedExistingTask}
                        >
                          {formData.selectedPlatform !== platform.id ? (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white scale-105"
                              style={{ color: platform.color }}
                              dangerouslySetInnerHTML={{
                                __html: platform.icon,
                              }}
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: platform.color }}
                              dangerouslySetInnerHTML={{
                                __html: platform.icon,
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Strategy Brief Button */}
                  <div className="pt-2">
                    {selectedExistingTask ? (
                      /* When viewing existing sub-campaign, show info message instead of button */
                      <div className="w-full px-4 py-3 rounded-lg bg-slate-100 border border-slate-200 text-center">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">
                            Strategy already exists
                          </span>{" "}
                          for this sub-campaign
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click "Start Fresh" above to create a new campaign
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateStrategyBrief}
                        disabled={uiIsGenerating || !canGenerateStrategyBrief}
                        className={`w-full px-6 py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                          uiIsGenerating || !canGenerateStrategyBrief
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : "bg-[#9c07ff] hover:bg-[#8a06e6] text-white cursor-pointer"
                        }`}
                      >
                        {uiIsGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : !canGenerateStrategyBrief ? (
                          "Enter campaign name & URL to generate"
                        ) : (
                          "✨ Generate Strategy Brief"
                        )}
                      </button>
                    )}
                  </div>

                  {/* Progress Section for Strategy Brief (8 steps)
                  {uiIsGenerating && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[#9c07ff]">
                          Processing: {BRIEF_STEPS[uiCurrentStep]?.key || "—"}
                        </div>
                        <div className="space-y-2">
                          {BRIEF_STEPS.map((step) => {
                            const completed = uiCompletedKeys.includes(
                              step.key
                            );
                            return (
                              <div
                                key={step.key}
                                className="flex items-center gap-3 text-sm"
                              >
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    completed
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200 text-gray-400"
                                  }`}
                                >
                                  {completed && (
                                    <svg
                                      className="w-3 h-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8 12.086l6.793-6.793a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={
                                    completed
                                      ? "text-green-700 font-medium"
                                      : "text-gray-600"
                                  }
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Article Summary Preview Section */}
                  {articleSummary && (
                    <div className="pt-6 border-t border-gray-200">
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
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
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
                              ? false
                                ? `${articleSummary.summary.substring(
                                    0,
                                    200
                                  )}...`
                                : articleSummary.summary
                              : "No summary content available"}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-between gap-2">
                          <button
                            onClick={() => setShowArticleSummaryModal(true)}
                            className="flex-1 px-2 py-2 bg-sky-600 text-nowrap text-white rounded-lg hover:bg-sky-700 transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-2"
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
                              )}
                            </span>
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                    {formData.intent}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {formData.kpi}
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
                    "Audience profile",
                    "Target community",
                    "Reasons families choose you",
                    "Brand Voice",
                  ].map((field, index) => {
                    const fieldKey = field.toLowerCase().replace(/ /g, "");
                    const fieldData = (strategyData?.companyInfo ||
                      prefilledCompanyInfo)?.[
                      fieldKey === "audienceprofile"
                        ? "buyer_persona"
                        : fieldKey === "targetcommunity"
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
                            📊 {fieldData ? "Loaded" : "Pending"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed relative group">
                          {needsTruncation(
                            fieldData ||
                              "Will be populated during strategy generation..."
                          ) ? (
                            <>
                              <span>
                                {truncateText(
                                  fieldData ||
                                    "Will be populated during strategy generation..."
                                )}
                              </span>
                              <div className="absolute left-0 top-full mt-1 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10 max-w-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {fieldData ||
                                  "Will be populated during strategy generation..."}
                              </div>
                            </>
                          ) : (
                            fieldData ||
                            "Will be populated during strategy generation..."
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generate Posts Button */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={handleGeneratePostsClick}
                  disabled={generationState.isGenerating || !canGeneratePosts}
                  className={`px-8 py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    generationState.isGenerating || !canGeneratePosts
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-[#9c07ff] hover:bg-[#8a06e6] text-white cursor-pointer"
                  }`}
                >
                  {generationState.isGenerating
                    ? "⚡ Generating..."
                    : !canGeneratePosts
                    ? "Generate strategy brief first"
                    : selectedExistingTask && selectedExistingTaskIsGenerated
                    ? "Reload Posts"
                    : "✨ Generate Posts"}
                </button>

                {/* Removed generate posts loader as requested */}
              </div>
            </div>

            {existingGeneratedPostsLoading && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading generated posts...</span>
                </div>
              </div>
            )}

            {existingGeneratedPostsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {existingGeneratedPostsError}
              </div>
            )}

            {/* Comprehensive Content Display */}
            {postData && (
              <div className="space-y-6">
                {/* Sequences Section removed as requested */}

                {/* Posts Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-semibold text-[#171717]">
                      Generated Posts
                    </h2>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: PLATFORMS.find(
                          (p) => p.id === formData.selectedPlatform
                        )?.color,
                        color: "white",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: PLATFORMS.find(
                          (p) => p.id === formData.selectedPlatform
                        )?.icon,
                      }}
                    />
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

                      // NOTE: Avoid setting state during render; it causes re-renders
                      // Image URLs are already captured after generation or on-demand

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
                                      handlePostSelection(0, idx, 0);
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
                                onClick={() => handlePostSelection(0, idx, 0)}
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

                  {/* Selected Post Display removed */}
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
                        placeholder="linkedin"
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
                          placeholder="brand_awareness_q4"
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
                    📋 View All Scheduled Posts ({getScheduledPostsCount()})
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Mobile Preview */}
          <div className="col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-semibold text-[#171717] text-lg">
                    Mobile Preview
                  </h4>
                  {previewPost !== null && (
                    <p className="text-sm text-gray-500 mt-1">
                      Post {previewPost + 1} of{" "}
                      {postData?.posts?.posts?.length || 0}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Dark mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mobilePreviewSettings.darkMode}
                        onChange={(e) =>
                          setMobilePreviewSettings((prev) => ({
                            ...prev,
                            darkMode: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Platform-Specific Mobile Preview */}
              <div className="mb-4">
                <PlatformMobilePreview
                  platform={formData.selectedPlatform}
                  postData={{
                    post_content:
                      postData?.posts?.posts?.[
                        previewPost !== null ? previewPost : selectedPostIndex
                      ]?.post_content ||
                      postData?.posts?.posts?.[
                        previewPost !== null ? previewPost : selectedPostIndex
                      ]?.post ||
                      "Your generated post content will appear here...",
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
              placeholder="e.g., Make it more colorful, add a school theme, change the background..."
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
      {(briefError || postError) && (
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
          <p className="text-sm mt-1">{briefError || postError}</p>
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
                {PLATFORMS.find((p) => p.id === formData.selectedPlatform)
                  ?.label || formData.selectedPlatform}
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

      {/* Circular loaders */}
      <CircularLoader
        isOpen={showBriefLoader}
        onClose={() => setShowBriefLoader(false)}
        title="Generating Brief"
        url={formData.sourceUrl}
        duration={60 * 1000 * 3}
        steps={briefLoadingStates}
      />

      {/* Article Summary Modal */}
      <ArticleSummaryModal
        open={showArticleSummaryModal}
        handleClose={() => setShowArticleSummaryModal(false)}
        articleSummary={articleSummary}
      />

      {/* Existing Tasks Drawer */}
      {isTaskDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={handleCloseTaskDrawer}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Existing Sub campaigns
                </h2>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                  Select & Prefill
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchExistingTasks({ force: true })}
                  disabled={existingTasksLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {existingTasksLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </button>
                <button
                  onClick={handleCloseTaskDrawer}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search by sub campaign, campaign, intent, KPI..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9c07ff] focus:border-transparent"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500 truncate">
                  Showing {filteredExistingTasks.length} of{" "}
                  {existingTasks.length} sub campaigns •{" "}
                  {groupedExistingTasks.campaigns.length} of{" "}
                  {groupedExistingTasks.totalCampaigns} campaigns
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    title="Expand all campaigns"
                    aria-label="Expand all campaigns"
                    onClick={() =>
                      setExpandedCampaignKeys(
                        groupedExistingTasks.campaigns.map((c) => c.key)
                      )
                    }
                    disabled={
                      groupedExistingTasks.campaigns.length === 0 ||
                      groupedExistingTasks.campaigns
                        .map((c) => c.key)
                        .every((k) => expandedCampaignKeys.includes(k))
                    }
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronsDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Collapse all campaigns"
                    aria-label="Collapse all campaigns"
                    onClick={() => setExpandedCampaignKeys([])}
                    disabled={expandedCampaignKeys.length === 0}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronsUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
              {existingTasksError && (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-600">
                  {existingTasksError}
                </div>
              )}

              {existingTasksLoading && existingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading sub campaigns...</span>
                </div>
              ) : filteredExistingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                  <span className="text-lg">🗂️</span>
                  <p className="text-sm font-medium">
                    No matching sub campaigns found
                  </p>
                  <p className="text-xs">Try a different search term</p>
                </div>
              ) : (
                groupedExistingTasks.campaigns.map((campaign) => {
                  const isExpanded = expandedCampaignKeys.includes(
                    campaign.key
                  );
                  return (
                    <div
                      key={campaign.key}
                      className="rounded-lg border border-slate-100 bg-white overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCampaignKeys((prev) =>
                            prev.includes(campaign.key)
                              ? prev.filter((k) => k !== campaign.key)
                              : [...prev, campaign.key]
                          )
                        }
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {campaign.campaignName}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {campaign.tasks.length} sub campaign
                              {campaign.tasks.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="p-1 rounded-full border border-slate-200 bg-white">
                          <ChevronRight
                            className={`h-4 w-4 text-slate-500 transition-transform ${
                              isExpanded ? "rotate-90 text-slate-700" : ""
                            }`}
                          />
                        </div>
                      </button>

                      <div
                        className={`grid bg-slate-50/60 transition-[grid-template-rows,opacity] duration-300 ease-out ${
                          isExpanded
                            ? "grid-rows-[1fr] opacity-100 border-t border-gray-100"
                            : "grid-rows-[0fr] opacity-0 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={`p-3 space-y-3 transition-transform duration-300 ease-out ${
                              isExpanded ? "translate-y-0" : "-translate-y-1"
                            }`}
                          >
                            {campaign.tasks.map((task) => {
                              const platformMeta = getPlatformMeta(task);
                              const taskId = task.task_id || task._id;
                              const isSocialPostGenerated =
                                getIsSocialPostGenerated(task);
                              const isSelected =
                                selectedExistingTaskId && taskId
                                  ? selectedExistingTaskId === taskId
                                  : false;

                              return (
                                <button
                                  type="button"
                                  key={task._id}
                                  onClick={() => handlePrefillFromTask(task)}
                                  className={`w-full text-left rounded-lg p-3 border bg-white shadow-sm transition-shadow hover:shadow focus:outline-none focus:ring-2 focus:ring-[#9c07ff]/30 ${
                                    isSelected
                                      ? "border-sky-200 ring-2 ring-[#9c07ff]/30"
                                      : "border-slate-100"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex flex-col gap-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                          {task.task_name ||
                                            "Unnamed sub campaign"}
                                        </p>
                                        <span
                                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                                            isSocialPostGenerated
                                              ? "bg-sky-50 text-sky-700 ring-sky-200 cursor-pointer"
                                              : "bg-slate-100 text-slate-600 ring-slate-200"
                                          }`}
                                          onClick={(event) => {
                                            if (!isSocialPostGenerated) return;
                                            event.preventDefault();
                                            event.stopPropagation();
                                            const documentId =
                                              task.document_id ||
                                              task.documentId ||
                                              task._id ||
                                              "";
                                            fetchExistingPostsByDocumentId({
                                              documentId,
                                              taskId: task.task_id || task._id,
                                            });
                                          }}
                                        >
                                          {isSocialPostGenerated
                                            ? "Posts Generated"
                                            : "Posts Not Generated"}
                                        </span>
                                      </div>
                                    </div>

                                    {platformMeta ? (
                                      <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5"
                                        style={{
                                          backgroundColor: platformMeta.color,
                                          color: "white",
                                        }}
                                        title={platformMeta.label}
                                        dangerouslySetInnerHTML={{
                                          __html: platformMeta.icon,
                                        }}
                                      />
                                    ) : task.platform_name ? (
                                      <span className="text-xs text-gray-500 truncate">
                                        {task.platform_name}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                                    {task.intent && (
                                      <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-semibold ring-1 ring-sky-200">
                                        Intent: {task.intent}
                                      </span>
                                    )}
                                    {task.kpi && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-200">
                                        KPI: {task.kpi}
                                      </span>
                                    )}
                                    {task.allow_emoji && (
                                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold ring-1 ring-amber-200">
                                        Emojis: {task.allow_emoji}
                                      </span>
                                    )}
                                  </div>

                                  {(task.url ||
                                    task.source_url ||
                                    task.destination_url) && (
                                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                                      {(task.url || task.source_url) && (
                                        <p className="truncate">
                                          <span className="font-semibold text-gray-600">
                                            Source:
                                          </span>{" "}
                                          {task.url || task.source_url}
                                        </p>
                                      )}
                                      {task.destination_url && (
                                        <p className="truncate">
                                          <span className="font-semibold text-gray-600">
                                            Destination:
                                          </span>{" "}
                                          {task.destination_url}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
