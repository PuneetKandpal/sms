// Custom hooks for Social Scheduler functionality

import { useState, useEffect, useCallback } from "react";
import { formatLocalDateTime } from "../utils/dateUtils";
import api from "../api/axios";
import toast from "react-hot-toast";

/**
 * Custom hook for managing social media post scheduling
 * Provides functions for scheduling and managing posts
 */
export const useSocialScheduler = (projectId) => {
  const [loading, setLoading] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);

  const loadScheduledPosts = useCallback(async () => {
    if (!projectId) return { data: null, error: "Project ID required" };

    try {
      setLoading(true);
      const response = await api.get(
        `/social-media/social-media-scheduler/?project_id=${projectId}`
      );

      const data = response.data;
      setScheduledPosts(data.scheduled_posts || []);
      return { data: data.scheduled_posts, error: null };
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
      return {
        data: null,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load scheduled posts",
      };
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const schedulePost = useCallback(
    async (postId, documentId) => {
      if (!projectId) return { data: null, error: "Project ID required" };

      try {
        setLoading(true);
        const response = await api.post(
          "/social-media/social-media-scheduler/",
          {
            post_id: postId,
            document_id: documentId,
            project_id: projectId,
          }
        );

        const data = response.data;
        toast.success("Post scheduled successfully!");
        await loadScheduledPosts(); // Refresh posts
        return { data, error: null };
      } catch (error) {
        console.error("Error scheduling post:", error);
        toast.error("Failed to schedule post");
        return {
          data: null,
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to schedule post",
        };
      } finally {
        setLoading(false);
      }
    },
    [projectId, loadScheduledPosts]
  );

  const getPostStats = useCallback(() => {
    const total = scheduledPosts.length;
    const scheduled = scheduledPosts.filter(
      (p) => p.status === "scheduled"
    ).length;
    const published = scheduledPosts.filter(
      (p) => p.status === "published"
    ).length;
    const failed = scheduledPosts.filter((p) => p.status === "failed").length;
    const draft = scheduledPosts.filter((p) => p.status === "draft").length;

    return { total, scheduled, published, failed, draft };
  }, [scheduledPosts]);

  const filterPosts = useCallback(
    (filters) => {
      return scheduledPosts.filter((post) => {
        if (filters.platform && post.platform !== filters.platform)
          return false;
        if (filters.status && post.status !== filters.status) return false;
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const content = post.post_data?.post_content?.toLowerCase() || "";
          if (!content.includes(searchTerm)) return false;
        }
        return true;
      });
    },
    [scheduledPosts]
  );

  const formatDate = useCallback((dateString) => {
    return formatLocalDateTime(dateString);
  }, []);

  return {
    loading,
    scheduledPosts,
    loadScheduledPosts,
    schedulePost,
    getPostStats,
    filterPosts,
    formatDate,
  };
};
