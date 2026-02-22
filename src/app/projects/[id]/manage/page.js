"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { formatLocalDateTime, formatLocalTime } from "../../../../utils/dateUtils";
import { use } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Switch,
  Popper,
  Paper,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  X,
  AlertTriangle,
  Save,
  RotateCcw,
  CheckCircle,
  Check,
  Pencil,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp,
  ArrowsUpFromLine,
  Lock,
  LockOpen,
  AlertCircle,
  Shield,
  Clock,
  User,
  ArrowUp,
  ArrowDown,
  Building2,
  Users,
  Lightbulb,
  Target,
  Globe,
  Info,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TiptapMarkdownViewer from "../../../../components/TiptapMarkdownViewer";

import SourcesAndCompetitorsPanel from "../../../components/SourcesAndCompetitorsPanel";
import OverviewSection from "../../../components/OverviewSection";
import CurrentDataSection from "../../../components/CurrentDataSection";
import { SourceComparisonView } from "../../../components/diff";
import api from "../../../../api/axios";
import { useSelection } from "../../../context/SelectionContext";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";
import toast from "react-hot-toast";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useCompanyResearchTaskStream from "../../../../hooks/useCompanyResearchTaskStream";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

const normalizeStatus = (status) => (status || "").toLowerCase();
const ACTIVE_TASK_STATUS_SET = new Set([
  "queued",
  "pending",
  "processing",
  "running",
  "in_progress",
]);
const FAILURE_TASK_STATUS_SET = new Set(["failed", "error"]);

const INTERNAL_LOCK_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const INTERNAL_INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;
const RAW_INTERNAL_INACTIVITY_MINUTES = Number(
  process.env.NEXT_PUBLIC_INTERNAL_SOURCES_INACTIVITY_MINUTES ?? 15
);
const INTERNAL_INACTIVITY_TIMEOUT_MINUTES = Number.isFinite(
  RAW_INTERNAL_INACTIVITY_MINUTES
)
  ? RAW_INTERNAL_INACTIVITY_MINUTES
  : 15;
const INTERNAL_INACTIVITY_TIMEOUT_MS = INTERNAL_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
const INTERNAL_ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "focus",
  "touchstart",
];

const getInternalActivityEventTarget = (eventName) => {
  if (typeof window === "undefined") return null;
  if (eventName === "visibilitychange") {
    return typeof document !== "undefined" ? document : null;
  }
  return window;
};

const OVERLAP_SECTION_CONFIG = [
  { key: "industries", title: "School Types" },
  { key: "buyer_personas", title: "Audience Profiles" },
  { key: "products_and_services", title: "Programs & Services" },
  { key: "target_markets", title: "Target Communities" },
  { key: "differentiators", title: "Reasons Families Choose You" },
];

const SECTION_META = {
  industries: { icon: Building2, color: "sky" },
  buyer_personas: { icon: Users, color: "emerald" },
  products_and_services: { icon: Lightbulb, color: "violet" },
  target_markets: { icon: Target, color: "amber" },
  differentiators: { icon: Globe, color: "rose" },
};

const getOverlapPanelNoun = (sectionKey) => {
  switch (sectionKey) {
    case "buyer_personas":
      return "Audience Profiles";
    case "products_and_services":
      return "Programs & Services";
    case "industries":
      return "School Types";
    case "target_markets":
      return "Target Communities";
    case "differentiators":
      return "Reasons Families Choose You";
    default:
      return "Items";
  }
};

const getOverlapPanelTitle = (sectionKey, tone) => {
  const noun = getOverlapPanelNoun(sectionKey);
  return tone === "overlap"
    ? `Shared ${noun}`
    : `Other School Only ${noun}`;
};

const OVERLAP_TOOLTIP_TEXT =
  "Shared items appear in both your school profile and the other school’s profile.";
const NON_OVERLAP_TOOLTIP_TEXT =
  "Other-school-only items appear in the other school’s profile but are not currently in yours.";

const DEFAULT_REASONING_COPY = {
  industries:
    "These school types reflect where your positioning overlaps with another school. The items that only appear on the other school can help you spot missing segments or messaging opportunities.",
};

const getDefaultReasoning = (sectionKey) => DEFAULT_REASONING_COPY[sectionKey] || "";

const SECTION_THEME = {
  sky: {
    icon: "text-sky-600",
    overview: "bg-sky-50 border-sky-200 text-sky-800",
  },
  emerald: {
    icon: "text-emerald-600",
    overview: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  violet: {
    icon: "text-violet-600",
    overview: "bg-violet-50 border-violet-200 text-violet-800",
  },
  amber: {
    icon: "text-amber-600",
    overview: "bg-amber-50 border-amber-200 text-amber-800",
  },
  rose: {
    icon: "text-rose-600",
    overview: "bg-rose-50 border-rose-200 text-rose-800",
  },
  default: {
    icon: "text-gray-600",
    overview: "bg-gray-50 border-gray-200 text-gray-700",
  },
};

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
};

const removeOne = (list, item) => {
  const idx = list.findIndex((x) => x === item);
  if (idx === -1) return list;
  return [...list.slice(0, idx), ...list.slice(idx + 1)];
};

const addUnique = (list, item) => {
  if (list.includes(item)) return list;
  return [...list, item];
};

function OverlapTag({ label, tone = "neutral", action, actionTitle, actionIcon, actionLabel }) {
  const toneClasses =
    tone === "overlap"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : tone === "non_overlap"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : "bg-gray-50 border-gray-200 text-gray-700";

  const buttonTitle = actionLabel || actionTitle;

  return (
    <div
      className={`border ${toneClasses} rounded px-2 py-1 text-xs font-medium flex items-center gap-2 max-w-full min-w-0 overflow-hidden`}
    >
      <span className="flex-1 min-w-0 truncate" title={label}>
        {label}
      </span>

      {/* //! ACTION BUTTON HIDDEN */}
      {/* {action && (
        <button
          type="button"
          onClick={action}
          title={buttonTitle}
          className="p-0.5 rounded hover:bg-white/60 transition-colors cursor-pointer"
        >
          {actionIcon}
        </button>
      )} */}
    </div>
  );
}

