"use client";
import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Skeleton,
  Badge,
  Tooltip,
  Modal,
} from "@mui/material";
import { GoSearch as SearchIcon } from "react-icons/go";
import { BsViewStacked as ViewColumnIcon } from "react-icons/bs";
import toast from "react-hot-toast";
import {
  CheckIcon,
  FilterIcon,
  RefreshCwIcon,
  ShieldCloseIcon,
  SortAscIcon,
  SortDescIcon,
  XIcon,
  SeparatorHorizontal,
  Copy,
  Text,
  Send,
  ExternalLink,
} from "lucide-react";
import useDebounce from "../utils/hooks/useDebounce";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ArticlesTableComponent from "./ArticlesTableComponent";
import { formatLocalDateTime } from "../../utils/dateUtils";

// Modal Style - Notion-like clean design
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95vw",
  maxWidth: "1000px",
  height: "95vh",
  bgcolor: "#ffffff",
  boxShadow:
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
};

const ArticleContentModal = ({ open, handleClose, article }) => {
  if (!article) return null;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(article.generated_content || "");
    toast.success("Markdown copied to clipboard");
  };

  const handleCopyPlainText = () => {
    const plainText = (article.generated_content || "")
      .replace(/<[^>]*>/g, "")
      .replace(/!\[.*\]\(.*\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[#*_`~>]/g, "")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
    navigator.clipboard.writeText(plainText);
    toast.success("Plain text copied to clipboard");
  };

  const handlePublish = () => {
    toast.success("Publish functionality coming soon!");
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      }}
    >
      <Box sx={modalStyle}>
        {/* Header with floating controls */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 mb-1 leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  Article
                </span>
                <span>•</span>
                <span>Marketing Team</span>
                <span>•</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getStageColor(
                    article.stage
                  )}`}
                >
                  {getStageLabel(article.stage)}
                </span>
                <span>•</span>
                <span>
                  <div className="text-sm text-gray-500">
                    Last updated{" "}
                    {formatLocalDateTime(
                      article.updatedAt || article.createdAt
                    )}
                  </div>
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-4">
              <div className="w-px h-6 bg-gray-200 mx-1"></div>

              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content area with Notion-like styling */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="prose prose-lg prose-gray max-w-none">
              <style jsx global>{`
                .prose {
                  color: #374151;
                  line-height: 1.75;
                }
                .prose h1 {
                  color: #111827;
                  font-weight: 700;
                  font-size: 2.25rem;
                  line-height: 1.2;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .prose h2 {
                  color: #111827;
                  font-weight: 600;
                  font-size: 1.875rem;
                  line-height: 1.3;
                  margin-top: 2rem;
                  margin-bottom: 0.75rem;
                }
                .prose h3 {
                  color: #111827;
                  font-weight: 600;
                  font-size: 1.5rem;
                  line-height: 1.4;
                  margin-top: 1.5rem;
                  margin-bottom: 0.5rem;
                }
                .prose p {
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                  color: #374151;
                }
                .prose ul,
                .prose ol {
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                  padding-left: 1.5rem;
                }
                .prose li {
                  margin-top: 0.5rem;
                  margin-bottom: 0.5rem;
                  color: #374151;
                }
                .prose blockquote {
                  border-left: 4px solid #e5e7eb;
                  padding-left: 1rem;
                  margin: 1.5rem 0;
                  font-style: italic;
                  color: #6b7280;
                  background-color: #f9fafb;
                  padding: 1rem;
                  border-radius: 0.5rem;
                }
                .prose code {
                  background-color: #f3f4f6;
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-size: 0.875em;
                  color: #dc2626;
                  font-weight: 500;
                }
                .prose pre {
                  background-color: #1f2937;
                  color: #f9fafb;
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                  margin: 1.5rem 0;
                }
                .prose pre code {
                  background-color: transparent;
                  color: inherit;
                  padding: 0;
                }
                .prose strong {
                  color: #111827;
                  font-weight: 600;
                }
                .prose a {
                  color: #3b82f6;
                  text-decoration: none;
                  font-weight: 500;
                }
                .prose a:hover {
                  color: #2563eb;
                  text-decoration: underline;
                }
                .prose table {
                  border-collapse: collapse;
                  margin: 1.5rem 0;
                  width: 100%;
                }
                .prose th,
                .prose td {
                  border: 1px solid #e5e7eb;
                  padding: 0.75rem;
                  text-align: left;
                }
                .prose th {
                  background-color: #f9fafb;
                  font-weight: 600;
                  color: #111827;
                }
                .prose hr {
                  border: none;
                  height: 1px;
                  background-color: #e5e7eb;
                  margin: 2rem 0;
                }
              `}</style>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.generated_content || "No content available"}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer with publish action */}
        <div className="bg-gray-50/80 backdrop-blur-md border-t border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className=" cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150"
              >
                <Copy className="w-4 h-4" />
                Copy Markdown
              </button>

              <button
                onClick={handleCopyPlainText}
                className=" cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150"
              >
                <Text className="w-4 h-4" />
                Copy Text
              </button>
            </div>
            <button
              onClick={handlePublish}
              className=" cursor-pointer group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-150"
            >
              Publish Article
              <Send className="w-4 h-4  transition-transform duration-300 group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
            </button>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

// Array cell components similar to TopicsTable
export const ArrayCell = ({ items, title }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? `array-popover-${title}` : undefined;

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
                <div
                  key={index}
                  className="text-[12px] text-gray-700 break-words"
                >
                  {typeof item === "object" ? (
                    <div>
                      <strong>{item.name || "Item"}:</strong>{" "}
                      {Array.isArray(item.pains) ? item.pains.join(", ") : ""}
                    </div>
                  ) : (
                    item
                  )}
                </div>
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

export const OverviewCell = ({ text }) => {
  return (
    <TableCell
      align="left"
      sx={{
        p: "5px 16px",
        whiteSpace: "normal",
        wordBreak: "break-word",
        maxWidth: "250px",
      }}
    >
      <Tooltip title={text || "No overview available"} placement="top" arrow>
        <p className="text-[13px] font-normal font-sans truncate">
          {text || "-"}
        </p>
      </Tooltip>
    </TableCell>
  );
};

const getStatusColor = (status) => {
  if (!status) return "bg-slate-100 text-slate-800";
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
      return "bg-blue-100 text-blue-700";
    case "rejected":
      return "bg-orange-100 text-orange-700";
    case "review":
    case "in progress":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const getStatusLabel = (status) => {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStageColor = (stage) => {
  if (!stage) return "bg-yellow-100 text-yellow-700";
  switch (stage.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "review":
    case "review":
    case "review":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const getStageLabel = (stage) => {
  if (!stage) return "In Review";
  switch (stage.toLowerCase()) {
    case "review":
      return "Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
};

const getContentTypeColor = (type) => {
  if (!type) return "bg-gray-100 text-gray-800";
  const typeLower = type.toLowerCase();
  if (typeLower.includes("authoritative")) return "bg-blue-100 text-blue-700";
  if (typeLower.includes("friendly")) return "bg-purple-100 text-purple-700";
  if (typeLower.includes("professional"))
    return "bg-indigo-100 text-indigo-700";
  return "bg-gray-100 text-gray-800";
};

const statusOptions = {
  completed: {
    key: "completed",
    label: "Completed",
    color: getStatusColor("completed"),
  },
  "in progress": {
    key: "in progress",
    label: "In Progress",
    color: getStatusColor("in progress"),
  },
  draft: {
    key: "draft",
    label: "Draft",
    color: getStatusColor("draft"),
  },
};

const stageOptions = {
  approved: {
    key: "approved",
    label: "Approved",
    color: getStageColor("approved"),
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    color: getStageColor("rejected"),
  },
  review: {
    key: "review",
    label: "Review",
    color: getStageColor("review"),
  },
};

const contentTypeOptions = {
  Authoritative: {
    key: "Authoritative",
    label: "Authoritative",
    color: getContentTypeColor("authoritative"),
  },
  Friendly: {
    key: "Friendly",
    label: "Friendly",
    color: getContentTypeColor("friendly"),
  },
  Professional: {
    key: "Professional",
    label: "Professional",
    color: getContentTypeColor("professional"),
  },
};

export default function ArticlesTable({
  articleData = [],
  loading,
  onSelectionChange = () => {},
  selectedArticleRows = [],
  projectId,
}) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "title",
    direction: "asc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    status: [],
    stage: ["approved", "review"],
    companyName: "",
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

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const openColumnMenu = (e, columnKey) => {
    e.stopPropagation();
    setActiveColumn(columnKey);
    const column = columns.find((col) => col.key === columnKey);
    if (column && (column.sortable || column.filterable))
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
    } else if (activeColumn === "stage") {
      const newStageFilters = filters.stage.includes(value)
        ? filters.stage.filter((item) => item !== value)
        : [...filters.stage, value];

      setFilters((prev) => ({
        ...prev,
        stage: newStageFilters,
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
    } else if (columnKey === "stage") {
      setFilters((prev) => ({
        ...prev,
        stage: [],
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

  const handleActionClick = (article) => {
    if (article.status.toLowerCase() !== "completed") {
      toast.error("Article is not yet generated. Please wait for sometime.");
      return;
    }

    setSelectedArticle(article);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedArticle(null);
  };

  const handleOpenContentArchitecture = (article) => {
    if (!projectId) {
      toast.error("Project context missing. Please select a project.");
      return;
    }

    if (!article?.page_id) {
      toast.error("This article is not linked to a Content Architecture page yet.");
      return;
    }

    router.push(
      `/projects/${projectId}/content-architecture?caTab=overview&pageId=${article.page_id}&autoScroll=true`
    );
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Title",
        sortable: true,
        filterable: false,
        sx: { minWidth: "25vw" },
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        filterable: false,
        sx: { minWidth: "15vw" },
      },
      {
        key: "content_architecture",
        label: "Content Architecture",
        sortable: false,
        filterable: false,
        sx: { maxWidth: "10vw" },
      },
      {
        key: "target_customers",
        label: "Target Customers",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "target_markets",
        label: "Target Markets",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "key_differentiators",
        label: "Key Differentiators",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "additional_keywords",
        label: "Additional Keywords",
        sortable: false,
        filterable: false,
        sx: { width: "10vw" },
      },
      {
        key: "status",
        label: "Processing",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "8vw" },
      },
      {
        key: "stage",
        label: "Approval",
        sortable: true,
        filterable: true,
        sx: { maxWidth: "8vw" },
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
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        sx: { maxWidth: "8vw" },
      },
    ],
    []
  );

  const defaultColumns = [
    "title",
    "description",
    "content_architecture",
    "type",
    "status",
    "stage",
    "company_name",
    "createdAt",
    "actions",
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
      if (!Array.isArray(articleData)) {
        setFilteredData([]);
        return;
      }

      const result = articleData
        .filter((row) => {
          if (!debouncedSearchTerm) return true;
          return (
            row.title
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()) ||
            row.description
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())
          );
        })
        .filter((row) => !filters.type || row.type === filters.type)
        .filter(
          (row) =>
            !filters.companyName || row.company_name === filters.companyName
        )
        .filter((row) => {
          if (filters.status.length === 0) return true;
          const rowStatus = row.status?.toLowerCase() || "draft";
          return filters.status.includes(rowStatus);
        })
        .filter((row) => {
          if (filters.stage.length === 0) return true;
          const rowStage = row.stage?.toLowerCase() || "review";
          return filters.stage.includes(rowStage);
        });

      setFilteredData(result);
    });
  }, [articleData, debouncedSearchTerm, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const statusOrder = {
        completed: 1,
        "in progress": 2,
        draft: 3,
      };

      const stageOrder = {
        approved: 1,
        review: 2,
        rejected: 3,
      };

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "status") {
        aValue = statusOrder[a.status?.toLowerCase() || "draft"] || 0;
        bValue = statusOrder[b.status?.toLowerCase() || "draft"] || 0;
      } else if (sortConfig.key === "stage") {
        aValue = stageOrder[a.stage?.toLowerCase() || "review"] || 0;
        bValue = stageOrder[b.stage?.toLowerCase() || "review"] || 0;
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
    () => new Set(selectedArticleRows.map((row) => row.id)),
    [selectedArticleRows]
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
    const newSelection = [...selectedArticleRows];
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

  const companyNameOptions = useMemo(() => {
    const uniqueCompanies = [
      ...new Set(articleData.map((item) => item.company_name).filter(Boolean)),
    ];
    return uniqueCompanies.map((company) => ({
      val: company,
      label: company,
    }));
  }, [articleData]);

  const pageGeneratedOptions = [];

  const optionMap = {
    status: Object.values(statusOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    stage: Object.values(stageOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    type: Object.values(contentTypeOptions).map((v) => ({
      val: v.key,
      label: v.label,
      color: v.color,
    })),
    companyName: companyNameOptions,
  };

  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      <div className="flex justify-between items-center mt-1 mb-2">
        {/* Search Field */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by title & description..."
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
                    type: "",
                    status: [],
                    stage: ["approved", "review"],
                    companyName: "",
                  });
                  setSearchTerm("");
                  setSortConfig({ key: "title", direction: "asc" });
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
        <ArticlesTableSkeleton
          columns={columns}
          visibleColumns={visibleColumns}
          rowsCount={10}
        />
      ) : (
        <ArticlesTableComponent
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
          getStageColor={getStageColor}
          getStageLabel={getStageLabel}
          onActionClick={handleActionClick}
          ArrayCell={ArrayCell}
          OverviewCell={OverviewCell}
          onOpenContentArchitecture={handleOpenContentArchitecture}
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

      <ArticleContentModal
        open={modalOpen}
        handleClose={handleCloseModal}
        article={selectedArticle}
      />
    </Box>
  );
}

/**
 * ArticlesTableSkeleton renders a shimmer UI skeleton for the ArticlesTable component.
 */
function ArticlesTableSkeleton({ columns, visibleColumns, rowsCount = 10 }) {
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
                    key={column.key}
                    align={column.key === "title" ? "left" : "center"}
                    sx={{
                      fontWeight: 500,
                      fontSize: "12px",
                      p: "10px 16px",
                      backgroundColor: "white",
                      borderBottom: "1px solid black",
                      ...column.sx,
                    }}
                  >
                    <Skeleton variant="text" width="80%" />
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
                      align={col.key === "title" ? "left" : "center"}
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
