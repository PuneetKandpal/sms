"use client";

import React from "react";
import { Box, Paper, Typography, Card, CardContent, Chip } from "@mui/material";
import { ShoppingBag } from "@mui/icons-material";

export default function ProductRecommendations({ opportunity }) {
  const productRecommendations = opportunity?.product_recommendations || [];

  const getMatchColor = (percentage) => {
    if (percentage >= 85) return "#10B981";
    if (percentage >= 70) return "#F59E0B";
    return "#EF4444";
  };

  const getMatchLabel = (percentage) => {
    if (percentage >= 85) return "Excellent Match";
    if (percentage >= 70) return "Good Match";
    return "Fair Match";
  };

  const getTagColor = (tag) => {
    const tagColors = {
      "high-priority": "#EF4444",
      "immediate-need": "#EF4444",
      "decision-maker": "#8B5CF6",
      "property-management": "#3B82F6",
      automation: "#10B981",
      "financial-management": "#F59E0B",
      efficiency: "#10B981",
      "operational-efficiency": "#059669",
      maintenance: "#F59E0B",
      "cost-management": "#EA580C",
    };
    return tagColors[tag] || "#6B7280";
  };

  // Default recommendations if none provided
  const defaultRecommendations = [
    {
      product_service_name: "Property Management Platform",
      match_percentage: 90,
      overview:
        "Comprehensive property management solution for short-term rentals with automated guest communication and calendar management.",
      tags: ["automation", "property-management", "efficiency"],
    },
    {
      product_service_name: "Guest Communication Suite",
      match_percentage: 85,
      overview:
        "Automated guest messaging and communication tools to handle inquiries and provide 24/7 support.",
      tags: ["communication", "automation", "immediate-need"],
    },
  ];

  const recommendations =
    productRecommendations.length > 0
      ? productRecommendations
      : defaultRecommendations;

  return (
    <Paper
      elevation={1}
      sx={{
        height: "100%",
        borderRadius: 3,
        background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
        border: "1px solid #BFDBFE",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ShoppingBag sx={{ color: "#2563EB", fontSize: "1.5rem" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#1E40AF", fontSize: "1.5rem" }}
          >
            Product & Service Recommendations
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontSize: "1rem",
            color: "#2563EB",
            mb: 3,
            fontStyle: "italic",
          }}
        >
          Tailored solutions based on opportunity analysis
        </Typography>

        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1 }}
        >
          {recommendations.map((product, index) => (
            <Card
              key={index}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderLeft: "4px solid #2563EB",
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
                      color: "#1E40AF",
                      fontSize: "1.2rem",
                      flex: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    {product.product_service_name}
                  </Typography>

                  <Chip
                    label={`${product.match_percentage}% Match`}
                    size="medium"
                    sx={{
                      backgroundColor: getMatchColor(product.match_percentage),
                      color: "white",
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
                  {product.overview}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.9rem",
                    color: "#6B7280",
                    fontStyle: "italic",
                    mb: 2,
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    p: 1.5,
                    borderRadius: 1,
                    border: "1px solid rgba(37, 99, 235, 0.2)",
                  }}
                >
                  <strong>Match Quality:</strong>{" "}
                  {getMatchLabel(product.match_percentage)} - This solution
                  aligns well with the identified opportunity requirements.
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                  {product.tags?.map((tag, tagIndex) => (
                    <Chip
                      key={tagIndex}
                      label={tag.replace(/-/g, " ")}
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
      </CardContent>
    </Paper>
  );
}
