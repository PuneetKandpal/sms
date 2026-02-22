"use client";

import { Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import {
  FolderTree,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { formatLocalDateTime, formatTimeAgo } from "../../../utils/dateUtils";

export default function ArchitectDetailView({
  architect,
  handleDelete,
  projectId,
  architectId,
}) {
  const router = useRouter();
  const handleSelectArchitect = () => {
    // Navigate to the details page
    router.push(
      `/projects/${projectId}/content-architecture-details/${architectId}`
    );
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";

    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {architect.name}
          </h3>
          <div className="flex items-center gap-2">
            {architect.taskStatus?.overall_status === "completed" ? (
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : architect.taskStatus?.overall_status === "processing" ? (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Processing ({architect.progress}%)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Failed</span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              {formatTimeAgo(architect.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center hover:cursor-pointer hover:rotate-12 transition-all duration-100 hover:shadow-md hover:scale-105 shadow-sm ${
              architect.taskStatus?.overall_status === "completed"
                ? "bg-gradient-to-br from-green-400 to-emerald-500"
                : architect.taskStatus?.overall_status === "processing"
                ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                : "bg-gradient-to-br from-red-400 to-rose-500"
            }`}
            onClick={handleSelectArchitect}
          >
            <Tooltip title="View Architect Details">
              <FolderTree className="h-7 w-7 text-white" />
            </Tooltip>
          </div>
        </div>
      </div>

      {architect.taskStatus?.overall_status === "processing" && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${architect.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Step {architect.completedSteps} of {architect.totalSteps}
            </span>
            <span>{architect.progress}% Complete</span>
          </div>
        </div>
      )}

      <div className="space-y-3 text-sm text-gray-600 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Task ID</p>
            <p className="font-medium truncate" title={architect.taskId}>
              {architect.taskId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="font-medium">
              {formatLocalDateTime(architect.createdAt)}
            </p>
          </div>
        </div>

        {architect.taskStatus?.overall_status === "completed" ? (
          <div>
            <p className="text-xs text-gray-500">Completed At</p>
            <p className="font-medium">
              {formatLocalDateTime(architect.completedAt) || "Unknown"}
            </p>
          </div>
        ) : architect.currentStep ? (
          <div>
            <p className="text-xs text-gray-500">Current Step</p>
            <p className="font-medium">
              {architect.currentStep
                .replace(/step_\d+_\d+_/, "")
                .replace(/_/g, " ")}
            </p>
          </div>
        ) : null}

        {architect.taskStatus?.overall_status === "failed" &&
          architect.error && (
            <div>
              <p className="text-xs text-gray-500">Error</p>
              <p className="text-red-600 font-medium" title={architect.error}>
                {architect.error}
              </p>
            </div>
          )}
      </div>

      {architect.companyDoc && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Industries
            </h4>
            <p className="text-sm text-gray-600">
              {architect.companyDoc.industries?.overview}
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-500">
              {architect.companyDoc.industries?.list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Buyer Personas
            </h4>
            <p className="text-sm text-gray-600">
              {architect.companyDoc.buyer_personas?.overview}
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-500">
              {architect.companyDoc.buyer_personas?.list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Products and Services
            </h4>
            {Object.entries(architect.companyDoc.products_and_services).map(
              ([product, { keywords }], index) => (
                <div key={index} className="mb-2">
                  <p className="font-semibold text-sm">{product}</p>
                  <p className="text-xs text-gray-500">
                    Keywords: {keywords.join(", ")}
                  </p>
                </div>
              )
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Target Markets
            </h4>
            <p className="text-sm text-gray-600">
              {architect.companyDoc.target_markets?.overview}
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-500">
              {architect.companyDoc.target_markets?.list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Differentiators
            </h4>
            <p className="text-sm text-gray-600">
              {architect.companyDoc.differentiators?.overview}
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-500">
              {architect.companyDoc.differentiators?.list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              GEO LEO Strategy
            </h4>
            <p className="text-sm text-gray-600">
              {architect.companyDoc.geo_leo_strategy?.overview}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          Delete Architect
        </motion.button>
      </div>
    </motion.div>
  );
}
