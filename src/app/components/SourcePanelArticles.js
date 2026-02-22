"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiSidebar } from "react-icons/fi";
import { useSelection } from "../context/SelectionContext";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import { PulseLoader } from "react-spinners";
import api from "../../api/axios";

const SourcePanelArticles = ({
  isCollapsed,
  setIsCollapsed,
  selectedArticleRows,
  onArticlesUpdate,
}) => {
  const { selectedProject } = useSelection();
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
  });
  const handleApprove = async () => {
    if (selectedArticleRows.length === 0) {
      toast.error("Please select at least one article.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, approve: true }));
    try {
      const response = await api.post("/article-writer/update-stage/", {
        project_id: selectedProject?.id,
        article_ids: selectedArticleRows.map(
          (article) => article.id || article.article_id
        ),
        stage: "Approved",
      });

      const data = response.data;

      toast.success(
        data.message ||
          `${selectedArticleRows.length} article(s) approved successfully!`
      );

      if (onArticlesUpdate) {
        await onArticlesUpdate({ showLoader: false });
      }

      if (instantRefreshAfterTaskStart) {
        await instantRefreshAfterTaskStart();
      }
      if (setIsDrawerOpen) {
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to approve articles:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve articles."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, approve: false }));
    }
  };

  const handleReject = async () => {
    if (selectedArticleRows.length === 0) {
      toast.error("Please select at least one article.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, reject: true }));
    try {
      const response = await api.post("/article-writer/update-stage/", {
        project_id: selectedProject?.id,
        article_ids: selectedArticleRows.map(
          (article) => article.id || article.article_id
        ),
        stage: "Rejected",
      });

      const data = response.data;

      toast.success(
        data.message ||
          `${selectedArticleRows.length} article(s) rejected successfully!`
      );
      if (onArticlesUpdate) {
        await onArticlesUpdate({ showLoader: false });
      }
    } catch (error) {
      console.error("Failed to reject articles:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject articles."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, reject: false }));
    }
  };

  const showError = () => {
    toast.success("Feature coming soon!");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sources Box */}
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-72"
        }`}
      >
        <div className="flex bg-gray-100 py-4 px-4 items-center justify-between">
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
        {!isCollapsed && (
          <div className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-between">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading.approve || actionLoading.reject}
                  className="w-full py-2 px-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
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
                  onClick={handleReject}
                  disabled={actionLoading.approve || actionLoading.reject}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors duration-150 text-sm"
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
              <div className="space-y-2 mt-3">
                <button
                  onClick={showError}
                  className="w-full py-2 px-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
                >
                  Create Social Posts
                </button>
                <button
                  onClick={showError}
                  className="w-full py-2 px-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
                >
                  Create AIO Content
                </button>
                <button
                  onClick={showError}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
                >
                  Create Video
                </button>
                <button
                  onClick={showError}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
                >
                  Create Webinar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions box
      {!isCollapsed && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-72">
          <h3 className="text-gray-900 font-semibold text-center text-xl">
            Actions
          </h3>
          <div className="border-t my-3"></div>
        </div>
      )} */}
    </div>
  );
};

export default SourcePanelArticles;
