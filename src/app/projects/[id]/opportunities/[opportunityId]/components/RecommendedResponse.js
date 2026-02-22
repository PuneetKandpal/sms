"use client";

import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  PencilIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

const generateRecommendedResponse = (opportunity) => {
  if (!opportunity) return "";

  const postInfo = opportunity?.post_info || {};
  const authorInfo = opportunity?.reddit_data?.author_info || {};
  const assessment = opportunity?.assessment || {};
  const score = assessment.overall_score ?? 0;

  const username = authorInfo.username || "there";
  const postTitle = postInfo.post_title || "your post";

  if (score >= 80) {
    return `Hi @${username}! 👋 ...`;
  } else if (score >= 60) {
    return `@${username} Thanks for sharing your experience!...`;
  } else {
    return `@${username} Appreciate you sharing your perspective...`;
  }
};

export default function RecommendedResponse({ opportunity }) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editedResponse, setEditedResponse] = useState(
    generateRecommendedResponse(opportunity)
  );
  const [loading, setLoading] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  const assessment = opportunity?.assessment || {};
  const score = assessment.overall_score ?? 0;
  const username = opportunity?.reddit_data?.author_info?.username || "there";

  const handleCopy = () => {
    navigator.clipboard.writeText(editedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score) =>
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
      ? "bg-amber-400"
      : "bg-rose-500";

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Replace with your API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMetadataLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Fetch Button on top middle */}
      {!metadataLoaded && (
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <button
            onClick={fetchUserData}
            disabled={loading}
            className="px-6 py-2 bg-sky-500 text-white rounded-lg shadow-lg hover:bg-sky-600 transition"
          >
            {loading ? "Fetching Data..." : "Fetch User Data"}
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 rounded-2xl p-6 mb-6 shadow-sm backdrop-blur-sm relative"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sky-200 rounded-xl">
            <SparklesIcon className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-sky-900">
              AI-Generated Response
            </h2>
            <p className="text-sm text-sky-700">
              Tailored outreach crafted by AI, based on opportunity insights
            </p>
          </div>
        </div>

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative bg-white/80 rounded-xl border-l-4 border-sky-500 shadow-sm p-4 mb-4 flex flex-wrap justify-between items-center gap-3`}
        >
          {/* Blur overlay */}
          {!metadataLoaded && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-xl z-20"></div>
          )}

          <div className="flex gap-2 flex-wrap items-center z-10 relative">
            <span
              className={`px-3 py-1 text-white text-sm font-semibold rounded ${getScoreColor(
                score
              )}`}
            >
              Score: {Math.round(score)}/100
            </span>
            <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded">
              {assessment?.customer_journey_stage || "Consider"} Stage
            </span>
          </div>
          <p className="text-slate-700 text-sm z-10 relative">
            Optimized for <strong>@{username}</strong>
          </p>
        </motion.div>

        {/* Response Message */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-white/80 rounded-xl border-l-4 border-emerald-500 shadow-sm p-5"
        >
          {!metadataLoaded && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-xl z-20"></div>
          )}

          <h3 className="text-lg font-semibold text-emerald-700 mb-2 flex items-center gap-2 z-10 relative">
            <PaperAirplaneIcon className="w-5 h-5 text-emerald-600" />
            Suggested Message
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-emerald-50 p-3 rounded border border-emerald-200 shadow-inner z-10 relative">
            {editedResponse}
          </p>
        </motion.div>

        {/* Action Buttons */}
        {metadataLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-end mt-6"
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:shadow-md hover:bg-blue-600 transition-all"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow-sm hover:shadow-md hover:bg-gray-700 transition-all"
            >
              <PencilIcon className="w-5 h-5" />
              Edit
            </button>

            <button
              onClick={() =>
                alert("Send Response clicked! Implement your API call here.")
              }
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-sm hover:shadow-md hover:bg-emerald-600 transition-all"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Send
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
