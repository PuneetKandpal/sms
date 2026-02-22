"use client";

import React from "react";
import { Box, Paper, Typography, CardContent } from "@mui/material";

// Generate action recommendations based on opportunity data
const generateRecommendations = (opportunity) => {
  const assessment = opportunity?.assessment || {};
  const score = assessment.overall_score || 0;
  const stage = assessment.customer_journey_stage || "Consider";
  const aiInsights = opportunity?.ai_filtering?.ai_key_insights || "";

  const baseRecommendations = [
    "Monitor engagement patterns and respond to similar posts",
    "Build relationship through valuable content and insights",
    "Track competitor responses and differentiate your approach",
    "Follow up with personalized content relevant to their needs",
  ];

  if (score >= 80) {
    return [
      "Immediate outreach recommended - high intent with clear pain points",
      "Schedule discovery call within 24-48 hours while opportunity is hot",
      "Prepare technical demo showcasing relevant solutions",
      "Connect with decision-makers and technical stakeholders",
      "Provide case studies of similar implementations in their industry",
      "Follow up with personalized proposal within one week",
    ];
  } else if (score >= 60) {
    return [
      "Engage with educational content and build credibility first",
      "Share relevant insights and establish thought leadership",
      "Monitor for additional engagement opportunities",
      "Nurture relationship with valuable industry content",
      "Connect on social platforms for ongoing engagement",
      ...baseRecommendations,
    ];
  } else {
    return [
      "Add to nurture sequence for long-term relationship building",
      "Monitor for changes in buying signals",
      "Engage with low-pressure educational content",
      ...baseRecommendations,
    ];
  }
};

export default function ActionRecommendations({ opportunity }) {
  const recommendations = generateRecommendations(opportunity);

  return (
    <Paper
      elevation={1}
      sx={{
        background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
        color: "white",
        height: "fit-content",
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "white",
            borderBottom: "2px solid rgba(255,255,255,0.3)",
            pb: 1,
            mb: 2,
            fontSize: "1.5rem",
          }}
        >
          🚀 Action Recommendations
        </Typography>

        <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {recommendations.map((recommendation, index) => (
            <Box
              component="li"
              key={index}
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                mb: 1.5,
                p: 2,
                borderRadius: 2,
                fontSize: "1rem",
                lineHeight: 1.6,
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              <Typography
                component="span"
                sx={{ fontWeight: "bold", fontSize: "1.2rem" }}
              >
                →
              </Typography>
              <Typography component="span" sx={{ fontSize: "1rem" }}>
                {recommendation}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Paper>
  );
}
