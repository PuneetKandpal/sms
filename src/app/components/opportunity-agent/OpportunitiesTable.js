"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Badge,
  FormControlLabel,
  Checkbox,
  Popover,
} from "@mui/material";
import { MdKeyboardArrowDown } from "react-icons/md";
import { GoSearch as SearchIcon } from "react-icons/go";
import { BsViewStacked as ViewColumnIcon } from "react-icons/bs";
import {
  FilterIcon,
  ExternalLink,
  MessageCircle,
  RefreshCwIcon,
  SortAscIcon,
  SortDescIcon,
  ShieldCloseIcon,
  CheckIcon,
  Users,
} from "lucide-react";
import { TableVirtuoso } from "react-virtuoso";
import { forwardRef } from "react";
import toast from "react-hot-toast";
import useDebounce from "../../utils/hooks/useDebounce";
import {
  FaExternalLinkAlt,
  FaFacebookF,
  FaLinkedin,
  FaReddit,
  FaTwitter,
} from "react-icons/fa";

// Table components for virtualization
const TableComponents = {
  Scroller: forwardRef((props, ref) => (
    <TableContainer
      component={Paper}
      elevation={1}
      ref={ref}
      sx={{
        borderRadius: "8px",
        border: "1px solid black",
        maxHeight: "500px",
        overflowY: "auto",
      }}
      {...props}
    />
  )),
  Table: (props) => (
    <Table {...props} size="small" sx={{ borderCollapse: "separate" }} />
  ),
  TableHead: forwardRef((props, ref) => (
    <TableHead
      {...props}
      ref={ref}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        boxShadow: "0px 0.2px 0px 0px black",
        backgroundColor: "white",
      }}
    />
  )),
  TableRow: forwardRef(({ item: row, ...props }, ref) => (
    <TableRow
      ref={ref}
      hover
      {...props}
      sx={{
        backgroundColor:
          row?.status?.toLowerCase() === "rejected"
            ? "#fef2f2"
            : row?.status?.toLowerCase() === "review"
            ? "#fffbeb"
            : row?.customer_journey?.toLowerCase() === "decision"
            ? "#f0fdf4"
            : "",
        "&:last-child td, &:last-child th": { border: 0 },
        cursor: "pointer",
      }}
    />
  )),
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

