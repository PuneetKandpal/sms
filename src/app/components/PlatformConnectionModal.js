"use client";
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { FaExclamationTriangle, FaLink, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";

// Platform configurations with icons and colors
const PLATFORM_CONFIG = {
  facebook: {
    name: "Facebook",
    color: "#1877F2",
    icon: "📘",
  },
  instagram: {
    name: "Instagram",
    color: "#E4405F",
    icon: "📷",
  },
  twitter: {
    name: "X (Twitter)",
    color: "#000000",
    icon: "🐦",
  },
  linkedin: {
    name: "LinkedIn",
    color: "#0077B5",
    icon: "💼",
  },
  tiktok: {
    name: "TikTok",
    color: "#000000",
    icon: "🎵",
  },
  youtube: {
    name: "YouTube",
    color: "#FF0000",
    icon: "📺",
  },
  reddit: {
    name: "Reddit",
    color: "#FF4500",
    icon: "🔴",
  },
};

export default function PlatformConnectionModal({
  open,
  handleClose,
  platform,
  postContent,
  organizationId,
}) {
  const router = useRouter();

  const platformConfig = PLATFORM_CONFIG[platform?.toLowerCase()] || {
    name: platform || "Unknown Platform",
    color: "#6B7280",
    icon: "🔗",
  };

  const handleConnect = () => {
    handleClose();
    // Redirect to connections page with organization context
    if (organizationId) {
      router.push(`/connections?organization_id=${organizationId}`);
    } else {
      router.push("/connections");
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return "No content available";
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
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
          <FaExclamationTriangle className="text-orange-500" size={20} />
          <Typography variant="h6" component="div">
            Platform Connection Required
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need to connect your {platformConfig.name} account before
          scheduling posts to this platform.
        </Alert>

        {/* Post Preview */}
        {postContent && (
          <Box mb={3} p={2} bgcolor="gray.50" borderRadius="8px">
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Post you're trying to schedule:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                maxHeight: "100px",
                overflow: "auto",
                wordBreak: "break-word",
              }}
            >
              {truncateContent(postContent)}
            </Typography>
          </Box>
        )}

        {/* Platform Info */}
        <Box
          p={3}
          bgcolor="white"
          borderRadius="8px"
          border="1px solid #e5e7eb"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                backgroundColor: platformConfig.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              {platformConfig.icon}
            </Box>
            <Box>
              <Typography variant="h6" color="text.primary">
                {platformConfig.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect your {platformConfig.name} account to schedule posts
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Once connected, you'll be able to:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Schedule posts to {platformConfig.name}
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Publish posts immediately
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Manage your social media presence
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Click "Connect Platform" to go to the connections page where you can
            securely connect your {platformConfig.name} account.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          sx={{ mr: 1 }}
          startIcon={<FaTimes size={14} />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConnect}
          variant="contained"
          startIcon={<FaLink size={14} />}
          sx={{
            backgroundColor: platformConfig.color,
            "&:hover": {
              backgroundColor: platformConfig.color,
              opacity: 0.9,
            },
          }}
        >
          Connect Platform
        </Button>
      </DialogActions>
    </Dialog>
  );
}
