"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSelection } from "../../../context/SelectionContext";
import AIOAnswersTable from "../../../components/AIOAnswersTable";
import SourcePanelAIOAnswers from "../../../components/SourcePanelAIOAnswers";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../../../api/axios";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function AIOAnswersPage() {
  const params = useParams();
  const { id: projectId } = params;
  const router = useRouter();

  // Redirect to manage page since this feature is disabled
  useEffect(() => {
    if (projectId) {
      router.replace(`/projects/${projectId}/manage`);
    }
  }, [projectId, router]);

  return null;

  const searchParams = useSearchParams();
  const highlightAnswerId = searchParams.get("highlight");
  const autoScrollFromUrl =
    searchParams.get("autoScroll") === "true" ||
    searchParams.get("auto_scroll") === "true";
  const { selectedProject } = useSelection();

  useTrackFeatureExploration("aio_answers");

  // Track feature usage
  useFeatureTracking("AIO Answers", {
    feature_category: "ai_content",
    page_section: "aio_answers",
    project_id: projectId,
  });

  const [aioAnswers, setAIOAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAnswerRows, setSelectedAnswerRows] = useState([]);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [contentArchitectureDataId, setContentArchitectureDataId] = useState(
    null
  );

  // Ref to track if it's the first fetch
  const hasFetchedRef = useRef(false);
  const processedHighlightRef = useRef(null);
  const highlightSuccessToastRef = useRef(null);
  const highlightErrorToastRef = useRef(null);

  const fetchAIOAnswers = async ({
    showLoader = true,
    resetData = false,
  } = {}) => {
    const currentProjectId = selectedProject?.id || projectId;
    if (!currentProjectId) return;

    if (resetData) {
      setAIOAnswers([]);
    }
    if (showLoader) setLoading(true);

    const isInitial = !hasFetchedRef.current;

    trackFeatureAction("aio_answers_fetch_started", {
      project_id: currentProjectId,
      is_initial: isInitial,
    });

    try {
      const response = await api.get(
        `/aio/answers/?project_id=${currentProjectId}`
      );

      const data = response.data;

      console.log("aio answers data----------", data);

      if (data.results) {
        setContentArchitectureDataId(
          data.content_architecture_data_id || null
        );
        const processed = data.results.map((answer) => {
          let ragOutput = {};
          let title = answer.title || "Untitled Answer";

          try {
            if (answer.rag_output) {
              const jsonString = answer.rag_output.replace(
                /```json\n|\n```/g,
                ""
              );
              ragOutput = JSON.parse(jsonString);

              console.log("ragOutput----------", ragOutput);
            }
          } catch (e) {
            console.error(
              "Failed to parse rag_output for answer:",
              answer._id,
              e
            );
          }

          const marketing = ragOutput?.marketing || {};

          return {
            ...answer,
            id: answer._id,
            page_id:
              answer.page_id ||
              answer.page_location?.page_id ||
              answer.page_location?.id,
            page_location: answer.page_location,
            title,
            question: answer.question || "No question provided",
            question_id: answer.question_id || answer._id, // Store the question ID for linking back to AI Optimizations
            type: answer.type || "AIO Answer",
            company_name:
              answer.company_name || ragOutput?.company?.company_name,
            target_customers: marketing.target_customers || [],
            target_markets: marketing.target_markets || [],
            key_differentiators: marketing.key_differentiators || [],
            additional_keywords: marketing.additional_keywords || [],
            status: answer.status || "draft",
            stage: answer.stage || "review",
            updatedAt: answer.updatedAt || answer.createdAt,
            createdAt: answer.createdAt,
          };
        });
        setAIOAnswers(processed);

        trackFeatureAction("aio_answers_fetch_success", {
          project_id: currentProjectId,
          is_initial: isInitial,
          answers_count: processed.length,
        });
      } else {
        throw new Error("Failed to fetch AIO answers.");
      }
    } catch (err) {
      console.error("Error fetching AIO answers:", err);

      trackFeatureAction("aio_answers_fetch_failed", {
        project_id: currentProjectId,
        is_initial: isInitial,
        error_message: err.message || "Failed to fetch AIO answers",
      });

      toast.error(err.message || "Failed to fetch AIO answers.");
    } finally {
      if (showLoader) setLoading(false);
      hasFetchedRef.current = true;
    }
  };

  useEffect(() => {
    const currentProjectId = selectedProject?.id || projectId;
    if (!currentProjectId) return;

    fetchAIOAnswers({ showLoader: true, resetData: true });

    const interval = setInterval(() => {
      fetchAIOAnswers({ showLoader: false });
    }, 1000 * 60 * 1);

    return () => clearInterval(interval);
  }, [selectedProject?.id, projectId]);

  // Track AIO answers selection changes
  const handleAnswerSelectionChange = useCallback(
    (selectedRows) => {
      const previousCount = selectedAnswerRows.length;
      const newCount = selectedRows.length;

      trackFeatureAction("aio_answers_selection_changed", {
        project_id: selectedProject?.id || projectId,
        previous_selected_count: previousCount,
        new_selected_count: newCount,
        selection_delta: newCount - previousCount,
      });

      setSelectedAnswerRows(selectedRows);
    },
    [selectedProject?.id, projectId, selectedAnswerRows.length]
  );

  const refreshAIOAnswers = ({ showLoader = true, resetData = false } = {}) => {
    trackFeatureAction("aio_answers_manual_refresh", {
      project_id: selectedProject?.id || projectId,
      trigger: "user_action",
    });

    fetchAIOAnswers({ showLoader, resetData });
    setSelectedAnswerRows([]);
    setSelectionVersion((v) => v + 1);
  };

  const cleanupHighlightParams = useCallback(() => {
    if (typeof window === "undefined") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("highlight");
    currentUrl.searchParams.delete("autoScroll");
    currentUrl.searchParams.delete("auto_scroll");
    router.replace(currentUrl.pathname + currentUrl.search, {
      scroll: false,
    });
  }, [router]);

  // Handle highlighting/selecting a specific answer when navigated from AI Optimizations
  useEffect(() => {
    if (!highlightAnswerId) return;
    if (processedHighlightRef.current === highlightAnswerId) return;
    if (aioAnswers.length === 0) return;

    const answerToHighlight = aioAnswers.find(
      (answer) =>
        answer.id === highlightAnswerId ||
        answer._id === highlightAnswerId ||
        answer.question_id === highlightAnswerId
    );

    if (!answerToHighlight) {
      if (highlightErrorToastRef.current !== highlightAnswerId) {
        toast.error("Could not find the specified answer in AIO Answers.");
        highlightErrorToastRef.current = highlightAnswerId;
      }
      cleanupHighlightParams();
      processedHighlightRef.current = highlightAnswerId;
      return;
    }

    setSelectedAnswerRows([answerToHighlight]);

    if (highlightSuccessToastRef.current !== highlightAnswerId) {
      toast.success(
        `Found and selected answer: "${answerToHighlight.question}"`
      );
      highlightSuccessToastRef.current = highlightAnswerId;
    }

    if (!autoScrollFromUrl) {
      // If regular highlight (no auto scroll), clean up the URL after a short delay
      const timeoutId = setTimeout(() => {
        cleanupHighlightParams();
      }, 5000);

      return () => clearTimeout(timeoutId);
    }

    processedHighlightRef.current = highlightAnswerId;
  }, [
    highlightAnswerId,
    autoScrollFromUrl,
    aioAnswers,
    cleanupHighlightParams,
  ]);

  return (
    <div className="w-full px-4 mt-2" style={{ backgroundColor: "#FAFAFA", minHeight: "calc(100vh - 100px)" }}>
      <div className="max-w-full mx-auto space-y-4 py-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
          Parent Q&A (AIO)
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Review and manage your AI-generated answers
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] w-full min-w-0 gap-4">
          <div
            className={`transition-all duration-300 ${
              isCollapsed ? "w-16" : "w-72"
            } min-w-0`}
          >
            <SourcePanelAIOAnswers
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              selectedAIOAnswerRows={selectedAnswerRows}
              onAIOAnswersUpdate={refreshAIOAnswers}
              contentArchitectureDataId={contentArchitectureDataId}
              projectId={selectedProject?.id || projectId}
            />
          </div>

          <div className="min-w-0 w-full overflow-x-auto transition-all duration-300">
            <AIOAnswersTable
              answerData={aioAnswers}
              loading={loading}
              onSelectionChange={handleAnswerSelectionChange}
              selectedAnswerRows={selectedAnswerRows}
              projectId={selectedProject?.id || projectId}
              highlightAnswerId={highlightAnswerId}
              autoScrollEnabled={autoScrollFromUrl}
              onAutoScrollSettled={({ success }) => {
                if (success) {
                  cleanupHighlightParams();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
