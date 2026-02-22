"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack,
  NavigateBefore,
  NavigateNext,
  Reddit,
  LinkedIn,
} from "@mui/icons-material";

const getPlatformConfig = (platform) => {
  switch (platform?.toLowerCase()) {
    case "reddit":
      return {
        name: "Reddit",
        icon: <Reddit sx={{ color: "#FF4500" }} />,
        color: "#FF4500",
      };
    case "linkedin":
      return {
        name: "LinkedIn",
        icon: <LinkedIn sx={{ color: "#0077b5" }} />,
        color: "#0077b5",
      };
    default:
      return { name: "Social Platform", icon: null, color: "#6B7280" };
  }
};

const getPriorityConfig = (score) => {
  if (score >= 85) return { level: "Immediate", color: "#EF4444" };
  if (score >= 70) return { level: "Urgent", color: "#F59E0B" };
  if (score >= 60) return { level: "Normal", color: "#3B82F6" };
  return { level: "Low", color: "#6B7280" };
};

const getStatusConfig = (status) => {
  const statusLower = status?.toLowerCase() || "review";
  switch (statusLower) {
    case "approved":
      return { label: "Approved", color: "#10B981", bgColor: "#ECFDF5" };
    case "rejected":
      return { label: "Rejected", color: "#EF4444", bgColor: "#FEF2F2" };
    case "completed":
      return { label: "Completed", color: "#10B981", bgColor: "#ECFDF5" };
    default:
      return { label: "In Progress", color: "#F59E0B", bgColor: "#FFFBEB" };
  }
};

export default function OpportunityHeader({
  opportunity,
  onGoBack,
  onNavigate,
  currentIndex,
  totalCount,
  canNavigatePrevious,
  canNavigateNext,
  opportunitiesList = [], // Add this prop to receive the opportunities list
}) {
  const platformConfig = getPlatformConfig(
    opportunity?.post_info?.post_subreddit ? "reddit" : "linkedin"
  );
  const priorityConfig = getPriorityConfig(
    opportunity?.assessment?.overall_score || 0
  );
  const statusConfig = getStatusConfig(opportunity?.assessment?.status);

  const getRecommendedAction = () => {
    const score = opportunity?.assessment?.overall_score || 0;
    if (score >= 85) return "Immediate outreach - high intent opportunity";
    if (score >= 70) return "Urgent follow-up - strong potential";
    if (score >= 60) return "Normal priority - monitor and engage";
    return "Low priority - track for future";
  };

  return (
    <Paper
      elevation={3}
      sx={{
        //position: "sticky",
        //top: 0,
        zIndex: 1000,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        borderRadius: 0,
        mb: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <Box sx={{ px: 3, py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          {/* Left Section - Back button, Title and Platform */}
          <div>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton
                onClick={onGoBack}
                size="small"
                sx={{
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <ArrowBack />
              </IconButton>

              <Box display="flex" alignItems="center" gap={1}>
                {platformConfig.icon}
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: "white", fontSize: "1.1rem" }}
                >
                  Opportunity Details
                </Typography>
              </Box>

              {/* Compact Status Chips */}
              <Box display="flex" gap={1}>
                <Chip
                  label={priorityConfig.level}
                  size="small"
                  sx={{
                    backgroundColor: priorityConfig.color,
                    color: "white",
                    fontSize: "0.7rem",
                    height: 22,
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    backgroundColor: statusConfig.color,
                    color:
                      statusConfig.bgColor === "#FFFBEB" ? "#92400E" : "white",
                    fontSize: "0.7rem",
                    height: 22,
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={`${Math.round(
                    opportunity?.assessment?.overall_score || 0
                  )}/100`}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    fontSize: "0.7rem",
                    height: 22,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
            {/* Bottom Row - Post Title */}
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255, 255, 255, 0.95)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {opportunity?.post_info?.post_title || "Loading opportunity..."}
              </Typography>
            </Box>
          </div>

          <div className="flex items-start gap-2">
            {/* Right Section - Navigation */}
            <Box display="flex" alignItems="center" gap={2} marginTop={1}>
              {totalCount > 1 && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.8rem",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontWeight: 500,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {currentIndex + 1} of {totalCount}
                </Typography>
              )}
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={1}
            >
              <Tooltip
                title={
                  canNavigatePrevious && opportunitiesList[currentIndex - 1]
                    ? `Previous: ${opportunitiesList[
                        currentIndex - 1
                      ].post_title?.substring(0, 50)}${
                        opportunitiesList[currentIndex - 1].post_title?.length >
                        50
                          ? "..."
                          : ""
                      }`
                    : "No previous opportunity"
                }
                placement="bottom"
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onNavigate("previous")}
                    disabled={!canNavigatePrevious}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: canNavigatePrevious
                        ? "white"
                        : "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                      },
                    }}
                  >
                    <NavigateBefore fontSize="small" className="rotate-90" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  canNavigateNext && opportunitiesList[currentIndex + 1]
                    ? `Next: ${opportunitiesList[
                        currentIndex + 1
                      ].post_title?.substring(0, 50)}${
                        opportunitiesList[currentIndex + 1].post_title?.length >
                        50
                          ? "..."
                          : ""
                      }`
                    : "No next opportunity"
                }
                placement="bottom"
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onNavigate("next")}
                    disabled={!canNavigateNext}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: canNavigateNext
                        ? "white"
                        : "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                      },
                    }}
                  >
                    <NavigateNext fontSize="small" className="rotate-90" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </div>
        </Box>
      </Box>
    </Paper>
  );
}
