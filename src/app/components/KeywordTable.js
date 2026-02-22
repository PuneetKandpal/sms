"use client";
import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  Box,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  FormControlLabel,
  Popover,
  CircularProgress,
  Skeleton,
  Badge,
  Tooltip,
  Chip,
} from "@mui/material";
import { MdKeyboardArrowDown, MdExpandMore } from "react-icons/md";
import { GoSearch as SearchIcon } from "react-icons/go";
import { BsViewStacked as ViewColumnIcon } from "react-icons/bs";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import {
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  FilterIcon,
  Maximize2,
  Minimize2,
  RefreshCwIcon,
  SeparatorHorizontal,
  ShieldCloseIcon,
  SortAscIcon,
  SortDescIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import useDebounce from "../utils/hooks/useDebounce";
import KeywordsTableComponent from "./KeywordsTableComponent";

const PRIORITY_CONFIG = {
  P1: { color: "bg-green-100 text-green-700", tooltip: "Priority 1" },
  P2: { color: "bg-blue-100 text-blue-700", tooltip: "Priority 2" },
  P3: { color: "bg-amber-100 text-amber-700", tooltip: "Priority 3" },
  "-": { color: "bg-gray-100 text-gray-700", tooltip: "Unprioritized" },
};

const getCompetitionColor = (competition) => {
  if (!competition || typeof competition !== "string") {
    return "bg-gray-100 text-gray-800";
  }
  const normalized = competition.toLowerCase();
  if (normalized.includes("high")) return "bg-red-100 text-red-700";
  if (normalized.includes("medium")) return "bg-yellow-100 text-yellow-700";
  if (normalized.includes("low")) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-800";
};

const getSearchIntentColor = (intent) => {
  if (!intent) return "bg-gray-100 text-gray-800";
  switch (intent.toLowerCase()) {
    case "commercial":
      return "bg-purple-100 text-purple-700";
    case "informational":
      return "bg-blue-100 text-blue-700";
    case "navigational":
      return "bg-indigo-100 text-indigo-700";
    case "transactional":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getKeywordStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "review":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const competitionOptions = {
  low: {
    key: "low",
    label: "Low",
    color: getCompetitionColor("low"),
  },
  medium: {
    key: "medium",
    label: "Medium",
    color: getCompetitionColor("medium"),
  },
  high: {
    key: "high",
    label: "High",
    color: getCompetitionColor("high"),
  },
};

const keywordStatusOptions = {
  approved: {
    key: "approved",
    label: "Approved",
    color: getKeywordStatusColor("approved"),
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    color: getKeywordStatusColor("rejected"),
  },
  review: {
    key: "review",
    label: "Review",
    color: getKeywordStatusColor("review"),
  },
};

const intentOptions = {
  commercial: {
    key: "commercial",
    label: "Commercial",
    color: getSearchIntentColor("commercial"),
  },
  informational: {
    key: "informational",
    label: "Informational",
    color: getSearchIntentColor("informational"),
  },
  transactional: {
    key: "transactional",
    label: "Transactional",
    color: getSearchIntentColor("transactional"),
  },
  navigational: {
    key: "navigational",
    label: "Navigational",
    color: getSearchIntentColor("navigational"),
  },
};

const competitorOptions = {
  true: {
    key: "true",
    label: "True",
    icon: <CheckCircleIcon className="text-green-500" size={15} />,
  },
  false: {
    key: "false",
    label: "False",
    icon: <CircleIcon className="text-red-500" size={15} />,
  },
};

const optionMap = {
  priority_label: [
    { val: "P1", label: "P1", color: PRIORITY_CONFIG.P1.color },
    { val: "P2", label: "P2", color: PRIORITY_CONFIG.P2.color },
    { val: "P3", label: "P3", color: PRIORITY_CONFIG.P3.color },
    { val: "-", label: "Unprioritized", color: PRIORITY_CONFIG["-"].color },
  ],
  competition_level: Object.entries(competitionOptions).map(([k, v]) => ({
    val: v.key,
    label: v.label,
    color: v.color,
  })),
  search_intent_info: Object.entries(intentOptions).map(([k, v]) => ({
    val: v.key,
    label: v.label,
    color: v.color,
  })),
  keyword_status: Object.entries(keywordStatusOptions).map(([k, v]) => ({
    val: v.key,
    label: v.label,
    color: v.color,
  })),
  is_competitor: Object.entries(competitorOptions).map(([k, v]) => ({
    val: v.key,
    label: v.label,
    icon: v.icon,
  })),
};

const rangeOptionMap = {
  search_volume: [
    {
      type: "textBox",
      label: "Maximum Volume",
      placeholder: "Enter Maximum Volume",
    },
    {
      type: "textBox",
      label: "Minimum Volume",
      placeholder: "Enter Minimum Volume",
    },
  ],
  high_top_of_page_bid: [
    {
      type: "textBox",
      label: "Maximum Bid",
      placeholder: "Enter Maximum Bid",
    },
    {
      type: "textBox",
      label: "Minimum Bid",
      placeholder: "Enter Minimum Bid",
    },
  ],
  low_top_of_page_bid: [
    {
      type: "textBox",
      label: "Maximum Bid",
      placeholder: "Enter Maximum Bid",
    },
    {
      type: "textBox",
      label: "Minimum Bid",
      placeholder: "Enter Minimum Bid",
    },
  ],
  cpc: [
    {
      type: "textBox",
      label: "Maximum CPC",
      placeholder: "Enter Maximum CPC",
    },
    {
      type: "textBox",
      label: "Minimum CPC",
      placeholder: "Enter Minimum CPC",
    },
  ],
};

export default function KeywordTable({
  keywordData,
  setKeywordData,
  selectedProject,
  loading,
  onSelectionChange = () => {},
  selectionKey,
  onRefreshKeywords = () => {}, // Add onRefreshKeywords prop
}) {
  const { setIsDrawerOpen, instantRefreshAfterTaskStart } = useTaskMonitor();
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "priority_score",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLinkedProducts, setSearchLinkedProducts] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedLinkedProductsSearch = useDebounce(searchLinkedProducts, 500);
  const [anchorEl, setAnchorEl] = useState(null);
  const projectId = selectedProject?.id;
  const [priorityAnchor, setPriorityAnchor] = useState({
    anchorEl: null,
    rowId: null,
  });
  const [aiQuestionsLoading, setAiQuestionsLoading] = useState({});
  const [filters, setFilters] = useState({
    priority_label: "",
    competition_level: "",
    search_intent_info: "",
    volume: "",
    keyword_status: ["approved", "review"],
    is_competitor: "",
  });

  console.log("keywordData----------------", keywordData);

  const [filterOptions, setFilterOptions] = useState({
    search_volume: {
      max: null,
      min: null,
    },
    high_top_of_page_bid: {
      max: null,
      min: null,
    },
    low_top_of_page_bid: {
      max: null,
      min: null,
    },
    cpc: {
      max: null,
      min: null,
    },
  });

  const [filteredData, setFilteredData] = useState([]);
  const [isPending, startTransition] = useTransition();

  const activeFilterCount = useMemo(() => {
    return (
      (filters.priority_label ? 1 : 0) +
      (filters.competition_level ? 1 : 0) +
      (filters.search_intent_info ? 1 : 0) +
      (filters.volume ? 1 : 0) +
      (filters.keyword_status.length != 0 ? 1 : 0) +
      (filters.is_competitor ? 1 : 0) +
      (debouncedSearchTerm ? 1 : 0) +
      (debouncedLinkedProductsSearch ? 1 : 0) +
      (filterOptions.search_volume.min !== null ||
      filterOptions.search_volume.max !== null
        ? 1
        : 0) +
      (filterOptions.high_top_of_page_bid.min !== null ||
      filterOptions.high_top_of_page_bid.max !== null
        ? 1
        : 0) +
      (filterOptions.low_top_of_page_bid.min !== null ||
      filterOptions.low_top_of_page_bid.max !== null
        ? 1
        : 0) +
      (filterOptions.cpc.min !== null || filterOptions.cpc.max !== null ? 1 : 0)
    );
  }, [
    filters,
    filterOptions,
    debouncedSearchTerm,
    debouncedLinkedProductsSearch,
  ]);

  // Popover controls
  const [anchorColumn, setAnchorColumn] = useState({
    anchorEl: null,
    column: null,
  });
  const [anchorLinkedProductsColumn, setAnchorLinkedProductsColumn] = useState({
    anchorEl: null,
    column: null,
  });
  const [anchorRangeFilter, setAnchorRangeFilter] = useState({
    anchorEl: null,
    column: null,
  });
  const [activeColumn, setActiveColumn] = useState(null);
  const [anchorFilter, setAnchorFilter] = useState({
    anchorEl: null,
    column: null,
  });

  const handleMinimumRangeChange = (value, columnKey) => {
    const valueNumber = Number(value);

    if (Number.isNaN(valueNumber)) {
      toast.error("Min value must be a number");
      return;
    }

    setFilterOptions((prev) => ({
      ...prev,
      [columnKey]: { ...prev[columnKey], min: valueNumber },
    }));
  };

  const openPriorityMenu = (e, rowId) => {
    e.stopPropagation();
    setPriorityAnchor({ anchorEl: e.currentTarget, rowId });
  };

  const closePriorityMenu = () => {
    setPriorityAnchor({ anchorEl: null, rowId: null });
  };

  const updateKeywordPriority = async (rowId, nextPriority) => {
    const normalized =
      nextPriority && nextPriority !== "-"
        ? String(nextPriority).trim().toUpperCase()
        : null;
    const prev = keywordData;

    closePriorityMenu();

    setKeywordData((cur) =>
      cur.map((k) => {
        if (k.id !== rowId) return k;
        const updated = { ...k };
        if ("priority_level" in updated) {
          delete updated.priority_level;
        }
        return { ...updated, priority_label: normalized };
      })
    );

    try {
      await api.post("/keyword-api/update-keyword-priority-label/", {
        keyword_ids: [rowId],
        project_id: projectId,
        priority_label: normalized,
      });
      toast.success("Priority updated");

      onRefreshKeywords?.({ showLoader: false });
    } catch (err) {
      setKeywordData(prev);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update priority");
    }
  };

  const handleSubmitAIQuestions = async (row) => {
    if (!row?.name || !row?.id || !projectId) {
      toast.error("Missing keyword or project id");
      return;
    }

    setAiQuestionsLoading((prev) => ({ ...prev, [row.id]: true }));
    try {
      const res = await api.post("/keyword-api/analyze-keyword-serp/", {
        keyword: row.name,
        keyword_id: row.id,
        project_id: projectId,
      });
      toast.success(res?.data?.message || "AI Questions job started");
      onRefreshKeywords?.({ showLoader: false });

      try {
        await instantRefreshAfterTaskStart?.();
      } finally {
        setIsDrawerOpen?.(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to start AI Questions");
    } finally {
      setAiQuestionsLoading((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }
  };
  const handleMaximumRangeChange = (value, columnKey) => {
    const valueNumber = Number(value);

    if (Number.isNaN(valueNumber)) {
      toast.error("Max value must be a number");
      return;
    }

    setFilterOptions((prev) => ({
      ...prev,
      [columnKey]: { ...prev[columnKey], max: Number(value) },
    }));
  };

  const openColumnMenu = (e, columnKey) => {
    e.stopPropagation();
    setActiveColumn(columnKey);

    //console.log("openColumnMenu", columnKey);

    const column = columns.find((col) => col.key === columnKey);

    if (column.sortable || column.filterable)
      setAnchorColumn({ anchorEl: e.currentTarget, column: columnKey });

    if (columnKey === "linked_products") {
      setAnchorLinkedProductsColumn({
        anchorEl: e.currentTarget,
        column: columnKey,
      });
    }

    closeFilterMenu();
  };
  const closeColumnMenu = () => {
    setAnchorColumn({ anchorEl: null, column: null });
    setAnchorLinkedProductsColumn({ anchorEl: null, column: null });
    setActiveColumn(null);
    setAnchorFilter({ anchorEl: null, column: null });
  };

  const openFilterMenu = (e, columnKey) => {
    e.stopPropagation();

    Object.keys(optionMap).forEach((key) => {
      if (key === columnKey)
        setAnchorFilter({ anchorEl: e.currentTarget, column: activeColumn });
    });
    Object.keys(rangeOptionMap).forEach((key) => {
      if (key == columnKey) {
        setAnchorRangeFilter({
          anchorEl: e.currentTarget,
          column: activeColumn,
        });
      }
    });
  };
  const closeFilterMenu = () => {
    setAnchorFilter({ anchorEl: null, column: null });
    setAnchorRangeFilter({ anchorEl: null, column: null });
  };

  const handleSort = (key, direction) => {
    startTransition(() => {
      setSortConfig((prev) => ({
        key,
        direction,
      }));
      closeColumnMenu();
    });
  };

  const handleFilter = (value) => {
    console.log("handleFilter ---", value);

    if (activeColumn == "keyword_status") {
      if (filters.keyword_status.includes(value)) {
        console.log("includes", value);
        console.log("filters.keyword_status", filters.keyword_status);

        const newStatusFilters = filters.keyword_status.filter(
          (item) => item !== value
        );

        setFilters((prev) => ({
          ...prev,
          keyword_status: newStatusFilters,
        }));
        return;
      } else {
        const newStatusFilters = [...filters.keyword_status, value];

        setFilters((prev) => ({
          ...prev,
          keyword_status: newStatusFilters,
        }));
        return;
      }
    }
    setFilters((prev) => ({
      ...prev,
      [activeColumn]: value,
    }));
    closeFilterMenu();
    closeColumnMenu();
  };
  const clearFilter = (columnKey) => {
    if (columnKey == "keyword_status") {
      setFilters((prev) => ({
        ...prev,
        keyword_status: [],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [columnKey]: "",
      }));
    }

    setFilterOptions((prev) => ({
      ...prev,
      [activeColumn]: { ...prev[activeColumn], min: null, max: null },
    }));
    closeFilterMenu();
    closeColumnMenu();
    if (sortConfig.key === columnKey) {
      setSortConfig({ key: null, direction: null });
    }
  };

  const handleColumnVisibilityChange = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Keyword",
        sortable: true,
        filterable: false,
        sx: { minWidth: "15vw" },
      },
      {
        key: "priority_label",
        label: "Priority",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "7vw" },
      },
      {
        key: "priority_score",
        label: "Priority Score",
        sortable: true,
        filterable: false,
        sx: { maxWidth: "7vw" },
      },
      {
        key: "ai_questions",
        label: "AI Questions",
        sortable: false,
        filterable: false,
        sx: { maxWidth: "9vw" },
      },
      {
        key: "search_volume",
        label: "Volume",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "6vw" },
      },
      {
        key: "competition_level",
        label: "Competition",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "7vw" },
      },
      {
        key: "linked_products",
        label: "Products/Services",
        sortable: false,
        filterable: false,
        searchable: true,
        sx: { width: "12vw" },
      },
      {
        key: "search_intent_info",
        label: "Search Intent",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "10vw" },
      },
      {
        key: "cpc",
        label: "CPC",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "5vw" },
      },
      {
        key: "high_top_of_page_bid",
        label: "High Bid",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "5vw" },
      },
      {
        key: "low_top_of_page_bid",
        label: "Low Bid",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "5vw" },
      },
      {
        key: "keyword_status",
        label: "Approval",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "4vw" },
      },
      {
        key: "is_competitor",
        label: "Is Competitor",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "6vw" },
      },
      {
        key: "se_type",
        label: "SE Type",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "language_code",
        label: "Language",
        sortable: false,
        filterable: false,
        sx: { maxWidth: "5vw" },
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        filterable: false,
        sx: { width: "12vw" },
      },
    ],
    []
  );

  const defaultColumns = [
    "name",
    "priority_label",
    "priority_score",
    "ai_questions",
    "search_volume",
    "competition_level",
    "linked_products",
    "keyword_status",
    "cpc",
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    defaultColumns.forEach((col) => {
      initial[col] = true;
    });
    return initial;
  });

  useEffect(() => {
    startTransition(() => {
      if (!Array.isArray(keywordData)) {
        setFilteredData([]);
        return;
      }

      const result = keywordData
        .filter((row) => {
          if (!debouncedSearchTerm) return true;
          return row.name
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        })
        .filter((row) => {
          if (!filters.priority_label) return true;
          const rawLabel = row?.priority_label;
          const normalized = rawLabel ? String(rawLabel).trim().toUpperCase() : "-";
          const key = /^P[1-3]$/.test(normalized) ? normalized : "-";
          const wanted = String(filters.priority_label).trim().toUpperCase();
          return key === wanted;
        })
        .filter(
          (row) =>
            !filters.competition_level ||
            (row.competition_level &&
              row.competition_level.toLowerCase() ===
                filters.competition_level.toLowerCase())
        )
        .filter(
          (row) =>
            !filters.search_intent_info ||
            row.search_intent_info?.main_intent === filters.search_intent_info
        )
        .filter(
          (row) =>
            !filters.volume || row.search_volume >= parseInt(filters.volume, 10)
        )
        .filter((row) => {
          if (!debouncedLinkedProductsSearch) return true;

          const linkedProducts =
            row.linked_products && Array.isArray(row.linked_products)
              ? row.linked_products.map((product) => product.name).join("-")
              : "";
          return linkedProducts
            .toLowerCase()
            .includes(debouncedLinkedProductsSearch.toLowerCase());
        })
        .filter((row) => {
          if (
            !filterOptions.low_top_of_page_bid.min &&
            !filterOptions.low_top_of_page_bid.max
          )
            return true;

          if (
            filterOptions.low_top_of_page_bid.min &&
            filterOptions.low_top_of_page_bid.max
          ) {
            return (
              row.low_top_of_page_bid >=
                parseInt(filterOptions.low_top_of_page_bid.min, 10) &&
              row.low_top_of_page_bid <=
                parseInt(filterOptions.low_top_of_page_bid.max, 10)
            );
          } else if (filterOptions.low_top_of_page_bid.min) {
            return (
              row.low_top_of_page_bid >=
              parseInt(filterOptions.low_top_of_page_bid.min, 10)
            );
          } else if (filterOptions.low_top_of_page_bid.max) {
            return (
              row.low_top_of_page_bid <=
              parseInt(filterOptions.low_top_of_page_bid.max, 10)
            );
          }
        })
        .filter((row) => {
          if (
            !filterOptions.high_top_of_page_bid.min &&
            !filterOptions.high_top_of_page_bid.max
          )
            return true;

          if (
            filterOptions.high_top_of_page_bid.min &&
            filterOptions.high_top_of_page_bid.max
          ) {
            return (
              row.high_top_of_page_bid >=
                filterOptions.high_top_of_page_bid.min &&
              row.high_top_of_page_bid <= filterOptions.high_top_of_page_bid.max
            );
          } else if (filterOptions.high_top_of_page_bid.min) {
            return (
              row.high_top_of_page_bid >= filterOptions.high_top_of_page_bid.min
            );
          }
        })
        .filter((row) => {
          if (!filterOptions.cpc.min && !filterOptions.cpc.max) return true;

          if (filterOptions.cpc.min && filterOptions.cpc.max) {
            return (
              row.cpc >= filterOptions.cpc.min &&
              row.cpc <= filterOptions.cpc.max
            );
          } else if (filterOptions.cpc.min) {
            return row.cpc >= filterOptions.cpc.min;
          } else if (filterOptions.cpc.max) {
            return row.cpc <= filterOptions.cpc.max;
          }
        })
        .filter((row) => {
          // console.log(
          //   "filterOptions.search_volume",
          //   filterOptions.search_volume
          // );
          if (
            !filterOptions.search_volume.min &&
            !filterOptions.search_volume.max
          )
            return true;

          if (
            filterOptions.search_volume.min &&
            filterOptions.search_volume.max
          ) {
            return (
              row.search_volume >= filterOptions.search_volume.min &&
              row.search_volume <= filterOptions.search_volume.max
            );
          } else if (filterOptions.search_volume.min) {
            return row.search_volume >= filterOptions.search_volume.min;
          } else if (filterOptions.search_volume.max) {
            return row.search_volume <= filterOptions.search_volume.max;
          }
        })
        .filter((row) => {
          if (filters.keyword_status.length == 0 || !row?.keyword_status)
            return true;

          const status = row.keyword_status
            ? row.keyword_status.toLowerCase()
            : "";

          return filters.keyword_status.includes(status);
        })
        .filter((row) => {
          if (!filters.is_competitor) return true;

          const isCompetitor =
            row.is_competitor === true || row.is_competitor === "true";
          return filters.is_competitor === "true"
            ? isCompetitor
            : !isCompetitor;
        })
        ;

      setFilteredData(result);
    });
  }, [
    keywordData,
    debouncedSearchTerm,
    debouncedLinkedProductsSearch,
    filters,
    filterOptions,
  ]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const competitionOrder = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
      };

      const keywordStatusOrder = {
        approved: 1,
        rejected: 2,
        review: 3,
      };

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "search_intent_info") {
        aValue = a.search_intent_info?.main_intent;
        bValue = b.search_intent_info?.main_intent;
      } else if (sortConfig.key === "competition_level") {
        aValue = competitionOrder[a.competition_level] || 0;
        bValue = competitionOrder[b.competition_level] || 0;
      } else if (sortConfig.key === "keyword_status") {
        aValue = keywordStatusOrder[a?.keyword_status] || 0;
        bValue = keywordStatusOrder[b?.keyword_status] || 0;
      } else if (sortConfig.key === "priority_label") {
        const priorityOrder = { P1: 3, P2: 2, P3: 1, "-": 0 };
        const apRaw = a?.priority_label;
        const bpRaw = b?.priority_label;
        const ap = apRaw ? String(apRaw).trim().toUpperCase() : "-";
        const bp = bpRaw ? String(bpRaw).trim().toUpperCase() : "-";
        aValue = priorityOrder[/^P[1-3]$/.test(ap) ? ap : "-"] ?? 0;
        bValue = priorityOrder[/^P[1-3]$/.test(bp) ? bp : "-"] ?? 0;
      } else if (sortConfig.key === "created_at") {
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
      } else if (sortConfig.key === "is_competitor") {
        aValue = a.is_competitor === true || a.is_competitor === "true" ? 1 : 0;
        bValue = b.is_competitor === true || b.is_competitor === "true" ? 1 : 0;
      } else if (sortConfig.key === "priority_score") {
        const normalizeScore = (row) => {
          if (typeof row?.final_priority_score === "number") return row.final_priority_score;
          const raw =
            typeof row?.priority_score === "number"
              ? row.priority_score
              : row?.priority_score ?? row?.relevancy_score_for_business;
          return typeof raw === "number" ? raw : Number(raw || 0);
        };
        aValue = normalizeScore(a);
        bValue = normalizeScore(b);
      }

      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      const numA = parseFloat(aValue);
      const numB = parseFloat(bValue);

      if (!isNaN(numA) && !isNaN(numB)) {
        aValue = numA;
        bValue = numB;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [filteredData, sortConfig]);

  const [checkedRows, setCheckedRows] = useState({});

  useEffect(() => {
    setCheckedRows({});
  }, [selectionKey]);

  const isAllSelected =
    sortedData.length > 0 && sortedData.every((row) => checkedRows[row.id]);

  const handleSelectAll = () => {
    const newCheckedRows = { ...checkedRows };
    if (isAllSelected) {
      sortedData.forEach((row) => {
        delete newCheckedRows[row.id];
      });
    } else {
      sortedData.forEach((row) => {
        newCheckedRows[row.id] = true;
      });
    }
    setCheckedRows(newCheckedRows);
  };

  const handleCheckboxToggle = (rowId) => {
    setCheckedRows((prev) => {
      const newChecked = { ...prev };
      if (newChecked[rowId]) {
        delete newChecked[rowId];
      } else {
        newChecked[rowId] = true;
      }
      return newChecked;
    });
  };

  useEffect(() => {
    const selectedIds = Object.keys(checkedRows);
    const selected = keywordData.filter((row) => selectedIds.includes(row.id));
    onSelectionChange(selected);
  }, [checkedRows, keywordData, onSelectionChange]);

  if (error) {
    return (
      <div className="w-full p-4 sm:p-6 space-y-6 bg-[#FAFAFA]">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Shared styles for popovers and buttons
  const fieldStyles = {
    fontSize: "13px",
    width: "100%",
    "& .MuiInputBase-root": { fontSize: "13px", height: "32px" },
    "& input, & .MuiSelect-select": { padding: "8px 10px" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d8b4fe !important",
      borderWidth: "2px",
    },
  };
  const menuProps = {
    PaperProps: {
      sx: {
        fontSize: "13px",
        "& .MuiMenuItem-root": {
          fontSize: "13px",
          minHeight: "32px",
          py: 0.5,
          px: 1,
        },
      },
    },
  };

  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      <div className="flex justify-between items-center mt-1 mb-2">
        {/* Search Field */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            ...fieldStyles,
            width: "20vw",
            backgroundColor: "white",
          }}
        />
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#9810fa",
                color: "white",
                fontSize: "8px",
              },
            }}
          >
            <Tooltip title="Reset Filters & Sorting">
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <RefreshCwIcon className="text-gray-500" size={13} />
                }
                onClick={() => {
                  setFilters({
                    priority_label: "",
                    competition_level: "",
                    search_intent_info: "",
                    volume: "",
                    keyword_status: ["approved", "review"],
                    is_competitor: "",
                  });
                  setSearchTerm("");
                  setSearchLinkedProducts("");
                  setFilterOptions({
                    search_volume: {
                      max: null,
                      min: null,
                    },
                    high_top_of_page_bid: {
                      max: null,
                      min: null,
                    },
                    low_top_of_page_bid: {
                      max: null,
                      min: null,
                    },
                    cpc: {
                      max: null,
                      min: null,
                    },
                  });
                  setSortConfig({
                    key: "priority_score",
                    direction: "desc",
                  });
                }}
                sx={{
                  color: "#374151",
                  borderColor: "#D1D5DB",
                  textTransform: "none",
                  backgroundColor: "white",
                  minWidth: "100px",
                }}
              >
                <span className="text-[13px] font-normal text-gray-800">
                  Reset
                </span>
              </Button>
            </Tooltip>
          </Badge>
          <Tooltip title="Select Visible Columns">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewColumnIcon className="text-gray-500" size={13} />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                color: "#374151",
                borderColor: "#D1D5DB",
                textTransform: "none",
                backgroundColor: "white",
                minWidth: "100px",
              }}
            >
              <span className="text-[13px] font-normal text-gray-800">
                Columns
              </span>
            </Button>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {columns.map((col) => (
              <MenuItem key={col.key} dense sx={{ px: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={visibleColumns[col.key]}
                      onChange={() => handleColumnVisibilityChange(col.key)}
                      size="small"
                      disableRipple
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "6px",
                            backgroundColor: "#e5e7eb", // light gray when unchecked
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "6px",
                            backgroundColor: "#9810fa", // purple when checked
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon
                            style={{ width: 14, height: 14, color: "white" }}
                          />
                        </Box>
                      }
                    />
                  }
                  label={
                    <span className="text-xs font-normal text-gray-800">
                      {col.label}
                    </span>
                  }
                />
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </div>

      {/* Level 1 Popover */}
      <Popover
        {...menuProps}
        open={Boolean(anchorColumn.anchorEl)}
        anchorEl={anchorColumn.anchorEl}
        onClose={closeColumnMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPaper-root": {
            maxWidth: "150px",
          },
        }}
      >
        <Box sx={{ p: 0, display: "flex", flexDirection: "column", m: 1 }}>
          {columns.find((col) => col.key === anchorColumn.column)?.sortable && (
            <MenuItem
              onClick={() => handleSort(anchorColumn.column, "asc")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                ...fieldStyles,
                justifyContent: "center",
                textTransform: "none",
                borderRadius: "6px",
                backgroundColor:
                  sortConfig.key === anchorColumn.column &&
                  sortConfig.direction === "asc"
                    ? "#e5e7eb"
                    : "white",
                border: `1px solid ${
                  sortConfig.key === anchorColumn.column &&
                  sortConfig.direction === "asc"
                    ? "#9810fa"
                    : "white"
                }`,
              }}
            >
              <SortAscIcon className="text-gray-500" size={15} />
              <span className="text-[12px] font-normal text-gray-700">
                Sort A–Z
              </span>
            </MenuItem>
          )}
          {columns.find((col) => col.key === anchorColumn.column)?.sortable && (
            <MenuItem
              onClick={() => handleSort(anchorColumn.column, "desc")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                ...fieldStyles,
                justifyContent: "center",
                textTransform: "none",
                borderRadius: "6px",
                backgroundColor:
                  sortConfig.key === anchorColumn.column &&
                  sortConfig.direction === "desc"
                    ? "#e5e7eb"
                    : "white",
                border: `1px solid ${
                  sortConfig.key === anchorColumn.column &&
                  sortConfig.direction === "desc"
                    ? "#9810fa"
                    : "white"
                }`,
              }}
            >
              <SortDescIcon className="text-gray-500" size={15} />
              <span className="text-[12px] font-normal text-gray-700">
                Sort Z–A
              </span>
            </MenuItem>
          )}
          {columns.find((col) => col.key === anchorColumn.column)?.sortable &&
            columns.find((col) => col.key === anchorColumn.column)
              ?.filterable && (
              <div className="w-full h-[0.5px] bg-gray-300 my-[2px]"></div>
            )}
          {columns.find((col) => col.key === anchorColumn.column)
            ?.filterable && (
            <MenuItem
              onClick={(e) => openFilterMenu(e, anchorColumn.column)}
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <FilterIcon className="text-gray-500" size={15} />
              <span className="text-[12px] font-normal text-gray-700">
                Filter By{" "}
              </span>
            </MenuItem>
          )}
          <div className="w-full h-[0.5px] bg-gray-300 my-[2px]"></div>
          <MenuItem
            onClick={() => clearFilter(anchorColumn.column)}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <ShieldCloseIcon
              className={`${
                activeColumn &&
                (filters[activeColumn] ||
                  filterOptions[activeColumn]?.min ||
                  filterOptions[activeColumn]?.max ||
                  sortConfig.key === activeColumn)
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
              size={15}
            />
            <span
              className={`text-[12px] font-normal text-gray-700 ${
                activeColumn &&
                (filters[activeColumn] ||
                  filterOptions[activeColumn]?.min ||
                  filterOptions[activeColumn]?.max ||
                  sortConfig.key === activeColumn)
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
            >
              Clear{" "}
            </span>
          </MenuItem>
        </Box>
      </Popover>

      <Menu
        anchorEl={priorityAnchor.anchorEl}
        open={Boolean(priorityAnchor.anchorEl)}
        onClose={closePriorityMenu}
      >
        {["P1", "P2", "P3", "-"].map((p) => (
          <MenuItem
            key={p}
            onClick={() => updateKeywordPriority(priorityAnchor.rowId, p)}
          >
            <span
              className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${
                (PRIORITY_CONFIG[p]?.color || PRIORITY_CONFIG["-"]?.color) ??
                "bg-gray-100 text-gray-700"
              }`}
            >
              {p === "-" ? "Unprioritized" : p}
            </span>
          </MenuItem>
        ))}
      </Menu>

      {/* Level 2 Popover */}
      <Popover
        {...menuProps}
        open={Boolean(anchorFilter.anchorEl)}
        anchorEl={anchorFilter.anchorEl}
        onClose={closeFilterMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPaper-root": {
            maxWidth: "150px",
          },
        }}
      >
        <Box
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            rowGap: "1px",
            m: 1,
          }}
        >
          {optionMap[activeColumn]?.map((opt, index) => (
            <MenuItem
              key={String(opt.val)}
              onClick={() => handleFilter(opt.val)}
              sx={{
                ...fieldStyles,
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor:
                  filters[activeColumn] === opt.val ||
                  filters[activeColumn].includes(opt.val)
                    ? "#e5e7eb"
                    : "white",
                border: `1px solid ${
                  filters[activeColumn] === opt.val ||
                  filters[activeColumn].includes(opt.val)
                    ? "#9810fa"
                    : "white"
                }`,
                borderRadius: "8px",
                mb: 0.5,
                minHeight: "32px",
                py: 0.5,
                px: 1,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "#f8fafc",
                  transform: "translateX(2px)",
                },
              }}
            >
              {opt.icon ? (
                <span className="text-[12px] font-normal text-gray-700 flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
              ) : (
                <span
                  className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${opt.color}`}
                >
                  {opt.label}
                </span>
              )}
            </MenuItem>
          ))}
        </Box>
      </Popover>

      {/* Range Filter Popover */}
      <Popover
        {...menuProps}
        open={Boolean(anchorRangeFilter.anchorEl)}
        anchorEl={anchorRangeFilter.anchorEl}
        onClose={closeFilterMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPaper-root": {
            maxWidth: "300px",
          },
        }}
      >
        <Box
          sx={{ p: 0, display: "flex", flexDirection: "column", m: 1, gap: 1 }}
        >
          {/* Min Range Field */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Minimum Range"
            value={filterOptions[activeColumn]?.min}
            onChange={(e) =>
              handleMinimumRangeChange(e.target.value, activeColumn)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TrendingDownIcon className="text-gray-500" size={15} />
                </InputAdornment>
              ),
            }}
            sx={{
              ...fieldStyles,
              width: "100%",
              backgroundColor: "white",
            }}
          />
          <TextField
            variant="outlined"
            size="small"
            placeholder="Maximum Range"
            value={filterOptions[activeColumn]?.max}
            onChange={(e) =>
              handleMaximumRangeChange(e.target.value, activeColumn)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TrendingUpIcon className="text-gray-500" size={15} />
                </InputAdornment>
              ),
            }}
            sx={{
              ...fieldStyles,
              width: "100%",
              backgroundColor: "white",
            }}
          />
        </Box>
      </Popover>
      {/* Linked Products level Popover */}
      <Popover
        {...menuProps}
        open={Boolean(anchorLinkedProductsColumn.anchorEl)}
        anchorEl={anchorLinkedProductsColumn.anchorEl}
        onClose={closeColumnMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPaper-root": {
            width: "300px",
          },
        }}
      >
        <Box sx={{ p: 0, display: "flex", flexDirection: "column", m: 1 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search Linked Products"
            value={searchLinkedProducts}
            onChange={(e) => setSearchLinkedProducts(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              ...fieldStyles,
              width: "100%",
              backgroundColor: "white",
            }}
          />
        </Box>
      </Popover>

      {loading ? (
        <KeywordTableSkeleton
          columns={columns}
          visibleColumns={visibleColumns}
          rowsCount={10}
        />
      ) : (
        <KeywordsTableComponent
          columns={columns}
          sortedData={sortedData}
          visibleColumns={visibleColumns}
          isAllSelected={isAllSelected}
          checkedRows={checkedRows}
          handleSelectAll={handleSelectAll}
          handleCheckboxToggle={handleCheckboxToggle}
          openColumnMenu={openColumnMenu}
          getCompetitionColor={getCompetitionColor}
          getSearchIntentColor={getSearchIntentColor}
          getKeywordStatusColor={getKeywordStatusColor}
          keywordStatusOptions={keywordStatusOptions}
          priorityConfig={PRIORITY_CONFIG}
          openPriorityMenu={openPriorityMenu}
          onSubmitAIQuestions={handleSubmitAIQuestions}
          aiQuestionsLoading={aiQuestionsLoading}
        />
      )}
      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-1 items-center">
          <span className="flex gap-1 items-center">
            <span className="text-[14px] font-normal text-gray-800">
              Total results{" "}
            </span>
            <span className="text-[14px] font-normal text-gray-800">:</span>
            <span className="font-medium text-gray-800">
              {sortedData.length}
            </span>{" "}
          </span>
        </div>
      </div>
    </Box>
  );
}

