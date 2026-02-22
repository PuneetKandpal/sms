"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelection } from "../context/SelectionContext";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
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
  Settings,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

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
};

// Sidebar navigation structure
const SIDEBAR_STRUCTURE = [
  {
    id: "home",
    label: "HOME",
    icon: Home,
    children: [
      {
        id: "overview",
        label: "Overview Dashboard",
        icon: LayoutDashboard,
        path: "overview",
        routeKey: "projects",
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
      },
      {
        id: "keywords",
        label: "Keyword Repository",
        icon: Key,
        path: "keywords",
        routeKey: "keywords",
      },
      {
        id: "search-ranking",
        label: "Search Ranking",
        icon: Search,
        path: "search-ranking",
        routeKey: "search-ranking",
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
      },
      {
        id: "topics",
        label: "Topics",
        icon: Tags,
        path: "topic",
        routeKey: "topics",
      },
      {
        id: "ai-optimizations",
        label: "AI Optimization Questions",
        icon: HelpCircle,
        path: "ai-optimizations",
        routeKey: "ai-optimizations",
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
      },
      {
        id: "aio-answers",
        label: "AI Optimization Answers",
        icon: Lightbulb,
        path: "aio-answers",
        routeKey: "aio-answers",
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
      },
      {
        id: "social-history",
        label: "Social Posts History",
        icon: History,
        href: "/social-history",
      },
      {
        id: "social-scheduler",
        label: "Social Scheduler",
        icon: Calendar,
        href: "/social-scheduler",
      },
      {
        id: "connections",
        label: "Connections",
        icon: Users,
        href: "/connections",
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
        icon: Users,
        href: "/companies",
      },
    ],
  },
];

// Section Header Component
function SectionHeader({ section, isOpen, onToggle, collapsed }) {
  const Icon = section.icon;

  if (collapsed) return null;

  return (
    <button
      type="button"
      onClick={() => onToggle(section.id)}
      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-500 hover:text-gray-700 transition-colors group"
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
  const [collapsed, setCollapsed] = useState(false);
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
      projects: /^\/projects\/[^/]+\/overview/,
      "knowledge-base": /^\/projects\/[^/]+\/manage/,
      keywords: /^\/projects\/[^/]+\/keywords/,
      "search-ranking": /^\/projects\/[^/]+\/search-ranking/,
      topics: /^\/projects\/[^/]+\/topic/,
      "ai-optimizations": /^\/projects\/[^/]+\/ai-optimizations/,
      "content-architecture": /^\/projects\/[^/]+\/content-architecture/,
      articles: /^\/projects\/[^/]+\/articles/,
      "aio-answers": /^\/projects\/[^/]+\/aio-answers/,
      "opportunity-agent": /^\/projects\/[^/]+\/opportunity-agent/,
      socials: /^\/projects\/[^/]+\/socials/,
      "social-history": /^\/social-history/,
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

  const handleItemClick = (item) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.path) {
      handleNavigation(item.path, item.routeKey);
    }
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40
        bg-white border-r border-gray-200
        h-screen
        transition-all duration-300
        flex flex-col
        ${collapsed ? "w-16" : "w-64"}
        ${isLoading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg">Dashboard</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={20} className="text-gray-600" />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
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
