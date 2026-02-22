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
import toast from "react-hot-toast";
import { PulseLoader } from "react-spinners";
import { CircularProgress } from "@mui/material";
import api from "../../api/axios";

const SourcePanelAIOptimizations = ({
  isCollapsed,
  setIsCollapsed,
  selectedAIOptimizationRows,
  fetchAIOptimizations,
  setSelectedAIOptimizationRows,
}) => {
  const [renamingSource, setRenamingSource] = useState(null);
  const [showRename, setShowRename] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSource, setDeletingSource] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const { selectedProject } = useSelection();
  const [sourcePanel, setSourcePanel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
  });
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();

  const prevSourcesRef = useRef([]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleApproveOptimizations = async () => {
    if (selectedAIOptimizationRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }

    console.log("selectedAIOptimizationRows", selectedAIOptimizationRows);

    setActionLoading((prev) => ({ ...prev, approve: true }));
    try {
      const response = await api.patch(
        "/keyword-api/optimization-questions/status/",
        {
          project_id: selectedProject?.id,
          ids: selectedAIOptimizationRows.map((row) => row.id),
          status: "approved",
        }
      );

      const data = response.data;
      toast.success(data.message || "Optimizations approved successfully");
      await fetchAIOptimizations?.({
        showLoader: false,
        resetData: false,
      });
      setSelectedAIOptimizationRows([]);
    } catch (error) {
      console.error("Failed to approve optimizations:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve optimizations."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, approve: false }));
    }
  };

  const handleRejectOptimizations = async () => {
    if (selectedAIOptimizationRows.length === 0) {
      toast.error("Please select at least one row.");
      return;
    }
    setActionLoading((prev) => ({ ...prev, reject: true }));
    try {
      const response = await api.patch(
        "/keyword-api/optimization-questions/status/",
        {
          project_id: selectedProject?.id,
          ids: selectedAIOptimizationRows.map(
            (row) => row.id || `${row.base_keyword}-${row.question_phrase}`
          ),
          status: "rejected",
        }
      );

      const data = response.data;
      toast.success(data.message || "Optimizations rejected successfully");
      await fetchAIOptimizations?.({
        showLoader: false,
        resetData: false,
      });
      setSelectedAIOptimizationRows([]);
    } catch (error) {
      console.error("Failed to reject optimizations:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject optimizations."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, reject: false }));
    }
  };

  const showError = () => {
    toast.error("API integration required");
  };

  const formatGenerationError = (payload) => {
    if (!payload || typeof payload !== "object") {
      return { message: "Failed to generate content. Please try again." };
    }

    const message =
      payload.error ||
      payload.message ||
      payload.detail ||
      "Failed to generate content. Please try again.";
    const answerId = payload.answer_id || payload.answerId;

    return {
      message,
      answerId,
    };
  };

  const showGenerationErrorToast = (payload) => {
    const { message } = formatGenerationError(payload);
    toast.error(message);
  };

  const handleGenerateContent = async () => {
    if (selectedAIOptimizationRows.length === 0) {
      toast.error("Please select at least one row to generate content.");
      return;
    }

    if (selectedAIOptimizationRows.length > 1) {
      toast.error("Please select only one row to generate content.");
      return;
    }

    if (isGeneratingContent) {
      toast.error("Content is already being generated.");
      return;
    }

    setIsGeneratingContent(true);

    try {
      const row = selectedAIOptimizationRows[0]; // Get the single selected row

      console.log("row ---------", row);

      if (row.status.toLowerCase() !== "approved") {
        toast.error("Please approve the question before generating content.");
        return;
      }

      const response = await api.post("/aio/answer-generate/", {
        project_id: selectedProject?.id,
        question_id: row.id,
      });

      const result = response.data;

      if (result?.status === "success") {
        toast.success(
          result.message ||
            "Successfully generated content for the selected question"
        );

        await fetchAIOptimizations?.({
          showLoader: false,
          resetData: false,
        });
      } else {
        showGenerationErrorToast(result);
      }

      // Open global task monitor and refresh after task start
      await instantRefreshAfterTaskStart();
      setIsDrawerOpen(true);

      // Clear selection
      setSelectedAIOptimizationRows([]);
    } catch (error) {
      console.error("Failed to generate content:", error);
      if (error.response?.data) {
        showGenerationErrorToast(error.response.data);
      } else {
        toast.error(error.message || "Failed to generate content. Please try again.");
      }
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleCreateArticle = async () => {
    showError();
  };

  const handleCreateGEOContent = async () => {
    showError();
  };

  const handleCreateSocialPost = async () => {
    showError();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sources Box */}
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-72"
        }`}
      ></div>
      {/* Actions box*/}
      {!isCollapsed && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-72">
          {/* Header */}
          <div className="flex  py-4 px-4 items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-gray-900 font-semibold text-lg">Actions</h2>
            )}
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
              title={isCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <FiSidebar className="w-4 h-4 text-purple-600" />
            </button>
          </div>
          <div className="border-1 cursor-pointer border-gray-400 mt-1 mb-3"></div>

          <div className="space-y-2 mt-3 mb-2">
            <button
              onClick={handleGenerateContent}
              disabled={isGeneratingContent}
              className={`w-full py-1 px-2 text-white rounded-lg font-medium transition-colors duration-150 flex items-center justify-center ${
                isGeneratingContent
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 cursor-pointer"
              }`}
            >
              {isGeneratingContent ? (
                <>
                  <PulseLoader color="white" size={8} margin={2} />
                  <span className="ml-2">Generating</span>
                </>
              ) : (
                "AI Answer Generation"
              )}
            </button>
          </div>
          <div className="flex gap-2 justify-between">
            <button
              onClick={handleApproveOptimizations}
              disabled={
                actionLoading.approve || actionLoading.reject || isGeneratingContent
              }
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
              onClick={handleRejectOptimizations}
              disabled={
                actionLoading.approve || actionLoading.reject || isGeneratingContent
              }
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
        </div>
      )}

      {/* Collapsed State Button */}
      {isCollapsed && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg h-[60px] overflow-hidden transition-all duration-300 w-16">
          <div className="flex bg-gray-100 py-4 px-4 items-center justify-center">
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
              title="Expand panel"
            >
              <FiSidebar className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourcePanelAIOptimizations;
