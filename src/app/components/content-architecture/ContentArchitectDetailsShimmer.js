"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Link2,
  Sparkles,
  Share2,
  BarChart3,
  FolderTree,
  ChevronLeft,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "seo", label: "SEO", icon: Search },
  { id: "links", label: "Links", icon: Link2 },
  { id: "content", label: "Content", icon: Sparkles },
  { id: "promote", label: "Promote", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function ContentArchitectDetailsShimmer() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <motion.header
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400 rounded-lg">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-gray-400">Back to Architects</span>
            </div>
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree Sidebar */}
        <div className="w-[350px] bg-white border-r border-gray-200 overflow-hidden flex flex-col relative">
          {/* Resize handle */}
          <div className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center z-10">
            <div className="h-5 w-1 bg-gray-200 rounded"></div>
          </div>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Pages
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 px-2 py-1 rounded">
                  Expand All
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-600 px-2 py-1 rounded">
                  Collapse
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search pages..."
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          {/* Tree Items */}
          <div className="flex-1 overflow-hidden p-3 space-y-2">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="flex items-center gap-2 px-3 py-2"
                style={{ paddingLeft: `${(i % 3) * 1 + 0.75}rem` }}
              >
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div
                  className="h-4 bg-gray-200 rounded flex-1"
                  style={{ width: `${80 - (i % 3) * 10}%` }}
                ></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-hidden bg-white flex flex-col">
          {/* Page Title & Tabs Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            {/* Page Title */}
            <div className="px-6 pt-4 pb-2">
              <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-gray-200">
              {TABS.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    disabled
                    className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                      index === 0
                        ? "text-purple-600 bg-white"
                        : "text-gray-600 bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}

                    {/* Active Indicator */}
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="max-w-6xl mx-auto">
              {/* Shimmer for Overview Tab */}
              <div className="space-y-6">
                {/* Status Bar Shimmer */}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-32 bg-blue-200 rounded"></div>
                    <div className="h-6 w-24 bg-blue-200 rounded"></div>
                  </div>
                  <div className="h-10 w-28 bg-blue-200 rounded-lg"></div>
                </motion.div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      >
                        <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                      </motion.div>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <div className="h-12 w-36 bg-purple-200 rounded-lg"></div>
                      <div className="h-12 w-36 bg-green-200 rounded-lg"></div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.5 + i * 0.1,
                        }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-5 w-32 bg-blue-200 rounded"></div>
                          <div className="h-5 w-16 bg-blue-200 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-blue-200 rounded"></div>
                          <div className="h-3 w-5/6 bg-blue-200 rounded"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
