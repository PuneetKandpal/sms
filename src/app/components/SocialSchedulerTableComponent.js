import React, { useState, useMemo, forwardRef } from "react";
import { formatLocalDateTime } from "../../utils/dateUtils";
import { TableVirtuoso } from "react-virtuoso";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { MdKeyboardArrowDown, MdMoreVert } from "react-icons/md";
import { CheckIcon, Info } from "lucide-react";
import {
  FaEye,
  FaEdit,
  FaCheck,
  FaTimes,
  FaBan,
  FaPlay,
  FaImage,
  FaCalendarAlt,
  FaRedo,
  FaClock,
  FaTrash,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PostPreviewModal from "./PostPreviewModal";
import ImageViewerModal from "./ImageViewerModal";
import SchedulePostModal from "./SchedulePostModal";
import {
  publishPostNow,
  getAvailableActions,
  isValidStatusTransition,
  cancelScheduledPost,
  deletePost,
  retryPost,
} from "../api/socialMediaService";
import { useSelection } from "../context/SelectionContext";
import api from "../../api/axios";

const TableComponents = {
  Scroller: forwardRef((props, ref) => (
    <TableContainer
      component={Paper}
      elevation={1}
      ref={ref}
      sx={{
        borderRadius: "8px",
        border: "1px solid black",
        maxHeight: "calc(100vh - 300px)",
        overflowY: "auto",
      }}
      {...props}
    />
  )),
  Table: (props) => (
    <Table {...props} size="small" sx={{ borderCollapse: "separate" }} />
  ),
  TableHead: forwardRef((props, ref) => (
    <TableHead
      {...props}
      ref={ref}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        boxShadow: "0px 0.2px 0px 0px black",
        backgroundColor: "white",
      }}
    />
  )),
  TableRow: forwardRef(({ item: row, ...props }, ref) => (
    <TableRow
      ref={ref}
      hover
      {...props}
      sx={{
        backgroundColor:
          row?.status?.toLowerCase() === "in progress" ? "#e5e7eb" : "",
        "&:last-child td, &:last-child th": { border: 0 },
      }}
    />
  )),
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

