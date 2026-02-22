"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaEnvelope,
  FaBuilding,
  FaUserShield,
  FaPaperPlane,
  FaSpinner,
  FaUser,
  FaCrown,
  FaUsers,
} from "react-icons/fa";
import companyService from "../api/companyService";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  {
    value: "employee",
    label: "Employee",
    icon: FaUser,
    description: "Basic access to assigned projects",
    color: "text-gray-600",
  },
  {
    value: "manager",
    label: "Manager",
    icon: FaUserShield,
    description: "Can manage projects and team members",
    color: "text-blue-600",
  },
  {
    value: "owner",
    label: "Owner",
    icon: FaCrown,
    description: "Full access to company settings",
    color: "text-yellow-600",
  },
];

export default function InviteUserModal({
  isOpen,
  onClose,
  companies,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    email: "",
    company: "",
    role: "employee",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: "",
        company: companies.length === 1 ? companies[0].id : "",
        role: "employee",
        message: "",
      });
      setErrors({});
    }
  }, [isOpen, companies]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Company validation
    if (!formData.company) {
      newErrors.company = "Please select a company";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const invitationData = {
        company: formData.company,
        email: formData.email.trim(),
        role: formData.role,
        message: formData.message.trim() || undefined,
      };

      const result = await companyService.createInvitation(invitationData);

      console.log("result", result);

      if (result.success) {
        toast.success("Invitation sent successfully!");
        onSuccess?.(result.data);
        onClose();
      } else {
        toast.error(result.error);
        // Set field-specific errors if available
        if (result.error.includes("email")) {
          setErrors({ email: result.error });
        } else if (result.error.includes("role")) {
          setErrors({ role: result.error });
        }
      }
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const selectedCompany = companies.find((c) => c.id === formData.company);
  const selectedRole = ROLE_OPTIONS.find((r) => r.value === formData.role);

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
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FaUsers className="text-primary" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Invite Team Member
                  </h2>
                  <p className="text-sm text-gray-600">
                    Send an invitation to join your company
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
                <FaTimes size={20} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <FaEnvelope
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="colleague@example.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.email ? "border-red-300" : "border-gray-200"
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Company Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <div className="relative">
                  <FaBuilding
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <select
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white cursor-pointer transition-colors ${
                      errors.company ? "border-red-300" : "border-gray-200"
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.company && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.company}
                  </motion.p>
                )}
                {selectedCompany && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaBuilding size={12} />
                      <span className="font-medium">
                        {selectedCompany.name}
                      </span>
                      {selectedCompany.industry && (
                        <>
                          <span>•</span>
                          <span>{selectedCompany.industry}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Role & Permissions *
                </label>
                <div className="space-y-3">
                  {ROLE_OPTIONS.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <motion.label
                        key={role.value}
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                          formData.role === role.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="w-4 h-4 text-primary mt-1 cursor-pointer"
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent className={role.color} size={16} />
                            <span className="font-medium text-gray-900">
                              {role.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {role.description}
                          </p>
                        </div>
                      </motion.label>
                    );
                  })}
                </div>
                {errors.role && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.role}
                  </motion.p>
                )}
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Add a personal note to your invitation..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be included in the invitation email
                </p>
              </div>

              {/* Preview */}
              {formData.email && formData.company && formData.role && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl p-4 border border-primary/20"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    Invitation Preview
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>{formData.email}</strong> will be invited to join{" "}
                      <strong>{selectedCompany?.name}</strong> as a{" "}
                      <strong className={selectedRole?.color}>
                        {selectedRole?.label}
                      </strong>
                    </p>
                    {formData.message && (
                      <p className="italic">"{formData.message}"</p>
                    )}
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.email ||
                  !formData.company ||
                  !formData.role
                }
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={16} />
                    Send Invitation
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
