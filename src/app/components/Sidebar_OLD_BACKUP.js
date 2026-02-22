"use client";
import { useState, useEffect } from "react";
import {
  FaHome,
  FaFolderOpen,
  FaQuestionCircle,
  FaUsers,
  FaKey,
  FaTags,
  FaNewspaper,
  FaMagic,
  FaShareAlt,
  FaCalendarAlt,
  FaCog,
  FaRobot,
  FaSearch,
  FaSitemap,
} from "react-icons/fa";
import {
  TbLayoutSidebarLeftExpandFilled,
  TbLayoutSidebarLeftCollapseFilled,
} from "react-icons/tb";
import Link from "next/link";
import { useSelection } from "../context/SelectionContext";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";

// Mapping between API response keys and sidebar navigation keys
const SIDEBAR_MAPPING = {
  "Keyword Analysis": "keywords",
  Topics: "topics",
  "Product Information": "knowledge-base",
  "Your Articles": "articles",
  "AIO Answers": "aio-answers",
  "AI Optimization: Questions": "ai-optimizations",
  "Social Posts & More": "socials",
  "Opportunity Agent": "opportunity-agent",
  "Content Architecture": "content-architecture",
  // Add more mappings as needed
};

// Configuration for which routes should include domain/component params
const ROUTES_WITH_PARAMS = {
  keywords: true,
  topics: true,
  articles: true,
  "aio-answers": true,
  "ai-optimizations": true,
  "knowledge-base": true,
  socials: true,
  "opportunity-agent": false, // No domain/component params needed
  "content-architecture": false, // No domain/component params needed
  "social-history": false, // Example of route without params
};

