"use client";
import React from "react";
import { formatLocalDate } from "../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding,
  FaGlobe,
  FaIndustry,
  FaUsers,
  FaCalendar,
  FaArrowRight,
} from "react-icons/fa";

export default function CompanyHoverCard({ company, position, isVisible }) {
  if (!isVisible || !company) return null;

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: position.x - 150, // Center the card
          top: position.y - 10,
          transform: "translateY(-100%)",
        }}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-80 max-w-sm">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
              <FaBuilding className="text-white" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {company.name}
              </h3>
              <p className="text-xs text-gray-600">Company Details</p>
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-2 mb-3">
            {company.industry && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaIndustry size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{company.industry}</span>
              </div>
            )}

            {company.website && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaGlobe size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {company.website.replace(/^https?:\/\//, "")}
                </span>
              </div>
            )}

            {company.size && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaUsers size={12} className="text-gray-400 flex-shrink-0" />
                <span>{getSizeLabel(company.size)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaCalendar size={12} className="text-gray-400 flex-shrink-0" />
              <span>Created {formatLocalDate(company.created_at)}</span>
            </div>
          </div>

          {/* Action Hint */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Click to view company</span>
            <FaArrowRight size={10} className="text-gray-400" />
          </div>

          {/* Pointer Arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            <div className="absolute -top-px left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
