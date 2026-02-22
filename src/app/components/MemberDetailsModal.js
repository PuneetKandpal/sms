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
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

export default function MemberDetailsModal({ isOpen, onClose, member }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getRoleIcon = (permission) => {
    switch (permission?.toLowerCase()) {
      case "owner":
      case "admin":
        return <FaCrown className="text-yellow-500" size={16} />;
      case "manager":
        return <FaUserShield className="text-blue-500" size={16} />;
      default:
        return <FaUser className="text-gray-500" size={16} />;
    }
  };

  const getRoleColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case "owner":
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
                    Member Profile
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
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-gray-900 font-medium">
                    {member.user_email}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaCalendar className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Member Since
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {formatLocalDateLong(member.joined_at)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {member.is_active ? (
                      <FaCheckCircle className="text-green-500" size={16} />
                    ) : (
                      <FaTimesCircle className="text-red-500" size={16} />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      Account Status
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      member.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Memberships */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Memberships ({member.companies?.length || 0})
              </h3>
              <div className="space-y-3">
                {member.companies?.map((company, index) => {
                  // Find the membership for this company
                  const membership = member.all_memberships?.find(
                    (m) => m.company_info.id === company.id
                  );

                  return (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <FaBuilding className="text-gray-400" size={16} />
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {company.name}
                            </h4>
                            {company.industry && (
                              <p className="text-sm text-gray-600">
                                {company.industry}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                                  membership?.permission || membership?.role
                                )}`}
                              >
                                {getRoleIcon(
                                  membership?.permission || membership?.role
                                )}
                                {(membership?.permission || membership?.role)
                                  ?.charAt(0)
                                  .toUpperCase() +
                                  (
                                    membership?.permission || membership?.role
                                  )?.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                Joined{" "}
                                {formatLocalDateLong(membership?.joined_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Technical Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Technical Information
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {member.user || member.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Companies:</span>
                    <span className="text-gray-900 font-medium">
                      {member.companies?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">
                      {formatLocalDateLong(member.updated_at)}
                    </span>
                  </div>
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
