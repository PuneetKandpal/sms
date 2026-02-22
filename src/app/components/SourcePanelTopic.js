"use client";

import { useEffect, useState, useRef } from "react";
import { useSelection } from "../context/SelectionContext";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import { FaEdit, FaEllipsisV, FaPlus, FaTrash } from "react-icons/fa";
import {
  RenameModal,
  DeleteConfirmModal,
  AddSourceModal,
} from "./SourceModals";
import { FiSidebar } from "react-icons/fi";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { PulseLoader } from "react-spinners";
import { CircularProgress } from "@mui/material";

const SourcesPanelTopic = ({
  isCollapsed,
  setIsCollapsed,
  domainId,
  componentId,
  selectedTopicRows,
  fetchTopics,
  setSelectedTopicRows,
}) => {
  const [renamingSource, setRenamingSource] = useState(null);
  const [showRename, setShowRename] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [menuSource, setMenuSource] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSource, setDeletingSource] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const { selectedProject } = useSelection();
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();
  const [sourcePanel, setSourcePanel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastErrorMessage, setLastErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
  });

  const hasCoreIdeas = sourcePanel.length > 0;
  const heroButtonClasses =
    "w-full h-36 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xl font-semibold flex items-center justify-center text-center px-6 shadow-lg hover:shadow-xl transition-all duration-200";
  const primaryActionClasses = (disabled) =>
    `w-full cursor-pointer py-1 px-2 rounded-lg font-medium transition-colors duration-150 ${
      disabled
        ? "bg-purple-200 text-purple-400 cursor-not-allowed"
        : "bg-purple-600 text-white hover:bg-purple-700"
    }`;
  const dangerActionClasses = (disabled) =>
    `w-full cursor-pointer py-1 px-4 rounded-lg font-medium transition-colors duration-150 ${
      disabled
        ? "bg-red-200 text-red-400 cursor-not-allowed"
        : "bg-red-600 text-white hover:bg-red-700"
    }`;

  const prevSourcesRef = useRef([]);
  const fetchingRef = useRef(false);
  const menuRef = useRef(null);

  const getSourceStatus = (source) => {
    if (
      source.topic_status &&
      source.topic_status?.toLowerCase() === "in progress"
    ) {
      return "IN_PROGRESS";
    }
    return source?.topic_status?.toUpperCase() || "COMPLETED";
  };

  useEffect(() => {
    if (!tooltipData) return;

    const handleWindowChange = () => setTooltipData(null);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [tooltipData]);

  const fetchSourceData = async () => {
    if (!selectedProject?.id || fetchingRef.current) return;

    try {
      fetchingRef.current = true;
      setLoading(true);
      console.log("fetching sources");
      const response = await api.get(
        `/topic-gen/get-topic-sources/?project_id=${selectedProject?.id}`
      );
      const data = response.data;
      const newSources = (data.topic_sources || []).map((s) => ({
        ...s,
        keyword_status: getSourceStatus(s),
      }));

      const prevSources = prevSourcesRef.current;
      newSources.forEach((source) => {
        const prevSource = prevSources.find(
          (s) => s.source_id === source.source_id
        );
        if (
          prevSource &&
          prevSource.keyword_status === "IN_PROGRESS" &&
          source.keyword_status === "COMPLETED"
        ) {
          toast.success(
            "✅ A source has been processed. Please refresh the Topics table."
          );
          if (fetchTopics) {
            fetchTopics();
          }
        }
      });

      setSourcePanel(newSources);
      prevSourcesRef.current = newSources;
    } catch (err) {
      console.error("API Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch sources.";

      // Only show toast if it's a different error message to prevent duplicates
      if (errorMessage !== lastErrorMessage) {
        toast.error(errorMessage);
        setLastErrorMessage(errorMessage);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (selectedProject?.id) {
      fetchSourceData();
      const interval = setInterval(fetchSourceData, 1000 * 60); // 60 seconds
      return () => clearInterval(interval);
    }
  }, [selectedProject]);

  const closeMenu = () => {
    setMenuId(null);
    setMenuPosition(null);
    setMenuSource(null);
  };

  const hideTooltip = () => setTooltipData(null);

  const showTooltip = (target, text) => {
    if (!target || !text) return;

    const rect = target.getBoundingClientRect();
    const maxWidth = 300;
    const availableWidth = Math.max(0, window.innerWidth - 24);
    const width = Math.min(maxWidth, availableWidth * 0.7);

    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12
    );
    const top = Math.min(rect.bottom + 8, window.innerHeight - 12);

    setTooltipData({ text, top, left, width });
  };

  useEffect(() => {
    if (!menuId) return;

    const handlePointerDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    const handleWindowChange = () => {
      closeMenu();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [menuId]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRenameClick = (source) => {
    setRenamingSource(source);
    setShowRename(true);
    closeMenu();
  };

  const handleDeleteClick = (source) => {
    setDeletingSource(source);
    setShowDeleteConfirm(true);
    closeMenu();
  };

  const handleMenuToggle = (e, source) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = getSourceId(source);
    if (menuId === sourceId) {
      closeMenu();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    const top = Math.min(rect.bottom + 8, window.innerHeight - 8);

    setMenuId(sourceId);
    setMenuSource(source);
    setMenuPosition({ top, left });
  };

  function getSourceId(source) {
    return source.source_id;
  }

  const handleRename = async (sourceId, newName) => {
    try {
      setIsSubmitting(true);
      const response = await api.put(`/api/source-update-delete/${sourceId}`, {
        file_name: newName,
        project_id: selectedProject?.id,
      });
      setSourcePanel((prev) =>
        prev.map((s) =>
          getSourceId(s) === sourceId ? { ...s, file_name: newName } : s
        )
      );
      toast.success("Source renamed");
    } catch (e) {
      console.error(e);
      toast.error("Rename failed");
    } finally {
      setIsSubmitting(false);
      setShowRename(false);
      setRenamingSource(null);
      setMenuId(null);
    }
  };

  const handleDelete = async (source) => {
    const sourceId = getSourceId(source);
    try {
      setIsSubmitting(true);
      const response = await api.delete(
        `/topic-gen/delete-source/?project_id=${selectedProject?.id}&source_id=${sourceId}`
      );

      fetchTopics();
      setSourcePanel((prev) => prev.filter((s) => getSourceId(s) !== sourceId));
      toast.success("Source deleted");
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(e.message || "Delete failed");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setDeletingSource(null);
      setMenuId(null);
    }
  };

  const handleAddSource = async (userInput) => {
    setIsSubmitting(true);
    try {
      const response = await api.post("/topic-gen/create-user-source/", {
        user_input: userInput,
        project_id: selectedProject?.id,
        component_id: componentId,
        domain_id: domainId,
      });

      const data = response.data;
      toast.success(data.message || "Source created successfully");
      if (setIsDrawerOpen) {
        setIsDrawerOpen(true);
      }
      if (instantRefreshAfterTaskStart) {
        await instantRefreshAfterTaskStart();
      }
      fetchSourceData(); // Immediately fetch sources
    } catch (error) {
      console.error("Failed to create source:", error);
      toast.error(error.message || "Failed to create source.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateArticle = async () => {
    console.log("selectedTopicsRows", selectedTopicRows);

    if (!hasCoreIdeas) {
      toast.error("Add at least one core idea first.");
      return;
    }

    if (selectedTopicRows.length === 0) {
      toast.error("Please select at least one Topic.");
      return;
    }

    if (selectedTopicRows.length > 1) {
      toast.error("Please select only one Topic.");
      return;
    }

    const selectedRow = selectedTopicRows[0];

    // if (selectedRow.status !== "approved") {
    //   toast.error("Please approve the topic first.");
    //   return;
    // }

    try {
      setIsGenerating(true);
      const response = await api.post("/article-writer/generate-article/", {
        topic_id: selectedRow.id,
        project_id: selectedProject?.id,
      });

      const data = response.data;
      console.log("Article Response:", data);

      if (data?.status === "success") {
        toast.success(
          data.message || "Article generation started successfully!"
        );

        if (setIsDrawerOpen) {
          setIsDrawerOpen(true);
        }

        if (fetchTopics) {
          await fetchTopics({ showLoader: false, preserveData: true });
        }
      } else {
        toast.error(data?.message || "Failed to start article generation.");
      }
      if (instantRefreshAfterTaskStart) {
        instantRefreshAfterTaskStart();
      }
      setSelectedTopicRows([]);
    } catch (error) {
      console.error("Error generating article:", error);
      toast.error(error.response.data.error || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveTopics = async () => {
    if (selectedTopicRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, approve: true }));
    try {
      const response = await api.post("/topic-gen/update-status/", {
        topic_ids: selectedTopicRows.map((row) => row._id),
        status: "approved",
        project_id: selectedProject?.id,
      });

      const data = response.data;
      toast.success(data.message || "Topics approved successfully");
      if (fetchTopics) {
        await fetchTopics({ showLoader: false, preserveData: true });
      }
      setSelectedTopicRows([]);
    } catch (error) {
      console.error("Failed to approve topics:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve topics."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, approve: false }));
    }
  };

  const handleRejectTopics = async () => {
    if (selectedTopicRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }
    setActionLoading((prev) => ({ ...prev, reject: true }));
    try {
      const response = await api.post("/topic-gen/update-status/", {
        topic_ids: selectedTopicRows.map((row) => row._id),
        status: "rejected",
        project_id: selectedProject?.id,
      });

      const data = response.data;
      toast.success(data.message || "Topics rejected successfully");
      if (fetchTopics) {
        await fetchTopics({ showLoader: false, preserveData: true });
      }
      setSelectedTopicRows([]);
    } catch (error) {
      console.error("Failed to reject topics:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject topics."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, reject: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sources Box */}
      <div
        className={`bg-white border border-gray-200 rounded-2xl h-[320px] overflow-visible transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Header */}
        <div className="flex bg-white py-4 px-4 items-center justify-between border-b border-gray-100">
          {!isCollapsed && (
            <div>
              <h2 className="text-gray-900 font-semibold text-xl">Core Ideas</h2>
            </div>
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
          <div className="px-4 pt-4 pb-4 h-[calc(100%-88px)] flex flex-col">
            {!hasCoreIdeas && (
              <button
                onClick={() => setShowAddSourceModal(true)}
                className={`${heroButtonClasses} mb-4`}
              >
                Add Core Idea to Generate Topics
              </button>
            )}
            {/* Sources List */}
            <div
              className={`space-y-3 pr-1 flex-1 ${
                sourcePanel?.length > 0 ? "overflow-y-auto custom-scroll" : "overflow-hidden"
              }`}
            >
              {sourcePanel?.length > 0 ? (
                sourcePanel.map((source) => {
                  const sourceId = getSourceId(source);
                  const sourceLabel =
                    source?.file_name?.trim() ||
                    source?.content?.trim() ||
                    "Untitled core idea";
                  return (
                    <div className="relative" key={sourceId}>
                      <div
                        className="flex items-start gap-1 pl-2 pr-2 pb-1 pt-1 hover:bg-gray-100 rounded-md cursor-pointer group transition-colors duration-150"
                        onMouseEnter={(e) => {
                          setHoveredId(sourceId);
                          showTooltip(e.currentTarget, sourceLabel);
                        }}
                        onMouseLeave={() => {
                          setHoveredId(null);
                          hideTooltip();
                        }}
                      >
                        <span
                          className="text-sm text-gray-800 leading-snug flex-1 min-w-0"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          aria-label={sourceLabel}
                        >
                          {sourceLabel}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {source.keyword_status === "IN_PROGRESS" ? (
                            <div className="h-8 ml-2 mr-5">
                              <PulseLoader color="#9810fa" size={7} />
                            </div>
                          ) : (
                            source.keyword_status &&
                            source.keyword_status !== "COMPLETED" && (
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                                  source.keyword_status === "FAILED" ||
                                  source.keyword_status === "ERROR"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {source.keyword_status}
                              </span>
                            )
                          )}
                        </div>

                        {/* Reserve space for the menu button */}
                        <div className="w-6 flex justify-end relative">
                          {(hoveredId === sourceId || menuId === sourceId) && (
                            <>
                              <button
                                onClick={(e) => handleMenuToggle(e, source)}
                                className="text-gray-500 cursor-pointer hover:text-gray-700 p-1"
                              >
                                <FaEllipsisV size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
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
          <div className="border-1 cursor-pointer border-gray-400 mt-1 mb-3"></div>

          <div className="mt-1 mb-4">
            <button
              onClick={() => setShowAddSourceModal(true)}
              className={primaryActionClasses(false)}
            >
              Add Core Idea
            </button>
          </div>

          <div className="flex gap-2 justify-between">
            <button
              onClick={handleApproveTopics}
              disabled={
                actionLoading.approve ||
                actionLoading.reject ||
                !hasCoreIdeas
              }
              className={primaryActionClasses(
                actionLoading.approve ||
                  actionLoading.reject ||
                  !hasCoreIdeas
              )}
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
              onClick={handleRejectTopics}
              disabled={
                actionLoading.approve ||
                actionLoading.reject ||
                !hasCoreIdeas
              }
              className={dangerActionClasses(
                actionLoading.approve ||
                  actionLoading.reject ||
                  !hasCoreIdeas
              )}
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
          <div className="mt-3">
            <button
              onClick={handleCreateArticle}
              disabled={!hasCoreIdeas}
              className={`${primaryActionClasses(!hasCoreIdeas)} flex items-center justify-center gap-2`}
            >
              {isGenerating && <CircularProgress size={16} color="white" />}
              Create Article from Topic
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddSourceModal
        isOpen={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
        onSubmit={handleAddSource}
        isSubmitting={isSubmitting}
      />
      <RenameModal
        isOpen={showRename}
        onClose={() => setShowRename(false)}
        currentName={renamingSource?.file_name || renamingSource?.content || ""}
        onRename={(newName) =>
          handleRename(getSourceId(renamingSource), newName)
        }
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => handleDelete(deletingSource)}
        sourceName={
          deletingSource?.file_name || deletingSource?.content || "this source"
        }
        isSubmitting={isSubmitting}
      />

      {menuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed z-[1000] w-40 bg-white rounded-md shadow-lg border border-gray-200"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            onClick={() => handleRenameClick(menuSource)}
            className="flex cursor-pointer items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <FaEdit size={12} /> Rename
          </button>
          <button
            onClick={() => handleDeleteClick(menuSource)}
            className="flex cursor-pointer items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
          >
            <FaTrash size={12} /> Delete
          </button>
        </div>
      )}

      {tooltipData && (
        <div
          className="fixed max-w-64 z-[999] bg-white text-gray-900 text-xs px-3 py-2 rounded-xl shadow-2xl border border-gray-200"
          style={{
            top: tooltipData.top,
            left: tooltipData.left,
            width: tooltipData.width,
          }}
        >
        {tooltipData.text}
        </div>
      )}
    </div>
  );
};

export default SourcesPanelTopic;