function OverlapColumn({
  title,
  tone,
  items,
  onMove,
  moveTitle,
  moveIcon,
  emptyText,
  layout = "wrap",
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h6 className="text-xs font-semibold text-gray-700">
          {title}
          <span className="ml-2 text-[11px] font-normal text-gray-500">
            {items.length}
          </span>
        </h6>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-400">{emptyText}</div>
      ) : (
        <div
          className={
            layout === "wrap"
              ? "flex flex-wrap gap-1.5"
              : "flex flex-col gap-1.5"
          }
        >
          {items.map((item) => (
            <OverlapTag
              key={item}
              label={item}
              tone={tone}
              action={onMove ? () => onMove(item) : null}
              actionTitle={moveTitle}
              actionIcon={moveIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsAndServicesOverlap({ overlap, nonOverlap, onMove, collapsedState, onTogglePanel }) {
  const overlapPS = overlap?.products_and_services || {};
  const nonOverlapPS = nonOverlap?.products_and_services || {};

  const categories = Array.from(
    new Set([...Object.keys(overlapPS || {}), ...Object.keys(nonOverlapPS || {})])
  );

  if (categories.length === 0) {
    return (
      <div className="text-xs text-gray-400">No programs & services data</div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const overlapItems = normalizeList(overlapPS?.[category]);
        const nonOverlapItems = normalizeList(nonOverlapPS?.[category]);

        return (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-800 mb-2">
              {category}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <OverlapItemsPanel
                title={getOverlapPanelTitle("products_and_services", "overlap")}
                tone="overlap"
                items={overlapItems}
                isCollapsed={
                  typeof collapsedState?.[`overlap:${category}`] === "boolean"
                    ? collapsedState[`overlap:${category}`]
                    : overlapItems.length === 0
                }
                onToggle={() => onTogglePanel("products_and_services", "overlap", category)}
                onMove={(item) => onMove({ sectionKey: "products_and_services", category, item, from: "overlap" })}
                moveTitle={getOverlapPanelTitle("products_and_services", "non_overlap")}
                moveIcon={<ArrowRight className="w-3 h-3" />}
                infoText={OVERLAP_TOOLTIP_TEXT}
                hintLabel="Your School + Other School"
                moveLabel="Remove"
              />
              <OverlapItemsPanel
                title={getOverlapPanelTitle("products_and_services", "non_overlap")}
                tone="non_overlap"
                items={nonOverlapItems}
                isCollapsed={
                  typeof collapsedState?.[`non_overlap:${category}`] === "boolean"
                    ? collapsedState[`non_overlap:${category}`]
                    : nonOverlapItems.length === 0
                }
                onToggle={() => onTogglePanel("products_and_services", "non_overlap", category)}
                onMove={(item) =>
                  onMove({ sectionKey: "products_and_services", category, item, from: "non_overlap" })
                }
                moveTitle={getOverlapPanelTitle("products_and_services", "overlap")}
                moveIcon={<ArrowLeft className="w-3 h-3" />}
                infoText={NON_OVERLAP_TOOLTIP_TEXT}
                hintLabel="Other School Only"
                moveLabel="Add"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverlapSectionCard({
  sectionKey,
  title,
  subtitle,
  overview,
  totalCount,
  children,
}) {
  const meta = SECTION_META[sectionKey] || {};
  const Icon = meta.icon || FileText;
  const theme = SECTION_THEME[meta.color] || SECTION_THEME.default;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${theme.icon}`} />
          <div>
            <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
            {subtitle && (
              <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            {overview && (
              <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200">
                Overview
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200">
              {totalCount} items
            </span>
          </div>
        </div>
      </div>
      {children({ overviewTheme: theme.overview })}
    </div>
  );
}

function SectionOverview({ text, themeClass }) {
  if (!text) return null;
  return (
    <div className={`mb-3 text-xs rounded-lg p-3 leading-relaxed border ${themeClass}`}>
      {text}
    </div>
  );
}
function OverlapItemsPanel({
  title,
  tone,
  items,
  onMove,
  moveTitle,
  moveIcon,
  infoText,
  hintLabel,
  moveLabel,
}) {
  const [infoAnchor, setInfoAnchor] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoHoverTimeoutRef = useRef(null);

  const clearInfoTimeout = () => {
    if (infoHoverTimeoutRef.current) {
      clearTimeout(infoHoverTimeoutRef.current);
      infoHoverTimeoutRef.current = null;
    }
  };

  const scheduleInfoClose = () => {
    clearInfoTimeout();
    infoHoverTimeoutRef.current = setTimeout(() => {
      setInfoOpen(false);
      setInfoAnchor(null);
    }, 100);
  };

  const updateInfoAnchor = (clientX, clientY) => {
    if (typeof window === "undefined") return;
    const virtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        top: clientY,
        bottom: clientY,
        left: clientX,
        right: clientX,
        x: clientX,
        y: clientY,
        toJSON: () => {},
      }),
      contextElement: document.body,
    };
    setInfoAnchor(virtualElement);
  };

  const handleInfoMouseEnter = (event) => {
    clearInfoTimeout();
    updateInfoAnchor(event.clientX, event.clientY);
    setInfoOpen(true);
  };

  const handleInfoMouseMove = (event) => {
    if (!infoOpen) return;
    updateInfoAnchor(event.clientX, event.clientY);
  };

  const handleInfoMouseLeave = () => {
    scheduleInfoClose();
  };

  useEffect(() => {
    return () => {
      clearInfoTimeout();
    };
  }, []);

  return (
    <div className="rounded-xl border border-gray-200/70 bg-white/80 shadow-sm min-w-0">
      <div className="w-full flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-medium text-gray-600 tracking-tight truncate">
            {title}
          </div>
          {infoText && (
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label={`${title} info`}
              onMouseEnter={handleInfoMouseEnter}
              onMouseLeave={handleInfoMouseLeave}
              onMouseMove={handleInfoMouseMove}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
          {infoText && (
            <Popper
              open={infoOpen}
              anchorEl={infoAnchor}
              placement="top"
              modifiers={[
                {
                  name: "offset",
                  options: {
                    offset: [0, 14],
                  },
                },
              ]}
            >
              <Paper
                elevation={4}
                className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-sm text-gray-700 leading-relaxed max-w-xs shadow-md"
                onMouseEnter={clearInfoTimeout}
                onMouseLeave={handleInfoMouseLeave}
              >
                <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                  {title}
                </div>
                <div>{infoText}</div>
              </Paper>
            </Popper>
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
      <div className="px-3 pb-3">
        {hintLabel && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-gray-200 bg-white text-gray-500">
              {hintLabel}
            </span>
          </div>
        )}
        {items.length === 0 ? (
          <div className="text-xs text-gray-400">No items available</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <OverlapTag
                key={item}
                label={item}
                tone={tone}
                action={onMove ? () => onMove(item) : null}
                actionTitle={moveTitle}
                actionIcon={moveIcon}
                actionLabel={moveLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManageProjectPage({ params }) {
  const { id } = use(params);

  useTrackFeatureExploration("knowledge_base");

  // Track feature usage
  useFeatureTracking("Manage Project", {
    feature_category: "project_management",
    page_section: "manage",
    project_id: id,
  });

  const { selectedProject } = useSelection();
  const {
    setIsDrawerOpen: setIsGlobalTaskMonitorOpen,
    instantRefreshAfterTaskStart,
    runningAgentsCount,
    categorizedTasks,
  } = useTaskMonitor();
  const searchParams = useSearchParams();
  const domainId = searchParams.get("domain");
  const componentId = searchParams.get("component");

  const openGlobalTaskMonitor = () => {
    instantRefreshAfterTaskStart();
    setIsGlobalTaskMonitorOpen(true);
  };

  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [selectedCompetitorData, setSelectedCompetitorData] = useState(null);
  const [loadingCompetitorData, setLoadingCompetitorData] = useState(false);
  const [isSavingCompetitorOverlap, setIsSavingCompetitorOverlap] = useState(false);
  const [internalSources, setInternalSources] = useState([]);
  const [selectedInternalSources, setSelectedInternalSources] = useState([]);
  const [selectedInternalSourceData, setSelectedInternalSourceData] = useState(null);
  const [loadingInternalSourceData, setLoadingInternalSourceData] = useState(false);
  const [collapsedItemsPanels, setCollapsedItemsPanels] = useState({});

  const competitorRefreshTimeoutRef = useRef(null);

  const toggleItemsPanel = useCallback((sectionKey, panel, subKey) => {
    setCollapsedItemsPanels((prev) => {
      const sectionState = prev?.[sectionKey] || {};
      const panelKey = subKey ? `${panel}:${subKey}` : panel;
      return {
        ...prev,
        [sectionKey]: {
          ...sectionState,
          [panelKey]: !sectionState[panelKey],
        },
      };
    });
  }, []);

  const expandItemsPanel = useCallback((sectionKey, panel, subKey) => {
    setCollapsedItemsPanels((prev) => {
      const sectionState = prev?.[sectionKey] || {};
      const panelKey = subKey ? `${panel}:${subKey}` : panel;
      // Only update if currently collapsed (true) or undefined, otherwise leave as-is
      if (sectionState[panelKey] === true || sectionState[panelKey] === undefined) {
        return {
          ...prev,
          [sectionKey]: {
            ...sectionState,
            [panelKey]: false, // Expand (not collapsed)
          },
        };
      }
      return prev;
    });
  }, []);

  // Internal markdown editor state (lock + autosave)
  const [internalLockStatus, setInternalLockStatus] = useState(null);
  const [isAcquiringInternalLock, setIsAcquiringInternalLock] = useState(false);
  const [showInternalInactivityModal, setShowInternalInactivityModal] = useState(false);
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [internalAutoSaveEnabled, setInternalAutoSaveEnabled] = useState(true);
  const [internalMarkdown, setInternalMarkdown] = useState("");
  const [internalHasUnsavedChanges, setInternalHasUnsavedChanges] = useState(false);
  const [internalIsSaving, setInternalIsSaving] = useState(false);
  const [internalLastSaved, setInternalLastSaved] = useState(null);
  const [internalForcePreviewKey, setInternalForcePreviewKey] = useState(0);
  const internalAutoSaveTimerRef = useRef(null);
  const internalLockHeartbeatRef = useRef(null);
  const internalInactivityIntervalRef = useRef(null);
  const internalLastActivityRef = useRef(Date.now());
  const internalActivityListenersActiveRef = useRef(false);
  const internalIsEditingRef = useRef(false);
  const internalHandleInactivityTimeoutRef = useRef(null);
  const currentInternalSourceIdRef = useRef(null);
  const [hasEditedCurrentData, setHasEditedCurrentData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);

  const internalCanEdit = Boolean(internalLockStatus?.can_edit);
  const competitorsRef = useRef([]);
  useEffect(() => {
    competitorsRef.current = competitors;
  }, [competitors]);

  useEffect(() => {
    currentInternalSourceIdRef.current =
      selectedInternalSourceData?.source_id || null;
  }, [selectedInternalSourceData?.source_id]);

  const handleInternalActivity = useCallback(() => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }
    internalLastActivityRef.current = Date.now();
  }, []);

  const stopInternalActivityTracking = useCallback(() => {
    if (!internalActivityListenersActiveRef.current) return;
    INTERNAL_ACTIVITY_EVENTS.forEach((eventName) => {
      const target = getInternalActivityEventTarget(eventName);
      target?.removeEventListener(eventName, handleInternalActivity);
    });
    internalActivityListenersActiveRef.current = false;
    if (internalInactivityIntervalRef.current) {
      clearInterval(internalInactivityIntervalRef.current);
      internalInactivityIntervalRef.current = null;
    }
  }, [handleInternalActivity]);

  const startInternalActivityTracking = useCallback(() => {
    if (internalActivityListenersActiveRef.current) return;
    INTERNAL_ACTIVITY_EVENTS.forEach((eventName) => {
      const target = getInternalActivityEventTarget(eventName);
      target?.addEventListener(eventName, handleInternalActivity, {
        passive: true,
      });
    });
    internalLastActivityRef.current = Date.now();
    internalActivityListenersActiveRef.current = true;
    internalInactivityIntervalRef.current = setInterval(() => {
      if (!internalIsEditingRef.current) return;
      const now = Date.now();
      if (
        internalHandleInactivityTimeoutRef.current &&
        now - internalLastActivityRef.current >= INTERNAL_INACTIVITY_TIMEOUT_MS
      ) {
        internalHandleInactivityTimeoutRef.current();
      }
    }, INTERNAL_INACTIVITY_CHECK_INTERVAL_MS);
  }, [handleInternalActivity]);

  const stopInternalLockHeartbeat = useCallback(() => {
    if (internalLockHeartbeatRef.current) {
      clearInterval(internalLockHeartbeatRef.current);
      internalLockHeartbeatRef.current = null;
    }
  }, []);

  const setInternalEditingMode = useCallback(
    (nextEditing, { forcePreview = false } = {}) => {
      setInternalIsEditing(nextEditing);
      internalIsEditingRef.current = nextEditing;

      if (nextEditing) {
        startInternalActivityTracking();
      } else {
        stopInternalActivityTracking();
      }

      if (!nextEditing) {
        stopInternalLockHeartbeat();
        if (forcePreview) {
          setInternalForcePreviewKey((k) => k + 1);
        }
      }
    },
    [startInternalActivityTracking, stopInternalActivityTracking, stopInternalLockHeartbeat]
  );

  const checkInternalLockStatus = useCallback(
    async (sourceId) => {
      if (!sourceId) return null;
      try {
        const response = await api.get(
          `/internal-sources/markdown/lock/check/${sourceId}/`
        );
        if (response.data) {
          setInternalLockStatus(response.data);
          return response.data;
        }
      } catch (error) {
        console.error("Error checking internal markdown lock:", error);
      }
      return null;
    },
    [setInternalLockStatus]
  );

  const acquireInternalLock = useCallback(
    async (sourceId) => {
      if (!sourceId) return false;
      const projectId = id ? id : selectedProject?.id;
      if (!projectId) return false;

      setIsAcquiringInternalLock(true);
      try {
        const response = await api.post(
          `/internal-sources/markdown/lock/acquire/`,
          {
            source_id: sourceId,
            project_id: projectId,
          }
        );

        if (response.data?.success) {
          await checkInternalLockStatus(sourceId);
          toast.success(
            <div className="flex items-center gap-2">
              <LockOpen className="w-4 h-4" />
              <span>Lock acquired</span>
            </div>,
            { duration: 2500 }
          );
          return true;
        }

        toast.error(response.data?.message || "Unable to acquire lock");
        await checkInternalLockStatus(sourceId);
        return false;
      } catch (error) {
        console.error("Error acquiring internal markdown lock:", error);
        toast.error(
          error.response?.data?.message ||
            "Document is locked by another user"
        );
        await checkInternalLockStatus(sourceId);
        return false;
      } finally {
        setIsAcquiringInternalLock(false);
      }
    },
    [checkInternalLockStatus, id, selectedProject?.id]
  );

  const releaseInternalLock = useCallback(
    async (sourceId, { forcePreview = false } = {}) => {
      if (!sourceId) return false;

      let released = false;
      setInternalEditingMode(false, { forcePreview });

      try {
        await api.post(`/internal-sources/markdown/lock/release/`, {
          source_id: sourceId,
        });
        setInternalLockStatus(null);
        released = true;
        return true;
      } catch (error) {
        console.error("Error releasing internal markdown lock:", error);
        toast.error(
          error?.response?.data?.message ||
            "Unable to release lock. Please try again."
        );
        setInternalEditingMode(true);
        await checkInternalLockStatus(sourceId);
        return false;
      } finally {
        if (!released) {
          // Ensure activity tracking resumes if release failed.
          internalIsEditingRef.current = true;
        }
      }
    },
    [checkInternalLockStatus, setInternalEditingMode]
  );

  const extendInternalLock = useCallback(
    async (sourceId) => {
      if (!sourceId) return;
      const projectId = id ? id : selectedProject?.id;
      if (!projectId) {
        console.warn("Cannot extend lock without project ID");
        return;
      }
      try {
        const response = await api.post(`/internal-sources/markdown/lock/extend/`, {
          source_id: sourceId,
          project_id: projectId,
        });
        if (response.data?.success) {
          await checkInternalLockStatus(sourceId);
        }
      } catch (error) {
        console.error("Error extending internal markdown lock:", error);
        await checkInternalLockStatus(sourceId);
      }
    },
    [checkInternalLockStatus, id, selectedProject?.id]
  );

  const startInternalLockHeartbeat = useCallback(
    (sourceId) => {
      if (!sourceId) return;
      stopInternalLockHeartbeat();
      internalLockHeartbeatRef.current = setInterval(() => {
        if (internalIsEditingRef.current) {
          extendInternalLock(sourceId);
        }
      }, INTERNAL_LOCK_HEARTBEAT_INTERVAL_MS);
    },
    [extendInternalLock, stopInternalLockHeartbeat]
  );

  // When internal editing starts, begin heartbeat
  useEffect(() => {
    const sourceId = currentInternalSourceIdRef.current;
    if (!sourceId) return;

    if (internalIsEditing) {
      startInternalLockHeartbeat(sourceId);
    } else {
      stopInternalLockHeartbeat();
    }

    return () => {
      stopInternalLockHeartbeat();
    };
  }, [internalIsEditing, startInternalLockHeartbeat, stopInternalLockHeartbeat]);

  // Inactivity release
  useEffect(() => {
    internalHandleInactivityTimeoutRef.current = () => {
      const sourceId = currentInternalSourceIdRef.current;
      if (sourceId && internalIsEditingRef.current) {
        api
          .post(`/internal-sources/markdown/lock/release/`, {
            source_id: sourceId,
          })
          .catch((err) =>
            console.error("Internal inactivity release error:", err)
          );

        setInternalLockStatus(null);
        setInternalEditingMode(false, { forcePreview: true });
        setShowInternalInactivityModal(true);
      }
    };
  }, [setInternalEditingMode]);

  const handleInternalReacquireLock = useCallback(async () => {
    const sourceId = currentInternalSourceIdRef.current;
    if (!sourceId) {
      setShowInternalInactivityModal(false);
      return;
    }

    const acquired = await acquireInternalLock(sourceId);
    if (acquired) {
      setInternalEditingMode(true);
      setShowInternalInactivityModal(false);
      toast.success("Lock re-acquired. You can continue editing.");
    } else {
      setShowInternalInactivityModal(false);
      toast.error("Unable to acquire lock. Document may be locked by another user.");
    }
  }, [acquireInternalLock, setInternalEditingMode]);

  const handleInternalCancelReacquire = useCallback(() => {
    setShowInternalInactivityModal(false);
  }, []);

  const handleInternalBeforeEditMode = useCallback(async () => {
    const sourceId = currentInternalSourceIdRef.current;
    if (!sourceId) return false;

    if (internalIsEditingRef.current) return true;
    if (isAcquiringInternalLock) return false;

    setInternalEditingMode(true);
    let allowEditing = false;

    try {
      const latest = await checkInternalLockStatus(sourceId);
      const canEdit = latest?.can_edit ?? false;
      const isLocked = latest?.is_locked;

      if (!canEdit) {
        toast.error(latest?.message || "Document is locked by another user");
        return false;
      }

      if (isLocked === false) {
        const acquired = await acquireInternalLock(sourceId);
        if (!acquired) {
          return false;
        }
      }

      allowEditing = true;
      return true;
    } catch (error) {
      console.error("Error preparing edit mode:", error);
      toast.error("Unable to enable editing. Please try again.");
      return false;
    } finally {
      if (!allowEditing) {
        setInternalEditingMode(false, { forcePreview: true });
      }
    }
  }, [
    acquireInternalLock,
    checkInternalLockStatus,
    isAcquiringInternalLock,
    setInternalEditingMode,
  ]);

  const handleInternalReleaseLockClick = useCallback(async () => {
    const sourceId = currentInternalSourceIdRef.current;
    if (!sourceId) return;
    await releaseInternalLock(sourceId, { forcePreview: true });
  }, [releaseInternalLock]);

  // Sync markdown content when switching documents
  useEffect(() => {
    setInternalMarkdown(selectedInternalSourceData?.content || "");
    setInternalHasUnsavedChanges(false);
    setInternalLastSaved(null);
    setInternalIsSaving(false);
    setInternalEditingMode(false, { forcePreview: true });

    const sourceId = selectedInternalSourceData?.source_id;
    if (sourceId) {
      checkInternalLockStatus(sourceId);
    } else {
      setInternalLockStatus(null);
    }
  }, [selectedInternalSourceData?.source_id]);

  const saveInternalMarkdown = useCallback(
    async (showToast = true) => {
      const sourceId = currentInternalSourceIdRef.current;
      const projectId = id ? id : selectedProject?.id;
      if (!sourceId || !projectId) return;
      if (!internalHasUnsavedChanges || internalIsSaving) return;

      setInternalIsSaving(true);
      try {
        const response = await api.put(`/internal-sources/markdown/edit/`, {
          source_id: sourceId,
          project_id: projectId,
          content: internalMarkdown,
        });

        if (response.data?.success) {
          setInternalLastSaved(new Date());
          setInternalHasUnsavedChanges(false);
          if (showToast) toast.success("Saved");
        } else {
          toast.error(response.data?.message || "Save failed");
        }
      } catch (error) {
        console.error("Error saving internal markdown:", error);
        toast.error("Save failed");
      } finally {
        setInternalIsSaving(false);
      }
    },
    [
      id,
      selectedProject?.id,
      internalHasUnsavedChanges,
      internalIsSaving,
      internalMarkdown,
    ]
  );

  // Autosave (2s debounce)
  useEffect(() => {
    const sourceId = currentInternalSourceIdRef.current;
    const canEdit = internalLockStatus?.can_edit || false;
    if (!sourceId) return;

    if (
      !internalAutoSaveEnabled ||
      !internalHasUnsavedChanges ||
      internalIsSaving ||
      !canEdit
    ) {
      return;
    }

    if (internalAutoSaveTimerRef.current) {
      clearTimeout(internalAutoSaveTimerRef.current);
    }

    internalAutoSaveTimerRef.current = setTimeout(() => {
      saveInternalMarkdown(false);
    }, 2000);

    return () => {
      if (internalAutoSaveTimerRef.current) {
        clearTimeout(internalAutoSaveTimerRef.current);
      }
    };
  }, [
    internalAutoSaveEnabled,
    internalMarkdown,
    internalHasUnsavedChanges,
    internalIsSaving,
    internalLockStatus?.can_edit,
    saveInternalMarkdown,
  ]);

  const currentDataScrollRef = useRef(null);
  const sourceDataScrollRef = useRef(null);
  const competitorDataScrollRef = useRef(null);
  const reviewPanelScrollRef = useRef(null);
  const isScrollingSyncRef = useRef(false);

  // Diff viewer states
  const [showJsonView, setShowJsonView] = useState(false);
  const [mergedResult, setMergedResult] = useState(null);
  const [oldData, setOldData] = useState(null);
  const [newData, setNewData] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [hasUnsavedDecisions, setHasUnsavedDecisions] = useState(false);
  const [hasReviewDecisions, setHasReviewDecisions] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);

  // Review mode states
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewModeAnimating, setReviewModeAnimating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Shared state for section expansion between panels - all sections expanded by default
  const [sharedExpandedSections, setSharedExpandedSections] = useState({
    industries: false,
    buyer_personas: false,
    products_and_services: false,
    target_markets: false,
    differentiators: false,
    geo_leo_strategy: false,
  });

  // Publishing and reset states
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [duplicateItems, setDuplicateItems] = useState([]);

  // Async research task tracking
  const [researchTasks, setResearchTasks] = useState([]);
  const [isPollingResearchTasks, setIsPollingResearchTasks] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  const [showTaskCompleteModal, setShowTaskCompleteModal] = useState(false);
  const [recentlyCompletedTask, setRecentlyCompletedTask] = useState(null);

  const startedTaskIdsRef = useRef(new Set());
  const shownCompletedTaskIdsRef = useRef(new Set());
  const shownFailedTaskIdsRef = useRef(new Set());
  const hadSessionTasksRef = useRef(false);
  const hadActiveTasksRef = useRef(false);

  const [selectedTaskIdForLog, setSelectedTaskIdForLog] = useState(null);
  const [isAgentLogOpen, setIsAgentLogOpen] = useState(false);
  const agentLogContainerRef = useRef(null);

  const getTaskId = (task) => task?.task_id || task?.id;
  const isCompetitorTask = (task) => {
    if (!task) return false;
    const taskSourceId = task?.source_id;
    const isSourceIdCompetitor =
      taskSourceId &&
      competitorsRef.current.some(
        (c) => (c.source_id || c.id) === taskSourceId
      );

    return (
      task?.agent_type === "CompanyCompetitorResearchAgent" ||
      task?.type === "competitor" ||
      task?.source_type === "competitor" ||
      isSourceIdCompetitor
    );
  };

  const getTaskLabel = (task) =>
    task?.competitor_name ||
    task?.source_name ||
    task?.url ||
    task?.source_id ||
    "Research task";

  const hasPublishedData = useMemo(() => {
    if (!oldData) return false;
    return Object.values(oldData).some((section) => {
      if (!section) return false;
      if (Array.isArray(section)) {
        return section.length > 0;
      }
      if (typeof section === "object") {
        return Object.values(section).some((value) => {
          if (!value) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === "object") return Object.keys(value).length > 0;
          return true;
        });
      }
      return true;
    });
  }, [oldData]);

  const {
    events: taskEvents,
    state: taskStreamState,
    error: taskStreamError,
  } = useCompanyResearchTaskStream(selectedTaskIdForLog);

  useEffect(() => {
    if (isEditMode) {
      setSharedExpandedSections((prev) => ({
        ...prev,
        industries: true,
        buyer_personas: true,
        products_and_services: true,
        target_markets: true,
        differentiators: true,
        geo_leo_strategy: true,
      }));
    } else {
      setSharedExpandedSections((prev) => ({
        ...prev,
        industries: false,
        buyer_personas: false,
        products_and_services: false,
        target_markets: false,
        differentiators: false,
        geo_leo_strategy: false,
      }));
    }
  }, [isEditMode]);

  // Fetch project from API using selectedProject.id
  const fetchProject = async () => {
    const projectId = id ? id : selectedProject?.id;

    console.log("ManageProjectPage projectId------->", projectId);

    if (!projectId) return;

    trackFeatureAction("project_fetch_started", {
      project_id: projectId,
    });

    try {
      const response = await api.get(
        `/api/project-details/?project_id=${projectId}`
      );
      const data = response.data;

      console.log("ManageProjectPage data------->", data);
      setProject(data || null);
      setSources(data.sources || []);

      const hasServerOldData = !!(
        data.old_data && Object.keys(data.old_data).length > 0
      );
      const hasServerNewData = !!(
        data.new_data && Object.keys(data.new_data).length > 0
      );

      if (!hasServerOldData && hasServerNewData) {
        setOldData(data.new_data);
        setNewData(null);
        setHasPendingChanges(false);
        setHasEditedCurrentData(true);
      } else {
        setOldData(data.old_data || null);
        setNewData(data.new_data || null);
        setHasEditedCurrentData(false);
        setHasPendingChanges(hasServerNewData);
      }

      // Fetch competitors and internal sources separately
      await fetchCompetitors();
      await fetchInternalSources();

      return data;
    } catch (err) {
      console.error("Error fetching project:", err);
      throw err;
    }
  };

  // Fetch competitors from API
  const fetchCompetitors = async () => {
    const projectId = id ? id : selectedProject?.id;
    if (!projectId) return;

    try {
      const response = await api.get(
        `/api/competitor-sources/?projectId=${projectId}`
      );
      setCompetitors(response.data.sources || []);
    } catch (err) {
      console.error("Error fetching competitors:", err);
      setCompetitors([]);
    }
  };

  // Fetch selected competitor data
  const fetchCompetitorData = async (sourceId, { silent = false } = {}) => {
    if (!sourceId) return;

    if (!silent) {
      setLoadingCompetitorData(true);
    }
    try {
      const response = await api.get(
        `/rival-agent/competitor-research-by-source/?source_id=${sourceId}`
      );
      setSelectedCompetitorData(response.data.data || null);
    } catch (err) {
      console.error("Error fetching competitor data:", err);
      setSelectedCompetitorData(null);
      toast.error("Failed to load competitor data");
    } finally {
      if (!silent) {
        setLoadingCompetitorData(false);
      }
    }
  };

  const scheduleCompetitorRefresh = useCallback(
    (sourceId) => {
      if (!sourceId) return;
      if (competitorRefreshTimeoutRef.current) {
        clearTimeout(competitorRefreshTimeoutRef.current);
      }
      competitorRefreshTimeoutRef.current = setTimeout(() => {
        fetchCompetitorData(sourceId, { silent: true });
        competitorRefreshTimeoutRef.current = null;
      }, 1500);
    },
    [fetchCompetitorData]
  );

  const saveCompetitorOverlapData = async ({ overlap_data, non_overlap_data }) => {
    setIsSavingCompetitorOverlap(true);
    try {
      await api.post(`/rival-agent/non-overlap-to-overlap/`, {
        overlap_data,
        non_overlap_data,
      });

      const sourceId = overlap_data?.source_id || non_overlap_data?.source_id;
      scheduleCompetitorRefresh(sourceId);
    } catch (err) {
      console.error("Failed to update overlap/non-overlap data:", err);
      toast.error("Failed to update overlap/non-overlap");
      const currentSourceId =
        selectedCompetitorData?.overlap_data?.source_id ||
        selectedCompetitorData?.non_overlap_data?.source_id ||
        selectedCompetitors?.[0];
      scheduleCompetitorRefresh(currentSourceId);
    } finally {
      setIsSavingCompetitorOverlap(false);
    }
  };

  const handleMoveCompetitorItem = async ({ sectionKey, item, from, category }) => {
    const overlapData = selectedCompetitorData?.overlap_data;
    const nonOverlapData = selectedCompetitorData?.non_overlap_data;
    if (!overlapData || !nonOverlapData) return;

    const nextOverlap = { ...overlapData };
    const nextNonOverlap = { ...nonOverlapData };

    if (sectionKey === "products_and_services") {
      const overlapPS = { ...(nextOverlap.products_and_services || {}) };
      const nonOverlapPS = { ...(nextNonOverlap.products_and_services || {}) };
      const overlapList = normalizeList(overlapPS?.[category]);
      const nonOverlapList = normalizeList(nonOverlapPS?.[category]);

      if (from === "overlap") {
        overlapPS[category] = removeOne(overlapList, item);
        nonOverlapPS[category] = addUnique(nonOverlapList, item);
      } else {
        nonOverlapPS[category] = removeOne(nonOverlapList, item);
        overlapPS[category] = addUnique(overlapList, item);
      }

      nextOverlap.products_and_services = overlapPS;
      nextNonOverlap.products_and_services = nonOverlapPS;
    } else {
      const overlapSection = { ...(nextOverlap[sectionKey] || {}) };
      const nonOverlapSection = { ...(nextNonOverlap[sectionKey] || {}) };

      const overlapList = normalizeList(overlapSection.list);
      const nonOverlapList = normalizeList(nonOverlapSection.list);

      if (from === "overlap") {
        overlapSection.list = removeOne(overlapList, item);
        nonOverlapSection.list = addUnique(nonOverlapList, item);
      } else {
        nonOverlapSection.list = removeOne(nonOverlapList, item);
        overlapSection.list = addUnique(overlapList, item);
      }

      nextOverlap[sectionKey] = overlapSection;
      nextNonOverlap[sectionKey] = nonOverlapSection;
    }

    // Expand the destination panel so the moved item is visible
    if (from === "overlap") {
      if (sectionKey === "products_and_services") {
        expandItemsPanel(sectionKey, "non_overlap", category);
      } else {
        expandItemsPanel(sectionKey, "non_overlap");
      }
    } else {
      if (sectionKey === "products_and_services") {
        expandItemsPanel(sectionKey, "overlap", category);
      } else {
        expandItemsPanel(sectionKey, "overlap");
      }
    }

    setSelectedCompetitorData({ overlap_data: nextOverlap, non_overlap_data: nextNonOverlap });
    await saveCompetitorOverlapData({ overlap_data: nextOverlap, non_overlap_data: nextNonOverlap });
  };

  // Handle competitor selection
  const handleCompetitorSelect = (competitorId) => {
    const competitor = competitors.find(
      (c) => (c.source_id || c.id) === competitorId
    );

    if (competitor) {
      setSelectedSources([]);
      setSelectedInternalSources([]);
      setSelectedInternalSourceData(null);
      setSelectedCompetitors([competitorId]);
      fetchCompetitorData(competitorId);
    } else {
      setSelectedCompetitors([]);
      setSelectedCompetitorData(null);
    }
  };

  // Fetch internal sources from API
  const fetchInternalSources = async () => {
    // ...
    const projectId = id ? id : selectedProject?.id;
    if (!projectId) return;

    try {
      const response = await api.get(
        `/api/sources-by-type/?project_id=${projectId}&source_type=internal`
      );
      setInternalSources(response.data.sources || []);
    } catch (err) {
      console.error("Error fetching internal sources:", err);
      setInternalSources([]);
    }
  };

  // Fetch selected internal source data
  const fetchInternalSourceData = async (sourceId) => {
    if (!sourceId) return;

    setLoadingInternalSourceData(true);
    try {
      const projectId = id ? id : selectedProject?.id;
      const response = await api.get(
        `/internal-sources/internal-data/list/?project_id=${projectId}&source_id=${sourceId}`
      );
      const internalData = response.data.internal_data?.[0] || null;
      setSelectedInternalSourceData(internalData);
      if (internalData?.source_id) {
        checkInternalLockStatus(internalData.source_id);
      }
    } catch (err) {
      console.error("Error fetching internal source data:", err);
      setSelectedInternalSourceData(null);
      toast.error("Failed to load internal source data");
    } finally {
      setLoadingInternalSourceData(false);
    }
  };

  // Handle internal source selection
  const handleInternalSourceSelect = (internalSourceId) => {
    const internalSource = internalSources.find(
      (s) => s.source_id === internalSourceId
    );

    if (internalSource) {
      setSelectedSources([]);
      setSelectedCompetitors([]);
      setSelectedInternalSources([internalSourceId]);
      fetchInternalSourceData(internalSource.source_id);
    } else {
      setSelectedInternalSources([]);
      setSelectedInternalSourceData(null);
    }
  };

  const handleSourceSelect = (sourceId) => {
    if (sourceId) {
      setSelectedSources([sourceId]);
      setSelectedCompetitors([]);
      setSelectedCompetitorData(null);
      setSelectedInternalSources([]);
      setSelectedInternalSourceData(null);
    } else {
      setSelectedSources([]);
    }
  };

  const handleCurrentDataSelect = () => {
    setSelectedSources([]);
    setSelectedCompetitors([]);
    setSelectedCompetitorData(null);
    setSelectedInternalSources([]);
    setSelectedInternalSourceData(null);
  };

  // Refresh handler
  const refreshProjectData = async () => {
    const projectId = id ? id : selectedProject?.id;

    trackFeatureAction("project_refresh_started", {
      project_id: projectId,
    });

    try {
      const refreshed = await fetchProject();

      trackFeatureAction("project_refresh_success", {
        project_id: projectId,
      });

      // Auto-open review panel if pending changes exist after source is added
      setTimeout(() => {
        const hasServerOldData = !!(
          refreshed?.old_data && Object.keys(refreshed.old_data).length > 0
        );
        const hasServerNewData = !!(
          refreshed?.new_data && Object.keys(refreshed.new_data).length > 0
        );

        if (hasServerOldData && hasServerNewData && !isReviewMode) {
          handleOpenDiffView();
        }
      }, 500);
    } catch (err) {
      console.error("Error refreshing project data:", err);

      trackFeatureAction("project_refresh_failed", {
        project_id: projectId,
        error_message: err.message,
      });
    }
  };

  const handleResearchTaskStarted = (taskMeta) => {
    const projectId = id ? id : selectedProject?.id;

    const normalizedTask = {
      ...taskMeta,
      task_id: taskMeta?.task_id || taskMeta?.id || taskMeta?.taskId,
      project_id: taskMeta?.project_id || projectId,
      status: taskMeta?.status || "queued",
      type:
        taskMeta?.type ||
        taskMeta?.task_type ||
        taskMeta?.source_type ||
        "unknown",
      started_at: taskMeta?.started_at || new Date().toISOString(),
    };

    setResearchTasks((prev) => {
      const existingIndex = prev.findIndex(
        (t) => t.task_id && t.task_id === normalizedTask.task_id
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...normalizedTask,
        };
        return updated;
      }
      return [normalizedTask, ...prev];
    });

    setIsPollingResearchTasks(true);

    if (normalizedTask.task_id) {
      startedTaskIdsRef.current.add(normalizedTask.task_id);
      hadSessionTasksRef.current = true;
    }

    trackFeatureAction("company_research_task_started", {
      project_id: projectId,
      task_id: normalizedTask.task_id || null,
      task_type: normalizedTask.type,
    });
  };

  const extractTasksFromStatusResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.tasks)) return data.tasks;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  // Kick off an initial research task status check when project changes
  useEffect(() => {
    const projectId = id ? id : selectedProject?.id;
    if (!projectId) return;

    // Trigger a one-shot polling cycle; the polling effect will stop itself
    setIsPollingResearchTasks(true);
  }, [id, selectedProject?.id]);

  useEffect(() => {
    const projectId = id ? id : selectedProject?.id;
    if (!projectId || !isPollingResearchTasks) return;

    let intervalId;
    const POLL_INTERVAL_MS = 30000;

    const pollStatus = async () => {
      try {
        const response = await api.get(
          `/keyword-api/company-research/project/${projectId}/`
        );
        const tasks = extractTasksFromStatusResponse(response.data);

        setResearchTasks(tasks);

        const activeStatuses = new Set([
          "queued",
          "pending",
          "processing",
          "running",
          "in_progress",
        ]);

        const prevHasActive = hadActiveTasksRef.current;
        const hasActive = tasks.some((t) => activeStatuses.has(t.status));
        hadActiveTasksRef.current = hasActive;

        const failureStatuses = new Set(["failed", "error"]);
        const hasFailed = tasks.some((t) =>
          failureStatuses.has((t.status || "").toLowerCase())
        );

        tasks.forEach((task) => {
          const taskId = getTaskId(task);
          if (!taskId || !startedTaskIdsRef.current.has(taskId)) return;

          const status = (task.status || "").toLowerCase();
          const isCompetitor = isCompetitorTask(task);

          if (
            status === "completed" &&
            !shownCompletedTaskIdsRef.current.has(taskId) &&
            !showTaskCompleteModal
          ) {
            shownCompletedTaskIdsRef.current.add(taskId);
            const shouldShowCompletionModal = isCompetitor || hasPublishedData;
            if (shouldShowCompletionModal) {
              setRecentlyCompletedTask(task);
              setShowTaskCompleteModal(true);
            }

            if (isCompetitor) {
              toast.success(
                `${getTaskLabel(task)} research completed. Compare now.`
              );
            }
          } else if (
            failureStatuses.has(status) &&
            !shownFailedTaskIdsRef.current.has(taskId) &&
            isCompetitor
          ) {
            shownFailedTaskIdsRef.current.add(taskId);
            toast.error(
              `${getTaskLabel(task)} research task failed. Please retry.`
            );
          }
        });

        const sessionHasFailed = tasks.some((t) => {
          const taskId = getTaskId(t);
          if (!taskId || !startedTaskIdsRef.current.has(taskId)) return false;
          return failureStatuses.has((t.status || "").toLowerCase());
        });

        if (
          !hasActive &&
          prevHasActive &&
          tasks.length > 0 &&
          hadSessionTasksRef.current
        ) {
          try {
            await fetchProject();
          } catch (err) {
            console.error("Error refreshing project after research:", err);
          }

          trackFeatureAction("company_research_tasks_completed", {
            project_id: projectId,
            tasks_count: tasks.length,
            has_failed_tasks: sessionHasFailed,
          });

          startedTaskIdsRef.current.clear();
          shownCompletedTaskIdsRef.current.clear();
          shownFailedTaskIdsRef.current.clear();
          hadSessionTasksRef.current = false;
        }
      } catch (error) {
        console.error("Error polling research task status:", error);
        trackFeatureAction("company_research_task_status_failed", {
          project_id: projectId,
          error_message: error.message,
        });
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, selectedProject?.id, isPollingResearchTasks, hasPublishedData]);

  const handleTaskCompleteReviewNow = async () => {
    const projectId = id ? id : selectedProject?.id;
    setShowTaskCompleteModal(false);
    setHasUnsavedDecisions(false);
    setHasReviewDecisions(false);
    setIsGlobalTaskMonitorOpen(false);

    try {
      await fetchProject();

      // Check if this is a competitor research task
      // Check by agent_type, type, source_type, OR if source_id matches a competitor
      const taskSourceId = recentlyCompletedTask?.source_id;
      const isSourceIdCompetitor =
        taskSourceId &&
        competitors.some((c) => (c.source_id || c.id) === taskSourceId);

      const isCompetitorTask =
        recentlyCompletedTask?.agent_type ===
          "CompanyCompetitorResearchAgent" ||
        recentlyCompletedTask?.type === "competitor" ||
        recentlyCompletedTask?.source_type === "competitor" ||
        isSourceIdCompetitor;

      if (isCompetitorTask) {
        // For competitor tasks, open the competitor panel and hide sources panel
        const competitorSourceId = taskSourceId;

        if (competitorSourceId) {
          // Ensure Company Overview column is visible (no other panels selected)
          setSelectedSources([]);
          setSelectedInternalSources([]);
          setSelectedInternalSourceData(null);

          const competitor = competitors.find(
            (c) => (c.source_id || c.id) === competitorSourceId
          );

          if (competitor) {
            // Hide sources panel and open competitor panel
            setPanelCollapsed(true);
            setSelectedCompetitors([competitorSourceId]);
            fetchCompetitorData(competitorSourceId);
            toast.success("Competitor analysis completed. Data loaded.");
          }
        }

        trackFeatureAction("competitor_research_task_review_accepted", {
          project_id: projectId,
          task_id: recentlyCompletedTask?.task_id || recentlyCompletedTask?.id,
          source_id: competitorSourceId,
        });
      } else {
        // For company source tasks, open the review panel
        if (!isReviewMode) {
          handleOpenDiffView();
        }

        trackFeatureAction("company_research_task_review_accepted", {
          project_id: projectId,
          task_id: recentlyCompletedTask?.task_id || recentlyCompletedTask?.id,
        });
      }
    } catch (err) {
      console.error("Error refreshing project data for review:", err);
      toast.error("Failed to load latest project data for review.");
    } finally {
      setRecentlyCompletedTask(null);
    }
  };

  const handleTaskCompleteReviewLater = async () => {
    const projectId = id ? id : selectedProject?.id;
    setShowTaskCompleteModal(false);
    setIsTaskDrawerOpen(false);
    setIsGlobalTaskMonitorOpen(false);

    try {
      // Refresh latest project data in the background without opening diff view
      await fetchProject();
    } catch (err) {
      console.error(
        "Error refreshing project data after deferring review:",
        err
      );
    } finally {
      // Check if this is a competitor task by source_id or agent_type
      const taskSourceId = recentlyCompletedTask?.source_id;
      const isSourceIdCompetitor =
        taskSourceId &&
        competitors.some((c) => (c.source_id || c.id) === taskSourceId);

      const isCompetitorTask =
        recentlyCompletedTask?.agent_type ===
          "CompanyCompetitorResearchAgent" ||
        recentlyCompletedTask?.type === "competitor" ||
        recentlyCompletedTask?.source_type === "competitor" ||
        isSourceIdCompetitor;

      trackFeatureAction(
        isCompetitorTask
          ? "competitor_research_task_review_dismissed"
          : "company_research_task_review_dismissed",
        {
          project_id: projectId,
          task_id: recentlyCompletedTask?.task_id || recentlyCompletedTask?.id,
        }
      );
      setRecentlyCompletedTask(null);
    }
  };

  // Diff functionality - use actual newData content for consistency
  const hasSources = Array.isArray(sources) && sources.length > 0;
  const reviewableChangesExist = hasPendingChanges || hasReviewDecisions;
  const canShowDiff = hasSources && reviewableChangesExist && hasPublishedData;
  const publishDisabled =
    isPublishing ||
    !hasSources ||
    (!hasPendingChanges && !hasReviewDecisions && !hasEditedCurrentData);

  // Pending counts by section for Company Overview headers
  const pendingCountBySection = useMemo(() => {
    const counts = {};
    if (!newData) return counts;
    const sectionKeys = [
      "industries",
      "buyer_personas",
      "products_and_services",
      "target_markets",
      "differentiators",
      "geo_leo_strategy",
    ];
    sectionKeys.forEach((key) => {
      const newSection = newData?.[key];
      if (!newSection) {
        counts[key] = 0;
        return;
      }
      if (
        typeof newSection === "object" &&
        !Array.isArray(newSection) &&
        Object.keys(newSection).length === 0
      ) {
        counts[key] = 0;
        return;
      }
      const oldSection = oldData?.[key];
      if (
        key === "products_and_services" &&
        typeof newSection === "object" &&
        !newSection.list &&
        !newSection.overview
      ) {
        counts[key] = Object.keys(newSection || {}).length;
      } else {
        let c = 0;
        if (newSection.overview && newSection.overview !== oldSection?.overview)
          c += 1;
        if (Array.isArray(newSection.list)) {
          const oldList = oldSection?.list || [];
          const oldSet = new Set(
            oldList.map((it) =>
              typeof it === "string" ? it : JSON.stringify(it)
            )
          );
          newSection.list.forEach((it) => {
            const t = typeof it === "string" ? it : JSON.stringify(it);
            if (!oldSet.has(t)) c += 1;
          });
        }
        counts[key] = c;
      }
    });
    return counts;
  }, [oldData, newData]);

  const getTaskStepInfo = (task) => {
    const raw = task?.current_step;
    if (!raw) {
      return {
        label: "Processing",
        detail: "",
      };
    }

    const rawStr = String(raw);
    const digitMatch = rawStr.match(/\d+/);
    const stepNumber = digitMatch ? parseInt(digitMatch[0], 10) : null;
    const totalSteps =
      task.total_steps ||
      task.totalSteps ||
      task.steps_total ||
      task.step_count ||
      null;

    const words = rawStr
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

    const readable = words.join(" ");

    let label = readable || "Processing";
    if (stepNumber != null) {
      if (totalSteps != null) {
        label = `Step ${stepNumber} of ${totalSteps}`;
      } else {
        label = `Step ${stepNumber}`;
      }
    }

    const detail =
      readable && readable.toLowerCase() !== label.toLowerCase()
        ? readable
        : "";

    return { label, detail };
  };

  const groupedResearchTasks = useMemo(() => {
    if (!researchTasks || researchTasks.length === 0) {
      return {
        inProgress: [],
        completed: [],
        failed: [],
      };
    }

    const inProgress = [];
    const completed = [];
    const failed = [];

    researchTasks.forEach((task) => {
      const status = (task.status || "").toLowerCase();
      if (status === "completed") {
        completed.push(task);
      } else if (status === "failed" || status === "error") {
        failed.push(task);
      } else {
        inProgress.push(task);
      }
    });

    return { inProgress, completed, failed };
  }, [researchTasks]);

  const activeTasksFromMonitor = Array.isArray(categorizedTasks?.processing)
    ? categorizedTasks.processing.length
    : 0;
  const hasActiveResearchTasks =
    (typeof runningAgentsCount === "number" && runningAgentsCount > 0) ||
    activeTasksFromMonitor > 0;

  const processingTasks = Array.isArray(categorizedTasks?.processing)
    ? categorizedTasks.processing
    : [];

  const hasCompanyResearchInProgress = processingTasks.some((task) =>
    String(task?.agent_type || "").toLowerCase().includes("companyresearch")
  );

  const hasCompetitorResearchInProgress = processingTasks.some((task) =>
    String(task?.agent_type || "").toLowerCase().includes("competitor")
  );

  // Auto-select an in-progress task for the agent log and open the panel
  useEffect(() => {
    if (!groupedResearchTasks.inProgress.length) {
      return;
    }

    const currentId = selectedTaskIdForLog;
    const hasCurrent = groupedResearchTasks.inProgress.some(
      (t) => (t.task_id || t.id) === currentId
    );

    if (!currentId || !hasCurrent) {
      const first = groupedResearchTasks.inProgress[0];
      const idToSelect = first.task_id || first.id;
      if (idToSelect) {
        setSelectedTaskIdForLog(idToSelect);
        setIsAgentLogOpen(true);
      }
    }
  }, [groupedResearchTasks, selectedTaskIdForLog]);

  // When there are no in-progress tasks, close and clear the Agent activity panel
  useEffect(() => {
    if (groupedResearchTasks.inProgress.length === 0) {
      setIsAgentLogOpen(false);
      setSelectedTaskIdForLog(null);
    }
  }, [groupedResearchTasks.inProgress.length]);

  // Keep agent log scrolled to the latest event
  useEffect(() => {
    if (!agentLogContainerRef.current) return;
    const el = agentLogContainerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [taskEvents]);

  const selectedTaskForLog = useMemo(() => {
    if (!selectedTaskIdForLog) return null;
    const all = [
      ...groupedResearchTasks.inProgress,
      ...groupedResearchTasks.completed,
      ...groupedResearchTasks.failed,
    ];
    return (
      all.find((t) => (t.task_id || t.id) === selectedTaskIdForLog) || null
    );
  }, [selectedTaskIdForLog, groupedResearchTasks]);

  const handleOpenDiffView = () => {
    if (isReviewMode) {
      setIsReviewMode(false);
      setPanelCollapsed(false);
      return;
    }

    if (canShowDiff) {
      setReviewModeAnimating(true);
      setPanelCollapsed(true); // Collapse sources panel
      setSelectedInternalSources([]);
      setSelectedInternalSourceData(null);

      // Close competitor panel if open
      setSelectedCompetitors([]);
      setSelectedCompetitorData(null);

      // Close source panel if open
      setSelectedSources([]);

      setTimeout(() => {
        setIsReviewMode(true);
        setReviewModeAnimating(false);
      }, 150); // Small delay for smooth transition
    }
  };

  const handleCloseDiffView = () => {
    if (hasUnsavedDecisions) {
      setShowLeaveWarning(true);
    } else {
      exitReviewMode();
    }
  };

  const exitReviewMode = () => {
    setReviewModeAnimating(true);
    setIsReviewMode(false);

    setTimeout(() => {
      setPanelCollapsed(false); // Expand sources panel back
      setShowJsonView(false);
      setMergedResult(null);
      setReviewModeAnimating(false);
    }, 150); // Small delay for smooth transition
  };

  // Exit edit mode automatically if new pending changes appear
  useEffect(() => {
    if (hasPendingChanges && isEditMode) {
      setIsEditMode(false);
    }
  }, [hasPendingChanges, isEditMode]);

  const handleConfirmLeave = () => {
    setShowLeaveWarning(false);
    setHasUnsavedDecisions(false);
    exitReviewMode();
  };

  const handleCancelLeave = () => {
    setShowLeaveWarning(false);
  };

  // Sync scroll handler - using percentage-based scrolling for different content sizes
  const getScrollSyncTargets = (sourceRef) => {
    const targets = [];
    if (sourceRef === currentDataScrollRef) {
      if (selectedSources.length > 0) {
        targets.push(sourceDataScrollRef);
      }
      if (selectedCompetitors.length > 0) {
        targets.push(competitorDataScrollRef);
      }
      if (isReviewMode) {
        targets.push(reviewPanelScrollRef);
      }
    } else if (sourceRef === sourceDataScrollRef) {
      targets.push(currentDataScrollRef);
      if (isReviewMode) {
        targets.push(reviewPanelScrollRef);
      }
    } else if (sourceRef === competitorDataScrollRef) {
      targets.push(currentDataScrollRef);
      if (isReviewMode) {
        targets.push(reviewPanelScrollRef);
      }
    } else if (sourceRef === reviewPanelScrollRef) {
      targets.push(currentDataScrollRef);
      if (selectedSources.length > 0) {
        targets.push(sourceDataScrollRef);
      }
      if (selectedCompetitors.length > 0) {
        targets.push(competitorDataScrollRef);
      }
    }
    return targets;
  };

  const handleSyncScroll = (sourceRef) => {
    if (!syncScroll || isScrollingSyncRef.current) return;
    const targets = getScrollSyncTargets(sourceRef);
    if (!targets.length || !sourceRef.current) return;

    isScrollingSyncRef.current = true;

    const sourceScrollTop = sourceRef.current.scrollTop;
    const sourceScrollHeight =
      sourceRef.current.scrollHeight - sourceRef.current.clientHeight;
    const scrollPercentage =
      sourceScrollHeight > 0 ? sourceScrollTop / sourceScrollHeight : 0;

    targets.forEach((targetRef) => {
      if (!targetRef?.current) return;
      const targetScrollHeight =
        targetRef.current.scrollHeight - targetRef.current.clientHeight;
      targetRef.current.scrollTop =
        targetScrollHeight > 0 ? scrollPercentage * targetScrollHeight : 0;
    });

    setTimeout(() => {
      isScrollingSyncRef.current = false;
    }, 100);
  };

  const handleMergedChange = (mergeData) => {
    setMergedResult(mergeData);
    setHasPendingChanges(mergeData?.hasChanges || false);

    const decisionValues = Object.values(mergeData?.decisions || {});
    const hasDecisions = decisionValues.some(
      (decision) => decision === "accepted" || decision === "rejected"
    );

    setHasUnsavedDecisions(hasDecisions);
    setHasReviewDecisions(hasDecisions);

    // Don't update main oldData and newData states here to avoid infinite loops
    // The child component manages its own merged state internally
    // Only update main states through explicit user actions (accept/reject/remove)
  };

  const handlePublish = async (publishData) => {
    const projectId = id ? id : selectedProject?.id;

    // Analyze decisions for detailed tracking
    const decisions = publishData.decisions || {};
    const acceptedCount = Object.values(decisions).filter(
      (d) => d === "accepted"
    ).length;
    const rejectedCount = Object.values(decisions).filter(
      (d) => d === "rejected"
    ).length;
    const pendingCount = Object.values(decisions).filter(
      (d) => d === "pending"
    ).length;

    trackFeatureAction("project_publish_started", {
      project_id: projectId,
      decisions_count: Object.keys(decisions).length,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      pending_count: pendingCount,
    });

    try {
      console.log("Publishing data:", publishData);

      // Create the final data to send based on accepted/rejected decisions
      const finalOldData = { ...publishData.oldData };
      const finalNewData = { ...publishData.newData };

      // Remove accepted items from new_data and rejected items should already be handled
      const decisions = publishData.decisions || {};

      // Process decisions to clean up new_data
      Object.entries(decisions).forEach(([decisionKey, decision]) => {
        if (decision === "accepted") {
          // Remove accepted items from new_data since they're now in old_data
          const [sectionKey, fieldType] = decisionKey.split("_");
          if (fieldType === "overview" && finalNewData[sectionKey]) {
            delete finalNewData[sectionKey].overview;
            if (
              !finalNewData[sectionKey].list ||
              finalNewData[sectionKey].list.length === 0
            ) {
              delete finalNewData[sectionKey];
            }
          }
        } else if (decision === "rejected") {
          // Rejected items should be removed from new_data
          const parts = decisionKey.split("_");
          const sectionKey = parts[0];
          const fieldType = parts[1];
          const content = parts.slice(2).join("_");

          if (fieldType === "overview" && finalNewData[sectionKey]) {
            delete finalNewData[sectionKey].overview;
            if (
              !finalNewData[sectionKey].list ||
              finalNewData[sectionKey].list.length === 0
            ) {
              delete finalNewData[sectionKey];
            }
          } else if (
            finalNewData[sectionKey]?.list &&
            fieldType !== "overview"
          ) {
            finalNewData[sectionKey].list = finalNewData[
              sectionKey
            ].list.filter((item) => item !== content);
            if (finalNewData[sectionKey].list.length === 0) {
              delete finalNewData[sectionKey].list;
              if (!finalNewData[sectionKey].overview) {
                delete finalNewData[sectionKey];
              }
            }
          }
        }
      });

      // Send updated data to backend
      const response = await api.post("/api/project-details/publish", {
        project_id: selectedProject?.id,
        old_data: finalOldData,
        new_data: finalNewData,
        decisions: decisions,
      });

      // Update local state with published data
      setOldData(finalOldData);
      setNewData(finalNewData);
      setHasPendingChanges(Object.keys(finalNewData).length > 0);
      setHasUnsavedDecisions(false); // Reset unsaved decisions flag
      setHasReviewDecisions(false);

      // Exit review mode
      exitReviewMode();

      console.log("Changes published successfully!");
    } catch (err) {
      console.error("Error publishing changes:", err);
      // You might want to show a toast error here
    }
  };

  const handleResetChanges = async () => {
    const projectId = id ? id : selectedProject?.id;

    trackFeatureAction("project_reset_changes_started", {
      project_id: projectId,
    });

    try {
      console.log("Resetting all changes...");

      // Refresh data from server to get clean state
      await fetchProject();

      // Reset local state
      setMergedResult(null);
      setHasUnsavedDecisions(false);
      setHasReviewDecisions(false);
      setHasEditedCurrentData(false);

      trackFeatureAction("project_reset_changes_success", {
        project_id: projectId,
      });

      console.log("Changes reset successfully!");
    } catch (err) {
      console.error("Error resetting changes:", err);
      // Fallback: just refresh data from server
      try {
        await fetchProject();
        setMergedResult(null);
        setHasUnsavedDecisions(false);
        setHasReviewDecisions(false);
        setHasEditedCurrentData(false);
        console.log("Fallback: Data refreshed from server");
      } catch (refreshErr) {
        console.error("Error refreshing data:", refreshErr);
      }
    }
  };

  const handleRemoveFromOld = (updatedOldData) => {
    const projectId = id ? id : selectedProject?.id;

    trackFeatureAction("project_remove_from_old", {
      project_id: projectId,
      old_data_keys_count: Object.keys(updatedOldData || {}).length,
    });

    setOldData(updatedOldData);
    setMergedResult((prev) => ({
      ...prev,
      oldData: updatedOldData,
    }));

    // Re-check for duplicates after data change
    checkForDuplicates(updatedOldData, newData);
  };

  const handleRemoveFromNew = (updatedNewData) => {
    const projectId = id ? id : selectedProject?.id;

    trackFeatureAction("project_remove_from_new", {
      project_id: projectId,
      new_data_keys_count: Object.keys(updatedNewData || {}).length,
    });

    setNewData(updatedNewData);
    setHasPendingChanges(
      !!(updatedNewData && Object.keys(updatedNewData).length > 0)
    );
    setMergedResult((prev) => ({
      ...prev,
      newData: updatedNewData,
      hasChanges: !!(updatedNewData && Object.keys(updatedNewData).length > 0),
    }));

    // Re-check for duplicates after data change
    checkForDuplicates(oldData, updatedNewData);
  };

  const handleRemoveFromCurrentData = (
    sectionKey,
    fieldType,
    productKey = null,
    keyword = null,
    itemIndex = null
  ) => {
    const newOldData = { ...oldData };

    setHasEditedCurrentData(true);

    if (fieldType === "overview") {
      if (newOldData[sectionKey]) {
        delete newOldData[sectionKey].overview;
        if (
          !newOldData[sectionKey].list ||
          newOldData[sectionKey].list.length === 0
        ) {
          delete newOldData[sectionKey];
        }
      }
    } else if (fieldType === "item" && itemIndex !== null) {
      if (newOldData[sectionKey]?.list) {
        newOldData[sectionKey].list = newOldData[sectionKey].list.filter(
          (_, index) => index !== itemIndex
        );
        if (newOldData[sectionKey].list.length === 0) {
          delete newOldData[sectionKey].list;
          if (!newOldData[sectionKey].overview) {
            delete newOldData[sectionKey];
          }
        }
      }
    } else if (fieldType === "product_category" && productKey) {
      // Remove entire product category
      if (newOldData[sectionKey] && newOldData[sectionKey][productKey]) {
        delete newOldData[sectionKey][productKey];
        // If no more product keys, delete the entire section
        if (Object.keys(newOldData[sectionKey]).length === 0) {
          delete newOldData[sectionKey];
        }
      }
    } else if (fieldType === "product_keyword" && productKey && keyword) {
      // Remove individual product keyword (safe immutable updates)
      if (
        newOldData[sectionKey] &&
        newOldData[sectionKey][productKey] !== undefined
      ) {
        const sectionObj = { ...newOldData[sectionKey] };
        const productData = sectionObj[productKey];

        if (Array.isArray(productData)) {
          const updated = productData.filter((kw) => kw !== keyword);
          if (updated.length > 0) {
            sectionObj[productKey] = updated;
          } else {
            delete sectionObj[productKey];
          }
        } else if (
          productData &&
          typeof productData === "object" &&
          Array.isArray(productData.keywords)
        ) {
          const updatedKw = productData.keywords.filter((kw) => kw !== keyword);
          if (updatedKw.length > 0) {
            sectionObj[productKey] = { ...productData, keywords: updatedKw };
          } else {
            delete sectionObj[productKey];
          }
        }

        // Replace or remove section based on remaining categories
        if (Object.keys(sectionObj).length === 0) {
          delete newOldData[sectionKey];
        } else {
          newOldData[sectionKey] = sectionObj;
        }
      }
    }

    setOldData(newOldData);

    // Update merged result if in review mode
    if (mergedResult) {
      setMergedResult((prev) => ({
        ...prev,
        oldData: newOldData,
      }));
    }

    // Re-check for duplicates after data change
    checkForDuplicates(newOldData, newData);
  };

  // Enhanced duplicate detection function
  const checkForDuplicates = (oldDataToCheck, newDataToCheck) => {
    if (!oldDataToCheck || !newDataToCheck) {
      setDuplicateItems([]);
      return;
    }

    const duplicates = [];

    Object.keys(newDataToCheck).forEach((sectionKey) => {
      const newSection = newDataToCheck[sectionKey];
      const oldSection = oldDataToCheck[sectionKey];

      if (!oldSection || !newSection) return;

      // Check list items duplicates
      if (newSection?.list && oldSection?.list) {
        newSection.list.forEach((newItem, newIndex) => {
          oldSection.list.forEach((oldItem, oldIndex) => {
            // Compare items deeply
            const itemsMatch =
              typeof newItem === "string"
                ? newItem === oldItem
                : JSON.stringify(newItem) === JSON.stringify(oldItem);

            if (itemsMatch) {
              duplicates.push({
                sectionKey,
                item: newItem,
                newIndex,
                oldIndex,
                type: "item",
                content: newItem,
              });
            }
          });
        });
      }

      // Check overview duplicates
      if (oldSection?.overview && newSection?.overview) {
        const overviewsMatch =
          typeof newSection.overview === "string"
            ? oldSection.overview === newSection.overview
            : JSON.stringify(oldSection.overview) ===
              JSON.stringify(newSection.overview);

        if (overviewsMatch) {
          duplicates.push({
            sectionKey,
            item: newSection.overview,
            type: "overview",
            content: newSection.overview,
          });
        }
      }

      // Handle products_and_services special case (nested objects)
      if (
        sectionKey === "products_and_services" &&
        typeof newSection === "object" &&
        !newSection.list &&
        !newSection.overview &&
        typeof oldSection === "object" &&
        !oldSection.list &&
        !oldSection.overview
      ) {
        Object.keys(newSection).forEach((productKey) => {
          if (oldSection[productKey]) {
            const newProduct = newSection[productKey];
            const oldProduct = oldSection[productKey];

            if (JSON.stringify(newProduct) === JSON.stringify(oldProduct)) {
              duplicates.push({
                sectionKey,
                item: newProduct,
                type: "product",
                content: newProduct,
                productKey,
              });
            }
          }
        });
      }
    });

    setDuplicateItems(duplicates);
  };

  // Publishing functionality
  const handlePublishClick = () => {
    setShowPublishConfirm(true);
  };

  const handleConfirmPublish = async () => {
    const projectId = selectedProject?.id;

    setIsPublishing(true);
    setShowPublishConfirm(false);

    trackFeatureAction("project_publish_confirm_started", {
      project_id: projectId,
    });

    try {
      // Prepare the data payload for the API
      const publishData = {
        project_id: projectId,
        old_data: mergedResult?.oldData || oldData || {},
        new_data: mergedResult?.newData || newData || {},
      };

      console.log("Publishing data:", publishData);

      // Call the real API to update company research data
      const response = await api.post(
        "/keyword-api/update-company-research-data/",
        publishData
      );
      const result = response.data;
      console.log("Data published successfully:", result);

      toast.success("Data published successfully");
      const refreshed = await fetchProject();

      // Auto-close review if new_data is now empty
      const isEmptyNewData =
        !refreshed?.new_data ||
        Object.keys(refreshed.new_data || {}).length === 0;
      if (isEmptyNewData && isReviewMode) {
        exitReviewMode();
      }

      // Show success message (optional)
      // You could add a toast notification here
    } catch (error) {
      console.error("Error publishing data:", error);
      // You could show an error toast notification here
      alert(`Failed to publish data: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset functionality
  const handleReset = async () => {
    const projectId = selectedProject?.id;

    if (!projectId) {
      console.error("No project ID available for reset");
      return;
    }

    console.log("Resetting data, Project Id: ", projectId);

    setIsResetting(true);

    trackFeatureAction("project_reset_started", {
      project_id: projectId,
    });

    try {
      await fetchProject();
    } catch (error) {
      console.error("Error resetting data:", error);
    } finally {
      setIsResetting(false);
    }
  };

  // Function to remove accepted items from new data

  const handleAcceptChange = (
    sectionKey,
    fieldType,
    itemIndex = null,
    content = null
  ) => {
    const projectId = id ? id : selectedProject?.id;

    trackFeatureAction("project_decision_accept", {
      project_id: projectId,
      section_key: sectionKey,
      field_type: fieldType,
      item_index: itemIndex,
      content_preview: content
        ? typeof content === "string"
          ? content.substring(0, 50)
          : JSON.stringify(content).substring(0, 50)
        : null,
    });

    const updatedNewData = { ...newData };

    if (fieldType === "overview") {
      if (updatedNewData[sectionKey]) {
        delete updatedNewData[sectionKey].overview;
        if (
          !updatedNewData[sectionKey].list ||
          updatedNewData[sectionKey].list.length === 0
        ) {
          delete updatedNewData[sectionKey];
        }
      }
    } else if (fieldType === "product_category") {
      // Handle entire product category acceptance - remove from newData
      const productKey = content; // content is productKey in this case
      if (
        updatedNewData[sectionKey] &&
        updatedNewData[sectionKey][productKey]
      ) {
        delete updatedNewData[sectionKey][productKey];
        // If no more product keys, delete the entire section
        if (Object.keys(updatedNewData[sectionKey]).length === 0) {
          delete updatedNewData[sectionKey];
        }
      }
    } else if (fieldType === "product_keyword") {
      // Handle individual product keyword acceptance - remove from newData
      const productKey = itemIndex; // itemIndex is productKey in this case
      const keyword = content; // content is the keyword
      if (
        updatedNewData[sectionKey] &&
        updatedNewData[sectionKey][productKey]
      ) {
        const productData = updatedNewData[sectionKey][productKey];
        if (Array.isArray(productData)) {
          // Handle direct array structure
          updatedNewData[sectionKey][productKey] = productData.filter(
            (kw) => kw !== keyword
          );
          if (updatedNewData[sectionKey][productKey].length === 0) {
            delete updatedNewData[sectionKey][productKey];
          }
        } else if (productData.keywords) {
          // Handle object with keywords array structure
          productData.keywords = productData.keywords.filter(
            (kw) => kw !== keyword
          );
          if (productData.keywords.length === 0) {
            delete updatedNewData[sectionKey][productKey];
          }
        }
        // If no more product keys, delete the entire section
        if (Object.keys(updatedNewData[sectionKey]).length === 0) {
          delete updatedNewData[sectionKey];
        }
      }
    } else if (fieldType === "item" && itemIndex !== null) {
      if (updatedNewData[sectionKey]?.list) {
        updatedNewData[sectionKey].list = updatedNewData[
          sectionKey
        ].list.filter((_, index) => index !== itemIndex);
        if (updatedNewData[sectionKey].list.length === 0) {
          delete updatedNewData[sectionKey].list;
          if (!updatedNewData[sectionKey].overview) {
            delete updatedNewData[sectionKey];
          }
        }
      }
    }

    setNewData(updatedNewData);
    setHasPendingChanges(Object.keys(updatedNewData).length > 0);
    checkForDuplicates(oldData, updatedNewData);
  };

  useEffect(() => {
    async function initializeProject() {
      if (!selectedProject?.id) return; // Don't fetch without a valid ID

      try {
        await fetchProject();
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    }

    initializeProject();
  }, [selectedProject?.id]);

  // Check for duplicates whenever data changes
  useEffect(() => {
    if (oldData && newData) {
      checkForDuplicates(oldData, newData);
    }
  }, [oldData, newData]);

  // Add warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedDecisions) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes in the review. Are you sure you want to leave without publishing?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedDecisions]);

  // ✅ Loading UI with shimmer skeleton
  if (loading || isResetting) {
    return (
      <div className="h-[calc(100vh-120px)] p-4 grid grid-cols-3 grid-rows-7 animate-pulse">
        {/* header columns */}
        <div className="h-full rounded-xl col-span-3 row-span-1">
          <div className="h-12 w-full bg-gray-200 rounded" />
        </div>

        {/* Column 1 (Sources) */}
        <div className="h-full rounded-xl flex flex-col space-y-4 px-2 row-span-7 col-span-1">
          <div className="h-6 w-2/3 bg-gray-200 rounded" />
          <div className="flex-1 bg-gray-200 rounded-lg" />
        </div>

        {/* Column 2 (Company Overview) */}
        <div className="h-full rounded-xl flex flex-col space-y-4 px-2 row-span-7 col-span-2">
          <div className="h-6 w-2/3 bg-gray-200 rounded" />
          <div className="flex-1 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // ✅ Only show this after loading is done
  if (!loading && !project)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Project not found</div>
      </div>
    );

  return (
    <>
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
      `}</style>

      <div className="h-screen flex flex-col bg-gray-50">
        {/* Enhanced Header */}
        <header className="flex justify-between items-center mx-4 p-4 bg-white shadow-sm flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Knowledge Base
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Company & Competitor information for your AI Agents{" "}
            </p>
          </div>
          <div className="flex items-center justify-between space-x-3 ml-4">
            {/* Duplicate Warning */}
            {duplicateItems.length > 0 && (
              <div className="flex items-center px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm text-amber-800">
                  duplicate
                  {duplicateItems.length > 1 ? "s" : ""} found
                </span>
              </div>
            )}

            {/* <button
              onClick={() => setIsTaskDrawerOpen((v) => !v)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer shadow-sm ${
                hasActiveResearchTasks
                  ? "border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  hasActiveResearchTasks
                    ? "text-blue-600 animate-spin"
                    : "text-gray-500"
                }`}
              />
              <span>Task monitor</span>
              {hasActiveResearchTasks && (
                <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              )}
            </button> */}

            {/* <motion.button
              onClick={() => setIsTaskDrawerOpen((v) => !v)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer shadow-sm
        transition-colors duration-200
        ${
          hasActiveResearchTasks
            ? "border-blue-400 bg-blue-50 text-blue-800 hover:bg-blue-100 shadow-md"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
        }
      `}
            >
              <span className="font-medium">Task Monitor</span>
              {hasActiveResearchTasks && (
                <div className="relative flex items-center justify-center">
                  <motion.span
                    className="absolute inline-flex h-2 w-2 rounded-full bg-green-400"
                    animate={{
                      scale: [1, 2.2],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </div>
              )}
            </motion.button> */}

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center cursor-pointer space-x-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              title="Reset to fresh data from server"
            >
              <RotateCcw size={14} />
              <span className="text-sm">Reset</span>
            </button>

            {hasSources ? (
              <>
                {/* Publish Button */}
                <button
                  onClick={handlePublishClick}
                  disabled={publishDisabled}
                  className={`flex items-center space-x-2 px-4 py-2 cursor-pointer rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    publishDisabled
                      ? "bg-gray-300 text-gray-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                  title={
                    publishDisabled
                      ? "Add and review source updates to enable publishing"
                      : "Publish current state to server"
                  }
                >
                  <Save size={14} />
                  <span className="text-sm">
                    {isPublishing ? "Publishing..." : "Publish State"}
                  </span>
                </button>

                {/* Review or Edit Button */}
                {hasPendingChanges ? (
                  <button
                    onClick={handleOpenDiffView}
                    disabled={!canShowDiff}
                    className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-red-600 text-white transition-all duration-200 cursor-pointer
                  ${
                    isReviewMode
                      ? "bg-red-600 text-white"
                      : canShowDiff
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transform cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
                  >
                    <FileText size={14} />
                    <span className="text-sm">
                      {isReviewMode ? "Exit Review" : "Review School Profile"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditMode((v) => !v);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                      isEditMode
                        ? "bg-red-600 text-white"
                        : "bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-lg hover:shadow-xl"
                    }`}
                    title={
                      isEditMode
                        ? "Exit Edit — stop deleting from the School Profile"
                        : "Edit Changes — delete items from the School Profile"
                    }
                  >
                    {isEditMode ? <X size={14} /> : <Pencil size={14} />}
                    <span className="text-sm">
                      {isEditMode ? "Exit Edit" : "Edit Changes"}
                    </span>
                  </button>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-dashed border-gray-200">
                Add a source to enable review and publishing workflow
              </div>
            )}

            {sources.length > 0 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {sources.length} source{sources.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area - Full Height */}
        <div
          className={`grid gap-4 p-4 transition-all duration-300 ${
            reviewModeAnimating ? "opacity-50" : "opacity-100"
          }`}
          style={{
            gridTemplateColumns:
              selectedCompetitors.length > 0 || selectedSources.length > 0 || selectedInternalSources.length > 0
                ? panelCollapsed
                  ? "64px 1fr 1fr"
                  : "0.7fr 1fr 1fr"
                : isReviewMode
                ? panelCollapsed
                  ? "64px 1fr 1fr"
                  : "0.7fr 1fr 1fr"
                : panelCollapsed
                ? "64px 1fr"
                : "0.7fr 2fr",
          }}
        >
          <div>
            <SourcesAndCompetitorsPanel
              projectId={id}
              collapsed={panelCollapsed}
              toggleCollapse={() => setPanelCollapsed((p) => !p)}
              sources={sources}
              setSources={setSources}
              selectedSources={selectedSources}
              setSelectedSources={setSelectedSources}
              competitors={competitors}
              setCompetitors={setCompetitors}
              selectedCompetitors={selectedCompetitors}
              setSelectedCompetitors={setSelectedCompetitors}
              internalSources={internalSources}
              setInternalSources={setInternalSources}
              selectedInternalSources={selectedInternalSources}
              setSelectedInternalSources={setSelectedInternalSources}
              onSourceAdded={refreshProjectData}
              onCompetitorAdded={refreshProjectData}
              onInternalSourceAdded={fetchInternalSources}
              hasPendingChanges={hasPendingChanges}
              onOpenReviewRequested={() => {
                toast.error(
                  "Pending changes exist. Please review and publish before adding new sources."
                );
                if (!isReviewMode) {
                  handleOpenDiffView();
                }
              }}
              hasActiveResearchTasks={hasActiveResearchTasks}
              hasCompanyResearchInProgress={hasCompanyResearchInProgress}
              hasCompetitorResearchInProgress={hasCompetitorResearchInProgress}
              onOpenResearchTasksView={() => {
                openGlobalTaskMonitor();
              }}
              openGlobalTaskMonitor={openGlobalTaskMonitor}
              onResearchTaskStarted={handleResearchTaskStarted}
              onCompetitorSelect={handleCompetitorSelect}
              onSourceSelect={handleSourceSelect}
              onInternalSourceSelect={handleInternalSourceSelect}
              onCurrentDataSelect={handleCurrentDataSelect}
            />
          </div>
          {selectedSources.length === 0 && selectedInternalSources.length === 0 && (
            <div className="relative">
              {(() => {
                const displayData = mergedResult?.oldData || oldData;

                return displayData ? (
                  <CurrentDataSection
                    scrollRef={currentDataScrollRef}
                    onScroll={() => handleSyncScroll(currentDataScrollRef)}
                    data={displayData}
                    title="School Profile"
                    onRemove={handleRemoveFromCurrentData}
                    showRemove={isReviewMode || isEditMode}
                    expandedSections={sharedExpandedSections}
                    setExpandedSections={setSharedExpandedSections}
                    isSourceData={false}
                    pendingCountBySection={pendingCountBySection}
                    onPendingIndicatorClick={() => {
                      if (!isReviewMode && hasPendingChanges)
                        handleOpenDiffView();
                    }}
                  />
                ) : (
                  <OverviewSection
                    sources={sources}
                    selectedSources={selectedSources}
                  />
                );
              })()}
            </div>
          )}
          {selectedSources.length > 0 && selectedCompetitors.length === 0 && (
            <div className="h-[calc(100vh-180px)] relative col-span-2">
              {(() => {
                const selectedSourceId =
                  selectedSources.length > 0 ? selectedSources[0] : null;
                const selectedSource = selectedSourceId
                  ? sources.find(
                      (source) =>
                        (source.id || source.source_id) === selectedSourceId
                    )
                  : null;

                const sourceData = selectedSource
                  ? selectedSource.generated_content || selectedSource
                  : null;
                const sourceTitle = selectedSource
                  ? selectedSource.file_name || selectedSource.url || "Source"
                  : "Source";

                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-white">
                      <h3 className="font-semibold text-sm text-gray-700">
                        Source Data
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSyncScroll(!syncScroll)}
                          className={`p-1.5 rounded transition-all ${
                            syncScroll
                              ? "bg-primary text-white hover:bg-primary-dark"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          title={
                            syncScroll
                              ? "Disable scroll sync between panels"
                              : "Enable scroll sync between panels"
                          }
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSources([]);
                          }}
                          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Close source panel"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {sourceData ? (
                      <CurrentDataSection
                        scrollRef={sourceDataScrollRef}
                        onScroll={() => handleSyncScroll(sourceDataScrollRef)}
                        data={sourceData}
                        title={sourceTitle}
                        showRemove={false}
                        expandedSections={sharedExpandedSections}
                        setExpandedSections={setSharedExpandedSections}
                        isSourceData={true}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          No source data available
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          {selectedCompetitors.length > 0 && (
            <div className="h-[calc(100vh-180px)] relative">
              <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col overflow-hidden">
                {/* Competitor Panel Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-white">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      Coverage vs Other School
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      Review what you share, and what the other school covers uniquely.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Sync Scroll Toggle Button */}
                    <button
                      onClick={() => setSyncScroll(!syncScroll)}
                      className={`p-1.5 rounded transition-all ${
                        syncScroll
                          ? "bg-primary text-white hover:bg-primary-dark"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      title={
                        syncScroll
                          ? "Disable scroll sync between panels"
                          : "Enable scroll sync between panels"
                      }
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                      </svg>
                    </button>
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setSelectedCompetitors([]);
                        setSelectedCompetitorData(null);
                      }}
                      className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Close competitor panel"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {loadingCompetitorData ? (
                  <div className="p-6 space-y-4">
                    {/* Header Shimmer */}
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>

                    {/* Section Shimmers */}
                    {[1, 2, 3, 4].map((section) => (
                      <div
                        key={section}
                        className="border border-gray-200 rounded-lg p-4 animate-pulse"
                      >
                        <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-full"></div>
                          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                          <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                        </div>
                      </div>
                    ))}

                    {/* List Items Shimmer */}
                    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-gray-100 rounded-full"></div>
                            <div className="h-3 bg-gray-100 rounded flex-1"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : selectedCompetitorData ? (
                  selectedCompetitorData?.overlap_data &&
                  selectedCompetitorData?.non_overlap_data ? (
                    <div
                      ref={competitorDataScrollRef}
                      onScroll={() => handleSyncScroll(competitorDataScrollRef)}
                      className="flex-1 overflow-auto p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            Other School: {selectedCompetitorData?.overlap_data?.competitor_name || "Other School"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {selectedCompetitorData?.overlap_data?.competitor_source ||
                              selectedCompetitorData?.non_overlap_data?.competitor_source ||
                              ""}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {isSavingCompetitorOverlap ? "Saving..." : ""}
                        </div>
                      </div>

                      {OVERLAP_SECTION_CONFIG.map((section) => {
                        const overlap = selectedCompetitorData.overlap_data?.[section.key];
                        const nonOverlap = selectedCompetitorData.non_overlap_data?.[section.key];
                        const sectionOverviewText =
                          overlap?.overview || nonOverlap?.overview || null;

                        const sectionCollapseState = collapsedItemsPanels?.[section.key] || {};
                        const resolvePanelState = (panelKey, defaultValue) => {
                          const stored = sectionCollapseState[panelKey];
                          return typeof stored === "boolean" ? stored : defaultValue;
                        };

                        if (section.key === "products_and_services") {
                          const totalCount = Object.values(
                            overlap?.products_and_services || {}
                          ).reduce((acc, val) => acc + normalizeList(val).length, 0) +
                            Object.values(nonOverlap?.products_and_services || {}).reduce(
                              (acc, val) => acc + normalizeList(val).length,
                              0
                            );

                          return (
                            <OverlapSectionCard
                              key={section.key}
                              sectionKey={section.key}
                              title={`${section.title} vs Other School`}
                              subtitle={`Compare ${section.title} coverage between your school and the other school.`}
                              overview={sectionOverviewText}
                              totalCount={totalCount}
                            >
                              {({ overviewTheme }) => (
                                <>
                                  <SectionOverview text={sectionOverviewText} themeClass={overviewTheme} />
                                  <ProductsAndServicesOverlap
                                    overlap={selectedCompetitorData.overlap_data}
                                    nonOverlap={selectedCompetitorData.non_overlap_data}
                                    onMove={handleMoveCompetitorItem}
                                    collapsedState={sectionCollapseState}
                                    onTogglePanel={toggleItemsPanel}
                                  />
                                </>
                              )}
                            </OverlapSectionCard>
                          );
                        }

                        const overlapItems = normalizeList(overlap?.list);
                        const nonOverlapItems = normalizeList(nonOverlap?.list);
                        const totalCount = overlapItems.length + nonOverlapItems.length;

                        const overlapDefaultCollapsed = overlapItems.length === 0;
                        const nonOverlapDefaultCollapsed = nonOverlapItems.length === 0;
                        const isOverlapCollapsed = resolvePanelState("overlap", overlapDefaultCollapsed);
                        const isNonOverlapCollapsed = resolvePanelState(
                          "non_overlap",
                          nonOverlapDefaultCollapsed
                        );

                        return (
                          <OverlapSectionCard
                            key={section.key}
                            sectionKey={section.key}
                            title={`${section.title} vs Other School`}
                            subtitle={`Compare ${section.title} coverage between your school and the other school.`}
                            overview={sectionOverviewText}
                            totalCount={totalCount}
                          >
                            {({ overviewTheme }) => (
                              <>
                                <SectionOverview text={sectionOverviewText} themeClass={overviewTheme} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <OverlapItemsPanel
                                    title={getOverlapPanelTitle(section.key, "overlap")}
                                    tone="overlap"
                                    items={overlapItems}
                                    isCollapsed={isOverlapCollapsed}
                                    onToggle={() => toggleItemsPanel(section.key, "overlap")}
                                    onMove={(item) =>
                                      handleMoveCompetitorItem({
                                        sectionKey: section.key,
                                        item,
                                        from: "overlap",
                                      })
                                    }
                                    moveTitle={getOverlapPanelTitle(section.key, "non_overlap")}
                                    moveIcon={<ArrowRight className="w-3 h-3" />}
                                    infoText={OVERLAP_TOOLTIP_TEXT}
                                    hintLabel="Your School + Other School"
                                    moveLabel="Remove"
                                  />

                                  <OverlapItemsPanel
                                    title={getOverlapPanelTitle(section.key, "non_overlap")}
                                    tone="non_overlap"
                                    items={nonOverlapItems}
                                    isCollapsed={isNonOverlapCollapsed}
                                    onToggle={() => toggleItemsPanel(section.key, "non_overlap")}
                                    onMove={(item) =>
                                      handleMoveCompetitorItem({
                                        sectionKey: section.key,
                                        item,
                                        from: "non_overlap",
                                      })
                                    }
                                    moveTitle={getOverlapPanelTitle(section.key, "overlap")}
                                    moveIcon={<ArrowLeft className="w-3 h-3" />}
                                    infoText={NON_OVERLAP_TOOLTIP_TEXT}
                                    hintLabel="Other School Only"
                                    moveLabel="Add"
                                  />
                                </div>
                                {(() => {
                                  const reasoningText =
                                    overlap?.overlap_reasoning ||
                                    nonOverlap?.non_overlap_reasoning ||
                                    getDefaultReasoning(section.key);
                                  if (!reasoningText) return null;
                                  return (
                                    <div className="mt-4 text-xs text-gray-600 leading-relaxed">
                                      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                                        What this means
                                      </div>
                                      <p>{reasoningText}</p>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </OverlapSectionCard>
                        );
                      })}
                    </div>
                  ) : (
                    <CurrentDataSection
                      scrollRef={competitorDataScrollRef}
                      onScroll={() => handleSyncScroll(competitorDataScrollRef)}
                      data={selectedCompetitorData}
                      title={`Other School: ${
                        selectedCompetitorData.competitor_name ||
                        "Other School Data"
                      }`}
                      showRemove={false}
                      expandedSections={sharedExpandedSections}
                      setExpandedSections={setSharedExpandedSections}
                      isSourceData={true}
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      No other school data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedInternalSources.length > 0 && (
            <div className="h-[calc(100vh-180px)] relative col-span-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-700">
                      Internal Source Data
                    </h3>
                    {selectedInternalSourceData && (
                      <span className="text-xs text-gray-500 font-medium">
                        - {selectedInternalSourceData.file_name || selectedInternalSourceData.title || 'Untitled'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedInternalSources([]);
                        setSelectedInternalSourceData(null);
                      }}
                      className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Close internal source panel"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {loadingInternalSourceData ? (
                  <div className="p-6 space-y-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ) : selectedInternalSourceData ? (
                  <div className="flex-1 overflow-y-auto">
                    {/* Header with title and tags */}
                    <div className="bg-white border-b border-gray-200 p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">
                        {selectedInternalSourceData.title || "Untitled Document"}
                      </h2>

                      {/* Tags */}
                      {selectedInternalSourceData.tags &&
                        selectedInternalSourceData.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-500">
                              Tags:
                            </span>
                            {selectedInternalSourceData.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Content Editor */}
                    <div className="p-6 h-full">
                      <TiptapMarkdownViewer 
                        key={`${selectedInternalSourceData.source_id}-${internalForcePreviewKey}`}
                        content={internalMarkdown || ''}
                        editable={internalLockStatus?.can_edit || false}
                        initialMode="preview"
                        showToolbar={true}
                        showBubbleMenu={true}
                        showModeToggle={true}
                        className="h-full"
                        defaultTheme="light"
                        filename={
                          selectedInternalSourceData.title ||
                          selectedInternalSourceData.file_name ||
                          'Internal Document'
                        }
                        lockStatus={internalLockStatus}
                        isAcquiringLock={isAcquiringInternalLock}
                        onAcquireLock={() => {
                          const sourceId = selectedInternalSourceData?.source_id;
                          if (!sourceId) return false;
                          return acquireInternalLock(sourceId);
                        }}
                        onReleaseLock={() => {
                          const sourceId = selectedInternalSourceData?.source_id;
                          if (!sourceId) return;
                          return releaseInternalLock(sourceId, { forcePreview: true });
                        }}
                        onRequestEdit={handleInternalBeforeEditMode}
                        onContentChange={(html) => {
                          setInternalMarkdown(html);
                          setInternalHasUnsavedChanges(true);
                        }}
                        showThemeToggle={true}
                        showExpandButton={true}
                        forcePreviewKey={internalForcePreviewKey}
                        expandedStatusBarProps={{
                          alwaysVisible: true,
                          visible: internalIsEditing || isAcquiringInternalLock,
                          isEditingEnabled: internalIsEditing && internalCanEdit,
                          statusMessage: isAcquiringInternalLock
                            ? 'Requesting edit…'
                            : internalIsEditing && internalCanEdit
                            ? 'You have editing access'
                            : 'View only',
                          extendsLabel: 'Auto-extends every 5 min',
                          idleLabel: `Releases after ${INTERNAL_INACTIVITY_TIMEOUT_MINUTES} min idle`,
                          statusDetail: internalIsSaving
                            ? 'Saving…'
                            : internalHasUnsavedChanges
                            ? 'Unsaved'
                            : internalLastSaved
                            ? 'Saved'
                            : '',
                          autoSaveEnabled: internalAutoSaveEnabled,
                          onToggleAutoSave: (checked) => setInternalAutoSaveEnabled(checked),
                          onSave: () => saveInternalMarkdown(true),
                          saveDisabled:
                            !internalHasUnsavedChanges ||
                            internalIsSaving ||
                            !internalCanEdit,
                          saveLabel: 'Save',
                          onRelease: () => handleInternalReleaseLockClick(),
                          releaseDisabled: !internalCanEdit,
                          releaseLabel: 'Release Lock',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      No internal source data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Internal Markdown Inactivity Modal */}
          <Dialog
            open={showInternalInactivityModal}
            onClose={handleInternalCancelReacquire}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: "12px",
                padding: "8px",
              },
            }}
          >
            <DialogContent>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lock Released Due to Inactivity
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your editing session timed out after {INTERNAL_INACTIVITY_TIMEOUT_MINUTES} minutes
                  </p>

                  <p className="text-sm text-gray-600 mt-3">
                    To continue editing, you need to re-acquire the lock.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mt-3">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      If another user has acquired the lock in the meantime, you won't be able to edit until they release it.
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
            <DialogActions className="px-6 pb-4 gap-2">
              <Button
                onClick={handleInternalCancelReacquire}
                variant="outlined"
                color="inherit"
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Stay in Preview
              </Button>
              <Button
                onClick={handleInternalReacquireLock}
                variant="contained"
                disabled={isAcquiringInternalLock}
                startIcon={
                  isAcquiringInternalLock ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                  },
                }}
              >
                {isAcquiringInternalLock ? "Acquiring..." : "Re-acquire Lock to Edit"}
              </Button>
            </DialogActions>
          </Dialog>
          {isReviewMode &&
            selectedCompetitors.length === 0 &&
            selectedSources.length === 0 &&
            selectedInternalSources.length === 0 && (
              <div
                ref={reviewPanelScrollRef}
                onScroll={() => handleSyncScroll(reviewPanelScrollRef)}
                className="h-[calc(100vh-180px)] relative overflow-y-auto"
              >
                <div className="">
                  {canShowDiff && (
                    <div
                      className={`h-full transform transition-all duration-500 ease-in-out ${
                        isReviewMode
                          ? "translate-x-0 opacity-100"
                          : "translate-x-full opacity-0"
                      }`}
                    >
                      <div className="rounded-xl shadow-xl border border-gray-200/50 flex flex-col backdrop-blur-sm">
                        {/* Beautiful Review Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200/60  sticky top-0 z-10 bg-white">
                          <div className="flex items-center space-x-3 bg-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <span className="font-semibold text-[13px] mr-1">
                                Review School Profile
                              </span>
                              <p className="text-sm text-gray-500">
                                {" "}
                                Click ✓ to accept or ✗ to reject
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setSyncScroll((prev) => !prev)}
                              className={`p-1.5 rounded transition-all ${
                                syncScroll
                                  ? "bg-primary text-white hover:bg-primary-dark"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                              title={
                                syncScroll
                                  ? "Disable synchronized scrolling between panels"
                                  : "Enable synchronized scrolling between panels"
                              }
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={handleCloseDiffView}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 overflow-hidden">
                          {showJsonView ? (
                            // Enhanced JSON Debug View with consistent width
                            <div className="p-6 space-y-4 h-full overflow-auto max-w-3xl custom-scrollbar">
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <h4 className="font-medium text-blue-900">
                                    School Profile
                                  </h4>
                                </div>
                                <pre className="text-xs overflow-auto max-h-60 bg-white/60 rounded-lg p-3 border border-blue-200/40 custom-scrollbar">
                                  {JSON.stringify(oldData, null, 2)}
                                </pre>
                              </div>
                              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                  <h4 className="font-medium text-amber-900">
                                    Pending Changes
                                  </h4>
                                </div>
                                <pre className="text-xs overflow-auto max-h-60 bg-white/60 rounded-lg p-3 border border-amber-200/40 custom-scrollbar">
                                  {JSON.stringify(newData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            // Enhanced Source Comparison Viewer
                            <div className="">
                              <SourceComparisonView
                                oldData={oldData}
                                newData={newData}
                                title="Pending Changes"
                                onMergeChange={handleMergedChange}
                                onPublish={handlePublish}
                                onReset={handleResetChanges}
                                onRemoveFromOld={handleRemoveFromOld}
                                onRemoveFromNew={handleRemoveFromNew}
                                onAcceptChange={handleAcceptChange}
                                duplicateItems={duplicateItems}
                                expandedSections={sharedExpandedSections}
                                setExpandedSections={setSharedExpandedSections}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            isTaskDrawerOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/20 cursor-pointer"
            onClick={() => setIsTaskDrawerOpen(false)}
          ></div>
        </div>

        <div
          className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-out ${
            isTaskDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Task monitor
                </h2>
                <p className="text-xs text-gray-500">
                  Company research tasks by status
                </p>
              </div>
              <button
                onClick={() => setIsTaskDrawerOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>
                    In progress {groupedResearchTasks.inProgress.length}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Completed {groupedResearchTasks.completed.length}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Failed {groupedResearchTasks.failed.length}</span>
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                {researchTasks.length} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-1 flex items-center space-x-2">
                  <span>In progress</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px]">
                    {groupedResearchTasks.inProgress.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {groupedResearchTasks.inProgress.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-[11px] text-gray-800 font-medium">
                        No active tasks
                      </span>
                      <span className="text-[11px] text-gray-500">
                        New research tasks will appear here while processing.
                      </span>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {groupedResearchTasks.inProgress.map((task) => (
                        <li
                          key={task.task_id || task.id}
                          onClick={() =>
                            setSelectedTaskIdForLog(task.task_id || task.id)
                          }
                          className={`relative rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 px-4 py-3 flex flex-col space-y-1 overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${
                            selectedTaskIdForLog === (task.task_id || task.id)
                              ? "ring-2 ring-blue-400"
                              : ""
                          }`}
                        >
                          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-500" />
                          <div className="flex items-start justify-between pl-2 gap-2">
                            <div className="flex flex-col space-y-0.5 min-w-0 max-w-full">
                              <span className="text-sm font-medium text-blue-900 truncate max-w-full">
                                {task.url || task.source_id || "Task"}
                              </span>
                              {task.source_id && (
                                <span className="text-[11px] text-blue-700 truncate max-w-full">
                                  Source: {task.source_id}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-medium">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1" />
                                  <span>{getTaskStepInfo(task).label}</span>
                                </span>
                                <span className="relative inline-flex items-center justify-center h-4 w-4">
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40 animate-ping" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                                {formatLocalDateTime(task.updated_at)}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Agent activity panel directly under In progress */}
              <div className="mt-3 pt-3 border-t border-gray-200/70">
                <button
                  type="button"
                  disabled={groupedResearchTasks.inProgress.length === 0}
                  onClick={() => {
                    if (!groupedResearchTasks.inProgress.length) return;
                    setIsAgentLogOpen((prev) => !prev);
                  }}
                  className={`w-full flex items-center justify-between mb-2 text-left ${
                    groupedResearchTasks.inProgress.length === 0
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <span>Agent activity</span>
                      {selectedTaskForLog && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                          Task{" "}
                          {(
                            selectedTaskForLog.task_id ||
                            selectedTaskForLog.id ||
                            ""
                          )
                            .toString()
                            .slice(0, 8)}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {selectedTaskForLog
                        ? "Live stream of this research task from the AI agents."
                        : "No agents in progress to see live activity and steps."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {selectedTaskForLog && (
                      <>
                        {(taskStreamState === "connecting" ||
                          taskStreamState === "open") && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 border border-indigo-100">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100">
                              <Brain className="h-3 w-3 text-indigo-600 animate-pulse" />
                            </span>
                          </span>
                        )}
                      </>
                    )}
                    <ChevronDown
                      className={`h-3 w-3 text-gray-500 transform transition-transform ${
                        isAgentLogOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {taskStreamError && (
                  <div className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    Could not connect to task stream: {taskStreamError}
                  </div>
                )}

                {isAgentLogOpen && (
                  <div
                    ref={agentLogContainerRef}
                    className="max-h-72 overflow-y-auto custom-scrollbar rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-[11px]"
                  >
                    {!selectedTaskForLog ? (
                      <div className="text-gray-500">
                        When you start or select a company research task, its
                        live steps and browser actions will appear here in a
                        chronological timeline.
                      </div>
                    ) : taskEvents.length === 0 ? (
                      <div className="text-gray-500">
                        {taskStreamState === "error"
                          ? "Could not load live agent activity."
                          : "Connected. Waiting for the agent to emit events..."}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {taskEvents.map((evt, index) => {
                          const data = evt.data || {};
                          const timestampLabel = (() => {
                            try {
                              return formatLocalTime(evt.timestamp);
                            } catch {
                              return "";
                            }
                          })();

                          let title = "";
                          let body = "";
                          let dotColor = "bg-gray-300";

                          if (evt.event === "connected") {
                            title = "Connected to task stream";
                            body =
                              data.message || "Listening for agent updates";
                            dotColor = "bg-gray-400";
                          } else if (evt.event === "status") {
                            const status = (
                              data.status ||
                              data.state ||
                              ""
                            ).toLowerCase();
                            const stepInfo = data.current_step
                              ? getTaskStepInfo({
                                  current_step: data.current_step,
                                  total_steps: data.total_steps,
                                })
                              : null;
                            title = `Status: ${status || "update"}`;
                            if (stepInfo?.label) {
                              body = stepInfo.detail || stepInfo.label;
                            }
                            dotColor = "bg-blue-500";
                          } else if (evt.event === "step") {
                            const stepType = data.step_type || "info";
                            title = data.message || "Agent step";
                            dotColor =
                              stepType === "success"
                                ? "bg-emerald-500"
                                : stepType === "error"
                                ? "bg-red-500"
                                : stepType === "browser_update"
                                ? "bg-sky-500"
                                : "bg-indigo-500";

                            if (
                              stepType === "browser_update" &&
                              data.metadata
                            ) {
                              const meta = data.metadata;
                              const parts = [];
                              if (meta.url) parts.push(`URL: ${meta.url}`);
                              if (meta.next_goal) {
                                parts.push(`Next: ${meta.next_goal}`);
                              }
                              body = parts.join("\n");
                            } else if (data.metadata?.next_goal) {
                              body = data.metadata.next_goal;
                            }
                          } else if (evt.event === "complete") {
                            const status = (
                              data.status ||
                              data.result ||
                              "completed"
                            ).toString();
                            title = `Task ${status}`;
                            body =
                              data.message ||
                              "The agent has finished processing this task.";
                            dotColor = "bg-emerald-600";
                          } else {
                            title = `Event: ${evt.event}`;
                            if (typeof data === "string") {
                              body = data;
                            }
                          }

                          const isBrowserUpdate =
                            evt.event === "step" &&
                            (data.step_type || "") === "browser_update";

                          return (
                            <li
                              key={evt.id || `${evt.event}-${index}`}
                              className="relative flex gap-3"
                            >
                              <div className="flex flex-col items-center">
                                <span
                                  className={`h-2 w-2 rounded-full ${dotColor}`}
                                />
                                {index !== taskEvents.length - 1 && (
                                  <span className="flex-1 w-px bg-gray-200 mt-1" />
                                )}
                              </div>
                              <div className="flex-1 rounded-lg bg-white/90 border border-gray-100 px-3 py-2 shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-[11px] font-medium text-gray-800">
                                    {title}
                                  </span>
                                  {timestampLabel && (
                                    <span className="text-[10px] text-gray-400">
                                      {timestampLabel}
                                    </span>
                                  )}
                                </div>
                                {body && (
                                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] text-gray-600">
                                    {body}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 mb-1 flex items-center space-x-2">
                  <span>Completed</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px]">
                    {groupedResearchTasks.completed.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {groupedResearchTasks.completed.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-800 font-medium">
                        No completed tasks
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Completed research will be summarized here.
                      </span>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {groupedResearchTasks.completed.map((task) => (
                        <li
                          key={task.task_id || task.id}
                          className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-4 py-3 flex flex-col space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0 max-w-full">
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-emerald-900 truncate max-w-full">
                                {task.url || task.source_id || "Task"}
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-700 flex-shrink-0">
                              {task.current_step || "completed"}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 truncate">
                            {formatLocalDateTime(task.completed_at || task.updated_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 mb-1 flex items-center space-x-2">
                  <span>Failed</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px]">
                    {groupedResearchTasks.failed.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {groupedResearchTasks.failed.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-800 font-medium">
                        No failed tasks
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Errors will be listed here if any task fails.
                      </span>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {groupedResearchTasks.failed.map((task) => (
                        <li
                          key={task.task_id || task.id}
                          className="rounded-lg border border-red-100 bg-red-50/50 px-4 py-3 flex flex-col space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0 max-w-full">
                              <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <X className="h-3 w-3 text-red-600" />
                              </div>
                              <span className="text-sm font-medium text-red-900 truncate max-w-full">
                                {task.url || task.source_id || "Task"}
                              </span>
                            </div>
                            <span className="text-[11px] text-red-700 flex-shrink-0">
                              {task.current_step || "failed"}
                            </span>
                          </div>
                          {task.error && (
                            <span className="text-[11px] text-red-600 whitespace-pre-wrap break-words">
                              {task.error}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-500 truncate">
                            {formatLocalDateTime(task.updated_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          open={showTaskCompleteModal && !!recentlyCompletedTask}
          onClose={handleTaskCompleteReviewLater}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.25)",
              p: 0,
            },
          }}
        >
          <DialogContent sx={{ p: 2.5, pb: 2 }}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "999px",
                  bgcolor: "rgba(37, 99, 235, 0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography
                  component="h3"
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}
                >
                  {(() => {
                    const taskSourceId = recentlyCompletedTask?.source_id;
                    const isSourceIdCompetitor =
                      taskSourceId &&
                      competitors.some(
                        (c) => (c.source_id || c.id) === taskSourceId
                      );
                    const isCompetitor =
                      recentlyCompletedTask?.agent_type ===
                        "CompanyCompetitorResearchAgent" ||
                      recentlyCompletedTask?.type === "competitor" ||
                      recentlyCompletedTask?.source_type === "competitor" ||
                      isSourceIdCompetitor;
                    return isCompetitor
                      ? "Competitor analysis completed"
                      : "Research task completed";
                  })()}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mb: recentlyCompletedTask?.url ? 1 : 0,
                  }}
                >
                  {(() => {
                    const taskSourceId = recentlyCompletedTask?.source_id;
                    const isSourceIdCompetitor =
                      taskSourceId &&
                      competitors.some(
                        (c) => (c.source_id || c.id) === taskSourceId
                      );
                    const isCompetitor =
                      recentlyCompletedTask?.agent_type ===
                        "CompanyCompetitorResearchAgent" ||
                      recentlyCompletedTask?.type === "competitor" ||
                      recentlyCompletedTask?.source_type === "competitor" ||
                      isSourceIdCompetitor;
                    return isCompetitor
                      ? "Competitor analysis has finished processing. Do you want to compare the competitor data now?"
                      : "A recently added source has finished processing. Do you want to review the changes now?";
                  })()}
                </Typography>
                {recentlyCompletedTask?.url && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "primary.main",
                      wordBreak: "break-all",
                    }}
                  >
                    {recentlyCompletedTask.url}
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2, pt: 0, gap: 1 }}>
            <Button
              onClick={handleTaskCompleteReviewLater}
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 13,
                px: 2.5,
                bgcolor: "grey.100",
                borderColor: "grey.200",
                color: "text.primary",
                ":hover": { bgcolor: "grey.200", borderColor: "grey.300" },
              }}
            >
              Later
            </Button>
            <Button
              onClick={handleTaskCompleteReviewNow}
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 13,
                px: 2.5,
                bgcolor: "primary.main",
                ":hover": { bgcolor: "primary.dark" },
              }}
              startIcon={<FileText size={14} />}
            >
              {(() => {
                const taskSourceId = recentlyCompletedTask?.source_id;
                const isSourceIdCompetitor =
                  taskSourceId &&
                  competitors.some(
                    (c) => (c.source_id || c.id) === taskSourceId
                  );
                const isCompetitor =
                  recentlyCompletedTask?.agent_type ===
                    "CompanyCompetitorResearchAgent" ||
                  recentlyCompletedTask?.type === "competitor" ||
                  recentlyCompletedTask?.source_type === "competitor" ||
                  isSourceIdCompetitor;
                return isCompetitor ? "Compare now" : "Review now";
              })()}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Publish Confirmation Modal */}
        {showPublishConfirm && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Save className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirm Publication
                    </h3>
                    <p className="text-sm text-gray-500">
                      Save current state to server
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium mb-1">
                        Important Notice
                      </p>
                      <p className="text-xs text-amber-700">
                        After publishing, you cannot reset this data. Your
                        current changes will be permanently saved to the server.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPublishConfirm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className={`px-6 py-2 text-white rounded-lg font-medium transition-colors cursor-pointer ${
                      isPublishing
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isPublishing ? "Publishing..." : "Confirm & Publish"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Warning Modal */}
        {showLeaveWarning && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Unsaved Changes
                    </h3>
                    <p className="text-sm text-gray-600">
                      You have unsaved changes in your review.
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  You have made decisions (accepted/rejected changes) that
                  haven't been published yet. Do you want to leave without
                  saving these changes?
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelLeave}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Stay & Continue Reviewing
                  </button>
                  <button
                    onClick={handleConfirmLeave}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Leave Without Saving
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
