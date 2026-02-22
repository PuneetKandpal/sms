"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  FileText,
  Search,
  GripVertical,
  Plus,
} from "lucide-react";
import AddPageModal from "./AddPageModal";
import api from "../../../api/axios";
import toast from "react-hot-toast";

// 10 distinct, beautiful colors for different hierarchy levels
// Using a progression from warm to cool tones for better visual distinction
// const LEVEL_COLORS = [
//   { bgClass: "bg-blue-200", textClass: "text-blue-700" }, // Level 1 - Blue
//   { bgClass: "bg-orange-200", textClass: "text-orange-700" }, // Level 5 - Orange
//   { bgClass: "bg-sky-200", textClass: "text-sky-700" }, // Level 3 - Purple
//   { bgClass: "bg-emerald-200", textClass: "text-emerald-700" }, // Level 7 - Green
//   { bgClass: "bg-rose-200", textClass: "text-rose-700" }, // Level 4 - Rose
//   { bgClass: "bg-amber-200", textClass: "text-amber-700" }, // Level 6 - Amber
//   { bgClass: "bg-teal-200", textClass: "text-teal-700" }, // Level 8 - Teal
//   { bgClass: "bg-cyan-200", textClass: "text-cyan-700" }, // Level 9 - Cyan
// ];

// Each level uses a distinctly different hue family for clear separation
const LEVEL_COLORS = [
  { bgClass: "bg-blue-200", textClass: "text-blue-800" }, // Level 1 - Cool blue
  { bgClass: "bg-red-200", textClass: "text-red-800" }, // Level 2 - Strong red
  { bgClass: "bg-green-200", textClass: "text-green-800" }, // Level 3 - Natural green
  { bgClass: "bg-sky-200", textClass: "text-sky-800" }, // Level 4 - Vibrant sky
  { bgClass: "bg-orange-200", textClass: "text-orange-800" }, // Level 5 - Golden yellow
  { bgClass: "bg-teal-200", textClass: "text-teal-800" }, // Level 6 - Blue-green
  { bgClass: "bg-rose-200", textClass: "text-rose-800" }, // Level 7 - Pinkish red
  { bgClass: "bg-gray-200", textClass: "text-gray-800" }, // Level 8 - Neutral black
];

const SOURCE_FILTERS = [
  {
    id: "manual",
    label: "Manual Page",
    description: "Added manually",
    dotClass: "bg-amber-500",
    iconAccentClass:
      "border-amber-400 ring-2 ring-amber-200/70 bg-amber-50/60 text-amber-600 shadow-[0_4px_18px_rgba(251,191,36,0.35)]",
    chipActiveClass:
      "border-amber-400 bg-amber-50 text-amber-900 shadow-[0_0_0_1px_rgba(251,191,36,0.6)]",
    chipInactiveClass:
      "border-amber-100 bg-white text-gray-600 hover:border-amber-200",
    highlightClass: "bg-amber-50/70 ring-1 ring-amber-200",
    tooltip: "Manually added",
    matches: (node) => Boolean(node?.is_manual_created || node?.generated_from === "manual"),
  },
  {
    id: "answer",
    label: "AI Answer",
    description: "Sourced from Answers",
    dotClass: "bg-sky-500",
    iconAccentClass:
      "border-sky-400 ring-2 ring-sky-200/70 bg-sky-50/60 text-sky-600 shadow-[0_4px_18px_rgba(14,165,233,0.25)]",
    chipActiveClass:
      "border-sky-400 bg-sky-50 text-sky-900 shadow-[0_0_0_1px_rgba(14,165,233,0.4)]",
    chipInactiveClass:
      "border-sky-100 bg-white text-gray-600 hover:border-sky-200",
    highlightClass: "bg-sky-50/80 ring-1 ring-sky-200",
    tooltip: "Generated from Answer",
    matches: (node) =>
      (node?.generated_from || node?.source_type) === "answer",
  },
  {
    id: "article",
    label: "AI Article",
    description: "Generated article",
    dotClass: "bg-emerald-500",
    iconAccentClass:
      "border-emerald-400 ring-2 ring-emerald-200/70 bg-emerald-50/60 text-emerald-600 shadow-[0_4px_18px_rgba(16,185,129,0.25)]",
    chipActiveClass:
      "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]",
    chipInactiveClass:
      "border-emerald-100 bg-white text-gray-600 hover:border-emerald-200",
    highlightClass: "bg-emerald-50/80 ring-1 ring-emerald-200",
    tooltip: "Generated from Article",
    matches: (node) =>
      (node?.generated_from || node?.source_type) === "article",
  },
];

