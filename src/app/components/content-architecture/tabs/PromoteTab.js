"use client";

import { motion } from "framer-motion";
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Send,
  CheckCircle,
  Info,
} from "lucide-react";

const PLATFORMS = [
  { name: "X (Twitter)", icon: Twitter, color: "#1DA1F2" },
  { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { name: "Reddit", icon: Facebook, color: "#FF4500" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "TikTok", icon: Instagram, color: "#000000" },
  { name: "Instagram", icon: Instagram, color: "#E4405F" },
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
];

const FEATURES = [
  {
    title: "Brand-Aligned Content",
    description:
      "Uses company information about customers, target markets, product benefits, and the article being promoted, including brand voice, to create authentic and useful content promotion",
  },
  {
    title: "Platform-Optimized Copy",
    description:
      "Tailored messaging for each platform's audience and character limits",
  },
  {
    title: "Engaging Visual Content",
    description:
      "AI-generated images designed to capture attention and drive engagement",
  },
  {
    title: "Call-to-Action",
    description: "Clear CTAs that drive traffic back to your content",
  },
];

export default function PromoteTab({ selectedNode }) {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Promote on Social Media
        </h2>
        <p className="text-gray-600 leading-relaxed">
          All of the content's information will be sent to the social media post
          agent to craft a custom post tailored to the specific channel,
          including an engaging image.
        </p>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supported Platforms */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Supported Platforms
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {platform.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* What Agent Will Create */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What the Agent Will Create
          </h3>
          <div className="space-y-4">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {feature.title}
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
                    {feature.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-stretch gap-4"
      >
        <button className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl hover:from-sky-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg cursor-pointer">
          <Send className="h-5 w-5" />
          Send to Post Agent
        </button>

        <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 leading-relaxed">
              <strong className="font-semibold">Note:</strong> The agent will
              generate draft posts for your review. You can edit and approve
              each post before it's scheduled or published.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 p-6 bg-gradient-to-br from-sky-50 to-pink-50 border border-sky-200 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Example Post Preview (LinkedIn)
        </h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full"></div>
            <div>
              <div className="font-semibold text-gray-900">Your Company</div>
              <div className="text-sm text-gray-500">Just now</div>
            </div>
          </div>
          <div className="text-gray-800 leading-relaxed mb-4">
            🎯 Want to validate your product idea before investing months of
            development?
            <br />
            <br />
            Our latest guide covers proven market research methods that top
            companies use to identify real customer problems.
            <br />
            <br />
            ✅ Customer interview frameworks
            <br />
            ✅ Survey best practices
            <br />✅ Competitive analysis templates
            <br />
            <br />
            Read the full guide → [link]
          </div>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center text-gray-400">
            [AI-Generated Cover Image]
          </div>
        </div>
      </motion.div>
    </div>
  );
}