/**
 * KeywordTableSkeleton renders a shimmer UI skeleton for the KeywordTable component.
 *
 * Props:
 *  - columns: Array<{ key: string; label: string; sortable?: boolean }>;
 *  - visibleColumns: Record<string, boolean>;
 *  - rowsCount: number;
 */
function KeywordTableSkeleton({ columns, visibleColumns, rowsCount = 10 }) {
  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", px: 0 }}>
      <TableContainer
        component={Paper}
        elevation={1}
        sx={{ borderRadius: "8px", border: "1px solid black" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns
                .filter((c) => visibleColumns[c.key])
                .map((column) => (
                  <TableCell
                    className="border-b border-gray-50"
                    key={column.key}
                    align={column.key === "name" ? "left" : "center"}
                    sx={{
                      cursor: column.sortable ? "pointer" : "default",
                      fontWeight: 500,
                      fontSize: "12px",
                      color: "#374151",
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                      p: "10px 16px",
                      backgroundColor: "white",
                      borderBottom: "1px solid black",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      justifyContent={
                        column.key === "name" ? "flex-start" : "center"
                      }
                    >
                      {column.key === "name" && (
                        <Checkbox
                          size="small"
                          disableRipple
                          icon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "6px",
                                backgroundColor: "#e5e7eb", // light gray when unchecked
                              }}
                            />
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "6px",
                                backgroundColor: "#9810fa", // purple when checked
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CheckIcon
                                style={{
                                  width: 14,
                                  height: 14,
                                  color: "white",
                                }}
                              />
                            </Box>
                          }
                        />
                      )}
                      <span className="text-[13px] font-medium">
                        {column.label}
                      </span>
                      {column.sortable && (
                        <MdKeyboardArrowDown
                          style={{
                            transition: "transform 0.2s",
                            transform: "rotate(0deg)",
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
              <TableRow key={idx}>
                {columns
                  .filter((col) => visibleColumns[col.key])
                  .map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.key === "name" ? "left" : "center"}
                      sx={{ p: "10px 16px", backgroundColor: "white" }}
                    >
                      <Skeleton variant="rounded" width="100%" height={24} />
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
