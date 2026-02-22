"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaUnlink,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  getConnectedAccountDetails,
  disconnectAccount,
} from "../api/socialMediaService";

export default function AccountDetailsModal({
  open,
  handleClose,
  accountId,
  userId,
  onDisconnect,
}) {
  const [accountDetails, setAccountDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && accountId && userId) {
      loadAccountDetails();
    }
  }, [open, accountId, userId]);

  const loadAccountDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getConnectedAccountDetails(accountId, userId);
      if (response.success) {
        setAccountDetails(response.account);
      } else {
        throw new Error(response.message || "Failed to load account details");
      }
    } catch (error) {
      console.error("Error loading account details:", error);
      setError("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect this account?")) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await disconnectAccount(accountId, userId);
      if (response.success) {
        toast.success("Account disconnected successfully");
        onDisconnect?.(accountId);
        handleClose();
      } else {
        throw new Error(response.message || "Failed to disconnect account");
      }
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error("Failed to disconnect account");
    } finally {
      setDisconnecting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlatformColor = (platform) => {
    const colors = {
      facebook: "#1877F2",
      instagram: "#E4405F",
      twitter: "#1DA1F2",
      linkedin: "#0A66C2",
      tiktok: "#000000",
      youtube: "#FF0000",
    };
    return colors[platform?.toLowerCase()] || "#6B7280";
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
          <FaUser className="text-blue-600" size={20} />
          <Typography variant="h6" component="div">
            Account Details
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {accountDetails && (
          <Box>
            {/* Profile Header */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar
                src={accountDetails.profilePicture}
                alt={accountDetails.displayName}
                sx={{ width: 64, height: 64 }}
              >
                {accountDetails.displayName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {accountDetails.displayName || accountDetails.username}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={accountDetails.platform}
                    size="small"
                    sx={{
                      backgroundColor: getPlatformColor(
                        accountDetails.platform
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                  />
                  <Chip
                    icon={
                      accountDetails.isActive ? (
                        <FaCheckCircle size={12} />
                      ) : (
                        <FaTimesCircle size={12} />
                      )
                    }
                    label={accountDetails.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={accountDetails.isActive ? "success" : "error"}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  @{accountDetails.username}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Account Information */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Account Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Account ID"
                    secondary={accountDetails._id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="GetLate Account ID"
                    secondary={accountDetails.getlate_account_id || "N/A"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Profile ID"
                    secondary={accountDetails.profileId || "N/A"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Connected"
                    secondary={formatDate(accountDetails.createdAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(accountDetails.updatedAt)}
                  />
                </ListItem>
                {accountDetails.tokenExpiresAt && (
                  <ListItem>
                    <ListItemText
                      primary="Token Expires"
                      secondary={formatDate(accountDetails.tokenExpiresAt)}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            {/* Permissions */}
            {accountDetails.permissions &&
              accountDetails.permissions.length > 0 && (
                <Box mb={3}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Permissions
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {accountDetails.permissions.map((permission, index) => (
                      <Chip
                        key={index}
                        label={permission.replace(/_/g, " ").toLowerCase()}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: "capitalize" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

            {/* Status Information */}
            <Box mb={2}>
              <Alert
                severity={accountDetails.isActive ? "success" : "warning"}
                icon={
                  accountDetails.isActive ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  )
                }
              >
                {accountDetails.isActive
                  ? "This account is active and ready to publish posts."
                  : "This account is inactive. Posts may not be published."}
              </Alert>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={disconnecting}>
          Close
        </Button>
        {accountDetails && (
          <Button
            onClick={handleDisconnect}
            variant="outlined"
            color="error"
            disabled={disconnecting}
            startIcon={
              disconnecting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FaUnlink size={14} />
              )
            }
            sx={{ ml: 1 }}
          >
            {disconnecting ? "Disconnecting..." : "Disconnect Account"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
