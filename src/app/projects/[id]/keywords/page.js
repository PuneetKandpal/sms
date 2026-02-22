"use client";
import { use, useCallback } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import KeywordTable from "../../../components/KeywordTable";
import api from "../../../../api/axios";
import SourcesPanel from "../../../components/SourcePanel";
import { useSelection } from "../../../context/SelectionContext";
import KeywordTableSkeleton from "../../../components/shimmer/KeywordTableSkeleton";
import SourcePanelSkeleton from "../../../components/shimmer/SourcePanelSkeleton";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function KeywordsPage({ params }) {
  const { id } = use(params);

  useTrackFeatureExploration("keywords");

  // Track feature usage
  useFeatureTracking("Keywords", {
    feature_category: "content_management",
    page_section: "keywords",
    project_id: id,
  });

  console.log("KeywordsPage id------->", id);
  const searchParams = useSearchParams();
  const domainId = searchParams.get("domain");
  const componentId = searchParams.get("component");

  const [project, setProject] = useState(null);
  const [domain, setDomain] = useState(null);
  const [loading, setLoading] = useState(false); // only for keyword updates
  const [initialLoading, setInitialLoading] = useState(true); // for first-time page load
  const [sources, setSources] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [keywordData, setKeywordData] = useState([]);
  const [selectedKeywordRows, setSelectedKeywordRows] = useState([]);
  const [selectionVersion, setSelectionVersion] = useState(0);

  const { selectedProject } = useSelection();

  async function fetchData() {
    try {
      const projectId = id ? id : selectedProject?.id;
      if (!projectId) return;
      console.log("fetching data, Project Id: ", id);

      trackFeatureAction("keywords_project_data_fetch_started", {
        project_id: projectId,
      });

      // Fetch project data
      const projectRes = await api.get(`/auth/projects/${projectId}/`);
      const projectData = projectRes.data;
      setProject(projectData);
      setSources(projectData?.sources || []);

      trackFeatureAction("keywords_project_data_fetch_success", {
        project_id: projectId,
        sources_count: projectData?.sources?.length || 0,
      });

      // Fetch domain data
      if (componentId && domainId) {
        const domainsRes = await api.get(
          `/auth/domains-by-component/?component_id=${componentId}`
        );
        const domainsData = domainsRes.data;
        const currentDomain = domainsData.find((d) => d.id === domainId);
        setDomain(currentDomain);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setInitialLoading(false); // ✅ Initial load ends here
    }
  }

  // Track keyword selection changes
  const handleKeywordSelectionChange = useCallback(
    (selectedRows) => {
      const previousCount = selectedKeywordRows.length;
      const newCount = selectedRows.length;

      trackFeatureAction("keywords_selection_changed", {
        project_id: id || selectedProject?.id,
        previous_selected_count: previousCount,
        new_selected_count: newCount,
        selection_delta: newCount - previousCount,
      });

      setSelectedKeywordRows(selectedRows);
    },
    [id, selectedProject?.id, selectedKeywordRows.length]
  );

  useEffect(() => {
    fetchData();
  }, [id, componentId, domainId]);

  const fetchKeywords = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        const projectId = id ? id : selectedProject?.id;
        if (!projectId) return;
        console.log("fetching keywords, Project Id: ", projectId);

        if (showLoader) {
          setLoading(true);
        }

        trackFeatureAction("keywords_fetch_started", {
          project_id: projectId,
        });

        const response = await api.get(
          `/keyword-api/keywords-info/?projectId=${projectId}`
        );
        const data = response.data;
        console.log(data, "allrespinseData");

        trackFeatureAction("keywords_fetch_success", {
          project_id: projectId,
          keywords_count: data?.keywords?.length || 0,
        });

        let processedData = [];
        if (Array.isArray(data)) {
          processedData = data;
        } else if (data && Array.isArray(data.keywords)) {
          processedData = data.keywords;

          console.log("processedData -------", processedData[0]);
        } else {
          throw new Error("Invalid data format received from API");
        }
        setKeywordData(
          processedData.map((item) => ({
            ...item,
            id: item._id,
          }))
        );
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        if (showLoader) {
          setLoading(false); // ✅ only for keyword updates
        }
      }
    },
    [id, selectedProject?.id]
  );

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  useEffect(() => {
    const handler = (event) => {
      const projectId = id ? id : selectedProject?.id;
      const eventProjectId = event?.detail?.project_id;
      if (eventProjectId && projectId && String(eventProjectId) !== String(projectId)) {
        return;
      }
      fetchKeywords({ showLoader: false });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keywords:background-refresh", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keywords:background-refresh", handler);
      }
    };
  }, [fetchKeywords, id, selectedProject?.id]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchKeywords({ showLoader: false });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchKeywords]);

  const refreshProjectData = async () => {
    const projectId = id ? id : selectedProject?.id;

    trackFeatureAction("keywords_refresh_started", {
      project_id: projectId,
    });

    try {
      await fetchData();

      trackFeatureAction("keywords_refresh_success", {
        project_id: projectId,
      });
    } catch (err) {
      console.error("Error refreshing project data:", err);

      trackFeatureAction("keywords_refresh_failed", {
        project_id: projectId,
        error_message: err.message,
      });
    }
  };

  // // ✅ Only show loading page during first load
  // if (initialLoading)
  //   return (
  //     <div className="flex w-full gap-4">
  //       <SourcePanelSkeleton isCollapsed={isCollapsed} />
  //       <KeywordTableSkeleton />
  //     </div>
  //   );
  if (!project && !initialLoading)
    return <div className="p-4 text-red-500">Project not found</div>;

  return (
    <div className="w-full px-4 mt-2" style={{ backgroundColor: "#FAFAFA", minHeight: "calc(100vh - 100px)" }}>
      <div className="max-w-full mx-auto space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
          Enrollment Keywords
        </h1>

        <div className="space-y-2">
          <p className="text-base sm:text-lg text-gray-600">
            Use in all AI tools and workflows
          </p>
          <p className="text-sm sm:text-base text-gray-600">
            Add keywords information to the AI knowledge base and start creating
            campaigns immediately
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] w-full min-w-0 gap-4">
          {/* SourcesPanel with animated width */}
          <div
            className={`transition-all duration-300 ${
              isCollapsed ? "w-16" : "w-72"
            } min-w-0`}
          >
            {initialLoading ? (
              <SourcePanelSkeleton isCollapsed={isCollapsed} />
            ) : (
              <SourcesPanel
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                domainId={domainId}
                componentId={componentId}
                setSources={setSources}
                sources={sources}
                onSourceAdded={refreshProjectData}
                fetchKeywords={fetchKeywords}
                selectedKeywordRows={selectedKeywordRows}
                setSelectedKeywordRows={setSelectedKeywordRows}
                onStatusUpdate={() => setSelectionVersion((v) => v + 1)}
              />
            )}
          </div>

          {/* KeywordTable takes the rest of the space */}
          <div className="min-w-0 w-full overflow-x-auto transition-all duration-300">
            {initialLoading || loading ? (
              <KeywordTableSkeleton />
            ) : (
              <KeywordTable
                projectName={project.project_name}
                domainName={domain?.domain_name || domain?.name || "Domain"}
                projectId={project?.id}
                domainId={domainId}
                componentId={componentId}
                setSources={setSources}
                selectedProject={selectedProject}
                sources={sources}
                onSourceAdded={refreshProjectData}
                setIsCollapsed={setIsCollapsed}
                isCollapsed={isCollapsed}
                keywordData={keywordData}
                setKeywordData={setKeywordData}
                loading={loading}
                onSelectionChange={handleKeywordSelectionChange}
                selectionKey={selectionVersion}
                onRefreshKeywords={fetchKeywords}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
