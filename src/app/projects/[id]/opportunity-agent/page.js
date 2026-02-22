"use client";

import { use } from "react";
import React, { useState, useEffect } from "react";
import { formatLocalTime, formatNumber } from "../../../../utils/dateUtils";
import { useSelection } from "../../../context/SelectionContext";
import {
  GET_COMPANY_RESEARCH_DATA_API,
  GET_OPPORTUNITY_AGENTS_API,
} from "../../../api/jbiAPI";
import AgentConfigurationModal from "../../../components/opportunity-agent/AgentConfigurationModal";
import AgentCard from "../../../components/opportunity-agent/AgentCard";
import toast from "react-hot-toast";
import {
  Plus,
  Users,
  TrendingUp,
  Activity,
  RefreshCw,
  Filter,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../../api/axios";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

const MAX_OPPORTUNITY_AGENTS = 6;
const ACTIVE_AGENT_STATUSES = ["completed", "processing", "running"];

export default function OpportunityAgentPage({ params }) {
  const { id } = use(params);
  const { selectedProject } = useSelection();
  const router = useRouter();

  // Redirect to manage page since this feature is disabled
  useEffect(() => {
    router.replace(`/projects/${id}/manage`);
  }, [id, router]);

  return null;

  useTrackFeatureExploration("opportunity_agent");

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
  useFeatureTracking("Opportunity Agent", {
    feature_category: "ai_content",
    page_section: "opportunity_agent",
    project_id: id,
  });

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [companyResearchData, setCompanyResearchData] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(30000); // 30 seconds default
  const [isPolling, setIsPolling] = useState(true);
  const [statusFilter, setStatusFilter] = useState([
    "completed",
    "processing",
    "running",
  ]); // Exclude 'failed' by default
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Mock user data - in real app, get from auth context
  const userData = {
    userId: "5c931377-1a43-4cf0-a2fc-af711732e85f",
    orgId: "9c4b9d5f-f9d3-44a9-a1a0-04c6eb2889d1",
  };

  const activeAgentsCount = agents.filter((agent) =>
    ACTIVE_AGENT_STATUSES.includes(agent.status)
  ).length;
  const hasReachedAgentLimit = activeAgentsCount >= MAX_OPPORTUNITY_AGENTS;

  // Fetch agents from API
  const fetchAgents = async (isBackgroundUpdate = false) => {
    const projectId = id ? id : selectedProject?.id;
    if (!projectId) return;

    try {
      if (!isBackgroundUpdate) {
        setError(null);
      }

      trackFeatureAction("opportunity_agents_fetch_started", {
        project_id: projectId,
        is_background_update: isBackgroundUpdate,
      });

      const response = await api.get(
        `/opportunity-agent/agents/?project_id=${projectId}`
      );
      const agentsData = response.data;

      if (agentsData.success && agentsData.agents) {
        setAgents(agentsData.agents);
        if (isBackgroundUpdate) {
          setLastUpdateTime(new Date());
        }

        trackFeatureAction("opportunity_agents_fetch_success", {
          project_id: projectId,
          agents_count: agentsData.agents.length,
          is_background_update: isBackgroundUpdate,
        });
      } else {
        console.warn("No agents found or API error:", agentsData);
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);

      trackFeatureAction("opportunity_agents_fetch_failed", {
        project_id: projectId,
        error_message: error.message,
        is_background_update: isBackgroundUpdate,
      });

      if (!isBackgroundUpdate) {
        setError("Failed to load agents. Please try again.");
        setAgents([]);
      }
    }
  };

  // Refresh data function
  const refreshData = async () => {
    setRefreshing(true);

    trackFeatureAction("opportunity_agents_refresh_started", {
      project_id: id || selectedProject?.id,
    });

    try {
      await fetchAgents();

      trackFeatureAction("opportunity_agents_refresh_success", {
        project_id: id || selectedProject?.id,
        agents_count: agents.length,
      });
    } catch (error) {
      trackFeatureAction("opportunity_agents_refresh_failed", {
        project_id: id || selectedProject?.id,
        error_message: error.message,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch company research data and agents on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProject?.id) return;

      try {
        // Fetch company research data
        const companyResponse = await api.get(
          `/opportunity-agent/company-research-data/?project_id=${selectedProject.id}`
        );

        if (
          companyResponse.data.success &&
          companyResponse.data.data &&
          companyResponse.data.data.length > 0
        ) {
          setCompanyResearchData(companyResponse.data.data[0]);
        } else {
          console.warn("No company research data found");
        }

        // Fetch agents
        await fetchAgents();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load some data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProject?.id]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || !selectedProject?.id) return;

    const interval = setInterval(() => {
      fetchAgents(true); // Background update
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [isPolling, pollingInterval, selectedProject?.id]);

  // Remove dummy seeding — agents will be created by user only

  const handleCreateAgent = () => {
    if (hasReachedAgentLimit) {
      toast.error(
        "You already have 6 active opportunity agents. Upgrade your account to add more."
      );

      trackFeatureAction("opportunity_agent_create_blocked_limit", {
        project_id: id || selectedProject?.id,
        active_agents_count: activeAgentsCount,
        limit: MAX_OPPORTUNITY_AGENTS,
      });
      return;
    }

    setEditingAgent(null);
    setShowConfigModal(true);

    trackFeatureAction("opportunity_agent_create_started", {
      project_id: id || selectedProject?.id,
    });
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setShowConfigModal(true);

    trackFeatureAction("opportunity_agent_edit_started", {
      project_id: id || selectedProject?.id,
      agent_id: agent.id,
      agent_name: agent.name,
    });
  };

  const handleCloseConfigModal = () => {
    trackFeatureAction("opportunity_agent_modal_closed", {
      project_id: id || selectedProject?.id,
      is_editing: !!editingAgent,
      agent_id: editingAgent?.id || "new",
      modal_action: "cancelled",
    });
    setShowConfigModal(false);
    setEditingAgent(null);
  };

  const handleSaveAgent = async (agentData) => {
    const projectId = id || selectedProject?.id;

    trackFeatureAction("opportunity_agent_save_started", {
      project_id: projectId,
      is_editing: !!editingAgent,
      agent_id: editingAgent?.id || "new",
      agent_name: agentData.name || agentData.agent_name,
      agent_type: agentData.type || "unknown",
    });

    // Refresh the agents list to get the latest data
    await fetchAgents();

    if (editingAgent) {
      trackFeatureAction("opportunity_agent_updated", {
        project_id: projectId,
        agent_id: editingAgent.id,
        agent_name: editingAgent.name,
      });
    } else {
      trackFeatureAction("opportunity_agent_created", {
        project_id: projectId,
        agent_name: agentData.name || agentData.agent_name,
      });
    }
    
    setShowConfigModal(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = async (agentId) => {
    const projectId = id || selectedProject?.id;
    const agent = agents.find((a) => a.id === agentId);

    if (!projectId || !agentId) {
      toast.error("Missing project or agent information to delete agent");
      return;
    }

    trackFeatureAction("opportunity_agent_delete_started", {
      project_id: projectId,
      agent_id: agentId,
      agent_name: agent?.name || "unknown",
    });

    try {
      const response = await api.delete("/opportunity-agent/delete-agent/", {
        data: {
          project_id: projectId,
          agent_id: agentId,
        },
      });

      if (response.data?.success) {
        setAgents((prev) =>
          prev.filter((agentItem) => agentItem.id !== agentId)
        );

        toast.success(response.data?.message || "Agent deleted successfully!");

        // Backwards compatibility event name
        trackFeatureAction("opportunity_agent_deleted", {
          project_id: projectId,
          agent_id: agentId,
          agent_name: agent?.name || "unknown",
        });

        trackFeatureAction("opportunity_agent_delete_success", {
          project_id: projectId,
          agent_id: agentId,
          agent_name: agent?.name || "unknown",
        });
      } else {
        const message =
          response.data?.message || "Failed to delete agent. Please try again.";

        toast.error(message);

        trackFeatureAction("opportunity_agent_delete_failed", {
          project_id: projectId,
          agent_id: agentId,
          agent_name: agent?.name || "unknown",
          error_message: message,
        });
      }
    } catch (error) {
      console.error("Error deleting agent:", error);

      const errorMessage =
        error?.response?.data?.error ||
        "Failed to delete agent. Please try again.";

      toast.error(errorMessage);

      trackFeatureAction("opportunity_agent_delete_failed", {
        project_id: projectId,
        agent_id: agentId,
        agent_name: agent?.name || "unknown",
        error_message: error.message,
      });
    }
  };

  // Expand/Collapse all cards
  const handleExpandAll = () => {
    const allAgentIds = new Set(filteredAgents.map((agent) => agent.id));
    setExpandedCards(allAgentIds);
  };

  const handleCollapseAll = () => {
    setExpandedCards(new Set());
  };

  const handleCardToggle = (agentId) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  // Filter agents based on status filter
  const filteredAgents = agents.filter((agent) =>
    statusFilter.includes(agent.status)
  );

  const visibleActiveAgentsCount = filteredAgents.filter(
    (a) =>
      a.status === "completed" ||
      a.status === "processing" ||
      a.status === "running"
  ).length;
  const totalOpportunities = filteredAgents.reduce(
    (sum, a) => sum + (a.total_relevant_posts || 0),
    0
  );
  const totalPostsAnalyzed = filteredAgents.reduce(
    (sum, a) => sum + (a.total_posts_found || 0),
    0
  );
  const totalSubredditsFound = filteredAgents.reduce(
    (sum, a) => sum + (a.total_subreddits_found || 0),
    0
  );

  // Show loading state while checking company research
  if (!companyResearchChecked) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  // Knowledge base gate - show modal if company research doesn't exist
  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="relative flex flex-col bg-gray-50 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Header */}
        <header className="flex flex-col mx-4 p-4 bg-white shadow-sm flex-shrink-0 sticky top-0 z-10">
          <div className="flex justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                Opportunity Agents
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-gray-600 text-sm">
                  Configure and manage opportunity monitoring agents
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <KnowledgeBaseGateAlert
            projectId={id}
            description="Add your company research sources in the knowledge base before using Opportunity Agents."
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header Skeleton */}
        <header className="flex flex-col mx-4 p-4 bg-white shadow-sm flex-shrink-0">
          <div className="flex justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                Opportunity Agents
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-gray-600 text-sm">
                  Configure and manage opportunity monitoring agents
                </p>
              </div>
            </div>

            {/* Metric Cards Skeleton */}
            <div className="flex gap-4 flex-1 justify-center">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[180px]"
                >
                  <div className="h-4 w-1/2 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                  <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-1 animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar Skeleton */}
          <div className="flex justify-between items-center gap-3 mt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
              >
                <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-4"></div>
                <div className="h-4 w-full bg-gray-200 rounded-md mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded-md mb-4"></div>
                <div className="h-20 w-full bg-gray-200 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col bg-gray-50 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header */}
      <header className="flex flex-col mx-4 p-4 bg-white shadow-sm flex-shrink-0 sticky top-0 z-10">
        <div className="flex justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              Opportunity Agents
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-600 text-sm">
                Configure and manage opportunity monitoring agents
              </p>
              {lastUpdateTime && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Updated {formatLocalTime(lastUpdateTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics
          <div className="flex gap-4 flex-1 justify-center">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[180px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Active Agents
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 ">
                {activeAgents}/{filteredAgents.length}
              </div>
              <div className="text-xs text-gray-500">
                {agents.length} total agents
              </div>
            </div>

            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[180px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Opportunities
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(totalOpportunities)}
              </div>
              <div className="text-xs text-gray-500">
                from {formatNumber(totalPostsAnalyzed)} posts
              </div>
            </div>

            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 min-w-[180px] hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Sources Found
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(totalSubredditsFound)}
              </div>
              <div className="text-xs text-gray-500">subreddits</div>
            </div>
          </div> */}
        </div>

        <div className="flex justify-between items-center gap-3 mt-4">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse All Controls */}
            {filteredAgents.length > 0 && (
              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-[6px]">
                <button
                  onClick={handleExpandAll}
                  className="flex items-center gap-1 text-xs hover:cursor-pointer px-2 py-1 rounded-lg font-medium text-gray-600 hover:text-gray-800  hover:bg-sky-200 transition-colors"
                >
                  Expand All <ChevronDown className="h-3 w-3" />
                </button>
                <span className="text-gray-300 mb-1">|</span>
                <button
                  onClick={handleCollapseAll}
                  className="flex items-center gap-1 text-xs hover:cursor-pointer px-2 py-1 rounded-lg font-medium text-gray-600 hover:text-gray-800  hover:bg-sky-200 transition-colors"
                >
                  <ChevronUp className="h-3 w-3" />
                  Collapse All
                </button>
              </div>
            )}

            {/* Polling Controls */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
              <button
                disabled={refreshing}
                onClick={() => setIsPolling(!isPolling)}
                className={`flex items-center gap-1 text-sm font-medium ${
                  isPolling ? "text-green-600" : "text-gray-600"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                {isPolling ? "Auto-refresh" : "Manual"}
              </button>
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                disabled={!isPolling || refreshing}
                className="text-xs border-none bg-transparent focus:outline-none disabled:opacity-50"
              >
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
                <option value={300000}>5m</option>
              </select>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Filter Dropdown */}
            <div className="relative">
              <select
                value={statusFilter.join(",")}
                onChange={(e) => {
                  const values = e.target.value
                    ? e.target.value.split(",")
                    : [];
                  setStatusFilter(values);
                }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="completed,processing,running">
                  Active Agents
                </option>
                <option value="completed,processing,running,failed">
                  All Agents
                </option>
                <option value="completed">Completed Only</option>
                <option value="processing,running">Processing Only</option>
                <option value="failed">Failed Only</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-600">
                  {Math.min(activeAgentsCount, MAX_OPPORTUNITY_AGENTS)}/
                  {MAX_OPPORTUNITY_AGENTS} active agents
                </p>
                {hasReachedAgentLimit && (
                  <p className="text-[11px] font-medium text-red-500">
                    Upgrade to add more
                  </p>
                )}
              </div>
              <button
                onClick={handleCreateAgent}
                disabled={hasReachedAgentLimit}
                className="flex items-center hover:cursor-pointer gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-sky-400 bg-sky-600 hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                New Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-2">{error}</p>
            <button
              onClick={refreshData}
              className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {filteredAgents.length === 0 && !loading && !error ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
              {agents.length === 0 ? (
                <Users className="h-8 w-8 text-sky-600" />
              ) : (
                <Filter className="h-8 w-8 text-sky-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {agents.length === 0
                ? "No Opportunity Agents Yet"
                : "No Agents Match Current Filter"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {agents.length === 0
                ? "Create your first opportunity agent to start monitoring for business opportunities based on your company research data"
                : `You have ${agents.length} agent${
                    agents.length === 1 ? "" : "s"
                  } total, but none match the current status filter. Try changing the filter or create a new agent.`}
            </p>
            <div className="flex gap-3 items-center">
              {agents.length > 0 && (
                <button
                  onClick={() =>
                    setStatusFilter([
                      "completed",
                      "processing",
                      "running",
                      "failed",
                    ])
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <Filter className="h-4 w-4" />
                  Show All Agents
                </button>
              )}
              {hasReachedAgentLimit && (
                <p className="text-xs font-semibold text-red-500">
                  Limit reached – upgrade to add more active agents
                </p>
              )}
              <button
                onClick={handleCreateAgent}
                disabled={hasReachedAgentLimit}
                className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                <Plus className="h-5 w-5" />
                {agents.length === 0
                  ? "Create Your First Agent"
                  : "Create New Agent"}
              </button>
            </div>
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
                expanded={expandedCards.has(agent.id)}
                onToggleExpanded={() => handleCardToggle(agent.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <AgentConfigurationModal
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setEditingAgent(null);
          }}
          onSave={handleSaveAgent}
          agent={editingAgent}
          companyResearchData={companyResearchData}
          projectId={selectedProject?.id}
          userId={userData.userId}
          orgId={userData.orgId}
        />
      )}
    </div>
  );
}
