"use client";

import { use } from "react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import {
  ChevronLeft,
  FolderTree,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../../../api/axios";
import ContentArchitectTree from "../../../../components/content-architecture/ContentArchitectTree";
import DetailPanel from "../../../../components/content-architecture/DetailPanel";
import BlueprintDetailPanel from "../../../../components/content-architecture/BlueprintDetailPanel";
import ContentArchitectDetailsShimmer from "../../../../components/content-architecture/ContentArchitectDetailsShimmer";
import { useSelection } from "../../../../context/SelectionContext";
import ResizablePanel from "../../../../components/content-architecture/ResizablePanel";
import BlueprintPanel from "../../../../components/content-architecture/BlueprintPanel";
import ArchitectInfoModal from "../../../../components/content-architecture/ArchitectInfoModal";
import useFeatureTracking from "../../../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../../../lib/analytics/featureTracking";

// Helper to count pages
const countPages = (data) => {
  let count = 0;
  const traverse = (obj) => {
    if (obj.items) {
      if (Array.isArray(obj.items)) {
        obj.items.forEach((item) => {
          count++;
          if (item.items) traverse(item);
        });
      } else {
        Object.values(obj.items).forEach((item) => traverse(item));
      }
    }
  };

  if (data) {
    Object.values(data).forEach((item) => {
      count++;
      traverse(item);
    });
  }

  return count;
};

// Helper to get first page
const getFirstPage = (data) => {
  if (!data) return null;

  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  console.log("entries--------->", entries[0]);

  const [firstKey, firstValue] = entries[0];
  console.log("firstKey--------->", firstKey);
  console.log("firstValue--------->", firstValue);
  return {
    id: firstValue.id,
    uniqueId: firstValue.id,
    name: firstValue.name || firstKey,
    data: firstValue,
    level: 0,
  };
};

