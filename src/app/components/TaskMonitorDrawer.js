"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTaskMonitor } from "../context/TaskMonitorContext";
import { useSelection } from "../context/SelectionContext";

const AgentVideoIcon = ({ size = 40, className = "", shouldPlay = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (shouldPlay) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [shouldPlay]);

  return (
    <video
      ref={videoRef}
      src="/ai-agent/robotic.mp4"
      width={size}
      height={size}
      muted
      loop
      playsInline
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
      className={`object-contain drop-shadow-sm ${className}`}
    />
  );
};

const formatEta = (seconds) => {
  if (seconds === undefined || seconds === null) return null;
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!hours && !minutes) parts.push(`${secs}s`);
  return parts.join(" ");
};

const TaskMonitorDrawer = () => {
  const {
    categorizedTasks,
    runningAgentsCount,
    isLoading,
    isDrawerOpen,
    setIsDrawerOpen,
    refreshTasks,
    formatAgentType,
  } = useTaskMonitor();
  const { selectedProject } = useSelection();
  const router = useRouter();

  // Only one task can be expanded at a time
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const drawerContentRef = useRef(null);

  const agentRouteMap = useMemo(
    () => ({
      ContentArchitectureAgent: "content-architecture",
      ArticleWriterAgent: "articles",
      OpportunityAgent: "opportunity-agent",
      AIOAnswerAgent: "aio-answers",
      TopicGenerationAgent: "topic",
      CompanyResearchAgent: "manage",
      CompanyCompetitorResearchAgent: "manage",
      "Social strategy": "socials",
      SocialMediaStrategyAgent: "socials",
      KeywordExpansionAgent: "keywords",
      KeywordExpansionWorkflow: "keywords",
      "Keyword Expansion": "keywords",
      AIOptimizationQuestionsAgent: "ai-optimizations",
      AIOptimisationQuestionsAgent: "ai-optimizations",
      AIOptimizationAgent: "ai-optimizations",
      "AI Optimization Questions": "ai-optimizations",
      "A I Optimisation Questions": "ai-optimizations",
      "AI Optimisation Questions": "ai-optimizations",
      "AI optimization: Questions": "ai-optimizations",
    }),
    []
  );

  const buildTaskUrl = useCallback(
    (task) => {
      const projectId = selectedProject?.id;
      const routeSegment = agentRouteMap[task.agent_type];
      if (!projectId || !routeSegment) return null;

      const basePath = `/projects/${projectId}/${routeSegment}`;
      const params = new URLSearchParams();
      if (task.document_id) params.set("document_id", task.document_id);
      if (task.task_id) params.set("task_id", task.task_id);
      const agentTypeNormalized = (task.agent_type || "")
        .toString()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
      if (
        routeSegment === "socials" &&
        (agentTypeNormalized === "socialstrategy" ||
          agentTypeNormalized === "socialmediastrategyagent")
      ) {
        params.set("open_existing_subcampaigns", "1");
      }
      return params.toString() ? `${basePath}?${params.toString()}` : basePath;
    },
    [agentRouteMap, selectedProject?.id]
  );

  const handleTaskNavigation = useCallback(
    (task) => {
      if (task?.is_deleted) {
        toast.error("This task's output was deleted.");
        return;
      }
      const url = buildTaskUrl(task);
      if (!url) {
        toast.error("Navigation unavailable for this task.");
        return;
      }
      router.push(url);
      setIsDrawerOpen(false);
    },
    [buildTaskUrl, router, setIsDrawerOpen]
  );

  // Track if drawer was previously closed to only trigger on actual open
  const wasDrawerClosedRef = useRef(!isDrawerOpen);

  // Scroll to top when drawer opens (removed auto-expansion to fix dropdown reopening issue)
  useEffect(() => {
    if (!isDrawerOpen) {
      wasDrawerClosedRef.current = true;
      return;
    }

    // Only run this effect when drawer actually opens (transitions from closed to open)
    if (wasDrawerClosedRef.current) {
      if (drawerContentRef.current) {
        drawerContentRef.current.scrollTop = 0;
      }
      wasDrawerClosedRef.current = false;
    }
  }, [isDrawerOpen]);

  // Toggle task expansion (only one at a time)
  const toggleTaskExpand = useCallback((taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "PROCESSING":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const statusLabelMap = {
    PROCESSING: "In progress",
    COMPLETED: "Completed",
    FAILED: "Failed",
    QUEUED: "Queued",
    PENDING: "Pending",
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "PROCESSING":
        return {
          iconBg: "bg-blue-50 text-blue-600",
          badgeBg: "bg-blue-100",
          badgeText: "text-blue-700",
          accent: "from-indigo-500 via-blue-500 to-sky-500",
        };
      case "COMPLETED":
        return {
          iconBg: "bg-emerald-50 text-emerald-600",
          badgeBg: "bg-emerald-100",
          badgeText: "text-emerald-700",
          accent: "from-emerald-500 via-green-500 to-lime-500",
        };
      case "FAILED":
        return {
          iconBg: "bg-red-50 text-red-600",
          badgeBg: "bg-red-100",
          badgeText: "text-red-700",
          accent: "from-red-500 via-rose-500 to-orange-500",
        };
      default:
        return {
          iconBg: "bg-slate-50 text-slate-500",
          badgeBg: "bg-slate-100",
          badgeText: "text-slate-600",
          accent: "from-slate-400 via-slate-500 to-slate-600",
        };
    }
  };

  const getTimelineClasses = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          dot: "border-emerald-500 bg-emerald-500",
          line: "bg-emerald-200",
        };
      case "PROCESSING":
        return {
          dot: "border-amber-400 bg-amber-400",
          line: "bg-amber-200",
        };
      case "FAILED":
        return {
          dot: "border-red-500 bg-red-500",
          line: "bg-red-200",
        };
      default:
        return {
          dot: "border-gray-300 bg-gray-300",
          line: "bg-gray-200",
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const TaskCard = ({ task }) => {
    const isExpanded = expandedTaskId === task.task_id;
    const progress = task.latest_progress || {};
    const notifications = task.notifications || [];
    const notificationsContainerRef = useRef(null);
    const statusStyles = getStatusStyles(task.latest_status);
    const statusLabel = statusLabelMap[task.latest_status] || "In progress";
    const isDeleted = Boolean(task.is_deleted);
    const canNavigate = !isDeleted && Boolean(buildTaskUrl(task));

    // Compute percent fallback
    const percent =
      progress.percent ??
      (progress.current_step && progress.total_steps
        ? Math.round((progress.current_step / progress.total_steps) * 100)
        : 0);
    const etaText = formatEta(task.latest_estimated_time_remaining);

    // Memoize progress width
    const progressWidth = useMemo(
      () => `${Math.min(percent, 100)}%`,
      [percent]
    );

    const hasProgressInfo =
      (progress.current_step && progress.total_steps) || percent > 0;

    const resolvedContext = useMemo(() => {
      if (typeof task.context === "string" && task.context.trim()) {
        return task.context.trim();
      }
      const notificationWithContext = notifications.find(
        (n) => typeof n?.context === "string" && n.context.trim()
      );
      return notificationWithContext ? notificationWithContext.context.trim() : null;
    }, [notifications, task.context]);

    const contextIsUrl = useMemo(() => {
      if (!resolvedContext) return false;
      try {
        return /^https?:\/\//i.test(resolvedContext);
      } catch (err) {
        return false;
      }
    }, [resolvedContext]);

    return (
      <div
        className={`rounded-lg border border-slate-100 bg-white overflow-hidden transition-all ${
          isExpanded ? "shadow ring-1 ring-indigo-50" : "shadow-sm"
        } ${isDeleted ? "opacity-60" : ""}`}
      >
        {/* Task Header */}
        <button
          onClick={() => toggleTaskExpand(task.task_id)}
          className="w-full px-3.5 py-3 flex flex-col gap-2 text-left hover:bg-slate-50 transition-colors"
          title={isDeleted ? "Task output deleted" : undefined}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shadow-inner flex-shrink-0 ${statusStyles.iconBg}`}
              >
                {getStatusIcon(task.latest_status)}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-slate-900 break-words">
                  {formatAgentType(task.agent_type)}
                </p>
                {resolvedContext && (
                  <p className="text-[12px] text-indigo-600/90 break-words whitespace-pre-wrap leading-tight">
                  {contextIsUrl ? (
                      <span
                        role="link"
                        tabIndex={-1}
                        className="underline decoration-dotted cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation();
                          window.open(resolvedContext, "_blank", "noopener,noreferrer");
                        }}
                      >
                        {resolvedContext}
                      </span>
                    ) : (
                      resolvedContext
                    )}
                  </p>
                )}
                <p className="text-xs text-slate-500 break-words whitespace-pre-wrap leading-tight">
                  {task.latest_message ||
                    task.latest_title ||
                    "Processing task"}
                </p>
                {(progress.current_step || progress.total_steps) && (
                  <p className="text-[11px] text-slate-500">
                    <span className="text-slate-900 font-semibold">
                      {progress.current_step || 0}
                    </span>
                    /{progress.total_steps || 0} steps
                  </p>
                )}
                {task.latest_status === "PROCESSING" && etaText && (
                  <span className="text-[11px] text-indigo-500 font-semibold">
                    ETA {etaText}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right flex-shrink-0 min-w-[60px]">
              <div className="flex items-center gap-2">
                {canNavigate && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleTaskNavigation(task);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Open
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
                {isDeleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                    Deleted
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {formatDate(task.latest_timestamp) || ""}
              </span>
              <div className="p-1 rounded-full border border-slate-200">
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    isExpanded ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Expanded Steps */}
        {isExpanded && notifications.length > 0 && (
          <div className="border-t border-gray-100 overflow-hidden bg-slate-50/60">
            <div
              ref={notificationsContainerRef}
              className="p-3 max-h-56 overflow-y-auto scrollbar-thin"
            >
              <div className="space-y-3">
                {notifications.map((notification, idx) => {
                  const stepProgress = notification.progress || {};
                  const stepPercent =
                    stepProgress.percent ??
                    (stepProgress.current_step && stepProgress.total_steps
                      ? Math.round(
                          (stepProgress.current_step /
                            stepProgress.total_steps) *
                            100
                        )
                      : null);
                  const stepEta = formatEta(
                    notification.estimated_time_remaining ??
                      stepProgress.estimated_time_remaining
                  );
                  const timeline = getTimelineClasses(notification.step_status);

                  return (
                    <div key={idx} className="flex gap-3 items-stretch text-xs">
                      <div className="flex flex-col items-center w-3 relative">
                        <span
                          className={`w-3 h-3 rounded-full border-2 ${timeline.dot} shadow-sm`}
                        />
                        {idx !== notifications.length - 1 && (
                          <span
                            className={`flex-1 w-px mt-1 ${timeline.line}`}
                          />
                        )}
                      </div>
                      <div
                        className={`flex-1 min-w-0 rounded-lg border border-slate-100 px-3 py-2 ${
                          notification.step_status === "PROCESSING"
                            ? "bg-yellow-50/70"
                            : notification.step_status === "COMPLETED"
                            ? "bg-emerald-50/60"
                            : notification.step_status === "FAILED"
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        <p
                          className={`font-medium ${
                            notification.step_status === "PROCESSING"
                              ? "text-amber-700"
                              : notification.step_status === "COMPLETED"
                              ? "text-gray-700"
                              : notification.step_status === "FAILED"
                              ? "text-red-700"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.step_name || "Step"}
                        </p>
                        <p className="text-gray-600 break-words whitespace-pre-wrap leading-snug">
                          {notification.message}
                        </p>
                        {(stepPercent !== null || stepEta) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {stepPercent !== null && `${stepPercent}%`}
                            {stepPercent !== null && stepEta ? " • " : ""}
                            {stepEta && `ETA ${stepEta}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskSection = ({
    title,
    tasks,
    icon: Icon,
    iconColor,
    iconBg,
    emptyTitle,
    emptyDescription,
    emptyIcon,
  }) => {
    return (
      <section className="mb-4">
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] border ${iconBg} ${iconColor}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            {tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
          </span>
        </div>
        {tasks.length > 0 ? (
          <div className="mt-2 space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.task_id} task={task} />
            ))}
          </div>
        ) : (
          <div className="px-4 py-4 mt-1 flex items-center gap-3 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 bg-white">
            {emptyIcon}
            <div>
              <p className="font-medium text-gray-500">{emptyTitle}</p>
              <p className="text-xs text-gray-400">{emptyDescription}</p>
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AgentVideoIcon shouldPlay={runningAgentsCount > 0} />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    AI Agent Monitor
                  </h2>
                  <p className="text-xs text-gray-500">
                    {runningAgentsCount > 0
                      ? `${runningAgentsCount} task${
                          runningAgentsCount > 1 ? "s" : ""
                        } running`
                      : "No active tasks"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div
              ref={drawerContentRef}
              className="flex-1 overflow-y-auto px-5 py-4"
            >
              {isLoading &&
              categorizedTasks.processing.length === 0 &&
              categorizedTasks.completed.length === 0 &&
              categorizedTasks.failed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm">Loading tasks...</p>
                </div>
              ) : categorizedTasks.processing.length === 0 &&
                categorizedTasks.completed.length === 0 &&
                categorizedTasks.failed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <AgentVideoIcon
                    className="opacity-30"
                    size={60}
                    shouldPlay={false}
                  />
                  <p className="text-sm font-medium">No tasks found</p>
                  <p className="text-xs mt-1">
                    Tasks will appear here when agents run
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-gray-100 p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                        Task overview
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {categorizedTasks.processing.length +
                          categorizedTasks.completed.length +
                          categorizedTasks.failed.length}{" "}
                        total
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {[
                        {
                          label: "In progress",
                          count: categorizedTasks.processing.length,
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                          dot: "bg-blue-500",
                        },
                        {
                          label: "Completed",
                          count: categorizedTasks.completed.length,
                          color: "text-emerald-600",
                          bg: "bg-emerald-50",
                          dot: "bg-emerald-500",
                        },
                        {
                          label: "Failed",
                          count: categorizedTasks.failed.length,
                          color: "text-red-600",
                          bg: "bg-red-50",
                          dot: "bg-red-500",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-1 min-w-[120px] items-center gap-2 rounded-lg border border-gray-100 bg-slate-50/60 px-3 py-1.5"
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${item.bg}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${item.dot}`}
                            />
                          </span>
                          <div className="flex flex-col leading-snug min-w-0">
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 whitespace-nowrap">
                              {item.label}
                            </span>
                            <span
                              className={`text-sm font-semibold ${item.color}`}
                            >
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <TaskSection
                    title="In Progress"
                    tasks={categorizedTasks.processing}
                    icon={RefreshCw}
                    iconColor="text-blue-500"
                    emptyTitle="No active tasks"
                    emptyDescription="New tasks will appear here when processing starts."
                    emptyIcon={
                      <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                        <RefreshCw className="w-4 h-4" />
                      </span>
                    }
                  />
                  <TaskSection
                    title="Completed"
                    tasks={categorizedTasks.completed}
                    icon={CheckCircle2}
                    iconColor="text-emerald-500"
                    emptyTitle="No completed tasks yet"
                    emptyDescription="Completed tasks will appear here once finished."
                    emptyIcon={
                      <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    }
                  />
                  <TaskSection
                    title="Failed"
                    tasks={categorizedTasks.failed}
                    icon={XCircle}
                    iconColor="text-red-500"
                    emptyTitle="No failed tasks"
                    emptyDescription="We'll surface any issues here if a task fails."
                    emptyIcon={
                      <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                        <XCircle className="w-4 h-4" />
                      </span>
                    }
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TaskMonitorDrawer;
