"use client";

import { use, useRef } from "react";
import React, { useState, useEffect, useCallback } from "react";
import { formatLocalDate } from "../../../../utils/dateUtils";
import { useSelection } from "../../../context/SelectionContext";
import api from "../../../../api/axios";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  FolderTree,
  Sparkles,
  Wand2,
  Zap,
  Layers,
  Target,
  Globe,
  Cpu,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Info,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import ContentArchitectTree from "../../../components/content-architecture/ContentArchitectTree";
import DetailPanel from "../../../components/content-architecture/DetailPanel";
import BlueprintDetailPanel from "../../../components/content-architecture/BlueprintDetailPanel";
import ResizablePanel from "../../../components/content-architecture/ResizablePanel";
import BlueprintPanel from "../../../components/content-architecture/BlueprintPanel";
import ArchitectInfoModal from "../../../components/content-architecture/ArchitectInfoModal";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../lib/analytics/featureTracking";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

// Helper to count pages
const countPages = (data) => {
  if (!data) return 0;

  let count = 0;
  const traverse = (obj) => {
    if (obj.items) {
      obj.items.forEach((item) => {
        count++;
        traverse(item);
      });
    }
  };

  Object.values(data).forEach((section) => {
    traverse(section);
  });

  return count;
};

const buildNodeFromItem = (item, level = 1) => {
  if (!item) return null;

  return {
    id: item.id,
    uniqueId: item.id,
    name: item.name || item.id,
    data: item,
    level,
  };
};

// Helper to get first page from tree
const getFirstPage = (data) => {
  if (!data) return null;

  const findFirstPage = (items, level) => {
    if (!Array.isArray(items)) return null;

    for (const item of items) {
      if (item?.url) {
        return buildNodeFromItem(item, level);
      }

      if (item.items && item.items.length) {
        const child = findFirstPage(item.items, level + 1);
        if (child) return child;
      }
    }

    return null;
  };

  for (const section of Object.values(data)) {
    if (section?.url) {
      return buildNodeFromItem(section, 0);
    }

    const firstChildPage = findFirstPage(section?.items || [], 1);
    if (firstChildPage) return firstChildPage;
  }

  return null;
};

const DELETE_CONFIRMATION_PHRASE = "delete content architecture";

const findPageById = (data, pageId) => {
  if (!data || !pageId) return null;

  const searchItems = (items, level) => {
    if (!Array.isArray(items)) return null;

    for (const item of items) {
      if (item.id === pageId) {
        return buildNodeFromItem(item, level);
      }

      if (item.items && item.items.length) {
        const child = searchItems(item.items, level + 1);
        if (child) return child;
      }
    }

    return null;
  };

  for (const section of Object.values(data)) {
    if (section.id === pageId) {
      return buildNodeFromItem(section, 0);
    }

    const foundInSection = searchItems(section.items || [], 1);
    if (foundInSection) return foundInSection;
  }

  return null;
};

