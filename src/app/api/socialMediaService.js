/**
 * Social Media Service
 * Handles all social media related API calls for the scheduler
 */

import api from "../../api/axios";
import { EDIT_POST_API } from "./jbiAPI";

/**
 * Get connected account details
 * @param {string} accountId - The account ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Account details
 */
export const getConnectedAccountDetails = async (accountId, userId) => {
  try {
    const response = await api.get(
      `/social-connect/account/${accountId}/?user_id=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting account details:", error);
    throw error;
  }
};

/**
 * Disconnect a social media account
 * @param {string} accountId - The account ID to disconnect
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Response data
 */
export const disconnectAccount = async (accountId, userId) => {
  try {
    const response = await api.delete(
      `/social-connect/accounts/disconnect/${accountId}/?user_id=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error disconnecting account:", error);
    throw error;
  }
};

/**
 * Publish a post immediately
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} Response data
 */
export const publishPostNow = async (postId, userId, organizationId) => {
  try {
    const response = await api.post("/social-connect/posts/", {
      post_id: postId,
      user_id: userId,
      organization_id: organizationId,
      publish_now: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error publishing post:", error);
    throw error;
  }
};

/**
 * Schedule a post for future publishing
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @param {string} scheduledDatetime - ISO datetime string
 * @param {string} timezone - Timezone (default: UTC)
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} Response data
 */
export const schedulePost = async (
  postId,
  userId,
  scheduledDatetime,
  timezone = "UTC",
  organizationId
) => {
  try {
    const bodyData = {
      post_id: postId,
      user_id: userId,
      scheduled_datetime: scheduledDatetime,
      timezone: timezone,
    };

    if (organizationId) {
      bodyData.organization_id = organizationId;
    }

    console.log("schedulePost API call with body:", bodyData);

    const response = await api.post("/social-connect/posts/", bodyData);

    console.log("schedulePost response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("Error scheduling post:", error);
    throw error;
  }
};

/**
 * Cancel a scheduled post by updating its publishing status
 * @param {string} scheduledPostId - The scheduled post ID (from social-connect/posts)
 * @param {string} reason - Reason for cancellation (optional)
 * @returns {Promise<Object>} Response data
 */
export const cancelScheduledPost = async (scheduledPostId, reason = "") => {
  try {
    console.log("cancelScheduledPost API call for post ID:", scheduledPostId);

    const response = await api.put(
      `/social-connect/posts/${scheduledPostId}/status/`,
      {
        publishing_status: "cancelled",
        reason: reason || "Cancelled by user",
      }
    );

    console.log("cancelScheduledPost response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("Error canceling scheduled post:", error);
    throw error;
  }
};

/**
 * Delete a post (only allowed for posts that are not scheduled or published)
 * @param {string} postId - The post ID
 * @returns {Promise<Object>} Response data
 */
export const deletePost = async (postId) => {
  try {
    console.log("deletePost API call for post ID:", postId);

    const response = await api.delete(`/social-connect/posts/${postId}/`);

    console.log("deletePost response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

/**
 * Retry/Repost a failed or published post (creates a duplicate)
 * @param {string} postId - The post ID to retry
 * @returns {Promise<Object>} Response data with new post details
 */
export const retryPost = async (postId) => {
  try {
    console.log("retryPost API call for post ID:", postId);

    const response = await api.post(
      `/social-connect/posts/${postId}/duplicate/`
    );

    console.log("retryPost response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("Error retrying post:", error);
    throw error;
  }
};

/**
 * Get post status
 * @param {string} postId - The post ID
 * @returns {Promise<Object>} Post status data
 */
export const getPostStatus = async (postId) => {
  try {
    const response = await api.get(`${GET_POST_STATUS_API}${postId}/status/`);

    if (!response.ok) {
      throw new Error(`Failed to get post status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting post status:", error);
    throw error;
  }
};

/**
 * Update post status
 * @param {string} postId - The post ID
 * @param {string} status - New status
 * @param {string} reason - Optional reason for status change
 * @param {string} organizationId - Optional organization ID
 * @returns {Promise<Object>} Response data
 */
export const updatePostStatus = async (
  postId,
  status,
  reason = "",
  organizationId = null
) => {
  try {
    const bodyData = {
      status: status,
      reason: reason,
    };

    if (organizationId) {
      bodyData.organization_id = organizationId;
    }

    console.log("updatePostStatus API call:", {
      postId,
      bodyData,
      url: `/social-connect/posts/${postId}/status/`,
    });

    const response = await api.put(
      `/social-connect/posts/${postId}/status/`,
      bodyData
    );

    console.log("updatePostStatus response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating post status:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    throw error;
  }
};

/**
 * Edit a post
 * @param {string} postId - The post ID
 * @param {Object} postData - Updated post data
 * @returns {Promise<Object>} Response data
 */
export const editPost = async (postId, postData) => {
  try {
    const response = await api.put(`${EDIT_POST_API}${postId}/`, {
      postData,
    });

    if (!response.ok) {
      throw new Error(`Failed to edit post: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error editing post:", error);
    throw error;
  }
};

/**
 * Reschedule a cancelled post
 * @param {string} postId - The post ID
 * @param {string} scheduledDatetime - New scheduled datetime
 * @param {string} timezone - Timezone
 * @returns {Promise<Object>} Response data
 */
export const reschedulePost = async (
  postId,
  scheduledDatetime,
  timezone = "UTC"
) => {
  try {
    const response = await api.put(`${EDIT_POST_API}${postId}/`, {
      scheduled_datetime: scheduledDatetime,
      timezone: timezone,
    });

    if (!response.data.success) {
      throw new Error(`Failed to reschedule post: ${response.data.error}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error rescheduling post:", error);
    throw error;
  }
};

/**
 * Get available actions for a post based on its status
 * @param {string} status - Current post status
 * @returns {Array<string>} Available actions
 */
export const getAvailableActions = (status) => {
  const actions = {
    review: ["approve", "reject", "edit", "delete"],
    approved: ["schedule", "reject", "edit", "delete", "publish_now"],
    scheduled: ["cancel", "edit", "delete", "publish_now"],
    published: [], // No actions available
    rejected: ["approve", "edit", "delete"],
    failed: ["retry", "edit", "delete"],
    cancelled: ["reschedule", "edit", "delete"],
  };
  return actions[status] || [];
};

/**
 * Get status color configuration
 * @param {string} status - Post status
 * @returns {Object} Color configuration
 */
export const getStatusColor = (status) => {
  const colors = {
    review: { color: "#F59E0B", bgColor: "#FFFBEB" },
    approved: { color: "#10B981", bgColor: "#ECFDF5" },
    scheduled: { color: "#3B82F6", bgColor: "#EFF6FF" },
    published: { color: "#10B981", bgColor: "#ECFDF5" },
    rejected: { color: "#EF4444", bgColor: "#FEF2F2" },
    failed: { color: "#EF4444", bgColor: "#FEF2F2" },
    cancelled: { color: "#6B7280", bgColor: "#F3F4F6" },
  };
  return colors[status] || { color: "#6B7280", bgColor: "#F3F4F6" };
};

/**
 * Check if status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} Whether transition is valid
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const validTransitions = {
    review: ["approved", "rejected"],
    approved: ["scheduled", "rejected"],
    rejected: ["approved"],
    scheduled: ["cancelled", "published", "failed"],
    cancelled: ["scheduled"],
    failed: ["approved"],
    published: [], // No transitions from published
  };

  return validTransitions[fromStatus]?.includes(toStatus) || false;
};
