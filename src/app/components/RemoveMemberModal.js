"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaBuilding,
  FaUser,
  FaSpinner,
} from "react-icons/fa";

export default function RemoveMemberModal({
  isOpen,
  onClose,
  member,
  selectedCompany,
  onSelectCompany,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      if (member.companies?.length === 1) {
        // Auto-select the only company and show confirmation
        onSelectCompany(member.companies[0]);
        setShowConfirmation(true);
      } else {
        // Reset to company selection
        setShowConfirmation(false);
      }
    }
  }, [isOpen, member, onSelectCompany]);

  const handleCompanySelect = (company) => {
    onSelectCompany(company);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    onSelectCompany(null);
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
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {!showConfirmation ? (
            // Company Selection Step
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <FaTrash className="text-red-600" size={16} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Edit Member Access
                       </h2>
                      <p className="text-sm text-gray-600">
                        Select company to remove memebr access from
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <FaTimes size={16} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.user_name?.[0] || member.user_email?.[0] || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user_name || member.user_email}
                      </p>
                      <p className="text-xs text-gray-600">
                        Member of {member.companies?.length} companies
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Select company to remove member from:
                  </h3>
                  <div className="space-y-2">
                    {member.companies?.map((company) => (
                      <motion.button
                        key={company.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleCompanySelect(company)}
                        className="w-full p-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FaBuilding size={14} className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {company.name}
                            </p>
                            {company.industry && (
                              <p className="text-xs text-gray-600">
                                {company.industry}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            // Confirmation Step
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <FaExclamationTriangle
                        className="text-red-600"
                        size={16}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Confirm Removal
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
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FaTimes size={16} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaExclamationTriangle className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Remove Member from Company?
                  </h3>
                  <p className="text-gray-600">
                    Are you sure you want to remove{" "}
                    <strong>{member.user_name || member.user_email}</strong>{" "}
                    from <strong>{selectedCompany?.name}</strong>?
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle
                      className="text-red-600 mt-0.5"
                      size={16}
                    />
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">Warning</h4>
                      <p className="text-sm text-red-700">
                        This will permanently remove the member's access to this
                        company and all associated projects. This action cannot
                        be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Member and Company Summary */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <FaUser className="text-gray-400" size={16} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user_name || member.user_email}
                      </p>
                      <p className="text-xs text-gray-600">
                        {member.user_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <FaBuilding className="text-gray-400" size={16} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedCompany?.name}
                      </p>
                      {selectedCompany?.industry && (
                        <p className="text-xs text-gray-600">
                          {selectedCompany.industry}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  {member.companies?.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Back
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} />
                        Removing...
                      </>
                    ) : (
                      <>
                        <FaTrash size={14} />
                        Remove Member
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