export default function SocialSchedulerTableComponent({
  columns,
  sortedData,
  visibleColumns,
  isAllSelected,
  checkedRows,
  handleSelectAll,
  handleCheckboxToggle,
  openColumnMenu,
  getApprovalStatusColor,
  getPublishingStatusColor,
  getPlatformColor,
  onStatusUpdate,
  refreshData,
  selectedProject,
  connectedAccounts = [],
}) {
  const data = useMemo(() => sortedData, [sortedData]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedRowForAction, setSelectedRowForAction] = useState(null);
  const [showPostPreview, setShowPostPreview] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalType, setScheduleModalType] = useState("schedule"); // 'schedule' or 'reschedule'
  const [modalPost, setModalPost] = useState(null); // Store post for modal to prevent state clearing issues
  const [previewPost, setPreviewPost] = useState(null); // Store post for preview modals
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryResponse, setRetryResponse] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [approvalMenuAnchor, setApprovalMenuAnchor] = useState(null);
  const [selectedRowForApproval, setSelectedRowForApproval] = useState(null);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostModalPost, setRepostModalPost] = useState(null);
  const userId = localStorage.getItem("userId");
  const router = useRouter();

  const { selectedCompany } = useSelection();

  // Get platform icon
  const getPlatformIcon = (platformName) => {
    if (!platformName) return null;

    const platform = platformName.toLowerCase();
    const iconProps = { size: 16, style: { marginRight: "6px" } };

    switch (platform) {
      case "instagram":
        return (
          <FaInstagram
            {...iconProps}
            style={{ ...iconProps.style, color: "#E4405F" }}
          />
        );
      case "facebook":
        return (
          <FaFacebook
            {...iconProps}
            style={{ ...iconProps.style, color: "#1877F2" }}
          />
        );
      case "twitter":
      case "x":
        return (
          <FaTwitter
            {...iconProps}
            style={{ ...iconProps.style, color: "#1DA1F2" }}
          />
        );
      case "linkedin":
        return (
          <FaLinkedin
            {...iconProps}
            style={{ ...iconProps.style, color: "#0A66C2" }}
          />
        );
      case "tiktok":
        return (
          <FaTiktok
            {...iconProps}
            style={{ ...iconProps.style, color: "#000000" }}
          />
        );
      case "youtube":
        return (
          <FaYoutube
            {...iconProps}
            style={{ ...iconProps.style, color: "#FF0000" }}
          />
        );
      default:
        return null;
    }
  };

  // Check if platform is connected
  const isPlatformConnected = (platformName) => {
    if (!platformName || !connectedAccounts.length) return false;

    return connectedAccounts.some(
      (account) =>
        account.platform?.toLowerCase() === platformName.toLowerCase()
    );
  };

  // Check if approved post can be scheduled/published (platform connected)
  const canScheduleOrPublishApprovedPost = (row) => {
    return (
      row.status?.toLowerCase() === "approved" &&
      isPlatformConnected(row.post_data?.platform_name)
    );
  };

  // Handle redirect to connections page
  const handleConnectPlatform = () => {
    if (selectedCompany?.id) {
      router.push(`/connections?organization_id=${selectedCompany.id}`);
    } else {
      router.push("/connections");
    }
  };

  const handleActionClick = (event, row) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedRowForAction(row);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedRowForAction(null);
  };

  const handleApprovalClick = (event, row) => {
    event.stopPropagation();
    const status = row.status?.toLowerCase();
    if (status === "review" || status === "approved" || status === "rejected") {
      setApprovalMenuAnchor(event.currentTarget);
      setSelectedRowForApproval(row);
    }
  };

  const handleApprovalClose = () => {
    setApprovalMenuAnchor(null);
    setSelectedRowForApproval(null);
  };

  const handlePostPreview = (row) => {
    if (!row) return;
    setPreviewPost({ ...row });
    setShowPostPreview(true);
  };

  const handleImageClick = (imageUrl, imageText, postData) => {
    setSelectedImage({ imageUrl, imageText, postData });
    setShowImageViewer(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedRowForApproval) return;

    // Special validation for approved posts
    if (
      selectedRowForApproval.status?.toLowerCase() === "approved" &&
      (newStatus === "rejected" || newStatus === "review")
    ) {
      const publishingStatus = (
        selectedRowForApproval.publishing_status || "draft"
      ).toLowerCase();

      if (publishingStatus === "scheduled") {
        toast.error(
          "Post is already scheduled. Cannot change approval status now. Please cancel the scheduled post first."
        );
        handleApprovalClose();
        return;
      } else if (publishingStatus === "cancelled") {
        toast.error("Post was cancelled. Cannot change approval status now.");
        handleApprovalClose();
        return;
      } else if (publishingStatus === "failed") {
        toast.error(
          "Post failed to publish. Cannot change approval status now."
        );
        handleApprovalClose();
        return;
      } else if (publishingStatus === "published") {
        toast.error(
          "Post is already published. Cannot change approval status now."
        );
        handleApprovalClose();
        return;
      }
    }

    const actionKey = `${selectedRowForApproval._id}-${newStatus}`;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    try {
      // Validate status transition
      if (
        !isValidStatusTransition(
          selectedRowForApproval.status.toLowerCase(),
          newStatus
        )
      ) {
        throw new Error(
          `Invalid status transition from ${selectedRowForApproval.status} to ${newStatus}`
        );
      }

      // Use the scheduled post _id for status updates
      if (onStatusUpdate) {
        await onStatusUpdate(selectedRowForApproval.post_id, newStatus);
      }
      toast.success(`Post ${newStatus} successfully`);
      handleApprovalClose();
    } catch (error) {
      console.error("Status change error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.error ||
        error.message ||
        `Failed to ${newStatus} post`;
      toast.error(errorMessage);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));

      // Always refresh data in background regardless of success or failure
      if (refreshData) {
        try {
          await refreshData();
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError);
        }
      }
    }
  };

  const handlePublishNow = async () => {
    if (!selectedRowForAction || !userId) return;

    // Show confirmation dialog
    setConfirmAction({
      type: "publish",
      title: "Publish Post Now",
      message:
        "Are you sure you want to publish this post immediately? This action cannot be undone.",
      confirmText: "Publish",
      confirmColor: "#10B981",
      onConfirm: async () => {
        const actionKey = `${selectedRowForAction._id}-publish`;
        setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

        try {
          // Use post_data._id for social media operations (actual post ID)
          const postId = selectedRowForAction.post_data?._id;
          if (!postId) {
            throw new Error("Post ID not found in post data");
          }

          const organizationId = selectedCompany?.id;
          console.log("publishPostNow API call with body:", {
            postId,
            userId,
            organizationId,
          });
          const response = await publishPostNow(postId, userId, organizationId);
          if (response.success) {
            toast.success("Post published successfully!");
            handleActionClose();
          } else {
            throw new Error(response.message || "Failed to publish post");
          }
        } catch (error) {
          console.error("Publish error:", error);
          toast.error(`Failed to publish post: ${error.message}`);
        } finally {
          setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));

          // Always refresh data in background regardless of success or failure
          if (refreshData) {
            try {
              await refreshData();
            } catch (refreshError) {
              console.error("Error refreshing data:", refreshError);
            }
          }
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleCancelScheduledPost = async () => {
    if (!selectedRowForAction) return;

    // Show confirmation dialog
    setConfirmAction({
      type: "cancel",
      title: "Cancel Scheduled Post",
      message:
        "Are you sure you want to cancel this scheduled post? The post will not be published at the scheduled time.",
      confirmText: "Cancel Post",
      confirmColor: "#F59E0B",
      onConfirm: async () => {
        const actionKey = `${selectedRowForAction._id}-cancel`;
        setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

        try {
          // Use the post_id from the scheduled post for cancellation
          const scheduledPostId = selectedRowForAction.post_id;
          if (!scheduledPostId) {
            throw new Error("Scheduled post ID not found");
          }

          console.log(
            "cancelScheduledPost API call for post ID:",
            scheduledPostId
          );
          const response = await cancelScheduledPost(scheduledPostId);
          if (response.success) {
            toast.success("Scheduled post cancelled successfully!");
            handleActionClose();
          } else {
            throw new Error(
              response.message || "Failed to cancel scheduled post"
            );
          }
        } catch (error) {
          console.error("Cancel error:", error);
          toast.error(`Failed to cancel post: ${error.message}`);
        } finally {
          setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));

          // Always refresh data in background regardless of success or failure
          if (refreshData) {
            try {
              await refreshData();
            } catch (refreshError) {
              console.error("Error refreshing data:", refreshError);
            }
          }
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleDeletePost = async () => {
    if (!selectedRowForAction) return;

    // Check if post can be deleted before showing confirmation
    const publishingStatus = (
      selectedRowForAction.publishing_status || "draft"
    ).toLowerCase();
    if (publishingStatus === "scheduled" || publishingStatus === "published") {
      toast.error(
        publishingStatus === "scheduled"
          ? "Scheduled posts must be cancelled before deleting"
          : "Published posts cannot be deleted"
      );
      return;
    }

    // Show confirmation dialog
    setConfirmAction({
      type: "delete",
      title: "Delete Post",
      message:
        "Are you sure you want to delete this post? This action cannot be undone and the post will be permanently removed.",
      confirmText: "Delete",
      confirmColor: "#EF4444",
      onConfirm: async () => {
        const actionKey = `${selectedRowForAction._id}-delete`;
        setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

        try {
          const postId = selectedRowForAction.post_id;
          if (!postId) {
            throw new Error("Post ID not found");
          }

          console.log("deletePost API call for post ID:", postId);
          const response = await deletePost(postId);
          if (response.success) {
            toast.success("Post deleted successfully!");
            handleActionClose();
          } else {
            throw new Error(response.message || "Failed to delete post");
          }
        } catch (error) {
          console.error("Delete error:", error);
          toast.error(`Failed to delete post: ${error.message}`);
        } finally {
          setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));

          // Always refresh data in background regardless of success or failure
          if (refreshData) {
            try {
              await refreshData();
            } catch (refreshError) {
              console.error("Error refreshing data:", refreshError);
            }
          }
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleRetryPost = async () => {
    if (!repostModalPost) return;

    const actionKey = `${repostModalPost._id}-retry`;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    console.log("retryPost API call for post:", repostModalPost);

    try {
      // Use getlate_post_id for the retry API endpoint
      const getlatePostId = repostModalPost._id;
      if (!getlatePostId) {
        throw new Error("GetLate Post ID not found");
      }

      console.log("retryPost API call for getlate_post_id:", getlatePostId);

      // Use the retry API endpoint with getlate_post_id
      const response = await api.post(
        `/social-connect/posts/${getlatePostId}/retry/`
      );

      if (response.data.success) {
        const data = response.data;

        console.log("retryPost API response:", data);
        // Show modal with retry information
        setRetryResponse({
          ...data,
          message: data.message || "Post retry initiated successfully!",
          post_id: data.post_id,
          getlate_post_id: data.getlate_post_id,
          publishing_status: data.publishing_status,
          retry_count: data.retry_count,
        });
        setShowRetryModal(true);
        toast.success("Post retry initiated successfully!");
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || "Failed to retry post");
      }
    } catch (error) {
      console.error("Retry error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.error ||
        error.message ||
        "Failed to retry post";
      toast.error(errorMessage);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));

      // Always refresh data in background regardless of success or failure
      if (refreshData) {
        try {
          await refreshData();
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError);
        }
      }
    }
  };

  const handleDuplicatePost = async () => {
    if (!repostModalPost) return;

    const actionKey = `${repostModalPost._id}-duplicate`;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const postId = repostModalPost.post_id;
      if (!postId) {
        throw new Error("Post ID not found");
      }

      console.log("duplicatePost API call for post ID:", postId);

      // Use the new duplicate API endpoint
      const response = await api.post(
        `/social-connect/posts/${postId}/duplicate/`
      );

      if (response.data.success) {
        const data = response.data;

        console.log("duplicatePost API response:", data);

        if (data.success) {
          // Show success modal with duplicate information
          setRetryResponse({
            ...data,
            message:
              data.message || "Post duplicated successfully! Ready for review.",
            original_post_id: data.original_post_id,
            post_id: data.post_id,
            scheduler_id: data.scheduler_id,
            status: data.status,
            publishing_status: data.publishing_status,
          });
          setShowRetryModal(true);
          toast.success("Post duplicated successfully!");
        } else {
          throw new Error(data.error || "Failed to duplicate post");
        }
      } else {
        const errorData = response.data;
        throw new Error(errorData.error || "Failed to duplicate post");
      }
    } catch (error) {
      console.error("Duplicate error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.error ||
        error.message ||
        "Failed to duplicate post";
      toast.error(errorMessage);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));

      // Always refresh data in background regardless of success or failure
      if (refreshData) {
        try {
          await refreshData();
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError);
        }
      }
    }
  };

  // Check if post can be retried (failed posts only, not cancelled)
  const canRetryPost = (row) => {
    const publishingStatus = (row.publishing_status || "draft").toLowerCase();
    return publishingStatus === "failed"; // Removed cancelled from retry
  };

  // Check if post can be duplicated (published, failed, or cancelled posts)
  const canDuplicatePost = (row) => {
    const publishingStatus = (row.publishing_status || "draft").toLowerCase();
    return (
      publishingStatus === "published" ||
      publishingStatus === "failed" ||
      publishingStatus === "cancelled"
    );
  };

  const handleRepostAction = (row) => {
    console.log("Opening repost modal with post:", row);
    if (!row) {
      toast.error("No post selected for reposting");
      return;
    }

    // Check if post_data exists and has the required _id
    if (!row.post_data || !row.post_id) {
      console.error("Post data validation failed:", {
        hasPostData: !!row.post_data,
        postDataId: row.post_id,
        fullPost: row,
      });
      toast.error("Post data is missing or invalid. Cannot repost this post.");
      return;
    }

    const publishingStatus = (
      row.publishing_status || "Not scheduled"
    ).toLowerCase();
    const canRetry = canRetryPost(row);
    const canDuplicate = canDuplicatePost(row);

    // Check if only one action is available and execute directly
    if (publishingStatus === "cancelled") {
      // For cancelled posts, allow rescheduling.
      handleScheduleAction(row, "reschedule");
      return;
    } else if (publishingStatus === "published") {
      // Only duplicate available for published posts
      setRepostModalPost({ ...row });
      handleDuplicatePost();
      return;
    } else if (publishingStatus === "failed") {
      // Both retry and duplicate available for failed posts - show modal
      setRepostModalPost({ ...row });
      setShowRepostModal(true);
      return;
    }

    // Fallback to modal if multiple actions or unclear state
    setRepostModalPost({ ...row });
    setShowRepostModal(true);
  };

  const handleScheduleAction = (row, type = "schedule") => {
    console.log("Opening schedule modal with post:", row);
    console.log("Post data exists:", !!row?.post_data);
    console.log("Post data details:", {
      hasPostData: !!row?.post_data,
      postDataId: row?.post_data?._id,
      postDataType: typeof row?.post_data,
      postDataKeys: row?.post_data ? Object.keys(row.post_data) : "no keys",
    });

    if (!row) {
      toast.error("No post selected for scheduling");
      return;
    }

    // Check if post_data exists and has the required _id
    if (!row.post_data || !row.post_data._id) {
      console.error("Post data validation failed:", {
        hasPostData: !!row.post_data,
        postDataId: row.post_data?._id,
        fullPost: row,
      });
      toast.error(
        "Post data is missing or invalid. Cannot schedule this post."
      );
      return;
    }

    // Store the post data in a separate state to prevent clearing issues
    setModalPost({ ...row });
    setScheduleModalType(type);
    setShowScheduleModal(true);
  };

  const handleScheduleSuccess = async (
    scheduledPostId,
    status,
    scheduledDateTime,
    timezone,
    organizationId
  ) => {
    console.log("Schedule success callback:", {
      scheduledPostId,
      status,
      scheduledDateTime,
      timezone,
      organizationId,
    });

    // Always refresh data in background to reflect updated status
    if (refreshData) {
      try {
        await refreshData();
      } catch (refreshError) {
        console.error("Error refreshing data after schedule:", refreshError);
      }
    }
  };

  // Enhanced action checking using the service
  const getRowActions = (row) => {
    if (!row?.status) return [];
    const approvalStatus = row.status.toLowerCase();
    const publishingStatus = (row.publishing_status || "draft").toLowerCase();

    const actions = [];

    // Approval actions
    if (approvalStatus === "review") {
      actions.push("approve", "reject");
    }

    // Publishing actions - only for approved posts
    if (approvalStatus === "approved") {
      if (
        publishingStatus === "draft" ||
        publishingStatus === "not scheduled"
      ) {
        actions.push("schedule", "publish_now");
      } else if (publishingStatus === "scheduled") {
        actions.push("reschedule", "publish_now", "cancel");
      } else if (publishingStatus === "failed") {
        actions.push("retry");
      } else if (publishingStatus === "cancelled") {
        actions.push("duplicate");
      }
    }

    // Delete action - allowed for all posts except scheduled or published
    if (publishingStatus !== "scheduled" && publishingStatus !== "published") {
      actions.push("delete");
    }

    return actions;
  };

  const canPerformAction = (row, action) => {
    const availableActions = getRowActions(row);
    return availableActions.includes(action);
  };

  // Format scheduled datetime with timezone
  const formatScheduledDateTime = (dateString, timezone) => {
    if (!dateString) return "Scheduled";

    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Get timezone abbreviation if available
      if (timezone) {
        // Common timezone abbreviations mapping
        const timezoneAbbreviations = {
          UTC: "UTC",
          "America/New_York": "EST/EDT",
          "America/Chicago": "CST/CDT",
          "America/Denver": "MST/MDT",
          "America/Los_Angeles": "PST/PDT",
          "Europe/London": "GMT/BST",
          "Europe/Paris": "CET/CEST",
          "Asia/Tokyo": "JST",
          "Asia/Kolkata": "IST",
          "Australia/Sydney": "AEST/AEDT",
        };

        const tzAbbr =
          timezoneAbbreviations[timezone] || timezone.split("/").pop();
        return `${formattedDate} (${tzAbbr})`;
      }

      return formattedDate;
    } catch (error) {
      console.error("Error formatting scheduled datetime:", error);
      return "Scheduled";
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "-";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TableVirtuoso
        data={data}
        components={TableComponents}
        style={{ width: "100%", height: "calc(100vh - 300px)", border: "1px solid black" }}
        fixedHeaderContent={() => (
          <TableRow>
            {columns
              .filter((c) => visibleColumns[c.key])
              .map((column) => (
                <TableCell
                  key={column.key}
                  align={column.key === "post_content" ? "left" : "center"}
                  sx={{
                    cursor:
                      column.sortable || column.filterable
                        ? "pointer"
                        : "default",
                    fontWeight: 500,
                    fontSize: "12px",
                    p: "5px 8px",
                    ...column.sx,
                  }}
                  onClick={(e) => openColumnMenu(e, column.key)}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    justifyContent={
                      column.key === "platform" ? "flex-start" : "center"
                    }
                  >
                    {column.key === "platform" && (
                      <Checkbox
                        checked={isAllSelected}
                        onChange={() => {
                          handleSelectAll();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        disableRipple={false}
                        sx={{
                          padding: "4px",
                          "&:hover": {
                            backgroundColor: "rgba(152, 16, 250, 0.04)",
                          },
                        }}
                        icon={
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "6px",
                              backgroundColor: "#e5e7eb",
                              marginLeft: "8px",
                              cursor: "pointer",
                            }}
                          />
                        }
                        checkedIcon={
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "6px",
                              backgroundColor: "#9810fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckIcon width={14} height={14} color="white" />
                          </Box>
                        }
                      />
                    )}
                    <span className="text-[13px] font-medium">
                      {column?.label}
                    </span>
                    {(column?.sortable || column?.filterable) && (
                      <MdKeyboardArrowDown
                        style={{
                          cursor: "pointer",
                          width: 18,
                          height: 18,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
          </TableRow>
        )}
        itemContent={(index, row) => (
          <>
            {columns
              .filter((c) => visibleColumns[c.key])
              .map((column) => {
                const key = column.key;
                switch (key) {
                  case "post_content":
                    return (
                      <TableCell
                        key={key}
                        align="left"
                        sx={{ p: "5px 8px", whiteSpace: "nowrap" }}
                      >
                        <div className="w-full">
                          <p className="text-[14px] font-medium text-gray-900 truncate">
                            {truncateText(row.post_data?.post_content, 80)}
                          </p>
                        </div>
                      </TableCell>
                    );
                  case "platform":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Checkbox
                            checked={!!checkedRows[row._id]}
                            onChange={() => {
                              handleCheckboxToggle(row._id);
                            }}
                            size="small"
                            disableRipple={false}
                            sx={{
                              padding: "4px",
                              "&:hover": {
                                backgroundColor: "rgba(152, 16, 250, 0.04)",
                              },
                            }}
                            icon={
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "6px",
                                  backgroundColor: "#e5e7eb",
                                  border: "0.5px solid #d1d5dc",
                                  cursor: "pointer",
                                }}
                              />
                            }
                            checkedIcon={
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "6px",
                                  backgroundColor: "#9810fa",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <CheckIcon
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: "white",
                                  }}
                                />
                              </Box>
                            }
                          />
                          {row.post_data?.platform_name ? (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="start"
                              gap={0.5}
                            >
                              <Box display="flex" alignItems="center">
                                {getPlatformIcon(row.post_data.platform_name)}
                                <span
                                  className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getPlatformColor(
                                    row.post_data.platform_name
                                  )}`}
                                >
                                  {row.post_data.platform_name}
                                </span>
                              </Box>
                              {!isPlatformConnected(
                                row.post_data.platform_name
                              ) && (
                                <Tooltip
                                  title={
                                    <div className="text-sm p-3 rounded-lg flex flex-col gap-4">
                                      <span className="text-xs mb-1">
                                        Platform not yet linked
                                      </span>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleConnectPlatform}
                                        sx={{
                                          backgroundColor: "#3B82F6",
                                          "&:hover": {
                                            backgroundColor: "#2563EB",
                                          },
                                          textTransform: "none",
                                          fontSize: "12px",
                                          py: 0.5,
                                          px: 1,
                                        }}
                                      >
                                        Connect Platform
                                      </Button>
                                    </div>
                                  }
                                  placement="top"
                                  arrow
                                >
                                  <IconButton size="small" sx={{ p: 0.25 }}>
                                    <Info
                                      size={12}
                                      className="text-orange-500"
                                    />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2">-</Typography>
                          )}
                        </Box>
                      </TableCell>
                    );

                  case "status":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        {row.status ? (
                          <span
                            onClick={(e) => handleApprovalClick(e, row)}
                            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getApprovalStatusColor(
                              row.status
                            )} ${
                              row.status?.toLowerCase() === "review" ||
                              row.status?.toLowerCase() === "approved" ||
                              row.status?.toLowerCase() === "rejected"
                                ? "cursor-pointer hover:opacity-80"
                                : ""
                            }`}
                          >
                            {row.status.charAt(0).toUpperCase() +
                              row.status.slice(1)}
                          </span>
                        ) : (
                          <span
                            onClick={(e) => handleApprovalClick(e, row)}
                            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center cursor-pointer hover:opacity-80 ${getApprovalStatusColor(
                              "review"
                            )}`}
                          >
                            Review
                          </span>
                        )}
                      </TableCell>
                    );

                  case "publishing_status":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        {row.publishing_status ? (
                          <span
                            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getPublishingStatusColor(
                              row.publishing_status
                            )}`}
                          >
                            {row.publishing_status.toLowerCase() === "draft"
                              ? "Not Scheduled"
                              : row.publishing_status.charAt(0).toUpperCase() +
                                row.publishing_status.slice(1)}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getPublishingStatusColor(
                              "not scheduled"
                            )}`}
                          >
                            Not Scheduled
                          </span>
                        )}
                      </TableCell>
                    );

                  case "schedule":
                    const approvalStatus =
                      row.status?.toLowerCase() || "review";
                    const publishingStatus = (
                      row.publishing_status || "draft"
                    ).toLowerCase();

                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        {approvalStatus === "review" ? (
                          <Typography variant="body2" className="text-gray-400">
                            -
                          </Typography>
                        ) : approvalStatus === "approved" ||
                          approvalStatus === "rejected" ? (
                          publishingStatus === "scheduled" ? (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              gap={0.5}
                            >
                              <Tooltip title="Click to reschedule or cancel">
                                <Button
                                  size="small"
                                  onClick={() =>
                                    handleScheduleAction(row, "reschedule")
                                  }
                                  disabled={
                                    !isPlatformConnected(
                                      row.post_data?.platform_name
                                    ) || loadingActions[`${row._id}-reschedule`]
                                  }
                                  sx={{
                                    textTransform: "none",
                                    fontSize: "12px",
                                    minWidth: "auto",
                                    p: "2px 8px",
                                    color: "#3B82F6",
                                    "&:hover": {
                                      backgroundColor: "#EFF6FF",
                                    },
                                  }}
                                >
                                  {loadingActions[`${row._id}-reschedule`] ? (
                                    <CircularProgress
                                      size={12}
                                      className="mr-1"
                                    />
                                  ) : (
                                    <FaClock size={12} className="mr-1" />
                                  )}
                                  {formatScheduledDateTime(
                                    row.scheduled_datetime,
                                    row.timezone
                                  )}
                                </Button>
                              </Tooltip>
                              {!isPlatformConnected(
                                row.post_data?.platform_name
                              ) && (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{ mb: 1 }}
                                      >
                                        Platform not connected
                                      </Typography>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleConnectPlatform}
                                        sx={{
                                          backgroundColor: "#3B82F6",
                                          "&:hover": {
                                            backgroundColor: "#2563EB",
                                          },
                                          textTransform: "none",
                                          fontSize: "12px",
                                          py: 0.5,
                                          px: 1,
                                        }}
                                      >
                                        Connect Platform
                                      </Button>
                                    </Box>
                                  }
                                  placement="top"
                                  arrow
                                >
                                  <IconButton size="small" sx={{ p: 0.25 }}>
                                    <Info
                                      size={12}
                                      className="text-orange-500"
                                    />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          ) : publishingStatus === "cancelled" ||
                            publishingStatus === "failed" ||
                            publishingStatus === "published" ? (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              gap={0.5}
                            >
                              {isPlatformConnected(
                                row.post_data?.platform_name
                              ) ? (
                                <Tooltip title="Click to repost">
                                  <Button
                                    size="small"
                                    onClick={() => handleRepostAction(row)}
                                    disabled={
                                      loadingActions[`${row._id}-repost`] ||
                                      loadingActions[`${row._id}-retry`] ||
                                      loadingActions[`${row._id}-duplicate`]
                                    }
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "12px",
                                      minWidth: "auto",
                                      p: "2px 8px",
                                      color:
                                        publishingStatus === "published"
                                          ? "#10B981"
                                          : "#F59E0B",
                                      "&:hover": {
                                        backgroundColor:
                                          publishingStatus === "published"
                                            ? "#ECFDF5"
                                            : "#FFF7ED",
                                      },
                                    }}
                                  >
                                    {loadingActions[`${row._id}-repost`] ||
                                    loadingActions[`${row._id}-retry`] ||
                                    loadingActions[`${row._id}-duplicate`] ? (
                                      <CircularProgress
                                        size={12}
                                        className="mr-1"
                                      />
                                    ) : (
                                      <FaRedo size={12} className="mr-1" />
                                    )}
                                    {publishingStatus === "published"
                                      ? "Repost (Duplicate)"
                                      : publishingStatus === "cancelled"
                                      ? "Repost"
                                      : "Retry"}
                                  </Button>
                                </Tooltip>
                              ) : (
                                <>
                                  <Button
                                    size="small"
                                    disabled
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "12px",
                                      minWidth: "auto",
                                      p: "2px 8px",
                                      color: "#6B7280",
                                      opacity: 0.5,
                                    }}
                                  >
                                    <FaRedo size={12} className="mr-1" />
                                    {publishingStatus === "published"
                                      ? "Repost (Duplicate)"
                                      : publishingStatus === "cancelled"
                                      ? "Duplicate"
                                      : "Repost"}
                                  </Button>
                                  <Tooltip
                                    title={
                                      <Box>
                                        <Typography
                                          variant="body2"
                                          sx={{ mb: 1 }}
                                        >
                                          Platform not connected
                                        </Typography>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={handleConnectPlatform}
                                          sx={{
                                            backgroundColor: "#3B82F6",
                                            "&:hover": {
                                              backgroundColor: "#2563EB",
                                            },
                                            textTransform: "none",
                                            fontSize: "12px",
                                            py: 0.5,
                                            px: 1,
                                          }}
                                        >
                                          Connect Platform
                                        </Button>
                                      </Box>
                                    }
                                    placement="top"
                                    arrow
                                  >
                                    <IconButton size="small" sx={{ p: 0.25 }}>
                                      <Info
                                        size={12}
                                        className="text-orange-500"
                                      />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          ) : (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              gap={0.5}
                            >
                              {isPlatformConnected(
                                row.post_data?.platform_name
                              ) ? (
                                <Tooltip title="Click to schedule or post now">
                                  <Button
                                    size="small"
                                    onClick={() =>
                                      handleScheduleAction(row, "schedule")
                                    }
                                    disabled={
                                      loadingActions[`${row._id}-schedule`]
                                    }
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "12px",
                                      minWidth: "auto",
                                      p: "2px 8px",
                                      color: "#10B981",
                                      "&:hover": {
                                        backgroundColor: "#ECFDF5",
                                      },
                                    }}
                                  >
                                    {loadingActions[`${row._id}-schedule`] ? (
                                      <CircularProgress
                                        size={12}
                                        className="mr-1"
                                      />
                                    ) : null}
                                    Post
                                  </Button>
                                </Tooltip>
                              ) : (
                                <>
                                  <Button
                                    size="small"
                                    disabled
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "12px",
                                      minWidth: "auto",
                                      p: "2px 8px",
                                      color: "#6B7280",
                                      opacity: 0.5,
                                    }}
                                  >
                                    Post
                                  </Button>
                                  <Tooltip
                                    title={
                                      <Box>
                                        <Typography
                                          variant="body2"
                                          sx={{ mb: 1 }}
                                        >
                                          Platform not connected
                                        </Typography>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={handleConnectPlatform}
                                          sx={{
                                            backgroundColor: "#3B82F6",
                                            "&:hover": {
                                              backgroundColor: "#2563EB",
                                            },
                                            textTransform: "none",
                                            fontSize: "12px",
                                            py: 0.5,
                                            px: 1,
                                          }}
                                        >
                                          Connect Platform
                                        </Button>
                                      </Box>
                                    }
                                    placement="top"
                                    arrow
                                  >
                                    <IconButton size="small" sx={{ p: 0.25 }}>
                                      <Info
                                        size={12}
                                        className="text-orange-500"
                                      />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          )
                        ) : (
                          <Typography variant="body2" className="text-gray-400">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    );

                  case "hook":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        <div className="max-w-xs">
                          <span className="text-[13px] font-normal text-gray-700">
                            {truncateText(row.post_data?.hook, 60)}
                          </span>
                        </div>
                      </TableCell>
                    );
                  case "pattern":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        <span className="text-[13px] font-normal text-gray-700">
                          {truncateText(row.post_data?.pattern, 40)}
                        </span>
                      </TableCell>
                    );
                  case "preview":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        <Tooltip title="Preview Post">
                          <IconButton
                            size="small"
                            onClick={() => handlePostPreview(row)}
                            sx={{ color: "#3B82F6" }}
                          >
                            <FaEye size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    );
                  case "created_at":
                  case "updated_at":
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        <span className="text-[13px] font-normal text-gray-700">
                          {formatLocalDateTime(row[key])}
                        </span>
                      </TableCell>
                    );
                  default:
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{ p: "5px 16px" }}
                      >
                        <Typography variant="body2" className="text-[13px]">
                          {row[key] || "-"}
                        </Typography>
                      </TableCell>
                    );
                }
              })}
          </>
        )}
      />

      {/* Approval Status Menu */}
      <Menu
        anchorEl={approvalMenuAnchor}
        open={Boolean(approvalMenuAnchor)}
        onClose={handleApprovalClose}
        PaperProps={{
          sx: {
            minWidth: 140,
            "& .MuiMenuItem-root": {
              fontSize: "14px",
              py: 1,
            },
          },
        }}
      >
        {selectedRowForApproval && (
          <>
            {/* Show Approve option if not already approved */}
            {selectedRowForApproval.status?.toLowerCase() !== "approved" && (
              <MenuItem
                onClick={() => handleStatusChange("approved")}
                sx={{
                  color: "#10B981",
                  opacity: loadingActions[
                    `${selectedRowForApproval._id}-approved`
                  ]
                    ? 0.6
                    : 1,
                  pointerEvents: loadingActions[
                    `${selectedRowForApproval._id}-approved`
                  ]
                    ? "none"
                    : "auto",
                }}
              >
                {loadingActions[`${selectedRowForApproval._id}-approved`] ? (
                  <CircularProgress
                    size={14}
                    className="mr-2"
                    color="inherit"
                  />
                ) : (
                  <FaCheck className="mr-2" size={14} />
                )}
                {loadingActions[`${selectedRowForApproval._id}-approved`]
                  ? "Approving..."
                  : "Approve"}
              </MenuItem>
            )}

            {/* Show Reject option if not already rejected */}
            {selectedRowForApproval.status?.toLowerCase() !== "rejected" && (
              <MenuItem
                onClick={() => handleStatusChange("rejected")}
                sx={{
                  color: "#EF4444",
                  opacity: loadingActions[
                    `${selectedRowForApproval._id}-rejected`
                  ]
                    ? 0.6
                    : 1,
                  pointerEvents: loadingActions[
                    `${selectedRowForApproval._id}-rejected`
                  ]
                    ? "none"
                    : "auto",
                }}
              >
                {loadingActions[`${selectedRowForApproval._id}-rejected`] ? (
                  <CircularProgress
                    size={14}
                    className="mr-2"
                    color="inherit"
                  />
                ) : (
                  <FaTimes className="mr-2" size={14} />
                )}
                {loadingActions[`${selectedRowForApproval._id}-rejected`]
                  ? "Rejecting..."
                  : "Reject"}
              </MenuItem>
            )}

            {/* Show Review option if approved or rejected */}
            {(selectedRowForApproval.status?.toLowerCase() === "approved" ||
              selectedRowForApproval.status?.toLowerCase() === "rejected") && (
              <MenuItem
                onClick={() => handleStatusChange("review")}
                sx={{
                  color: "#F59E0B",
                  opacity: loadingActions[
                    `${selectedRowForApproval._id}-review`
                  ]
                    ? 0.6
                    : 1,
                  pointerEvents: loadingActions[
                    `${selectedRowForApproval._id}-review`
                  ]
                    ? "none"
                    : "auto",
                }}
              >
                {loadingActions[`${selectedRowForApproval._id}-review`] ? (
                  <CircularProgress
                    size={14}
                    className="mr-2"
                    color="inherit"
                  />
                ) : (
                  <FaClock className="mr-2" size={14} />
                )}
                {loadingActions[`${selectedRowForApproval._id}-review`]
                  ? "Moving to Review..."
                  : "Move to Review"}
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Preview Modals */}
      <PostPreviewModal
        open={showPostPreview}
        handleClose={() => {
          setShowPostPreview(false);
          setPreviewPost(null);
        }}
        post={previewPost}
      />

      <ImageViewerModal
        open={showImageViewer}
        handleClose={() => setShowImageViewer(false)}
        imageUrl={selectedImage?.imageUrl}
        imageText={selectedImage?.imageText}
        postData={selectedImage?.postData}
      />

      {/* Repost Modal */}
      {showRepostModal && repostModalPost && (
        <Dialog
          open={showRepostModal}
          onClose={() => {
            setShowRepostModal(false);
            setRepostModalPost(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "12px",
            },
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <FaRedo className="text-orange-600" size={20} />
              <Typography variant="h6" component="div">
                {(repostModalPost?.publishing_status || "").toLowerCase() ===
                "failed"
                  ? "Retry Options"
                  : "Repost Options"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Choose how you want to repost this content:
              </Typography>

              <Box
                sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}
              >
                {canRetryPost(repostModalPost) && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FaRedo />}
                    onClick={async () => {
                      setShowRepostModal(false);
                      await handleRetryPost();
                    }}
                    sx={{
                      backgroundColor: "white",
                      borderColor: "#F59E0B",
                      color: "#F59E0B",
                      "&:hover": {
                        backgroundColor: "#FFF7ED",
                        borderColor: "#D97706",
                      },
                      textTransform: "none",
                      p: 2,
                      justifyContent: "flex-start",
                    }}
                  >
                    <Box sx={{ textAlign: "left", ml: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Retry Publishing
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Attempt to publish the same post again
                      </Typography>
                    </Box>
                  </Button>
                )}

                {canDuplicatePost(repostModalPost) && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FaPlay />}
                    onClick={() => {
                      setShowRepostModal(false);
                      handleDuplicatePost();
                    }}
                    sx={{
                      backgroundColor: "white",
                      borderColor: "#10B981",
                      color: "#10B981",
                      "&:hover": {
                        backgroundColor: "#ECFDF5",
                        borderColor: "#059669",
                      },
                      textTransform: "none",
                      p: 2,
                      justifyContent: "flex-start",
                    }}
                  >
                    <Box sx={{ textAlign: "left", ml: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Republish as New Post
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create a copy and submit for review
                      </Typography>
                    </Box>
                  </Button>
                )}

                {!canRetryPost(repostModalPost) &&
                  !canDuplicatePost(repostModalPost) && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#FEF3F2",
                        borderRadius: "8px",
                        border: "1px solid #FECACA",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="#DC2626"
                        sx={{ fontWeight: 500 }}
                      >
                        This post cannot be reposted
                      </Typography>
                      <Typography
                        variant="body2"
                        color="#7F1D1D"
                        sx={{ mt: 0.5 }}
                      >
                        Only failed, cancelled, or published posts can be
                        reposted
                      </Typography>
                    </Box>
                  )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => {
                setShowRepostModal(false);
                setRepostModalPost(null);
              }}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderColor: "#D1D5DB",
                color: "#374151",
                "&:hover": {
                  borderColor: "#9CA3AF",
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Schedule Post Modal */}
      <SchedulePostModal
        open={showScheduleModal}
        handleClose={() => {
          setShowScheduleModal(false);
          setModalPost(null);
          // Clear the selected row after modal closes to prevent stale state
          setTimeout(() => setSelectedRowForAction(null), 100);
        }}
        post={modalPost || selectedRowForAction}
        userId={userId}
        organizationId={selectedProject?.company_id}
        onRefresh={refreshData}
        onSuccess={handleScheduleSuccess}
        isReschedule={scheduleModalType === "reschedule"}
      />

      {/* Retry Success Modal */}
      {showRetryModal && retryResponse && (
        <Dialog
          open={showRetryModal}
          onClose={() => {
            setShowRetryModal(false);
            setRetryResponse(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "12px",
            },
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <FaRedo className="text-yellow-600" size={20} />
              <Typography variant="h6" component="div">
                {retryResponse.scheduler_id
                  ? "Post Duplicated Successfully"
                  : "Post Reposted Successfully"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom>
                {retryResponse.message}
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "#F3F4F6",
                  borderRadius: "8px",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Post Details:
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Post ID:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {retryResponse.post_id}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      GetLate Post ID:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {retryResponse.getlate_post_id}
                    </Typography>
                  </Box>
                  {retryResponse.retry_count && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Retry Count:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {retryResponse.retry_count}
                      </Typography>
                    </Box>
                  )}
                  {retryResponse.scheduler_id && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Scheduler ID:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {retryResponse.scheduler_id}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Publishing Status:
                    </Typography>
                    <span className="inline-flex px-2 py-[3px] text-xs font-medium rounded-lg bg-gray-100 text-gray-700">
                      {retryResponse.publishing_status || "Unknown"}
                    </span>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "#EFF6FF",
                  borderRadius: "8px",
                  border: "1px solid #DBEAFE",
                }}
              >
                <Typography variant="body2" color="#1E40AF">
                  ℹ️{" "}
                  {retryResponse.scheduler_id
                    ? "A copy of the original post has been created as a new post. The new post is ready for review and can be edited before publishing."
                    : "The post retry has been initiated successfully. The system will attempt to republish the post. Please check the status in a few moments."}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => {
                setShowRetryModal(false);
                setRetryResponse(null);
              }}
              variant="contained"
              sx={{
                backgroundColor: "#3B82F6",
                "&:hover": { backgroundColor: "#2563EB" },
                textTransform: "none",
              }}
            >
              Got it
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <Dialog
          open={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
          }}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "12px",
            },
          }}
        >
          <DialogTitle>
            <Typography variant="h6" component="div" fontWeight="600">
              {confirmAction.title}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {confirmAction.message}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmAction(null);
              }}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderColor: "#D1D5DB",
                color: "#374151",
                "&:hover": {
                  borderColor: "#9CA3AF",
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowConfirmDialog(false);
                if (confirmAction.onConfirm) {
                  await confirmAction.onConfirm();
                }
                setConfirmAction(null);
              }}
              variant="contained"
              sx={{
                backgroundColor: confirmAction.confirmColor,
                "&:hover": {
                  backgroundColor: confirmAction.confirmColor,
                  filter: "brightness(0.9)",
                },
                textTransform: "none",
              }}
            >
              {confirmAction.confirmText}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
