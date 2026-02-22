"use client";
import React from "react";
import { formatLocalDateLong } from "../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaCrown,
  FaUserShield,
  FaProjectDiagram,
  FaCheckCircle,
} from "react-icons/fa";

export default function UserProfileModal({ isOpen, onClose, member }) {
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

  const getRoleIcon = (permission) => {
    switch (permission?.toLowerCase()) {
      case "owner":
        return <FaCrown className="text-yellow-500" size={16} />;
      case "manager":
        return <FaUserShield className="text-blue-500" size={16} />;
      default:
        return <FaUser className="text-gray-500" size={16} />;
    }
  };

  const getRoleColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!isOpen || !member) return null;

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
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {member.user_name?.[0] || member.user_email?.[0] || "U"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    User Profile
                  </h2>
                  <p className="text-sm text-gray-600">
                    {member.user_name || member.user_email}
                  </p>
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
                Member Information
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(
                    member.permission
                  )}`}
                >
                  {getRoleIcon(member.permission || member.role)}
                  {(member.permission || member.role)?.charAt(0).toUpperCase() +
                    (member.permission || member.role)?.slice(1)}
                </div>
                {member.is_active && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <FaCheckCircle size={12} />
                    Active
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaUser className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Full Name
                  </span>
                </div>
                <p className="text-gray-900 font-medium text-lg">
                  {member.user_name || "Not provided"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaEnvelope className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Email Address
                  </span>
                </div>
                <p className="text-gray-900 font-medium">{member.user_email}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaCalendar className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Joined Project
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {formatLocalDateLong(member.joined_at)}
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
                  {formatLocalDateLong(member.updated_at)}
                </p>
              </div>

              {member.project_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaProjectDiagram className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Current Project
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {member.project_name}
                  </p>
                </div>
              )}

              {member.added_by_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUser className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Added By
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {member.added_by_name}
                  </p>
                </div>
              )}
            </div>

            {/* Permissions & Access */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                Access Information
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.permission || member.role)}
                    <span className="text-gray-900 font-medium">
                      Project Access
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {(member.permission || member.role)
                      ?.charAt(0)
                      .toUpperCase() +
                      (member.permission || member.role)?.slice(1)}{" "}
                    level
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle
                      className={
                        member.is_active ? "text-green-500" : "text-red-500"
                      }
                      size={16}
                    />
                    <span className="text-gray-900 font-medium">
                      Account Status
                    </span>
                  </div>
                  <span
                    className={`text-sm ${
                      member.is_active ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                Technical Details
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {member.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {member.user}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {member.project}
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
