"use client";
import React, { useState } from "react";
import { FiSidebar } from "react-icons/fi";
import {
  FaCheck,
  FaTimes,
  FaBan,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
  FaPlay,
  FaRedo,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import { Info } from "lucide-react";
import toast from "react-hot-toast";

const SocialSchedulerBulkPanel = ({
  isCollapsed,
  setIsCollapsed,
  selectedPosts,
  onBulkApprove,
  onBulkReject,
  onBulkCancel,
  onBulkPublish,
  onBulkRetry,
  onBulkSchedule,
  loading = false,
  connectedAccounts = [],
  onConnectPlatform,
}) => {
  const [expandedSection, setExpandedSection] = useState("actions");
  const [loadingStates, setLoadingStates] = useState({
    approve: false,
    reject: false,
    cancel: false,
    publish: false,
    retry: false,
    schedule: false,
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Check if platform is connected
  const isPlatformConnected = (platformName) => {
    if (!platformName || !connectedAccounts.length) return false;

    return connectedAccounts.some(
      (account) =>
        account.platform?.toLowerCase() === platformName.toLowerCase()
    );
  };

  // Check if approved posts can be scheduled/published (platform connected)
  const canScheduleOrPublishApprovedPosts = () => {
    const approvedPosts = selectedPosts.filter(
      (post) => post.status === "approved"
    );
    return approvedPosts.every((post) =>
      isPlatformConnected(post.post_data?.platform_name)
    );
  };

  // Get unconnected platforms from selected approved posts
  const getUnconnectedPlatforms = () => {
    const approvedPosts = selectedPosts.filter(
      (post) => post.status === "approved"
    );
    const platforms = approvedPosts
      .map((post) => post.post_data?.platform_name)
      .filter(Boolean);
    const unconnectedPlatforms = [
      ...new Set(
        platforms.filter((platform) => !isPlatformConnected(platform))
      ),
    ];
    return unconnectedPlatforms;
  };

  const handleBulkApprove = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select posts to approve");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, approve: true }));
    try {
      console.log("selectedPosts", selectedPosts);
      // Use _id for scheduled post operations, not post_id
      const postIds = selectedPosts.map((post) => post.post_id);
      await onBulkApprove(postIds);
    } finally {
      setLoadingStates((prev) => ({ ...prev, approve: false }));
    }
  };

  const handleBulkReject = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select posts to reject");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, reject: true }));
    try {
      // Use _id for scheduled post operations, not post_id
      const postIds = selectedPosts.map((post) => post.post_id);
      await onBulkReject(postIds);
    } finally {
      setLoadingStates((prev) => ({ ...prev, reject: false }));
    }
  };

  const handleBulkCancel = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select posts to cancel");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, cancel: true }));
    try {
      // Use _id for scheduled post operations, not post_id
      const postIds = selectedPosts.map((post) => post.post_id);
      await onBulkCancel(postIds);
    } finally {
      setLoadingStates((prev) => ({ ...prev, cancel: false }));
    }
  };

  const handleBulkPublish = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select posts to publish");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, publish: true }));
    try {
      // Use _id for scheduled post operations, not post_id
      const postIds = selectedPosts.map((post) => post.post_id);
      await onBulkPublish?.(postIds);
    } finally {
      setLoadingStates((prev) => ({ ...prev, publish: false }));
    }
  };

  const handleBulkRetry = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select posts to retry");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, retry: true }));
    try {
      // Use _id for scheduled post operations, not post_id
      const postIds = selectedPosts.map((post) => post.post_id);
      await onBulkRetry?.(postIds);
    } finally {
      setLoadingStates((prev) => ({ ...prev, retry: false }));
    }
  };

  const handleBulkSchedule = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select posts to schedule");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, schedule: true }));
    try {
      // Use post_id for scheduled post operations
      const postIds = selectedPosts.map((post) => post.post_id);
      await onBulkSchedule?.(postIds);
    } finally {
      setLoadingStates((prev) => ({ ...prev, schedule: false }));
    }
  };

  // Count posts by status
  const statusCounts = selectedPosts.reduce((acc, post) => {
    const status = post.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const canApprove = selectedPosts.some((post) => post.status === "review");
  const canReject = selectedPosts.some((post) => post.status === "review");
  const canCancel = selectedPosts.some(
    (post) =>
      post.status === "approved" &&
      (post.publishing_status || "draft").toLowerCase() === "scheduled"
  );
  const canPublish = selectedPosts.some(
    (post) =>
      post.status === "approved" &&
      ["draft", "not scheduled", "scheduled"].includes(
        (post.publishing_status || "draft").toLowerCase()
      )
  );
  const canRetry = selectedPosts.some((post) =>
    ["failed", "cancelled"].includes(
      (post.publishing_status || "draft").toLowerCase()
    )
  );
  const canSchedule = selectedPosts.some(
    (post) =>
      post.status === "approved" &&
      ["draft", "not scheduled"].includes(
        (post.publishing_status || "draft").toLowerCase()
      )
  );

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg h-[calc(100vh-200px)] overflow-y-auto transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Header */}
      <div className="flex bg-gray-100 py-4 px-4 items-center justify-between ">
        {!isCollapsed && (
          <h2 className="text-gray-900 font-semibold text-lg">Bulk Actions</h2>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <FiSidebar className="w-4 h-4 text-sky-600" />
        </button>
      </div>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <FaUsers className="w-4 h-4 text-sky-600" />
          </div>
          {selectedPosts.length > 0 && (
            <div className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {selectedPosts.length}
            </div>
          )}
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Selection Summary */}
          <div className="mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className="text-sky-600" size={16} />
                <span className="font-medium text-gray-900">
                  {selectedPosts.length} Selected
                </span>
              </div>

              {selectedPosts.length > 0 && (
                <div className="space-y-1 text-sm text-gray-600">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("actions")}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Actions</span>
              {expandedSection === "actions" ? (
                <FaChevronUp className="text-gray-500" size={14} />
              ) : (
                <FaChevronDown className="text-gray-500" size={14} />
              )}
            </button>

            {expandedSection === "actions" && (
              <div className="mt-2 flex flex-col gap-2">
                {/* Bulk Approve */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={
                    loadingStates.approve ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FaCheck size={14} />
                    )
                  }
                  onClick={handleBulkApprove}
                  disabled={
                    !canApprove ||
                    loadingStates.approve ||
                    selectedPosts.length === 0
                  }
                  sx={{
                    backgroundColor: loadingStates.approve
                      ? "#9CA3AF"
                      : "#10B981",
                    "&:hover": {
                      backgroundColor: loadingStates.approve
                        ? "#9CA3AF"
                        : "#059669",
                    },
                    "&:disabled": { backgroundColor: "#D1D5DB" },
                    textTransform: "none",
                    fontSize: "14px",
                    py: 0.5,
                    transition: "all 0.2s ease-in-out",
                    boxShadow: loadingStates.approve
                      ? "none"
                      : "0 2px 4px rgba(16, 185, 129, 0.2)",
                  }}
                >
                  {loadingStates.approve
                    ? "Processing..."
                    : `Approve (${
                        selectedPosts.filter((p) => p.status === "review")
                          .length
                      })`}
                </Button>

                {/* Bulk Reject */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={
                    loadingStates.reject ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FaTimes size={14} />
                    )
                  }
                  onClick={handleBulkReject}
                  disabled={
                    !canReject ||
                    loadingStates.reject ||
                    selectedPosts.length === 0
                  }
                  sx={{
                    backgroundColor: loadingStates.reject
                      ? "#9CA3AF"
                      : "#EF4444",
                    "&:hover": {
                      backgroundColor: loadingStates.reject
                        ? "#9CA3AF"
                        : "#DC2626",
                    },
                    "&:disabled": { backgroundColor: "#D1D5DB" },
                    textTransform: "none",
                    fontSize: "14px",
                    py: 0.5,
                    transition: "all 0.2s ease-in-out",
                    boxShadow: loadingStates.reject
                      ? "none"
                      : "0 2px 4px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  {loadingStates.reject
                    ? "Processing..."
                    : `Reject (${
                        selectedPosts.filter((p) => p.status === "review")
                          .length
                      })`}
                </Button>

                {/* Bulk Cancel */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={
                    loadingStates.cancel ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FaBan size={14} />
                    )
                  }
                  onClick={handleBulkCancel}
                  disabled={
                    !canCancel ||
                    loadingStates.cancel ||
                    selectedPosts.length === 0
                  }
                  sx={{
                    backgroundColor: loadingStates.cancel
                      ? "#9CA3AF"
                      : "#F59E0B",
                    "&:hover": {
                      backgroundColor: loadingStates.cancel
                        ? "#9CA3AF"
                        : "#D97706",
                    },
                    "&:disabled": { backgroundColor: "#D1D5DB" },
                    textTransform: "none",
                    fontSize: "14px",
                    py: 0.5,
                    transition: "all 0.2s ease-in-out",
                    boxShadow: loadingStates.cancel
                      ? "none"
                      : "0 2px 4px rgba(245, 158, 11, 0.2)",
                  }}
                >
                  {loadingStates.cancel
                    ? "Processing..."
                    : `Cancel (${
                        selectedPosts.filter(
                          (p) =>
                            p.status === "approved" &&
                            (p.publishing_status || "draft").toLowerCase() ===
                              "scheduled"
                        ).length
                      })`}
                </Button>

                {/* Bulk Schedule */}
                {onBulkSchedule && (
                  <>
                    {canSchedule && canScheduleOrPublishApprovedPosts() && (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={
                          loadingStates.schedule ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <FaCalendarAlt size={14} />
                          )
                        }
                        onClick={handleBulkSchedule}
                        disabled={
                          !canSchedule ||
                          loadingStates.schedule ||
                          selectedPosts.length === 0
                        }
                        sx={{
                          backgroundColor: loadingStates.schedule
                            ? "#9CA3AF"
                            : "#3B82F6",
                          "&:hover": {
                            backgroundColor: loadingStates.schedule
                              ? "#9CA3AF"
                              : "#2563EB",
                          },
                          "&:disabled": { backgroundColor: "#D1D5DB" },
                          textTransform: "none",
                          fontSize: "14px",
                          py: 0.5,
                          transition: "all 0.2s ease-in-out",
                          boxShadow: loadingStates.schedule
                            ? "none"
                            : "0 2px 4px rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        {loadingStates.schedule
                          ? "Scheduling..."
                          : `Schedule (${
                              selectedPosts.filter(
                                (p) =>
                                  p.status === "approved" &&
                                  ["draft", "not scheduled"].includes(
                                    (
                                      p.publishing_status || "draft"
                                    ).toLowerCase()
                                  )
                              ).length
                            })`}
                      </Button>
                    )}

                    {canSchedule && !canScheduleOrPublishApprovedPosts() && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<FaCalendarAlt size={14} />}
                          sx={{
                            backgroundColor: "#6B7280",
                            opacity: 0.7,
                            "&:hover": {
                              backgroundColor: "#6B7280",
                              opacity: 0.8,
                            },
                            "&:disabled": { backgroundColor: "#D1D5DB" },
                            textTransform: "none",
                            fontSize: "14px",
                            py: 0.5,
                            flex: 1,
                          }}
                          disabled
                        >
                          Schedule (
                          {
                            selectedPosts.filter(
                              (p) =>
                                p.status === "approved" &&
                                ["draft", "not scheduled"].includes(
                                  (p.publishing_status || "draft").toLowerCase()
                                )
                            ).length
                          }
                          )
                        </Button>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Connect platforms first:{" "}
                                {getUnconnectedPlatforms().join(", ")}
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={onConnectPlatform}
                                sx={{
                                  backgroundColor: "#3B82F6",
                                  "&:hover": { backgroundColor: "#2563EB" },
                                  textTransform: "none",
                                  fontSize: "12px",
                                  py: 0.5,
                                  px: 1,
                                }}
                              >
                                Connect Platforms
                              </Button>
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0.5 }}>
                            <Info size={14} className="text-orange-500" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </>
                )}

                {/* Bulk Publish */}
                {onBulkPublish && (
                  <>
                    {canPublish && canScheduleOrPublishApprovedPosts() && (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={
                          loadingStates.publish ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <FaPlay size={14} />
                          )
                        }
                        onClick={handleBulkPublish}
                        disabled={
                          !canPublish ||
                          loadingStates.publish ||
                          selectedPosts.length === 0
                        }
                        sx={{
                          backgroundColor: loadingStates.publish
                            ? "#9CA3AF"
                            : "#10B981",
                          "&:hover": {
                            backgroundColor: loadingStates.publish
                              ? "#9CA3AF"
                              : "#059669",
                          },
                          "&:disabled": { backgroundColor: "#D1D5DB" },
                          textTransform: "none",
                          fontSize: "14px",
                          py: 0.5,
                          transition: "all 0.2s ease-in-out",
                          boxShadow: loadingStates.publish
                            ? "none"
                            : "0 2px 4px rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        {loadingStates.publish
                          ? "Publishing..."
                          : `Publish Now (${
                              selectedPosts.filter(
                                (p) =>
                                  p.status === "approved" &&
                                  [
                                    "draft",
                                    "not scheduled",
                                    "scheduled",
                                  ].includes(
                                    (
                                      p.publishing_status || "draft"
                                    ).toLowerCase()
                                  )
                              ).length
                            })`}
                      </Button>
                    )}

                    {canPublish && !canScheduleOrPublishApprovedPosts() && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<FaPlay size={14} />}
                          sx={{
                            backgroundColor: "#6B7280",
                            opacity: 0.7,
                            "&:hover": {
                              backgroundColor: "#6B7280",
                              opacity: 0.8,
                            },
                            "&:disabled": { backgroundColor: "#D1D5DB" },
                            textTransform: "none",
                            fontSize: "14px",
                            py: 0.5,
                            flex: 1,
                          }}
                          disabled
                        >
                          Publish Now (
                          {
                            selectedPosts.filter(
                              (p) =>
                                p.status === "approved" &&
                                [
                                  "draft",
                                  "not scheduled",
                                  "scheduled",
                                ].includes(
                                  (p.publishing_status || "draft").toLowerCase()
                                )
                            ).length
                          }
                          )
                        </Button>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Connect platforms first:{" "}
                                {getUnconnectedPlatforms().join(", ")}
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={onConnectPlatform}
                                sx={{
                                  backgroundColor: "#3B82F6",
                                  "&:hover": { backgroundColor: "#2563EB" },
                                  textTransform: "none",
                                  fontSize: "12px",
                                  py: 0.5,
                                  px: 1,
                                }}
                              >
                                Connect Platforms
                              </Button>
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0.5 }}>
                            <Info size={14} className="text-orange-500" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </>
                )}

                {/* Bulk Retry */}
                {onBulkRetry && (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={
                      loadingStates.retry ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <FaRedo size={14} />
                      )
                    }
                    onClick={handleBulkRetry}
                    disabled={
                      !canRetry ||
                      loadingStates.retry ||
                      selectedPosts.length === 0
                    }
                    sx={{
                      backgroundColor: loadingStates.retry
                        ? "#9CA3AF"
                        : "#F59E0B",
                      "&:hover": {
                        backgroundColor: loadingStates.retry
                          ? "#9CA3AF"
                          : "#D97706",
                      },
                      "&:disabled": { backgroundColor: "#D1D5DB" },
                      textTransform: "none",
                      fontSize: "14px",
                      py: 0.5,
                      transition: "all 0.2s ease-in-out",
                      boxShadow: loadingStates.retry
                        ? "none"
                        : "0 2px 4px rgba(245, 158, 11, 0.2)",
                    }}
                  >
                    {loadingStates.retry
                      ? "Retrying..."
                      : `Retry Failed/Cancelled (${
                          selectedPosts.filter((p) =>
                            ["failed", "cancelled"].includes(
                              (p.publishing_status || "draft").toLowerCase()
                            )
                          ).length
                        })`}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Help Text */}
          {selectedPosts.length === 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to use bulk actions:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Select posts using checkboxes</li>
                  <li>• Choose an action above</li>
                  <li>• Actions apply to all selected posts</li>
                </ul>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Status Guide</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Approval Status
                </p>
                <div className="space-y-1 text-sm pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-xs">Pending - Awaiting approval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-xs">Approved - Ready to publish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-xs">Rejected - Not approved</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Publishing Status
                </p>
                <div className="space-y-1 text-sm pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-xs">Draft - Not scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-xs">
                      Scheduled - Will be published
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs">
                      Published - Live on platform
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-xs">Failed - Publishing failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-xs">
                      Cancelled - Scheduling cancelled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialSchedulerBulkPanel;