export default function ContentArchitectureDetailsPage({ params }) {
  const { id, architectId } = use(params);
  const { selectedProject } = useSelection();
  const router = useRouter();

  // Track feature usage
  useFeatureTracking("Content Architecture Details", {
    feature_category: "content_management",
    page_section: "content_architecture_details",
    project_id: id,
    architect_id: architectId,
  });

  const [architect, setArchitect] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [mainPanelContent, setMainPanelContent] = useState("pageDetails");
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);
  const [showArchitectInfo, setShowArchitectInfo] = useState(false);

  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef(null);

  // Load architect data on mount
  useEffect(() => {
    if (selectedProject?.id && architectId) {
      fetchArchitectDetails();
    }
  }, [selectedProject?.id, architectId]);

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

  // API Functions
  const fetchArchitectDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      trackFeatureAction("content_architecture_details_fetch_started", {
        project_id: selectedProject.id,
        architect_id: architectId,
      });

      // First fetch the architect data
      const response = await api.get(
        `/content-architecture/data/${selectedProject.id}/`
      );

      const architectsData = response.data.data || [];
      const currentArchitect = architectsData.find(
        (arch) => arch._id === architectId
      );

      if (!currentArchitect) {
        setError("Architect not found");
        setLoading(false);
        return;
      }

      // Process architect data
      const processedArchitect = {
        id: currentArchitect._id,
        taskId: currentArchitect.task_id,
        name: currentArchitect.company_name || "Content Architecture",
        status: currentArchitect.status,
        taskStatus: currentArchitect.task_status,
        companyDoc: currentArchitect.company_doc,
        createdAt: currentArchitect.created_at,
        updatedAt: currentArchitect.updated_at,
        totalSteps: currentArchitect.task_status?.metadata?.total_steps || 0,
        completedSteps:
          currentArchitect.task_status?.metadata?.completed_steps || 0,
        failedSteps: currentArchitect.task_status?.metadata?.failed_steps || 0,
        currentStep: currentArchitect.task_status?.current_step || "",
        progress: currentArchitect.task_status?.overall_percentage || 0,
        startedAt: currentArchitect.task_status?.started_at,
        completedAt: currentArchitect.task_status?.completed_at,
        error: currentArchitect.task_status?.error,
      };

      setArchitect(processedArchitect);

      trackFeatureAction("content_architecture_details_fetch_success", {
        project_id: selectedProject.id,
        architect_id: architectId,
        architect_status: processedArchitect.status,
        progress_percentage: processedArchitect.progress,
      });

      // If the architect is in processing state, don't try to load navigation data
      if (
        processedArchitect.taskStatus?.overall_status === "processing" ||
        processedArchitect.taskStatus?.overall_status === "failed"
      ) {
        setLoading(false);
        return;
      }

      // Then fetch navigation data
      try {
        const navResponse = await api.get(
          `/content-architecture/navigation/${architectId}/`
        );

        if (navResponse.data.success && navResponse.data.data?.length > 0) {
          const navigationData = navResponse.data.data[0]?.navigation_data;

          if (navigationData) {
            setTreeData(navigationData);

            // Auto-select first page
            const firstPage = getFirstPage(navigationData);
            if (firstPage) {
              setSelectedNode(firstPage);
            }

            // Show confetti animation for completed architects
            if (
              processedArchitect.taskStatus?.overall_status === "completed" &&
              !processedArchitect.error
            ) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
          } else {
            setError("No content structure found for this architect");
          }
        } else {
          setError("Could not load content structure");
        }
      } catch (navError) {
        console.error("Error fetching navigation data:", navError);

        // Show appropriate error message based on error type
        if (navError.response) {
          if (navError.response.status === 404) {
            setError("Content structure not found");
          } else if (navError.response.status === 403) {
            setError("You don't have permission to view this content");
          } else {
            setError(
              `Failed to load architecture data: ${navError.response.status}`
            );
          }
        } else if (navError.request) {
          setError("Network error. Please check your connection");
        } else {
          setError("Failed to load architecture data");
        }
      }
    } catch (error) {
      console.error("Error fetching architect details:", error);
      setError("Failed to load architect details");
    } finally {
      setLoading(false);
    }
  };

  const handleNodeSelect = (node) => {
    console.log("node--------->", node);

    setSelectedNode(node);
    setMainPanelContent("pageDetails");
  };

  const handleBlueprintSelect = (blueprint) => {
    setSelectedBlueprint(blueprint);
    setMainPanelContent("blueprintDetails");
  };

  const handleBackToList = () => {
    router.push(`/projects/${id}/content-architecture`);
  };

  // Calculate metrics
  const totalPages = treeData ? countPages(treeData) : 0;
  const publishedPages = Math.floor(totalPages * 0.7); // Estimate 70% published
  const totalKeywords = Math.floor(totalPages * 3.5); // Estimate 3.5 keywords per page

  // Loading state
  if (loading) {
    return <ContentArchitectDetailsShimmer />;
  }

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Content Architecture
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToList}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Architects List
          </button>
        </div>
      </div>
    );
  }

  // Processing state
  if (architect?.taskStatus?.overall_status === "processing") {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
                Back to Architects
              </button>
              <div>
                <h1 className="text-3xl font-bold">{architect.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Processing ({architect.progress}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <FolderTree className="h-12 w-12 text-blue-600" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Generating Your Architecture
            </h2>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <motion.div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${architect.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex items-center justify-center gap-3 text-sm mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
              />
              <span className="text-gray-900 font-medium">
                {architect.currentStep
                  .replace(/step_\d+_\d+_/, "")
                  .replace(/_/g, " ")
                  .replace(/([a-z])([A-Z])/g, " $2")
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </span>
            </div>

            <p className="text-center text-gray-600 text-sm">
              Step {architect.completedSteps} of {architect.totalSteps} •{" "}
              {architect.progress}% Complete
            </p>

            <button
              onClick={handleBackToList}
              className="mt-8 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Architects List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (architect?.taskStatus?.overall_status === "failed") {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
                Back to Architects
              </button>
              <div>
                <h1 className="text-3xl font-bold">{architect.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Generation Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {architect.error ||
                "The content architecture generation process failed. Please try again."}
            </p>
            <button
              onClick={handleBackToList}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Architects List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main view with data
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
            className="bg-white shadow-sm border-b border-gray-200 px-1 py-2 flex-shrink-0 z-20"
          >
            <div className="flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex items-center gap-3"
              >
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-3xl font-bold leading-tight">
                      Content Architecture
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      {architect?.name || "Content Structure"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowArchitectInfo(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                  >
                    <Info className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </motion.div>

              {/* Metrics */}
              <div className="flex gap-3 flex-1 justify-center">
                {[
                  {
                    icon: FolderTree,
                    label: "Total Pages",
                    value: totalPages,
                    gradient: "from-blue-500 to-cyan-500",
                    bg: "from-blue-50 to-cyan-50",
                  },
                  {
                    icon: TrendingUp,
                    label: "Published",
                    value: publishedPages,
                    gradient: "from-green-500 to-emerald-500",
                    bg: "from-green-50 to-emerald-50",
                  },
                  {
                    icon: Activity,
                    label: "Keywords",
                    value: totalKeywords,
                    gradient: "from-purple-500 to-pink-500",
                    bg: "from-purple-50 to-pink-50",
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-br flex space-x-2 justify-between items-center ${metric.bg} border border-gray-200 rounded-md px-3 py-2 min-w-[120px] cursor-default shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                        {metric.label}
                      </span>
                    </div>
                    <div className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree Sidebar - No fixed width, controlled by ContentArchitectTree component */}
        <ResizablePanel>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col bg-white border-r border-gray-200 shadow-lg z-10 h-full"
          >
            <div className="p-4 h-[calc(100vh-120px)] overflow-y-auto">
              <ContentArchitectTree
                data={treeData}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeSelect}
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
          className="flex-1 overflow-y-auto"
        >
          {mainPanelContent === "pageDetails" ? (
            <DetailPanel
              selectedNode={selectedNode}
              projectId={id}
              projectDetails={architect.companyDoc}
              architectId={architectId}
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
    </div>
  );
}
