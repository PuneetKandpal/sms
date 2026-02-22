"use client";
import React from "react";
import { formatLocalDateLong } from "../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaProjectDiagram,
  FaCalendar,
  FaUsers,
  FaUser,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

export default function ProjectDetailsModal({ isOpen, onClose, project }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <FaCheckCircle className="text-green-500" size={16} />;
      case "inactive":
        return <FaExclamationCircle className="text-red-500" size={16} />;
      default:
        return <FaExclamationCircle className="text-yellow-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (!isOpen || !project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FaProjectDiagram className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Project Details
                  </h2>
                  <p className="text-sm text-gray-600">{project.name}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FaTimes size={20} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Information
              </h3>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  project.status
                )}`}
              >
                {getStatusIcon(project.status)}
                {project.status?.charAt(0).toUpperCase() +
                  project.status?.slice(1)}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaProjectDiagram className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Project Name
                  </span>
                </div>
                <p className="text-gray-900 font-medium text-lg">
                  {project.name}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaUsers className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Team Members
                  </span>
                </div>
                <p className="text-gray-900 font-medium text-lg">
                  {project.member_count || 0} members
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaCalendar className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Created
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {formatLocalDateLong(project.created_at)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaCalendar className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Last Updated
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {formatLocalDateLong(project.updated_at)}
                </p>
              </div>

              {project.created_by_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUser className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Created By
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {project.created_by_name}
                  </p>
                </div>
              )}

              {project.company_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaProjectDiagram className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Company
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {project.company_name}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {project.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Description
                  </span>
                </div>
                <p className="text-gray-900">{project.description}</p>
              </div>
            )}

            {/* Category */}
            {project.category && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Category
                  </span>
                </div>
                <p className="text-gray-900 font-medium">{project.category}</p>
              </div>
            )}

            {/* Technical Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                Technical Details
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {project.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {project.company}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
