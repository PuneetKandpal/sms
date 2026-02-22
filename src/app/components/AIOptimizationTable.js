"use client";
import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  Box,
  Checkbox,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  FormControlLabel,
  Popover,
  Badge,
  TableCell,
  Tooltip,
  Typography,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Paper,
  TableContainer,
} from "@mui/material";
import { MdKeyboardArrowDown } from "react-icons/md";
import { GoSearch as SearchIcon } from "react-icons/go";
import { BsViewStacked as ViewColumnIcon } from "react-icons/bs";
import {
  CheckIcon,
  FilterIcon,
  RefreshCwIcon,
  SeparatorHorizontal,
  ShieldCloseIcon,
  SortAscIcon,
  SortDescIcon,
  ExternalLink,
} from "lucide-react";
import useDebounce from "../utils/hooks/useDebounce";
import AIOptimizationTableComponent from "./AIOptimizationTableComponent";

import { useRouter } from "next/navigation";

export const AnswerCell = ({ answer, description, url }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    if (answer || description || url) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "answer-popover" : undefined;
  const hasAnswer = answer || description || url;

  return (
    <>
      <TableCell
        align="center"
        sx={{
          p: "5px 16px",
          minWidth: "150px",
          cursor: hasAnswer ? "pointer" : "default",
          "&:hover": {
            backgroundColor: hasAnswer ? "#f5f5f5" : "inherit",
          },
        }}
        onClick={hasAnswer ? handleClick : undefined}
      >
        <div className="text-[13px] font-normal font-sans text-center">
          {hasAnswer ? "View Answer" : "-"}
        </div>
      </TableCell>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 1 }}
      >
        <div className="w-[400px] max-w-[450px] min-h-[180px] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold font-sans text-center">
              Answer Details
            </span>
            <SeparatorHorizontal className="w-full h-[0.5px] bg-gray-400" />
          </div>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {answer && (
              <div>
                <span className="text-[12px] font-semibold text-gray-700">
                  Answer:
                </span>
                <p className="text-[12px] text-gray-600 mt-1">{answer}</p>
              </div>
            )}
            {description && (
              <div>
                <span className="text-[12px] font-semibold text-gray-700">
                  Description:
                </span>
                <p className="text-[12px] text-gray-600 mt-1">{description}</p>
              </div>
            )}
            {url && (
              <div>
                <span className="text-[12px] font-semibold text-gray-700">
                  URL:
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-[12px] break-words hover:text-blue-800 mt-1 block"
                >
                  {url}
                </a>
              </div>
            )}
          </div>
        </div>
      </Popover>
    </>
  );
};

