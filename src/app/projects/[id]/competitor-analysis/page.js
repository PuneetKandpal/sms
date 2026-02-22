"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelection } from "../../../context/SelectionContext";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../api/axios";
import toast from "react-hot-toast";
import {
  Swords,
  Search,
  Loader2,
  Calendar,
  Building,
  Target,
  Globe,
  Lock,
  LockOpen,
  AlertCircle,
  Shield,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import AnalysisList from "../../../components/competitor-analysis/AnalysisList";
import AnalysisEditor from "../../../components/competitor-analysis/AnalysisEditor";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

const LOCK_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;
const RAW_INACTIVITY_MINUTES = Number(
  process.env.NEXT_PUBLIC_COMP_ANALYSIS_INACTIVITY_MINUTES ?? 15
);
const INACTIVITY_TIMEOUT_MINUTES = Number.isFinite(RAW_INACTIVITY_MINUTES)
  ? RAW_INACTIVITY_MINUTES
  : 15;
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "focus",
  "touchstart",
];

const getActivityEventTarget = (eventName) => {
  if (typeof window === "undefined") return null;
  if (eventName === "visibilitychange") {
    return typeof document !== "undefined" ? document : null;
  }
  return window;
};

export default function CompetitorAnalysisPage() {
  const { selectedProject } = useSelection();
  const router = useRouter();
  const params = useParams();
  const { id: projectId } = params;

  useTrackFeatureExploration("competitor_analysis");

  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Lock management state
  const [lockStatus, setLockStatus] = useState(null);
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);
  const [forcePreviewKey, setForcePreviewKey] = useState(0);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const lockHeartbeatRef = useRef(null);
  const inactivityIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const activityListenersActiveRef = useRef(false);
  const isEditingRef = useRef(false);
  const handleInactivityTimeoutRef = useRef(null);
  const currentAnalysisIdRef = useRef(null);
  const detailRequestSeqRef = useRef(0);

  useEffect(() => {
    currentAnalysisIdRef.current = selectedAnalysis?.analysis_id || null;
  }, [selectedAnalysis?.analysis_id]);

  const handleActivity = useCallback(() => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }
    lastActivityRef.current = Date.now();
  }, []);

  const stopActivityTracking = useCallback(() => {
    if (!activityListenersActiveRef.current) return;
    ACTIVITY_EVENTS.forEach((eventName) => {
      const target = getActivityEventTarget(eventName);
      target?.removeEventListener(eventName, handleActivity);
    });
    activityListenersActiveRef.current = false;
    if (inactivityIntervalRef.current) {
      clearInterval(inactivityIntervalRef.current);
      inactivityIntervalRef.current = null;
    }
  }, [handleActivity]);

  const startActivityTracking = useCallback(() => {
    if (activityListenersActiveRef.current) return;
    ACTIVITY_EVENTS.forEach((eventName) => {
      const target = getActivityEventTarget(eventName);
      target?.addEventListener(eventName, handleActivity, { passive: true });
    });
    lastActivityRef.current = Date.now();
    activityListenersActiveRef.current = true;
    inactivityIntervalRef.current = setInterval(() => {
      if (!isEditingRef.current) return;
      const now = Date.now();
      if (
        handleInactivityTimeoutRef.current &&
        now - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS
      ) {
        handleInactivityTimeoutRef.current();
      }
    }, INACTIVITY_CHECK_INTERVAL_MS);
  }, [handleActivity]);

  const stopLockHeartbeat = useCallback(() => {
    if (lockHeartbeatRef.current) {
      clearInterval(lockHeartbeatRef.current);
      lockHeartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Use projectId from URL if available, otherwise fall back to selectedProject
    const effectiveProjectId = projectId || selectedProject?.id;
    if (!effectiveProjectId) {
      router.push("/projects");
      return;
    }
    fetchAnalysisList();
  }, [selectedProject?.id, projectId]);

  const fetchAnalysisList = async () => {
    // Use projectId from URL if available, otherwise fall back to selectedProject
    const effectiveProjectId = projectId || selectedProject?.id;
    if (!effectiveProjectId) return;

    setIsLoadingList(true);
    try {
      const response = await api.get("/rival-agent/competitor-analysis-list/", {
        params: { project_id: effectiveProjectId },
      });

      if (response.data?.status === "success") {
        setAnalyses(response.data.analyses || []);
        const nextAnalyses = response.data.analyses || [];
        const hasSelection = Boolean(currentAnalysisIdRef.current);
        if (!hasSelection && nextAnalyses.length > 0) {
          handleSelectAnalysis(nextAnalyses[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching competitor analyses:", error);
      toast.error("Failed to load competitor analyses");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSelectAnalysis = async (analysis) => {
    if (!analysis?.analysis_id) return;
    console.log(
      "[LOCK] handleSelectAnalysis called for:",
      analysis.analysis_id,
      "current:",
      selectedAnalysis?.analysis_id
    );

    // Only release lock if switching to a DIFFERENT analysis
    if (
      selectedAnalysis?.analysis_id &&
      selectedAnalysis.analysis_id !== analysis.analysis_id
    ) {
      console.log("[LOCK] Switching analysis - releasing old lock");
      await releaseLock(selectedAnalysis.analysis_id);
    }

    // If selecting same analysis, just return
    if (selectedAnalysis?.analysis_id === analysis.analysis_id) {
      console.log("[LOCK] Same analysis selected, skipping reload");
      return;
    }

    // Update selection immediately so UI highlights/expands without waiting for the API.
    // Then fetch details and replace the selectedAnalysis once data arrives.
    setSelectedAnalysis(analysis);
    setLockStatus(null);
    setIsLoadingDetail(true);

    const requestSeq = (detailRequestSeqRef.current += 1);
    try {
      const response = await api.get(
        `/rival-agent/competitor-analysis/${analysis.analysis_id}/`
      );

      if (requestSeq !== detailRequestSeqRef.current) return;

      if (response.data?.status === "success" && response.data.analysis) {
        setSelectedAnalysis(response.data.analysis);
        // Check lock status after loading
        await checkLockStatus(analysis.analysis_id);
      }
    } catch (error) {
      if (requestSeq !== detailRequestSeqRef.current) return;
      console.error("Error fetching analysis detail:", error);
      toast.error("Failed to load analysis details");
    } finally {
      if (requestSeq !== detailRequestSeqRef.current) return;
      setIsLoadingDetail(false);
    }
  };

  // Lock API calls
  const checkLockStatus = async (analysisId) => {
    if (!analysisId) return null;
    try {
      const response = await api.get(
        `/rival-agent/competitor-analysis/${analysisId}/check-lock/`
      );
      if (response.data) {
        setLockStatus(response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error checking lock:", error);
      toast.error("Unable to check document lock status");
    }
    return null;
  };

  const acquireLock = async (analysisId) => {
    console.log("[LOCK] Acquiring lock for:", analysisId);
    if (!analysisId) return false;
    setIsAcquiringLock(true);
    try {
      const response = await api.post(
        `/rival-agent/competitor-analysis/${analysisId}/acquire-lock/`
      );

      if (response.data?.status === "success") {
        console.log("[LOCK] Lock acquired successfully:", response.data);
        await checkLockStatus(analysisId);

        toast.success(
          <div className="flex items-center gap-2">
            <LockOpen className="w-4 h-4" />
            <span>Document locked for editing</span>
          </div>,
          { duration: 3000 }
        );
        return true;
      }
    } catch (error) {
      console.error("Error acquiring lock:", error);
      const errorMsg =
        error.response?.data?.detail || "Document is locked by another user";

      toast.error(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4" />
            <span>Cannot Edit</span>
          </div>
          <span className="text-xs">{errorMsg}</span>
        </div>,
        { duration: 5000 }
      );

      // Refresh lock status
      await checkLockStatus(analysisId);
      return false;
    } finally {
      setIsAcquiringLock(false);
    }
  };

  const extendLock = useCallback(
    async (analysisId) => {
      if (!analysisId) return;
      try {
        const response = await api.post(
          `/rival-agent/competitor-analysis/${analysisId}/extend-lock/`
        );

        if (response.data?.status === "success") {
          setLockStatus((prev) => ({
            ...prev,
            expires_at: response.data.expires_at,
          }));
        }
      } catch (error) {
        console.error("Error extending lock:", error);
        // If extend fails, the lock might have been taken by someone else
        await checkLockStatus(analysisId);
      }
    },
    [checkLockStatus]
  );

  const startLockHeartbeat = useCallback(
    (analysisId) => {
      if (!analysisId) return;
      stopLockHeartbeat();
      lockHeartbeatRef.current = setInterval(() => {
        if (isEditingRef.current) {
          extendLock(analysisId);
        }
      }, LOCK_HEARTBEAT_INTERVAL_MS);
    },
    [extendLock, stopLockHeartbeat]
  );

  const setEditingMode = useCallback(
    (nextEditing, { forcePreview = false } = {}) => {
      console.log(
        "[LOCK] setEditingMode called:",
        nextEditing,
        "forcePreview:",
        forcePreview
      );
      setIsEditing(nextEditing);
      isEditingRef.current = nextEditing;

      if (nextEditing) {
        console.log(
          "[LOCK] Starting editing mode - activating heartbeat and activity tracking"
        );
        lastActivityRef.current = Date.now();
        startActivityTracking();
        if (selectedAnalysis?.analysis_id) {
          startLockHeartbeat(selectedAnalysis.analysis_id);
        }
      } else {
        console.log(
          "[LOCK] Stopping editing mode - deactivating heartbeat and activity tracking"
        );
        stopActivityTracking();
        stopLockHeartbeat();
        if (forcePreview) {
          setForcePreviewKey((prev) => prev + 1);
        }
      }
    },
    [
      selectedAnalysis?.analysis_id,
      startActivityTracking,
      startLockHeartbeat,
      stopActivityTracking,
      stopLockHeartbeat,
    ]
  );

  const releaseLock = useCallback(
    async (analysisId, { forcePreview = false } = {}) => {
      if (!analysisId) return false;
      console.log(
        "[LOCK] Releasing lock for:",
        analysisId,
        "forcePreview:",
        forcePreview
      );

      let released = false;
      setEditingMode(false, { forcePreview });

      try {
        await api.post(
          `/rival-agent/competitor-analysis/${analysisId}/release-lock/`
        );
        console.log("[LOCK] Lock released successfully");
        setLockStatus(null);
        released = true;
        return true;
      } catch (error) {
        console.error("[LOCK] Error releasing lock:", error);
        toast.error(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Unable to release lock. Please try again."
        );
        setEditingMode(true);
        await checkLockStatus(analysisId);
        return false;
      } finally {
        if (!released) {
          // Resume editing tracking since lock still held.
          isEditingRef.current = true;
        }
      }
    },
    [checkLockStatus, setEditingMode]
  );

  // Handle inactivity timeout - show modal
  useEffect(() => {
    handleInactivityTimeoutRef.current = () => {
      if (selectedAnalysis?.analysis_id && isEditingRef.current) {
        // Release lock silently and show modal
        api
          .post(
            `/rival-agent/competitor-analysis/${selectedAnalysis.analysis_id}/release-lock/`
          )
          .catch((err) => console.error("Inactivity release error:", err));

        setLockStatus(null);
        setEditingMode(false, { forcePreview: true });
        setShowInactivityModal(true);
      }
    };
  }, [selectedAnalysis?.analysis_id, setEditingMode]);

  // Handle re-acquire lock after inactivity
  const handleReacquireLock = async () => {
    if (!selectedAnalysis?.analysis_id) {
      setShowInactivityModal(false);
      return;
    }

    const acquired = await acquireLock(selectedAnalysis.analysis_id);
    if (acquired) {
      // Start editing mode which will start heartbeat and activity tracking
      setEditingMode(true);
      setShowInactivityModal(false);
      toast.success("Lock re-acquired. You can continue editing.");
    } else {
      setShowInactivityModal(false);
      toast.error(
        "Unable to acquire lock. Document may be locked by another user."
      );
    }
  };

  const handleCancelReacquire = () => {
    setShowInactivityModal(false);
  };

  const handleUpdateMarkdown = async (analysisId, newMarkdown) => {
    try {
      const response = await api.put(
        `/rival-agent/competitor-analysis/${analysisId}/update-markdown/`,
        { analysis_markdown: newMarkdown }
      );

      if (response.data?.status === "success") {
        setSelectedAnalysis((prev) => ({
          ...prev,
          analysis_markdown: newMarkdown,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating markdown:", error);
      throw error;
    }
  };

  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      // Stop activity tracking + heartbeat safely
      stopActivityTracking();
      stopLockHeartbeat();

      const latestAnalysisId = currentAnalysisIdRef.current;
      if (latestAnalysisId) {
        api
          .post(
            `/rival-agent/competitor-analysis/${latestAnalysisId}/release-lock/`
          )
          .catch((err) => console.error("Cleanup release error:", err));
      }
    };
  }, [stopActivityTracking, stopLockHeartbeat]);

  const filteredAnalyses = analyses.filter((analysis) => {
    const query = searchQuery.toLowerCase();
    return (
      analysis.analysis_title?.toLowerCase().includes(query) ||
      analysis.competitor_name?.toLowerCase().includes(query) ||
      analysis.competitor_type?.toLowerCase().includes(query) ||
      analysis.company_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Competitor Analysis
            </h1>
            <p className="text-sm text-gray-600">
              Compare your business with competitors to identify strategic
              opportunities and market positioning
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Analysis List */}
        <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search analyses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Analysis List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingList ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <Swords className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {searchQuery
                    ? "No matching analyses"
                    : "No competitor analyses yet"}
                </p>
                <p className="text-xs text-gray-500">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first competitor analysis"}
                </p>
              </div>
            ) : (
              <AnalysisList
                analyses={filteredAnalyses}
                selectedAnalysisId={selectedAnalysis?.analysis_id}
                onSelectAnalysis={handleSelectAnalysis}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Analysis Detail & Editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : selectedAnalysis ? (
            <AnalysisEditor
              key={`${selectedAnalysis.analysis_id}-${forcePreviewKey}`}
              analysis={selectedAnalysis}
              onUpdateMarkdown={handleUpdateMarkdown}
              lockStatus={lockStatus}
              onAcquireLock={() => acquireLock(selectedAnalysis.analysis_id)}
              onReleaseLock={() =>
                releaseLock(selectedAnalysis.analysis_id, {
                  forcePreview: true,
                })
              }
              isAcquiringLock={isAcquiringLock}
              isEditing={isEditing}
              onEditingChange={setEditingMode}
              onCheckLockStatus={() => checkLockStatus(selectedAnalysis.analysis_id)}
              inactivityTimeoutMinutes={INACTIVITY_TIMEOUT_MINUTES}
              forcePreviewKey={forcePreviewKey}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Swords className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select an analysis to view
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                Choose a competitor analysis from the list to view and edit the
                detailed comparison
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inactivity Modal */}
      <Dialog
        open={showInactivityModal}
        onClose={handleCancelReacquire}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle className="flex items-center gap-3 pb-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Lock Released Due to Inactivity
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Your editing session timed out after {INACTIVITY_TIMEOUT_MINUTES}{" "}
              minutes
            </p>
          </div>
        </DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-600 mb-3">
            Your document lock has been released due to{" "}
            {INACTIVITY_TIMEOUT_MINUTES} minutes of inactivity. To continue
            editing, you need to re-acquire the lock.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              If another user has acquired the lock in the meantime, you won't
              be able to edit until they release it.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4 gap-2">
          <Button
            onClick={handleCancelReacquire}
            variant="outlined"
            color="inherit"
            sx={{ textTransform: "none", fontWeight: 500 }}
          >
            Stay in Preview
          </Button>
          <Button
            onClick={handleReacquireLock}
            variant="contained"
            disabled={isAcquiringLock}
            startIcon={
              isAcquiringLock ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
              },
            }}
          >
            {isAcquiringLock ? "Acquiring..." : "Re-acquire Lock to Edit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
