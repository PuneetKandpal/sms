"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaBuilding,
  FaGlobe,
  FaIndustry,
  FaUsers,
  FaFileText,
  FaSave,
  FaSpinner,
} from "react-icons/fa";

const INDUSTRY_OPTIONS = [
  { value: "Technology", label: "Technology", icon: "💻" },
  { value: "Finance", label: "Finance", icon: "💰" },
  { value: "Healthcare", label: "Healthcare", icon: "🏥" },
  { value: "Education", label: "Education", icon: "🎓" },
  { value: "Retail", label: "Retail", icon: "🛍️" },
  { value: "Manufacturing", label: "Manufacturing", icon: "🏭" },
  { value: "Real_Estate", label: "Real Estate", icon: "🏢" },
  { value: "Consulting", label: "Consulting", icon: "💼" },
  { value: "Media", label: "Media & Entertainment", icon: "📺" },
  { value: "Non_Profit", label: "Non-Profit", icon: "❤️" },
];

const SIZE_OPTIONS = [
  { value: "1-10", label: "1-10 employees (Startup)" },
  { value: "11-50", label: "11-50 employees (Small)" },
  { value: "51-200", label: "51-200 employees (Medium)" },
  { value: "201-1000", label: "201-1000 employees (Large)" },
  { value: "1000+", label: "1000+ employees (Enterprise)" },
];

export default function CompanyModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  company = null,
}) {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes or company changes
  useEffect(() => {
    if (isOpen) {
      if (company) {
        setFormData({
          name: company.name || "",
          website: company.website || "",
          industry: company.industry || "",
          size: company.size || "",
          description: company.description || "",
        });
      } else {
        setFormData({
          name: "",
          website: "",
          industry: "",
          size: "",
          description: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, company]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Company name must be at least 2 characters";
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string.startsWith("http") ? string : `https://${string}`);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Format website URL
      let websiteUrl = formData.website;
      if (websiteUrl && !websiteUrl.startsWith("http")) {
        websiteUrl = `https://${websiteUrl}`;
      }

      const submitData = {
        ...formData,
        website: websiteUrl,
      };

      const result = await onSubmit(submitData);

      if (result.success) {
        onClose();
      } else if (result.error) {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

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
          className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                  <FaBuilding className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                  <p className="text-sm text-gray-600">
                    {company
                      ? "Update company information"
                      : "Create a new company"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto"
          >
            {/* Company Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FaBuilding size={12} className="text-gray-400" />
                Company Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter company name"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.name ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.name}
                </motion.p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FaGlobe size={12} className="text-gray-400" />
                Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://example.com"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.website ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.website && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.website}
                </motion.p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FaIndustry size={12} className="text-gray-400" />
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="">Select an industry</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FaUsers size={12} className="text-gray-400" />
                Company Size
              </label>
              <select
                value={formData.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="">Select company size</option>
                {SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FaFileText size={12} className="text-gray-400" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Brief description of your company"
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${
                  errors.description ? "border-red-300" : "border-gray-200"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm"
                  >
                    {errors.description}
                  </motion.p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </motion.div>
            )}
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={14} />
                    {company ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <FaSave size={14} />
                    {company ? "Update Company" : "Create Company"}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
