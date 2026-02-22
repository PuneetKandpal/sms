"use client";

import { use, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import TopicsTable from "../../../components/TopicsTable";
import SourcesPanelTopic from "../../../components/SourcePanelTopic";
import { useSelection } from "../../../context/SelectionContext";
import api from "../../../../api/axios";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function TopicPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  useTrackFeatureExploration("topics");

  // Knowledge base gate state
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);

  // Check if company research data exists
  useEffect(() => {
    if (!id) return;

    const checkCompanyResearch = async () => {
      try {
        const response = await api.get(
          `/keyword-api/company-research-data/exists/?project_id=${id}`
        );

        if (response.data?.exists) {
          setHasCompanyResearch(true);
        } else {
          setHasCompanyResearch(false);
        }
      } catch (err) {
        console.error("Error checking company research data:", err);
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };

    checkCompanyResearch();
  }, [id]);

  // Track feature usage
  useFeatureTracking("Topic", {
    feature_category: "content_management",
    page_section: "topic",
    project_id: id,
  });

  console.log("🔄 TopicPage RENDER - id:", id);
  const searchParams = useSearchParams();
  const domainId = searchParams.get("domain");
  const componentId = searchParams.get("component");

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
    trackFeatureAction("panel_collapse_toggled", {
      project_id: id || selectedProject?.id,
      is_collapsed: !isCollapsed,
      panel_type: "sources_panel",
    });
  };
  const [selectedTopicRows, setSelectedTopicRows] = useState([]);
  const [sources, setSources] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastErrorMessage, setLastErrorMessage] = useState("");
  const fetchingRef = useRef(false);

  const { selectedProject } = useSelection();

  const fetchTopics = useCallback(
    async ({ showLoader = true, preserveData = false } = {}) => {
      // Prevent concurrent requests
      if (fetchingRef.current) {
        console.log("🚫 fetchTopics: Already fetching, skipping...");
        return;
      }

      const projectId = id || selectedProject?.id;
      if (!projectId) {
        console.log("🚫 fetchTopics: No project ID, skipping...");
        return;
      }

      console.log("🚀 fetchTopics: Starting API call for project:", projectId);
      if (!preserveData) {
        setTopicData([]);
      }
      fetchingRef.current = true;
      if (showLoader) {
        setLoading(true);
      }

      trackFeatureAction("topics_fetch_started", {
        project_id: projectId,
        source_count: sources.length,
      });

      try {
        const response = await api.get(
          `/topic-gen/get-topics/?project_id=${projectId}`
        );
        const data = response.data;

        setTopicData(
          (data.topics || []).map((topic) => ({
            ...topic,
            id: topic._id,
            article_status:
              topic.article_current_stage ||
              topic.article_status ||
              (topic.article_generated ? "Generated" : null),
          }))
        );
        console.log("✅ fetchTopics: API call successful");

        trackFeatureAction("topics_fetch_success", {
          project_id: projectId,
          topics_count: data.topics?.length || 0,
        });
      } catch (err) {
        console.error("❌ fetchTopics API Error:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to fetch topics.";

        trackFeatureAction("topics_fetch_failed", {
          project_id: projectId,
          error_message: errorMessage,
        });

        // Only show toast if it's a different error message to prevent duplicates
        if (errorMessage !== lastErrorMessage) {
          toast.error(errorMessage);
          setLastErrorMessage(errorMessage);
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    },
    [id, selectedProject?.id, lastErrorMessage, sources.length]
  );

  // Memoize the current project ID to prevent unnecessary re-renders
  const currentProjectId = useMemo(() => {
    return id || selectedProject?.id;
  }, [id, selectedProject?.id]);

  // Track topic selection changes
  const handleTopicSelectionChange = useCallback(
    (selectedRows) => {
      const previousCount = selectedTopicRows.length;
      const newCount = selectedRows.length;

      trackFeatureAction("topics_selection_changed", {
        project_id: currentProjectId,
        previous_selected_count: previousCount,
        new_selected_count: newCount,
        selection_delta: newCount - previousCount,
      });

      setSelectedTopicRows(selectedRows);
    },
    [currentProjectId, selectedTopicRows.length]
  );

  // Track manual refresh
  const handleManualRefresh = useCallback(() => {
    trackFeatureAction("topics_manual_refresh", {
      project_id: currentProjectId,
      trigger: "user_action",
    });

    fetchTopics();
  }, [currentProjectId, fetchTopics]);

  useEffect(() => {
    console.log("🎯 useEffect triggered - currentProjectId:", currentProjectId);
    if (currentProjectId) {
      fetchTopics();
    }
  }, [currentProjectId, fetchTopics]);

  useEffect(() => {
    if (!currentProjectId) return;

    const interval = setInterval(() => {
      fetchTopics({ showLoader: false, preserveData: true });
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, [currentProjectId, fetchTopics]);

  // Knowledge base gate - show modal if company research doesn't exist
  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="w-full p-4" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="mx-auto space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-gray-400">
              Strategy &amp; Planning
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
              Topic Strategy
            </h1>
          </div>

          <div className="space-y-2">
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              Turn a single idea into a full-funnel topic system for discovery,
              conversion, and growth.
            </p>
          </div>

          <div className="flex items-center justify-center pt-28">
            <KnowledgeBaseGateAlert
              projectId={id}
              description="Add your company research sources in the knowledge base before generating topics."
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking
  if (!companyResearchChecked) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div
      className="w-full px-4"
      style={{ backgroundColor: "#FAFAFA", minHeight: "calc(100vh - 64px)" }}
    >
      <div className="mx-auto space-y-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
            Topic Strategy
          </h1>
        </div>

        <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
          Turn a single idea into a full-funnel topic system for discovery,
          conversion, and growth.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] w-full min-w-0 gap-4">
          <div
            className={`transition-all duration-300 ${
              isCollapsed ? "w-16" : "w-72"
            } min-w-0`}
          >
            <SourcesPanelTopic
              isCollapsed={isCollapsed}
              setIsCollapsed={handleCollapseToggle}
              domainId={domainId}
              componentId={componentId}
              setSources={setSources}
              sources={sources}
              selectedTopicRows={selectedTopicRows}
              fetchTopics={fetchTopics}
              setSelectedTopicRows={setSelectedTopicRows}
            />
          </div>

          <div className="min-w-0 w-full overflow-x-auto transition-all duration-300">
            <TopicsTable
              onSelectionChange={handleTopicSelectionChange}
              topicData={topicData}
              loading={loading}
              selectedTopicRows={selectedTopicRows}
              onRefresh={handleManualRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
