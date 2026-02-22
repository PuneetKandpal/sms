"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { FaClock, FaCalendarAlt, FaPlay, FaBan } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  schedulePost,
  reschedulePost,
  publishPostNow,
  cancelScheduledPost,
} from "../api/socialMediaService";
import { GET_ACCOUNTS_API } from "../api/jbiAPI";
import { useSelection } from "../context/SelectionContext";
import api from "../../api/axios";

// Common timezone options
// Enhanced timezone options with GMT offsets and friendlier labels
const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (GMT+00:00) — Coordinated Universal Time" },
  { value: "Etc/GMT+12", label: "GMT−12:00 — International Date Line West" },
  { value: "Etc/GMT+11", label: "GMT−11:00 — Midway Island, American Samoa" },
  { value: "Pacific/Midway", label: "GMT−11:00 — Midway Island (SST)" },
  { value: "Pacific/Honolulu", label: "GMT−10:00 — Honolulu (HST)" },
  { value: "America/Anchorage", label: "GMT−09:00 — Anchorage (AKST/AKDT)" },
  { value: "America/Los_Angeles", label: "GMT−08:00 — Los Angeles (PST/PDT)" },
  { value: "America/Tijuana", label: "GMT−08:00 — Tijuana, Mexico (PST/PDT)" },
  { value: "America/Denver", label: "GMT−07:00 — Denver (MST/MDT)" },
  { value: "America/Phoenix", label: "GMT−07:00 — Phoenix (MST)" },
  { value: "America/Chicago", label: "GMT−06:00 — Chicago (CST/CDT)" },
  { value: "America/Mexico_City", label: "GMT−06:00 — Mexico City (CST/CDT)" },
  { value: "America/Regina", label: "GMT−06:00 — Regina (CST)" },
  { value: "America/El_Salvador", label: "GMT−06:00 — El Salvador (CST)" },
  { value: "America/Bogota", label: "GMT−05:00 — Bogotá, Colombia (COT)" },
  { value: "America/New_York", label: "GMT−05:00 — New York (EST/EDT)" },
  { value: "America/Toronto", label: "GMT−05:00 — Toronto (EST/EDT)" },
  { value: "America/Havana", label: "GMT−05:00 — Havana, Cuba (CST/CDT)" },
  { value: "America/Caracas", label: "GMT−04:00 — Caracas, Venezuela (VET)" },
  {
    value: "America/Sao_Paulo",
    label: "GMT−03:00 — São Paulo, Brazil (BRT/BRST)",
  },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "GMT−03:00 — Buenos Aires, Argentina (ART)",
  },
  {
    value: "America/Montevideo",
    label: "GMT−03:00 — Montevideo, Uruguay (UYT/UYDT)",
  },
  {
    value: "America/Santiago",
    label: "GMT−03:00 — Santiago, Chile (CLT/CLST)",
  },
  { value: "Atlantic/Azores", label: "GMT−01:00 — Azores (AZOT/AZOST)" },
  { value: "Atlantic/Cape_Verde", label: "GMT−01:00 — Cape Verde (CVT)" },
  { value: "Europe/London", label: "GMT+00:00 — London, UK (GMT/BST)" },
  { value: "Europe/Dublin", label: "GMT+00:00 — Dublin, Ireland (GMT/IST)" },
  { value: "Europe/Lisbon", label: "GMT+00:00 — Lisbon, Portugal (WET/WEST)" },
  {
    value: "Europe/Amsterdam",
    label: "GMT+01:00 — Amsterdam, Netherlands (CET/CEST)",
  },
  { value: "Europe/Paris", label: "GMT+01:00 — Paris, France (CET/CEST)" },
  { value: "Europe/Berlin", label: "GMT+01:00 — Berlin, Germany (CET/CEST)" },
  {
    value: "Europe/Brussels",
    label: "GMT+01:00 — Brussels, Belgium (CET/CEST)",
  },
  { value: "Europe/Madrid", label: "GMT+01:00 — Madrid, Spain (CET/CEST)" },
  { value: "Europe/Rome", label: "GMT+01:00 — Rome, Italy (CET/CEST)" },
  {
    value: "Europe/Stockholm",
    label: "GMT+01:00 — Stockholm, Sweden (CET/CEST)",
  },
  { value: "Europe/Warsaw", label: "GMT+01:00 — Warsaw, Poland (CET/CEST)" },
  { value: "Europe/Prague", label: "GMT+01:00 — Prague, Czechia (CET/CEST)" },
  {
    value: "Europe/Budapest",
    label: "GMT+01:00 — Budapest, Hungary (CET/CEST)",
  },
  { value: "Europe/Athens", label: "GMT+02:00 — Athens, Greece (EET/EEST)" },
  { value: "Europe/Istanbul", label: "GMT+03:00 — Istanbul, Turkey (TRT)" },
  { value: "Europe/Moscow", label: "GMT+03:00 — Moscow, Russia (MSK)" },
  { value: "Asia/Jerusalem", label: "GMT+02:00 — Jerusalem, Israel (IST/IDT)" },
  { value: "Asia/Amman", label: "GMT+02:00 — Amman, Jordan (EET/EEST)" },
  { value: "Asia/Beirut", label: "GMT+02:00 — Beirut, Lebanon (EET/EEST)" },
  { value: "Africa/Cairo", label: "GMT+02:00 — Cairo, Egypt (EET)" },
  {
    value: "Africa/Johannesburg",
    label: "GMT+02:00 — Johannesburg, South Africa (SAST)",
  },
  { value: "Asia/Dubai", label: "GMT+04:00 — Dubai, UAE (GST)" },
  { value: "Asia/Karachi", label: "GMT+05:00 — Karachi, Pakistan (PKT)" },
  { value: "Asia/Kolkata", label: "GMT+05:30 — Kolkata, India (IST)" },
  { value: "Asia/Colombo", label: "GMT+05:30 — Colombo, Sri Lanka (IST)" },
  { value: "Asia/Dhaka", label: "GMT+06:00 — Dhaka, Bangladesh (BST)" },
  { value: "Asia/Almaty", label: "GMT+06:00 — Almaty, Kazakhstan (ALMT)" },
  { value: "Asia/Bangkok", label: "GMT+07:00 — Bangkok, Thailand (ICT)" },
  { value: "Asia/Singapore", label: "GMT+08:00 — Singapore (SGT)" },
  { value: "Asia/Shanghai", label: "GMT+08:00 — Shanghai, China (CST)" },
  { value: "Asia/Hong_Kong", label: "GMT+08:00 — Hong Kong (HKT)" },
  { value: "Asia/Tokyo", label: "GMT+09:00 — Tokyo, Japan (JST)" },
  { value: "Asia/Seoul", label: "GMT+09:00 — Seoul, South Korea (KST)" },
  { value: "Australia/Perth", label: "GMT+08:00 — Perth, Australia (AWST)" },
  {
    value: "Australia/Adelaide",
    label: "GMT+09:30 — Adelaide, Australia (ACST/ACDT)",
  },
  {
    value: "Australia/Sydney",
    label: "GMT+10:00 — Sydney, Australia (AEST/AEDT)",
  },
  {
    value: "Australia/Melbourne",
    label: "GMT+10:00 — Melbourne, Australia (AEST/AEDT)",
  },
  {
    value: "Australia/Brisbane",
    label: "GMT+10:00 — Brisbane, Australia (AEST)",
  },
  {
    value: "Australia/Hobart",
    label: "GMT+10:00 — Hobart, Australia (AEST/AEDT)",
  },
  { value: "Pacific/Guam", label: "GMT+10:00 — Guam (ChST)" },
  { value: "Pacific/Fiji", label: "GMT+12:00 — Fiji (FJT/FJST)" },
  {
    value: "Pacific/Auckland",
    label: "GMT+12:00 — Auckland, New Zealand (NZST/NZDT)",
  },
  {
    value: "Pacific/Chatham",
    label: "GMT+12:45 — Chatham Islands (CHAST/CHADT)",
  },
  { value: "Pacific/Tongatapu", label: "GMT+13:00 — Nuku’alofa, Tonga (TOT)" },
  { value: "Pacific/Apia", label: "GMT+13:00 — Apia, Samoa (WSST/WSDT)" },
  { value: "Indian/Maldives", label: "GMT+05:00 — Maldives (MST)" },
  { value: "Indian/Mauritius", label: "GMT+04:00 — Mauritius (MUT)" },
  { value: "Indian/Reunion", label: "GMT+04:00 — Réunion (RET)" },
  { value: "Africa/Nairobi", label: "GMT+03:00 — Nairobi, Kenya (EAT)" },
  {
    value: "Africa/Addis_Ababa",
    label: "GMT+03:00 — Addis Ababa, Ethiopia (EAT)",
  },
  { value: "Africa/Khartoum", label: "GMT+02:00 — Khartoum, Sudan (CAT)" },
  { value: "Africa/Lagos", label: "GMT+01:00 — Lagos, Nigeria (WAT)" },
  { value: "Africa/Accra", label: "GMT+00:00 — Accra, Ghana (GMT)" },
  {
    value: "Africa/Dar_es_Salaam",
    label: "GMT+03:00 — Dar es Salaam, Tanzania (EAT)",
  },
];

