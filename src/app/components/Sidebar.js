"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSelection } from "../context/SelectionContext";
import { useFeatureExploration } from "../context/FeatureExplorationContext";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import Popover from "@mui/material/Popover";
import {
  Home,
  LayoutDashboard,
  Database,
  Key,
  Search,
  Network,
  Tags,
  HelpCircle,
  FileText,
  Lightbulb,
  MessageSquare,
  Bot,
  Share2,
  History,
  Calendar,
  Users,
  UserCog,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Swords,
  Compass,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import {
  FEATURE_EXPLORATION_SECTIONS,
  TOTAL_FEATURE_COUNT,
} from "../constants/featureExploration";

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
  "opportunity-agent": false,
  "content-architecture": false,
  "social-history": false,
  "competitor-analysis": false,
};

// Sidebar navigation structure
const SIDEBAR_STRUCTURE = [
  {
    id: "home",
    label: "HOME",
    icon: Home,
    children: [
      {
        id: "feature-exploration",
        label: "Feature Exploration",
        icon: Compass,
        href: "/",
        routeKey: "home",
        trackingKey: "home",
      },
    ],
  },
  {
    id: "intelligence",
    label: "INTELLIGENCE & RESEARCH",
    icon: Database,
    children: [
      {
        id: "knowledge-base",
        label: "Knowledge Base",
        icon: Database,
        path: "manage",
        routeKey: "knowledge-base",
        trackingKey: "knowledge_base",
      },
      {
        id: "keywords",
        label: "Keyword Repository",
        icon: Key,
        path: "keywords",
        routeKey: "keywords",
        trackingKey: "keywords",
      },
      {
        id: "search-ranking",
        label: "Search Ranking",
        icon: Search,
        path: "search-ranking",
        routeKey: "search-ranking",
        trackingKey: "search_ranking",
      },
      {
        id: "competitor-analysis",
        label: "Competitor Analysis",
        icon: Swords,
        path: "competitor-analysis",
        routeKey: "competitor-analysis",
        trackingKey: "competitor_analysis",
      },
    ],
  },
  {
    id: "strategy",
    label: "STRATEGY & PLANNING",
    icon: Network,
    children: [
      {
        id: "content-architecture",
        label: "Content Architecture",
        icon: Network,
        path: "content-architecture",
        routeKey: "content-architecture",
        trackingKey: "content_architecture",
      },
      {
        id: "topics",
        label: "Topic Strategy",
        icon: Tags,
        path: "topic",
        routeKey: "topics",
        trackingKey: "topics",
      },
      {
        id: "ai-optimizations",
        label: "AI Optimization Questions",
        icon: HelpCircle,
        path: "ai-optimizations",
        routeKey: "ai-optimizations",
        trackingKey: "ai_optimizations",
      },
    ],
  },
  {
    id: "content",
    label: "CONTENT CREATION",
    icon: FileText,
    children: [
      {
        id: "articles",
        label: "Articles",
        icon: FileText,
        path: "articles",
        routeKey: "articles",
        trackingKey: "articles",
      },
      {
        id: "aio-answers",
        label: "AI Optimization Answers",
        icon: Lightbulb,
        path: "aio-answers",
        routeKey: "aio-answers",
        trackingKey: "aio_answers",
      },
    ],
  },
  {
    id: "opportunity",
    label: "OPPORTUNITY & ENGAGEMENT",
    icon: MessageSquare,
    children: [
      {
        id: "opportunity-agent",
        label: "Opportunity Agent",
        icon: Bot,
        path: "opportunity-agent",
        routeKey: "opportunity-agent",
        trackingKey: "opportunity_agent",
      },
    ],
  },
  {
    id: "promote",
    label: "PROMOTE",
    icon: Share2,
    children: [
      {
        id: "socials",
        label: "Social Posts",
        icon: Share2,
        path: "socials",
        routeKey: "socials",
        trackingKey: "socials",
      },
      {
        id: "social-scheduler",
        label: "Social Scheduler",
        icon: Calendar,
        href: "/social-scheduler",
        trackingKey: "social_scheduler",
      },
      {
        id: "connections",
        label: "Connections",
        icon: Users,
        href: "/connections",
        routeKey: "connections",
        trackingKey: "connections",
      },
    ],
  },
  {
    id: "settings",
    label: "SETTINGS",
    icon: Settings,
    children: [
      {
        id: "companies",
        label: "Projects & Teams",
        icon: UserCog,
        href: "/companies",
        trackingKey: "companies",
      },
    ],
  },
];

const buildSectionState = (value) =>
  SIDEBAR_STRUCTURE.reduce((acc, section) => {
    acc[section.id] = value;
    return acc;
  }, {});

