// Social Media API Service
// Aligned with backend social_media_handler endpoints
import api from "./axios";

// ============================================
// POST-SET GENERATION
// ============================================

/**
 * Single-step post-set generation (strategy + posts)
 * POST /api/social-media/generate-posts-single-step/
 */
export const generatePostsSingleStep = async ({
  projectId,
  postSetName,
  sourceUrl,
  destinationUrl,
  platforms = [],
  intent = "educate",
  kpi = "engagement",
  allowEmoji = true,
  additionalInstructions = "",
  tags = [],
  postsPerPlatform = 3,
  contentType = "article",
}) => {
  const response = await api.post(
    "/social-media/generate-posts-single-step/",
    {
      project_id: projectId,
      post_set_name: postSetName,
      source_url: sourceUrl,
      destination_url: destinationUrl || undefined,
      platforms,
      intent,
      kpi,
      allow_emoji: allowEmoji ? "Yes" : "No",
      additional_instructions: additionalInstructions || undefined,
      tags,
      posts_per_platform: postsPerPlatform,
      content_type: contentType,
    },
    { timeout: 1000000 }
  );

  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to queue post generation");
  return res.data; // { task_id, project_id, post_set_name, platforms, status, status_check_url, ... }
};

// ============================================
// TASK STATUS (POLLING)
// ============================================

/**
 * Unified task status polling
 * GET /api/social-media/task-status/{task_id}/
 */
export const getTaskStatus = async (taskId) => {
  const response = await api.get(`/social-media/task-status/${taskId}/`);
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to fetch task status");
  return res.data; // { task_id, status, current_step, document_id, progress_percentage, result_data, ... }
};

// ============================================
// POST-SET LISTING & MANAGEMENT
// ============================================

/**
 * List post-sets with nested posts, counts, pagination
 * GET /api/social-media/post-sets/list/
 */
export const getPostSets = async ({
  projectId,
  status,
  tags = [],
  search = "",
  page = 1,
  limit = 20,
}) => {
  const params = new URLSearchParams({ project_id: projectId });
  if (status) params.append("status", status);
  if (tags.length > 0) params.append("tags", tags.join(","));
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await api.get(`/social-media/post-sets/list/?${params.toString()}`);
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to fetch post sets");

  return {
    postSets: res.data || [],
    pagination: res.pagination || { total: 0, page: 1, limit: 20, pages: 1 },
    filters: res.filters || { available_tags: [], status_counts: {} },
  };
};

/**
 * Fetch a single post-set by id
 * GET /api/social-media/post-sets/{post_set_id}/?project_id=...
 */
export const getPostSetById = async (postSetId, projectId) => {
  const params = new URLSearchParams();
  if (projectId) params.append("project_id", projectId);

  const response = await api.get(
    `/social-media/post-sets/${postSetId}/${params.toString() ? `?${params.toString()}` : ""}`
  );
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to fetch post set");
  return res.data;
};

export const getPostSetDataByProject = async (
  projectId,
  { page, pageSize, search, platform, tag } = {}
) => {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (pageSize) params.append("page_size", String(pageSize));
  if (search) params.append("search", String(search));
  if (platform) params.append("platform", String(platform));
  if (tag) params.append("tag", String(tag));

  const query = params.toString();
  const response = await api.get(
    `/social-media/post-set/data/${projectId}/${query ? `?${query}` : ""}`
  );
  const res = response.data;
  if (!res.success) {
    throw new Error(res.error || res.message || "Failed to fetch post set data");
  }
  return res.data;
};

/**
 * Update a post-set (name, tags, status, utm_url)
 * PATCH /api/social-media/post-sets/{post_set_id}/
 */