// Status configurations
const SCORE_CONFIG = {
  high: { color: "#10B981", bgColor: "#ECFDF5", textColor: "#065F46" },
  medium: { color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E" },
  low: { color: "#EF4444", bgColor: "#FEF2F2", textColor: "#991B1B" },
};

const STAGE_CONFIG = {
  awareness: { color: "#3B82F6", bgColor: "#EFF6FF", textColor: "#1E40AF" },
  consider: { color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E" },
  consideration: { color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E" },
  decision: { color: "#10B981", bgColor: "#ECFDF5", textColor: "#065F46" },
};

const PLATFORM_CONFIG = {
  linkedin: { color: "#0077b5", bgColor: "#e7f3ff", textColor: "#0077b5" },
  reddit: { color: "#ff4500", bgColor: "#fff4f0", textColor: "#ff4500" },
  twitter: { color: "#1da1f2", bgColor: "#e8f5fe", textColor: "#1da1f2" },
  facebook: { color: "#4267b2", bgColor: "#f0f2ff", textColor: "#4267b2" },
};

const STATUS_CONFIG = {
  approved: { color: "#10B981", bgColor: "#ECFDF5", textColor: "#065F46" },
  rejected: { color: "#EF4444", bgColor: "#FEF2F2", textColor: "#991B1B" },
  review: { color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E" },
  completed: { color: "#10B981", bgColor: "#ECFDF5", textColor: "#065F46" },
};

const URGENCY_CONFIG = {
  high: { color: "#EF4444", label: "High" },
  medium: { color: "#F59E0B", label: "Medium" },
  low: { color: "#6B7280", label: "Low" },
};

const PRIORITY_CONFIG = {
  immediate: { color: "#DC2626", bgColor: "#FEF2F2", textColor: "#991B1B" },
  urgent: { color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E" },
  normal: { color: "#3B82F6", bgColor: "#EFF6FF", textColor: "#1E40AF" },
  low: { color: "#6B7280", bgColor: "#F9FAFB", textColor: "#374151" },
};

// Filter options
const scoreOptions = [
  { val: "high", label: "High (80+)", color: "bg-green-100 text-green-700" },
  {
    val: "medium",
    label: "Medium (60-79)",
    color: "bg-yellow-100 text-yellow-700",
  },
  { val: "low", label: "Low (<60)", color: "bg-red-100 text-red-700" },
];

const stageOptions = [
  { val: "awareness", label: "Awareness", color: "bg-blue-100 text-blue-700" },
  {
    val: "consider",
    label: "Consider",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    val: "consideration",
    label: "Consideration",
    color: "bg-yellow-100 text-yellow-700",
  },
  { val: "decision", label: "Decision", color: "bg-green-100 text-green-700" },
];

const platformOptions = [
  { val: "linkedin", label: "LinkedIn", color: "bg-blue-100 text-blue-700" },
  { val: "reddit", label: "Reddit", color: "bg-orange-100 text-orange-700" },
  { val: "twitter", label: "Twitter", color: "bg-sky-100 text-sky-700" },
  {
    val: "facebook",
    label: "Facebook",
    color: "bg-indigo-100 text-indigo-700",
  },
];

const statusOptions = [
  { val: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
  { val: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  { val: "review", label: "Review", color: "bg-yellow-100 text-yellow-700" },
  {
    val: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-700",
  },
];

const urgencyOptions = [
  { val: "high", label: "High", color: "bg-red-100 text-red-700" },
  { val: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { val: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
];

// Platform icon component
const PlatformIcon = ({ platform }) => {
  const platformLower = platform?.toLowerCase() || "";
  const iconProps = { className: "h-4 w-4" };

  switch (platformLower) {
    case "reddit":
      return <FaReddit {...iconProps} style={{ color: "#ff4500" }} />;
    case "twitter":
      return <FaTwitter {...iconProps} style={{ color: "#1da1f2" }} />;
    case "linkedin":
      return <FaLinkedin {...iconProps} style={{ color: "#0077b5" }} />;
    case "facebook":
      return <FaFacebookF {...iconProps} style={{ color: "#4267b2" }} />;
    default:
      return <FaExternalLinkAlt {...iconProps} style={{ color: "#6b7280" }} />;
  }
};

export default function OpportunitiesTable({
  opportunities,
  loading,
  selectedProject,
}) {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({
    key: "score",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    score: "",
    customer_journey: "",
    platform: "",
    status: ["approved", "review", "completed"], // Default to exclude rejected
  });

  const [filteredData, setFilteredData] = useState([]);
  const [isPending, startTransition] = useTransition();

  const activeFilterCount = useMemo(() => {
    return (
      (filters.score ? 1 : 0) +
      (filters.customer_journey ? 1 : 0) +
      (filters.platform ? 1 : 0) +
      (filters.status && filters.status.length !== 3 ? 1 : 0) + // Not showing default status filters
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

  const [visibleColumns, setVisibleColumns] = useState({
    score: true,
    customer_journey: true,
    post_title: true,
    platform: true,
    subreddit: true,
    date: true,
    status: true,
    owner: true,
    postPreview: true,
    engagement_score: true,
    recommendedAction: true,
    actions: true,
  });

  // Filter and sort data
  useEffect(() => {
    startTransition(() => {
      if (!Array.isArray(opportunities)) {
        setFilteredData([]);
        return;
      }

      const result = opportunities
        .filter((row) => {
          if (!debouncedSearchTerm) return true;
          const postTitle = row.post_title?.toLowerCase() || "";
          const owner = row.owner?.toLowerCase() || "";
          const subreddit = row.subreddit?.toLowerCase() || "";
          const recommendedAction = row.recommended_action?.toLowerCase() || "";
          return (
            postTitle.includes(debouncedSearchTerm.toLowerCase()) ||
            owner.includes(debouncedSearchTerm.toLowerCase()) ||
            subreddit.includes(debouncedSearchTerm.toLowerCase()) ||
            recommendedAction.includes(debouncedSearchTerm.toLowerCase())
          );
        })
        .filter((row) => {
          if (!filters.score) return true;
          const score = row.score || 0;
          if (filters.score === "high") return score >= 80;
          if (filters.score === "medium") return score >= 60 && score < 80;
          if (filters.score === "low") return score < 60;
          return true;
        })
        .filter((row) => {
          if (!filters.customer_journey) return true;
          return (
            row.customer_journey?.toLowerCase() === filters.customer_journey
          );
        })
        .filter((row) => {
          if (!filters.platform) return true;
          return row.platform?.toLowerCase() === filters.platform;
        })
        .filter((row) => {
          if (filters.status && filters.status.length === 0) return true;
          const status = row.status?.toLowerCase() || "review";
          return filters.status && filters.status.includes(status);
        });

      setFilteredData(result);
    });
  }, [opportunities, debouncedSearchTerm, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortConfig.key === "score") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const columns = useMemo(
    () => [
      {
        key: "score",
        label: "Score",
        sortable: true,
        filterable: true,
        sx: { width: "80px", maxWidth: "80px" },
      },
      {
        key: "customer_journey",
        label: "Journey Stage",
        sortable: true,
        filterable: true,
        sx: { width: "120px", maxWidth: "120px" },
      },
      {
        key: "post_title",
        label: "Post Title",
        sortable: true,
        filterable: false,
        sx: { minWidth: "250px", flex: "1 1 auto" },
      },
      {
        key: "platform",
        label: "Platform",
        sortable: true,
        filterable: true,
        sx: { width: "100px", maxWidth: "100px" },
      },
      {
        key: "subreddit",
        label: "Subreddit",
        sortable: true,
        filterable: false,
        sx: { width: "120px", maxWidth: "120px" },
      },
      {
        key: "date",
        label: "Date",
        sortable: true,
        filterable: false,
        sx: { width: "140px", maxWidth: "140px" },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        sx: { width: "100px", maxWidth: "100px" },
      },
      {
        key: "owner",
        label: "Owner",
        sortable: true,
        filterable: false,
        sx: { width: "150px", maxWidth: "150px" },
      },
      {
        key: "upvotes",
        label: "Upvotes",
        sortable: true,
        filterable: false,
        sx: { width: "80px", maxWidth: "80px" },
      },
      {
        key: "comments_count",
        label: "Comments",
        sortable: true,
        filterable: false,
        sx: { width: "90px", maxWidth: "90px" },
      },
      {
        key: "engagement_score",
        label: "Engagement Score",
        sortable: true,
        filterable: false,
        sx: { width: "100px", maxWidth: "100px" },
      },
      {
        key: "recommended_action",
        label: "Recommended Action",
        sortable: false,
        filterable: false,
        sx: { minWidth: "200px", maxWidth: "250px" },
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        sx: { width: "120px", maxWidth: "120px" },
      },
    ],
    []
  );

  // Option mapping for filters
  const optionMap = {
    score: scoreOptions,
    customer_journey: stageOptions,
    platform: platformOptions,
    status: statusOptions,
  };

  const openColumnMenu = (e, columnKey) => {
    e.stopPropagation();
    setActiveColumn(columnKey);
    const column = columns.find((col) => col.key === columnKey);
    if (column.sortable || column.filterable)
      setAnchorColumn({ anchorEl: e.currentTarget, column: columnKey });
  };

  const closeColumnMenu = () => {
    setAnchorColumn({ anchorEl: null, column: null });
    setActiveColumn(null);
    setAnchorFilter({ anchorEl: null, column: null });
  };

  const openFilterMenu = (e, columnKey) => {
    e.stopPropagation();
    if (optionMap[columnKey]) {
      setAnchorFilter({ anchorEl: e.currentTarget, column: activeColumn });
    }
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
      if (filters.status.includes(value)) {
        const newStatusFilters = filters.status.filter(
          (item) => item !== value
        );
        setFilters((prev) => ({
          ...prev,
          status: newStatusFilters,
        }));
        return;
      } else {
        const newStatusFilters = [...filters.status, value];
        setFilters((prev) => ({
          ...prev,
          status: newStatusFilters,
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
    if (columnKey === "status") {
      setFilters((prev) => ({
        ...prev,
        status: ["approved", "review", "completed"],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [columnKey]: "",
      }));
    }
    closeFilterMenu();
    closeColumnMenu();
    if (sortConfig.key === columnKey) {
      setSortConfig({ key: "score", direction: "desc" });
    }
  };

  const handleColumnVisibilityChange = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getScoreConfig = (score) => {
    if (score >= 80) return SCORE_CONFIG.high;
    if (score >= 60) return SCORE_CONFIG.medium;
    return SCORE_CONFIG.low;
  };

  const getScoreCategory = (score) => {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatStatus = (status) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleViewAgent = (opportunityId) => {
    if (!selectedProject?.id || !opportunityId) {
      toast.error("Missing project or opportunity information");
      return;
    }

    // Navigate to the opportunity assessment page
    router.push(
      `/projects/${selectedProject.id}/opportunities/${opportunityId}`
    );
  };

  const handleContactLead = (opportunity) => {
    toast.success(`Initiating contact for: ${opportunity.company}`);
    // In real app, would open contact interface
  };

  const truncateText = (text, maxLength = 60) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const data = sortedData;

  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      fontSize: "14px",
      "& fieldset": { borderColor: "#d1d5db" },
      "&:hover fieldset": { borderColor: "#a855f7" },
      "&.Mui-focused fieldset": { borderColor: "#a855f7" },
    },
  };

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 300,
        width: 200,
      },
    },
  };

  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      {/* Controls - Similar to KeywordTable */}
      <div className="flex justify-between items-center mt-1 mb-2">
        {/* Search Field */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search opportunities by company, content, or author..."
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
            width: "25vw",
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
                    score: "",
                    customer_journey: "",
                    platform: "",
                    status: ["approved", "review", "completed"],
                  });
                  setSearchTerm("");
                  setSortConfig({ key: "score", direction: "desc" });
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

      {/* Level 1 Popover - Column Menu */}
      <Popover
        {...menuProps}
        open={Boolean(anchorColumn.anchorEl)}
        anchorEl={anchorColumn.anchorEl}
        onClose={closeColumnMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPaper-root": {
            maxWidth: "140px",
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
                (filters[activeColumn] || sortConfig.key === activeColumn)
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
              size={15}
            />
            <span
              className={`text-[12px] font-normal text-gray-700 ${
                activeColumn &&
                (filters[activeColumn] || sortConfig.key === activeColumn)
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
            >
              Clear{" "}
            </span>
          </MenuItem>
        </Box>
      </Popover>

      {/* Level 2 Popover - Filter Menu */}
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
          {optionMap[activeColumn]?.map((opt) => (
            <MenuItem
              key={String(opt.val)}
              onClick={() => handleFilter(opt.val)}
              sx={{
                ...fieldStyles,
                justifyContent: "center",
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
                borderRadius: "5px",
              }}
            >
              <span
                className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${opt.color}`}
              >
                {opt.label}
              </span>
            </MenuItem>
          ))}
        </Box>
      </Popover>

      {/* Table */}
      <TableVirtuoso
        data={data}
        components={TableComponents}
        style={{ width: "100%", height: "500px", border: "1px solid black" }}
        fixedHeaderContent={() => (
          <TableRow>
            {columns
              .filter((c) => visibleColumns[c.key])
              .map((column) => (
                <TableCell
                  key={column.key}
                  align={column.key === "postPreview" ? "left" : "center"}
                  sx={{
                    cursor:
                      column.sortable || column.filterable
                        ? "pointer"
                        : "default",
                    fontWeight: 500,
                    fontSize: "12px",
                    p: "5px 8px",
                    ...column.sx,
                  }}
                  onClick={(e) => openColumnMenu(e, column.key)}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={0.5}
                  >
                    <span>{column.label}</span>
                    {(column.sortable || column.filterable) && (
                      <MdKeyboardArrowDown
                        style={{
                          cursor: "pointer",
                          width: 18,
                          height: 18,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
          </TableRow>
        )}
        itemContent={(index, row) =>
          columns
            .filter((column) => visibleColumns[column.key])
            .map((column) => {
              const { key } = column;
              switch (key) {
                case "score":
                  const scoreConfig = getScoreConfig(row.score);
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <Chip
                        label={row.score}
                        size="small"
                        sx={{
                          backgroundColor: scoreConfig.bgColor,
                          color: scoreConfig.textColor,
                          fontWeight: 600,
                          minWidth: "50px",
                        }}
                      />
                    </TableCell>
                  );

                case "customer_journey":
                  const stageConfig =
                    STAGE_CONFIG[row.customer_journey?.toLowerCase()] ||
                    STAGE_CONFIG.consider;
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <Chip
                        label={row.customer_journey || "Consider"}
                        size="small"
                        sx={{
                          backgroundColor: stageConfig.bgColor,
                          color: stageConfig.textColor,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                  );

                case "post_title":
                  return (
                    <TableCell key={key} align="left" sx={{ p: "8px 12px" }}>
                      <Tooltip title={row.post_title}>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {truncateText(row.post_title, 60)}
                          </div>
                          {row.subreddit && (
                            <div className="text-xs text-gray-500 mt-1">
                              r/{row.subreddit}
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    </TableCell>
                  );

                case "platform":
                  const platformConfig =
                    PLATFORM_CONFIG[row.platform?.toLowerCase()] ||
                    PLATFORM_CONFIG.reddit;
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <div className="flex items-center justify-center gap-2">
                        <PlatformIcon platform={row.platform} />
                        <span className="text-sm capitalize">
                          {row.platform || "Reddit"}
                        </span>
                      </div>
                    </TableCell>
                  );

                case "subreddit":
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <div className="flex flex-col items-center gap-1">
                        {row.post_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(row.post_url, "_blank");
                            }}
                            className="text-xs hover:cursor-pointer text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
                            style={{ textDecoration: "underline" }}
                          >
                            <span className="text-sm">
                              r/{row.subreddit || "N/A"}
                            </span>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  );

                case "date":
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <span className="text-sm text-gray-700">
                        {formatDate(row.date)}
                      </span>
                    </TableCell>
                  );

                case "status":
                  const statusConfig =
                    STATUS_CONFIG[row.status?.toLowerCase()] ||
                    STATUS_CONFIG.review;
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <Chip
                        label={formatStatus(row.status)}
                        size="small"
                        sx={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.textColor,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                  );

                case "owner":
                  return (
                    <TableCell key={key} align="left" sx={{ p: "8px 12px" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {row.owner?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <span className="text-sm text-gray-700">
                          {truncateText(row.owner, 15)}
                        </span>
                      </div>
                    </TableCell>
                  );

                case "recommended_action":
                  return (
                    <TableCell key={key} align="left" sx={{ p: "8px 12px" }}>
                      <Tooltip title={row.recommended_action}>
                        <span className="text-sm text-gray-600">
                          {truncateText(row.recommended_action, 50)}
                        </span>
                      </Tooltip>
                    </TableCell>
                  );

                case "upvotes":
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {row.upvotes || 0}
                        </span>
                        <span className="text-xs text-gray-500">↑</span>
                      </div>
                    </TableCell>
                  );

                case "comments_count":
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {row.comments_count || 0}
                        </span>
                        <span className="text-xs text-gray-500">💬</span>
                      </div>
                    </TableCell>
                  );

                case "engagement_score":
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {row.engagement_score || 0}
                        </div>
                      </div>
                    </TableCell>
                  );

                case "actions":
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Get the opportunity ID from the row data
                            const opportunityId =
                              row._id || row.id || row.opportunity_id;
                            handleViewAgent(opportunityId);
                          }}
                          sx={{
                            minWidth: "auto",
                            px: 1,
                            py: 0.5,
                            fontSize: "9px",
                            borderColor: "#3b82f6",
                            color: "white",
                            "&:hover": {
                              borderColor: "#2563eb",
                              backgroundColor: "#9810fa",
                            },
                          }}
                          startIcon={<Users size={8} />}
                        >
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  );

                default:
                  return (
                    <TableCell key={key} align="center" sx={{ p: "8px 12px" }}>
                      <span className="text-sm text-gray-700">{row[key]}</span>
                    </TableCell>
                  );
              }
            })
        }
      />

      {/* Results Summary */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          px: 1,
        }}
      >
        <span className="text-sm text-gray-600">
          Showing {data.length} opportunitiys
        </span>
      </Box>
    </Box>
  );
}
