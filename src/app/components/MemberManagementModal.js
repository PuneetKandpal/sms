"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUsers,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaCrown,
  FaUserShield,
  FaUser,
  FaSave,
  FaSpinner,
  FaEnvelope,
} from "react-icons/fa";

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee", icon: FaUser, color: "gray" },
  { value: "manager", label: "Manager", icon: FaUserShield, color: "blue" },
  { value: "owner", label: "Owner", icon: FaCrown, color: "yellow" },
];

export default function MemberManagementModal({
  isOpen,
  onClose,
  company,
  members,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
}) {
  const [activeTab, setActiveTab] = useState("members");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);

  // Invite form state
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "employee",
    message: "",
  });

  // Edit form state
  const [editData, setEditData] = useState({
    role: "",
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onInviteMember(inviteData);
      if (result.success) {
        setInviteData({ email: "", role: "employee", message: "" });
        setShowInviteForm(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (memberId) => {
    setLoading(true);

    try {
      const result = await onUpdateMember(memberId, editData);
      if (result.success) {
        setEditingMember(null);
        setEditData({ role: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      setLoading(true);

      try {
        await onRemoveMember(memberId);
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleIcon = (role) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    const Icon = roleOption?.icon || FaUser;
    return <Icon size={14} />;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "employee":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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
          className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                  <FaUsers className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Manage Team Members
                  </h2>
                  <p className="text-sm text-gray-600">{company.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowInviteForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <FaUserPlus size={14} />
                  Invite Member
                </motion.button>
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
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Invite Form */}
            {showInviteForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Invite New Member
                </h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={inviteData.email}
                        onChange={(e) =>
                          setInviteData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="member@example.com"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        value={inviteData.role}
                        onChange={(e) =>
                          setInviteData((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={inviteData.message}
                      onChange={(e) =>
                        setInviteData((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Add a personal message to the invitation..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin" size={14} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaEnvelope size={14} />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Members List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Current Members ({members.length})
              </h3>

              {members.length === 0 ? (
                <div className="text-center py-12">
                  <FaUsers className="text-gray-300 mx-auto mb-4" size={48} />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Members Yet
                  </h4>
                  <p className="text-gray-600">
                    Invite team members to start collaborating
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {member.user?.first_name?.[0] ||
                                member.user?.email?.[0] ||
                                "U"}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {member.user?.first_name && member.user?.last_name
                                ? `${member.user.first_name} ${member.user.last_name}`
                                : member.user?.email || "Unknown User"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {member.user?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {editingMember === member.id ? (
                                <select
                                  value={editData.role}
                                  onChange={(e) =>
                                    setEditData({ role: e.target.value })
                                  }
                                  className="px-2 py-1 border border-gray-200 rounded text-xs"
                                >
                                  {ROLE_OPTIONS.map((role) => (
                                    <option key={role.value} value={role.value}>
                                      {role.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                    member.role
                                  )}`}
                                >
                                  {getRoleIcon(member.role)}
                                  {member.role?.charAt(0).toUpperCase() +
                                    member.role?.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {editingMember === member.id ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleUpdateMember(member.id)}
                                disabled={loading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <FaSave size={14} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditingMember(null);
                                  setEditData({ role: "" });
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <FaTimes size={14} />
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditingMember(member.id);
                                  setEditData({ role: member.role });
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <FaEdit size={14} />
                              </motion.button>
                              {member.role !== "owner" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <FaTrash size={14} />
                                </motion.button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
