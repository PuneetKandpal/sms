"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaPlus,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaBan,
  FaPlay,
  FaSpinner,
} from "react-icons/fa";
import { useSelection } from "../context/SelectionContext";
import {
  GET_SCHEDULED_POSTS_BY_PROJECT_API,
  UPDATE_SCHEDULED_POST_STATUS_API,
  BULK_UPDATE_SCHEDULED_POST_STATUS_API,
  GET_ACCOUNTS_API,
} from "../api/jbiAPI";
import { updatePostStatus as updatePostStatusService } from "../api/socialMediaService";
import toast from "react-hot-toast";
import SocialSchedulerTable from "../components/SocialSchedulerTable";
import AccountDetailsModal from "../components/AccountDetailsModal";
import SchedulePostModal from "../components/SchedulePostModal";
import { publishPostNow } from "../api/socialMediaService";
import api from "../../api/axios";

// Approval Status configurations
const APPROVAL_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    icon: FaExclamationTriangle,
  },
  approved: {
    label: "Approved",
    color: "#10B981",
    bgColor: "#ECFDF5",
    icon: FaCheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    icon: FaTimesCircle,
  },
};

// Publishing Status configurations
const PUBLISHING_STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: FaClock,
  },
  scheduled: {
    label: "Scheduled",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    icon: FaClock,
  },
  published: {
    label: "Published",
    color: "#10B981",
    bgColor: "#ECFDF5",
    icon: FaCheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: FaBan,
  },
  failed: {
    label: "Failed",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    icon: FaTimesCircle,
  },
};

