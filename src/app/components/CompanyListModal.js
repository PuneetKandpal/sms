"use client";
import React, { useState } from "react";
import { formatLocalDate } from "../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaBuilding,
  FaEye,
  FaArrowRight,
  FaGlobe,
  FaIndustry,
  FaUsers,
  FaCalendar,
} from "react-icons/fa";

export default function CompanyListModal({
  isOpen,
  onClose,
  companies,
  onViewCompany,
  onGoToCompany,
}) {
  const [hoveredCompany, setHoveredCompany] = useState(null);

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaBuilding className="text-blue-600" size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Member Companies
                  </h2>
                  <p className="text-sm text-gray-600">
                    Click on any company to go to Companies page
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

          {/* Companies List */}
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                onMouseEnter={() => setHoveredCompany(company)}
                onMouseLeave={() => setHoveredCompany(null)}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors group"
                    onClick={() => onGoToCompany(company.id)}
                    title={`Click to go to ${company.name} in Companies page`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FaBuilding
                        size={14}
                        className="text-gray-400 group-hover:text-primary transition-colors"
                      />
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary truncate transition-colors">
                        {company.name}
                      </h3>
                      <FaArrowRight
                        size={10}
                        className="text-gray-400 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      />
                    </div>

                    <div className="space-y-1 text-sm text-gray-600"></div>
                  </div>

                  {/* Action Button - Only View Details */}
                  <div className="flex items-center ml-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCompany(company);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="View Company Details"
                    >
                      <FaEye size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <FaArrowRight size={8} />
                <span>Click company name to navigate to Companies page</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
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
