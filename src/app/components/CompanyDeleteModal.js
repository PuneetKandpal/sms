"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaExclamationTriangle,
  FaBuilding,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";

export default function CompanyDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  company,
}) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setConfirmText("");
    }
  };

  const isConfirmValid = confirmText === company?.name;

  if (!isOpen || !company) return null;

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
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <FaExclamationTriangle className="text-red-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete Company
                  </h2>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={16} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Company Info */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                  <FaBuilding className="text-white" size={16} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{company.name}</p>
                  <p className="text-sm text-gray-600">
                    {company.industry || "No industry specified"}
                  </p>
                </div>
              </div>

              <div className="text-sm text-red-700 space-y-2">
                <p className="font-medium">
                  ⚠️ Deleting this company will permanently remove:
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-600 ml-4">
                  <li>All company data and settings</li>
                  <li>All associated projects and their data</li>
                  <li>All team member access and roles</li>
                  <li>All scheduled posts and content</li>
                  <li>All analytics and historical data</li>
                </ul>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm deletion, type the company name:{" "}
                <span className="font-bold text-red-600">{company.name}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${company.name}" to confirm`}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle
                  className="text-yellow-600 mt-0.5"
                  size={16}
                />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">
                    Important Notice
                  </p>
                  <p className="text-yellow-700">
                    This action is irreversible. All data associated with this
                    company will be permanently deleted and cannot be recovered.
                    Please make sure you have backed up any important data
                    before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: isConfirmValid ? 1.02 : 1 }}
              whileTap={{ scale: isConfirmValid ? 0.98 : 1 }}
              onClick={handleConfirm}
              disabled={loading || !isConfirmValid}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" size={14} />
                  Deleting...
                </>
              ) : (
                <>
                  <FaTrash size={14} />
                  Delete Company
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
