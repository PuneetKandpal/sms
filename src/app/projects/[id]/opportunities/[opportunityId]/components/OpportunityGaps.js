"use client";

import React from "react";
import { motion } from "framer-motion";

// Generate opportunity gaps
const generateOpportunityGaps = (opportunity) => {
  const postContent = opportunity?.post_info?.post_content || "";
  const baseGaps = [
    {
      title: "Automated Guest Communication System",
      priority: "high",
      description:
        "Customers need 24/7 automated responses to handle guest inquiries without manual intervention.",
      evidence:
        "Mentioned in 73% of property management discussions about workload reduction",
      tags: ["Communication", "Automation", "24/7 Support"],
    },
    {
      title: "Dynamic Pricing Intelligence",
      priority: "high",
      description:
        "AI-powered pricing that automatically adjusts rates based on market conditions, events, and demand patterns.",
      evidence:
        "Property managers spend 2-3 hours daily on pricing adjustments",
      tags: ["Pricing", "AI", "Revenue Optimization"],
    },
    {
      title: "Review Management & Recovery System",
      priority: "medium",
      description:
        "Proactive review monitoring with automated response templates and guest issue resolution workflows.",
      evidence:
        "Poor reviews impact 85% of booking decisions and long-term profitability",
      tags: ["Reviews", "Reputation", "Guest Experience"],
    },
  ];

  const additionalGaps = [];

  if (/calendar|booking/i.test(postContent)) {
    additionalGaps.push({
      title: "Multi-Platform Calendar Synchronization",
      priority: "high",
      description:
        "Real-time calendar sync across all booking platforms to prevent double bookings and maintain accuracy.",
      evidence:
        "Calendar management errors cause 40% of host stress and booking conflicts",
      tags: ["Calendar", "Integration", "Multi-Platform"],
    });
  }

  if (/clean|turnover/i.test(postContent)) {
    additionalGaps.push({
      title: "Automated Cleaning & Turnover Coordination",
      priority: "medium",
      description:
        "Integrated cleaning scheduling with automatic vendor notifications and quality control checklists.",
      evidence:
        "Turnover coordination takes 30% of property managers' daily time",
      tags: ["Cleaning", "Coordination", "Quality Control"],
    });
  }

  if (/budget|cost/i.test(postContent)) {
    additionalGaps.push({
      title: "Cost Analytics & Budget Optimization",
      priority: "medium",
      description:
        "Real-time cost tracking with predictive analytics for expense optimization and profit maximization.",
      evidence:
        "Most hosts lack visibility into true profitability per property",
      tags: ["Analytics", "Cost Management", "Profitability"],
    });
  }

  return [...baseGaps, ...additionalGaps];
};

// Priority config
const getPriorityConfig = (priority) => {
  const map = {
    high: {
      bg: "bg-red-50",
      text: "text-red-700",
      label: "High",
      border: "border-red-500",
    },
    medium: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      label: "Medium",
      border: "border-orange-500",
    },
    low: {
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Low",
      border: "border-green-500",
    },
  };
  return (
    map[priority] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      label: "Normal",
      border: "border-gray-400",
    }
  );
};

// Tag colors
const getTagColor = (tag) => {
  const tagColors = {
    Communication: "bg-blue-500",
    Automation: "bg-green-600",
    "24/7 Support": "bg-purple-600",
    Pricing: "bg-orange-500",
    AI: "bg-green-500",
    "Revenue Optimization": "bg-yellow-500",
    Reviews: "bg-red-500",
    Reputation: "bg-red-500",
    "Guest Experience": "bg-teal-600",
    Calendar: "bg-blue-500",
    Integration: "bg-purple-600",
    "Multi-Platform": "bg-blue-700",
    Cleaning: "bg-green-600",
    Coordination: "bg-orange-500",
    "Quality Control": "bg-yellow-600",
    Analytics: "bg-purple-700",
    "Cost Management": "bg-orange-700",
    Profitability: "bg-green-600",
  };
  return tagColors[tag] || "bg-gray-400";
};

export default function OpportunityGaps({ opportunity }) {
  const opportunityGaps = generateOpportunityGaps(opportunity);

  return (
    <div className="mx-auto w-full bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        💡 New Product and Service Opportunities
      </h2>

      <div className="flex flex-col gap-6">
        {opportunityGaps.map((gap, index) => {
          const priority = getPriorityConfig(gap.priority);

          return (
            <motion.div
              key={index}
              whileHover={{ y: -3, boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }}
              className={`bg-gray-50 border-l-4 ${priority.border} rounded-lg p-4 flex flex-col transition-shadow duration-200`}
            >
              {/* Title & Priority */}
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-lg font-semibold ${priority.text}`}>
                  {gap.title}
                </h3>
                <span
                  className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${priority.bg} ${priority.text}`}
                >
                  {priority.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-2">{gap.description}</p>

              {/* Evidence */}
              <p className="text-gray-600 italic text-xs mb-2 p-2 rounded bg-gray-100 border border-gray-200">
                <strong>Evidence:</strong> {gap.evidence}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {gap.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className={`text-white text-xs font-medium px-3 py-1 rounded-full ${getTagColor(
                      tag
                    )}`}
                  >
                    {tag.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