export default function SchedulePostModal({
  open,
  handleClose,
  post,
  userId,
  onSuccess,
  onRefresh,
  isReschedule = false,
}) {
  console.log("SchedulePostModal props:", {
    userId,
    postId: post?._id,
    postPostId: post?.post_id,
    postStructure: post,
  });

  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [actionType, setActionType] = useState(
    isReschedule ? "reschedule" : "schedule"
  ); // 'schedule', 'post_now', 'reschedule', 'cancel'

  const { selectedCompany } = useSelection();

  // Load connected accounts when modal opens
  useEffect(() => {
    const loadConnectedAccounts = async () => {
      if (open && userId) {
        try {
          const response = await api.get(
            `/social-connect/accounts/?user_id=${userId}&organization_id=${selectedCompany?.id}`
          );
          if (response.data.success) {
            setConnectedAccounts(response.data.accounts || []);
          }
        } catch (error) {
          console.error("Error loading connected accounts:", error);
        }
      }
    };

    loadConnectedAccounts();
  }, [open, userId, selectedCompany?.id]);

  // Initialize with current scheduled time if rescheduling
  useEffect(() => {
    console.log("SchedulePostModal useEffect triggered:", {
      open,
      hasPost: !!post,
      hasPostData: !!post?.post_data,
      postDataId: post?.post_data?._id,
      isReschedule,
      scheduledDateTime: post?.scheduled_datetime,
    });

    if (open && post && isReschedule && post.scheduled_datetime) {
      setScheduledDateTime(new Date(post.scheduled_datetime));
      setTimezone(post.timezone || "UTC");
      setActionType("reschedule");
    } else if (open) {
      // Default to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setScheduledDateTime(defaultTime);
      setTimezone("UTC");
      setActionType("schedule");
    }
    setError("");
  }, [open, post, isReschedule]);

  // Check if platform is connected
  const isPlatformConnected = (platformName) => {
    if (!platformName || !connectedAccounts.length) return false;

    return connectedAccounts.some(
      (account) =>
        account.platform?.toLowerCase() === platformName.toLowerCase()
    );
  };

  const handleSchedule = async () => {
    // Validate based on action type
    if (actionType !== "post_now" && actionType !== "cancel") {
      if (!scheduledDateTime) {
        setError("Please select a date and time");
        return;
      }

      if (scheduledDateTime <= new Date()) {
        setError("Scheduled time must be in the future");
        return;
      }
    }

    // Validate post object
    if (!post) {
      setError("No post selected");
      console.error("Post object is null or undefined:", post);
      return;
    }

    if (!post.post_data) {
      setError("Post data not found");
      console.error("Post data is missing:", post);
      return;
    }

    // Check if platform is connected
    const platformName = post.post_data.platform_name;
    if (
      platformName &&
      !isPlatformConnected(platformName) &&
      actionType !== "cancel"
    ) {
      toast.error(`Please connect your ${platformName} account first`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use post_data._id for social media operations (actual post ID)
      const postId = post.post_data._id;
      if (!postId) {
        throw new Error("Post ID not found in post data");
      }

      console.log("Performing action:", {
        actionType,
        postId,
        userId,
        timezone,
        organizationId: selectedCompany?.id,
        scheduledPostId: post._id,
      });

      let response;
      let successMessage = "";

      switch (actionType) {
        case "post_now":
          response = await publishPostNow(postId, userId, selectedCompany?.id);
          successMessage = "Post published successfully!";
          break;

        case "cancel":
          response = await cancelScheduledPost(postId);
          successMessage = "Scheduled post cancelled successfully!";
          break;

        case "reschedule":
          const isoDateTime = scheduledDateTime.toISOString();
          response = await reschedulePost(postId, isoDateTime, timezone);
          successMessage = "Post rescheduled successfully!";
          break;

        case "schedule":
        default:
          const scheduleIsoDateTime = scheduledDateTime.toISOString();
          response = await schedulePost(
            postId,
            userId,
            scheduleIsoDateTime,
            timezone,
            selectedCompany?.id
          );
          successMessage = "Post scheduled successfully!";
          break;
      }

      if (response.success) {
        toast.success(successMessage);
        handleClose();
      } else {
        throw new Error(response.message || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      setError(error.message || "Failed to perform action");
      toast.error(error.message || "Failed to perform action");
    } finally {
      setLoading(false);

      // Always trigger refresh callback regardless of success or failure
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError);
        }
      }

      // Call onSuccess only on successful action for any additional success logic
      if (onSuccess && !error) {
        try {
          const isoDateTime = scheduledDateTime
            ? scheduledDateTime.toISOString()
            : new Date().toISOString();
          onSuccess(
            post._id,
            actionType === "cancel" ? "cancelled" : "scheduled",
            isoDateTime,
            timezone,
            selectedCompany?.id
          );
        } catch (callbackError) {
          console.error("Error in onSuccess callback:", callbackError);
        }
      }
    }
  };

  const formatDateTime = (date, tz = timezone) => {
    if (!date) return "";

    try {
      // Don't convert timezone - treat the entered date/time as being in the selected timezone
      const formattedDate = date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        // Remove timeZone conversion - we want to show the exact time the user entered
      });

      // Get the timezone offset information for display
      const timezoneInfo = TIMEZONE_OPTIONS.find(
        (tz_opt) => tz_opt.value === tz
      );
      const timezoneLabel = timezoneInfo ? timezoneInfo.label : tz;

      return `${formattedDate} (${timezoneLabel})`;
    } catch (error) {
      console.error("Error formatting date:", error);
      // Fallback to basic formatting
      return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          {isReschedule ? (
            <FaCalendarAlt className="text-blue-600" size={20} />
          ) : (
            <FaClock className="text-blue-600" size={20} />
          )}
          <Typography variant="h6" component="div">
            {isReschedule ? "Manage Scheduled Post" : "Post Options"}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Post Preview */}
        {post && post.post_data ? (
          <Box mb={3} p={2} bgcolor="gray.50" borderRadius="8px">
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Post Content:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                maxHeight: "100px",
                overflow: "auto",
                wordBreak: "break-word",
              }}
            >
              {post.post_data.post_content || "No content available"}
            </Typography>
            {post.post_data.platform_name && (
              <Typography
                variant="caption"
                color="text.secondary"
                mt={1}
                display="block"
              >
                Platform: {post.post_data.platform_name}
              </Typography>
            )}
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Post data is not available. Please try selecting a different post.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action Selection - Tab-like interface */}
        {!isReschedule && (
          <Box mb={3}>
            <Box display="flex" borderBottom="1px solid #E5E7EB">
              <Box
                onClick={() => setActionType("schedule")}
                sx={{
                  flex: 1,
                  py: 2,
                  px: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  borderBottom:
                    actionType === "schedule"
                      ? "2px solid #3B82F6"
                      : "2px solid transparent",
                  backgroundColor:
                    actionType === "schedule" ? "#F8FAFC" : "transparent",
                  color: actionType === "schedule" ? "#3B82F6" : "#6B7280",
                  fontSize: "14px",
                  fontWeight: actionType === "schedule" ? 600 : 400,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#F8FAFC",
                    color: "#3B82F6",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <FaCalendarAlt size={14} />
                Schedule
              </Box>
              <Box
                onClick={() => setActionType("post_now")}
                sx={{
                  flex: 1,
                  py: 2,
                  px: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  borderBottom:
                    actionType === "post_now"
                      ? "2px solid #10B981"
                      : "2px solid transparent",
                  backgroundColor:
                    actionType === "post_now" ? "#F0FDF4" : "transparent",
                  color: actionType === "post_now" ? "#10B981" : "#6B7280",
                  fontSize: "14px",
                  fontWeight: actionType === "post_now" ? 600 : 400,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#F0FDF4",
                    color: "#10B981",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <FaPlay size={14} />
                Post Now
              </Box>
            </Box>
          </Box>
        )}

        {isReschedule && (
          <Box mb={3}>
            <Box display="flex" borderBottom="1px solid #E5E7EB">
              <Box
                onClick={() => setActionType("reschedule")}
                sx={{
                  flex: 1,
                  py: 2,
                  px: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  borderBottom:
                    actionType === "reschedule"
                      ? "2px solid #3B82F6"
                      : "2px solid transparent",
                  backgroundColor:
                    actionType === "reschedule" ? "#F8FAFC" : "transparent",
                  color: actionType === "reschedule" ? "#3B82F6" : "#6B7280",
                  fontSize: "14px",
                  fontWeight: actionType === "reschedule" ? 600 : 400,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#F8FAFC",
                    color: "#3B82F6",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <FaClock size={14} />
                Reschedule
              </Box>
              <Box
                onClick={() => setActionType("cancel")}
                sx={{
                  flex: 1,
                  py: 2,
                  px: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  borderBottom:
                    actionType === "cancel"
                      ? "2px solid #F59E0B"
                      : "2px solid transparent",
                  backgroundColor:
                    actionType === "cancel" ? "#FFFBEB" : "transparent",
                  color: actionType === "cancel" ? "#F59E0B" : "#6B7280",
                  fontSize: "14px",
                  fontWeight: actionType === "cancel" ? 600 : 400,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#FFFBEB",
                    color: "#F59E0B",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <FaBan size={14} />
                Cancel Post
              </Box>
            </Box>
          </Box>
        )}

        {/* Show date/time pickers only for schedule/reschedule actions */}
        {(actionType === "schedule" || actionType === "reschedule") && (
          <Box display="flex" flexDirection="column" gap={3} pt={2}>
            {/* DateTime Picker */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Schedule Date & Time"
                value={scheduledDateTime}
                onChange={setScheduledDateTime}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    helperText="Select when you want this post to be published"
                  />
                )}
                minDateTime={new Date()}
                ampm={true}
              />
            </LocalizationProvider>

            {/* Timezone Selector with Autocomplete */}
            <Autocomplete
              value={TIMEZONE_OPTIONS.find((tz) => tz.value === timezone)}
              onChange={(event, newValue) => {
                setTimezone(newValue ? newValue.value : "UTC");
              }}
              options={TIMEZONE_OPTIONS}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField {...params} label="Timezone" fullWidth />
              )}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
            />

            {/* Preview */}
            {scheduledDateTime && (
              <Box p={2} bgcolor="blue.50" borderRadius="8px">
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Scheduled for:
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {formatDateTime(scheduledDateTime)}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Confirmation message for post_now */}
        {actionType === "post_now" && (
          <Box p={2} bgcolor="green.50" borderRadius="8px">
            <Typography variant="body2" color="text.primary">
              This post will be published immediately to your connected{" "}
              {post?.post_data?.platform_name} account.
            </Typography>
          </Box>
        )}

        {/* Confirmation message for cancel */}
        {actionType === "cancel" && (
          <Box p={2} bgcolor="orange.50" borderRadius="8px">
            <Typography variant="body2" color="text.primary">
              Are you sure you want to cancel this scheduled post? The post will
              not be published at the scheduled time.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSchedule}
          variant="contained"
          disabled={
            loading ||
            !post ||
            !post.post_data ||
            ((actionType === "schedule" || actionType === "reschedule") &&
              !scheduledDateTime)
          }
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : actionType === "post_now" ? (
              <FaPlay size={14} />
            ) : actionType === "cancel" ? (
              <FaBan size={14} />
            ) : actionType === "reschedule" ? (
              <FaClock size={14} />
            ) : (
              <FaCalendarAlt size={14} />
            )
          }
          sx={{
            backgroundColor:
              actionType === "post_now"
                ? "#10B981"
                : actionType === "cancel"
                ? "#F59E0B"
                : "#3B82F6",
            "&:hover": {
              backgroundColor:
                actionType === "post_now"
                  ? "#059669"
                  : actionType === "cancel"
                  ? "#D97706"
                  : "#2563EB",
            },
          }}
        >
          {loading
            ? "Processing..."
            : actionType === "post_now"
            ? "Publish Now"
            : actionType === "cancel"
            ? "Cancel Post"
            : actionType === "reschedule"
            ? "Reschedule"
            : "Schedule Post"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
