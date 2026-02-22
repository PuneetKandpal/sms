"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaSpinner,
  FaEnvelope,
  FaBuilding,
  FaCrown,
  FaUserShield,
  FaUser,
} from "react-icons/fa";

const getRoleIcon = (role) => {
  switch (role?.toLowerCase()) {
    case "owner":
    case "admin":
      return <FaCrown className="text-yellow-500" size={14} />;
    case "manager":
      return <FaUserShield className="text-blue-500" size={14} />;
    default:
      return <FaUser className="text-gray-500" size={14} />;
  }
};

const getRoleBadgeColor = (role) => {
  switch (role?.toLowerCase()) {
    case "owner":
    case "admin":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "manager":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function CancelInvitationModal({
  isOpen,
  onClose,
  invitation,
  onConfirm,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(invitation);
      onClose();
    } catch (error) {
      console.error("Error canceling invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !invitation) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex  items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaExclamationTriangle className="text-red-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Cancel Invitation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Invitation Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <FaEnvelope className="text-white" size={14} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {invitation.email}
                  </div>
                  <div className="text-sm text-gray-600">
                    Invited to join as{" "}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                        invitation.role
                      )}`}
                    >
                      {getRoleIcon(invitation.role)}
                      {invitation.role?.charAt(0).toUpperCase() +
                        invitation.role?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaBuilding size={12} />
                <span>{invitation.company_name}</span>
              </div>

              {invitation.message && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Message:</div>
                  <div className="text-sm text-gray-700">
                    "{invitation.message}"
                  </div>
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle
                  className="text-red-600 mt-0.5"
                  size={16}
                />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">
                    Are you sure you want to cancel this invitation?
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>
                      • The invitation link will become invalid immediately
                    </li>
                    <li>
                      • {invitation.email} will no longer be able to join using
                      this invitation
                    </li>
                    <li>• This action cannot be undone</li>
                    <li>
                      • You'll need to send a new invitation if you change your
                      mind
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Invitation
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 cursor-pointer px-4 py-2 text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" size={14} />
                    Canceling...
                  </>
                ) : (
                  <>
                    <FaTrash size={14} />
                    Cancel Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
