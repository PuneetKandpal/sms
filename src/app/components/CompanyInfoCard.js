"use client";
import React from "react";
import { formatLocalDateLong } from "../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaBuilding,
  FaGlobe,
  FaIndustry,
  FaUsers,
  FaCalendar,
  FaUser,
} from "react-icons/fa";

export default function CompanyInfoCard({
  isOpen,
  onClose,
  company,
  position,
}) {
  const getSizeLabel = (size) => {
    const labels = {
      "1-10": "Startup",
      "11-50": "Small",
      "51-200": "Medium",
      "201-1000": "Large",
      "1000+": "Enterprise",
    };
    return labels[size] || size;
  };

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
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                  <FaBuilding className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {company.name}
                  </h2>
                  <p className="text-sm text-gray-600">Company Information</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaBuilding className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Company Name
                  </span>
                </div>
                <p className="text-gray-900 font-medium text-lg">
                  {company.name}
                </p>
              </div>

              {company.website && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaGlobe className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Website
                    </span>
                  </div>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {company.industry && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaIndustry className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Industry
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {company.industry}
                  </p>
                </div>
              )}

              {company.size && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUsers className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Company Size
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {getSizeLabel(company.size)} ({company.size} employees)
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaCalendar className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Created At
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {formatLocalDateLong(company.created_at)}
                </p>
              </div>

              {company.created_by && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUser className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-600">
                      Created By
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {company.created_by}
                  </p>
                </div>
              )}
            </div>

            {company.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaBuilding className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Description
                  </span>
                </div>
                <p className="text-gray-900">{company.description}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
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
