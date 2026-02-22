"use client";

import { useEffect, useState, useRef, use, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import toast from "react-hot-toast";
import AIOptimizationTable from "../../../components/AIOptimizationTable";
import SourcePanelAIOptimizations from "../../../components/SourcePanelAIOptimizations";
import { useSelection } from "../../../context/SelectionContext";
import api from "../../../../api/axios";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function AIOptimizationsPage({ params }) {
  const { id } = use(params);

  useTrackFeatureExploration("ai_optimizations");

  // Track feature usage
  useFeatureTracking("AI Optimizations", {
    feature_category: "ai_content",
    page_section: "ai_optimizations",
    project_id: id,
  });

  console.log("AIOptimizationsPage id------->", id);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const domainId = searchParams.get("domain");
  const componentId = searchParams.get("component");
  const highlightQuestionId = searchParams.get("highlight");
  const highlightKeywordId = searchParams.get("keyword_id");

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAIOptimizationRows, setSelectedAIOptimizationRows] = useState(
    []
  );
  const [aiOptimizationData, setAIOptimizationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const processedHighlightRef = useRef(null);
  const processedKeywordHighlightRef = useRef(null);

  const { selectedProject } = useSelection();

  const currentProjectId = useMemo(() => {
    return id ? id : selectedProject?.id;
  }, [id, selectedProject?.id]);

  const fetchAIOptimizations = useCallback(
    async ({ showLoader = true, resetData = true } = {}) => {
      if (resetData) {
        setAIOptimizationData([]);
      }
      const projectId = currentProjectId;
      if (!projectId) return;

      if (showLoader) {
        setLoading(true);
      }

      trackFeatureAction("ai_optimizations_fetch_started", {
        project_id: projectId,
      });

      try {
        const response = await api.get(
          `/keyword-api/optimization-questions/?project_id=${projectId}`
        );
        const data = response.data;

        // Add unique IDs to each row for selection purposes
        const processedData = (data.data || []).map((item) => ({
          ...item,
          id: item._id,
          createdAt: item.created_at || item.createdAt || null,
          updatedAt: item.updated_at || item.updatedAt || null,
        }));

        setAIOptimizationData(processedData);

        trackFeatureAction("ai_optimizations_fetch_success", {
          project_id: projectId,
          optimizations_count: processedData.length,
        });
      } catch (err) {
        console.error("API Error:", err);

        trackFeatureAction("ai_optimizations_fetch_failed", {
          project_id: projectId,
          error_message: err.message || "Failed to fetch AI optimizations",
        });

        toast.error(err.message || "Failed to fetch AI optimizations.");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [currentProjectId]
  );

  useEffect(() => {
    if (currentProjectId) {
      fetchAIOptimizations({ showLoader: true, resetData: true });
    }
  }, [currentProjectId, fetchAIOptimizations]);

  useEffect(() => {
    if (!currentProjectId) return;

    const interval = setInterval(() => {
      fetchAIOptimizations({ showLoader: false, resetData: false });
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, [currentProjectId, fetchAIOptimizations]);

  // Track AI optimizations selection changes
  const handleAIOptimizationSelectionChange = useCallback(
    (selectedRows) => {
      const previousCount = selectedAIOptimizationRows.length;
      const newCount = selectedRows.length;

      trackFeatureAction("ai_optimizations_selection_changed", {
        project_id: id || selectedProject?.id,
        previous_selected_count: previousCount,
        new_selected_count: newCount,
        selection_delta: newCount - previousCount,
      });

      setSelectedAIOptimizationRows(selectedRows);
    },
    [id, selectedProject?.id, selectedAIOptimizationRows.length]
  );

  // Handle highlighting/selecting a specific question when navigated from AIO Answers
  useEffect(() => {
    if (
      highlightQuestionId &&
      aiOptimizationData.length > 0 &&
      processedHighlightRef.current !== highlightQuestionId
    ) {
      // Immediately mark as processed to prevent duplicate runs
      processedHighlightRef.current = highlightQuestionId;
      // Find the question that matches the highlight ID
      const questionToHighlight = aiOptimizationData.find(
        (question) =>
          question.id === highlightQuestionId ||
          question._id === highlightQuestionId ||
          question.question_phrase === highlightQuestionId
      );

      if (questionToHighlight) {
        setSelectedAIOptimizationRows([questionToHighlight]);
        // Show success message
        toast.success(
          `Found and selected question: "${questionToHighlight.question_phrase}"`
        );
      } else {
        toast.error(
          "Could not find the specified question in AI Optimizations."
        );
      }

      // Remove the highlight parameter from URL after 5 seconds
      const timeoutId = setTimeout(() => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("highlight");
        // Use replace to avoid adding to browser history
        router.replace(currentUrl.pathname + currentUrl.search, {
          scroll: false,
        });
        processedHighlightRef.current = null; // Reset processed ID after cleanup
      }, 5000);

      // Cleanup timeout if component unmounts or effect runs again
      return () => clearTimeout(timeoutId);
    }
  }, [highlightQuestionId, aiOptimizationData, router]);

  useEffect(() => {
    if (
      highlightKeywordId &&
      aiOptimizationData.length > 0 &&
      processedKeywordHighlightRef.current !== highlightKeywordId
    ) {
      processedKeywordHighlightRef.current = highlightKeywordId;

      const questionsToHighlight = aiOptimizationData.filter(
        (question) =>
          String(question.keyword_id || "") === String(highlightKeywordId)
      );

      if (questionsToHighlight.length > 0) {
        setSelectedAIOptimizationRows(questionsToHighlight);
        toast.success(
          `Selected ${questionsToHighlight.length} question${
            questionsToHighlight.length === 1 ? "" : "s"
          } for this keyword.`
        );
      } else {
        toast.error(
          "Could not find any questions for the specified keyword in AI Optimizations."
        );
      }

      const timeoutId = setTimeout(() => {
        const params = new URLSearchParams(searchParams?.toString?.() || "");
        params.delete("keyword_id");
        const nextSearch = params.toString();
        const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
        router.replace(nextUrl, { scroll: false });
        processedKeywordHighlightRef.current = null;
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [highlightKeywordId, aiOptimizationData, router, pathname, searchParams]);

  return (
    <div className="w-full px-4 mt-2" style={{ backgroundColor: "#FAFAFA", minHeight: "calc(100vh - 100px)" }}>
      <div className="max-w-full mx-auto space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
          AI Parent Questions
        </h1>

        <div className="space-y-2">
          <p className="text-base sm:text-lg text-gray-600">
            Questions your customers ask AI
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] w-full min-w-0 gap-4">
          <div
            className={`transition-all duration-300 ${
              isCollapsed ? "w-16" : "w-72"
            } min-w-0`}
          >
            <SourcePanelAIOptimizations
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              selectedAIOptimizationRows={selectedAIOptimizationRows}
              fetchAIOptimizations={fetchAIOptimizations}
              setSelectedAIOptimizationRows={
                handleAIOptimizationSelectionChange
              }
            />
          </div>

          <div className="min-w-0 w-full overflow-x-auto transition-all duration-300">
            <AIOptimizationTable
              onSelectionChange={handleAIOptimizationSelectionChange}
              aiOptimizationData={aiOptimizationData}
              loading={loading}
              selectedAIOptimizationRows={selectedAIOptimizationRows}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
