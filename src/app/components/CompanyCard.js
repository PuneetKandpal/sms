"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  FaBuilding,
  FaUsers,
  FaProjectDiagram,
  FaEdit,
  FaTrash,
  FaEye,
  FaGlobe,
  FaIndustry,
  FaCalendar,
} from "react-icons/fa";
import { formatLocalDate } from "../../utils/dateUtils";

export default function CompanyCard({
  company,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) {
  const getIndustryIcon = (industry) => {
    const icons = {
      Technology: "💻",
      Finance: "💰",
      Healthcare: "🏥",
      Education: "🎓",
      Retail: "🛍️",
      Manufacturing: "🏭",
      Real_Estate: "🏢",
      Consulting: "💼",
      Media: "📺",
      Non_Profit: "❤️",
    };
    return icons[industry] || "🏢";
  };

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
        isSelected
          ? "border-primary shadow-lg ring-4 ring-primary/20"
          : "border-gray-200 hover:border-primary/50 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
              <FaBuilding className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                {company.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-lg">
                  {getIndustryIcon(company.industry)}
                </span>
                <span>{company.industry || "Not specified"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Company"
            >
              <FaEdit size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Company"
            >
              <FaTrash size={14} />
            </motion.button>
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {company.description}
          </p>
        )}

        {/* Company Info */}
        <div className="space-y-3 mb-4">
          {company.website && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaGlobe size={12} className="text-gray-400" />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-primary transition-colors truncate"
              >
                {company.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {company.size && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaUsers size={12} className="text-gray-400" />
              <span>
                {getSizeLabel(company.size)} ({company.size} employees)
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaCalendar size={12} className="text-gray-400" />
            <span>Created {formatLocalDate(company.created_at)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FaProjectDiagram size={12} className="text-blue-500" />
              <span className="font-medium">0</span>
              <span>Projects</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FaUsers size={12} className="text-green-500" />
              <span className="font-medium">0</span>
              <span>Members</span>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 text-xs text-primary font-medium"
          >
            <FaEye size={10} />
            <span>View Details</span>
          </motion.div>
        </div>

        {/* Owner Info */}
        {company.created_by && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                <FaUsers size={8} />
              </div>
              <span>Owner: {company.created_by}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="h-1 bg-gradient-to-r from-primary to-primary/80 rounded-b-xl"
        />
      )}
    </motion.div>
  );
}
