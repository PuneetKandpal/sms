"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { formatLocalDate } from "../../../../utils/dateUtils";
import { useSelection } from "../../../context/SelectionContext";
import { useSearchParams } from "next/navigation";
import api from "../../../../api/axios";
import OpportunitiesTable from "../../../components/opportunity-agent/OpportunitiesTable";
import toast from "react-hot-toast";
import {
  Search,
  TrendingUp,
  Users,
  Activity,
  ArrowLeft,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Calendar,
  Globe,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal, Box, Typography, Chip, Divider, Button } from "@mui/material";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function OpportunitiesPage({ params }) {
  const { id } = use(params);
  const { selectedProject } = useSelection();
  const searchParams = useSearchParams();
  const router = useRouter();

  useTrackFeatureExploration("opportunity_agent");

  // Track feature usage
  useFeatureTracking("Opportunities", {
    feature_category: "analytics",
    page_section: "opportunities",
    project_id: id,
  });

  const opportunityAgentId =
    searchParams.get("opportunity_agent_id") || searchParams.get("agent_id");

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);

  // Status indicator component similar to AgentCard
  const StatusIndicator = ({ status }) => {
    const statusConfig = {
      active: {
        color: "bg-green-500",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        label: "Active",
        icon: CheckCircle,
      },
      completed: {
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        label: "Completed",
        icon: CheckCircle,
      },
      processing: {
        color: "bg-orange-500",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        label: "Processing",
        icon: Activity,
      },
      running: {
        color: "bg-orange-500",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        label: "Running",
        icon: Activity,
      },
      paused: {
        color: "bg-yellow-500",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        label: "Paused",
        icon: AlertCircle,
      },
      error: {
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        label: "Error",
        icon: XCircle,
      },
      failed: {
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        label: "Failed",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}
      >
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        <IconComponent className={`h-3 w-3 ${config.textColor}`} />
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    );
  };

  // Config section component similar to AgentCard
  const ConfigSection = ({ title, items, icon: Icon, color }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-4 h-4 ${color} rounded-sm flex items-center justify-center text-white text-xs`}
          >
            ✓
          </div>
          <span className="font-medium text-gray-900 text-sm">{title}</span>
        </div>
        <div className="flex flex-wrap gap-2 ml-6">
          {items.map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Fetch opportunities and agent data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProject?.id) return;

      // Only fetch opportunities after company research check passes
      if (!companyResearchChecked || !hasCompanyResearch) return;

      try {
        trackFeatureAction("opportunities_fetch_started", {
          project_id: selectedProject.id,
          agent_id: opportunityAgentId,
        });

        // Fetch opportunities
        let opportunitiesParams = `project_id=${selectedProject.id}`;
        if (opportunityAgentId) {
          opportunitiesParams += `&opportunity_agent_id=${opportunityAgentId}`;
        }

        const opportunitiesResponse = await api.get(
          `/opportunity-agent/agent-posts-table/?${opportunitiesParams}`
        );
        const opportunitiesData = opportunitiesResponse.data;
        if (opportunitiesData.success && opportunitiesData.posts) {
          setOpportunities(opportunitiesData.posts);
          setStats(opportunitiesData.stats);

          trackFeatureAction("opportunities_fetch_success", {
            project_id: selectedProject.id,
            agent_id: opportunityAgentId,
            opportunities_count: opportunitiesData.posts.length,
            average_score: opportunitiesData.stats?.average_score,
          });
        } else {
          console.warn(
            "No opportunities found or API error:",
            opportunitiesData
          );
          setOpportunities([]);
        }

        // Fetch agent data if we have an agent ID
        if (opportunityAgentId) {
          const agentsResponse = await api.get(
            `/opportunity-agent/agents/?project_id=${selectedProject.id}`
          );
          const agentsData = agentsResponse.data;

          if (agentsData.success && agentsData.agents) {
            const currentAgent = agentsData.agents.find(
              (agent) => agent.id === opportunityAgentId
            );
            if (currentAgent) {
              setAgentData(currentAgent);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);

        trackFeatureAction("opportunities_fetch_failed", {
          project_id: selectedProject.id,
          agent_id: opportunityAgentId,
          error_message: error.response?.data?.message || error.message,
        });

        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to load data"
        );
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    selectedProject?.id,
    opportunityAgentId,
    companyResearchChecked,
    hasCompanyResearch,
  ]);

  // Check if company research data exists before loading opportunities
  useEffect(() => {
    const projectIdToCheck = id || selectedProject?.id;
    if (!projectIdToCheck) return;

    const checkCompanyResearch = async () => {
      try {
        const response = await api.get(
          `/keyword-api/company-research-data/exists/?project_id=${projectIdToCheck}`
        );

        if (response.data?.exists) {
          setHasCompanyResearch(true);
        } else {
          setHasCompanyResearch(false);
        }
      } catch (err) {
        console.error(
          "Error checking company research data for opportunities:",
          err
        );
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };

    checkCompanyResearch();
  }, [id, selectedProject?.id]);

  // Track agent modal interactions
  const handleOpenAgentModal = () => {
    trackFeatureAction("opportunities_agent_modal_opened", {
      project_id: selectedProject?.id,
      agent_id: opportunityAgentId,
      agent_name: agentData?.agent_name || "unknown",
    });
    setShowAgentModal(true);
  };

  const handleCloseAgentModal = () => {
    trackFeatureAction("opportunities_agent_modal_closed", {
      project_id: selectedProject?.id,
      agent_id: opportunityAgentId,
      agent_name: agentData?.agent_name || "unknown",
    });
    setShowAgentModal(false);
  };
  const formatDate = (dateString) => {
    return formatLocalDate(dateString) || "N/A";
  };

  const handleViewAgent = (agentId) => {
    if (agentData && agentData.id === agentId) {
      setShowAgentModal(true);
    }
  };

  // Set up global handler for table
  useEffect(() => {
    window.handleViewAgent = handleViewAgent;
    return () => {
      delete window.handleViewAgent;
    };
  }, [agentData]);
  const totalOpportunities = opportunities.length;
  const highPriorityOpportunities = opportunities.filter(
    (opp) => opp.score >= 80
  ).length;
  const avgScore = stats?.average_score ? Math.round(stats.average_score) : 0;
  const newToday = opportunities.filter((opp) => {
    const today = new Date().toISOString().split("T")[0];
    const oppDate = new Date(opp.date).toISOString().split("T")[0];
    return oppDate === today;
  }).length;

  // Enhanced Shimmer Component for Agent Opportunities Page
  const AgentOpportunitiesShimmer = () => (
    <div className="w-full px-4" style={{ backgroundColor: "#FAFAFA" }}>
      <div className="px-10 mx-auto space-y-4">
        {/* Header Section Shimmer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-96 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Stats Cards Shimmer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 bg-blue-200 rounded"></div>
                  <div className="h-4 w-12 bg-blue-200 rounded"></div>
                </div>
                <div className="h-8 w-16 bg-blue-200 rounded mb-1"></div>
                <div className="h-4 w-20 bg-blue-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Info Modal Trigger Shimmer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-green-200 rounded"></div>
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Filters Section Shimmer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="h-9 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-9 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-9 w-28 bg-gray-200 rounded-lg"></div>
            <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Table Section Shimmer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
          {/* Table Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-4">
            {/* Table Headers */}
            <div className="grid grid-cols-8 gap-4 mb-4 pb-3 border-b border-gray-100">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>

            {/* Table Rows */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
              <div
                key={row}
                className="grid grid-cols-8 gap-4 py-4 border-b border-gray-50"
              >
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-blue-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-6 w-12 bg-orange-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-purple-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Pagination Shimmer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="w-full px-4" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="px-10 mx-auto space-y-4">
          {/* Header */}
          <header className="flex justify-between p-4 bg-white shadow-sm rounded-lg">
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">
                      {opportunityAgentId
                        ? "Agent Opportunities"
                        : "All Opportunities"}
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">
                      {opportunityAgentId
                        ? "Opportunities discovered by your selected agent"
                        : "Monitor and manage business opportunities from all your agents"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex items-center justify-center py-16">
            <KnowledgeBaseGateAlert
              projectId={id}
              description="Add your company research sources in the knowledge base before using the Opportunities view."
            />
          </div>
        </div>
      </div>
    );
  }

  if (!companyResearchChecked || loading) {
    return <AgentOpportunitiesShimmer />;
  }

  return (
    <div className="w-full px-4" style={{ backgroundColor: "#FAFAFA" }}>
      <div className="px-10 mx-auto space-y-4">
        {/* Header */}
        <header className="flex justify-between p-4 bg-white shadow-sm rounded-lg">
          <div className="flex-1 flex gap-4">
            {/* {opportunityAgentId && (
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Agents
              </button>
            )} */}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mt-1">
                    {opportunityAgentId
                      ? "Agent Opportunities"
                      : "All Opportunities"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-2">
                    {opportunityAgentId ? (
                      <span>
                        Opportunities discovered by the agent{" "}
                        {agentData?.agent_name && (
                          <span
                            className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={handleOpenAgentModal}
                            style={{ textDecoration: "underline" }}
                          >
                            {agentData.agent_name}
                          </span>
                        )}
                      </span>
                    ) : (
                      "Monitor and manage business opportunities from all your agents"
                    )}
                  </p>
                </div>
                {/* {agentData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {agentData.agent_name}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700">
                      Status:{" "}
                      <span className="capitalize">{agentData.status}</span> |
                      Created: {formatDate(agentData.created_at)}
                    </div>
                    <button
                      onClick={handleOpenAgentModal}
                      className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-3 w-3" />
                      View Details
                    </button>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex gap-4 flex-1 justify-center">
            <div className="bg-gray-50 flex-1 border border-gray-200 rounded-lg px-4 py-3 min-w-[140px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Total
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalOpportunities}
              </div>
            </div>

            <div className="bg-gray-50 border flex-1 border-gray-200 rounded-lg px-4 py-3 min-w-[140px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  High Priority
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {highPriorityOpportunities}
              </div>
            </div>

            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[140px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Avg Score
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{avgScore}</div>
            </div>

            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[140px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  New Today
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{newToday}</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <OpportunitiesTable
            opportunities={opportunities}
            loading={loading}
            selectedProject={selectedProject}
          />
        </div>

        {/* Agent Details Modal */}
        <Modal
          open={showAgentModal}
          onClose={() => setShowAgentModal(false)}
          aria-labelledby="agent-details-modal"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: 900,
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 2,
              p: 0,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            {agentData && (
              <div className="bg-white rounded-lg shadow-lg">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {agentData.agent_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusIndicator status={agentData.status} />
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          Created {formatDate(agentData.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAgentModal(false)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Total Posts
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {agentData.total_posts_found || 0}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Relevant
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {agentData.total_relevant_posts || 0}
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">
                          Subreddits
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {agentData.total_subreddits_found || 0}
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">
                          Opportunities
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {agentData.opportunities_count}
                      </div>
                    </div>
                  </div>

                  {/* Timing Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(
                            agentData.started_at || agentData.created_at
                          )}
                        </span>
                      </div>
                      {agentData.completed_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(agentData.completed_at)}
                          </span>
                        </div>
                      )}
                      {agentData.time_taken && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium text-gray-900">
                            {Math.round(agentData.time_taken)} seconds
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent Configuration */}
                  {agentData.request_data && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Agent Configuration
                      </h3>

                      <ConfigSection
                        title="Industries"
                        items={agentData.request_data.industries || []}
                        color="bg-blue-600"
                      />

                      <ConfigSection
                        title="Buyer Personas"
                        items={agentData.request_data.buyer_persona || []}
                        color="bg-green-600"
                      />

                      <ConfigSection
                        title="Products & Services"
                        items={
                          agentData.request_data.products_and_services || []
                        }
                        color="bg-purple-600"
                      />

                      <ConfigSection
                        title="Target Markets"
                        items={agentData.request_data.target_markets || []}
                        color="bg-orange-600"
                      />

                      <ConfigSection
                        title="Differentiators"
                        items={agentData.request_data.differentiators || []}
                        color="bg-red-600"
                      />

                      {/* Additional Instructions */}
                      {agentData.request_data.additional_instructions && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-4 h-4 bg-yellow-600 rounded-sm flex items-center justify-center text-white text-xs">
                              !
                            </div>
                            <span className="font-medium text-yellow-800 text-sm">
                              Additional Instructions
                            </span>
                          </div>
                          <div className="text-sm text-yellow-700 leading-relaxed ml-6">
                            {agentData.request_data.additional_instructions}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
                  <Button
                    variant="contained"
                    onClick={() => setShowAgentModal(false)}
                    sx={{
                      backgroundColor: "#3b82f6",
                      "&:hover": { backgroundColor: "#2563eb" },
                      textTransform: "none",
                      px: 4,
                      py: 1,
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Box>
        </Modal>
      </div>
    </div>
  );
}