export const updatePostSet = async (postSetId, projectId, updates = {}) => {
  const response = await api.patch(`/social-media/post-sets/${postSetId}/`, {
    project_id: projectId,
    ...updates,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to update post set");
  return res.data;
};

/**
 * Delete a post-set (soft by default)
 * DELETE /api/social-media/post-sets/{post_set_id}/
 */
export const deletePostSet = async (postSetId, projectId, hardDelete = false) => {
  const url = `/social-media/post-sets/${postSetId}/${hardDelete ? "?hard_delete=true" : ""}`;
  const response = await api.delete(url, { data: { project_id: projectId } });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to delete post set");
  return res.data;
};

// ============================================
// INDIVIDUAL POST MANAGEMENT
// ============================================

/**
 * Update a single post
 * PATCH /api/social-media/posts/{post_id}/
 */
export const updatePost = async (postId, projectId, updates = {}) => {
  const response = await api.patch(`/social-media/posts/${postId}/`, {
    project_id: projectId,
    ...updates,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to update post");
  return res.data;
};

/**
 * Update UTM URL for a document/post-set
 * PUT /api/social-media/social-media-utm-update/
 */
export const updatePostSetUtm = async ({ projectId, documentId, utmUrl }) => {
  const response = await api.put("/social-media/social-media-utm-update/", {
    project_id: projectId,
    document_id: documentId,
    utm_url: utmUrl,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || res.message || "Failed to update UTM URL");
  return res.data;
};

/**
 * Bulk actions on posts (approve, update_status, add_tags, delete)
 * POST /api/social-media/posts/bulk-action/
 */
export const bulkPostAction = async (projectId, action, postIds, params = {}) => {
  const response = await api.post("/social-media/posts/bulk-action/", {
    project_id: projectId,
    action,
    post_ids: postIds,
    params,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Bulk action failed");
  return res;
};

// ============================================
// TAGS
// ============================================

/**
 * Fetch project tags with usage counts
 * GET /api/social-media/tags/
 */
export const getTags = async (projectId, search = "") => {
  const params = new URLSearchParams({ project_id: projectId });
  if (search) params.append("search", search);

  const response = await api.get(`/social-media/tags/?${params.toString()}`);
  const res = response.data;
  if (!res.success) return [];
  return res.data || []; // [{ tag, usage_count, created_at }]
};

// ============================================
// PLATFORM CONNECTIONS
// ============================================

/**
 * Get platform connection status
 * GET /social-media/connections/status/
 */
export const getPlatformConnections = async (projectId) => {
  try {
    const response = await api.get(
      `/social-media/connections/status/?project_id=${projectId}`
    );
    return response.data.platforms || response.data.data || {};
  } catch (error) {
    console.error("Get platform connections error:", error);
    return {};
  }
};

/**
 * Fetch connected social accounts for user/org (social-connect service)
 * GET /social-connect/accounts/?user_id=...&organization_id=...
 */
export const getConnectedSocialAccounts = async ({ userId, organizationId }) => {
  if (!userId || !organizationId) return [];
  const params = new URLSearchParams({ user_id: userId, organization_id: organizationId });
  const response = await api.get(`/social-connect/accounts/?${params.toString()}`);
  return response.data?.accounts || [];
};

// ============================================
// IMAGE GENERATION
// ============================================

/**
 * Generate image for a post
 * POST /api/social-media/social-media-image-generation/
 */
export const generatePostImage = async (postId, prompt) => {
  const response = await api.post("/social-media/social-media-image-generation/", {
    post_id: postId,
    prompt,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to generate image");
  return res;
};

/**
 * Edit the existing main image in-place for a post
 * POST /api/social-media/social-media-image-edit/
 */
export const editPostImage = async (postId, prompt) => {
  const response = await api.post("/social-media/social-media-image-edit/", {
    post_id: postId,
    prompt,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to edit image");
  return res;
};

/**
 * Edit image into a draft (non-destructive)
 * POST /api/social-media/social-media-image-edit-draft/
 */
export const editPostImageDraft = async (postId, prompt) => {
  const response = await api.post("/social-media/social-media-image-edit-draft/", {
    post_id: postId,
    prompt,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to edit image draft");
  return res;
};

/**
 * Promote the current draft image to main image
 * POST /api/social-media/social-media-image-save-draft/
 */
export const savePostImageDraft = async (postId) => {
  const response = await api.post("/social-media/social-media-image-save-draft/", {
    post_id: postId,
  });
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to save draft image");
  return res;
};

// ============================================
// POSTS BY DOCUMENT (enhanced)
// ============================================

/**
 * Fetch posts by document_id
 * GET /api/social-media/social-posts-by-document/
 */
export const getPostsByDocument = async (documentId, projectId) => {
  const params = new URLSearchParams({ document_id: documentId });
  if (projectId) params.append("project_id", projectId);

  const response = await api.get(`/social-media/social-posts-by-document/?${params.toString()}`);
  const res = response.data;
  if (!res.success) throw new Error(res.error || "Failed to fetch posts");
  return res.data || [];
};

// ============================================
// SCHEDULING (unchanged)
// ============================================

export const schedulePosts = async (posts) => {
  const response = await api.post("/social-media/social-media-scheduler/batch/", { posts });
  return response.data;
};
