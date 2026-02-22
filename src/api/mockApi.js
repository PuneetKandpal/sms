// Real API functions for Social Post Agent
import api from "./axios";

// Simulate network delay for development
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate random quality metrics in good range
export const generateQualityMetrics = () => {
  return {
    hook: Math.floor(Math.random() * 20) + 75, // 75-95
    clarity: Math.floor(Math.random() * 20) + 80, // 80-100
    credibility: Math.floor(Math.random() * 15) + 70, // 70-85
    cta: Math.floor(Math.random() * 20) + 75, // 75-95
    platform: Math.floor(Math.random() * 15) + 80, // 80-95
    readability: Math.floor(Math.random() * 10) + 85, // 85-95
    originality: Math.floor(Math.random() * 20) + 70, // 70-90
  };
};

// API Response interfaces
const handleApiResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      console.error("Failed to parse error response:", e);
    }

    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorData,
    });

    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status} - ${response.statusText}`
    );
  }
  return response.json();
};

const mockAssetIdeas = {
  linkedin: {
    A: [
      {
        id: 1001,
        format: "Carousel",
        overview: "Multi-slide showcase highlighting key features and benefits",
        textOnImage: "Transform Your Content Strategy",
        prompt:
          "Create a professional LinkedIn carousel with 5 slides showing before/after content transformation examples. Use clean corporate design with brand colors and compelling statistics.",
      },
      {
        id: 1002,
        format: "Infographic",
        overview: "Data-driven visual showing content performance metrics",
        textOnImage: "Stop Shipping Generic Posts",
        prompt:
          "Design an infographic displaying content engagement statistics and ROI improvements. Include charts, icons, and clear data visualization with professional LinkedIn aesthetic.",
      },
    ],
    B: [
      {
        id: 1003,
        format: "Single Image",
        overview: "Clean quote card with team insights and social proof",
        textOnImage: "Your Team Has Insights",
        prompt:
          "Create a minimalist quote card featuring customer testimonial or team insight. Use modern typography, subtle gradients, and professional headshot or company logo.",
      },
    ],
    C: [
      {
        id: 1004,
        format: "Video Thumbnail",
        overview: "Eye-catching thumbnail for demo video content",
        textOnImage: "15-Minute Workflow Demo",
        prompt:
          "Design a compelling video thumbnail showing workflow interface screenshots with play button overlay. Use bright accent colors and clear, readable text for LinkedIn feed visibility.",
      },
    ],
  },
  x: { A: [], B: [], C: [] },
  instagram: { A: [], B: [], C: [] },
  facebook: { A: [], B: [], C: [] },
};

const mockQualityMetrics = {
  hook: 82,
  clarity: 88,
  credibility: 70,
  cta: 76,
  platformFit: 84,
  readability: 91,
  originality: 73,
};

const mockAudienceData = {
  buyerPersona:
    "B2B Marketing Directors at mid-size companies looking to scale content operations",
  targetMarket: "Enterprise SaaS companies with 100-1000 employees",
  differentiators:
    "AI-powered content optimization, real-time performance analytics, seamless workflow integration",
  brandVoice: "Professional yet approachable, data-driven, solution-focused",
};

// API Functions

// Step 1: Generate strategy brief (company info, hooks, patterns)
export const generateStrategyBrief = async (formData) => {
  try {
    const requestPayload = {
      campaign_name: formData.campaignName || formData.campaign_name || "",
      compaign_name: formData.campaignName || formData.campaign_name || "",
      task_name: formData.taskName || "",
      url: formData.sourceUrl,
      destination_url: formData.destinationUrl || formData.sourceUrl,
      intent: formData.intent,
      kpi: formData.kpi,
      allow_emoji: formData.brandSettings?.emoji ? "Yes" : "No",
      platform_name:
        (formData.selectedPlatform || "").charAt(0).toUpperCase() +
        (formData.selectedPlatform || "").slice(1),
      project_id: formData.projectId || "default-project-id",
    };

    console.log("Sending API request to:", api.defaults.baseURL);
    console.log("Request payload:", requestPayload);

    const response = await api.post(
      "/social-media/social-strategy-generation/",
      requestPayload,
      {
        timeout: 1000000,
      }
    );

    const data = response.data;

    console.log("data", data);

    if (!data.success) {
      throw new Error(data.error || "Failed to generate strategy brief");
    }

    const payload = data.data || {};
    const taskId = payload.task_id || payload.taskId;

    return {
      taskId,
      status: payload.status,
      statusCheckUrl: payload.status_check_url,
      queuedAt: payload.queued_at,
      timeTaken: payload.time_taken,
      projectId: payload.project_id,
      url: payload.url,
      campaignName: payload.campaign_name,
      taskName: payload.task_name,
    };
  } catch (error) {
    console.error("Strategy brief generation error:", error);
    throw error; // Re-throw the error so it can be handled by the calling component
  }
};

export const queueSocialPostGeneration = async (projectId, documentId) => {
  try {
    if (!projectId) {
      throw new Error("Missing projectId for post generation");
    }
    if (!documentId) {
      throw new Error("Missing documentId for post generation");
    }

    let response;
    const url = `/social-media/social-media-posts/?project_id=${projectId}&document_id=${documentId}`;

    try {
      response = await api.post(url);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 405 || status === 404) {
        response = await api.get(url);
      } else {
        throw error;
      }
    }

    const data = response.data;

    if (!data?.success) {
      throw new Error(data?.error || "Failed to queue social post generation");
    }

    return data;
  } catch (error) {
    console.error("Queue social post generation error:", error);
    throw error;
  }
};

// Step 2: Generate posts from strategy brief
export const generatePostsApi = async (projectId, documentId) => {
  if (!projectId || !documentId)
    throw new Error("Missing projectId or documentId");

  const response = await api.post("/social-media/social-post-generation/", {
    project_id: projectId,
    document_id: documentId,
  });

  const data = response.data;
  if (!data.success) throw new Error(data.error || "Failed to generate posts");
  return data;
};

export const generatePosts = async (strategyData, formData) => {
  try {
    if (!strategyData?.documentId) {
      throw new Error("Missing documentId for post generation");
    }

    const response = await api.post("/social-media/social-post-generation/", {
      project_id: formData.projectId || "default-project-id",
      document_id: strategyData.documentId,
    });

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to generate posts");
    }

    const payload = data.data;
    const taskId =
      payload?.task_id || payload?.taskId || data.task_id || data.taskId;
    const postsArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.posts)
      ? payload.posts
      : null;

    if (postsArray) {
      return {
        posts: { posts: postsArray },
        count: data.count,
        executionTime: data.time_taken,
      };
    }

    return {
      posts: { posts: [] },
      count: data.count || 0,
      executionTime: data.time_taken,
      taskId,
      status: payload?.status || data.status,
      statusCheckUrl: payload?.status_check_url,
      queuedAt: payload?.queued_at,
    };
  } catch (error) {
    console.error("Post generation error:", error);
    throw error;
  }
};

// Step 3: Get posts by project and document ID
export const getPosts = async (projectId, documentId) => {
  try {
    const response = await api.get(
      `/social-media/social-media-posts/?project_id=${projectId}&document_id=${documentId}`
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch posts");
    }

    return data;
  } catch (error) {
    console.error("Get posts error:", error);
    throw error;
  }
};

// Step 4: Generate image for a post
export const generatePostImage = async (postId, prompt) => {
  try {
    const response = await api.post(
      "/social-media/social-media-image-generation/",
      {
        post_id: postId,
        prompt: prompt,
      }
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to generate image");
    }

    return data;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

// Step 5: Edit/regenerate image for a post
export const editPostImage = async (postId, prompt) => {
  try {
    const response = await api.post("/social-media/social-media-image-edit/", {
      post_id: postId,
      prompt: prompt,
    });

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to edit image");
    }

    return data;
  } catch (error) {
    console.error("Image edit error:", error);
    throw error;
  }
};

export const fetchAssetIdeas = async (platform, variant) => {
  await delay(800);

  if (Math.random() < 0.05) {
    throw new Error("Failed to fetch asset ideas.");
  }

  return mockAssetIdeas[platform]?.[variant] || [];
};

export const generateAssetIdea = async (platform, variant) => {
  await delay(1500);

  if (Math.random() < 0.1) {
    throw new Error("Failed to generate asset idea.");
  }

  const formats = [
    "Carousel",
    "Single Image",
    "Infographic",
    "Video Thumbnail",
    "Quote Card",
  ];
  const randomFormat = formats[Math.floor(Math.random() * formats.length)];

  return {
    id: Date.now(),
    format: randomFormat,
    overview: `${randomFormat} showcasing key benefits and social proof`,
    textOnImage: "Transform Your Content Strategy",
    prompt: `Create a ${randomFormat.toLowerCase()} for ${platform} that highlights the main value proposition with modern, professional design. Include brand colors and compelling visual hierarchy.`,
  };
};

export const fetchQualityMetrics = async (content, platform) => {
  await delay(500);

  if (Math.random() < 0.05) {
    throw new Error("Failed to analyze content quality.");
  }

  // Simulate metrics based on content length and platform
  const baseMetrics = { ...mockQualityMetrics };

  // Adjust metrics based on content characteristics
  if (content.length > 200) {
    baseMetrics.clarity -= 10;
  }
  if (content.includes("🚀") || content.includes("✨")) {
    baseMetrics.hook += 5;
  }
  if (platform === "x" && content.length > 280) {
    baseMetrics.platformFit -= 20;
  }

  return baseMetrics;
};

export const fetchAudienceData = async () => {
  await delay(1200);

  if (Math.random() < 0.05) {
    throw new Error("Failed to fetch company data.");
  }

  return mockAudienceData;
};

export const exportPostData = async (data) => {
  await delay(800);

  if (Math.random() < 0.05) {
    throw new Error("Export failed. Please try again.");
  }

  // Simulate file generation
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const downloadUrl = URL.createObjectURL(blob);

  return { success: true, downloadUrl };
};

// Utility function to simulate the generation process with steps
export const simulateGenerationProcess = async (onProgress) => {
  const steps = [
    "Content fetch",
    "Company data fetch",
    "Planning",
    "Drafting",
    "Scoring",
    "Revision",
    "Policy gate",
    "Export",
  ];

  const completed = [];

  for (const step of steps) {
    onProgress(step, [...completed]);
    await delay(Math.random() * 2000 + 1000);
    completed.push(step);
  }

  onProgress("Generation complete", completed);
};

// Campaign Management Functions
export const getCampaignsByProject = async (projectId) => {
  try {
    const response = await api.get(
      `/social-media/campaigns/list/?project_id=${projectId}`
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch campaigns");
    }

    return {
      campaigns: data.data || [],
      count: data.count || 0,
    };
  } catch (error) {
    console.error("Get campaigns error:", error);
    throw error;
  }
};

export const createCampaign = async (projectId, campaignName) => {
  try {
    const response = await api.post("/social-media/campaigns/create/", {
      project_id: projectId,
      campaign_name: campaignName,
    });

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to create campaign");
    }

    return {
      campaign: data.data,
    };
  } catch (error) {
    console.error("Create campaign error:", error);
    throw error;
  }
};

export const getSocialPostsByDocument = async (documentId) => {
  try {
    const response = await api.get(
      `/social-media/social-posts-by-document/?document_id=${documentId}`
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch social posts");
    }

    return {
      posts: data.data || [],
      count: data.count || 0,
    };
  } catch (error) {
    console.error("Get social posts by document error:", error);
    throw error;
  }
};

// ============================================
// NEW API ENDPOINTS FOR UI UPDATE
// ============================================

// Get list of post sets with filtering
export const getPostSets = async ({
  projectId,
  status = null,
  tags = [],
  search = "",
  page = 1,
  pageSize = 20,
}) => {
  try {
    const params = new URLSearchParams({
      project_id: projectId,
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (status) params.append("status", status);
    if (tags.length > 0) params.append("tags", tags.join(","));
    if (search) params.append("search", search);

    const response = await api.get(
      `/social-media/post-sets/list/?${params.toString()}`
    );

    return {
      results: response.data.results || [],
      count: response.data.count || 0,
      next: response.data.next || null,
      previous: response.data.previous || null,
    };
  } catch (error) {
    console.error("Get post sets error:", error);
    throw error;
  }
};

// Get single post set details
export const getPostSetById = async (postSetId) => {
  try {
    const response = await api.get(`/social-media/post-sets/${postSetId}/`);
    return response.data;
  } catch (error) {
    console.error("Get post set by ID error:", error);
    throw error;
  }
};

// Update post set metadata
export const updatePostSet = async (postSetId, updates) => {
  try {
    const response = await api.patch(
      `/social-media/post-sets/${postSetId}/`,
      updates
    );
    return response.data;
  } catch (error) {
    console.error("Update post set error:", error);
    throw error;
  }
};

// Delete post set
export const deletePostSet = async (postSetId) => {
  try {
    const response = await api.delete(`/social-media/post-sets/${postSetId}/`);
    return response.data;
  } catch (error) {
    console.error("Delete post set error:", error);
    throw error;
  }
};

// Get available tags with autocomplete
export const getTags = async (projectId, search = "") => {
  try {
    const params = new URLSearchParams({
      project_id: projectId,
    });

    if (search) params.append("search", search);

    const response = await api.get(`/social-media/tags/?${params.toString()}`);
    return response.data.tags || [];
  } catch (error) {
    console.error("Get tags error:", error);
    return [];
  }
};

// Get platform connection status
export const getPlatformConnections = async (projectId) => {
  try {
    const response = await api.get(
      `/social-media/connections/status/?project_id=${projectId}`
    );
    return response.data.platforms || {};
  } catch (error) {
    console.error("Get platform connections error:", error);
    return {};
  }
};

// Single-step post generation (strategy + posts combined)
export const generatePostsSingleStep = async (formData) => {
  try {
    const requestPayload = {
      project_id: formData.projectId,
      source_url: formData.sourceUrl,
      post_set_name: formData.postSetName,
      platforms: formData.platforms,
      intent: formData.intent,
      additional_instructions: formData.additionalInstructions || "",
      destination_url: formData.destinationUrl,
      tags: formData.tags || [],
      options: {
        auto_approve_strategy: formData.autoApproveStrategy !== false,
        utm_params: formData.utmParams || null,
        emoji_enabled: formData.emojiEnabled !== false,
        kpi: formData.kpi || null,
        tone: formData.tone || null,
      },
    };

    const response = await api.post(
      "/social-media/generate-posts-single-step/",
      requestPayload,
      {
        timeout: 1000000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Generate posts single step error:", error);
    throw error;
  }
};

// Update individual post
export const updatePost = async (postId, updates) => {
  try {
    const response = await api.patch(`/social-media/posts/${postId}/`, updates);
    return response.data;
  } catch (error) {
    console.error("Update post error:", error);
    throw error;
  }
};

// Bulk post actions
export const bulkPostAction = async (postIds, action, additionalData = {}) => {
  try {
    const response = await api.post("/social-media/posts/bulk-action/", {
      post_ids: postIds,
      action,
      ...additionalData,
    });
    return response.data;
  } catch (error) {
    console.error("Bulk post action error:", error);
    throw error;
  }
};

// Publish posts directly to platforms
export const publishPosts = async (postIds) => {
  try {
    const response = await api.post("/social-media/posts/publish/", {
      post_ids: postIds,
    });
    return response.data;
  } catch (error) {
    console.error("Publish posts error:", error);
    throw error;
  }
};

// Get task status for async operations
export const getTaskStatus = async (taskId) => {
  try {
    const response = await api.get(`/social-media/task-status/${taskId}/`);
    return response.data;
  } catch (error) {
    console.error("Get task status error:", error);
    throw error;
  }
};
