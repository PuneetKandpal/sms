"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Link2,
  Sparkles,
  Share2,
  BarChart3,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "seo", label: "SEO", icon: Search },
  { id: "links", label: "Links", icon: Link2 },
  { id: "content", label: "Content", icon: Sparkles },
  { id: "promote", label: "Promote", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function DetailPanelShimmer() {
  return (
    <div className="h-full flex flex-col bg-white animate-pulse">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        {/* Page Title Shimmer */}
        <div className="px-6 pt-4 pb-2">
          <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>

        {/* Tabs Shimmer */}
        <div className="flex border-t border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-400"
              >
                <Icon className="h-4 w-4" />
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Shimmer */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Status Bar Shimmer */}
          <div className="h-16 bg-gray-100 rounded-lg mb-6"></div>

          {/* Two Column Shimmer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                  <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <div className="h-12 w-32 bg-gray-200 rounded-lg"></div>
                <div className="h-12 w-40 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
