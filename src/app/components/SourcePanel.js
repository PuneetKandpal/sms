"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatLocalDate } from "../../utils/dateUtils";
import { useSelection } from "../context/SelectionContext";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import api from "../../api/axios";
import {
  FaEdit,
  FaEllipsisV,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  AddKeywordModal,
  createProgressSimulation,
  DeleteConfirmModal,
  ProcessingStatusModal,
  ProductLinkConfirmModal,
  RenameModal,
  TextModal,
} from "./SourceModals";
import { FiSidebar } from "react-icons/fi";
import toast from "react-hot-toast";
import { PulseLoader } from "react-spinners";
import {
  Autocomplete,
  Box,
  Button,
  Popper,
  styled,
  TextField,
  Typography,
} from "@mui/material";

const SourcesPanel = ({
  isCollapsed,
  setIsCollapsed,
  domainId,
  componentId,
  setSources,
  sources,
  onSourceAdded,
  fetchKeywords,
  selectedKeywordRows,
  setSelectedKeywordRows,
  onStatusUpdate,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [fileProgress, setFileProgress] = useState(0);
  const [fileStatusText, setFileStatusText] = useState("Processing file...");
  const [showFileProgress, setShowFileProgress] = useState(false);
  const [showText, setShowText] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sourcePanel, setSourcePanel] = useState([]);
  const [renamingSource, setRenamingSource] = useState(null);
  const [showRename, setShowRename] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSource, setDeletingSource] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [showAIOptimizationLoader, setShowAIOptimizationLoader] =
    useState(false);
  const [isExpandingPrimary, setIsExpandingPrimary] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductLinkConfirm, setShowProductLinkConfirm] = useState(false);
  const [isLinkingProduct, setIsLinkingProduct] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
  });

  const { selectedProject } = useSelection();
  const { refreshTasks, setIsDrawerOpen, instantRefreshAfterTaskStart } =
    useTaskMonitor();

  const fetchSourceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/project-sources/?projectId=${selectedProject?.id}`
      );
      const data = response.data;
      setSourcePanel(data?.sources);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch keywords"
      );
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    const fd = new FormData();
    fd.append("project_id", selectedProject?.id);
    fd.append("component_id", componentId);
    fd.append("domain_id", domainId);
    fd.append("file", file);

    try {
      setShowAdd(false);
      setIsUploading(true);
      setUploadingFileName(file.name);
      setShowFileProgress(true);
      setFileProgress(0);
      setFileStatusText("Uploading file...");

      const { config, updateInterval, totalUpdates } =
        createProgressSimulation("file");
      let currentUpdate = 0;

      const progressInterval = setInterval(() => {
        currentUpdate++;
        const baseProgress = (currentUpdate / totalUpdates) * 100;

        let newProgress = 0;
        let currentText = "Uploading file...";

        for (let i = 0; i < config.stages.length; i++) {
          const stage = config.stages[i];
          const prevThreshold = i > 0 ? config.stages[i - 1].threshold : 0;

          if (baseProgress <= stage.threshold) {
            const stageProgress =
              ((baseProgress - prevThreshold) /
                (stage.threshold - prevThreshold)) *
              100;
            newProgress =
              prevThreshold +
              (stageProgress *
                stage.multiplier *
                (stage.threshold - prevThreshold)) /
                100;
            currentText = stage.text;
            break;
          }
        }

        setFileProgress(Math.min(newProgress, 99));
        setFileStatusText(currentText);

        if (currentUpdate >= totalUpdates) {
          clearInterval(progressInterval);
        }
      }, updateInterval);

      // ✅ Send file
      const response = await api.post("/keyword-api/upload/file", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);

      const d = response.data;

      setFileProgress(100);
      setFileStatusText("File processed successfully!");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onSourceAdded) await onSourceAdded();
      await fetchSourceData();
      await fetchKeywords();

      setShowFileProgress(false);
      setIsUploading(false);
      setUploadingFileName("");
      setFileProgress(0);
      setFileStatusText("Processing file...");

      setCustomMessage(d?.message || "File added");
      setShowMessagePopup(true);
      setTimeout(() => setShowMessagePopup(false), 10000);
    } catch (e) {
      console.error("File upload error:", e);
      let errorMessage = "Upload failed";

      if (e.message && e.message !== "Upload failed") {
        try {
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);

      setShowFileProgress(false);
      setIsUploading(false);
      setUploadingFileName("");
      setFileProgress(0);
      setFileStatusText("Processing file...");
    }
  };

  const handleAddSource = async (newSource) => {
    if (newSource.source_type !== "website") {
      setSources((prev) => [newSource, ...prev]);
    }

    if (
      onSourceAdded &&
      (newSource.source_type === "website" ||
        newSource.source_type === "manual")
    ) {
      if (newSource.source_type === "website") {
        setTimeout(async () => {
          await onSourceAdded();
        }, 1000);
      } else {
        await onSourceAdded();
      }
    }

    // Close the add sources modal when a source is added
    setShowAdd(false);
  };

  useEffect(() => {
    if (selectedProject?.id) {
      fetchSourceData();
      fetchProducts();
    }
  }, [selectedProject]);

  const fetchProducts = async () => {
    if (!selectedProject?.id) return;

    try {
      setIsLoadingProducts(true);
      const response = await api.get(
        `/keyword-api/products-services/?projectId=${selectedProject?.id}`
      );

      const data = response.data;
      setProducts(data.products_services || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch products & services"
      );
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleFileCancel = () => {
    setIsUploading(false);
    setUploadingFileName("");
    setShowFileProgress(false);
    setFileProgress(0);
    setFileStatusText("Processing file...");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRenameClick = (source) => {
    setRenamingSource(source);
    setShowRename(true);
    setMenuId(null);
  };

  const handleDeleteClick = (source) => {
    setDeletingSource(source);
    setShowDeleteConfirm(true);
    setMenuId(null);
  };

  function getSourceId(source) {
    return source.id || source.source_id;
  }

  const handleRename = async (source, newName) => {
    const sourceId = getSourceId(source);
    const projectId = selectedProject?.id || source?.project_id;

    if (!sourceId) {
      toast.error("Unable to rename: missing source id");
      return;
    }

    if (!projectId) {
      toast.error("Unable to rename: missing project id");
      return;
    }

    setIsRenaming(true);
    try {
      await api.put(`/api/source-update-delete/${sourceId}`, {
        file_name: newName,
        project_id: projectId,
      });
      setSources((prev) =>
        prev.map((s) =>
          getSourceId(s) === sourceId ? { ...s, file_name: newName } : s
        )
      );
      setSourcePanel((prev) =>
        prev.map((s) =>
          getSourceId(s) === sourceId ? { ...s, file_name: newName } : s
        )
      );

      toast.success("Source renamed");
    } catch (e) {
      console.error(e);
      let errorMessage = "Rename failed";

      // The error message is already in e.message from the fetch
      if (e.message && e.message !== "Rename failed") {
        try {
          // Try to parse JSON from the error message
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          // If not JSON, use the raw error message
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsRenaming(false);
      setShowRename(false);
      setRenamingSource(null);
      setMenuId(null);
    }
  };

  const handleDelete = async (source) => {
    const sourceId = getSourceId(source);

    setIsDeleting(true);
    try {
      await api.delete(`/api/source-update-delete/${sourceId}`);

      setSources((prev) => prev.filter((s) => getSourceId(s) !== sourceId));
      setSourcePanel((prev) => prev.filter((s) => getSourceId(s) !== sourceId));
      toast.success("Source deleted");
      fetchKeywords();
    } catch (e) {
      console.error("Delete error:", e);
      let errorMessage = "Delete failed";

      // The error message is already in e.message from the fetch
      if (e.message && e.message !== "Delete failed") {
        try {
          // Try to parse JSON from the error message
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          // If not JSON, use the raw error message
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingSource(null);
      setMenuId(null);
    }
  };

  const handleExpandPrimaryKeywords = async () => {
    if (selectedKeywordRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }
    if (selectedKeywordRows.length > 1) {
      toast.error("You can only send one row at a time.");
      return;
    }

    const selectedRow = selectedKeywordRows[0];

    console.log("selectedRow ----------", selectedRow);
    const keyword = selectedRow.name;
    const projectId = selectedRow.project_id;
    const keywordId = selectedRow._id;

    if (!keyword || !projectId) {
      toast.error("Missing keyword name or project ID.");
      return;
    }

    const payload = {
      primary_keyword: keyword,
      project_id: projectId,
      keyword_id: keywordId,
    };

    setIsExpandingPrimary(true);

    try {
      const response = await api.post(
        "/keyword-api/run-keyword-expansion-workflow/",
        payload
      );

      const data = response.data;
      console.log("data ----------", data);
      toast.success(data?.message || "Expansion triggered successfully!");

      // ✅ Refresh keywords and sources
      await fetchKeywords();
      await fetchSourceData();
      if (instantRefreshAfterTaskStart) {
        await instantRefreshAfterTaskStart();
      }
      if (typeof refreshTasks === "function") {
        refreshTasks();
      }
      if (typeof setIsDrawerOpen === "function") {
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.log("Keyword expansion error:", error);
      toast.error(
        error?.response?.data?.error || "Failed to trigger expansion workflow."
      );
    } finally {
      setIsExpandingPrimary(false);
    }
  };

  const handleExpandQuestions = async () => {
    if (selectedKeywordRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }

    setShowAIOptimizationLoader(true);

    try {
      const rows = selectedKeywordRows.filter((row) => row?.name && row?.id);
      if (rows.length === 0) {
        toast.error("Missing keyword name or id.");
        return;
      }

      const rowsWithoutQuestions = rows.filter((row) => {
        const questionCount =
          typeof row?.total_questions_generated === "number"
            ? row.total_questions_generated
            : Array.isArray(row?.generated_question_ids)
              ? row.generated_question_ids.length
              : 0;
        return questionCount === 0;
      });

      if (rowsWithoutQuestions.length === 0) {
        toast.error("Selected keywords already have AI questions generated.");
        return;
      }

      const results = [];
      for (const row of rowsWithoutQuestions) {
        const response = await api.post("/keyword-api/analyze-keyword-serp/", {
          keyword: row.name,
          keyword_id: row.id,
          project_id: selectedProject?.id,
        });
        results.push(response?.data);
      }

      if (rowsWithoutQuestions.length === 1) {
        toast.success(
          results?.[0]?.message ||
            "AI optimization: Questions triggered successfully..."
        );
      } else {
        toast.success(
          `AI optimization: Questions triggered for ${rowsWithoutQuestions.length} keywords...`
        );
      }

      setSelectedKeywordRows([]);
      if (onStatusUpdate) onStatusUpdate();
      if (instantRefreshAfterTaskStart) {
        await instantRefreshAfterTaskStart();
      }
      if (typeof refreshTasks === "function") {
        refreshTasks();
      }
      if (typeof setIsDrawerOpen === "function") {
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Error analyzing keyword SERP:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve keywords"
      );
    } finally {
      setShowAIOptimizationLoader(false);
    }
  };

  const handleApproveKeywords = async () => {
    if (selectedKeywordRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, approve: true }));
    try {
      const response = await api.post("/keyword-api/update-keyword-status/", {
        keyword_ids: selectedKeywordRows.map((row) => row.id),
        keyword_status: "approved",
        project_id: selectedProject?.id,
      });

      const data = response.data;
      toast.success(data?.message || "Approved keywords...");
      setSelectedKeywordRows([]);
      if (onStatusUpdate) onStatusUpdate();
      await fetchKeywords({ showLoader: false });
    } catch (error) {
      console.error("Error approving keywords:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve keywords"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, approve: false }));
    }
  };

  const handleRejectKeywords = async () => {
    if (selectedKeywordRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, reject: true }));
    try {
      const response = await api.post("/keyword-api/update-keyword-status/", {
        keyword_ids: selectedKeywordRows.map((row) => row.id),
        keyword_status: "rejected",
        project_id: selectedProject?.id,
      });

      const data = response.data;
      toast.success(data?.message || "Rejected keywords...");
      setSelectedKeywordRows([]);
      if (onStatusUpdate) onStatusUpdate();
      await fetchKeywords({ showLoader: false });
    } catch (error) {
      console.error("Error rejecting keywords:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject keywords"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, reject: false }));
    }
  };

  const onLinkProduct = (product) => {
    // Validation: Check if a keyword is selected
    if (selectedKeywordRows.length === 0) {
      toast.error("Please select a keyword first.");
      return;
    }

    if (selectedKeywordRows.length > 1) {
      toast.error("Please select only one keyword at a time.");
      return;
    }

    // Validation: Check if keyword is approved
    const selectedKeyword = selectedKeywordRows[0];
    if (selectedKeyword.keyword_status?.toLowerCase() !== "approved") {
      toast.error("Only approved keywords can be linked to products.");
      return;
    }

    // Validation: Check if a product is selected
    if (!product) {
      toast.error("Please select a product first.");
      return;
    }

    setShowProductLinkConfirm(true);
  };

  const handleConfirmProductLink = async () => {
    setIsLinkingProduct(true);

    try {
      const selectedKeyword = selectedKeywordRows[0];

      const payload = {
        project_id: selectedProject?.id,
        product_service_id: selectedProduct._id,
        keyword_id: selectedKeyword.id,
        source_id: selectedKeyword.source_id,
      };

      const response = await api.post(
        "/keyword-api/create-product-keyword-relationship/",
        payload
      );

      const data = response.data;
      toast.success(data?.message || "Product linked successfully!");

      setSelectedKeywordRows([]);
      setSelectedProduct(null);
      if (onStatusUpdate) onStatusUpdate();

      // Refresh keywords to show the new link
      fetchKeywords();
    } catch (error) {
      console.error("Product linking error:", error);
      let errorMessage = "Failed to link product";

      if (error.message && error.message !== "Failed to link product") {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = error.message;
          }
        } catch (parseError) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLinkingProduct(false);
      setShowProductLinkConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sources Box */}
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg h-[280px] overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Header */}
        <div className="flex bg-gray-100 py-4 px-4 items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-gray-900 font-semibold text-lg">Sources</h2>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <FiSidebar className="w-4 h-4 text-purple-600" />
          </button>
        </div>

        {/* Collapsed State - Optional content */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 mt-4">
            {/* No extra content to avoid overflow */}
          </div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <div className="pl-4 pr-4 pt-1 pb-4 h-[calc(100%-80px)] flex flex-col">
            {/* Add Source Button */}
            <button
              onClick={() => setShowAdd(true)}
              className="mb-4 py-1 w-fit px-3 bg-primary text-white rounded inline-flex items-center gap-1 cursor-pointer"
              disabled={isUploading}
            >
              <FaPlus size={12} /> {isUploading ? "Uploading..." : "Add Source"}
            </button>

            {/* Sources List */}
            <div className="space-y-3 overflow-y-auto pr-1 custom-scroll flex-1">
              {sourcePanel?.length > 0 ? (
                sourcePanel.map((source) => {
                  const sourceId = getSourceId(source);
                  return (
                    <div
                      key={sourceId}
                      className="flex items-center gap-3 pl-2 pr-2 pb-1 pt-1 hover:bg-gray-100 rounded-md cursor-pointer group transition-colors duration-150"
                      onMouseEnter={() => setHoveredId(sourceId)}
                      onMouseLeave={() => setHoveredId(null)}
                      title={source.file_name}
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {source.file_name}
                      </span>

                      {/* Reserve space for the menu button */}
                      <div className="w-6 flex justify-end relative">
                        {(hoveredId === sourceId || menuId === sourceId) && (
                          <>
                            <button
                              onClick={() =>
                                setMenuId(menuId === sourceId ? null : sourceId)
                              }
                              className="text-gray-500 cursor-pointer hover:text-gray-700 p-1"
                            >
                              <FaEllipsisV size={14} />
                            </button>
                            {menuId === sourceId && (
                              <div className="absolute right-0 mt-5 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <button
                                  onClick={() => handleRenameClick(source)}
                                  className="flex cursor-pointer items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
                                >
                                  <FaEdit size={12} /> Rename
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(source)}
                                  className="flex cursor-pointer items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                                >
                                  <FaTrash size={12} /> Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No sources added yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions box*/}
      {!isCollapsed && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-72">
          <div>
            <h3 className="text-gray-900 font-semibold text-center text-[22px]">
              Actions
            </h3>
          </div>
          <div className="border-1 cursor-pointer border-gray-400 mt-2 mb-5"></div>

          <div className="flex gap-2 justify-between">
            <button
              onClick={handleApproveKeywords}
              disabled={actionLoading.approve || actionLoading.reject}
              className="w-full cursor-pointer py-1 px-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-150"
            >
              {actionLoading.approve ? (
                <div className="flex items-center justify-center gap-2">
                  <PulseLoader color="#fff" size={6} />
                  <span>Approving...</span>
                </div>
              ) : (
                "Approve"
              )}
            </button>
            <button
              onClick={handleRejectKeywords}
              disabled={actionLoading.approve || actionLoading.reject}
              className="w-full cursor-pointer py-1 px-4 bg-red-600 text-white rounded-lg  font-medium hover:bg-red-700 transition-colors duration-150"
            >
              {actionLoading.reject ? (
                <div className="flex items-center justify-center gap-2">
                  <PulseLoader color="#fff" size={6} />
                  <span>Rejecting...</span>
                </div>
              ) : (
                "Reject"
              )}
            </button>
          </div>
          <div className="border-1 cursor-pointer border-gray-400 mt-3 mb-5"></div>
          <button
            onClick={handleExpandQuestions}
            disabled={showAIOptimizationLoader}
            className="w-full cursor-pointer py-1 px-4 bg-purple-600 text-white rounded-lg  font-medium hover:bg-purple-700 transition-colors duration-150"
          >
            {showAIOptimizationLoader ? (
              <PulseLoader color="#fff" size={8} className="text-white" />
            ) : (
              "AI optimization: Questions"
            )}
          </button>

          <div className="border-1 cursor-pointer border-gray-400 mt-3 mb-3"></div>

          <div className="space-y-2 relative">
            <h4 className="text-black font-medium text-[14px]">
              Link Products & Services
            </h4>

            <Autocomplete
              options={products}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(_, newValue) => setSelectedProduct(newValue)}
              PopperComponent={StyledPopper}
              disabled={isLoadingProducts}
              loading={isLoadingProducts}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    isLoadingProducts
                      ? "Loading products..."
                      : "Search products & services..."
                  }
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.5rem",
                      "&.Mui-focused fieldset": {
                        borderColor: "#9333EA", // purple-600
                      },
                    },
                    "& label.Mui-focused": {
                      color: "#9333EA",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography fontWeight={500} color="text.primary">
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatLocalDate(option.created_at)}
                  </Typography>
                </Box>
              )}
            />

            <PurpleButton
              fullWidth
              disabled={
                isLoadingProducts ||
                isLinkingProduct ||
                !selectedProduct ||
                selectedKeywordRows.length !== 1
              }
              onClick={() => onLinkProduct(selectedProduct)}
            >
              {isLoadingProducts ? (
                <div className="flex items-center gap-2">
                  <PulseLoader color="#fff" size={6} />
                  <span>Loading products...</span>
                </div>
              ) : isLinkingProduct ? (
                <div className="flex items-center gap-2">
                  <PulseLoader color="#fff" size={6} />
                  <span>Linking...</span>
                </div>
              ) : selectedKeywordRows.length === 0 ? (
                "Select a keyword first"
              ) : selectedKeywordRows.length > 1 ? (
                "Select only one keyword"
              ) : !selectedProduct ? (
                "Select a product"
              ) : (
                "Link Product"
              )}
            </PurpleButton>

            {selectedProduct && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Selected:</strong> {selectedProduct.name}
              </div>
            )}
          </div>
        </div>
      )}

      {showMessagePopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#e6ffed",
            color: "#065f46",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: "300px",
            maxWidth: "90%",
          }}
        >
          <span style={{ flex: 1 }}>{customMessage}</span>
          <button
            onClick={() => setShowMessagePopup(false)}
            style={{
              marginLeft: "16px",
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#065f46",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Modals */}
      <AddKeywordModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onFileUpload={handleFileUpload}
        onShowText={() => setShowText(true)}
      />
      <TextModal
        isOpen={showText}
        onClose={() => setShowText(false)}
        projectId={selectedProject?.id}
        componentId={componentId}
        domainId={domainId}
        onAdd={handleAddSource}
        isKeword={true}
        fetchKeywords={fetchKeywords}
        fetchSourceData={fetchSourceData}
      />
      <RenameModal
        isOpen={showRename}
        onClose={() => setShowRename(false)}
        currentName={renamingSource?.file_name || ""}
        onRename={(newName) => handleRename(renamingSource, newName)}
        isSubmitting={isRenaming}
      />
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => handleDelete(deletingSource)}
        sourceName={deletingSource?.file_name || "this source"}
        isSubmitting={isDeleting}
      />
      {showFileProgress && (
        <ProcessingStatusModal
          title={uploadingFileName}
          onCancel={handleFileCancel}
          progress={fileProgress}
          statusText={fileStatusText}
        />
      )}
      <ProductLinkConfirmModal
        isOpen={showProductLinkConfirm}
        onClose={() => setShowProductLinkConfirm(false)}
        onConfirm={handleConfirmProductLink}
        keywordName={selectedKeywordRows[0]?.name || ""}
        productName={selectedProduct?.name || ""}
        isSubmitting={isLinkingProduct}
      />
    </div>
  );
};

// Custom Popper to allow auto-flip above input
const StyledPopper = styled(Popper)({
  zIndex: 1500,
});

// Purple-themed button using your tailwind color
const PurpleButton = styled(Button)({
  backgroundColor: "#9333EA", // tailwind purple-600
  color: "#fff",
  "&:hover": {
    backgroundColor: "#7E22CE", // tailwind purple-700
    color: "#fff",
    cursor: "pointer",
  },
  "&:disabled": {
    backgroundColor: "#9333EA", // tailwind purple-600
    color: "#fff",
    cursor: "not-allowed",
  },
  "&:disabled:hover": {
    backgroundColor: "#9333EA", // tailwind purple-600
    color: "#fff",
    cursor: "not-allowed",
  },
  textTransform: "none",
  fontWeight: 500,
  borderRadius: "0.5rem",
});

export default SourcesPanel;