const FILTER_LOOKUP = SOURCE_FILTERS.reduce((acc, filter) => {
  acc[filter.id] = filter;
  return acc;
}, {});

const getNodeFilterMatches = (node) =>
  SOURCE_FILTERS.reduce((acc, filter) => {
    try {
      if (filter.matches(node)) {
        acc.push(filter.id);
      }
    } catch (error) {
      console.warn("Filter match error", { filter: filter.id, error });
    }
    return acc;
  }, []);

const simpleMatch = (text = "", query = "") =>
  text.toLowerCase().includes(query.toLowerCase());

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeForSearch = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getQueryTokens = (query = "") =>
  normalizeForSearch(query)
    .split(/\s+/)
    .filter(Boolean);

const matchesQueryTokens = (candidate, tokens) => {
  if (!tokens?.length) return true;
  if (candidate == null) return false;
  const haystack = normalizeForSearch(candidate);
  if (!haystack) return false;
  return tokens.every((token) => haystack.includes(token));
};

const highlightText = (text, query) => {
  const rawText = text == null ? "" : String(text);
  const tokens = getQueryTokens(query);
  if (!tokens.length) return rawText;

  const escapedTokens = tokens
    .map(escapeRegExp)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!escapedTokens.length) return rawText;

  const regex = new RegExp(`(${escapedTokens.join("|")})`, "ig");
  const tokenSet = new Set(tokens.map((token) => token.toLowerCase()));
  const parts = rawText.split(regex);

  return parts.map((part, index) => {
    const isMatch = tokenSet.has(part.toLowerCase());
    if (!isMatch) {
      return part;
    }

    return (
      <mark key={index} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">
        {part}
      </mark>
    );
  });
};

