"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaEye,
  FaSpinner,
  FaCheck,
  FaUsers,
  FaProjectDiagram,
  FaCalendar,
  FaEnvelope,
  FaCrown,
  FaUserShield,
  FaUser,
} from "react-icons/fa";
import companyService from "../api/companyService";
import ProjectRenameModal from "../components/ProjectRenameModal";
import ProjectDeleteModal from "../components/ProjectDeleteModal";
import CompanyDetailsModal from "../components/CompanyDetailsModal";
import ProjectDetailsModal from "../components/ProjectDetailsModal";
import UserProfileModal from "../components/UserProfileModal";
import {
  CompanyTabShimmer,
  ProjectShimmer,
  MemberShimmer,
} from "../components/shimmer/CompanyShimmer";
import ScreenShimmer from "../components/shimmer/ScreenShimmer";
import EditCompanyModal from "../components/EditCompanyModal";
import EditRoleModal from "../components/EditRoleModal";
import RemoveMemberModal from "../components/RemoveMemberModal";
import toast from "react-hot-toast";
import useFeatureTracking from "../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../lib/analytics/featureTracking";

export default function CompaniesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filteredMembers, setFilteredMembers] = useState([]);

  // Track feature usage
  useFeatureTracking("Companies", {
    feature_category: "organization_management",
    page_section: "companies",
  });

  // Loading states
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modal states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [companyToView, setCompanyToView] = useState(null);
  const [projectToView, setProjectToView] = useState(null);
  const [userToView, setUserToView] = useState(null);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);
  const [showEditRole, setShowEditRole] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [showRemoveMember, setShowRemoveMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [selectedCompanyForRemoval, setSelectedCompanyForRemoval] =
    useState(null);

  // Dropdown states
  const [companyDropdowns, setCompanyDropdowns] = useState({});
  const [projectDropdowns, setProjectDropdowns] = useState({});
  const [memberDropdowns, setMemberDropdowns] = useState({});

  // Global context menu state (fixed-position outside scroll containers)
  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    type: null, // "company" | "project" | "member"
    data: null,
  });

  const openContextMenu = (event, type, data) => {
    event.stopPropagation();
    const menuWidth = 220;
    const menuHeight = 200;
    const padding = 8;
    const clickX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
    const clickY = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
    const x = Math.min(clickX, window.innerWidth - menuWidth - padding);
    const y = Math.min(clickY + 8, window.innerHeight - menuHeight - padding);
    setContextMenu({ open: true, x, y, type, data });
  };

  const closeContextMenu = () =>
    setContextMenu((prev) => ({
      ...prev,
      open: false,
      type: null,
      data: null,
    }));

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeContextMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fetch companies on mount and when URL params change
  useEffect(() => {
    fetchCompanies();
  }, [searchParams]);

  // Fetch projects when company changes
  useEffect(() => {
    if (selectedCompany) {
      // When company changes, clear any selected project to show all members
      setSelectedProject(null);
      fetchProjects(selectedCompany.id);
      fetchMembers(selectedCompany.id);
    }
  }, [selectedCompany]);

  // Filter members by project
  useEffect(() => {
    if (selectedProject) {
      fetchProjectMembers(selectedProject.id);
    } else {
      setFilteredMembers(members);
    }
  }, [selectedProject, members]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);

    trackFeatureAction("companies_fetch_started", {});

    try {
      const result = await companyService.getCompanies();
      if (result.success) {
        setCompanies(result.data);

        trackFeatureAction("companies_fetch_success", {
          companies_count: result.data.length,
        });

        // Check for company parameter in URL
        const companyParam = searchParams.get("company");
        if (companyParam && result.data.length > 0) {
          const foundCompany = result.data.find((c) => c.id === companyParam);
          if (foundCompany) {
            setSelectedCompany(foundCompany);
          } else {
            setSelectedCompany(result.data[0]);
          }
        } else if (result.data.length > 0) {
          setSelectedCompany(result.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchProjects = async (companyId) => {
    setLoadingProjects(true);

    trackFeatureAction("company_projects_fetch_started", {
      company_id: companyId,
    });

    try {
      const result = await companyService.getCompanyProjects(companyId);
      if (result.success) {
        setProjects(result.data);

        trackFeatureAction("company_projects_fetch_success", {
          company_id: companyId,
          projects_count: result.data.length,
        });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);

      trackFeatureAction("company_projects_fetch_failed", {
        company_id: companyId,
        error_message: error.message,
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchMembers = async (companyId) => {
    setLoadingMembers(true);

    trackFeatureAction("company_members_fetch_started", {
      company_id: companyId,
    });

    try {
      const result = await companyService.getCompanyMembers(companyId);
      if (result.success) {
        setMembers(result.data);

        trackFeatureAction("company_members_fetch_success", {
          company_id: companyId,
          members_count: result.data.length,
        });
      }
    } catch (error) {
      console.error("Error fetching members:", error);

      trackFeatureAction("company_members_fetch_failed", {
        company_id: companyId,
        error_message: error.message,
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchProjectMembers = async (projectId) => {
    setLoadingMembers(true);

    trackFeatureAction("project_members_fetch_started", {
      project_id: projectId,
    });

    const result = await companyService.getProjectMembers(projectId);
    if (result.success) {
      setFilteredMembers(result.data);

      trackFeatureAction("project_members_fetch_success", {
        project_id: projectId,
        members_count: result.data.length,
      });
    } else {
      toast.error(result.error);
      setFilteredMembers([]);

      trackFeatureAction("project_members_fetch_failed", {
        project_id: projectId,
        error_message: result.error,
      });
    }
    setLoadingMembers(false);
  };

  const handleProjectSelect = (project) => {
    if (selectedProject?.id === project.id) {
      setSelectedProject(null); // Unselect if already selected
    } else {
      setSelectedProject(project);
    }
  };

  // Helper functions for UI
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const dt = new Date(dateString);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleIcon = (permission) => {
    switch (permission?.toLowerCase()) {
      case "admin":
        return <FaCrown className="text-yellow-500" size={12} />;
      case "manager":
        return <FaUserShield className="text-blue-500" size={12} />;
      default:
        return <FaUser className="text-gray-500" size={12} />;
    }
  };

  const getRoleBadgeColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isCurrentUser = (email) => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return false;
      const me = JSON.parse(stored);
      return (
        me?.email && email && me.email.toLowerCase() === email.toLowerCase()
      );
    } catch (_) {
      return false;
    }
  };

  // Save company edits
  const handleSaveCompany = async (payload) => {
    trackFeatureAction("company_update_started", {
      company_id: selectedCompany.id,
      company_name: selectedCompany.name,
    });

    const res = await companyService.updateCompany(selectedCompany.id, payload);
    if (res.success) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompany.id ? { ...c, ...res.data } : c
        )
      );
      setSelectedCompany((prev) => ({ ...prev, ...res.data }));

      trackFeatureAction("company_update_success", {
        company_id: selectedCompany.id,
        company_name: selectedCompany.name,
      });
    } else {
      trackFeatureAction("company_update_failed", {
        company_id: selectedCompany.id,
        company_name: selectedCompany.name,
        error_message: res.error,
      });
    }
    return res;
  };

  // Save member role edits
  const handleSaveMemberRole = async ({ role }) => {
    if (!memberToEdit || !selectedCompany) return { success: false };

    const previousMembers = members;
    const previousFilteredMembers = filteredMembers;
    const applyRoleUpdate = (list, nextRole) =>
      list.map((m) =>
        m.id === memberToEdit.id ? { ...m, permission: nextRole } : m
      );

    trackFeatureAction("member_role_update_started", {
      company_id: selectedCompany.id,
      member_id: memberToEdit.id,
      new_role: role,
      old_role: memberToEdit.permission,
    });

    // Optimistically update local state
    setMembers((prev) => applyRoleUpdate(prev, role));
    setFilteredMembers((prev) => applyRoleUpdate(prev, role));

    const res = await companyService.updateCompanyMember(
      selectedCompany.id,
      memberToEdit.id,
      { role, company: selectedCompany.id, user: memberToEdit.user_id }
    );
    if (res.success) {
      const confirmedRole = res.data?.permission ?? res.data?.role ?? role;
      setMembers((prev) => applyRoleUpdate(prev, confirmedRole));
      trackFeatureAction("member_role_update_success", {
        company_id: selectedCompany.id,
        member_id: memberToEdit.id,
        new_role: confirmedRole,
      });
    } else {
      // Revert optimistic update
      setMembers(previousMembers);
      setFilteredMembers(previousFilteredMembers);
      trackFeatureAction("member_role_update_failed", {
        company_id: selectedCompany.id,
        member_id: memberToEdit.id,
        new_role: role,
        error_message: res.error,
      });
    }
    return res;
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !selectedCompanyForRemoval) {
      toast.error("Missing member or company information");
      return;
    }

    trackFeatureAction("member_removal_started", {
      company_id: selectedCompanyForRemoval.id,
      member_id: memberToRemove.id,
      member_name: memberToRemove.name,
    });

    try {
      const result = await companyService.removeCompanyMember(
        selectedCompanyForRemoval.id,
        memberToRemove.id
      );

      if (result.success) {
        // Optimistically update UI by removing the member
        setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        setFilteredMembers((prev) =>
          prev.filter((m) => m.id !== memberToRemove.id)
        );

        // Background refresh to ensure data consistency
        await fetchMembers(selectedCompanyForRemoval.id);

        toast.success(
          `${
            memberToRemove.user_name || memberToRemove.user_email
          } has been removed from ${selectedCompanyForRemoval.name}`
        );

        // Close modal and reset state
        setShowRemoveMember(false);
        setMemberToRemove(null);
        setSelectedCompanyForRemoval(null);
      } else {
        toast.error(
          result.error || "Failed to remove member. Please try again."
        );
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(
        "An unexpected error occurred while removing the member. Please try again."
      );
    }
  };

  const handleRemoveMemberModalClose = () => {
    setShowRemoveMember(false);
    setMemberToRemove(null);
    setSelectedCompanyForRemoval(null);
  };

  const handleSelectCompanyForRemoval = (company) => {
    setSelectedCompanyForRemoval(company);
  };

  const handleRenameProject = async (projectId, newName) => {
    trackFeatureAction("project_rename_started", {
      project_id: projectId,
      new_name: newName,
    });

    const result = await companyService.updateProject(projectId, {
      name: newName,
    });
    if (result.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
      );
      setShowRenameModal(false);
      setProjectToEdit(null);

      trackFeatureAction("project_rename_success", {
        project_id: projectId,
        new_name: newName,
      });
    } else {
      trackFeatureAction("project_rename_failed", {
        project_id: projectId,
        new_name: newName,
        error_message: result.error,
      });
    }
    return result;
  };

  const handleDeleteProject = async (projectId) => {
    const project = projects.find((p) => p.id === projectId);

    trackFeatureAction("project_delete_started", {
      project_id: projectId,
      project_name: project?.name || "unknown",
    });

    const result = await companyService.deleteProject(projectId);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      setShowDeleteModal(false);
      setProjectToDelete(null);

      trackFeatureAction("project_delete_success", {
        project_id: projectId,
        project_name: project?.name || "unknown",
      });
    } else {
      trackFeatureAction("project_delete_failed", {
        project_id: projectId,
        project_name: project?.name || "unknown",
        error_message: result.error,
      });
    }
    return result;
  };

  const toggleDropdown = (type, id) => {
    if (type === "company") {
      setCompanyDropdowns((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    } else if (type === "project") {
      setProjectDropdowns((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    } else if (type === "employee") {
      setEmployeeDropdowns((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }
  };

  const closeAllDropdowns = () => {
    setCompanyDropdowns({});
    setProjectDropdowns({});
    setMemberDropdowns({});
    setContextMenu({ open: false, x: 0, y: 0, type: null, data: null });
  };

  if (loadingCompanies) {
    return <ScreenShimmer />;
  }

  return (
    <div className="h-full bg-[#fafafa] px-6 pt-2" onClick={closeAllDropdowns}>
      <div className="w-full mx-auto">
        {/* Title & Description */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Company Management
          </h1>
          <p className="text-gray-600">
            Browse companies, select a project, and manage members.
          </p>
        </div>

        {/* Main Container with Border */}
        <div className="border-2 border-gray-300 rounded-lg bg-white">
          {/* Company Tabs */}
          <div className="border-b border-gray-300 overflow-x-auto w-[calc(100vw-130px)] overflow-y-visible">
            {loadingCompanies ? (
              <CompanyTabShimmer />
            ) : (
              <div className="inline-flex whitespace-nowrap w-max min-w-full">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className={`relative min-w-[240px] border-r border-gray-300 last:border-r-0`}
                  >
                    <motion.button
                      onClick={() => setSelectedCompany(company)}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full px-4 py-3 text-left font-medium transition-colors cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{company.name}</span>
                        <button
                          onClick={(e) => {
                            if (
                              loadingCompanies ||
                              loadingProjects ||
                              loadingMembers
                            ) {
                              e.stopPropagation();
                              return;
                            }
                            openContextMenu(e, "company", { company });
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        >
                          <FaEllipsisV size={12} />
                        </button>
                      </div>
                    </motion.button>

                    {selectedCompany?.id === company.id && (
                      <motion.div
                        layoutId="companySelectedBar"
                        className="h-1 bg-primary"
                      />
                    )}

                    {/* Company Dropdown removed in favor of global context menu */}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex min-h-[calc(100vh-260px)]">
            {/* Projects Section (Left) - 40% */}
            <div className="w-2/5 border-r border-gray-300">
              <div className="p-4 border-b border-gray-300 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Projects</h3>
                  <p className="text-xs text-gray-500">
                    Showing all projects in the Company
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {loadingProjects ? (
                  <ProjectShimmer />
                ) : projects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaProjectDiagram
                      className="mx-auto mb-4 text-gray-300"
                      size={48}
                    />
                    <h4 className="font-medium text-gray-900 mb-2">
                      No Projects Found
                    </h4>
                    <p className="text-sm">
                      Create your first project to get started
                    </p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className={`relative border rounded-lg p-4 transition-all duration-200 ${
                        selectedProject?.id === project.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center">
                            {/* <input
                              type="checkbox"
                              checked={selectedProject?.id === project.id}
                              onChange={() => handleProjectSelect(project)}
                              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                            /> */}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-base">
                              {project.name}
                            </h4>
                            {project.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) =>
                            openContextMenu(e, "project", { project })
                          }
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        >
                          <FaEllipsisV size={12} />
                        </button>
                      </div>

                      {/* Project Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <FaUsers size={10} />
                            <span>{project.member_count || 0} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCalendar size={10} />
                            <span>{formatDate(project.created_at)}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      {/* Creator Info */}
                      {project.created_by_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>Created by {project.created_by_name}</span>
                        </div>
                      )}

                      {/* Project Dropdown removed in favor of global context menu */}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Members Section (Right) - 60% */}
            <div className="w-3/5">
              <div className="p-4 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Members</h3>
                    <p className="text-xs text-gray-500">
                      {selectedProject
                        ? `Showing members in ${selectedProject.name}`
                        : "Showing all company members"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {loadingMembers ? (
                  <MemberShimmer />
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaUsers className="mx-auto mb-4 text-gray-300" size={48} />
                    <h4 className="font-medium text-gray-900 mb-2">
                      No Members Found
                    </h4>
                    <p className="text-sm">
                      {selectedProject
                        ? "No members assigned to this project"
                        : "No members in this company"}
                    </p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="relative border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {member.user_name?.[0] ||
                                member.user_email?.[0] ||
                                "U"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                                {member.user_name || "Unknown User"}
                                {isCurrentUser(member.user_email) && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                    You
                                  </span>
                                )}
                              </h4>
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                  member.permission ?? member.role
                                )}`}
                              >
                                {getRoleIcon(member.permission ?? member.role)}
                                {(member.permission ?? member.role)
                                  ?.charAt(0)
                                  .toUpperCase() +
                                  (member.permission ?? member.role)?.slice(1)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              <FaEnvelope size={10} className="text-gray-400" />
                              <p className="text-sm text-gray-600 truncate">
                                {member.user_email}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <FaCalendar size={10} />
                                <span>
                                  Joined {formatDate(member.joined_at)}
                                </span>
                              </div>
                              {member.is_active && (
                                <div className="flex items-center gap-1">
                                  <FaCheck
                                    size={10}
                                    className="text-green-500"
                                  />
                                  <span className="text-green-600">Active</span>
                                </div>
                              )}
                            </div>
                            {member.project_name && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <FaProjectDiagram size={10} />
                                <span>Project: {member.project_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) =>
                            openContextMenu(e, "member", { member })
                          }
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        >
                          <FaEllipsisV size={12} />
                        </button>
                      </div>

                      {/* Member Dropdown removed in favor of global context menu */}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectRenameModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setProjectToEdit(null);
        }}
        project={projectToEdit}
        onRename={handleRenameProject}
      />

      <ProjectDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        project={projectToDelete}
        onDelete={handleDeleteProject}
      />

      <CompanyDetailsModal
        isOpen={showCompanyDetails}
        onClose={() => {
          setShowCompanyDetails(false);
          setCompanyToView(null);
        }}
        company={companyToView}
      />

      <ProjectDetailsModal
        isOpen={showProjectDetails}
        onClose={() => {
          setShowProjectDetails(false);
          setProjectToView(null);
        }}
        project={projectToView}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setUserToView(null);
        }}
        member={userToView}
      />

      <EditCompanyModal
        isOpen={showEditCompany}
        onClose={() => {
          setShowEditCompany(false);
          setCompanyToEdit(null);
        }}
        company={companyToEdit}
        onSave={handleSaveCompany}
      />

      <EditRoleModal
        isOpen={showEditRole}
        onClose={() => {
          setShowEditRole(false);
          setMemberToEdit(null);
        }}
        member={memberToEdit}
        onSave={handleSaveMemberRole}
      />

      <RemoveMemberModal
        isOpen={showRemoveMember}
        onClose={handleRemoveMemberModalClose}
        member={memberToRemove}
        selectedCompany={selectedCompanyForRemoval}
        onSelectCompany={handleSelectCompanyForRemoval}
        onConfirm={handleRemoveMember}
      />

      {/* Global Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu.open && (
          <>
            {/* backdrop for outside click */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="fixed inset-0 z-[200] bg-transparent"
              onClick={closeContextMenu}
            />
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.98, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[201] bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] overflow-hidden"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Company actions */}
              {contextMenu.type === "company" && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setCompanyToEdit(contextMenu.data.company);
                      setShowEditCompany(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <FaEdit size={12} />
                    Edit Company
                  </button>
                  <button
                    onClick={() => {
                      setCompanyToView(contextMenu.data.company);
                      setShowCompanyDetails(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <FaEye size={12} />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      // placeholder for delete company
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <FaTrash size={12} />
                    Delete Company
                  </button>
                </div>
              )}

              {/* Project actions */}
              {contextMenu.type === "project" && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProjectToEdit(contextMenu.data.project);
                      setShowRenameModal(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <FaEdit size={12} />
                    Rename Project
                  </button>
                  <button
                    onClick={() => {
                      setProjectToView(contextMenu.data.project);
                      setShowProjectDetails(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <FaEye size={12} />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setProjectToDelete(contextMenu.data.project);
                      setShowDeleteModal(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <FaTrash size={12} />
                    Delete Project
                  </button>
                </div>
              )}

              {/* Member actions */}
              {contextMenu.type === "member" && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMemberToEdit(contextMenu.data.member);
                      setShowEditRole(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <FaEdit size={12} />
                    Edit Role
                  </button>
                  <button
                    onClick={() => {
                      setUserToView(contextMenu.data.member);
                      setShowUserProfile(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <FaEye size={12} />
                    View Profile
                  </button>

                  <button
                    onClick={() => {
                      // Create a member object with single company to force confirmation step
                      const memberWithCompany = {
                        ...contextMenu.data.member,
                        companies: [selectedCompany],
                      };
                      setMemberToRemove(memberWithCompany);
                      setSelectedCompanyForRemoval(selectedCompany);
                      setShowRemoveMember(true);
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <FaTrash size={12} />
                    Remove Member
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
