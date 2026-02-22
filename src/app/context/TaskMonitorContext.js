"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import api from "../../api/axios";
import {
  GET_AGENT_NOTIFICATIONS_IN_PROGRESS_API,
  GET_AGENT_NOTIFICATIONS_COMPLETED_API,
} from "../api/jbiAPI";
import toast from "react-hot-toast";
import { useSelection } from "./SelectionContext";

const TaskMonitorContext = createContext();

// Optimized polling intervals to save bandwidth
const ACTIVE_POLL_INTERVAL = 10000; // 10s when there are active/processing tasks
const COMPLETED_POLL_INTERVAL = 300000; // 5 minutes for completed/failed tasks (we trigger immediate refresh on completion)
const IDLE_POLL_INTERVAL = 120000; // 2 minutes when no active tasks (minimal overhead)

export function TaskMonitorProvider({ children }) {
  const { selectedProject } = useSelection();
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [runningAgentsCount, setRunningAgentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusNotifications, setStatusNotifications] = useState([]);

  const inProgressPollingRef = useRef(null);
  const completedPollingRef = useRef(null);
  const previousInProgressRef = useRef([]);
  const previousCompletedRef = useRef([]);
  const statusNotificationTimeoutRef = useRef(null);
  const fetchCompletedTasksRef = useRef(null);

  // Check if tasks have actually changed
  const hasTasksChanged = (oldTasks, newTasks) => {
    if (oldTasks.length !== newTasks.length) return true;

    // Check for new tasks or status changes
    for (const newTask of newTasks) {
      const oldTask = oldTasks.find((t) => t.task_id === newTask.task_id);

      // New task found
      if (!oldTask) return true;

      // Status changed
      if (oldTask.latest_status !== newTask.latest_status) return true;

      // Progress changed for processing tasks
      if (
        newTask.latest_status === "PROCESSING" &&
        oldTask.latest_progress?.percent !== newTask.latest_progress?.percent
      ) {
        return true;
      }

      // Message changed
      if (oldTask.latest_message !== newTask.latest_message) return true;
    }

    return false;
  };

  // Add a status notification (shown as dropdown below navbar icon)
  const addStatusNotification = useCallback((agentName, status) => {
    const notification = {
      id: Date.now(),
      agentName,
      status,
      timestamp: new Date(),
    };

    setStatusNotifications((prev) => [notification, ...prev].slice(0, 5));

    // Auto-clear after 3 seconds
    if (statusNotificationTimeoutRef.current) {
      clearTimeout(statusNotificationTimeoutRef.current);
    }
    statusNotificationTimeoutRef.current = setTimeout(() => {
      setStatusNotifications([]);
    }, 3000);
  }, []);

  // Clear status notifications
  const clearStatusNotifications = useCallback(() => {
    setStatusNotifications([]);
    if (statusNotificationTimeoutRef.current) {
      clearTimeout(statusNotificationTimeoutRef.current);
    }
  }, []);

  // Fetch in-progress tasks from API
  const fetchInProgressTasks = useCallback(
    async (showLoadingState = false, forceUpdate = false) => {
      if (!selectedProject?.id) {
        setInProgressTasks([]);
        setRunningAgentsCount(0);
        return;
      }

      if (showLoadingState) setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `${GET_AGENT_NOTIFICATIONS_IN_PROGRESS_API}?project_id=${selectedProject.id}`
        );

        if (response.data?.success) {
          const newTasks = response.data.results || [];
          const newRunningCount = response.data.count || 0;
          const oldTasks = previousInProgressRef.current;

          // Detect tasks that completed (were in-progress but now missing)
          const tasksCompleted = oldTasks.filter(
            (oldTask) => !newTasks.find((t) => t.task_id === oldTask.task_id)
          );

          const companyResearchCompleted = tasksCompleted.some(
            (t) => t?.agent_type === "CompanyResearchAgent"
          );

          // Check for status changes and show notifications
          checkForStatusChanges(oldTasks, newTasks);

          // Only update UI if tasks have actually changed or if forced
          if (forceUpdate || hasTasksChanged(oldTasks, newTasks)) {
            setInProgressTasks(newTasks);
            setRunningAgentsCount(newRunningCount);
            previousInProgressRef.current = newTasks;

            // If tasks completed, immediately fetch completed tasks to update the drawer
            if (tasksCompleted.length > 0) {
              console.log(
                `[TaskMonitor] ${tasksCompleted.length} task(s) completed, refreshing completed section...`
              );

              if (companyResearchCompleted && typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("keywords:background-refresh", {
                    detail: { project_id: selectedProject.id },
                  })
                );
              }

              // Delay slightly to ensure backend has updated
              setTimeout(() => {
                if (fetchCompletedTasksRef.current) {
                  fetchCompletedTasksRef.current(false, true);
                }
              }, 500);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching in-progress tasks:", err);
        setError(err.message || "Failed to fetch in-progress tasks");
      } finally {
        if (showLoadingState) setIsLoading(false);
      }
    },
    [selectedProject?.id]
  );

  // Fetch completed/failed tasks from API
  const fetchCompletedTasks = useCallback(
    async (showLoadingState = false, forceUpdate = false) => {
      if (!selectedProject?.id) {
        setCompletedTasks([]);
        return;
      }

      if (showLoadingState) setIsLoading(true);

      try {
        const response = await api.get(
          `${GET_AGENT_NOTIFICATIONS_COMPLETED_API}?project_id=${selectedProject.id}`
        );

        if (response.data?.success) {
          const newTasks = response.data.results || [];

          // Check for status changes and show notifications
          checkForStatusChanges(previousCompletedRef.current, newTasks);

          // Only update UI if tasks have actually changed or if forced
          if (
            forceUpdate ||
            hasTasksChanged(previousCompletedRef.current, newTasks)
          ) {
            setCompletedTasks(newTasks);
            previousCompletedRef.current = newTasks;
          }
        }
      } catch (err) {
        console.error("Error fetching completed tasks:", err);
        // Don't set error for completed tasks to avoid blocking UI
      } finally {
        if (showLoadingState) setIsLoading(false);
      }
    },
    [selectedProject?.id]
  );

  // Store in ref for use in fetchInProgressTasks
  fetchCompletedTasksRef.current = fetchCompletedTasks;

  // Check for status changes and show toast notifications
  const checkForStatusChanges = (oldTasks, newTasks) => {
    if (!oldTasks.length) return;

    newTasks.forEach((newTask) => {
      const oldTask = oldTasks.find((t) => t.task_id === newTask.task_id);

      if (oldTask && oldTask.latest_status !== newTask.latest_status) {
        const agentName = formatAgentType(newTask.agent_type);

        if (newTask.latest_status === "COMPLETED") {
          addStatusNotification(agentName, "COMPLETED");
        } else if (newTask.latest_status === "FAILED") {
          addStatusNotification(agentName, "FAILED");
        } else if (
          newTask.latest_status === "PROCESSING" &&
          oldTask.latest_status !== "PROCESSING"
        ) {
          addStatusNotification(agentName, "PROCESSING");
        }
      }
    });
  };

  // Format agent type for display
  const formatAgentType = (agentType) => {
    if (!agentType) return "Unknown Agent";
    return agentType
      .replace(/Agent$/i, "")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  // Start polling (always enabled)
  const startPolling = useCallback(() => {
    // Polling is always enabled now
  }, []);

  // Stop polling (for cleanup only)
  const stopPolling = useCallback(() => {
    if (inProgressPollingRef.current) {
      clearInterval(inProgressPollingRef.current);
      inProgressPollingRef.current = null;
    }
    if (completedPollingRef.current) {
      clearInterval(completedPollingRef.current);
      completedPollingRef.current = null;
    }
  }, []);

  // Instant refresh after starting a long-running task
  const instantRefreshAfterTaskStart = useCallback(async () => {
    if (!selectedProject?.id) return;

    try {
      // Small delay to ensure backend has processed the task start
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchInProgressTasks(false, true); // Force update to show new task
    } catch (err) {
      console.error("Error in instant refresh after task start:", err);
    }
  }, [selectedProject?.id, fetchInProgressTasks]);

  // Manual refresh (with force update)
  const refreshTasks = useCallback(() => {
    fetchInProgressTasks(true, true);
    fetchCompletedTasks(true, true);
  }, [fetchInProgressTasks, fetchCompletedTasks]);

  // Effect to handle in-progress tasks polling with adaptive intervals
  useEffect(() => {
    if (!selectedProject?.id) {
      if (inProgressPollingRef.current) {
        clearInterval(inProgressPollingRef.current);
        inProgressPollingRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchInProgressTasks(true, true);

    // Adaptive polling: faster when tasks are active, slower when idle
    const setupPolling = () => {
      if (inProgressPollingRef.current) {
        clearInterval(inProgressPollingRef.current);
      }

      const hasActiveTasks = inProgressTasks.length > 0;
      const interval = hasActiveTasks
        ? ACTIVE_POLL_INTERVAL
        : IDLE_POLL_INTERVAL;

      inProgressPollingRef.current = setInterval(() => {
        fetchInProgressTasks(false, false);
      }, interval);
    };

    setupPolling();

    return () => {
      if (inProgressPollingRef.current) {
        clearInterval(inProgressPollingRef.current);
        inProgressPollingRef.current = null;
      }
    };
  }, [selectedProject?.id, inProgressTasks.length, fetchInProgressTasks]);

  // Effect to handle completed tasks polling (less frequent)
  useEffect(() => {
    if (!selectedProject?.id) {
      if (completedPollingRef.current) {
        clearInterval(completedPollingRef.current);
        completedPollingRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchCompletedTasks(true, true);

    // Fixed interval for completed tasks (they don't change as often)
    completedPollingRef.current = setInterval(() => {
      fetchCompletedTasks(false, false);
    }, COMPLETED_POLL_INTERVAL);

    return () => {
      if (completedPollingRef.current) {
        clearInterval(completedPollingRef.current);
        completedPollingRef.current = null;
      }
    };
  }, [selectedProject?.id, fetchCompletedTasks]);

  // Fetch initial data when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      fetchInProgressTasks(true, true);
      fetchCompletedTasks(true, true);
    }
  }, [selectedProject?.id, fetchInProgressTasks, fetchCompletedTasks]);

  useEffect(() => {
    return () => {
      if (statusNotificationTimeoutRef.current) {
        clearTimeout(statusNotificationTimeoutRef.current);
      }
    };
  }, []);

  // Combine and categorize all tasks
  const allTasks = [...inProgressTasks, ...completedTasks];
  const categorizedTasks = {
    processing: inProgressTasks.filter((t) => t.latest_status === "PROCESSING"),
    completed: completedTasks.filter((t) => t.latest_status === "COMPLETED"),
    failed: completedTasks.filter((t) => t.latest_status === "FAILED"),
  };

  return (
    <TaskMonitorContext.Provider
      value={{
        tasks: allTasks,
        categorizedTasks,
        runningAgentsCount,
        isLoading,
        error,
        isDrawerOpen,
        setIsDrawerOpen,
        startPolling,
        stopPolling,
        refreshTasks,
        instantRefreshAfterTaskStart,
        formatAgentType,
        statusNotifications,
        clearStatusNotifications,
      }}
    >
      {children}
    </TaskMonitorContext.Provider>
  );
}

export function useTaskMonitor() {
  const context = useContext(TaskMonitorContext);
  if (!context) {
    throw new Error("useTaskMonitor must be used within a TaskMonitorProvider");
  }
  return context;
}
