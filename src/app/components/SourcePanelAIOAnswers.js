"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiSidebar, FiExternalLink } from "react-icons/fi";
import { useSelection } from "../context/SelectionContext";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import api from "../../api/axios";
import { PulseLoader } from "react-spinners";
import Link from "next/link";

const SourcePanelAIOAnswers = ({
  isCollapsed,
  setIsCollapsed,
  selectedAIOAnswerRows,
  onAIOAnswersUpdate,
  contentArchitectureDataId,
  projectId,
}) => {
  const { selectedProject } = useSelection();
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
  });
  const [pageOverviewData, setPageOverviewData] = useState(null);
  const [pageOverviewLoading, setPageOverviewLoading] = useState(false);
  const [pageOverviewError, setPageOverviewError] = useState(null);

  const hasSingleSelection = selectedAIOAnswerRows.length === 1;
  const selectedAnswer = hasSingleSelection ? selectedAIOAnswerRows[0] : null;

  useEffect(() => {
    if (
      !contentArchitectureDataId ||
      !hasSingleSelection ||
      !selectedAnswer?.page_id
    ) {
      setPageOverviewData(null);
      setPageOverviewError(null);
      setPageOverviewLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchOverview = async () => {
      setPageOverviewLoading(true);
      setPageOverviewError(null);
      try {
        const response = await api.get(
          `/content-architecture/page/${contentArchitectureDataId}/${selectedAnswer.page_id}/`,
          {
            signal: controller.signal,
          }
        );
        setPageOverviewData(response.data?.data || null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch page overview:", error);
        setPageOverviewData(null);
        setPageOverviewError(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Unable to load the linked page."
        );
      } finally {
        if (!controller.signal.aborted) {
          setPageOverviewLoading(false);
        }
      }
    };

    fetchOverview();

    return () => controller.abort();
  }, [
    contentArchitectureDataId,
    hasSingleSelection,
    selectedAnswer?.page_id,
  ]);

  const handleApprove = async () => {
    if (selectedAIOAnswerRows.length === 0) {
      toast.error("Please select at least one AIO answer.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, approve: true }));
    try {
      const response = await api.post("/aio/answer-update/", {
        project_id: selectedProject?.id,
        aio_answer_ids: selectedAIOAnswerRows.map(
          (answer) => answer.id || answer.answer_id
        ),
        stage: "Approved",
      });

      const data = response.data;

      toast.success(
        data.message ||
          `${selectedAIOAnswerRows.length} AIO answer(s) approved successfully!`
      );

      if (onAIOAnswersUpdate) {
        await onAIOAnswersUpdate({ showLoader: false });
      }

      if (instantRefreshAfterTaskStart) {
        await instantRefreshAfterTaskStart();
      }
      if (setIsDrawerOpen) {
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to approve AIO answers:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve AIO answers."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, approve: false }));
    }
  };

  const handleReject = async () => {
    if (selectedAIOAnswerRows.length === 0) {
      toast.error("Please select at least one AIO answer.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, reject: true }));
    try {
      const response = await api.post("/aio/answer-update/", {
        project_id: selectedProject?.id,
        aio_answer_ids: selectedAIOAnswerRows.map(
          (answer) => answer.id || answer.answer_id
        ),
        stage: "Rejected",
      });

      const data = response.data;

      toast.success(
        data.message ||
          `${selectedAIOAnswerRows.length} AIO answer(s) rejected successfully!`
      );
      onAIOAnswersUpdate?.({ showLoader: false });
    } catch (error) {
      console.error("Failed to reject AIO answers:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject AIO answers."
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

  const keywordTokens = (() => {
    if (!pageOverviewData?.keywords) return [];
    const { primary_keywords = [], secondary_keywords = [] } =
      pageOverviewData.keywords;
    return [...new Set([...(primary_keywords || []), ...(secondary_keywords || [])])];
  })();

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
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
                >
                  Create Email Campaign
                </button>
                <button
                  onClick={showError}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors duration-150 text-sm"
                >
                  Export to CMS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900 font-semibold text-lg">
              Linked Page Overview
            </h3>
            {selectedAnswer?.page_location?.blueprint_letter && (
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-100">
                {selectedAnswer.page_location.blueprint_letter}
              </span>
            )}
          </div>

          {!contentArchitectureDataId ? (
            <p className="text-sm text-gray-500">
              Generate Content Architecture first to preview linked pages.
            </p>
          ) : !hasSingleSelection ? (
            <p className="text-sm text-gray-500">
              Select a single answer to preview its destination page.
            </p>
          ) : !selectedAnswer?.page_id ? (
            <p className="text-sm text-gray-500">
              This answer is not mapped to a Content Architecture page yet.
            </p>
          ) : pageOverviewLoading ? (
            <div className="flex items-center justify-center py-4">
              <PulseLoader color="#7C3AED" size={6} />
            </div>
          ) : pageOverviewError ? (
            <p className="text-sm text-red-600">{pageOverviewError}</p>
          ) : pageOverviewData ? (
            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {pageOverviewData.page_title || "Untitled Page"}
                </p>
                <p className="text-xs text-gray-500 break-words">
                  {pageOverviewData.url || "-"}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Blueprint</span>
                  <span className="font-medium text-gray-900">
                    {pageOverviewData.blueprint ||
                      pageOverviewData.blueprint_letter ||
                      "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Stage</span>
                  <span className="font-medium text-gray-900">
                    {pageOverviewData.blueprint_letter || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    Notes
                  </span>
                  <p className="text-sm text-gray-700 mt-1">
                    {pageOverviewData.notes || "No notes available."}
                  </p>
                </div>
              </div>

              {keywordTokens.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    Keywords
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {keywordTokens.map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {projectId && (
                <Link
                  href={`/projects/${projectId}/content-architecture?caTab=overview&pageId=${pageOverviewData.page_id}`}
                  className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors duration-150 cursor-pointer"
                >
                  Open in Content Architecture
                  <FiExternalLink className="ml-2" size={14} />
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No overview data available for this page.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SourcePanelAIOAnswers;
