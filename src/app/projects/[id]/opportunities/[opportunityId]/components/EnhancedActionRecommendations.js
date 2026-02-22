"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  CardContent,
  Button,
  CircularProgress,
} from "@mui/material";
import { RocketLaunch } from "@mui/icons-material";

export default function EnhancedActionRecommendations({
  opportunity,
  onFetchStrategy,
  isLoading,
  actionData,
}) {
  const [hasContent, setHasContent] = useState(false);

  // Check if we have existing engagement strategy data
  const existingEngagementStrategy = opportunity?.raw_data?.engagement_strategy;
  const existingActionRecommendations =
    existingEngagementStrategy?.action_recommendation;

  // Set initial state based on existing data
  useEffect(() => {
    if (
      existingActionRecommendations &&
      existingActionRecommendations.length > 0
    ) {
      setHasContent(true);
    } else if (actionData && actionData.length > 0) {
      setHasContent(true);
    }
  }, [existingActionRecommendations, actionData]);

  const handleFetchData = async () => {
    if (onFetchStrategy) {
      const result = await onFetchStrategy();
      if (result) {
        setHasContent(true);
      }
    }
  };

  const dummyRecommendations = [
    "Monitor the thread for 48 hours; if the user engages positively, send a DM offering a free consultation to discuss their networking needs.",
    "Sales team should prepare a follow-up strategy for this user, focusing on how our services can facilitate their connection with private equity firms.",
    "Create a blog post addressing the challenges of connecting business owners with private equity, and share it in relevant subreddits to establish thought leadership.",
    "Explore potential partnerships with networking event organizers to provide resources or sponsorships that highlight our financing solutions.",
  ];

  // Use existing data or fallback to actionData or dummy data
  const recommendations =
    existingActionRecommendations || actionData || dummyRecommendations;

  return (
    <Paper
      elevation={1}
      sx={{
        height: "100%",
        borderRadius: 3,
        background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
        border: "1px solid #A7F3D0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: 3,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <RocketLaunch sx={{ color: "#059669", fontSize: "1.5rem" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#047857", fontSize: "1.5rem" }}
          >
            Action Recommendations
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontSize: "1rem",
            color: "#059669",
            mb: 3,
            fontStyle: "italic",
          }}
        >
          Strategic next steps based on opportunity analysis
        </Typography>

        {!hasContent && !existingActionRecommendations ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            {/* Blurred Dummy Content */}
            <Box
              sx={{
                filter: "blur(3px)",
                userSelect: "none",
                pointerEvents: "none",
                mb: 4,
                width: "100%",
              }}
            >
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {dummyRecommendations.map((recommendation, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      mb: 2,
                      p: 2.5,
                      borderRadius: 2,
                      fontSize: "1rem",
                      lineHeight: 1.6,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      border: "1px solid rgba(5, 150, 105, 0.2)",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        color: "#059669",
                      }}
                    >
                      →
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: "1rem", color: "#374151" }}
                    >
                      {recommendation}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Fetch Button - Centered */}
            <Button
              variant="contained"
              onClick={handleFetchData}
              disabled={isLoading}
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <RocketLaunch />
              }
              sx={{
                backgroundColor: "#059669",
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                "&:hover": {
                  backgroundColor: "#047857",
                },
                "&:disabled": {
                  backgroundColor: "#059669",
                  color: "white",
                },
              }}
            >
              {isLoading ? "Generating..." : "Get Actions"}
            </Button>
          </Box>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {recommendations.map((recommendation, index) => (
              <Box
                component="li"
                key={index}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  mb: 2,
                  p: 2.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  border: "1px solid rgba(5, 150, 105, 0.2)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.1)",
                  },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    color: "#059669",
                  }}
                >
                  →
                </Typography>
                <Typography
                  component="span"
                  sx={{ fontSize: "1rem", color: "#374151" }}
                >
                  {recommendation}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Paper>
  );
}