// Section Header Component
function SectionHeader({ section, isOpen, onToggle, collapsed }) {
  const Icon = section.icon;

  if (collapsed) return null;

  return (
    <button
      type="button"
      onClick={() => onToggle(section.id)}
      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-500 hover:text-gray-700 transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-gray-400" />
        <span>{section.label}</span>
      </div>
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight size={14} className="text-gray-400" />
      </motion.div>
    </button>
  );
}

// Nav Item Component
function NavItem({ item, isActive, onClick, collapsed, isChild = false }) {
  const Icon = item.icon;

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 cursor-pointer
        transition-all duration-200
        ${
          collapsed
            ? "justify-center px-3 py-3"
            : isChild
            ? "pl-9 pr-3 py-2"
            : "px-3 py-2.5"
        }
        ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-50"
        }
        ${collapsed ? "" : "rounded-lg mx-2"}
      `}
    >
      {/* Vertical line for child items */}
      {!collapsed && isChild && (
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
      )}

      {/* Icon */}
      <motion.div
        whileHover={{ scale: collapsed ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative z-10"
      >
        <Icon
          size={18}
          className={`${
            isActive ? "text-blue-600" : "text-gray-600"
          } transition-colors`}
        />
      </motion.div>

      {/* Label */}
      {!collapsed && (
        <span
          className={`text-sm font-medium whitespace-nowrap ${
            isActive ? "text-blue-700" : "text-gray-700"
          }`}
        >
          {item.label}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.label}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [domainComponents, setDomainComponents] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState(() =>
    buildSectionState(true)
  );
  const [engagementStats, setEngagementStats] = useState({
    explored: 0,
    total: 0,
    percentage: 0,
  });
  const [engagementAnchorEl, setEngagementAnchorEl] = useState(null);

  const router = useRouter();
  const pathname = usePathname();
  const { selectedProject } = useSelection();
  const {
    getExplorationStats,
    isLoading: featureLogLoading,
    isFeatureExplored,
    totalFeatureCount,
  } = useFeatureExploration();

  const featureSectionsWithStatus = useMemo(() => {
    return FEATURE_EXPLORATION_SECTIONS.map((section) => {
      const items = section.items.map((item) => ({
        ...item,
        explored: isFeatureExplored([item.key]),
      }));
      const exploredCount = items.filter((item) => item.explored).length;
      return { ...section, items, exploredCount };
    });
  }, [isFeatureExplored, featureLogLoading]);

  const flatFeatureList = useMemo(
    () =>
      featureSectionsWithStatus.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          section: section.label || section.section,
        }))
      ),
    [featureSectionsWithStatus]
  );

  // Fetch domain components on component mount
  useEffect(() => {
    const fetchDomainComponents = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/auth/domain-component/");
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

  // Determine active state for nav items
  const isActive = (routeKey) => {
    if (!pathname) return false;

    const patterns = {
      home: /^\/$/,
      "knowledge-base": /^\/projects\/[^/]+\/manage/,
      keywords: /^\/projects\/[^/]+\/keywords/,
      "search-ranking": /^\/projects\/[^/]+\/search-ranking/,
      "competitor-analysis": /^\/projects\/[^/]+\/competitor-analysis/,
      topics: /^\/projects\/[^/]+\/topic/,
      "ai-optimizations": /^\/projects\/[^/]+\/ai-optimizations/,
      "content-architecture": /^\/projects\/[^/]+\/content-architecture/,
      articles: /^\/projects\/[^/]+\/articles/,
      "aio-answers": /^\/projects\/[^/]+\/aio-answers/,
      "opportunity-agent": /^\/projects\/[^/]+\/opportunity-agent/,
      socials: /^\/projects\/[^/]+\/socials/,
      "social-history": /^\/projects\/[^/]+\/social-history/,
      connections: /^\/connections/,
      "social-scheduler": /^\/social-scheduler/,
      companies: /^\/companies/,
    };

    return patterns[routeKey]?.test(pathname) || false;
  };

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleAllSections = (shouldOpen) => {
    setOpenSections((prev) => {
      const alreadySet = Object.values(prev).every(
        (value) => value === shouldOpen
      );
      return alreadySet ? prev : buildSectionState(shouldOpen);
    });
  };

  const handleItemClick = (item) => {
    // Navigate immediately
    if (item.href) {
      router.push(item.href);
    } else if (item.path) {
      handleNavigation(item.path, item.routeKey);
    }
  };

  useEffect(() => {
    const stats = getExplorationStats();
    console.log("[Sidebar] raw engagement stats", stats);
    if (stats.total === 0) {
      stats.total = totalFeatureCount || TOTAL_FEATURE_COUNT;
    }
    console.log("[Sidebar] normalized engagement stats", stats);
    setEngagementStats(stats);
  }, [getExplorationStats, featureLogLoading, totalFeatureCount]);

  const handleEngagementClick = (event) => {
    console.log("[Sidebar] engagement chip clicked", {
      collapsed,
      anchorExists: Boolean(engagementAnchorEl),
    });
    if (engagementAnchorEl) {
      setEngagementAnchorEl(null);
    } else {
      setEngagementAnchorEl(event.currentTarget);
    }
  };

  const closeEngagementPopover = () => setEngagementAnchorEl(null);

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      onFocusCapture={() => console.log("[Sidebar] focus capture")}
      onBlurCapture={() => console.log("[Sidebar] blur capture")}
      className={`
        fixed left-0 top-0 z-40
        bg-white border-r border-gray-200
        h-screen overflow-x-hidden
        transition-all duration-300
        flex flex-col
        ${collapsed ? "w-16" : "w-72"}
        ${isLoading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div
          className={`flex items-center transition-all duration-200 ${
            collapsed ? "justify-center w-full" : "gap-2"
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          {!collapsed && (
            <span className="ml-2 font-bold text-lg">Dashboard</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 sidebar-scroll">
        {SIDEBAR_STRUCTURE.map((section) => (
          <div key={section.id}>
            <SectionHeader
              section={section}
              isOpen={openSections[section.id]}
              onToggle={toggleSection}
              collapsed={collapsed}
            />

            <AnimatePresence initial={false}>
              {(collapsed || openSections[section.id]) && (
                <motion.div
                  initial={collapsed ? false : { opacity: 0, height: 0 }}
                  animate={collapsed ? false : { opacity: 1, height: "auto" }}
                  exit={collapsed ? false : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {section.children.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      isActive={isActive(item.routeKey || item.id)}
                      onClick={() => handleItemClick(item)}
                      collapsed={collapsed}
                      isChild={true}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Engagement Chip */}
      {engagementStats.total > 0 && (
        <div className="px-3 pb-3 flex justify-center">
          {collapsed ? (
            <button
              type="button"
              onClick={handleEngagementClick}
              className="w-10 h-10 mx-auto rounded-full bg-[#111827] shadow-sm shadow-black/20 transition-all duration-200 text-white flex items-center justify-center border border-white/10 hover:bg-[#161f30] cursor-pointer"
              title={`Getting started ${engagementStats.percentage}%`}
            >
              <Sparkles size={18} className="text-white/70" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEngagementClick}
              className="w-[220px] h-10 rounded-full px-6 flex items-center justify-between transition-colors duration-200 cursor-pointer focus:outline-none"
              style={{
                backgroundColor: "#0b1120",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 15px 25px rgba(15, 23, 42, 0.45)",
                color: "#ffffff",
              }}
            >
              <span className="text-[12px] font-semibold tracking-[0.2em] text-white/80">
                Getting started
              </span>
              <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse"></span>
              <span className="text-xs font-semibold text-white">
                {engagementStats.percentage}%
              </span>
            </button>
          )}
        </div>
      )}

      <Popover
        open={Boolean(engagementAnchorEl)}
        anchorEl={engagementAnchorEl}
        onClose={closeEngagementPopover}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 320,
            bgcolor: "#0b1120",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 45px rgba(0,0,0,0.45)",
            backdropFilter: "blur(12px)",
            overflow: "hidden",
          },
        }}
      >
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
            Getting started
          </p>
          <p className="text-sm font-semibold mt-0.5">
            {engagementStats.percentage}% explored
          </p>
          <p className="text-[10px] text-white/50">
            {engagementStats.explored} of {engagementStats.total} features
          </p>
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5 feature-popover-scroll">
          {flatFeatureList.map((item) => (
            <button
              type="button"
              key={item.key}
              className="w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-white/5 transition"
              onClick={() => {
                closeEngagementPopover();
                if (item.href) {
                  router.push(item.href);
                } else if (item.path) {
                  handleNavigation(item.path, item.routeKey || item.id);
                }
              }}
            >
              {item.explored ? (
                <CheckCircle2 className="text-emerald-400 mt-0.5" size={16} />
              ) : (
                <Circle className="text-white/30 mt-0.5" size={16} />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-white">
                  {item.title || item.label}
                </p>
                <p className="text-[10px] text-white/50">{item.section}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                Open
              </span>
            </button>
          ))}
        </div>
      </Popover>

      {/* Footer - Loading indicator */}
      {isLoading && !collapsed && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}
    </aside>
  );
}
