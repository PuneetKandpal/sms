"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";

export default function ProjectDeleteModal({
  isOpen,
  onClose,
  project,
  onDelete,
}) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await onDelete(project.id);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setLoading(false);
      setConfirmText("");
    }
  };

  const isConfirmValid = confirmText === project?.name;

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
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FaExclamationTriangle className="text-red-600" size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Delete Project
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
          <div className="p-6 space-y-4">
            {/* Project Info */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary rounded-lg">
                  <FaTrash className="text-white" size={14} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-gray-600">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-sm text-red-700 space-y-2">
                <p className="font-medium">
                  ⚠️ Deleting this project will permanently remove:
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-600 ml-4">
                  <li>All project data and settings</li>
                  <li>All associated tasks and content</li>
                  <li>All member access to this project</li>
                  <li>All analytics and historical data</li>
                </ul>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm deletion, type the project name:{" "}
                <span className="font-bold text-red-600">{project.name}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${project.name}" to confirm`}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                disabled={loading}
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
                    project will be permanently deleted and cannot be recovered.
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
              onClick={handleDelete}
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
                  Delete Project
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
