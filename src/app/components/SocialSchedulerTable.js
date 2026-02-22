"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useTransition,
  useRef,
} from "react";
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
} from "@mui/material";
import { MdKeyboardArrowDown, MdExpandMore } from "react-icons/md";
import { GoSearch as SearchIcon } from "react-icons/go";
import { BsViewStacked as ViewColumnIcon } from "react-icons/bs";
import toast from "react-hot-toast";
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
import SocialSchedulerTableComponent from "./SocialSchedulerTableComponent";

// Approval Status configurations
const APPROVAL_STATUS_CONFIG = {
  review: {
    label: "Review",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    textColor: "text-yellow-700",
    bgColorClass: "bg-yellow-100",
  },
  approved: {
    label: "Approved",
    color: "#10B981",
    bgColor: "#ECFDF5",
    textColor: "text-green-700",
    bgColorClass: "bg-green-100",
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    textColor: "text-red-700",
    bgColorClass: "bg-red-100",
  },
};

// Publishing Status configurations
const PUBLISHING_STATUS_CONFIG = {
  "not scheduled": {
    label: "Not Scheduled",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    textColor: "text-gray-700",
    bgColorClass: "bg-gray-100",
  },
  scheduled: {
    label: "Scheduled",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    textColor: "text-blue-700",
    bgColorClass: "bg-blue-100",
  },
  published: {
    label: "Published",
    color: "#10B981",
    bgColor: "#ECFDF5",
    textColor: "text-green-700",
    bgColorClass: "bg-green-100",
  },
  cancelled: {
    label: "Cancelled",
    color: "#F97316",
    bgColor: "#FFF7ED",
    textColor: "text-orange-700",
    bgColorClass: "bg-orange-100",
  },
  failed: {
    label: "Failed",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    textColor: "text-red-700",
    bgColorClass: "bg-red-100",
  },
};

// Platform configurations
const PLATFORM_CONFIG = {
  instagram: {
    label: "Instagram",
    color: "bg-pink-100 text-pink-700",
  },
  facebook: {
    label: "Facebook",
    color: "bg-blue-100 text-blue-700",
  },
  twitter: {
    label: "X (Twitter)",
    color: "bg-gray-100 text-gray-700",
  },
  linkedin: {
    label: "LinkedIn",
    color: "bg-blue-100 text-blue-700",
  },
  tiktok: {
    label: "TikTok",
    color: "bg-gray-100 text-gray-700",
  },
  youtube: {
    label: "YouTube",
    color: "bg-red-100 text-red-700",
  },
};

const getApprovalStatusColor = (status) => {
  const config = APPROVAL_STATUS_CONFIG[status?.toLowerCase()];
  return config
    ? `${config.bgColorClass} ${config.textColor}`
    : "bg-gray-100 text-gray-800";
};

const getPublishingStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase() || "not scheduled";
  // Map "draft" to "not scheduled" for display purposes
  const mappedStatus =
    normalizedStatus === "draft" ? "not scheduled" : normalizedStatus;
  const config = PUBLISHING_STATUS_CONFIG[mappedStatus];
  return config
    ? `${config.bgColorClass} ${config.textColor}`
    : "bg-gray-100 text-gray-800";
};

const getPlatformColor = (platform) => {
  const config = PLATFORM_CONFIG[platform?.toLowerCase()];
  return config ? config.color : "bg-gray-100 text-gray-800";
};

const approvalStatusOptions = Object.entries(APPROVAL_STATUS_CONFIG).map(
  ([key, value]) => ({
    val: key,
    label: value.label,
    color: `${value.bgColorClass} ${value.textColor}`,
  })
);

const publishingStatusOptions = Object.entries(PUBLISHING_STATUS_CONFIG).map(
  ([key, value]) => ({
    val: key,
    label: value.label,
    color: `${value.bgColorClass} ${value.textColor}`,
  })
);

const platformOptions = Object.entries(PLATFORM_CONFIG).map(([key, value]) => ({
  val: key,
  label: value.label,
  color: value.color,
}));