export default function EnhancedSocialSchedulerPage() {
  const { selectedProject, selectedCompany } = useSelection();
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [bulkLoading, setBulkLoading] = useState({
    approve: false,
    reject: false,
  });
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [postsToSchedule, setPostsToSchedule] = useState([]);

  // Get userId from stored user data
  const getUserId = () => {
    if (typeof window === "undefined") return null;
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.user_id || null;
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
    return null;
  };

  const userId = getUserId();

  console.log("EnhancedSocialSchedulerPage - userId:", userId);
  console.log(
    "EnhancedSocialSchedulerPage - selectedProject:",
    selectedProject
  );

  console.log(
    "EnhancedSocialSchedulerPage - selectedCompany:",
    selectedCompany
  );

  const loadScheduledPosts = useCallback(async () => {
    if (!selectedProject?.id) return;

    try {
      setLoading(true);
      const response = await api.get(
        `/social-media/social-media-scheduler/?project_id=${selectedProject.id}&limit=50000`
      );
      const data = response.data;

      console.log("data------------", data);

      if (data) {
        // Transform the API response structure
        const transformedPosts = (data.scheduled_posts || []).map((post) => ({
          ...post,
          // Extract platform from post_data
          platform: post.post_data?.platform_name?.toLowerCase(),
          // Add timezone (default to UTC if not present)
          timezone: post.timezone || "UTC",
        }));

        console.log("Loaded scheduled posts:", transformedPosts);
        setScheduledPosts(transformedPosts);
      } else {
        throw new Error("Failed to load scheduled posts");
      }
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
      toast.error("Failed to load scheduled posts");
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  // Background refresh without showing loader
  const backgroundRefresh = useCallback(async () => {
    if (!selectedProject?.id) return;

    try {
      const response = await api.get(
        `/social-media/social-media-scheduler/?project_id=${selectedProject.id}&limit=50000`
      );

      if (response.data) {
        const data = response.data;
        // Transform the API response structure
        const transformedPosts = (data.scheduled_posts || []).map((post) => ({
          ...post,
          // Extract platform from post_data
          platform: post.post_data?.platform_name?.toLowerCase(),
          // Add timezone (default to UTC if not present)
          timezone: post.timezone || "UTC",
        }));

        console.log(
          "Background refresh completed:",
          transformedPosts.length,
          "posts"
        );
        setScheduledPosts(transformedPosts);
      } else {
        console.error("Background refresh failed");
      }
    } catch (error) {
      console.error("Error during background refresh:", error);
    }
  }, [selectedProject?.id]);

  const loadConnectedAccounts = useCallback(async () => {
    if (!selectedCompany?.id) return;
    try {
      setLoadingAccounts(true);
      const response = await api.get(
        `/social-connect/accounts/?user_id=${userId}&organization_id=${selectedCompany?.id}`
      );
      const accountsData = response.data;
      setConnectedAccounts(accountsData.accounts || []);
    } catch (error) {
      console.error("Error loading connected accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  }, [userId, selectedCompany?.id]);

  useEffect(() => {
    console.log("selectedProject--------->", selectedProject);
    if (selectedProject?.id && selectedCompany?.id) {
      loadScheduledPosts();
      loadConnectedAccounts();
    }
  }, [selectedProject?.id, selectedCompany?.id]);

  const updatePostStatus = useCallback(
    async (postId, newStatus, reason = "", organizationId = null) => {
      try {
        // Use the service function for better error handling and consistency
        await updatePostStatusService(
          postId,
          newStatus,
          reason,
          organizationId
        );

        // Background refresh to get updated data
        await backgroundRefresh();
        return true;
      } catch (error) {
        console.error("Error updating post status:", error);
        throw error;
      }
    },
    [backgroundRefresh]
  );

  const bulkUpdateStatus = useCallback(
    async (postIds, newStatus, reason = "") => {
      try {
        const results = [];
        const errors = [];

        // Update posts one by one
        for (const postId of postIds) {
          try {
            await updatePostStatus(postId, newStatus, reason);
            results.push(postId);
          } catch (error) {
            errors.push({ postId, error: error.message });
          }
        }

        if (errors.length > 0) {
          console.warn("Some posts failed to update:", errors);
          if (errors.length === postIds.length) {
            throw new Error("All posts failed to update");
          }
        }

        return { success: results, errors };
      } catch (error) {
        console.error("Error bulk updating post status:", error);
        throw error;
      }
    },
    [updatePostStatus]
  );

  // Helper function to handle post-action selection and refresh
  const handleActionResults = useCallback(
    async (results, errors, allPostIds) => {
      // Background refresh to get updated data
      await backgroundRefresh();

      // Deselect successful posts, keep only failed posts selected
      if (errors.length === 0) {
        // All actions succeeded - deselect all rows
        setSelectedPosts([]);
      } else {
        // Some actions failed - deselect successful posts, keep only failed posts selected
        const failedPostIds = errors.map((error) => error.postId);
        const failedPosts = selectedPosts.filter(
          (post) =>
            failedPostIds.includes(post._id) ||
            failedPostIds.includes(post.post_id)
        );
        setSelectedPosts(failedPosts);
      }
    },
    [backgroundRefresh, selectedPosts]
  );

  const handleBulkApprove = useCallback(
    async (postIds) => {
      setBulkLoading({ approve: true, reject: false }); // Disable both buttons
      try {
        // Determine which selected posts are eligible for approval
        const selected = scheduledPosts.filter((p) =>
          postIds.includes(p.post_id)
        );
        const normalize = (s) => (s || "").toLowerCase();

        const approvableIds = selected
          .filter((p) => {
            const st = normalize(p.status) || "review";
            // Allow approving review/pending and rejected to move to approved
            return st === "review" || st === "pending" || st === "rejected";
          })
          .map((p) => p.post_id);

        const alreadyApprovedCount = selected.filter(
          (p) => normalize(p.status) === "approved"
        ).length;

        if (alreadyApprovedCount > 0) {
          toast(`${alreadyApprovedCount} posts already approved`);
        }

        if (approvableIds.length === 0) {
          // Nothing to approve
          toast("No eligible posts to approve");
          return;
        }

        const result = await bulkUpdateStatus(
          approvableIds,
          "approved",
          "Bulk approved"
        );

        console.log("result------------", result);

        // Handle results and update selection
        await handleActionResults(result.success, result.errors, approvableIds);

        const selectedMap = new Map(selected.map((p) => [p.post_id, p]));

        if (result.errors.length > 0) {
          const errorLines = result.errors.slice(0, 5).map((e) => {
            const post = selectedMap.get(e.postId);
            const platform = post?.post_data?.platform_name || "Post";
            const content = post?.post_data?.post_content || "";
            const snippet = content ? `${content}`.slice(0, 40) : `${e.postId}`;
            return `- ${platform}: ${snippet} — ${e.error}`;
          });
          const more =
            result.errors.length > 5
              ? `\n...and ${result.errors.length - 5} more failures`
              : "";
          toast.error(
            `${result.success.length} posts approved, ${
              result.errors.length
            } failed\n${errorLines.join("\n")}${more}`
          );
        } else {
          // Optionally show a brief list of successes (limit to 5)
          const successLines = result.success.slice(0, 5).map((id) => {
            const post = selectedMap.get(id);
            const platform = post?.post_data?.platform_name || "Post";
            const content = post?.post_data?.post_content || "";
            const snippet = content ? `${content}`.slice(0, 40) : `${id}`;
            return `- ${platform}: ${snippet}`;
          });
          const moreSuccess =
            result.success.length > 5
              ? `\n...and ${result.success.length - 5} more`
              : "";
          toast.success(
            `${
              result.success.length
            } posts approved successfully\n${successLines.join(
              "\n"
            )}${moreSuccess}`
          );
          setSelectedPosts([]);
        }
      } catch (error) {
        toast.error("Failed to approve posts");
        // On complete failure, refresh but keep selection
        await backgroundRefresh();
      } finally {
        setBulkLoading({ approve: false, reject: false }); // Re-enable both buttons
      }
    },
    [bulkUpdateStatus, handleActionResults, backgroundRefresh, scheduledPosts]
  );

  const handleBulkReject = useCallback(
    async (postIds) => {
      setBulkLoading({ approve: false, reject: true }); // Disable both buttons
      try {
        // Determine which selected posts are eligible for rejection
        const selected = scheduledPosts.filter((p) =>
          postIds.includes(p.post_id)
        );
        const normalize = (s) => (s || "").toLowerCase();

        const scheduledOrPublishedCount = selected.filter((p) => {
          const pub = normalize(p.publishing_status) || "draft";
          return pub === "scheduled" || pub === "published";
        }).length;

        if (scheduledOrPublishedCount > 0) {
          toast(
            `${scheduledOrPublishedCount} posts already scheduled/published cannot be rejected`
          );
        }

        const rejectableIds = selected
          .filter((p) => {
            const st = normalize(p.status) || "review";
            const pub = normalize(p.publishing_status) || "draft";
            const isScheduledOrPublished =
              pub === "scheduled" || pub === "published";
            if (isScheduledOrPublished) return false;
            // Allow rejecting review, and approved that are not yet scheduled
            return st === "review" || st === "pending" || st === "approved";
          })
          .map((p) => p.post_id);

        if (rejectableIds.length === 0) {
          toast("No eligible posts to reject");
          return;
        }

        const result = await bulkUpdateStatus(
          rejectableIds,
          "rejected",
          "Bulk rejected"
        );

        // Handle results and update selection
        await handleActionResults(result.success, result.errors, rejectableIds);

        const selectedMap = new Map(selected.map((p) => [p.post_id, p]));

        if (result.errors.length > 0) {
          const errorLines = result.errors.slice(0, 5).map((e) => {
            const post = selectedMap.get(e.postId);
            const platform = post?.post_data?.platform_name || "Post";
            const content = post?.post_data?.post_content || "";
            const snippet = content ? `${content}`.slice(0, 40) : `${e.postId}`;
            return `- ${platform}: ${snippet} — ${e.error}`;
          });
          const more =
            result.errors.length > 5
              ? `\n...and ${result.errors.length - 5} more failures`
              : "";
          toast.error(
            `${result.success.length} posts rejected, ${
              result.errors.length
            } failed\n${errorLines.join("\n")}${more}`
          );
        } else {
          // Optionally show a brief list of successes (limit to 5)
          const successLines = result.success.slice(0, 5).map((id) => {
            const post = selectedMap.get(id);
            const platform = post?.post_data?.platform_name || "Post";
            const content = post?.post_data?.post_content || "";
            const snippet = content ? `${content}`.slice(0, 40) : `${id}`;
            return `- ${platform}: ${snippet}`;
          });
          const moreSuccess =
            result.success.length > 5
              ? `\n...and ${result.success.length - 5} more`
              : "";
          toast.success(
            `${
              result.success.length
            } posts rejected successfully\n${successLines.join(
              "\n"
            )}${moreSuccess}`
          );
          setSelectedPosts([]);
        }
      } catch (error) {
        toast.error("Failed to reject posts");
        // On complete failure, refresh but keep selection
        await backgroundRefresh();
      } finally {
        setBulkLoading({ approve: false, reject: false }); // Re-enable both buttons
      }
    },
    [bulkUpdateStatus, handleActionResults, backgroundRefresh, scheduledPosts]
  );

  const handleBulkCancel = useCallback(
    async (postIds) => {
      try {
        const result = await bulkUpdateStatus(
          postIds,
          "cancelled",
          "Bulk cancelled"
        );

        // Handle results and update selection
        await handleActionResults(result.success, result.errors, postIds);

        if (result.errors.length > 0) {
          toast.error(
            `${result.success.length} posts cancelled, ${result.errors.length} failed`
          );
        } else {
          toast.success(
            `${result.success.length} posts cancelled successfully`
          );
        }
      } catch (error) {
        toast.error("Failed to cancel posts");
        // On complete failure, refresh but keep selection
        await backgroundRefresh();
      }
    },
    [bulkUpdateStatus, handleActionResults, backgroundRefresh]
  );

  const handleBulkPublish = useCallback(
    async (scheduledPostIds) => {
      console.log("handleBulkPublish called with:", scheduledPostIds);
      console.log(
        "Available scheduled posts:",
        scheduledPosts.map((p) => ({
          _id: p._id,
          status: p.status,
          hasPostData: !!p.post_data,
        }))
      );

      try {
        const results = [];
        const errors = [];

        // Publish posts one by one
        for (const scheduledPostId of scheduledPostIds) {
          try {
            console.log("Processing scheduled post ID:", scheduledPostId);

            // Find the scheduled post to get the actual post_data._id
            const scheduledPost = scheduledPosts.find(
              (p) => p.post_id === scheduledPostId
            );

            // console.log("scheduledPost ------------", scheduledPost);

            // console.log("selectedCompany ------------", selectedCompany);

            console.log("Found scheduled post: ", {
              found: !!scheduledPost,
              hasPostData: !!scheduledPost?.post_data,
              postDataId: scheduledPost?.post_data?._id,
            });

            const actualPostId = scheduledPost?.post_data?._id;

            if (!actualPostId) {
              throw new Error("Post ID not found in post data");
            }

            const organizationId = selectedCompany?.id;
            console.log("Calling publishPostNow with:", {
              actualPostId,
              userId,
              organizationId,
            });
            const response = await publishPostNow(
              actualPostId,
              userId,
              organizationId
            );
            console.log("publishPostNow response:", response);

            if (response.success) {
              // Update status using scheduled post _id
              await updatePostStatus(scheduledPostId, "published");
              results.push(scheduledPostId);
            } else {
              throw new Error(response.message || "Failed to publish");
            }
          } catch (error) {
            console.error("Error publishing post:", {
              scheduledPostId,
              error: error.message,
            });
            errors.push({ postId: scheduledPostId, error: error.message });
          }
        }

        // Handle results and update selection
        await handleActionResults(results, errors, scheduledPostIds);

        if (errors.length > 0) {
          if (results.length > 0) {
            toast.error(
              `${results.length} posts published, ${errors.length} failed`
            );
          } else {
            toast.error(`All ${errors.length} posts failed to publish`);
          }
          console.error("Bulk publish errors:", errors);
        } else {
          toast.success(`${results.length} posts published successfully`);
        }
      } catch (error) {
        toast.error("Failed to publish posts");
        // On complete failure, refresh but keep selection
        await backgroundRefresh();
      }
    },
    [
      userId,
      updatePostStatus,
      scheduledPosts,
      handleActionResults,
      backgroundRefresh,
    ]
  );

  const handleBulkRetry = useCallback(
    async (postIds) => {
      try {
        const result = await bulkUpdateStatus(
          postIds,
          "approved",
          "Bulk retry - reset to approved"
        );

        // Handle results and update selection
        await handleActionResults(result.success, result.errors, postIds);

        if (result.errors.length > 0) {
          toast.error(
            `${result.success.length} posts reset for retry, ${result.errors.length} failed`
          );
        } else {
          toast.success(
            `${result.success.length} posts reset for retry successfully`
          );
        }
      } catch (error) {
        toast.error("Failed to retry posts");
        // On complete failure, refresh but keep selection
        await backgroundRefresh();
      }
    },
    [bulkUpdateStatus, handleActionResults, backgroundRefresh]
  );

  const handleBulkSchedule = useCallback(
    async (postIds) => {
      console.log("handleBulkSchedule called with:", postIds);

      // Find all posts that need to be scheduled
      const postsToScheduleList = scheduledPosts.filter((post) =>
        postIds.includes(post.post_id)
      );

      console.log("Posts to schedule:", postsToScheduleList);
      console.log("First post structure:", postsToScheduleList[0]);

      if (postsToScheduleList.length === 0) {
        toast.error("No valid posts found for scheduling");
        return;
      }

      // Store posts for the modal and show it
      setPostsToSchedule(postsToScheduleList);
      setShowBulkScheduleModal(true);
    },
    [scheduledPosts]
  );

  const handleBulkScheduleSuccess = useCallback(
    async (postId, status, scheduledDateTime, timezone, organizationId) => {
      try {
        console.log("Bulk schedule success callback:", {
          postId,
          status,
          scheduledDateTime,
          timezone,
          organizationId,
        });
        await updatePostStatus(postId, status, organizationId);

        // Check if all posts have been processed
        const remainingPosts = postsToSchedule.filter(
          (post) => post._id !== postId
        );
        setPostsToSchedule(remainingPosts);

        if (remainingPosts.length === 0) {
          setShowBulkScheduleModal(false);
          setSelectedPosts([]); // Deselect all posts on successful completion
          toast.success("All posts scheduled successfully!");
        }
      } catch (error) {
        console.error("Error updating post after bulk scheduling:", error);
      }
    },
    [updatePostStatus, postsToSchedule]
  );

  const handleSelectionChange = useCallback((selected) => {
    setSelectedPosts([...selected]);
  }, []);

  // Calculate stats - combine both approval and publishing status
  const stats = useMemo(() => {
    const total = scheduledPosts.length;

    // Approval Status counts
    const pending = scheduledPosts.filter(
      (p) => (p.status || "pending").toLowerCase() === "pending"
    ).length;
    const approved = scheduledPosts.filter(
      (p) => (p.status || "pending").toLowerCase() === "approved"
    ).length;
    const rejected = scheduledPosts.filter(
      (p) => (p.status || "pending").toLowerCase() === "rejected"
    ).length;

    // Publishing Status counts
    const draft = scheduledPosts.filter(
      (p) => (p.publishing_status || "draft").toLowerCase() === "draft"
    ).length;
    const scheduled = scheduledPosts.filter(
      (p) => (p.publishing_status || "draft").toLowerCase() === "scheduled"
    ).length;
    const published = scheduledPosts.filter(
      (p) => (p.publishing_status || "draft").toLowerCase() === "published"
    ).length;
    const cancelled = scheduledPosts.filter(
      (p) => (p.publishing_status || "draft").toLowerCase() === "cancelled"
    ).length;
    const failed = scheduledPosts.filter(
      (p) => (p.publishing_status || "draft").toLowerCase() === "failed"
    ).length;

    return {
      total,
      pending,
      approved,
      rejected,
      draft,
      scheduled,
      published,
      cancelled,
      failed,
    };
  }, [scheduledPosts]);

  const handleAccountDisconnected = useCallback((accountId) => {
    setConnectedAccounts((prev) =>
      prev.filter((account) => account._id !== accountId)
    );
    toast.success("Account disconnected successfully");
  }, []);

  const handleConnectPlatform = useCallback(() => {
    if (selectedCompany?.id) {
      window.location.href = `/connections?organization_id=${selectedCompany.id}`;
    } else {
      window.location.href = "/connections";
    }
  }, [selectedCompany?.id]);

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* add loader here */}
        <div className="flex justify-center items-center h-screen">
          <FaSpinner className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 mt-2" style={{ backgroundColor: "#FAFAFA", minHeight: "calc(100vh - 100px)" }}>
      <div className="max-w-full mx-auto space-y-4 py-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Social Media Scheduler
              </h1>
              <p className="text-lg text-gray-600">
                Manage and schedule your social media posts
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadScheduledPosts}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <FaSync size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
        {/* Stats Cards - Combined Approval and Publishing Status */}
        <div className="space-y-4 mb-8">
          {/* Approval Status Stats */}
          {/* <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Approval Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(APPROVAL_STATUS_CONFIG).map(
                ([status, config]) => {
                  const IconComponent = config.icon;
                  const count = stats[status] || 0;

                  return (
                    <div
                      key={status}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: config.bgColor }}
                        >
                          <IconComponent
                            className="text-current"
                            style={{ color: config.color }}
                            size={20}
                          />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {count}
                          </div>
                          <p className="text-sm text-gray-600">
                            {config.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div> */}

          {/* Publishing Status Stats */}
          <div>
            {/* <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Publishing Status
            </h3> */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(PUBLISHING_STATUS_CONFIG).map(
                ([status, config]) => {
                  const IconComponent = config.icon;
                  const count = stats[status] || 0;

                  return (
                    <div
                      key={status}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: config.bgColor }}
                        >
                          <IconComponent
                            className="text-current"
                            style={{ color: config.color }}
                            size={20}
                          />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {count}
                          </div>
                          <p className="text-sm text-gray-600">
                            {config.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="w-full">
          {/* Enhanced Table */}
          <div className="min-w-0 w-full overflow-x-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <SocialSchedulerTable
                scheduledPosts={scheduledPosts}
                setScheduledPosts={setScheduledPosts}
                selectedProject={selectedProject}
                loading={loading}
                onSelectionChange={handleSelectionChange}
                onStatusUpdate={updatePostStatus}
                refreshData={backgroundRefresh}
                selectionKey={selectedProject?.id}
                connectedAccounts={connectedAccounts}
                onBulkApprove={handleBulkApprove}
                onBulkReject={handleBulkReject}
                selectedPosts={selectedPosts}
                bulkLoading={bulkLoading}
              />
            </div>
          </div>
        </div>
        {/* Status Flow Information
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status Flow Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Approval Process</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                <span>Pending → Approved/Rejected</span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Publishing Flow</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                <span>Draft → Scheduled → Published</span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Cancellation & Retry
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                <span>Scheduled → Cancelled, Failed → Retry</span>
              </div>
            </div>
          </div>
        </div> */}
        {/* Account Details Modal */}
        <AccountDetailsModal
          open={showAccountDetails}
          handleClose={() => setShowAccountDetails(false)}
          accountId={selectedAccountId}
          userId={userId}
          onDisconnect={handleAccountDisconnected}
        />
        {/* Bulk Schedule Modal */}
        <SchedulePostModal
          open={
            showBulkScheduleModal &&
            postsToSchedule.length > 0 &&
            selectedCompany?.id
          }
          handleClose={() => {
            setShowBulkScheduleModal(false);
            setPostsToSchedule([]);
          }}
          post={postsToSchedule[0]} // Schedule one post at a time
          userId={userId}
          onRefresh={backgroundRefresh}
          onSuccess={handleBulkScheduleSuccess}
          isReschedule={false}
        />
      </div>
    </div>
  );
}
