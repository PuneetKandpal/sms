"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import { Lightbulb } from "@mui/icons-material";

export default function NewProductOpportunities({
  opportunity,
  onFetchStrategy,
  isLoading,
  productData,
}) {
  const [hasContent, setHasContent] = useState(false);

  // Check if we have existing engagement strategy data
  const existingEngagementStrategy = opportunity?.raw_data?.engagement_strategy;
  const existingProductOpportunities =
    existingEngagementStrategy?.new_product_services_opportunities;

  // Set initial state based on existing data
  useEffect(() => {
    if (
      existingProductOpportunities &&
      existingProductOpportunities.length > 0
    ) {
      setHasContent(true);
    } else if (productData && productData.length > 0) {
      setHasContent(true);
    }
  }, [existingProductOpportunities, productData]);

  const handleFetchData = async () => {
    if (onFetchStrategy) {
      const result = await onFetchStrategy();
      if (result) {
        setHasContent(true);
      }
    }
  };

  const dummyOpportunities = [
    {
      name: "Private Equity Connection Platform",
      desc: "An online platform dedicated to connecting business owners with private equity firms. This service would facilitate trust-building through verified profiles and event opportunities, solving the challenge of finding credible partners.",
      evidence:
        "The user is looking to expand their Rolodex and connect business owners with private equity firms, indicating a market need for a structured networking solution.",
      tags: "networking, private equity, platform",
      stage: "high",
    },
    {
      name: "Networking Events Sponsorship Package",
      desc: "A service package that offers sponsorship opportunities at industry-specific networking events, allowing businesses to showcase their services directly to potential clients and partners.",
      evidence:
        "User is considering networking avenues to connect with private equity firms, suggesting a need for direct engagement opportunities.",
      tags: "sponsorship, networking, events",
      stage: "medium",
    },
  ];

  // Use existing data or fallback to productData or dummy data
  const opportunities =
    existingProductOpportunities || productData || dummyOpportunities;

  const getPriorityConfig = (stage) => {
    switch (stage) {
      case "high":
        return {
          color: "#FEE2E2",
          textColor: "#DC2626",
          label: "High Priority",
        };
      case "medium":
        return {
          color: "#FEF3C7",
          textColor: "#D97706",
          label: "Medium Priority",
        };
      case "low":
        return {
          color: "#ECFDF5",
          textColor: "#059669",
          label: "Low Priority",
        };
      default:
        return { color: "#F3F4F6", textColor: "#6B7280", label: "Normal" };
    }
  };

  const getTagColor = (tag) => {
    const tagColors = {
      networking: "#3B82F6",
      "private equity": "#8B5CF6",
      platform: "#10B981",
      sponsorship: "#F59E0B",
      events: "#EF4444",
    };
    return tagColors[tag] || "#6B7280";
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: "100%",
        borderRadius: 3,
        background: "linear-gradient(135deg, #FEF7CD 0%, #FDE68A 100%)",
        border: "1px solid #F59E0B",
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
          <Lightbulb sx={{ color: "#D97706", fontSize: "1.5rem" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#92400E", fontSize: "1.5rem" }}
          >
            New Product Opportunities
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontSize: "1rem",
            color: "#D97706",
            mb: 3,
            fontStyle: "italic",
          }}
        >
          Potential new products and services based on market gaps
        </Typography>

        {!hasContent && !existingProductOpportunities ? (
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {dummyOpportunities.map((opportunity, index) => (
                  <Card
                    key={index}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderLeft: "4px solid #F59E0B",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "#92400E",
                            fontSize: "1.2rem",
                            flex: 1,
                            lineHeight: 1.3,
                          }}
                        >
                          {opportunity.name}
                        </Typography>

                        <Chip
                          label={getPriorityConfig(opportunity.stage).label}
                          size="medium"
                          sx={{
                            backgroundColor: getPriorityConfig(
                              opportunity.stage
                            ).color,
                            color: getPriorityConfig(opportunity.stage)
                              .textColor,
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            height: 32,
                            ml: 1,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "1rem",
                          lineHeight: 1.6,
                          color: "#374151",
                          mb: 2,
                        }}
                      >
                        {opportunity.desc}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.9rem",
                          color: "#6B7280",
                          fontStyle: "italic",
                          mb: 2,
                          backgroundColor: "rgba(245, 158, 11, 0.1)",
                          p: 1.5,
                          borderRadius: 1,
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                        }}
                      >
                        <strong>Evidence:</strong> {opportunity.evidence}
                      </Typography>

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {opportunity.tags.split(", ").map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            sx={{
                              backgroundColor: getTagColor(tag),
                              color: "white",
                              fontSize: "0.85rem",
                              fontWeight: 500,
                              height: 28,
                              "& .MuiChip-label": {
                                px: 1.5,
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* Fetch Button - Centered */}
            <Button
              variant="contained"
              onClick={handleFetchData}
              disabled={isLoading}
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <Lightbulb />
              }
              sx={{
                backgroundColor: "#D97706",
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
                  backgroundColor: "#B45309",
                },
                "&:disabled": {
                  backgroundColor: "#D97706",
                  color: "white",
                },
              }}
            >
              {isLoading ? "Generating..." : "Get Product Opportunities"}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {opportunities.map((opportunity, index) => (
              <Card
                key={index}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderLeft: "4px solid #F59E0B",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "#92400E",
                        fontSize: "1.2rem",
                        flex: 1,
                        lineHeight: 1.3,
                      }}
                    >
                      {opportunity.name}
                    </Typography>

                    <Chip
                      label={getPriorityConfig(opportunity.stage).label}
                      size="medium"
                      sx={{
                        backgroundColor: getPriorityConfig(opportunity.stage)
                          .color,
                        color: getPriorityConfig(opportunity.stage).textColor,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        height: 32,
                        ml: 1,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "1rem",
                      lineHeight: 1.6,
                      color: "#374151",
                      mb: 2,
                    }}
                  >
                    {opportunity.desc}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.9rem",
                      color: "#6B7280",
                      fontStyle: "italic",
                      mb: 2,
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                    }}
                  >
                    <strong>Evidence:</strong> {opportunity.evidence}
                  </Typography>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    {opportunity.tags.split(", ").map((tag, tagIndex) => (
                      <Chip
                        key={tagIndex}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: getTagColor(tag),
                          color: "white",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          height: 28,
                          "& .MuiChip-label": {
                            px: 1.5,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </CardContent>
    </Paper>
  );
}