export default function SocialSchedulerTable({
  scheduledPosts,
  setScheduledPosts,
  selectedProject,
  loading,
  onSelectionChange = () => {},
  onStatusUpdate,
  refreshData,
  selectionKey,
  connectedAccounts = [],
  onBulkApprove,
  onBulkReject,
  selectedPosts = [],
  bulkLoading = { approve: false, reject: false },
  clearSelection = false, // New prop to trigger clearing
}) {
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    approval_status: ["review", "approved"], // Exclude rejected by default
    publishing_status: "",
    platform: "",
  });

  const [filteredData, setFilteredData] = useState([]);
  const [isPending, startTransition] = useTransition();

  const activeFilterCount = useMemo(() => {
    return (
      (filters.approval_status.length !== 2 ? 1 : 0) + // Not showing all approval statuses (default excludes rejected)
      (filters.publishing_status ? 1 : 0) +
      (filters.platform ? 1 : 0) +
      (debouncedSearchTerm ? 1 : 0)
    );
  }, [filters, debouncedSearchTerm]);

  // Popover controls
  const [anchorColumn, setAnchorColumn] = useState({
    anchorEl: null,
    column: null,
  });
  const [activeColumn, setActiveColumn] = useState(null);
  const [anchorFilter, setAnchorFilter] = useState({
    anchorEl: null,
    column: null,
  });

  const openColumnMenu = (e, columnKey) => {
    e.stopPropagation();
    setActiveColumn(columnKey);

    const column = columns.find((col) => col.key === columnKey);

    if (column.sortable || column.filterable)
      setAnchorColumn({ anchorEl: e.currentTarget, column: columnKey });

    closeFilterMenu();
  };

  const closeColumnMenu = () => {
    setAnchorColumn({ anchorEl: null, column: null });
    setActiveColumn(null);
    setAnchorFilter({ anchorEl: null, column: null });
  };

  const openFilterMenu = (e, columnKey) => {
    e.stopPropagation();
    setAnchorFilter({ anchorEl: e.currentTarget, column: activeColumn });
  };

  const closeFilterMenu = () => {
    setAnchorFilter({ anchorEl: null, column: null });
  };

  const handleSort = (key, direction) => {
    startTransition(() => {
      setSortConfig({ key, direction });
      closeColumnMenu();
    });
  };

  const handleFilter = (value) => {
    if (activeColumn === "status") {
      if (filters.approval_status.includes(value)) {
        const newStatusFilters = filters.approval_status.filter(
          (item) => item !== value
        );
        setFilters((prev) => ({ ...prev, approval_status: newStatusFilters }));
      } else {
        const newStatusFilters = [...filters.approval_status, value];
        setFilters((prev) => ({ ...prev, approval_status: newStatusFilters }));
      }
      return;
    }
    if (activeColumn === "publishing_status") {
      if (
        Array.isArray(filters.publishing_status) &&
        filters.publishing_status.includes(value)
      ) {
        const newStatusFilters = filters.publishing_status.filter(
          (item) => item !== value
        );
        setFilters((prev) => ({
          ...prev,
          publishing_status: newStatusFilters,
        }));
      } else {
        const newStatusFilters = Array.isArray(filters.publishing_status)
          ? [...filters.publishing_status, value]
          : [value];
        setFilters((prev) => ({
          ...prev,
          publishing_status: newStatusFilters,
        }));
      }
      return;
    }
    setFilters((prev) => ({ ...prev, [activeColumn]: value }));
    closeFilterMenu();
    closeColumnMenu();
  };

  const clearFilter = (columnKey) => {
    if (columnKey === "status") {
      setFilters((prev) => ({
        ...prev,
        approval_status: ["review", "approved"],
      }));
    } else if (columnKey === "publishing_status") {
      setFilters((prev) => ({
        ...prev,
        publishing_status: "",
      }));
    } else {
      setFilters((prev) => ({ ...prev, [columnKey]: "" }));
    }
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
        key: "platform",
        label: "Platform",
        sortable: true,
        filterable: true,
        sx: { width: "10vw", maxWidth: "10vw" },
      },
      {
        key: "preview",
        label: "Preview",
        sortable: false,
        filterable: false,
        sx: { width: "100px", maxWidth: "100px" },
      },
      {
        key: "post_content",
        label: "Content",
        sortable: true,
        filterable: false,
        sx: { minWidth: "300px", flex: "1 1 auto" },
      },
      {
        key: "status",
        label: "Approval",
        sortable: true,
        filterable: true,
        sx: { minWidth: "140px", maxWidth: "140px" },
      },
      {
        key: "publishing_status",
        label: "Publish",
        sortable: true,
        filterable: true,
        sx: { minWidth: "140px", maxWidth: "140px" },
      },
      {
        key: "schedule",
        label: "Schedule",
        sortable: false,
        filterable: false,
        sx: { minWidth: "150px", maxWidth: "150px" },
      },
      {
        key: "hook",
        label: "Hook",
        sortable: false,
        filterable: false,
        sx: { minWidth: "12vw", maxWidth: "18vw" },
      },
      {
        key: "pattern",
        label: "Pattern",
        sortable: false,
        filterable: false,
        sx: { width: "10vw", maxWidth: "10vw" },
      },
      {
        key: "created_at",
        label: "Created",
        sortable: true,
        filterable: false,
        sx: { width: "10vw", maxWidth: "10vw" },
      },
      {
        key: "updated_at",
        label: "Updated",
        sortable: true,
        filterable: false,
        sx: { width: "10vw", maxWidth: "10vw" },
      },
    ],
    []
  );

  const defaultColumns = [
    "platform",
    "preview",
    "post_content",
    "status",
    "publishing_status",
    "schedule",
    "created_at",
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = defaultColumns.includes(col.key);
    });
    return initial;
  });

  useEffect(() => {
    startTransition(() => {
      if (!Array.isArray(scheduledPosts)) {
        setFilteredData([]);
        return;
      }

      const result = scheduledPosts
        .filter((row) => {
          if (!debouncedSearchTerm) return true;
          const content = row.post_data?.post_content?.toLowerCase() || "";
          const hook = row.post_data?.hook?.toLowerCase() || "";
          return (
            content.includes(debouncedSearchTerm.toLowerCase()) ||
            hook.includes(debouncedSearchTerm.toLowerCase())
          );
        })
        .filter((row) => {
          if (filters.approval_status.length === 0) return true;
          const approvalStatus = row.status?.toLowerCase() || "review";
          return filters.approval_status.includes(approvalStatus);
        })
        .filter((row) => {
          if (
            !filters.publishing_status ||
            filters.publishing_status.length === 0
          )
            return true;
          const publishingStatus =
            row.publishing_status?.toLowerCase() || "draft";
          return Array.isArray(filters.publishing_status)
            ? filters.publishing_status.includes(publishingStatus)
            : filters.publishing_status === publishingStatus;
        })
        .filter((row) => {
          if (!filters.platform) return true;
          return (
            row.post_data?.platform_name?.toLowerCase() ===
            filters.platform.toLowerCase()
          );
        });

      setFilteredData(result);
    });
  }, [scheduledPosts, debouncedSearchTerm, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested values
      if (sortConfig.key === "post_content") {
        aValue = a.post_data?.post_content;
        bValue = b.post_data?.post_content;
      } else if (sortConfig.key === "platform") {
        aValue = a.post_data?.platform_name;
        bValue = b.post_data?.platform_name;
      } else if (sortConfig.key === "status") {
        aValue = a.status || "review";
        bValue = b.status || "review";
      } else if (sortConfig.key === "publishing_status") {
        aValue = a.publishing_status || "draft";
        bValue = b.publishing_status || "draft";
      } else if (
        sortConfig.key === "created_at" ||
        sortConfig.key === "updated_at"
      ) {
        aValue = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
        bValue = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
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
  const checkedRowsRef = useRef({});
  const prevSelectedPostsLength = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    checkedRowsRef.current = checkedRows;
  }, [checkedRows]);

  useEffect(() => {
    setCheckedRows({});
  }, [selectionKey]);

  // Clear all checkboxes when parent explicitly requests it
  // DISABLED FOR NOW - checkboxes work without this
  /*
  useEffect(() => {
    if (clearSelection) {
      setCheckedRows({});
    }
  }, [clearSelection]);
  */

  // Clear checkboxes after successful bulk operations
  useEffect(() => {
    const currentLength = Array.isArray(selectedPosts)
      ? selectedPosts.length
      : 0;
    const previousLength = prevSelectedPostsLength.current;

    // Only clear if we had selections before and now we don't (indicates successful operation)
    // Also make sure we actually have checkboxes to clear
    if (
      previousLength > 0 &&
      currentLength === 0 &&
      Object.keys(checkedRowsRef.current).length > 0
    ) {
      console.log("Clearing checkboxes after successful bulk operation");
      setCheckedRows({});
    }

    // Update the ref for next comparison
    prevSelectedPostsLength.current = currentLength;
  }, [selectedPosts]);

  const isAllSelected =
    sortedData.length > 0 && sortedData.every((row) => checkedRows[row._id]);

  const handleSelectAll = () => {
    const newCheckedRows = { ...checkedRows };
    if (isAllSelected) {
      sortedData.forEach((row) => {
        delete newCheckedRows[row._id];
      });
    } else {
      sortedData.forEach((row) => {
        newCheckedRows[row._id] = true;
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
    const selected = scheduledPosts.filter((row) =>
      selectedIds.includes(row._id)
    );
    onSelectionChange(selected);
  }, [checkedRows, scheduledPosts]);

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

  const optionMap = {
    status: approvalStatusOptions,
    publishing_status: publishingStatusOptions,
    platform: platformOptions,
  };

  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      <div className="flex justify-between items-center mt-1 mb-2">
        {/* Search Field */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search posts..."
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
          {/* Bulk Actions - Always visible */}
          <Button
            variant="contained"
            size="small"
            startIcon={
              bulkLoading.approve ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircleIcon size={16} />
              )
            }
            onClick={() => {
              if (onBulkApprove) {
                // Get post_id instead of _id for bulk operations
                const postIds = Object.keys(checkedRows)
                  .filter((id) => checkedRows[id])
                  .map((id) => {
                    const post = scheduledPosts.find((p) => p._id === id);
                    return post?.post_id;
                  })
                  .filter(Boolean);
                onBulkApprove(postIds);
              }
            }}
            disabled={
              selectedPosts.length === 0 ||
              bulkLoading.approve ||
              bulkLoading.reject
            }
            sx={{
              backgroundColor:
                selectedPosts.length > 0 &&
                !bulkLoading.approve &&
                !bulkLoading.reject
                  ? "#10B981"
                  : "#D1D5DB",
              "&:hover": {
                backgroundColor:
                  selectedPosts.length > 0 &&
                  !bulkLoading.approve &&
                  !bulkLoading.reject
                    ? "#059669"
                    : "#D1D5DB",
              },
              "&:disabled": {
                backgroundColor: "#D1D5DB",
                color: "#9CA3AF",
              },
              textTransform: "none",
              fontSize: "13px",
              minWidth: "100px",
            }}
          >
            {bulkLoading.approve ? "Approving..." : "Approve"}{" "}
            {selectedPosts.length > 0 &&
            !bulkLoading.approve &&
            !bulkLoading.reject
              ? `(${selectedPosts.length})`
              : ""}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={
              bulkLoading.reject ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <TrendingDownIcon size={16} />
              )
            }
            onClick={() => {
              if (onBulkReject) {
                // Get post_id instead of _id for bulk operations
                const postIds = Object.keys(checkedRows)
                  .filter((id) => checkedRows[id])
                  .map((id) => {
                    const post = scheduledPosts.find((p) => p._id === id);
                    return post?.post_id;
                  })
                  .filter(Boolean);
                onBulkReject(postIds);
              }
            }}
            disabled={
              selectedPosts.length === 0 ||
              bulkLoading.approve ||
              bulkLoading.reject
            }
            sx={{
              backgroundColor:
                selectedPosts.length > 0 &&
                !bulkLoading.approve &&
                !bulkLoading.reject
                  ? "#EF4444"
                  : "#D1D5DB",
              "&:hover": {
                backgroundColor:
                  selectedPosts.length > 0 &&
                  !bulkLoading.approve &&
                  !bulkLoading.reject
                    ? "#DC2626"
                    : "#D1D5DB",
              },
              "&:disabled": {
                backgroundColor: "#D1D5DB",
                color: "#9CA3AF",
              },
              textTransform: "none",
              fontSize: "13px",
              minWidth: "100px",
            }}
          >
            {bulkLoading.reject ? "Rejecting..." : "Reject"}{" "}
            {selectedPosts.length > 0 &&
            !bulkLoading.approve &&
            !bulkLoading.reject
              ? `(${selectedPosts.length})`
              : ""}
          </Button>

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
                    approval_status: ["review", "approved"],
                    publishing_status: "",
                    platform: "",
                  });
                  setSearchTerm("");
                  setSortConfig({ key: "created_at", direction: "desc" });
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
                            backgroundColor: "#e5e7eb",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "6px",
                            backgroundColor: "#9810fa",
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
                Filter By
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
                (filters[activeColumn] || sortConfig.key === activeColumn)
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
              size={15}
            />
            <span
              className={`text-[12px] font-normal ${
                activeColumn &&
                (filters[activeColumn] || sortConfig.key === activeColumn)
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
            >
              Clear
            </span>
          </MenuItem>
        </Box>
      </Popover>

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
          {optionMap[activeColumn]?.map((opt) => {
            // Map activeColumn to the correct filter key
            const filterKey =
              activeColumn === "status" ? "approval_status" : activeColumn;
            const currentFilter = filters[filterKey];
            const isActive = Array.isArray(currentFilter)
              ? currentFilter.includes(opt.val)
              : currentFilter === opt.val;

            return (
              <MenuItem
                key={String(opt.val)}
                onClick={() => handleFilter(opt.val)}
                sx={{
                  ...fieldStyles,
                  justifyContent: "center",
                  textTransform: "none",
                  backgroundColor: isActive ? "#e5e7eb" : "white",
                  border: `1px solid ${isActive ? "#9810fa" : "white"}`,
                  borderRadius: "5px",
                }}
              >
                <span
                  className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${opt.color}`}
                >
                  {opt.label}
                </span>
              </MenuItem>
            );
          })}
        </Box>
      </Popover>

      {loading ? (
        <SocialSchedulerTableSkeleton
          columns={columns}
          visibleColumns={visibleColumns}
          rowsCount={10}
        />
      ) : (
        <SocialSchedulerTableComponent
          columns={columns}
          sortedData={sortedData}
          visibleColumns={visibleColumns}
          isAllSelected={isAllSelected}
          checkedRows={checkedRows}
          handleSelectAll={handleSelectAll}
          handleCheckboxToggle={handleCheckboxToggle}
          openColumnMenu={openColumnMenu}
          getApprovalStatusColor={getApprovalStatusColor}
          getPublishingStatusColor={getPublishingStatusColor}
          getPlatformColor={getPlatformColor}
          selectedProject={selectedProject}
          onStatusUpdate={onStatusUpdate}
          refreshData={refreshData}
          connectedAccounts={connectedAccounts}
        />
      )}
      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-1 items-center">
          <span className="flex gap-1 items-center">
            <span className="text-[14px] font-normal text-gray-800">
              Total results:
            </span>
            <span className="font-medium text-gray-800">
              {sortedData.length}
            </span>
          </span>
        </div>
      </div>
    </Box>
  );
}

/**
 * SocialSchedulerTableSkeleton renders a shimmer UI skeleton for the table.
 */
function SocialSchedulerTableSkeleton({
  columns,
  visibleColumns,
  rowsCount = 10,
}) {
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
                    align={column.key === "post_content" ? "left" : "center"}
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
                        column.key === "post_content" ? "flex-start" : "center"
                      }
                    >
                      {column.key === "post_content" && (
                        <Checkbox
                          size="small"
                          disableRipple
                          icon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "6px",
                                backgroundColor: "#e5e7eb",
                              }}
                            />
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "6px",
                                backgroundColor: "#9810fa",
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
                      align={col.key === "post_content" ? "left" : "center"}
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
