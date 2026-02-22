"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  Calendar,
  Bell,
  BellOff,
  Activity,
  TrendingUp,
  Users,
  Target,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  ClipboardCopy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatLocalDate } from "../../../utils/dateUtils";

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
      className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bgColor}`}
    >
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      <IconComponent className={`h-3 w-3 ${config.textColor}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
};

const ConfigSection = ({ title, items, icon: Icon }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-blue-600" />
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

function TaskIdDisplay({ agent }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!agent?.task_id) return;
    navigator.clipboard.writeText(agent.task_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // reset after 1.5s
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">Task ID:</span>
      <div className="flex items-center space-x-2">
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {agent.task_id ? agent.task_id.substring(0, 8) + "..." : "N/A"}
        </span>

        {agent.task_id && (
          <button
            onClick={handleCopy}
            className="relative flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 transition-all duration-300"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500 transform scale-110 transition-transform duration-300" />
            ) : (
              <ClipboardCopy className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AgentCard({
  agent,
  onEdit,
  onDelete,
  expanded,
  onToggleExpanded,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(agent.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDashboard = () => {
    // Navigate to opportunities page with agent ID
    const projectId = agent.project_id;
    const agentId = agent.id;
    router.push(
      `/projects/${projectId}/opportunities?opportunity_agent_id=${agentId}`
    );
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Calculate time taken in readable format
  const formatTimeTaken = (seconds) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Agent data with fallbacks for API response structure
  const agentName = agent.agent_name || agent.name || "Unnamed Agent";
  const agentStatus = agent.status || "processing";
  const opportunitiesCount = agent.opportunities_count || 0;
  const totalOpportunities = opportunitiesCount; // Use opportunities_count for consistency
  const totalPostsFound = agent.total_posts_found || 0;
  const createdAt = formatLocalDate(agent.created_at);
  const updatedAt = agent?.updated_at
    ? formatLocalDate(agent.updated_at)
    : "N/A";
  const timeTaken = formatTimeTaken(agent.time_taken);
  const overview = agent.overview || "No overview provided";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Processing indicator for processing/running agents */}
      {agentStatus === "processing" && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200 px-4 py-2">
          <div className="flex items-center gap-3 text-orange-700 text-sm">
            <span className="font-medium">
              Agent is currently{" "}
              {agentStatus === "running" ? "running" : "processing"}{" "}
              opportunities...
            </span>
            <div className="ml-auto">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
            {agentName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewDashboard}
              className="px-3 py-1.5 hover:cursor-pointer bg-sky-600 text-white text-sm rounded-md hover:bg-sky-700 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Opportunities
            </button>
            <button
              onClick={() => onEdit(agent)}
              className="px-3 py-1.5 hover:cursor-pointer bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={onToggleExpanded}
              className="p-2 hover:cursor-pointer text-gray-600 hover:text-gray-900 bg-gray-200 hover:bg-gray-400 rounded-md transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Opportunities */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-medium text-sky-700 uppercase tracking-wide">
                Opportunities
              </span>
            </div>
            <div className="text-xl font-bold text-sky-900">
              {opportunitiesCount.toLocaleString()}
            </div>
            <div className="text-xs text-sky-600">
              from {totalPostsFound.toLocaleString()} posts
            </div>
          </div>

          {/* Subreddits */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                Sources
              </span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {agent.total_subreddits_found || 0}
            </div>
            <div className="text-xs text-blue-600">subreddits found</div>
          </div>

          {/* Processing Time */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Process Time
              </span>
            </div>
            <div className="text-xl font-bold text-green-900">{timeTaken}</div>
            <div className="text-xs text-green-600">
              {agent.discovery_method_count || 0} methods
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Status
              </span>
            </div>
            <div className="mt-3">
              <StatusIndicator status={agentStatus} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium text-gray-900">{createdAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Updated:</span>
            <span className="font-medium text-gray-900">{updatedAt}</span>
          </div>
        </div>

        {/* Overview - Only show if overview exists */}
        {overview && overview !== "No overview provided" && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Overview:
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              {overview}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Configuration */}
      {expanded && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900">
              Agent Configuration & Stats
            </h4>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete Agent
            </button>
          </div>

          {/* Processing Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Processing Statistics
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Posts Found:</span>
                  <span className="font-medium">
                    {totalPostsFound.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Filtered Out:</span>
                  <span className="font-medium">
                    {agent.total_posts_filtered_out || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Relevant Posts:</span>
                  <span className="font-medium text-green-600">
                    {totalOpportunities}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Query Methods:</span>
                  <span className="font-medium">
                    {agent.all_query_count || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600" />
                Task Information
              </h5>
              <div className="space-y-2 text-sm">
                <TaskIdDisplay agent={agent} />
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="font-medium">
                    {formatLocalDate(agent.started_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-medium">{timeTaken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <StatusIndicator status={agentStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Details */}
          {agent.request_data && (
            <div className="space-y-4">
              {/* Sub-Reddit Sources */}
              {agent.subreddits && agent.subreddits.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-orange-600 rounded-sm flex items-center justify-center text-white text-xs">
                      r/
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      Sub-Reddit Sources
                    </span>
                  </div>
                  <div className="ml-6 space-y-3">
                    {agent.subreddits.map((subreddit, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <a
                            href={
                              subreddit.url ||
                              `https://www.reddit.com/r/${subreddit.name}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
                          >
                            {subreddit.display_name_prefixed ||
                              `r/${subreddit.name}`}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-xs text-gray-500">
                            {subreddit.subscribers?.toLocaleString()}{" "}
                            subscribers
                          </span>
                        </div>
                        {subreddit.description && (
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {subreddit.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <ConfigSection
                title="Industries"
                items={agent.request_data.industries || []}
                icon={() => (
                  <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              />

              <ConfigSection
                title="Buyer Personas"
                items={agent.request_data.buyer_persona || []}
                icon={() => (
                  <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              />

              <ConfigSection
                title="Products & Services"
                items={agent.request_data.products_and_services || []}
                icon={() => (
                  <div className="w-4 h-4 bg-sky-600 rounded-sm flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              />

              <ConfigSection
                title="Target Markets"
                items={agent.request_data.target_markets || []}
                icon={() => (
                  <div className="w-4 h-4 bg-orange-600 rounded-sm flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              />

              <ConfigSection
                title="Differentiators"
                items={agent.request_data.differentiators || []}
                icon={() => (
                  <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              />

              {/* Custom Instructions */}
              {agent.request_data.additional_instructions && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-yellow-600 rounded-sm flex items-center justify-center text-white text-xs">
                      !
                    </div>
                    <span className="font-medium text-yellow-800 text-sm">
                      Additional Instructions
                    </span>
                  </div>
                  <div className="text-sm text-yellow-700 leading-relaxed ml-6">
                    {agent.request_data.additional_instructions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Agent
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{agentName}"? This will
                permanently remove the agent and all its configuration.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete Agent"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
