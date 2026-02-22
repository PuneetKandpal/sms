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
} from "@mui/material";
import { MdKeyboardArrowDown, MdExpandMore } from "react-icons/md";
import { GoSearch as SearchIcon } from "react-icons/go";
import { BsViewStacked as ViewColumnIcon } from "react-icons/bs";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  CheckIcon,
  FilterIcon,
  RefreshCwIcon,
  SeparatorHorizontal,
  ShieldCloseIcon,
  SortAscIcon,
  SortDescIcon,
} from "lucide-react";
import useDebounce from "../utils/hooks/useDebounce";
import TopicsTableComponent from "./TopicsTableComponent";

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

const getContentTypeColor = (type) => {
  if (!type) return "bg-gray-100 text-gray-800";
  switch (type.toLowerCase()) {
    case "tofu":
      return "bg-blue-100 text-blue-700";
    case "mofu":
    case "in progress":
      return "bg-sky-100 text-sky-700";
    case "bofu":
      return "bg-indigo-100 text-indigo-700";
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

const contentTypeOptions = {
  TOFU: { key: "TOFU", label: "TOFU", color: getContentTypeColor("tofu") },
  MOFU: { key: "MOFU", label: "MOFU", color: getContentTypeColor("mofu") },
  MIDF: { key: "MIDF", label: "MIDF", color: getContentTypeColor("midf") },
  BOFU: { key: "BOFU", label: "BOFU", color: getContentTypeColor("bofu") },
};

export const SourcesCell = ({ items, title }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? `sources-popover-${title}` : undefined;

  return (
    <>
      <TableCell
        align="center"
        sx={{
          p: "5px 16px",
          minWidth: "150px",
          cursor: items && items.length > 0 ? "pointer" : "default",
          "&:hover": {
            backgroundColor: items && items.length > 0 ? "#f5f5f5" : "inherit",
          },
        }}
        onClick={items && items.length > 0 ? handleClick : undefined}
      >
        <div className="text-[13px] font-normal font-sans text-center">
          {items && items.length > 0 ? `${items.length} source(s)` : "-"}
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
        <div className="w-[350px] max-w-[400px] min-h-[180px] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold font-sans text-center">
              {title}
            </span>
            <SeparatorHorizontal className="w-full h-[0.5px] bg-gray-400" />
          </div>
          {items && items.length > 0 ? (
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-[12px] break-words hover:text-blue-800"
                >
                  {item}
                </a>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-gray-500 text-center font-sans">
              No items available
            </span>
          )}
        </div>
      </Popover>
    </>
  );
};

export const RelatedDataCell = ({ items }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "related-data-popover" : undefined;

  return (
    <>
      <TableCell
        align="center"
        sx={{
          p: "5px 16px",
          minWidth: "150px",
          cursor: items && items.length > 0 ? "pointer" : "default",
          "&:hover": {
            backgroundColor: items && items.length > 0 ? "#f5f5f5" : "inherit",
          },
        }}
        onClick={items && items.length > 0 ? handleClick : undefined}
      >
        <div className="text-[13px] font-normal font-sans text-center">
          {items && items.length > 0 ? `${items.length} item(s)` : "-"}
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
        <div className="w-[250px] max-w-[300px] min-h-[180px] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold font-sans text-center">
              Related Data
            </span>
            <SeparatorHorizontal className="w-full h-[0.5px] bg-gray-400" />
          </div>
          {items && items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <span
                  key={index}
                  className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-gray-500 text-center font-sans">
              No items available
            </span>
          )}
        </div>
      </Popover>
    </>
  );
};

export const OverviewCell = ({ text, lines = 3, maxWidth = 250 }) => {
  return (
    <TableCell
      align="left"
      sx={{
        p: "5px 16px",
        whiteSpace: "normal",
        wordBreak: "break-word",
        maxWidth,
      }}
    >
      <Tooltip title={text || "No overview available"} placement="top" arrow>
        <p
          className="text-[13px] font-normal font-sans"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {text || "-"}
        </p>
      </Tooltip>
    </TableCell>
  );
};

export default function TopicsTable({
  topicData = [],
  loading,
  onSelectionChange = () => {},
  selectedTopicRows = [],
}) {
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "main_topic",
    direction: "asc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    mainTopic: "",
    topic_type: "",
    status: ["approved", "review"],
    article_status: [],
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
    if (activeColumn === "status" || activeColumn === "article_status") {
      const newStatusFilters = filters[activeColumn].includes(value)
        ? filters[activeColumn].filter((item) => item !== value)
        : [...filters[activeColumn], value];

      setFilters((prev) => ({
        ...prev,
        [activeColumn]: newStatusFilters,
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
    if (columnKey === "status" || columnKey === "article_status") {
      setFilters((prev) => ({
        ...prev,
        [columnKey]: [],
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
        key: "sub_topic",
        label: "Article Topic",
        sortable: true,
        filterable: false,
        sx: { minWidth: "15vw" },
      },
      {
        key: "sub_topic_overview",
        label: "Article Brief",
        sortable: false,
        filterable: false,
        sx: { minWidth: "24vw" },
      },
      {
        key: "main_topic",
        label: "Cluster Topic",
        sortable: true,
        filterable: false,
        sx: { minWidth: "10vw" },
      },
      {
        key: "main_topic_overview",
        label: "Main Topic Overview",
        sortable: false,
        filterable: false,
        sx: { minWidth: "15vw" },
      },

      {
        key: "topic_type",
        label: "Funnel Stage",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "8vw" },
      },
      {
        key: "status",
        label: "Topic Status",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "8vw" },
      },
      {
        key: "article_status",
        label: "Article Status",
        sortable: true,
        filterable: true,
        sx: { minWidth: "9vw", maxWidth: "10vw" },
      },
      {
        key: "topic_sources",
        label: "Topic Sources",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "sub_topic_sources",
        label: "Sub-Topic Sources",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "related_data",
        label: "Related Data",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        filterable: false,
        sx: { minWidth: "10vw" },
      },
      {
        key: "updatedAt",
        label: "Updated At",
        sortable: true,
        filterable: false,
        sx: { minWidth: "10vw" },
      },
    ],
    []
  );

  const defaultColumns = [
    "sub_topic",
    "sub_topic_overview",
    "main_topic",
    "topic_type",
    "status",
    "article_status",
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
      if (!Array.isArray(topicData)) {
        setFilteredData([]);
        return;
      }

      const result = topicData
        .filter((row) => {
          if (!debouncedSearchTerm) return true;
          return (
            row.main_topic
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()) ||
            row.sub_topic
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())
          );
        })
        .filter(
          (row) => !filters.mainTopic || row.main_topic === filters.mainTopic
        )
        .filter(
          (row) => !filters.topic_type || row.topic_type === filters.topic_type
        )
        .filter((row) => {
          if (filters.status.length === 0) return true;
          return filters.status.includes(row.status.toLowerCase());
        })
        .filter((row) => {
          if (filters.article_status.length === 0) return true;
          return filters.article_status.includes(
            row.article_status?.toLowerCase()
          );
        });

      setFilteredData(result);
    });
  }, [topicData, debouncedSearchTerm, filters]);

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
      } else if (sortConfig.key === "createdAt") {
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (sortConfig.key === "updatedAt") {
        aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
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
    () => new Set(selectedTopicRows.map((row) => row.id)),
    [selectedTopicRows]
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
    const newSelection = [...selectedTopicRows];
    const rowIndex = newSelection.findIndex(
      (selectedRow) => selectedRow.id === row.id
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

  const mainTopicOptions = useMemo(() => {
    const uniqueMainTopics = [
      ...new Set(topicData.map((item) => item.main_topic).filter(Boolean)),
    ];
    return uniqueMainTopics.map((topic) => ({
      val: topic,
      label: topic,
    }));
  }, [topicData]);

  const optionMap = {
    status: Object.values(statusOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    article_status: Object.values(statusOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    topic_type: Object.values(contentTypeOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    mainTopic: mainTopicOptions,
  };

  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      <div className="flex justify-between items-center mt-1 mb-2">
        {/* Search Field + Guidance */}
        <div className="flex items-center gap-3 min-w-0">
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by topic..."
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
              flexShrink: 0,
            }}
          />
          <span className="text-[12px] text-gray-500 truncate max-w-[52vw]">
            Review the generated topics. Approve the ones you want; then select a topic and create an article.
          </span>
        </div>
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
                    mainTopic: "",
                    topic_type: "",
                    status: [],
                    article_status: [],
                  });
                  setSearchTerm("");
                  setSortConfig({ key: "main_topic", direction: "asc" });
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
                            "&.Mui-checked": {
                              color: "#0284c7", // primary when checked
                            },
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
        <TopicsTableSkeleton
          columns={columns}
          visibleColumns={visibleColumns}
          rowsCount={10}
        />
      ) : sortedData.length === 0 ? (
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{
            borderRadius: "8px",
            border: "1px solid black",
            maxHeight: "calc(100vh - 250px)",
            overflow: "hidden",
          }}
        >
          <Table size="small" sx={{ borderCollapse: "separate", width: "100%" }}>
            <TableHead
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                boxShadow: "0px 0.2px 0px 0px black",
                backgroundColor: "white",
              }}
            >
              <TableRow>
                {columns
                  .filter((c) => visibleColumns[c.key])
                  .map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.key === "sub_topic" ? "left" : "center"}
                      sx={{
                        fontWeight: 500,
                        fontSize: "10px",
                        p: "5px 8px",
                        ...column.sx,
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        justifyContent={
                          column.key === "sub_topic" ? "flex-start" : "center"
                        }
                      >
                        {column.key === "sub_topic" && (
                          <Checkbox
                            size="small"
                            disableRipple
                            checked={false}
                            icon={
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "6px",
                                  backgroundColor: "#e5e7eb",
                                  border: "0.5px solid #d1d5dc",
                                }}
                              />
                            }
                          />
                        )}
                        <span className="text-[13px] font-medium">
                          {column.label}
                        </span>
                        {(column.sortable || column.filterable) && (
                          <MdKeyboardArrowDown
                            style={{ width: 18, height: 18, cursor: "default" }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={columns.filter((c) => visibleColumns[c.key]).length}
                  align="center"
                  sx={{
                    height: "calc(100vh - 320px)",
                    color: "#6B7280",
                    fontSize: "14px",
                  }}
                >
                  add core ideas to generate topics from them
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TopicsTableComponent
          columns={columns}
          sortedData={sortedData}
          visibleColumns={visibleColumns}
          isAllSelected={isAllSelected}
          selectedRowIds={selectedRowIds}
          handleSelectAll={handleSelectAll}
          handleCheckboxToggle={handleCheckboxToggle}
          openColumnMenu={openColumnMenu}
          getContentTypeColor={getContentTypeColor}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          onSelectionChange={onSelectionChange}
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
 * TopicsTableSkeleton renders a shimmer UI skeleton for the TopicsTable component.
 *
 * Props:
 *  - columns: Array<{ key: string; label: string; sortable?: boolean }>;
 *  - visibleColumns: Record<string, boolean>;
 *  - rowsCount: number;
 */
function TopicsTableSkeleton({
  columns,
  visibleColumns,
  rowsCount = 10,
  tableHeight = "calc(100vh - 250px)",
}) {
  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      {/* Top controls skeleton */}
      <div className="flex justify-between items-center mt-1 mb-2">
        <div className="h-10 w-[240px] rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-full border border-gray-200 bg-white shadow-sm animate-pulse" />
          <div className="h-9 w-24 rounded-full border border-gray-200 bg-white shadow-sm animate-pulse" />
        </div>
      </div>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "8px",
          border: "1px solid black",
          backgroundColor: "white",
          overflow: "hidden",
          height: tableHeight,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns
                .filter((c) => visibleColumns[c.key])
                .map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.key === "sub_topic" ? "left" : "center"}
                    sx={{
                      cursor: column.sortable ? "pointer" : "default",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: "#0F172A",
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      p: "5px 8px",
                      backgroundColor: "white",
                      boxShadow: "0px 0.2px 0px 0px black",
                      ...column.sx,
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      justifyContent={
                        column.key === "sub_topic" ? "flex-start" : "center"
                      }
                    >
                      {column.key === "sub_topic" && (
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
                                border: "0.5px solid #d1d5dc",
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
                      <span className="text-[13px] font-medium text-gray-700">
                        {column.label}
                      </span>
                      {column.sortable && (
                        <MdKeyboardArrowDown
                          className="text-gray-400"
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
              <TableRow
                key={idx}
                sx={{
                  "&:last-of-type td": { borderBottom: "none" },
                }}
              >
                {columns
                  .filter((col) => visibleColumns[col.key])
                  .map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.key === "main_topic" ? "left" : "center"}
                      sx={{
                        p: "12px 16px",
                        backgroundColor: "white",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Skeleton
                        variant="rounded"
                        width="100%"
                        height={20}
                        sx={{ bgcolor: "#E2E8F0" }}
                      />
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