// Page icon component with Lucide React icon
const PageIcon = ({ level, accentClass, accentLabel }) => {
  const colorScheme = LEVEL_COLORS[level % LEVEL_COLORS.length];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex-shrink-0 w-5 h-5 rounded-sm flex items-center justify-center border bg-white shadow-sm ring-1 ring-transparent transition-all duration-200 ${
        accentClass ?? "border-gray-200/80"
      }`}
      title={accentLabel || undefined}
    >
      <FileText className={`h-3 w-3 ${colorScheme.textClass}`} />
    </motion.div>
  );
};

export default function ContentArchitectTree({
  data,
  selectedNode,
  onNodeSelect,
  projectId,
  architectId,
  onTreeDataUpdate,
  autoScroll = false,
}) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [dragOverNode, setDragOverNode] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before', 'after', or 'child'

  const treeRef = useRef(null);
  const treeScrollContainerRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const scrollRetryFrameRef = useRef(null);
  const scrollRetryIntervalRef = useRef(null);
  const expandedNodesBeforeSearchRef = useRef(null);

  const hasActiveFilters = activeFilters.length > 0;
  const toggleFilter = (filterId) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => setActiveFilters([]);

  const toggleNode = (nodeId, e) => {
    e?.stopPropagation();
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleAddPage = (node, e) => {
    e?.stopPropagation();
    setSelectedParentNode(node);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedParentNode(null);
  };

  // function to reset dragged node & all other things to initial state on click outside
  const resetDragState = () => {
    setDraggedNode(null);
    setDropTarget(null);
    setDragOverNode(null);
    setDropPosition(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (treeRef.current && !treeRef.current.contains(event.target)) {
        resetDragState();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (hasActiveFilters) {
      expandAll();
    }
  }, [hasActiveFilters]);

  const handlePageAdded = async () => {
    if (!architectId) return;

    setRefreshing(true);
    try {
      const navResponse = await api.get(
        `/content-architecture/navigation/${architectId}/`
      );

      if (navResponse.data.success && navResponse.data.data?.length > 0) {
        const navigationData = navResponse.data.data[0]?.navigation_data;
        if (navigationData && onTreeDataUpdate) {
          onTreeDataUpdate(navigationData);
          toast.success("Content tree refreshed successfully!");
        }
      }
    } catch (error) {
      console.error("Error refreshing tree data:", error);
      toast.error("Failed to refresh content tree");
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to check if a node is a descendant of another node
  const isDescendant = (nodeId, potentialAncestorId, data) => {
    const findNode = (items, targetId, path = []) => {
      if (!items) return null;

      if (typeof items === "object" && !Array.isArray(items)) {
        for (const [key, value] of Object.entries(items)) {
          const currentId = value?.id || key;
          if (currentId === targetId || key === targetId) {
            return [...path, currentId];
          }
          if (value.items) {
            const result = findNode(value.items, targetId, [
              ...path,
              currentId,
            ]);
            if (result) return result;
          }
        }
      } else if (Array.isArray(items)) {
        for (const item of items) {
          const itemKey = item.id || item.name;
          if (itemKey === targetId) {
            return [...path, itemKey];
          }
          if (item.items) {
            const result = findNode(item.items, targetId, [...path, itemKey]);
            if (result) return result;
          }
        }
      }
      return null;
    };

    const draggedPath = findNode(data, nodeId);
    const ancestorPath = findNode(data, potentialAncestorId);

    if (!draggedPath || !ancestorPath) return false;

    // Check if potentialAncestorId is in the dragged node's path
    return draggedPath.slice(0, -1).includes(potentialAncestorId);
  };

  // Helper to find the parent page id for a given node id based on the navigation tree
  const findParentPageId = (treeData, targetId) => {
    if (!treeData || !targetId) return null;

    const findInItems = (items, currentParentId) => {
      if (!Array.isArray(items)) return null;

      for (const item of items) {
        // If this item matches the target, its parent is the current parent id
        if (item.id === targetId) {
          return currentParentId || null;
        }

        // Recurse into children, passing the current item's id as the new parent
        const nextParentId = item.id || currentParentId;
        const found = findInItems(item.items, nextParentId);
        if (found) return found;
      }

      return null;
    };

    // navigation_data is an object whose values are sections with `id` and `items`
    for (const section of Object.values(treeData)) {
      const sectionParentId = section.id || null;
      const found = findInItems(section.items, sectionParentId);
      if (found) return found;
    }

    return null;
  };

  // Drag and drop handlers
  const handleDragStart = (e, node) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(node));
  };

  const handleDragOver = (e, targetNode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Prevent dropping on self or descendants (target is a descendant of dragged node)
    if (
      draggedNode &&
      (draggedNode.id === targetNode.id ||
        isDescendant(targetNode.id, draggedNode.id, data))
    ) {
      e.dataTransfer.dropEffect = "none";
      setDragOverNode(null);
      setDropPosition(null);
      return;
    }

    // Calculate drop position based on mouse Y position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;

    // Three zones:
    // - top: drop before the target
    // - middle: drop as child of the target
    // - bottom: drop after the target
    const topThreshold = height * 0.25;
    const bottomThreshold = height * 0.75;

    let position;
    if (mouseY < topThreshold) {
      position = "before";
    } else if (mouseY > bottomThreshold) {
      position = "after";
    } else {
      position = "child";
    }

    setDragOverNode(targetNode);
    setDropPosition(position);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the node
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setDragOverNode(null);
  };

  const handleDrop = async (e, targetNode) => {
    e.preventDefault();
    setDragOverNode(null);

    if (!draggedNode || draggedNode.id === targetNode.id) {
      setDraggedNode(null);
      setDropPosition(null);
      return;
    }

    // Prevent dropping on descendants
    if (isDescendant(targetNode.id, draggedNode.id, data)) {
      toast.error("Cannot move a page to its own descendant");
      setDraggedNode(null);
      setDropPosition(null);
      return;
    }

    let apiPayload;
    let successMessage;

    if (dropPosition === "child") {
      // Drop as a child of the target node
      apiPayload = {
        page_id: draggedNode.id,
        new_parent_page_id: targetNode.id,
        project_id: projectId,
      };
      successMessage = `"${draggedNode.name}" moved inside "${targetNode.name}"`;
    } else {
      // Determine the parent page id from the navigation tree based on the target node
      const parentPageId = findParentPageId(data, targetNode.id);

      if (!parentPageId) {
        console.log("No parentPageId found for drop target", targetNode);
        toast.error("Cannot drop item here");
        setDraggedNode(null);
        setDropPosition(null);
        return;
      }

      // Drop as sibling (before or after)
      apiPayload = {
        page_id: draggedNode.id,
        new_parent_page_id: parentPageId,
        project_id: projectId,
        position: dropPosition, // 'before' or 'after'
        reference_page_id: targetNode.id, // The page to insert before/after
      };
      successMessage = `"${draggedNode.name}" moved ${dropPosition} "${targetNode.name}"`;
    }

    try {
      setRefreshing(true);

      const response = await api.put(
        "/content-architecture/move-nested-page/",
        apiPayload
      );

      if (response.data.success) {
        toast.success(successMessage);

        // Refresh the tree data
        const navResponse = await api.get(
          `/content-architecture/navigation/${architectId}/`
        );

        if (navResponse.data.success && navResponse.data.data?.length > 0) {
          const navigationData = navResponse.data.data[0]?.navigation_data;
          if (navigationData && onTreeDataUpdate) {
            onTreeDataUpdate(navigationData);
          }
        }
      } else {
        toast.error(response.data.message || "Failed to move page");
      }
    } catch (error) {
      console.error("Error moving page:", error);
      toast.error(error.response?.data?.error || "Failed to move page");
    } finally {
      setRefreshing(false);
      setDraggedNode(null);
      setDropPosition(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
    setDragOverNode(null);
    setDropPosition(null);
  };

  const buildUniqueId = useCallback((parentPath, key) => {
    const keyStr = typeof key === "string" ? key : String(key);
    if (keyStr.includes(".")) {
      return keyStr;
    }
    return parentPath ? `${parentPath}.${keyStr}` : keyStr;
  }, []);

  const getPathToNode = useCallback(
    (targetId) => {
      if (!data || !targetId) return null;
      const normalizedTargetId = String(targetId);

      const traverseEntries = (entries, parentPath = "") => {
        for (const [key, value] of entries) {
          const uniqueId = buildUniqueId(parentPath, key);
          const nodeId =
            value?.id ?? (typeof key === "string" ? key : String(key));
          if (nodeId && String(nodeId) === normalizedTargetId) {
            return [uniqueId];
          }

          const childItems = value?.items;
          if (childItems) {
            const childEntries = Array.isArray(childItems)
              ? childItems.map((item, index) => [
                  item?.id || item?.name || `item-${index}`,
                  item,
                ])
              : Object.entries(childItems);
            const childPath = traverseEntries(childEntries, uniqueId);
            if (childPath) {
              return [uniqueId, ...childPath];
            }
          }
        }
        return null;
      };

      const rootEntries = Array.isArray(data)
        ? data.map((item, index) => [
            item?.id || item?.name || `root-${index}`,
            item,
          ])
        : Object.entries(data);

      return traverseEntries(rootEntries);
    },
    [data, buildUniqueId]
  );

  const ensureNodePathExpanded = useCallback(
    (targetId) => {
      if (!targetId) return;

      const targetKey = String(targetId);

      // If the target already looks like a dotted uniqueId path, expand all ancestors in that path directly
      if (targetKey.includes(".")) {
        const segments = [];
        targetKey.split(".").reduce((acc, segment) => {
          const next = acc ? `${acc}.${segment}` : segment;
          segments.push(next);
          return next;
        }, "");

        setExpandedNodes((prev) => {
          const next = new Set(prev);
          segments.forEach((segment) => next.add(segment));
          return next;
        });
        return;
      }

      const path = getPathToNode(targetKey);
      if (!path?.length) return;

      setExpandedNodes((prev) => {
        const next = new Set(prev);
        path.forEach((uniqueId) => next.add(uniqueId));
        return next;
      });
    },
    [getPathToNode]
  );

  const scrollNodeIntoView = useCallback(
    (primaryKey, fallbackKey) => {
      const normalizedPrimary = primaryKey ? String(primaryKey) : null;
      const normalizedFallback = fallbackKey ? String(fallbackKey) : null;
      
      console.log("scrollNodeIntoView: looking for element", {
        normalizedPrimary,
        normalizedFallback,
        totalRefs: nodeRefs.current.size,
        allRefKeys: Array.from(nodeRefs.current.keys()).slice(0, 10) // Show first 10 keys
      });
      
      const element =
        (normalizedPrimary && nodeRefs.current.get(normalizedPrimary)) ||
        (normalizedFallback && nodeRefs.current.get(normalizedFallback));

      if (!element) {
        // Debug: log which keys we tried and what refs exist
        console.warn("scrollNodeIntoView: element not found", {
          normalizedPrimary,
          normalizedFallback,
          availableRefs: Array.from(nodeRefs.current.keys()),
        });
        return false;
      }

      console.log("scrollNodeIntoView: found element, scrolling...");
      // Native scrollIntoView is more reliable here because Framer Motion + nested scroll
      // containers can make manual scrollTop math inconsistent.
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      return true;
    },
    [nodeRefs]
  );

  // Auto-scroll effect when landing from external navigation
  useEffect(() => {
    if (!autoScroll) return;
    if (!selectedNode) return;
    if (!data) return;
    
    console.log("Auto-scroll effect running", {
      autoScroll,
      selectedNode: !!selectedNode,
      data: !!data
    });
    
    // Use the uniqueId if available, otherwise fall back to id
    const primaryId = selectedNode.uniqueId || selectedNode.id;
    const fallbackId = selectedNode.id;
    
    console.log("Auto-scroll: attempting to scroll to node", {
      primaryId,
      fallbackId,
      nodeName: selectedNode.name
    });
    
    // Ensure the path to this node is expanded
    ensureNodePathExpanded(primaryId, fallbackId);
    
    // Try multiple times with increasing delays to handle async rendering
    const attempts = 5;
    let attemptCount = 0;
    
    const tryScroll = () => {
      attemptCount++;
      const success = scrollNodeIntoView(primaryId, fallbackId);
      
      if (success) {
        console.log(`Auto-scroll: successfully scrolled to node on attempt ${attemptCount}`);
        // Clear the autoScroll flag from URL after successful scroll
        const url = new URL(window.location);
        url.searchParams.delete('autoScroll');
        window.history.replaceState({}, '', url);
      } else if (attemptCount < attempts) {
        console.log(`Auto-scroll: attempt ${attemptCount} failed, retrying...`);
        // Exponential backoff: 100ms, 200ms, 400ms, 800ms
        const delay = 100 * Math.pow(2, attemptCount - 1);
        setTimeout(tryScroll, delay);
      } else {
        console.error("Auto-scroll: failed to find node element after all attempts");
        // Still clear the flag to prevent infinite retries
        const url = new URL(window.location);
        url.searchParams.delete('autoScroll');
        window.history.replaceState({}, '', url);
      }
    };
    
    // Start trying after initial delay
    setTimeout(tryScroll, 300);
  }, [autoScroll, selectedNode, data, ensureNodePathExpanded, scrollNodeIntoView]);

  // Expand all nodes on mount
  useEffect(() => {
    expandAll();
  }, []);

  const expandAll = () => {
    if (!data) return;
    const allIds = new Set();

    // Recursively collect all node IDs at every nesting level
    const collectIds = (items, prefix = "") => {
      if (!items) return;

      // Handle object-based items
      if (typeof items === "object" && !Array.isArray(items)) {
        Object.entries(items).forEach(([key, value]) => {
          const fullId = prefix ? `${prefix}.${key}` : key;
          allIds.add(fullId);

          // Recursively process nested items
          if (value.items) {
            collectIds(value.items, fullId);
          }
        });
      }
      // Handle array-based items
      else if (Array.isArray(items)) {
        items.forEach((item, index) => {
          const itemId = item.id || item.name || `${prefix}.${index}`;
          const fullId = prefix ? `${prefix}.${itemId}` : itemId;
          allIds.add(fullId);

          // Recursively process nested items
          if (item.items) {
            collectIds(item.items, fullId);
          }
        });
      }
    };

    collectIds(data);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const { filteredTreeData, autoExpandIds, hasSearchMatches } = useMemo(() => {
    const query = searchQuery.trim();
    const queryTokens = getQueryTokens(query);
    const filterMatchesNode = (nodeValue) => {
      if (!hasActiveFilters) return true;
      if (!nodeValue) return false;
      return activeFilters.some((filterId) =>
        FILTER_LOOKUP[filterId]?.matches(nodeValue)
      );
    };

    if (!data || queryTokens.length === 0) {
      return {
        filteredTreeData: applySourceFilters(data, filterMatchesNode),
        autoExpandIds: new Set(),
        hasSearchMatches: Object.keys(data || {}).length > 0,
      };
    }

    const expandIds = new Set();

    const makeUniqueId = (parentUniqueId, key) => {
      const keyStr = typeof key === "string" ? key : String(key);
      if (keyStr.includes(".")) return keyStr;
      return parentUniqueId ? `${parentUniqueId}.${keyStr}` : keyStr;
    };

    const getDisplayName = (key, value) =>
      value?.name ||
      (typeof key === "string" ? key.split(".").pop() : String(key));

    const filterItems = (items, parentUniqueId) => {
      if (!items) {
        return { filtered: items, hasMatch: false };
      }

      if (Array.isArray(items)) {
        const filteredArray = [];
        let hasMatch = false;

        items.forEach((item, index) => {
          const itemKey = item?.id || item?.name || `item-${index}`;
          const res = filterNode(itemKey, item, parentUniqueId);
          if (res.include) {
            filteredArray.push(res.value);
            hasMatch = true;
          }
        });

        return { filtered: filteredArray, hasMatch };
      }

      if (typeof items === "object") {
        const filteredObj = {};
        let hasMatch = false;

        Object.entries(items).forEach(([childKey, childValue]) => {
          const res = filterNode(childKey, childValue, parentUniqueId);
          if (res.include) {
            filteredObj[childKey] = res.value;
            hasMatch = true;
          }
        });

        return { filtered: filteredObj, hasMatch };
      }

      return { filtered: items, hasMatch: false };
    };

    const filterNode = (key, value, parentUniqueId) => {
      const uniqueId = makeUniqueId(parentUniqueId, key);
      const displayName = getDisplayName(key, value);
      const matchesSearch =
        matchesQueryTokens(displayName, queryTokens) ||
        matchesQueryTokens(value?.url, queryTokens);
      const matchesFilter = filterMatchesNode(value);
      const includeSelf = matchesSearch && matchesFilter;

      const { filtered: filteredChildren, hasMatch: descendantMatch } =
        filterItems(value?.items, uniqueId);

      if (!includeSelf && !descendantMatch) {
        return { include: false };
      }

      if (descendantMatch) {
        expandIds.add(uniqueId);
      }

      return {
        include: true,
        value: {
          ...value,
          items: filteredChildren,
        },
      };
    };

    const filteredRoot = {};

    Object.entries(data).forEach(([rootKey, rootValue]) => {
      const res = filterNode(rootKey, rootValue, "");
      if (res.include) {
        filteredRoot[rootKey] = res.value;
      }
    });

    return {
      filteredTreeData: filteredRoot,
      autoExpandIds: expandIds,
      hasSearchMatches: Object.keys(filteredRoot).length > 0,
    };
  }, [data, searchQuery, activeFilters, hasActiveFilters]);
  function applySourceFilters(treeData, filterMatchesNode) {
    if (!treeData) return treeData;
    if (!hasActiveFilters) return treeData;

    const filterItems = (items, parentPath = "") => {
      if (Array.isArray(items)) {
        const filtered = [];
        items.forEach((item, index) => {
          const itemKey = item?.id || item?.name || `item-${index}`;
          const res = filterNode(itemKey, item, parentPath);
          if (res.include) filtered.push(res.value);
        });
        return filtered;
      }
      if (typeof items === "object" && items !== null) {
        const filtered = {};
        Object.entries(items).forEach(([childKey, childValue]) => {
          const res = filterNode(childKey, childValue, parentPath);
          if (res.include) filtered[childKey] = res.value;
        });
        return filtered;
      }
      return items;
    };

    const filterNode = (key, value, parentPath) => {
      const includeSelf = filterMatchesNode(value);
      const filteredChildren = filterItems(value?.items, key);
      const hasChildren =
        filteredChildren &&
        ((Array.isArray(filteredChildren) && filteredChildren.length > 0) ||
          (typeof filteredChildren === "object" &&
            Object.keys(filteredChildren).length > 0));

      if (includeSelf || hasChildren) {
        return {
          include: true,
          value: {
            ...value,
            items: hasChildren ? filteredChildren : value?.items,
          },
        };
      }

      return { include: false };
    };

    const filteredRoot = {};
    Object.entries(treeData).forEach(([rootKey, rootValue]) => {
      const res = filterNode(rootKey, rootValue, "");
      if (res.include) {
        filteredRoot[rootKey] = res.value;
      }
    });
    return filteredRoot;
  }

  useEffect(() => {
    const query = searchQuery.trim();

    if (query) {
      if (!expandedNodesBeforeSearchRef.current) {
        expandedNodesBeforeSearchRef.current = new Set(expandedNodes);
      }
      setExpandedNodes(new Set(autoExpandIds));
      return;
    }

    if (expandedNodesBeforeSearchRef.current) {
      setExpandedNodes(expandedNodesBeforeSearchRef.current);
      expandedNodesBeforeSearchRef.current = null;
    }
  }, [searchQuery, autoExpandIds]);

  const renderNode = (
    key,
    value,
    level = 0,
    parentPath = "",
    siblingIndex = 0
  ) => {
    console.log("key", key);
    console.log("value", value);
    console.log("level", level);
    console.log("parentPath", parentPath);

    // For array items, key is already the uniqueId, for object items, build it
    const uniqueId =
      typeof key === "string" && key.includes(".")
        ? key
        : parentPath
        ? `${parentPath}.${key}`
        : key;
    const hasChildren = value.items && Object.keys(value.items).length > 0;
    const isExpanded = expandedNodes.has(uniqueId);

    // Determine selection based on stable page/section id, with a fallback to uniqueId
    const nodeIdForSelection =
      value?.id ?? (typeof key === "string" ? key : String(key));
    const selectedId =
      selectedNode?.data?.id || selectedNode?.id || selectedNode?.uniqueId;
    const isSelected =
      (selectedId && nodeIdForSelection && selectedId === nodeIdForSelection) ||
      selectedNode?.uniqueId === uniqueId;
    const isHovered = hoveredNode === uniqueId;
    const indentSize = level * 20; // 20px per level

    const colorScheme = LEVEL_COLORS[level % LEVEL_COLORS.length];

    // Extract the actual display name from the uniqueId
    const displayName =
      value.name || (typeof key === "string" ? key.split(".").pop() : key);

    // Create node object for drag operations
    const nodeFilterMatches = getNodeFilterMatches(value);
    const activeHighlightFilterId = hasActiveFilters
      ? nodeFilterMatches.find((id) => activeFilters.includes(id))
      : null;
    const highlightFilter = activeHighlightFilterId
      ? FILTER_LOOKUP[activeHighlightFilterId]
      : null;
    const iconAccentFilterId = nodeFilterMatches[0];
    const iconAccentFilter = iconAccentFilterId
      ? FILTER_LOOKUP[iconAccentFilterId]
      : null;

    const nodeObject = {
      id: nodeIdForSelection,
      uniqueId: uniqueId,
      name: displayName,
      data: value,
      level: level,
    };

    // Check if this node is being dragged over
    const isDragOver = dragOverNode?.uniqueId === uniqueId;
    const isBeingDragged = draggedNode?.uniqueId === uniqueId;

    const reactKey = `${uniqueId}::${level}::${siblingIndex}`;

    return (
      <motion.div
        key={reactKey}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {/* Drop indicator - Before */}
        {isDragOver && dropPosition === "before" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500 z-10">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-sky-500 rounded-full" />
          </div>
        )}

        <motion.div
          className={`group flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-all relative ${
            isBeingDragged
              ? "opacity-50"
              : isSelected
              ? `${colorScheme.textClass} font-medium`
              : "text-gray-700 hover:bg-gray-100"
          } ${
            // Highlight the row that is the current drop target
            isDragOver ? "bg-sky-50 ring-1 ring-sky-300" : ""
          } ${highlightFilter ? highlightFilter.highlightClass : ""}`}
          style={{ paddingLeft: `${indentSize + 8}px` }}
          draggable={!isBeingDragged}
          ref={(el) => {
            const refKeys = [
              nodeIdForSelection != null ? String(nodeIdForSelection) : null,
              uniqueId != null ? String(uniqueId) : null,
            ].filter(Boolean);
            refKeys.forEach((key) => {
              if (!key) return;
              if (el) {
                nodeRefs.current.set(key, el);
              } else {
                nodeRefs.current.delete(key);
              }
            });
          }}
          onDragStart={(e) => handleDragStart(e, nodeObject)}
          onDragOver={(e) => handleDragOver(e, nodeObject)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nodeObject)}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (!isBeingDragged) {
              onNodeSelect(nodeObject);
            }
          }}
          onMouseEnter={() => setHoveredNode(uniqueId)}
          onMouseLeave={() => setHoveredNode(null)}
          whileHover={
            !isBeingDragged ? { backgroundColor: "rgba(249, 250, 251, 1)" } : {}
          }
          whileTap={!isBeingDragged ? { scale: 0.995 } : {}}
        >
          {/* Selection Indicator */}
          {isSelected && (
            <motion.div
              layoutId="treeSelection"
              className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-600"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />
          )}

          {/* Chevron - only show for items with children */}
          {hasChildren ? (
            <motion.button
              onClick={(e) => toggleNode(uniqueId, e)}
              className="flex-shrink-0 hover:bg-gray-200 rounded p-0.5 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChevronRight className={`h-4 w-4`} />
              </motion.div>
            </motion.button>
          ) : (
            <div className="w-5" /> // Spacer for alignment
          )}

          {/* Drag Indicator - show on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: isHovered && !isBeingDragged ? 1 : 0,
              scale: isHovered && !isBeingDragged ? 1 : 0.8,
            }}
            className="flex-shrink-0"
          >
            <GripVertical className="h-3 w-3 text-gray-400 active:text-gray-600 active:cursor-grabbing cursor-grab" />
          </motion.div>

          {/* Page Icon - always visible */}
          <div className="flex-shrink-0">
            <PageIcon
              level={level}
              accentClass={iconAccentFilter?.iconAccentClass}
              accentLabel={iconAccentFilter?.tooltip}
            />
          </div>

          {/* Name */}
          <span className="flex-1 text-sm truncate select-none">
            {highlightText(displayName, searchQuery)}
          </span>

          {/* Badge for children count - show on hover */}
          {hasChildren && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8,
              }}
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                isSelected
                  ? `${colorScheme.bgClass} ${colorScheme.textClass}`
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {Array.isArray(value.items)
                ? value.items.length
                : Object.keys(value.items).length}
            </motion.span>
          )}

          {/* Add Page Button - show on hover */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
            }}
            onClick={(e) =>
              handleAddPage(
                {
                  id: nodeIdForSelection,
                  uniqueId: uniqueId,
                  name: displayName,
                  data: value,
                },
                e
              )
            }
            className="flex-shrink-0 hover:bg-sky-100 rounded p-1 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Add child page"
          >
            <Plus className="h-3 w-3 text-sky-600" />
          </motion.button>
        </motion.div>

        {/* Children */}
        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {typeof value.items === "object" && !Array.isArray(value.items)
                ? Object.entries(value.items).map(
                    ([childKey, childValue], childIndex) =>
                      renderNode(
                        childKey,
                        childValue,
                        level + 1,
                        uniqueId,
                        childIndex
                      )
                  )
                : Array.isArray(value.items) &&
                  value.items.map((item, index) => {
                    const itemKey = item.id || item.name || `item-${index}`;
                    const uniqueItemKey = `${itemKey}`;
                    return renderNode(
                      uniqueItemKey,
                      item,
                      level + 1,
                      uniqueId,
                      index
                    );
                  })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop indicator - After */}
        {isDragOver && dropPosition === "after" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 z-10">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-sky-500 rounded-full" />
          </div>
        )}
      </motion.div>
    );
  };

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p>No content structure available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <motion.div
        ref={treeRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-gray-200 space-y-3 bg-white"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Pages
          </h3>
          <div className="flex items-center gap-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={expandAll}
              className="text-xs text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-all cursor-pointer font-medium"
            >
              Expand All
            </motion.button>
            <span className="text-gray-300">•</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={collapseAll}
              className="text-xs text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-all cursor-pointer font-medium"
            >
              Collapse All
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <span>Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold uppercase tracking-wide cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_FILTERS.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  aria-pressed={isActive}
                  title={filter.description}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight transition-all duration-150 shadow-sm ${
                    isActive ? filter.chipActiveClass : filter.chipInactiveClass
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${filter.dotClass}`}
                  ></span>
                  <span className="whitespace-nowrap">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </motion.div>

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto"
        ref={treeScrollContainerRef}
      >
        <AnimatePresence>
          {!hasSearchMatches ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 text-center text-gray-500"
            >
              <p>No matching pages</p>
            </motion.div>
          ) : (
            Object.entries(filteredTreeData || {}).map(
              ([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {renderNode(key, value, 0)}
                </motion.div>
              )
            )
          )}
        </AnimatePresence>
      </div>

      {/* Add Page Modal */}
      <AddPageModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        parentPageId={selectedParentNode?.id}
        projectId={projectId}
        onPageAdded={handlePageAdded}
        parentPageName={selectedParentNode?.name}
        parentPageUrl={selectedParentNode?.data?.url}
      />
    </div>
  );
}
