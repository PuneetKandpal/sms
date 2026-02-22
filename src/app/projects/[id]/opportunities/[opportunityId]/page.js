"use client";
import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  ArrowBack,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Reddit,
  LinkedIn,
  ExpandMore,
  ExpandLess,
  NavigateBefore,
  NavigateNext,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import KnowledgeBaseGateAlert from "../../../../components/KnowledgeBaseGateAlert";
import OpportunityHeader from "./components/OpportunityHeader";
import OpportunityOverview from "./components/OpportunityOverview";
import PostContent from "./components/PostContent";
import RecommendedResponse from "./components/RecommendedResponse";
import ProductRecommendations from "./components/ProductRecommendations";
import JTBDAnalysis from "./components/JTBDAnalysis";
import ActionRecommendations from "./components/ActionRecommendations";
import OpportunityGaps from "./components/OpportunityGaps";
import AIInsights from "./components/AiInsights";
import AIGeneratedResponse from "./components/AIGeneratedResponse";
import EnhancedActionRecommendations from "./components/EnhancedActionRecommendations";
import NewProductOpportunities from "./components/NewProductOpportunities";
import {
  BASE_URL,
  GET_OPPORTUNITY_POST_DETAIL_API,
  GET_AGENT_POSTS_TABLE_API,
} from "../../../../api/jbiAPI";
import api from "../../../../../api/axios";
import useFeatureTracking from "../../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../../lib/analytics/featureTracking";

