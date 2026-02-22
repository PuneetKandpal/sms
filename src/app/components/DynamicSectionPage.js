"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../api/axios";
import {
  GET_PROJECT_BY_ID_API,
  GET_COMPONENTS_API,
  GET_DOMAINS_BY_COMPONENT_API,
  ADD_COMPONENT_DOMAIN_API,
} from "../api/jbiAPI";
import { useSelection } from "../context/SelectionContext";
import { Box, Container, Grid, Skeleton } from "@mui/material";
import useFeatureTracking from "../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../lib/analytics/featureTracking";

export default function DynamicSectionPage({ params, section }) {
  const { id } = use(params);
  const router = useRouter();

  // Track feature usage
  useFeatureTracking("Section", {
    feature_category: "project_management",
    page_section: "section",
    project_id: id,
    section_name: section,
  });

  const [project, setProject] = useState(null);
  const [domains, setDomains] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [componentName, setComponentName] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState(null);
  const { selectedProject } = useSelection();

  // Function to get sources count for a specific domain
  const getSourcesCountForDomain = (domainId) => {
    return sources.filter((source) => source.domain_id === domainId).length;
  };

  useEffect(() => {
    async function fetchData() {
      const projectId = id ? id : selectedProject?.id;
      if (!projectId) return;

      trackFeatureAction("dynamic_section_data_fetch_started", {
        project_id: projectId,
        section_name: section,
      });

      try {
        // Fetch project data
        const projectRes = await api.get(`/auth/projects/${projectId}/`);
        const projectData = projectRes.data;

        console.log(
          "projectData --------------------------------->>",
          projectData
        );
        setProject(projectData);
        setSources(projectData?.sources || []);

        // Fetch component name
        const componentsRes = await api.get("/auth/components/");
        const componentsData = componentsRes.data;
        const currentComponent = componentsData.find(
          (comp) => comp.id === section
        );

        setComponentName(currentComponent?.component_name || "");

        // Fetch domains for this component
        const domainsRes = await api.get(
          `/auth/domains-by-component/?component_id=${section}`
        );
        const domainsData = domainsRes.data;

        console.log("domainsData", domainsData);
        setDomains(domainsData);

        trackFeatureAction("dynamic_section_data_fetch_success", {
          project_id: projectId,
          section_name: section,
          sources_count: projectData?.sources?.length || 0,
          domains_count: domainsData?.length || 0,
          component_name: currentComponent?.component_name || "unknown",
        });
      } catch (err) {
        console.error("Error fetching data:", err);

        trackFeatureAction("dynamic_section_data_fetch_failed", {
          project_id: projectId,
          section_name: section,
          error_message: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, section, selectedProject]);

  const handleSectionClick = async (domain) => {
    try {
      setSelectedDomainId(domain.id);

      trackFeatureAction("domain_selection_started", {
        project_id: selectedProject?.id,
        section_name: section,
        domain_id: domain.id,
        domain_name: domain.domain_name,
      });

      // Send POST request to track domain selection
      const response = await api.post("/api/component-domain-add/", {
        project_id: selectedProject?.id,
        component_id: section,
        domain_id: domain.id,
      });

      console.log("domain", domain);

      // Check if this is the Keyword Repository component
      const isKeywordRepository = componentName
        .toLowerCase()
        .includes("keyword");

      const isTopicRepository = domain.domain_name
        .toLowerCase()
        .includes("topic");

      const isArticleRepository = domain.domain_name
        .toLowerCase()
        .includes("article");

      const isAIOptimizations =
        domain.domain_name.toLowerCase().includes("ai") &&
        domain.domain_name.toLowerCase().includes("optimization");

      const isAIOanswers =
        domain.domain_name.toLowerCase().includes("ai") &&
        domain.domain_name.toLowerCase().includes("answers");

      console.log("isAIOanswers", isAIOanswers);
      console.log("domain.domain_name", domain.domain_name);

      console.log("isAIOptimizations", isAIOptimizations);

      if (response.ok || true) {
        // Continue even if API fails
        if (isKeywordRepository) {
          // Route to keywords page for Keyword Repository
          router.push(
            `/projects/${selectedProject?.id}/keywords?component=${section}&domain=${domain.id}`
          );
        } else if (isTopicRepository) {
          router.push(
            `/projects/${selectedProject?.id}/topic?component=${section}&domain=${domain.id}`
          );
        } else if (isArticleRepository) {
          router.push(
            `/projects/${selectedProject?.id}/articles?component=${section}&domain=${domain.id}`
          );
        } else if (isAIOptimizations) {
          router.push(
            `/projects/${selectedProject?.id}/ai-optimizations?component=${section}&domain=${domain.id}`
          );
        } else if (isAIOanswers) {
          router.push(
            `/projects/${selectedProject?.id}/aio-answers?component=${section}&domain=${domain.id}`
          );
        } else {
          // Route to manage page for other components
          router.push(
            `/projects/${selectedProject?.id}/manage?component=${section}&domain=${domain.id}`
          );
        }
      }
    } catch (error) {
      console.error("Error adding component domain:", error);
      // Still navigate even if there's an error
      const isKeywordRepository = componentName
        .toLowerCase()
        .includes("keyword");

      if (isKeywordRepository) {
        router.push(
          `/projects/${selectedProject?.id}/keywords?component=${section}&domain=${domain.id}`
        );
      } else if (isTopicRepository) {
        router.push(
          `/projects/${selectedProject?.id}/topic?component=${section}&domain=${domain.id}`
        );
      } else if (isArticleRepository) {
        router.push(
          `/projects/${selectedProject?.id}/articles?component=${section}&domain=${domain.id}`
        );
      } else {
        router.push(
          `/projects/${selectedProject?.id}/manage?component=${section}&domain=${domain.id}`
        );
      }
    }
  };

  if (loading) {
    // Skeleton UI placeholders
    return (
      <Container sx={{ py: 4 }} maxWidth="lg">
        <Box sx={{ mb: 4, gap: 1, display: "flex", flexDirection: "column" }}>
          <Skeleton variant="text" width="70%" height={60} />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="40%" />
        </Box>
        <Grid container spacing={4}>
          {Array.from(new Array(4)).map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Skeleton
                variant="rectangular"
                height={150}
                width={330}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }
  if (!project)
    return <div className="p-4 text-red-500">Project not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          <span className="text-primary">{project.project_name} </span>{" "}
          {componentName}
        </h1>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {componentName} domains and configurations
          </p>
          <p className="text-gray-600">
            Manage your {componentName.toLowerCase()} domains and settings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => {
            const sourcesCount = getSourcesCountForDomain(domain.id);
            const isKeywordRepository = componentName
              .toLowerCase()
              .includes("keyword");

            return (
              <div
                key={domain.id}
                onClick={() => handleSectionClick(domain)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {domain.domain_name || domain.name || "Domain"}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {domain.domain_desc ||
                    domain.description ||
                    `Click to ${
                      isKeywordRepository ? "view keywords for" : "manage"
                    } this domain`}
                </p>
                <div className="flex items-center justify-between text-sm">
                  {sourcesCount > 0 && !isKeywordRepository && (
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-sm font-medium rounded-full">
                      Ready
                    </span>
                  )}
                  {isKeywordRepository && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                      Keywords
                    </span>
                  )}
                  <span className="text-gray-500 ml-auto">
                    {isKeywordRepository
                      ? "View Keywords →"
                      : sourcesCount > 0
                      ? `${sourcesCount} Source${sourcesCount !== 1 ? "s" : ""}`
                      : "+ Manage"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
