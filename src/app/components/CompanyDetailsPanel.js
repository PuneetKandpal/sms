"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding,
  FaCalendar,
  FaCog,
  FaCrown,
  FaEdit,
  FaEye,
  FaGlobe,
  FaIndustry,
  FaPlus,
  FaProjectDiagram,
  FaSpinner,
  FaTimes,
  FaUser,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";
import MemberManagementModal from "./MemberManagementModal";
import { Refresh } from "@mui/icons-material";
import { formatLocalDateLong } from "../../utils/dateUtils";

export default function CompanyDetailsPanel({
  company,
  projects,
  members,
  loading,
  onClose,
  onRefresh,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
}) {
  const [activeTab, setActiveTab] = useState("projects");
  const [showMemberModal, setShowMemberModal] = useState(false);

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <FaCrown className="text-yellow-500" size={14} />;
      case "manager":
        return <FaUserShield className="text-blue-500" size={14} />;
      case "employee":
        return <FaUser className="text-gray-500" size={14} />;
      default:
        return <FaUser className="text-gray-500" size={14} />;
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className="w-1/2 bg-white border-l border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
              <FaBuilding className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {company.name}
              </h2>
              <p className="text-sm text-gray-600">Company Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <Refresh className={loading ? "animate-spin" : ""} size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes size={16} />
            </motion.button>
          </div>
        </div>

        {/* Company Info */}
        <div className="space-y-3 mb-6">
          {company.website && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaGlobe size={12} className="text-gray-400" />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {company.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {company.industry && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaIndustry size={12} className="text-gray-400" />
              <span>{company.industry}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaCalendar size={12} className="text-gray-400" />
            <span>Created {formatLocalDateLong(company.created_at)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "projects"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaProjectDiagram size={14} />
            Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaUsers size={14} />
            Members ({members.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner
                className="animate-spin text-primary mx-auto mb-4"
                size={32}
              />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Projects Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Projects
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <FaPlus size={12} />
                    New Project
                  </motion.button>
                </div>

                {/* Projects List */}
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <FaProjectDiagram
                      className="text-gray-300 mx-auto mb-4"
                      size={48}
                    />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Projects Yet
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Create your first project to get started
                    </p>
                    <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {project.name ||
                                project.title ||
                                "Untitled Project"}
                            </h4>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>
                                Created{" "}
                                {formatLocalDateLong(project.created_at)}
                              </span>
                              {project.status && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  {project.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Project"
                            >
                              <FaEye size={12} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Edit Project"
                            >
                              <FaEdit size={12} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "members" && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Members Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Members
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowMemberModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <FaCog size={12} />
                    Manage Members
                  </motion.button>
                </div>

                {/* Members List */}
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUsers className="text-gray-300 mx-auto mb-4" size={48} />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Team Members
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Invite team members to collaborate on projects
                    </p>
                    <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                      Invite Members
                    </button>
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
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {member.user?.first_name?.[0] ||
                                  member.user?.email?.[0] ||
                                  "U"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {member.user?.first_name &&
                                member.user?.last_name
                                  ? `${member.user.first_name} ${member.user.last_name}`
                                  : member.user?.email || "Unknown User"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {member.user?.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                    member.role
                                  )}`}
                                >
                                  {getRoleIcon(member.role)}
                                  {member.role?.charAt(0).toUpperCase() +
                                    member.role?.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Joined {formatLocalDateLong(member.joined_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Member"
                            >
                              <FaEdit size={12} />
                            </motion.button>
                            {member.role !== "owner" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Member"
                              >
                                <FaTrash size={12} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Member Management Modal */}
      <MemberManagementModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        company={company}
        members={members}
        onInviteMember={onInviteMember}
        onUpdateMember={onUpdateMember}
        onRemoveMember={onRemoveMember}
      />
    </motion.div>
  );
}