export default function OpportunityAssessmentPage({ params }) {
  const router = useRouter();
  const { id: projectId, opportunityId } = use(params);

  // Track feature usage
  useFeatureTracking("Opportunity Details", {
    feature_category: "analytics",
    page_section: "opportunity_details",
    project_id: projectId,
    opportunity_id: opportunityId,
  });

  const [opportunity, setOpportunity] = useState(null);
  const [opportunityWIthRawData, setOpportunityWIthRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);

  // Navigation state
  const [opportunitiesList, setOpportunitiesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [opportunityAgentId, setOpportunityAgentId] = useState(null);

  // New state for engagement strategy
  const [engagementStrategy, setEngagementStrategy] = useState(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  useEffect(() => {
    console.log(
      "[Opportunity KB Gate] useEffect fired with projectId:",
      projectId
    );

    if (!projectId) {
      console.warn(
        "[Opportunity KB Gate] No projectId found in params; skipping company research check"
      );
      // Mark as checked so the UI does not hang in a loading state
      setCompanyResearchChecked(true);
      setHasCompanyResearch(false);
      return;
    }

    const checkCompanyResearch = async () => {
      try {
        console.log(
          "[Opportunity KB Gate] Checking company research for project:",
          projectId
        );

        const response = await api.get(
          `/keyword-api/company-research-data/exists/?project_id=${projectId}`
        );

        if (response.data?.exists) {
          console.log(
            "[Opportunity KB Gate] Company research EXISTS for project:",
            projectId
          );
          setHasCompanyResearch(true);
        } else {
          console.log(
            "[Opportunity KB Gate] Company research MISSING for project:",
            projectId
          );
          setHasCompanyResearch(false);
        }
      } catch (checkError) {
        console.error("Error checking company research data:", checkError);
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };

    checkCompanyResearch();
  }, [projectId]);

  useEffect(() => {
    if (
      projectId &&
      opportunityId &&
      companyResearchChecked &&
      hasCompanyResearch
    ) {
      fetchOpportunityData();
    }
  }, [projectId, opportunityId, companyResearchChecked, hasCompanyResearch]);

  // Fetch the opportunities list for navigation
  const fetchOpportunitiesList = async (agentId) => {
    console.log("fetchOpportunitiesList-------", agentId);

    trackFeatureAction("opportunity_list_fetch_started", {
      project_id: projectId,
      agent_id: agentId,
    });

    try {
      const response = await api.get(
        `/opportunity-agent/agent-posts-table/?project_id=${projectId}&opportunity_agent_id=${agentId}`
      );
      const opportunitiesData = response.data;
      if (opportunitiesData.success && opportunitiesData.posts) {
        //console.log("data.posts-------", data.posts);
        setOpportunitiesList(opportunitiesData.posts);
        const currentIdx = opportunitiesData.posts.findIndex(
          (post) => post.id === opportunityId
        );
        setCurrentIndex(currentIdx);

        trackFeatureAction("opportunity_list_fetch_success", {
          project_id: projectId,
          agent_id: agentId,
          opportunities_count: opportunitiesData.posts.length,
          current_index: currentIdx,
        });
      }
    } catch (err) {
      console.error("Failed to fetch opportunities list:", err);
    }
  };

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);

      trackFeatureAction("opportunity_fetch_started", {
        project_id: projectId,
        opportunity_id: opportunityId,
      });

      const response = await api.get(
        `/opportunity-agent/post-detail/?id=${opportunityId}&project_id=${projectId}`
      );

      if (!response.data.success)
        throw new Error("Failed to fetch opportunity data");

      const data = response.data;

      trackFeatureAction("opportunity_fetch_success", {
        project_id: projectId,
        opportunity_id: opportunityId,
        opportunity_title: data.opportunity?.title || "unknown",
      });

      console.log("data-------", data.raw_data.blog_article_recommendation);
      
      if (data.success) {
        setOpportunity({...data.post,  blog_article_recommendation: data.raw_data.blog_article_recommendation});
        setOpportunityWIthRawData(data);


        // Extract opportunity agent ID and fetch opportunities list
        if (data.post?.relationships?.opportunity_agent_id) {
          const agentId = data.post.relationships.opportunity_agent_id;
          setOpportunityAgentId(agentId);
          await fetchOpportunitiesList(agentId);
        }
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load opportunity data");
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch engagement strategy
  const fetchEngagementStrategy = async () => {
    try {
      setIsLoadingStrategy(true);

      trackFeatureAction("engagement_strategy_generation_started", {
        project_id: projectId,
        opportunity_id: opportunityId,
      });

      const response = await api.post(
        `/opportunity-agent/generate-engagement-strategy/`,
        {
          project_id: projectId,
          post_id: opportunityId,
        }
      );

      if (!response.data.success)
        throw new Error("Failed to fetch engagement strategy");

      const data = response.data;

      if (data.success) {
        setEngagementStrategy(data.engagement_strategy);
        toast.success("Engagement strategy generated successfully!");
        return data.engagement_strategy;
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error fetching engagement strategy:", err);
      toast.error("Failed to generate engagement strategy");
      return null;
    } finally {
      setIsLoadingStrategy(false);
    }
  };

  // Navigation functions
  const handlePreviousOpportunity = () => {
    if (currentIndex > 0) {
      const prevOpportunity = opportunitiesList[currentIndex - 1];
      router.push(`/projects/${projectId}/opportunities/${prevOpportunity.id}`);
    }
  };

  const handleNextOpportunity = () => {
    if (currentIndex < opportunitiesList.length - 1) {
      const nextOpportunity = opportunitiesList[currentIndex + 1];
      router.push(`/projects/${projectId}/opportunities/${nextOpportunity.id}`);
    }
  };



  const handleGoBack = () => {
    // Navigate back to opportunities page with agent ID
    const baseUrl = `/projects/${projectId}/opportunities`;
    const urlWithAgent = opportunityAgentId
      ? `${baseUrl}?agent_id=${opportunityAgentId}`
      : baseUrl;
    router.push(urlWithAgent);
  };

  const handleNavigation = (direction) => {
    if (direction === "previous") {
      handlePreviousOpportunity();
    } else if (direction === "next") {
      handleNextOpportunity();
    }
  };

  // Enhanced Shimmer Loader Component
  const Shimmer = () => (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="animate-pulse">
        {/* Header Shimmer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex gap-3 mb-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Overview Shimmer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Post Content Shimmer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-18"></div>
            </div>
          </div>

          {/* Right Column Shimmer */}
          <div className="space-y-4">
            {/* AI Insights Shimmer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>

            {/* AI Response Shimmer */}
            <div className="bg-sky-50 rounded-xl shadow-sm border border-sky-200 p-6 flex-1">
              <div className="h-6 bg-sky-200 rounded w-48 mb-3"></div>
              <div className="relative h-64 bg-sky-100 rounded-lg mb-4 flex items-center justify-center">
                <div className="h-10 w-32 bg-sky-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Recommendations Grid Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="h-6 bg-blue-200 rounded w-56 mb-4"></div>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6">
            <div className="h-6 bg-orange-200 rounded w-56 mb-4"></div>
            <div className="relative h-64 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="h-10 w-40 bg-orange-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Bottom Grid Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="h-6 bg-green-200 rounded w-48 mb-4"></div>
            <div className="relative h-40 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="h-10 w-32 bg-green-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  console.log("opportunity?.blog_article_recommendation-------", opportunity?.blog_article_recommendation);

  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        {/* Simple page header to identify context */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Opportunity Details
          </h1>
          <p className="text-gray-600 mt-2">
            Review AI analysis and recommendations for an opportunity discovered
            by your agents.
          </p>
        </div>

        <div className="flex items-center justify-center py-16">
          <KnowledgeBaseGateAlert
            projectId={projectId}
            description="Add your company research sources in the knowledge base before using the Opportunity Agent."
          />
        </div>
      </div>
    );
  }

  if (!companyResearchChecked || loading) return <Shimmer />;

  if (error)
    return (
      <div className="p-4 flex justify-center items-center min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow text-center border border-gray-200">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Error Loading Opportunity
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Go Back to Opportunities
          </button>
        </div>
      </div>
    );

  if (!opportunity)
    return (
      <div className="p-4 flex justify-center items-center min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow text-center border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Opportunity Not Found</h2>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Go Back to Opportunities
          </button>
        </div>
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header */}
      <OpportunityHeader
        opportunity={opportunity}
        onGoBack={handleGoBack}
        onNavigate={handleNavigation}
        currentIndex={currentIndex}
        totalCount={opportunitiesList.length}
        canNavigatePrevious={currentIndex > 0}
        canNavigateNext={currentIndex < opportunitiesList.length - 1}
        opportunitiesList={opportunitiesList}
      />

      {/* Overview & Assessment */}
      <div className="space-y-4 mt-4">
        <OpportunityOverview opportunity={opportunity} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-stretch">
        <PostContent
          opportunity={opportunity}
          postId={opportunityWIthRawData.raw_data._id}
        />
        <div className="space-y-4 h-full flex flex-col">
          <AIInsights
            aiFiltering={opportunity?.ai_filtering}
            blogArticleRecommendation={opportunity?.blog_article_recommendation}
          />
          <div className="flex-1">
            <AIGeneratedResponse
              opportunity={opportunityWIthRawData}
              onFetchStrategy={fetchEngagementStrategy}
              isLoading={isLoadingStrategy}
              responseData={engagementStrategy?.recommended_response}
            />
          </div>
        </div>
      </div>

      {/* Product Recommendations */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <ProductRecommendations opportunity={opportunity} />
        <NewProductOpportunities
          opportunity={opportunityWIthRawData}
          onFetchStrategy={fetchEngagementStrategy}
          isLoading={isLoadingStrategy}
          productData={engagementStrategy?.new_product_services_opportunities}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-stretch">
        <JTBDAnalysis opportunity={opportunity} />
        <EnhancedActionRecommendations
          opportunity={opportunityWIthRawData}
          onFetchStrategy={fetchEngagementStrategy}
          isLoading={isLoadingStrategy}
          actionData={engagementStrategy?.action_recommendation}
        />
      </div>
    </div>
  );
}
