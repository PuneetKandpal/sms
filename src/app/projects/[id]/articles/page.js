"use client";
import { use, useEffect, useState, useRef, useCallback } from "react";
import { useSelection } from "../../../context/SelectionContext";
import ArticlesTable from "../../../components/ArticlesTable";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import api from "../../../../api/axios";
import toast from "react-hot-toast";
import { FiSidebar } from "react-icons/fi";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";

export default function ArticlesPage({ params }) {
  const { id: projectId } = use(params);
  const { selectedProject } = useSelection();
  const router = useRouter();

  // Redirect to manage page since this feature is disabled
  useEffect(() => {
    router.replace(`/projects/${projectId}/manage`);
  }, [projectId, router]);

  return null;

  const { trackFeatureAction } = useFeatureTracking();
  const searchParams = useSearchParams();
  const highlightArticleId = searchParams.get("highlight");
  const autoScrollFromUrl =
    searchParams.get("autoScroll") === "true" ||
    searchParams.get("auto_scroll") === "true";
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();

  useTrackFeatureExploration("articles");

  // Knowledge base gate state
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);

  // Check if company research data exists
  useEffect(() => {
    if (!projectId) return;

    const checkCompanyResearch = async () => {
      try {
        const response = await api.get(
          `/keyword-api/company-research-data/exists/?project_id=${projectId}`
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
  }, [projectId]);

  // Track feature usage
  useFeatureTracking("Content", {
    feature_category: "content_management",
    page_section: "articles",
    project_id: projectId,
  });

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedArticleRows, setSelectedArticleRows] = useState([]);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(null);

  // Form state for article creation
  const [articleForm, setArticleForm] = useState({
    title: "",
    overview: "",
    blueprint_template: "",
    categories_structure_context: "",
  });

  // Ref to track if it's the first fetch
  const hasFetchedRef = useRef(false);
  const processedHighlightRef = useRef(null);
  const highlightSuccessToastRef = useRef(null);
  const highlightErrorToastRef = useRef(null);

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

  const fetchArticles = async (isInitial = false) => {
    const currentProjectId = selectedProject?.id || projectId;
    if (!currentProjectId) return;

    // Only show loading indicator on the first fetch
    if (isInitial) setLoading(true);

    try {
      const response = await api.get(
        `/article-writer/articles/by-project/?project_id=${currentProjectId}`
      );
      const data = response.data;

      if (data.status === "success") {
        const processed = data.articles.map((article) => {
          let ragOutput = {};
          let title = "Untitled Article";
          let type = "Article";

          try {
            if (article.rag_output) {
              const jsonString = article.rag_output.replace(
                /```json\n|\n```/g,
                ""
              );
              ragOutput = JSON.parse(jsonString);

              console.log("ragOutput----------", ragOutput);
            }
          } catch (e) {
            console.error(
              "Failed to parse rag_output for article:",
              article.article_id,
              e
            );
          }

          if (article.title) {
            title = article.title;
          } else if (ragOutput.product_name) {
            title = ragOutput.product_name;
          } else if (article.generated_content) {
            const lines = article.generated_content.split(`\n`);
            for (const line of lines) {
              const trimmed = line.trim();
              if (
                trimmed.startsWith("#") ||
                (trimmed.length > 0 && !trimmed.startsWith("["))
              ) {
                title = trimmed.replace(/^#+\s*/, "");
                break;
              }
            }
          }

          if (ragOutput.brand_tone) {
            type = ragOutput.brand_tone;
          }

          return {
            ...article,
            id: article.article_id,
            page_id: article.page_id || article.pageId || null,
            title,
            description:
              article.overview ||
              ragOutput.product_overview ||
              "No description provided.",
            type,
            company_name: ragOutput.company_name,
            target_customers: ragOutput.target_customers || [],
            target_markets: ragOutput.target_markets || [],
            key_differentiators: ragOutput.key_differentiators || [],
            additional_keywords: ragOutput.additional_keywords || [],
            status: article.status || "draft",
            stage: article.stage || "review",
            updatedAt: article.updated_at || article.createdAt,
          };
        });
        setArticles(processed);
      } else {
        throw new Error(data.message || "Failed to fetch articles.");
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      toast.error(err.message || "Failed to fetch articles.");
    } finally {
      if (isInitial) setLoading(false);
      hasFetchedRef.current = true;
    }
  };

  useEffect(() => {
    const currentProjectId = selectedProject?.id || projectId;
    if (!currentProjectId) return;

    // Initial fetch
    fetchArticles(true);

    // Poll every minute
    const interval = setInterval(() => {
      fetchArticles(false);
    }, 1000 * 60 * 1); // every 1 minute

    return () => clearInterval(interval);
  }, [selectedProject?.id, projectId]);

  const refreshArticles = async ({ showLoader = true } = {}) => {
    await fetchArticles(showLoader);
    setSelectedArticleRows([]);
    setSelectionVersion((v) => v + 1);
  };

  const updateSelectedArticlesStage = async (stage) => {
    const currentProjectId = selectedProject?.id || projectId;

    if (!currentProjectId) {
      toast.error("Project ID is required.");
      return;
    }

    if (
      !Array.isArray(selectedArticleRows) ||
      selectedArticleRows.length === 0
    ) {
      toast.error("Please select at least one article.");
      return;
    }

    const articleIds = selectedArticleRows
      .map((article) => article.id || article.article_id)
      .filter(Boolean);

    if (articleIds.length === 0) {
      toast.error("No valid articles selected.");
      return;
    }

    setUpdatingStage(stage);

    trackFeatureAction("article_stage_update_started", {
      feature_category: "content_management",
      page_section: "articles",
      project_id: currentProjectId,
      stage,
      selected_count: articleIds.length,
    });

    try {
      const response = await api.post("/article-writer/update-stage/", {
        project_id: currentProjectId,
        article_ids: articleIds,
        stage,
      });

      toast.success(
        response?.data?.message ||
          `${articleIds.length} article(s) updated successfully!`
      );

      trackFeatureAction("article_stage_update_success", {
        feature_category: "content_management",
        page_section: "articles",
        project_id: currentProjectId,
        stage,
        selected_count: articleIds.length,
      });

      await refreshArticles({ showLoader: true });

      if (stage?.toLowerCase() === "approved") {
        if (instantRefreshAfterTaskStart) {
          await instantRefreshAfterTaskStart();
        }
        if (setIsDrawerOpen) {
          setIsDrawerOpen(true);
        }
      }
    } catch (error) {
      trackFeatureAction("article_stage_update_failed", {
        feature_category: "content_management",
        page_section: "articles",
        project_id: currentProjectId,
        stage,
        selected_count: articleIds.length,
        error: error.response?.data?.message || error.message,
      });

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update article stage."
      );
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleCreateArticle = async () => {
    // Validate required fields
    if (!articleForm.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!articleForm.overview.trim()) {
      toast.error("Please enter an overview.");
      return;
    }

    const currentProjectId = selectedProject?.id || projectId;
    if (!currentProjectId) {
      toast.error("Project ID is required.");
      return;
    }

    setIsCreating(true);
    try {
      trackFeatureAction("article_creation_started", {
        action_type: "content_creation",
        title: articleForm.title,
        has_blueprint: !!articleForm.blueprint_template.trim(),
        has_categories: !!articleForm.categories_structure_context.trim(),
      });

      const response = await api.post(
        "/article-writer/generate-from-context/",
        {
          project_id: currentProjectId,
          title: articleForm.title,
          overview: articleForm.overview,
          blueprint_template: articleForm.blueprint_template,
          categories_structure_context:
            articleForm.categories_structure_context,
        }
      );

      const data = response.data;
      console.log("data", data);

      toast.success(data.message || "Article creation initiated successfully!");

      trackFeatureAction("article_creation_success", {
        action_type: "content_creation_success",
      });

      setShowCreateModal(false);
      setArticleForm({
        title: "",
        overview: "",
        blueprint_template: "",
        categories_structure_context: "",
      });
      await refreshArticles({ showLoader: true }); // Refresh the articles list
    } catch (error) {
      console.error("Error creating article:", error);

      trackFeatureAction("article_creation_failed", {
        action_type: "content_creation_failed",
        error: error.response?.data?.message || error.message,
      });

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create article."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setArticleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setArticleForm({
      title: "",
      overview: "",
      blueprint_template: "",
      categories_structure_context: "",
    });
  };

  // Handle highlighting/selecting a specific article when navigated from Topics
  useEffect(() => {
    if (!highlightArticleId) return;
    if (processedHighlightRef.current === highlightArticleId) return;
    if (articles.length === 0) return;

    const articleToHighlight = articles.find(
      (article) =>
        article.id === highlightArticleId ||
        article.article_id === highlightArticleId
    );

    if (!articleToHighlight) {
      if (highlightErrorToastRef.current !== highlightArticleId) {
        toast.error("Could not find the specified article.");
        highlightErrorToastRef.current = highlightArticleId;
      }
      cleanupHighlightParams();
      processedHighlightRef.current = highlightArticleId;
      return;
    }

    setSelectedArticleRows([articleToHighlight]);

    if (highlightSuccessToastRef.current !== highlightArticleId) {
      toast.success(
        `Found and selected article: "${articleToHighlight.title}"`
      );
      highlightSuccessToastRef.current = highlightArticleId;
    }

    if (!autoScrollFromUrl) {
      // If regular highlight (no auto scroll), clean up the URL after a short delay
      const timeoutId = setTimeout(() => {
        cleanupHighlightParams();
      }, 5000);

      return () => clearTimeout(timeoutId);
    }

    processedHighlightRef.current = highlightArticleId;
  }, [
    highlightArticleId,
    autoScrollFromUrl,
    articles,
    cleanupHighlightParams,
  ]);

  // Knowledge base gate - show modal if company research doesn't exist
  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="w-full p-4" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="mx-auto space-y-2 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
            Content
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Review, edit, and publish your content
          </p>

          <div className="flex items-center justify-center pt-28">
            <KnowledgeBaseGateAlert
              projectId={projectId}
              description="Add your school research sources in the knowledge base before creating articles."
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 mt-2" style={{ backgroundColor: "#FAFAFA", minHeight: "calc(100vh - 100px)" }}>
      <div className="max-w-full mx-auto space-y-4 py-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
          Content
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Review, edit, and publish your content
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] w-full min-w-0 gap-4">
          <div
            className={`transition-all duration-300 ${
              isCollapsed ? "w-16" : "w-72"
            } min-w-0`}
          >
            {/* Actions Panel */}
            <div className="flex flex-col gap-4">
              <div
                className={`bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
                  isCollapsed ? "w-16" : "w-72"
                }`}
              >
                <div className="flex bg-gray-100 py-4 px-4 items-center justify-between">
                  {!isCollapsed && (
                    <h2 className="text-gray-900 font-semibold text-lg">
                      Actions
                    </h2>
                  )}
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
                    title={isCollapsed ? "Expand panel" : "Collapse panel"}
                  >
                    <FiSidebar className="w-4 h-4 text-sky-600" />
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="p-4">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="w-full py-3 px-4 bg-sky-600 text-white rounded-md font-medium hover:bg-sky-700 transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Create Article
                    </button>

                    <div className="mt-4">
                      <div className="text-xs text-gray-600 mb-2">
                        Selected: {selectedArticleRows.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateSelectedArticlesStage("approved")
                          }
                          disabled={
                            !!updatingStage || selectedArticleRows.length === 0
                          }
                          className="w-full py-2 px-2 bg-sky-600 text-white rounded-md font-medium hover:bg-sky-700 transition-colors duration-150 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStage === "approved"
                            ? "Approving"
                            : "Approve"}
                        </button>
                        <button
                          onClick={() =>
                            updateSelectedArticlesStage("rejected")
                          }
                          disabled={
                            !!updatingStage || selectedArticleRows.length === 0
                          }
                          className="w-full py-2 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors duration-150 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStage === "rejected"
                            ? "Rejecting"
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 w-full overflow-x-auto transition-all duration-300">
            <ArticlesTable
              articleData={articles}
              loading={loading}
              onSelectionChange={setSelectedArticleRows}
              selectedArticleRows={selectedArticleRows}
              projectId={selectedProject?.id || projectId}
            />
          </div>
        </div>
      </div>

      {/* Create Article Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Article
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter article title..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>

                {/* Overview Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overview <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={articleForm.overview}
                    onChange={(e) =>
                      handleInputChange("overview", e.target.value)
                    }
                    placeholder="Provide a detailed overview of the article content..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>

                {/* Blueprint Template Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blueprint Template
                  </label>
                  <textarea
                    value={articleForm.blueprint_template}
                    onChange={(e) =>
                      handleInputChange("blueprint_template", e.target.value)
                    }
                    placeholder="Enter blueprint template structure (e.g., ├── DISCOVER (/learn) - Learn...)"
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono text-sm"
                    disabled={isCreating}
                  />
                </div>

                {/* Categories Structure Context Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories Structure Context
                  </label>
                  <textarea
                    value={articleForm.categories_structure_context}
                    onChange={(e) =>
                      handleInputChange(
                        "categories_structure_context",
                        e.target.value
                      )
                    }
                    placeholder="Enter categories structure context (JTBD Task Page format, blocks, etc.)..."
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArticle}
                disabled={
                  isCreating ||
                  !articleForm.title.trim() ||
                  !articleForm.overview.trim()
                }
                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  "Create Article"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