export default function ContentArchitecturePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageIdFromUrl = searchParams?.get("pageId");
  const autoScrollFromUrl = searchParams?.get("autoScroll") === "true";
  
  console.log("Content Architecture page params", {
    pageIdFromUrl,
    autoScrollFromUrl,
    searchParamsStr: searchParams?.toString()
  });
  const { selectedProject } = useSelection();
  const { instantRefreshAfterTaskStart } = useTaskMonitor();

  useTrackFeatureExploration("content_architecture");

  // Track feature usage
  useFeatureTracking("Content Architecture", {
    feature_category: "content_management",
    page_section: "content_architecture",
    project_id: id,
  });

  const [architect, setArchitect] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [mainPanelContent, setMainPanelContent] = useState("pageDetails");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [error, setError] = useState(null);
  const [showArchitectInfo, setShowArchitectInfo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef(null);
  const taskListRef = useRef(null);
  const overflowMenuRef = useRef(null);
  const overflowButtonRef = useRef(null);
  const deleteInputRef = useRef(null);
  const isDeleteConfirmationValid =
    deleteConfirmationInput.trim().toLowerCase() ===
    DELETE_CONFIRMATION_PHRASE;

  // Keep initial selection in sync with ?pageId=... (or fall back to first page)
  useEffect(() => {
    if (!treeData) return;

    if (pageIdFromUrl) {
      const alreadySelected =
        selectedNode?.id === pageIdFromUrl ||
        selectedNode?.data?.id === pageIdFromUrl;

      if (!alreadySelected) {
        const targetNode = findPageById(treeData, pageIdFromUrl);
        if (targetNode) {
          setSelectedNode(targetNode);
          setMainPanelContent("pageDetails");
        }
      }
      return;
    }

    if (!selectedNode) {
      const firstPage = getFirstPage(treeData);
      if (firstPage) {
        setSelectedNode(firstPage);
        setMainPanelContent("pageDetails");
      }
    }
  }, [treeData, pageIdFromUrl, selectedNode?.id]);

  useEffect(() => {
    if (!isOverflowMenuOpen) return;

    const handleClickOutside = (event) => {
      if (
        overflowMenuRef.current &&
        !overflowMenuRef.current.contains(event.target) &&
        overflowButtonRef.current &&
        !overflowButtonRef.current.contains(event.target)
      ) {
        setIsOverflowMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOverflowMenuOpen]);

  useEffect(() => {
    if (showDeleteModal) {
      const focusTimeout = setTimeout(() => {
        if (deleteInputRef.current) {
          deleteInputRef.current.focus();
          deleteInputRef.current.select();
        }
      }, 150);

      return () => clearTimeout(focusTimeout);
    }

    setDeleteConfirmationInput("");
  }, [showDeleteModal]);

  // Function to update tree data without full page reload
  const handleTreeDataUpdate = (newTreeData) => {
    setTreeData(newTreeData);
  };

  // Helper to find the immediate parent node of a given child id from the current treeData
  const findParentNodeByChildId = (data, childId) => {
    if (!data || !childId) return null;

    const searchItems = (items, level) => {
      if (!Array.isArray(items)) return null;

      for (const item of items) {
        // If this item's children contain the target child id, this item is the immediate parent
        if (
          Array.isArray(item.items) &&
          item.items.some((child) => child.id === childId)
        ) {
          return {
            id: item.id,
            uniqueId: item.id,
            name: item.name || item.id,
            data: item,
            level,
          };
        }

        // Recurse deeper to search for a parent further down the tree
        if (item.items && item.items.length) {
          const nestedParent = searchItems(item.items, level + 1);
          if (nestedParent) return nestedParent;
        }
      }

      return null;
    };

    for (const section of Object.values(data)) {
      const parent = searchItems(section.items, 1);
      if (parent) return parent;
    }

    return null;
  };

  // Handle page deletion - refresh tree and select nearest parent page
  const handlePageDeleted = async (parentPageId) => {
    trackFeatureAction("content_architecture_page_deleted", {
      project_id: selectedProject?.id,
      parent_page_id: parentPageId,
    });

    // If we don't have an architect id yet, we can't refetch navigation
    if (!architect?.id) {
      return;
    }

    // Prefer the immediate parent based on the current tree + selected node
    const deletedNodeId = selectedNode?.id;
    const immediateParentNode =
      treeData && deletedNodeId
        ? findParentNodeByChildId(treeData, deletedNodeId)
        : null;

    const preferredParentId = immediateParentNode?.id || parentPageId || null;

    try {
      const navResponse = await api.get(
        `/content-architecture/navigation/${architect.id}/`
      );

      if (navResponse.data.success && navResponse.data.data?.length > 0) {
        const navigationData = navResponse.data.data[0]?.navigation_data;

        if (navigationData) {
          setTreeData(navigationData);

          // Helper function to find the nearest available parent or, if not found, first page
          const findNearestAvailablePage = (data, targetParentId) => {
            if (!data) return null;

            const findPageById = (searchData, pageId) => {
              if (!searchData || !pageId) return null;

              const searchItems = (items, level) => {
                if (!Array.isArray(items)) return null;

                for (const item of items) {
                  if (item.id === pageId) {
                    return {
                      id: item.id,
                      uniqueId: item.id,
                      name: item.name || item.id,
                      data: item,
                      level,
                    };
                  }

                  if (item.items && item.items.length) {
                    const child = searchItems(item.items, level + 1);
                    if (child) return child;
                  }
                }

                return null;
              };

              for (const section of Object.values(searchData)) {
                // If the section itself matches the page id
                if (section.id === pageId) {
                  return {
                    id: section.id,
                    uniqueId: section.id,
                    name: section.name || section.id,
                    data: section,
                    level: 0,
                  };
                }

                const foundInSection = searchItems(section.items, 1);
                if (foundInSection) return foundInSection;
              }

              return null;
            };

            if (targetParentId) {
              const parentPage = findPageById(data, targetParentId);
              if (parentPage) {
                return parentPage;
              }
            }

            // Fallback: first available page in the tree (any node with a URL)
            const findFirstAvailablePage = (searchData) => {
              if (!searchData) return null;

              const searchItems = (items, level) => {
                if (!Array.isArray(items)) return null;

                for (const item of items) {
                  if (item.url) {
                    return {
                      id: item.id,
                      uniqueId: item.id,
                      name: item.name || item.id,
                      data: item,
                      level,
                    };
                  }

                  if (item.items && item.items.length) {
                    const child = searchItems(item.items, level + 1);
                    if (child) return child;
                  }
                }

                return null;
              };

              for (const section of Object.values(searchData)) {
                const found = searchItems(section.items, 1);
                if (found) return found;
              }

              return null;
            };

            return findFirstAvailablePage(data);
          };

          const nearestPage = findNearestAvailablePage(
            navigationData,
            preferredParentId
          );
          if (nearestPage) {
            setSelectedNode(nearestPage);
          }
        }
      }
    } catch (error) {
      console.error("Error handling page deletion:", error);
    }
  };

  // Handle page update - refresh tree data
  const handlePageUpdated = async () => {
    trackFeatureAction("content_architecture_page_updated", {
      project_id: selectedProject?.id,
    });

    await fetchArchitect(false);
  };
  // Check if company research data exists before loading content architecture
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
      } catch (checkError) {
        console.error("Error checking company research data:", checkError);
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };

    checkCompanyResearch();
  }, [id, selectedProject?.id]);

  // Load existing architect only after company research data exists
  useEffect(() => {
    if (selectedProject?.id && companyResearchChecked && hasCompanyResearch) {
      fetchArchitect();
    }
  }, [selectedProject?.id, companyResearchChecked, hasCompanyResearch]);

  // Poll every 30 seconds while architecture is not yet completed
  useEffect(() => {
    let pollInterval;

    if (
      selectedProject?.id &&
      architect?.status &&
      architect.status !== "completed"
    ) {
      pollInterval = setInterval(() => {
        fetchArchitect(false);
      }, 30000); // 30 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedProject?.id, architect?.status]);

  // Handle scroll to hide/show header
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Poll task status when generating
  useEffect(() => {
    let interval;
    let retryCount = 0;
    let hasShownFailureToast = false;
    const MAX_RETRIES = 3;
    const POLLING_INTERVAL = 30000; // 30 seconds

    if (generating && taskId && selectedProject?.id) {
      // Define the polling function
      const pollTaskStatus = async () => {
        try {
          const response = await api.get(
            `/content-architecture/data/${selectedProject.id}/`
          );

          // Reset retry count on successful API call
          retryCount = 0;

          // Find the task with matching taskId
          const task = response.data.data.find(
            (arch) => arch.task_id === taskId
          );

          if (task) {
            // Update UI with latest progress
            setGenerationProgress(task.overall_percentage || 0);

            // Format the current step for better display
            const currentStep = task.current_step || "";
            const formattedStep = currentStep
              .replace(/step_\d+_\d+_/, "") // Remove step prefix
              .replace(/_/g, " ") // Replace underscores with spaces
              .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCase
              .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

            setCurrentTask(formattedStep);

            // Handle task completion
            if (task.status === "completed") {
              console.log(
                "Task completed detected, calling fetchArchitect to get navigation data"
              );
              setGenerating(false);
              setTaskId(null);
              await fetchArchitect();
              toast.success("Architecture generated successfully! 🎉");
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 5000);
            }
            // Handle task failure
            else if (task.status === "failed") {
              // Keep polling even when task reports failed, as it might recover
              // Show error message only once to avoid repeated toasts
              if (!hasShownFailureToast) {
                const errorMessage = task.error
                  ? `Generation failed: ${task.error}`
                  : "Architecture generation failed. The system will keep checking for updates.";

                toast.error(errorMessage);
                hasShownFailureToast = true;
              }
            }
          } else {
            // Task not found in the response
            console.warn(`Task ${taskId} not found in API response`);
          }
        } catch (error) {
          console.error("Error polling task status:", error);

          // Implement retry logic but keep polling even after failures
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            toast.error(
              "Temporary connection issue while checking architecture status. Will keep retrying in the background."
            );
            retryCount = 0; // reset count and continue polling
          }
        }
      };

      // Initial poll immediately
      pollTaskStatus();

      // Set up interval for subsequent polls
      interval = setInterval(pollTaskStatus, POLLING_INTERVAL);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generating, taskId, selectedProject?.id]);

  // Auto-scroll to processing step in generation progress
  useEffect(() => {
    const steps = architect?.steps || [];
    const processingStepIndex = steps.findIndex(
      (step) => step.status === "processing"
    );

    if (processingStepIndex >= 0 && taskListRef.current) {
      const scrollContainer = taskListRef.current;
      const processingElement = scrollContainer.children[processingStepIndex];

      if (processingElement) {
        // Use setTimeout to ensure DOM is rendered
        setTimeout(() => {
          processingElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }, 100);
      }
    }
  }, [architect?.steps]);

  // API Functions
  const fetchArchitect = async (showLoading = true) => {
    if (!selectedProject?.id) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      trackFeatureAction("content_architecture_fetch_started", {
        project_id: selectedProject.id,
        show_loading: showLoading,
      });

      const response = await api.get(
        `/content-architecture/data/${selectedProject.id}/`
      );

      const architectData = response.data.data?.[0]; // Get first item from array

      if (!architectData) {
        // No architect exists
        setArchitect(null);
        setTreeData(null);
        setLoading(false);
        return;
      }

      // Process architect data based on new API structure
      const processedArchitect = {
        id: architectData._id,
        taskId: architectData.task_id,
        name: architectData.company_name || "Content Architecture",
        status: architectData.status,
        currentStep: architectData.current_step || "",
        overallPercentage: architectData.overall_percentage || 0,
        steps: architectData.steps || [],
        retryCount: architectData.retry_count || 0,
        companyDoc: architectData.company_doc,
        createdAt: architectData.created_at,
        updatedAt: architectData.updated_at,
      };

      setArchitect(processedArchitect);

      // Update generation progress if processing
      if (processedArchitect.status === "processing") {
        setGenerationProgress(processedArchitect.overallPercentage);
        const activeStep = processedArchitect.steps.find(
          (s) => s.status === "processing"
        );
        if (activeStep) {
          setCurrentTask(activeStep.name);
        }
      }

      // If completed (check for both 'completed' and 'company_data_loaded'), fetch navigation data
      if (
        processedArchitect.status === "completed" ||
        processedArchitect.status === "company_data_loaded"
      ) {
        console.log(
          "Architect completed, fetching navigation data for ID:",
          architectData._id
        );
        console.log("Architect Data Details:", processedArchitect);
        try {
          const navResponse = await api.get(
            `/content-architecture/navigation/${architectData._id}/`
          );

          console.log("Navigation API Response:", navResponse.data);

          if (navResponse.data.success && navResponse.data.data?.length > 0) {
            const navigationData = navResponse.data.data[0]?.navigation_data;

            console.log("Navigation Data:", navigationData);

            if (navigationData) {
              setTreeData(navigationData);

              // Show confetti on initial load if completed
              if (showLoading) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
              }
            } else {
              console.log("Navigation API Response Details:", navResponse.data);
              console.warn("Navigation data is empty or null");
            }
          } else {
            console.log("Navigation API Response Details:", navResponse.data);
            console.warn("Navigation API returned no data");
          }
        } catch (navError) {
          console.error("Error fetching navigation data:", navError);
          setError("Could not load content structure");
        }
      }
    } catch (error) {
      console.error("Error fetching architect:", error);
      if (showLoading) {
        setError("Failed to load content architecture");
        toast.error("Failed to load content architecture");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";

    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    // Less than a minute
    if (seconds < 60) {
      return "Just now";
    }

    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    // Less than a week
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }

    // Format as date
    return formatLocalDate(date);
  };

  const handleGenerateArchitect = async () => {
    if (!selectedProject?.id) {
      toast.error("Please select a project first");
      return;
    }

    // Track generation attempt with context
    trackFeatureAction("content_architecture_generation_started", {
      project_id: selectedProject.id,
      existing_status: architect?.status || "none",
      existing_architect_id: architect?.id || null,
      generation_trigger: "manual_button_click",
    });

    // Check if architect already exists or is processing
    if (architect?.status === "processing") {
      toast.error("Content architecture is already being generated");
      return;
    }

    if (architect?.status === "completed") {
      toast.error(
        "Content architecture already exists. Delete it first to generate a new one."
      );
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setCurrentTask("Initializing...");

    const generationToastId = "generation-" + Date.now();
    toast.loading("Starting content architecture generation...", {
      id: generationToastId,
    });

    try {
      // Call the generate API
      const response = await api.post("/content-architecture/generate/", {
        project_id: selectedProject.id,
      });

      console.log("response--------->", response.data);

      if (response.data.success) {
        setTaskId(response.data.task_id);
        toast.success("Generation started successfully!", {
          id: generationToastId,
        });

        // Update the task info from the response
        if (response.data.check_status_url) {
          setCurrentTask(
            `Task started - ${response.data.message || "Processing"}`
          );
        }

        // Instant refresh to show the new task in monitor
        if (instantRefreshAfterTaskStart) {
          await instantRefreshAfterTaskStart();
        }

        // Start polling immediately
        fetchArchitect(false);
      } else {
        // API returned success: false
        toast.error(response.data.message || "Failed to start generation", {
          id: generationToastId,
        });
        setGenerating(false);
        setTaskId(null);
      }
    } catch (error) {
      console.error("Error generating architect:", error);

      // Show appropriate error message based on error type
      if (error.response) {
        // Server responded with error status
        const errorMsg =
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        toast.error(errorMsg, { id: generationToastId });
      } else if (error.request) {
        // Request made but no response received (network error)
        toast.error("Network error. Please check your connection", {
          id: generationToastId,
        });
      } else {
        // Something else went wrong
        toast.error(
          "Failed to generate content architecture. Please try again.",
          { id: generationToastId }
        );
      }

      setGenerating(false);
      setTaskId(null);
    }
  };

  const handleViewArchitectureDetails = () => {
    setShowArchitectInfo(true);
    setIsOverflowMenuOpen(false);
  };

  const handleDeleteArchitect = () => {
    if (!architect?.id) return;
    setIsOverflowMenuOpen(false);
    setDeleteConfirmationInput("");
    setShowDeleteModal(true);
  };

  const confirmDeleteArchitect = async () => {
    if (!architect?.id) return;

    const normalizedInput = deleteConfirmationInput.trim().toLowerCase();
    if (normalizedInput !== DELETE_CONFIRMATION_PHRASE) {
      toast.error(`Please type "${DELETE_CONFIRMATION_PHRASE}" to confirm.`);
      return;
    }

    setShowDeleteModal(false);
    setDeleteConfirmationInput("");
    setDeleting(true);
    const deleteToastId = "delete-" + Date.now();
    toast.loading("Deleting content architecture...", { id: deleteToastId });

    trackFeatureAction("content_architecture_delete_started", {
      project_id: selectedProject?.id,
      architect_id: architect.id,
    });

    try {
      await api.delete(`/content-architecture/delete/${architect.id}/`);

      toast.success("Content architecture deleted successfully", {
        id: deleteToastId,
      });

      // Reset state
      setArchitect(null);
      setTreeData(null);
      setSelectedNode(null);
      setError(null);
    } catch (error) {
      console.error("Error deleting architect:", error);
      toast.error("Failed to delete content architecture", {
        id: deleteToastId,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRetryGeneration = () => {
    trackFeatureAction("content_architecture_generation_retry", {
      project_id: selectedProject?.id,
      previous_status: architect?.status || "none",
      retry_trigger: "failed_state_button",
    });

    handleGenerateArchitect();
  };

  const handleNodeSelect = (node) => {
    trackFeatureAction("content_architecture_node_selected", {
      project_id: selectedProject?.id,
      node_id: node.id,
      node_type: node.type || "unknown",
      node_title: node.data?.label || node.title || "untitled",
    });

    // Keep URL in sync with the selected page so refresh/share links work and
    // downstream detail fetching uses the correct page.
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (node?.id) {
      params.set("pageId", String(node.id));
    } else {
      params.delete("pageId");
    }
    // Clear autoScroll when user clicks within the tree (internal navigation)
    params.delete("autoScroll");

    const nextUrl = `${pathname}?${params.toString()}`;
    router.replace(nextUrl);

    setSelectedNode(node);
    setMainPanelContent("pageDetails");
  };

  const handleBlueprintSelect = (blueprint) => {
    trackFeatureAction("content_architecture_blueprint_selected", {
      project_id: selectedProject?.id,
      blueprint_id: blueprint.id,
      blueprint_type: blueprint.type || "unknown",
      blueprint_title: blueprint.title || "untitled",
    });

    setSelectedBlueprint(blueprint);
    setMainPanelContent("blueprintDetails");
  };

  // Calculate metrics
  const totalPages = treeData ? countPages(treeData) : 0;
  const publishedPages = Math.floor(totalPages * 0.7);
  const totalKeywords = Math.floor(totalPages * 3.5);

  const renderGenerationProgress = () => {
    const steps = architect?.steps || [];
    const progressValue =
      generationProgress || architect?.overallPercentage || 0;
    const formattedTask =
      currentTask || architect?.currentStep || "Initializing";

    // Find the currently processing step
    const processingStepIndex = steps.findIndex(
      (step) => step.status === "processing"
    );

    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-[#eef1ff] via-[#f3f4ff] to-[#edf7ff]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 px-10 py-12"
        >
          <div className="flex flex-col items-center text-center">
            {/* Ring animation */}
            <div className="relative mb-8">
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border-4 border-dashed border-sky-400/70"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-inner"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Cpu className="h-12 w-12 text-sky-600" />
              </motion.div>
            </div>

            <motion.h2
              className="text-3xl font-bold text-gray-900 tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Generating Your Architecture
            </motion.h2>

            <motion.p
              className="mt-3 text-sm font-medium text-sky-600 flex items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex"
              >
                <Clock className="h-4 w-4" />
              </motion.span>
              Current Step : {formattedTask.replace(/_/g, " ")}
            </motion.p>

            {/* Progress bar */}
            <div className="w-full mt-10">
              <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(progressValue, 8)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs font-semibold text-gray-600 uppercase">
                <span>Generating Content Architecture</span>
                <span>{Math.round(progressValue)}% Complete</span>
              </div>
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div className="mt-8 w-full max-h-56 overflow-y-auto pr-1">
                <div ref={taskListRef} className="space-y-3">
                  {steps.map((step, index) => {
                    const status = step.status;
                    const isCompleted = status === "completed";
                    const isProcessing = status === "processing";

                    return (
                      <motion.div
                        key={step.name + index}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: isProcessing ? [1, 1.02, 1] : 1,
                          borderColor: isProcessing
                            ? ["#3b82f6", "#60a5fa", "#3b82f6"]
                            : undefined,
                        }}
                        transition={{
                          delay: index * 0.05,
                          borderColor: isProcessing
                            ? { duration: 2, repeat: Infinity }
                            : {},
                        }}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                          isCompleted
                            ? "bg-green-50/70 border-green-100 text-green-700"
                            : isProcessing
                            ? "bg-blue-50/70 border-blue-100 text-blue-600 shadow-md"
                            : "bg-gray-50 border-gray-100 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0.6, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 18,
                            }}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </motion.div>
                        ) : isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <RefreshCw className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-current opacity-70" />
                        )}
                        <div className="text-left text-sm font-medium">
                          {step.name.replace(/_/g, " ")}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl px-8 py-10 rounded-3xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full"
        />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            Loading Content Architecture
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Fetching latest architect data...
          </p>
        </div>
      </motion.div>
    </div>
  );

  const isProcessingState = generating || architect?.status === "processing";

  // Gate: require knowledge base sources before using content architecture
  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto w-full px-4 pt-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Content Architecture AI
            </h1>
            <p className="mt-2 text-gray-700">
              Generate and manage a structured content architecture for this
              project.
            </p>
          </div>

          <div className="flex items-center justify-center pt-28">
            <KnowledgeBaseGateAlert
              projectId={id}
              description="Add your school research sources in the knowledge base before generating a content architecture."
            />
          </div>
        </div>
      </div>
    );
  }

  if (isProcessingState) {
    return renderGenerationProgress();
  }

  // While checking company research or loading architect data, show loader
  if (!companyResearchChecked || loading) {
    return renderLoadingState();
  }

  // Empty state - no architect exists
  if (!architect && !generating) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-sky-300 to-blue-300 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-3xl"
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center z-10 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl"
          >
            {/* Animated icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full blur-xl"
                />
                <div className="relative w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                  <FolderTree className="h-16 w-16 text-sky-600" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-black mb-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent"
            >
              Content Architecture AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-700 mb-8 leading-relaxed"
            >
              Let our AI analyze your school's data and generate a comprehensive
              website architecture with intelligent hierarchy, enrollment-focused
              SEO optimization, and strategic content planning.
            </motion.p>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4 mb-10"
            >
              {[
                { icon: Layers, label: "Smart Hierarchy", color: "sky" },
                { icon: Target, label: "SEO Focused", color: "blue" },
                { icon: Zap, label: "Instant Setup", color: "indigo" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200"
                >
                  <feature.icon
                    className={`h-8 w-8 text-${feature.color}-600 mx-auto mb-3`}
                  />
                  <p className="text-sm font-semibold text-gray-700">
                    {feature.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 60px rgba(139, 92, 246, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateArchitect}
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg overflow-hidden cursor-pointer shadow-2xl"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700"
                initial={{ x: "100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <Wand2 className="h-6 w-6 relative z-10" />
              <span className="relative z-10">
                Generate School Architecture
              </span>
              <Sparkles className="h-5 w-5 relative z-10 group-hover:rotate-12 transition-transform" />
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-gray-600"
            >
              ✨ Powered by advanced AI • Takes ~5 seconds • No manual setup
              required
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Failed state
  if (architect?.status === "failed") {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generation Failed
          </h2>
          <p className="text-gray-600 mb-6">
            The content architecture generation process failed. Please try
            again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetryGeneration}
              className="flex flex-nowrap cursor-pointer items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Generation
            </button>
            <button
              onClick={handleDeleteArchitect}
              disabled={deleting}
              className="flex flex-nowrap cursor-pointer items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete & Start Over"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main view with completed architecture - only show if we have tree data
  const isCompleted =
    architect?.status === "completed" ||
    architect?.status === "company_data_loaded";

  // if (!architect || !treeData || !isCompleted) {
  //   // If we somehow got here without proper data, show loading or empty state
  //   console.log("Render check - architect:", architect, "treeData:", treeData, "status:", architect?.status, "isCompleted:", isCompleted);
  //   return <ArchitectsListShimmer />;
  // }

  console.log(
    "Rendering tree view with data:",
    treeData,
    "selectedNode:",
    selectedNode
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 relative">
      {/* {showConfetti && <Confetti recycle={false} numberOfPieces={500} />} */}

      {/* Header */}
      <AnimatePresence>
        {headerVisible && (
          <motion.header
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0"
          >
            <div className="flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 w-full justify-between"
              >
                {/* Company Name Section */}
                <div>
                  <h1 className="text-3xl font-bold leading-tight">
                    Content Architecture AI
                  </h1>
                  <button
                    onClick={() => setShowArchitectInfo(true)}
                    className="text-xs text-underline text-gray-600 mt-0.5 flex items-center gap-1.5 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5  bg-green-500 rounded-full animate-pulse"></span>
                    {architect?.name || "Content Structure"}
                    <Info className="h-3 w-3" />
                  </button>
                </div>

                {/* Overflow Menu */}
                <div className="relative">
                  <button
                    ref={overflowButtonRef}
                    onClick={() =>
                      setIsOverflowMenuOpen((previous) => !previous)
                    }
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={isOverflowMenuOpen}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {isOverflowMenuOpen && (
                    <div
                      ref={overflowMenuRef}
                      className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 py-2"
                      role="menu"
                    >
                      <button
                        onClick={handleViewArchitectureDetails}
                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        role="menuitem"
                      >
                        <Info className="h-4 w-4 text-sky-600" />
                        View architecture details
                      </button>
                      <button
                        onClick={handleDeleteArchitect}
                        disabled={deleting}
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                        role="menuitem"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? "Deleting..." : "Delete architecture"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Tree Sidebar */}
        <ResizablePanel>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col bg-white border-r border-gray-200 shadow-lg z-0 h-full"
          >
            <div className="p-4 h-[calc(100vh-120px)] overflow-y-auto">
              <ContentArchitectTree
                data={treeData}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeSelect}
                projectId={id}
                architectId={architect?.id}
                onTreeDataUpdate={handleTreeDataUpdate}
                autoScroll={autoScrollFromUrl}
              />
            </div>
            <BlueprintPanel
              projectId={id}
              onBlueprintSelect={handleBlueprintSelect}
              selectedBlueprint={selectedBlueprint}
            />
          </motion.div>
        </ResizablePanel>

        {/* Detail Panel */}
        <motion.div
          ref={scrollContainerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-y-auto min-w-0 overflow-x-hidden"
        >
          {mainPanelContent === "pageDetails" ? (
            <DetailPanel
              selectedNode={selectedNode}
              projectId={id}
              projectDetails={architect?.companyDoc}
              architectId={architect?.id}
              onPageDeleted={handlePageDeleted}
              onPageUpdated={handlePageUpdated}
            />
          ) : (
            <BlueprintDetailPanel blueprint={selectedBlueprint} />
          )}
        </motion.div>
      </div>

      {/* Architect Info Modal */}
      <ArchitectInfoModal
        architect={architect}
        isOpen={showArchitectInfo}
        onClose={() => setShowArchitectInfo(false)}
      />

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Delete Content Architecture
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete this content architecture?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <div>
                    <h4 className="font-medium text-red-900">
                      This action cannot be undone
                    </h4>
                    <p className="text-sm text-red-700">
                      All generated content, navigation structure, and associated
                      data will be permanently deleted and cannot be recovered.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      To confirm, type the exact phrase below.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-3 py-1 text-xs font-semibold text-red-900 bg-white border border-red-200 rounded-full font-mono">
                        {DELETE_CONFIRMATION_PHRASE}
                      </span>
                    </div>
                    <input
                      ref={deleteInputRef}
                      placeholder={DELETE_CONFIRMATION_PHRASE}
                      value={deleteConfirmationInput}
                      onChange={(event) =>
                        setDeleteConfirmationInput(event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    {!isDeleteConfirmationValid && deleteConfirmationInput && (
                      <p className="mt-1 text-xs text-red-600">
                        Phrase must match exactly, including spaces.
                      </p>
                    )}
                  </div>
                </div>

                {architect && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">
                      Architecture to delete:
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {architect.name || "Content Architecture"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteArchitect}
                disabled={deleting || !isDeleteConfirmationValid}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete Architecture"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
