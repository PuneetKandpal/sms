"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FaStar,
  FaChevronDown,
  FaPlus,
  FaUser,
  FaSignOutAlt,
  FaBuilding,
  FaProjectDiagram,
  FaUserShield,
  FaUsers,
  FaRobot,
} from "react-icons/fa";
// removed icon image import; using video tag
import api from "../../api/axios";
import { useSelection } from "../context/SelectionContext";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import { logout } from "../utils/auth";
import FeedbackModal from "./FeedbackModal";
import RobotImage from "../../../public/ai-agent/robot_image.png";
import Image from "next/image";
export default function Navbar() {
  const router = useRouter();

  // 🔍 DEBUG: Get user from localStorage on client side only
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log("Navbar user------->", parsedUser);
      setUser(parsedUser);
    }
  }, []);

  const [companies, setCompanies] = useState([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  const {
    selectedUser,
    setSelectedUser,
    selectedCompany,
    setSelectedCompany,
    refreshTrigger,
    setSelectedProject,
    selectedProject,
    usersRefreshTrigger,
    fetchCompanies,
    fetchProjectsData,
    projectsRefreshTrigger,
    refreshProjects,
  } = useSelection();

  const {
    runningAgentsCount,
    categorizedTasks,
    setIsDrawerOpen,
    statusNotifications,
    clearStatusNotifications,
  } = useTaskMonitor();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [videoErrored, setVideoErrored] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  console.log("pathname ---", pathname);

  const userDropdownRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const videoRef = useRef(null);
  const taskMonitorRef = useRef(null);

  useEffect(() => {
    if (user) {
      setSelectedUser(user);
    }
  }, [user?.id]);

  const hasProcessingTasks =
    categorizedTasks?.processing && categorizedTasks.processing.length > 0;

  // Control video play/pause based on processing tasks
  useEffect(() => {
    if (!videoRef.current) return;
    if (hasProcessingTasks) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hasProcessingTasks]);

  // Clear notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        taskMonitorRef.current &&
        !taskMonitorRef.current.contains(e.target) &&
        statusNotifications.length > 0
      ) {
        clearStatusNotifications();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusNotifications.length, clearStatusNotifications]);

  // Fetch companies and restore saved selections
  useEffect(() => {
    console.log(
      "[Debug] Navbar company fetch useEffect triggered, dependencies: ",
      [refreshTrigger]
    );
    const storedCompany = localStorage.getItem("selectedCompany");
    const storedProject = localStorage.getItem("selectedProject");
    console.log(
      "[Debug] Stored company:",
      storedCompany,
      "Stored project:",
      storedProject
    );

    const initCompanies = async () => {
      console.log("[Debug] Starting initCompanies");
      console.log("[Debug] Current selectedCompany:", selectedCompany);
      setIsCompaniesLoading(true);
      const { data, error } = await fetchCompanies();
      console.log("[Debug] initCompanies response:", { data, error });

      if (error) {
        console.error("[Debug Error] Failed to fetch companies:", error);
        setCompaniesError(error);
        setIsCompaniesLoading(false);
        return;
      }

      setCompanies(data);

      if (Array.isArray(data) && data.length > 0) {
        // Don't override if we already have a selected company
        if (selectedCompany) {
          console.log("[Debug] Company already selected, skipping init");
          setIsCompaniesLoading(false);
          return;
        }

        const newCompany = localStorage.getItem("newCompany");
        let selected = null;

        if (newCompany) {
          const parsedNew = JSON.parse(newCompany);
          selected = data.find((c) => c.id === parsedNew.id);

          if (selected) {
            setSelectedCompany(selected);
            localStorage.removeItem("newCompany");
            setIsCompaniesLoading(false);
            return;
          }
        }

        if (storedCompany) {
          const parsedCompany = JSON.parse(storedCompany);
          console.log(
            "🔍 [Navbar] parsedCompany from localStorage:",
            parsedCompany
          );
          const foundCompany = data.find((c) => c.id === parsedCompany.id);
          console.log("🔍 [Navbar] foundCompany:", foundCompany);
          const companyToSet = foundCompany || data[0];
          console.log("🔍 [Navbar] Setting selectedCompany to:", companyToSet);
          setSelectedCompany(companyToSet);
        } else {
          console.log(
            "🔍 [Navbar] No stored company, setting to first company:",
            data[0]
          );
          setSelectedCompany(data[0]);
        }
      }

      setIsCompaniesLoading(false);
    };

    initCompanies();
  }, [refreshTrigger]);

  // Save company to localStorage
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem("selectedCompany", JSON.stringify(selectedCompany));
    }
  }, [selectedCompany]);

  const LEGACY_PROJECT_KEY = "selectedProject";
  const PROJECT_MAP_KEY = "selectedProjectMap";

  const getStoredProjectIdForCompany = (companyId) => {
    if (!companyId) return null;
    try {
      const map = JSON.parse(localStorage.getItem(PROJECT_MAP_KEY) || "{}");
      if (map[companyId]) return map[companyId];

      // Fallback for legacy storage that only kept a single project object
      const legacyProjectRaw = localStorage.getItem(LEGACY_PROJECT_KEY);
      if (legacyProjectRaw) {
        const legacyProject = JSON.parse(legacyProjectRaw);
        if (legacyProject?.company_id === companyId) {
          return legacyProject.id;
        }
      }

      return null;
    } catch (err) {
      console.warn("Failed to parse selectedProjectMap", err);
      return null;
    }
  };

  const persistProjectSelection = (companyId, project) => {
    if (!companyId || !project?.id) return;
    try {
      const map = JSON.parse(localStorage.getItem(PROJECT_MAP_KEY) || "{}");
      map[companyId] = project.id;
      localStorage.setItem(PROJECT_MAP_KEY, JSON.stringify(map));

      // Persist full object for backwards compatibility / other screens
      const projectWithCompany = {
        ...project,
        company_id: project.company_id || companyId,
      };
      localStorage.setItem(LEGACY_PROJECT_KEY, JSON.stringify(projectWithCompany));
    } catch (err) {
      console.warn("Failed to persist project selection", err);
    }
  };

  // Save project to localStorage per company
  useEffect(() => {
    if (selectedCompany?.id && selectedProject) {
      persistProjectSelection(selectedCompany.id, selectedProject);
    }
  }, [selectedCompany?.id, selectedProject]);

  // Fetch projects for a company
  const fetchProjects = async (companyId) => {
    console.log("🔍 [fetchProjects] Called with companyId:", companyId);
    console.log("🔍 [fetchProjects] Current selectedCompany:", selectedCompany);
    
    if (!companyId) {
      setProjects([]);
      setSelectedProject(null);
      setIsProjectsLoading(false);
      return;
    }

    setIsProjectsLoading(true);
    setProjectsError(null);

    const { data, error } = await fetchProjectsData(companyId);

    if (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
      setProjectsError(error);
      setSelectedProject(null);
    } else {
      console.log("🔍 [fetchProjects] Projects loaded:", data);
      setProjects(data);

      let matchedProject = null;
      let isFreshlyCreatedProject = false;

      // 🔍 Check if a new project was just created
      const newProject = localStorage.getItem("newProject");
      console.log("newProject --------------------------------->>", newProject);
      console.log("data --------------------------------->>", data);
      if (newProject) {
        const parsed = JSON.parse(newProject);
        matchedProject = data.find((p) => p.id === parsed.id);
        if (matchedProject) {
          isFreshlyCreatedProject = true;
        }
        localStorage.removeItem("newProject");
      }

      // Look for stored project id mapped to this company
      if (!matchedProject && !isFreshlyCreatedProject) {
        const storedProjectId = getStoredProjectIdForCompany(companyId);
        if (storedProjectId) {
          matchedProject = data.find((p) => p.id === storedProjectId);
          console.log(
            "🔍 [fetchProjects] Restored project from map:",
            matchedProject
          );
        }
      }

      // If we already have a selected project that belongs to this company, keep it
      if (
        !matchedProject &&
        selectedProject &&
        selectedProject.company_id === companyId
      ) {
        matchedProject = data.find((p) => p.id === selectedProject.id);
        console.log(
          "🔍 [fetchProjects] Using existing selected project:",
          matchedProject
        );
      }

      // If we still don't have a match, use the first project
      if (!matchedProject && Array.isArray(data) && data.length > 0) {
        matchedProject = data[0];
        console.log("🔍 [fetchProjects] Using first project as fallback:", matchedProject);
      }

      // Set the project - either matched, existing, or null
      if (matchedProject) {
        setSelectedProject({
          ...matchedProject,
          company_id: matchedProject.company_id || companyId,
        });
      } else {
        setSelectedProject(null);
      }

      const proj = matchedProject || data[0];

      // ------------ project id consistence issue
      if (
        pathname.startsWith("/projects/") &&
        proj &&
        !isFreshlyCreatedProject
      ) {
        const qs = searchParams?.toString();
        const currentUrl = `${pathname}${qs ? `?${qs}` : ""}`;
        const newPath = pathname.replace(
          /^\/projects\/[^/]+/,
          `/projects/${proj.id}`
        );
        const targetUrl = `${newPath}${qs ? `?${qs}` : ""}`;
        if (targetUrl !== currentUrl) {
          router.push(targetUrl);
        }
      }
    }

    setIsProjectsLoading(false);
  };

  // Fetch projects when company changes
  useEffect(() => {
    if (selectedCompany?.id) {
      // Clear selected project when switching companies
      // but keep it in localStorage to restore if switching back
      const previousCompanyId = selectedProject?.company_id;
      if (previousCompanyId && previousCompanyId !== selectedCompany.id) {
        setSelectedProject(null);
      }
      fetchProjects(selectedCompany.id);
    } else {
      setProjects([]);
      setSelectedProject(null);
      setIsProjectsLoading(false);
    }
  }, [selectedCompany, projectsRefreshTrigger]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(e.target)
      ) {
        setShowCompanyDropdown(false);
      }
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(e.target)
      ) {
        setShowProjectDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
  };

  const handleNewOrganization = () => {
    setShowCompanyDropdown(false);
    router.push("/organization/new/");
  };

  const handleNewProject = () => {
    setShowProjectDropdown(false);
    router.push("/projects/new");
  };

  const handleNewUser = () => {
    setShowUserDropdown(false);
    router.push("/user/new");
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    logout();
  };

  const handleProjectSelect = (proj) => {
    setSelectedProject(proj);
    setShowProjectDropdown(false);

    // ------------ project id consistence issue
    if (pathname.startsWith("/projects/")) {
      const newPath = pathname.replace(
        /^\/projects\/[^/]+/,
        `/projects/${proj.id}`
      );
      const qs = searchParams?.toString();
      router.push(`${newPath}${qs ? `?${qs}` : ""}`);
    } else {
      const qs = searchParams?.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    }
  };

  return (
    <nav className="h-16 bg-[#fafafa] border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-6">
        <FaStar className="text-primary text-lg" />

        {/* Company Dropdown */}
        <div className="relative" ref={companyDropdownRef}>
          <button
            onClick={() => setShowCompanyDropdown((p) => !p)}
            className="flex items-center space-x-1 pl-5 text-black/40 hover:text-gray-500 transition"
          >
            <span className="text-sm font-medium">
              {selectedCompany
                ? selectedCompany.name
                : isCompaniesLoading
                ? "Loading…"
                : companiesError
                ? "Error"
                : "Company"}
            </span>
            <FaChevronDown className="text-sm" />
          </button>
          {showCompanyDropdown && (
            <div className="absolute mt-2 -ml-1.5 bg-white border border-gray-200 rounded-xl w-48 z-50 shadow-lg">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Organizations
              </div>
              <div className="max-h-48 max-w-56 overflow-y-auto overflow-x-hidden">
                {isCompaniesLoading ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Loading companies…
                  </div>
                ) : companiesError ? (
                  <div className="px-4 py-2 text-sm text-red-500">
                    Error: {companiesError}
                  </div>
                ) : companies.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No companies found
                  </div>
                ) : (
                  companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        console.log("company------->", company);
                        // Only change company if it's different from current
                        if (selectedCompany?.id !== company.id) {
                          setSelectedCompany(company);
                        }
                        setShowCompanyDropdown(false);
                      }}
                      className="w-full truncate text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      {company.name}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-gray-100">
                <button
                  onClick={handleNewOrganization}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
                >
                  <FaPlus size={12} className="text-gray-400" />
                  <span>New organization</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Dropdown */}
        <div className="relative" ref={projectDropdownRef}>
          <button
            onClick={() => setShowProjectDropdown((p) => !p)}
            className="flex items-center space-x-1 text-black/40 hover:text-gray-500 transition"
          >
            <span className="text-sm font-medium">
              {selectedProject
                ? selectedProject.name ||
                  selectedProject.title ||
                  selectedProject.project_name
                : isProjectsLoading
                ? "Loading…"
                : projectsError
                ? "Error"
                : selectedCompany
                ? "Project"
                : "Select Company First"}
            </span>
            <FaChevronDown className="text-sm" />
          </button>
          {showProjectDropdown && (
            <div className="absolute mt-2 -ml-1.5 bg-white border border-gray-200 rounded-xl w-48 z-50 shadow-lg">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Projects
              </div>
              <div className="max-h-48 scrollbar-hidden overflow-y-auto">
                {!selectedCompany ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Please select a company first
                  </div>
                ) : isProjectsLoading ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Loading projects…
                  </div>
                ) : projectsError ? (
                  <div className="px-4 py-2 text-sm text-red-500">
                    Error: {projectsError}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No projects found
                  </div>
                ) : (
                  projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleProjectSelect(proj)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      {proj.name ||
                        proj.title ||
                        proj.project_name ||
                        "Unnamed Project"}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-gray-100">
                <button
                  onClick={handleNewProject}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
                >
                  <FaPlus size={12} className="text-gray-400" />
                  <span>New project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Task Monitor Button */}
        <div className="relative" ref={taskMonitorRef}>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-1 hover:bg-gray-200 rounded-lg transition group"
            title="AI Agent Monitor"
          >
            <div className="w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              {runningAgentsCount > 0 && !videoErrored ? (
                <video
                  ref={videoRef}
                  src="/ai-agent/robotic.mp4"
                  width={34}
                  height={34}
                  muted
                  loop
                  playsInline
                  controls={false}
                  disablePictureInPicture
                  disableRemotePlayback
                  controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                  onError={() => setVideoErrored(true)}
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <div className="relative w-10 h-10">
                    <Image
                      src={RobotImage}
                      alt="AI Agent"
                      fill
                      sizes="40px"
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
            {runningAgentsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-sky-600 rounded-full px-1 shadow-sm">
                {runningAgentsCount}
              </span>
            )}
          </button>

          {/* Status Notifications Dropdown */}
          {statusNotifications.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 space-y-2">
                {statusNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                      notification.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : notification.status === "FAILED"
                        ? "bg-red-50 text-red-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        notification.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : notification.status === "FAILED"
                          ? "bg-red-500"
                          : "bg-blue-500 animate-pulse"
                      }`}
                    />
                    <span className="flex-1 font-medium truncate">
                      {notification.agentName}
                    </span>
                    <span className="text-xs opacity-70">
                      {notification.status === "COMPLETED"
                        ? "Done"
                        : notification.status === "FAILED"
                        ? "Failed"
                        : "Started"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="text-sm cursor-pointer font-semibold text-black/60 hover:text-gray-800 transition"
          >
            Feedback
          </button>
        </div>

        {/* Beta Release Chip */}
        <div className="relative group">
          <div className="px-[6px] py-[2px] border-1 border-sky-500 rounded-full flex items-center gap-1.5 cursor-default">
            <span className="text-xs font-bold text-sky-700 tracking-wide">
              beta
            </span>
          </div>
          {/* Hover Tooltip */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="font-semibold mb-1">Beta Release</div>
            <div className="text-gray-300 leading-relaxed">
              You're using an early version of Iriscale. Features are actively
              being developed and improved. Your feedback helps us build a
              better product!
            </div>
          </div>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown((p) => !p)}
            className="flex items-center space-x-1 p-1 hover:bg-gray-200 rounded transition"
          >
            {selectedUser ? (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
                {getInitials(selectedUser.full_name)}
              </div>
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-white">
                U
              </div>
            )}
            <span className="text-sm font-medium text-black/40">
              {selectedUser ? selectedUser.full_name : "User"}
            </span>
            <FaChevronDown className="text-sm" />
          </button>
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl w-48 z-50 shadow-lg">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Account
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/profile");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
              >
                <FaUser size={12} className="text-gray-400" />
                <span>Profile Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/companies");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
              >
                <FaBuilding size={12} className="text-gray-400" />
                <span>Companies</span>
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/people");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
              >
                <FaUsers size={12} className="text-gray-400" />
                <span>People</span>
              </button>
              {/* <button
                onClick={() => {
                  setShowUserDropdown(false);
                  router.push("/projects/manage");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
              >
                <FaProjectDiagram size={12} className="text-gray-400" />
                <span>Projects</span>
              </button>
              {selectedUser && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push("/admin/users");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
                >
                  <FaUserShield size={12} className="text-gray-400" />
                  <span>Admin Panel</span>
                </button>
              )} */}
              <div className="border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm text-gray-600"
                >
                  <FaSignOutAlt size={12} className="text-gray-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        maxStars={10}
      />
    </nav>
  );
}