function SectionHeader({
  sectionKey,
  label,
  symbol,
  openSections,
  onToggle,
  className,
}) {
  const isOpen = openSections?.[sectionKey];

  return (
    <button
      type="button"
      onClick={() => onToggle(sectionKey)}
      className={className}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs">{symbol}</span>
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-xs">{isOpen ? "-" : "+"}</span>
    </button>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [domainComponents, setDomainComponents] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    home: true,
    intelligence: true,
    strategy: true,
    content: true,
    opportunity: true,
    promote: true,
    settings: true,
  });

  const router = useRouter();
  const pathname = usePathname();
  const { selectedProject } = useSelection();

  // Fetch domain components on component mount
  useEffect(() => {
    const fetchDomainComponents = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/auth/domain-component/");

        console.log("response.data------->", response.data);
        setDomainComponents(response.data);
      } catch (error) {
        console.error("Error fetching domain components:", error);
        toast.error("Failed to load navigation data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomainComponents();
  }, []);

  // Helper function to build URL with search params
  const buildUrlWithParams = (basePath, routeKey) => {
    if (!ROUTES_WITH_PARAMS[routeKey] || !domainComponents) {
      return basePath;
    }

    // Find the corresponding API key for this route
    const apiKey = Object.keys(SIDEBAR_MAPPING).find(
      (key) => SIDEBAR_MAPPING[key] === routeKey
    );

    if (!apiKey || !domainComponents[apiKey]) {
      return basePath;
    }

    const { domain_id, component_id } = domainComponents[apiKey];
    const params = new URLSearchParams();

    if (domain_id) params.append("domain", domain_id);
    if (component_id) params.append("component", component_id);

    return params.toString() ? `${basePath}?${params.toString()}` : basePath;
  };

  // Helper function to handle navigation
  const handleNavigation = (path, routeKey) => {
    if (!selectedProject?.id) {
      toast.error("Please select a project first");
      return;
    }

    if (isLoading) {
      toast.error("Please wait for navigation data to load");
      return;
    }

    const fullPath = `/projects/${selectedProject.id}/${path}`;
    const urlWithParams = buildUrlWithParams(fullPath, routeKey);
    router.push(urlWithParams);
  };

  // Determine active state for nav items based on current pathname
  const isActive = (key) => {
    if (!pathname) return false;
    switch (key) {
      case "home":
        return pathname === "/";
      case "projects":
        return /^\/projects\/[^/]+\/overview/.test(pathname);
      case "knowledge-base":
        return /^\/projects\/[^/]+\/manage/.test(pathname);
      case "keywords":
        return /^\/projects\/[^/]+\/keywords/.test(pathname);
      case "topics":
        return /^\/projects\/[^/]+\/topic/.test(pathname);
      case "articles":
        return /^\/projects\/[^/]+\/articles/.test(pathname);
      case "ai-optimizations":
        return /^\/projects\/[^/]+\/ai-optimizations/.test(pathname);
      case "aio-answers":
        return /^\/projects\/[^/]+\/aio-answers/.test(pathname);
      case "opportunity-agent":
        return /^\/projects\/[^/]+\/opportunity-agent/.test(pathname);
      case "content-architecture":
        return /^\/projects\/[^/]+\/content-architecture/.test(pathname);
      case "socials":
        return /^\/projects\/[^/]+\/socials/.test(pathname);
      case "social-history":
        return /^\/projects\/[^/]+\/social-history/.test(pathname);
      case "connections":
        return pathname.startsWith("/connections");
      case "social-scheduler":
        return pathname.startsWith("/social-scheduler");
      case "companies":
        return pathname === "/companies";
      default:
        return false;
    }
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`
        fixed left-0 top-0 z-40
        bg-[#fafafa]
        text-black/40 font-medium
        h-screen
        transition-all duration-300 border-r border-gray-200
        flex flex-col
        ${collapsed ? "w-16" : "w-64"}
        ${isLoading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      {/* Header / Toggle Bar */}
      <div
        className={`
          h-16
          flex items-center
          ${collapsed ? "justify-center" : "justify-between px-4"}
          border-b border-gray-200
        `}
      >
        {collapsed ? (
          <div className="relative">
            <TbLayoutSidebarLeftExpandFilled className="text-2xl text-primary" />
            {isLoading && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <span className="text-xl text-primary font-bold">Dashboard</span>
              {isLoading && (
                <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="focus:outline-none"
            >
              <TbLayoutSidebarLeftCollapseFilled className="text-2xl text-primary" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 py-4">
        {/* Home */}
        {!collapsed && (
          <SectionHeader
            sectionKey="home"
            label="Home"
            symbol="▢"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 text-[11px] tracking-wide text-gray-500 uppercase"
          />
        )}

        {/* Overview Dashboard (was Projects) */}
        <div
          onClick={() => {
            if (!selectedProject?.id) {
              toast.error("Please select a project first");
              return;
            }
            if (isLoading) {
              toast.error("Please wait for navigation data to load");
              return;
            }
            router.push(`/projects/${selectedProject?.id}/overview`);
          }}
          className={`
            flex items-center cursor-pointer
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            hover:bg-gray-50
            transition-colors
            rounded-r-full mr-4
            ${!collapsed && !openSections.home ? "hidden" : ""}
            ${isLoading ? "cursor-not-allowed" : ""}
            ${isActive("projects") ? "bg-blue-50" : ""}
          `}
        >
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaFolderOpen
              size={18}
              className={`${
                isActive("projects") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("projects") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Overview Dashboard
            </span>
          )}
        </div>

        {/* INTELLIGENCE & RESEARCH */}
        {!collapsed && (
          <SectionHeader
            sectionKey="intelligence"
            label="Intelligence & Research"
            symbol="◈"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 mt-2 text-[11px] tracking-wide text-gray-500 uppercase"
          />
        )}

        <AnimatePresence initial={false}>
          {!collapsed && openSections.intelligence && (
            <motion.div
              key="intelligence-section"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-1"
            >
              {/* Knowledge Base */}
              <div
                onClick={() => {
                  if (!selectedProject?.id) {
                    toast.error("Please select a project first");
                    return;
                  }
                  if (isLoading) {
                    toast.error("Please wait for navigation data to load");
                    return;
                  }
                  handleNavigation("manage", "knowledge-base");
                }}
                className={`
                  flex items-center cursor-pointer
                  ${collapsed ? "justify-center" : "justify-start pl-6"}
                  h-9
                  hover:bg-gray-50
                  transition-colors
                  rounded-r-full mr-4
                  ${isLoading ? "cursor-not-allowed" : ""}
                  ${isActive("knowledge-base") ? "bg-blue-50" : ""}
                `}
              >
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaQuestionCircle
                    size={18}
                    className={`${
                      isActive("knowledge-base")
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  />
                </motion.span>
                {!collapsed && (
                  <span
                    className={`ml-3 text-[13px] font-medium whitespace-nowrap ${
                      isActive("knowledge-base")
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    Knowledge Base
                  </span>
                )}
              </div>

              {/* Keyword Repository */}
              <div
                onClick={() => {
                  if (!selectedProject?.id) {
                    toast.error("Please select a project first");
                    return;
                  }
                  handleNavigation("keywords", "keywords");
                }}
                className={`
                  flex items-center cursor-pointer relative
                  ${collapsed ? "justify-center" : "justify-start pl-6"}
                  h-9
                  transition-colors
                  rounded-r-full mr-4
                  ${
                    !selectedProject?.id
                      ? "opacity-50 cursor-not-allowed"
                      : isLoading
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }
                  ${isActive("keywords") ? "bg-blue-50" : ""}
                `}
                title={!selectedProject?.id ? "No project selected" : ""}
              >
                <motion.span
                  whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
                  whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaKey
                    size={18}
                    className={`${
                      isActive("keywords") ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </motion.span>
                {!collapsed && (
                  <span
                    className={`ml-3 text-[13px] font-medium whitespace-nowrap ${
                      isActive("keywords") ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    Keyword Repository
                  </span>
                )}
              </div>

              {/* Search Ranking */}
              <div
                onClick={() => {
                  if (!selectedProject?.id) {
                    toast.error("Please select a project first");
                    return;
                  }
                  if (isLoading) {
                    toast.error("Please wait for navigation data to load");
                    return;
                  }
                  router.push(`/projects/${selectedProject.id}/search-ranking`);
                }}
                className={`
                  flex items-center cursor-pointer
                  ${collapsed ? "justify-center" : "justify-start pl-6"}
                  h-9
                  transition-colors
                  rounded-r-full mr-4
                  ${
                    !selectedProject?.id
                      ? "opacity-50 cursor-not-allowed"
                      : isLoading
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }
                  ${pathname?.includes("/search-ranking") ? "bg-blue-50" : ""}
                `}
                title={!selectedProject?.id ? "No project selected" : ""}
              >
                <motion.span
                  whileHover={
                    !selectedProject?.id || isLoading ? {} : { scale: 1.08 }
                  }
                  whileTap={
                    !selectedProject?.id || isLoading ? {} : { scale: 0.95 }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaSearch
                    size={18}
                    className={
                      pathname?.includes("/search-ranking")
                        ? "text-blue-600"
                        : "text-gray-600"
                    }
                  />
                </motion.span>
                {!collapsed && (
                  <span
                    className={
                      pathname?.includes("/search-ranking")
                        ? "ml-3 text-[13px] font-medium whitespace-nowrap text-blue-700"
                        : "ml-3 text-[13px] font-medium whitespace-nowrap text-gray-700"
                    }
                  >
                    Search Ranking
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STRATEGY & PLANNING */}
        {!collapsed && (
          <SectionHeader
            sectionKey="strategy"
            label="Strategy & Planning"
            symbol="⬡"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 mt-2 text-[11px] tracking-wide text-gray-500 uppercase"
          />
        )}

        {/* Topics */}
        <div
          onClick={() => {
            if (!selectedProject?.id) {
              toast.error("Please select a project first");
              return;
            }
            handleNavigation("topic", "topics");
          }}
          className={`
            flex items-center cursor-pointer relative
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            transition-colors
            rounded-r-full mr-4
            ${
              !selectedProject?.id
                ? "opacity-50 cursor-not-allowed"
                : isLoading
                ? "cursor-not-allowed"
                : "hover:bg-gray-50"
            }
            ${!collapsed && !openSections.strategy ? "hidden" : ""}
            ${isActive("topics") ? "bg-blue-50" : ""}
          `}
          title={!selectedProject?.id ? "No project selected" : ""}
        >
          <motion.span
            whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
            whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaTags
              size={18}
              className={`${
                isActive("topics") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("topics") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Topics
            </span>
          )}
        </div>

        {/* CONTENT CREATION */}
        {!collapsed && (
          <SectionHeader
            sectionKey="content"
            label="Content Creation"
            symbol="✎"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 mt-2 text-sm tracking-wide text-gray-500 uppercase"
          />
        )}

        <AnimatePresence initial={false}>
          {!collapsed && openSections.content && (
            <motion.div
              key="content-section"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-1"
            >
              {/* Articles */}
              <div
                onClick={() => {
                  if (!selectedProject?.id) {
                    toast.error("Please select a project first");
                    return;
                  }
                  handleNavigation("articles", "articles");
                }}
                className={`
                  flex items-center cursor-pointer relative
                  ${collapsed ? "justify-center" : "justify-start pl-6"}
                  h-9
                  transition-colors
                  rounded-r-full mr-4
                  ${
                    !selectedProject?.id
                      ? "opacity-50 cursor-not-allowed"
                      : isLoading
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }
                  ${isActive("articles") ? "bg-blue-50" : ""}
                `}
                title={!selectedProject?.id ? "No project selected" : ""}
              >
                <motion.span
                  whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
                  whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaNewspaper
                    size={18}
                    className={`${
                      isActive("articles") ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </motion.span>
                {!collapsed && (
                  <span
                    className={`ml-3 text-xs font-medium whitespace-nowrap ${
                      isActive("articles") ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    Articles
                  </span>
                )}
              </div>

              {/* AI Optimization Questions */}
              <div
                onClick={() => {
                  if (!selectedProject?.id) {
                    toast.error("Please select a project first");
                    return;
                  }
                  handleNavigation("ai-optimizations", "ai-optimizations");
                }}
                className={`
                  flex items-center cursor-pointer relative
                  ${collapsed ? "justify-center" : "justify-start pl-6"}
                  h-9
                  transition-colors
                  rounded-r-full mr-4
                  ${
                    !selectedProject?.id
                      ? "opacity-50 cursor-not-allowed"
                      : isLoading
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }
                  ${isActive("ai-optimizations") ? "bg-blue-50" : ""}
                `}
                title={!selectedProject?.id ? "No project selected" : ""}
              >
                <motion.span
                  whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
                  whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaQuestionCircle
                    size={18}
                    className={`${
                      isActive("ai-optimizations")
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  />
                </motion.span>
                {!collapsed && (
                  <span
                    className={`ml-3 text-xs font-medium whitespace-nowrap ${
                      isActive("ai-optimizations")
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    AI Optimization Questions
                  </span>
                )}
              </div>

              {/* AI Optimization Answers */}
              <div
                onClick={() => {
                  if (!selectedProject?.id) {
                    toast.error("Please select a project first");
                    return;
                  }
                  handleNavigation("aio-answers", "aio-answers");
                }}
                className={`
                  flex items-center cursor-pointer relative
                  ${collapsed ? "justify-center" : "justify-start pl-6"}
                  h-9
                  transition-colors
                  rounded-r-full mr-4
                  ${
                    !selectedProject?.id
                      ? "opacity-50 cursor-not-allowed"
                      : isLoading
                      ? "cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }
                  ${isActive("aio-answers") ? "bg-blue-50" : ""}
                `}
                title={!selectedProject?.id ? "No project selected" : ""}
              >
                <motion.span
                  whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
                  whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaMagic
                    size={18}
                    className={`${
                      isActive("aio-answers")
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  />
                </motion.span>
                {!collapsed && (
                  <span
                    className={`ml-3 text-xs font-medium whitespace-nowrap ${
                      isActive("aio-answers")
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    AI Optimization Answers
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <SectionHeader
            sectionKey="opportunity"
            label="Opportunity & Engagement"
            symbol="◯"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 mt-2 text-[11px] tracking-wide text-gray-500 uppercase"
          />
        )}

        <div
          onClick={() => {
            if (!selectedProject?.id) {
              toast.error("Please select a project first");
              return;
            }
            handleNavigation("opportunity-agent", "opportunity-agent");
          }}
          className={`
            flex items-center cursor-pointer relative
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            transition-colors
            rounded-r-full mr-4
            ${
              !selectedProject?.id
                ? "opacity-50 cursor-not-allowed"
                : isLoading
                ? "cursor-not-allowed"
                : "hover:bg-gray-50"
            }
            ${!collapsed && !openSections.opportunity ? "hidden" : ""}
            ${isActive("opportunity-agent") ? "bg-blue-50" : ""}
          `}
          title={!selectedProject?.id ? "No project selected" : ""}
        >
          <motion.span
            whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
            whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaRobot
              size={18}
              className={`${
                isActive("opportunity-agent")
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("opportunity-agent")
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              Opportunity Agent
            </span>
          )}
        </div>

        {/* Content Architecture */}
        <div
          onClick={() => {
            if (!selectedProject?.id) {
              toast.error("Please select a project first");
              return;
            }
            handleNavigation("content-architecture", "content-architecture");
          }}
          className={`
            flex items-center cursor-pointer relative
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            transition-colors
            rounded-r-full mr-4
            ${
              !selectedProject?.id
                ? "opacity-50 cursor-not-allowed"
                : isLoading
                ? "cursor-not-allowed"
                : "hover:bg-gray-50"
            }
            ${!collapsed && !openSections.strategy ? "hidden" : ""}
            ${isActive("content-architecture") ? "bg-blue-50" : ""}
          `}
          title={!selectedProject?.id ? "No project selected" : ""}
        >
          <motion.span
            whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
            whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaSitemap
              size={18}
              className={`${
                isActive("content-architecture")
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("content-architecture")
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              Content Architecture
            </span>
          )}
        </div>

        {!collapsed && (
          <SectionHeader
            sectionKey="promote"
            label="Promote"
            symbol="▸"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 mt-2 text-[11px] tracking-wide text-gray-500 uppercase"
          />
        )}

        <div
          onClick={() => {
            if (!selectedProject?.id) {
              toast.error("Please select a project first");
              return;
            }
            handleNavigation("socials", "socials");
          }}
          className={`
            flex items-center cursor-pointer relative
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            transition-colors
            rounded-r-full mr-4
            ${
              !selectedProject?.id
                ? "opacity-50 cursor-not-allowed"
                : isLoading
                ? "cursor-not-allowed"
                : "hover:bg-gray-50"
            }
            ${!collapsed && !openSections.promote ? "hidden" : ""}
            ${isActive("socials") ? "bg-blue-50" : ""}
          `}
          title={!selectedProject?.id ? "No project selected" : ""}
        >
          <motion.span
            whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
            whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaShareAlt
              size={18}
              className={`${
                isActive("socials") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("socials") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Social Posts
            </span>
          )}
        </div>

        <div
          onClick={() => {
            if (!selectedProject?.id) {
              toast.error("Please select a project first");
              return;
            }
            handleNavigation("social-history", "social-history");
          }}
          className={`
            flex items-center cursor-pointer relative
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            transition-colors
            rounded-r-full mr-4
            ${
              !selectedProject?.id
                ? "opacity-50 cursor-not-allowed"
                : isLoading
                ? "cursor-not-allowed"
                : "hover:bg-gray-50"
            }
            ${!collapsed && !openSections.promote ? "hidden" : ""}
            ${isActive("social-history") ? "bg-blue-50" : ""}
          `}
          title={!selectedProject?.id ? "No project selected" : ""}
        >
          <motion.span
            whileHover={!selectedProject?.id ? {} : { scale: 1.08 }}
            whileTap={!selectedProject?.id ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaNewspaper
              size={18}
              className={`${
                isActive("social-history") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("social-history") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Social Posts History
            </span>
          )}
        </div>

        <Link
          href="/connections"
          className={`
            flex items-center cursor-pointer
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            hover:bg-gray-50
            transition-colors
            rounded-r-full mr-4
            ${!collapsed && !openSections.promote ? "hidden" : ""}
            ${isActive("connections") ? "bg-blue-50" : ""}
          `}
        >
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaShareAlt
              size={18}
              className={`${
                isActive("connections") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("connections") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Connections
            </span>
          )}
        </Link>

        <Link
          href="/social-scheduler"
          className={`
            flex items-center cursor-pointer
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            hover:bg-gray-50
            transition-colors
            rounded-r-full mr-4
            ${!collapsed && !openSections.promote ? "hidden" : ""}
            ${isActive("social-scheduler") ? "bg-blue-50" : ""}
          `}
        >
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaCalendarAlt
              size={18}
              className={`${
                isActive("social-scheduler") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("social-scheduler") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Social Scheduler
            </span>
          )}
        </Link>

        {/* SETTINGS */}
        {!collapsed && (
          <SectionHeader
            sectionKey="settings"
            label="Settings"
            symbol="⚙"
            openSections={openSections}
            onToggle={toggleSection}
            className="w-full flex items-center justify-between px-4 py-1 mt-2 text-[11px] tracking-wide text-gray-500 uppercase"
          />
        )}

        {/* Projects & Teams */}
        <Link
          href="/companies"
          className={`
            flex items-center cursor-pointer
            ${collapsed ? "justify-center" : "justify-start pl-4"}
            h-10
            hover:bg-gray-50
            transition-colors
            rounded-r-full mr-4
            ${!collapsed && !openSections.settings ? "hidden" : ""}
            ${isActive("companies") ? "bg-blue-50" : ""}
          `}
        >
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <FaCog
              size={18}
              className={`${
                isActive("companies") ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </motion.span>
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium whitespace-nowrap ${
                isActive("companies") ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Projects & Teams
            </span>
          )}
        </Link>
      </nav>
    </aside>
  );
}