export const CombinedAnswerCell = ({ row }) => {
  const router = useRouter();

  const stage = row.answer_current_stage?.toLowerCase();

  const getStatusDisplay = () => {
    if (stage === "running") {
      return { status: "Running", color: "bg-blue-100 text-blue-700" };
    }
    if (stage === "review") {
      return { status: "Review", color: "bg-yellow-100 text-yellow-700" };
    }
    if (stage === "approved") {
      return { status: "Approved", color: "bg-green-100 text-green-700" };
    }
    if (stage === "rejected") {
      return { status: "Rejected", color: "bg-red-100 text-red-700" };
    }
    return { status: "Not generated", color: "bg-gray-100 text-gray-800" };
  };

  const { status, color } = getStatusDisplay();

  const getTooltipText = () => {
    if (stage === "approved" && row.page_id) {
      return "View in Content Architecture";
    }
    if (stage === "review" && row.aio_answer_id) {
      return "View in AIO Answers";
    }
    return "No link available";
  };

  const handleLinkClick = () => {
    const projectId = row.project_id;
    
    if (stage === "approved" && row.page_id) {
      const pageId = row.page_id;
      router.push(
        `/projects/${projectId}/content-architecture?pageId=${pageId}&page_id=${pageId}&autoScroll=true`
      );
    } else if (stage === "review" && row.aio_answer_id) {
      router.push(
        `/projects/${projectId}/aio-answers?highlight=${row.aio_answer_id}&autoScroll=true`
      );
    }
  };

  const hasLink =
    (stage === "approved" && row.page_id) ||
    (stage === "review" && row.aio_answer_id);

  return (
    <TableCell align="center" sx={{ p: "5px 16px" }}>
      <div className="flex flex-col items-center gap-1">
        <span
          className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-16 justify-center ${color}`}
        >
          {status}
        </span>
        {hasLink ? (
          <Tooltip title={getTooltipText()} arrow>
            <button
              onClick={handleLinkClick}
              className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center gap-1"
            >
              View
              <ExternalLink size={12} />
            </button>
          </Tooltip>
        ) : (
          <span className="text-[13px] font-normal font-sans text-gray-500 text-xs">
            No link
          </span>
        )}
      </div>
    </TableCell>
  );
};

const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "review":
      return "bg-yellow-100 text-yellow-700";
    case "running":
      return "bg-blue-100 text-blue-700";
    case "not generated":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status) => {
  if (!status) return "";
  const foundStatus = Object.values(statusOptions).find(
    (opt) => opt.key === status.toLowerCase()
  );
  return foundStatus ? foundStatus.label : status;
};

const getTypeColor = (type) => {
  if (!type) return "bg-gray-100 text-gray-800";
  switch (type.toLowerCase()) {
    case "people_also_ask":
      return "bg-blue-100 text-blue-700";
    case "review":
    case "in progress":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const statusOptions = {
  approved: {
    key: "approved",
    label: "Approved",
    color: getStatusColor("approved"),
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    color: getStatusColor("rejected"),
  },
  review: {
    key: "review",
    label: "Review",
    color: getStatusColor("review"),
  },
  running: {
    key: "running",
    label: "Running",
    color: getStatusColor("running"),
  },
  not_generated: {
    key: "not generated",
    label: "Not generated",
    color: getStatusColor("not generated"),
  },
};

const STATIC_TYPE_OPTIONS = {
  people_also_ask: {
    key: "people_also_ask",
    label: "People Also Ask",
    color: getTypeColor("people_also_ask"),
  },
  people_also_search: {
    key: "people_also_search",
    label: "People Also Search",
    color: getTypeColor("people_also_search"),
  },
};

export default function AIOptimizationTable({
  aiOptimizationData = [],
  loading,
  onSelectionChange = () => {},
  selectedAIOptimizationRows = [],
}) {
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "requested_for",
    direction: "asc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    baseKeyword: "",
    type: "",
    status: ["approved", "review"],
  });
  const [filteredData, setFilteredData] = useState([]);
  const [isPending, startTransition] = useTransition();

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
      const newStatusFilters = filters.status.includes(value)
        ? filters.status.filter((item) => item !== value)
        : [...filters.status, value];

      setFilters((prev) => ({
        ...prev,
        status: newStatusFilters,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [activeColumn]: value,
      }));
      closeFilterMenu();
      closeColumnMenu();
    }
  };

  const clearFilter = (columnKey) => {
    if (columnKey === "status") {
      setFilters((prev) => ({
        ...prev,
        status: [],
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
      setSortConfig({ key: null, direction: null });
    }
  };

  const handleColumnVisibilityChange = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const columns = useMemo(
    () => [
      {
        key: "question_phrase",
        label: "Question Phrase",
        sortable: true,
        filterable: false,
        sx: { minWidth: "300px" },
      },
      {
        key: "requested_for",
        label: "Keyword",
        sortable: true,
        filterable: false,
        sx: { minWidth: "150px" },
      },
      {
        key: "answer",
        label: "Answer",
        sortable: false,
        filterable: false,
        sx: { minWidth: "200px" },
      },
      {
        key: "type",
        label: "Type",
        sortable: true,
        filterable: true,
        sx: { minWidth: "150px" },
      },
      {
        key: "status",
        label: "Q Approval",
        sortable: true,
        filterable: true,
        sx: { minWidth: "120px" },
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        filterable: false,
        sx: { minWidth: "150px" },
      },
      {
        key: "updated_at",
        label: "Updated At",
        sortable: true,
        filterable: false,
        sx: { minWidth: "150px" },
      },
    ],
    []
  );

  const defaultColumns = [
    "question_phrase",
    "requested_for",
    "answer",
    "type",
    "status",
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
      if (!Array.isArray(aiOptimizationData)) {
        setFilteredData([]);
        return;
      }

      const result = aiOptimizationData
        .filter((row) => {
          if (!debouncedSearchTerm) return true;
          return (
            row.requested_for
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()) ||
            row.question_phrase
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())
          );
        })
        .filter(
          (row) => !filters.requested_for || row.requested_for === filters.requested_for
        )
        .filter((row) => !filters.type || row.type === filters.type)
        .filter((row) => {
          if (filters.status.length === 0) return true;
          return filters.status.includes(row.status.toLowerCase());
        });

      setFilteredData(result);
    });
  }, [aiOptimizationData, debouncedSearchTerm, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const statusOrder = {
        approved: 1,
        review: 2,
        rejected: 3,
      };

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "status") {
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
      } else if (sortConfig.key === "created_at") {
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
      } else if (sortConfig.key === "updated_at") {
        aValue = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        bValue = b.updated_at ? new Date(b.updated_at).getTime() : 0;
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

  const selectedRowIds = useMemo(
    () => new Set(selectedAIOptimizationRows.map((row) => row.id)),
    [selectedAIOptimizationRows]
  );

  const isAllSelected =
    sortedData.length > 0 &&
    sortedData.every((row) => selectedRowIds.has(row.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...sortedData]);
    }
  };

  const handleCheckboxToggle = (row) => {
    const newSelection = [...selectedAIOptimizationRows];
    const rowId = row.id;
    const rowIndex = newSelection.findIndex(
      (selectedRow) => selectedRow.id === rowId
    );

    if (rowIndex > -1) {
      newSelection.splice(rowIndex, 1);
    } else {
      newSelection.push(row);
    }
    onSelectionChange(newSelection);
  };

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

  const requestedForOptions = useMemo(() => {
    const uniqueRequestedFor = [
      ...new Set(
        aiOptimizationData.map((item) => item.requested_for).filter(Boolean)
      ),
    ];
    return uniqueRequestedFor.map((requestedFor) => ({
      val: requestedFor,
      label: requestedFor,
    }));
  }, [aiOptimizationData]);

  // Dynamic type options based on API data
  const typeFilterOptions = useMemo(() => {
    const uniqueTypes = [
      ...new Set(aiOptimizationData.map((item) => item.type).filter(Boolean)),
    ];

    return uniqueTypes.map((type) => {
      const key = String(type).toLowerCase();
      const base = STATIC_TYPE_OPTIONS[key];

      if (base) {
        return {
          val: base.key,
          label: base.label,
          color: base.color,
        };
      }

      const label = String(type)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        val: type,
        label,
        color: getTypeColor(type),
      };
    });
  }, [aiOptimizationData]);

  const optionMap = {
    status: Object.values(statusOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    type: typeFilterOptions,
    requestedFor: requestedForOptions,
  };

  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1, overflowX: "auto" }}>
      <div className="flex justify-between items-center mt-1 mb-2 min-w-[1000px]">
        {/* Search Field */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by keyword or question..."
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
            badgeContent={
              Object.values(filters).filter((f) =>
                Array.isArray(f) ? f.length > 0 : f
              ).length
            }
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
                    baseKeyword: "",
                    type: "",
                    status: ["approved", "review"],
                  });
                  setSearchTerm("");
                  setSortConfig({ key: "requested_for", direction: "asc" });
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
              className={`text-[12px] font-normal ${
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
        <Box sx={{ p: 0, display: "flex", flexDirection: "column", m: 1 }}>
          {optionMap[activeColumn]?.map((opt) => (
            <MenuItem
              key={String(opt.val)}
              onClick={() => handleFilter(opt.val)}
              sx={{
                ...fieldStyles,
                justifyContent: "center",
                textTransform: "none",
                backgroundColor:
                  (filters[activeColumn] &&
                    filters[activeColumn].includes(opt.val)) ||
                  filters[activeColumn] === opt.val
                    ? "#e5e7eb"
                    : "white",
                border: `1px solid ${
                  (filters[activeColumn] &&
                    filters[activeColumn].includes(opt.val)) ||
                  filters[activeColumn] === opt.val
                    ? "#9810fa"
                    : "white"
                }`,
                borderRadius: "5px",
              }}
            >
              {opt.icon ? (
                <span className="text-[12px] font-normal text-gray-700 flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
              ) : (
                <span
                  className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${
                    opt.color || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {opt.label}
                </span>
              )}
            </MenuItem>
          ))}
        </Box>
      </Popover>

      {loading ? (
        <div className="min-w-[1000px]">
          <AIOptimizationTableSkeleton
            columns={columns}
            visibleColumns={visibleColumns}
            rowsCount={10}
          />
        </div>
      ) : (
        <div className="min-w-[1000px]">
          <AIOptimizationTableComponent
            columns={columns}
            sortedData={sortedData}
            visibleColumns={visibleColumns}
            isAllSelected={isAllSelected}
            selectedRowIds={selectedRowIds}
            handleSelectAll={handleSelectAll}
            handleCheckboxToggle={handleCheckboxToggle}
            openColumnMenu={openColumnMenu}
            getTypeColor={getTypeColor}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            onSelectionChange={onSelectionChange}
            firstSelectedId={selectedAIOptimizationRows?.[0]?.id}
          />
        </div>
      )}
      <div className="flex justify-between items-center mt-2 min-w-[1000px]">
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
 * AIOptimizationTableSkeleton renders a shimmer UI skeleton for the AIOptimizationTable component.
 */
function AIOptimizationTableSkeleton({
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
                    align={column.key === "question_phrase" ? "left" : "center"}
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
                      ...column.sx,
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      justifyContent={
                        column.key === "question_phrase"
                          ? "flex-start"
                          : "center"
                      }
                    >
                      {column.key === "question_phrase" && (
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
                      align={col.key === "question_phrase" ? "left" : "center"}
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
