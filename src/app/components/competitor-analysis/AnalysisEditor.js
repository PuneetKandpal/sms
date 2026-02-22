// "use client";
// import { useState, useEffect, useRef, useCallback } from "react";
// import dynamic from "next/dynamic";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import toast from "react-hot-toast";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import {
//   Switch,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
// } from "@mui/material";
// import {
//   Edit3,
//   Eye,
//   Save,
//   CheckCircle2,
//   AlertCircle,
//   Sparkles,
//   Loader2,
// } from "lucide-react";

// // Removed MDEditor - using plain textarea for better cursor control

// export default function AnalysisEditor({ analysis, onUpdateMarkdown }) {
//   const router = useRouter();
//   const [isEditing, setIsEditing] = useState(false);
//   const [markdown, setMarkdown] = useState(analysis?.analysis_markdown || "");
//   const [isSaving, setIsSaving] = useState(false);
//   const [lastSaved, setLastSaved] = useState(null);
//   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
//   const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
//   const [showNavigationWarning, setShowNavigationWarning] = useState(false);
//   const [pendingNavigation, setPendingNavigation] = useState(null);
//   const autoSaveTimerRef = useRef(null);
//   const editorRef = useRef(null);

//   useEffect(() => {
//     if (analysis?.analysis_markdown) {
//       setMarkdown(analysis.analysis_markdown);
//       setHasUnsavedChanges(false);
//     }
//   }, [analysis?.analysis_id]);

//   const handleSave = useCallback(
//     async (showToast = true) => {
//       if (!hasUnsavedChanges || isSaving) return;

//       setIsSaving(true);
//       try {
//         const success = await onUpdateMarkdown(analysis.analysis_id, markdown);
//         if (success) {
//           setLastSaved(new Date());
//           setHasUnsavedChanges(false);
//           if (showToast) {
//             toast.success("Analysis saved successfully");
//           }
//         } else {
//           toast.error("Failed to save analysis");
//         }
//       } catch (error) {
//         console.error("Save error:", error);
//         toast.error("Failed to save analysis");
//       } finally {
//         setIsSaving(false);
//       }
//     },
//     [
//       hasUnsavedChanges,
//       isSaving,
//       markdown,
//       analysis?.analysis_id,
//       onUpdateMarkdown,
//     ]
//   );

//   useEffect(() => {
//     if (autoSaveEnabled && hasUnsavedChanges && !isSaving) {
//       if (autoSaveTimerRef.current) {
//         clearTimeout(autoSaveTimerRef.current);
//       }

//       autoSaveTimerRef.current = setTimeout(() => {
//         handleSave(false);
//       }, 2000);
//     }

//     return () => {
//       if (autoSaveTimerRef.current) {
//         clearTimeout(autoSaveTimerRef.current);
//       }
//     };
//   }, [markdown, autoSaveEnabled, hasUnsavedChanges, isSaving, handleSave]);

//   const handleMarkdownChange = (e) => {
//     const value = e.target ? e.target.value : e;
//     setMarkdown(value || "");
//     setHasUnsavedChanges(true);
//   };

//   useEffect(() => {
//     const handleBeforeUnload = (e) => {
//       if (hasUnsavedChanges) {
//         e.preventDefault();
//         e.returnValue = "";
//       }
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [hasUnsavedChanges]);

//   const handleNavigationWarning = () => {
//     if (hasUnsavedChanges) {
//       setShowNavigationWarning(true);
//       return false;
//     }
//     return true;
//   };

//   const handleContinueNavigation = () => {
//     setShowNavigationWarning(false);
//     setHasUnsavedChanges(false);
//     if (pendingNavigation) {
//       router.push(pendingNavigation);
//     }
//   };

//   const handleCancelNavigation = () => {
//     setShowNavigationWarning(false);
//     setPendingNavigation(null);
//   };

//   if (!analysis) return null;

//   return (
//     <div className="flex flex-col h-full bg-white">
//       {/* Compact Header - Title and Actions Only */}
//       <motion.div
//         initial={{ y: -10, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         className="border-b border-gray-200 bg-white px-6 py-4"
//       >
//         <div className="flex items-center justify-between gap-4">
//           {/* Title */}
//           <h2 className="text-lg font-semibold text-gray-900 truncate">
//             {analysis.analysis_title}
//           </h2>

//           {/* Actions */}
//           <div className="flex items-center gap-3 flex-shrink-0">
//             {/* Save Status */}
//             <AnimatePresence mode="wait">
//               {isSaving ? (
//                 <motion.div
//                   key="saving"
//                   initial={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.9 }}
//                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
//                 >
//                   <Loader2 className="w-3 h-3 animate-spin" />
//                   Saving
//                 </motion.div>
//               ) : hasUnsavedChanges ? (
//                 <motion.div
//                   key="unsaved"
//                   initial={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.9 }}
//                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium"
//                 >
//                   <AlertCircle className="w-3 h-3" />
//                   Unsaved
//                 </motion.div>
//               ) : lastSaved ? (
//                 <motion.div
//                   key="saved"
//                   initial={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.9 }}
//                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium"
//                 >
//                   <CheckCircle2 className="w-3 h-3" />
//                   Saved
//                 </motion.div>
//               ) : null}
//             </AnimatePresence>

//             {/* Edit/Preview Segmented Toggle */}
//             <div className="relative flex items-center bg-gray-200 rounded-full p-1">
//               {/* Sliding Background */}
//               <motion.div
//                 className="absolute h-[calc(100%-8px)] bg-white rounded-full"
//                 initial={false}
//                 animate={{
//                   x: isEditing ? "calc(100% + 4px)" : "4px",
//                   width: "calc(50% - 8px)",
//                 }}
//                 transition={{
//                   type: "spring",
//                   stiffness: 300,
//                   damping: 30,
//                 }}
//               />
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
//                   !isEditing
//                     ? "text-gray-900"
//                     : "text-gray-400 hover:text-gray-300"
//                 }`}
//               >
//                 Preview
//               </button>
//               <button
//                 onClick={() => setIsEditing(true)}
//                 className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
//                   isEditing
//                     ? "text-gray-900"
//                     : "text-gray-400 hover:text-gray-300"
//                 }`}
//               >
//                 Edit
//               </button>
//             </div>

//             {/* Auto-save MUI Toggle */}
//             <div className="flex items-center gap-2">
//               <span className="text-xs font-medium text-gray-600">
//                 Auto-save
//               </span>
//               <Switch
//                 checked={autoSaveEnabled}
//                 onChange={(e) => setAutoSaveEnabled(e.target.checked)}
//                 size="small"
//                 sx={{
//                   "& .MuiSwitch-switchBase.Mui-checked": {
//                     color: "#3b82f6",
//                   },
//                   "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
//                     backgroundColor: "#3b82f6",
//                   },
//                 }}
//               />
//             </div>

//             {/* Manual Save Button */}
//             {hasUnsavedChanges && (
//               <motion.button
//                 initial={{ scale: 0, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0, opacity: 0 }}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={() => handleSave(true)}
//                 disabled={isSaving}
//                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Save className="w-3.5 h-3.5" />
//                 Save
//               </motion.button>
//             )}
//           </div>
//         </div>
//       </motion.div>

//       {/* Navigation Warning Dialog */}
//       <Dialog
//         open={showNavigationWarning}
//         onClose={handleCancelNavigation}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle className="text-lg font-semibold">
//           Unsaved Changes
//         </DialogTitle>
//         <DialogContent>
//           <p className="text-gray-600">
//             You have unsaved changes that will be lost if you leave this page.
//             Do you wish to continue?
//           </p>
//         </DialogContent>
//         <DialogActions className="px-6 pb-4">
//           <Button
//             onClick={handleCancelNavigation}
//             variant="outlined"
//             color="inherit"
//           >
//             Stay on Page
//           </Button>
//           <Button
//             onClick={handleContinueNavigation}
//             variant="contained"
//             color="error"
//             autoFocus
//           >
//             Leave Page
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Content Area with Notion-like Styling */}
//       <div className="flex-1 overflow-hidden">
//         <AnimatePresence mode="wait">
//           {isEditing ? (
//             <motion.div
//               key="editor"
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.2 }}
//               className="h-full p-6"
//             >
//               <textarea
//                 ref={editorRef}
//                 value={markdown}
//                 onChange={handleMarkdownChange}
//                 placeholder="Write your competitive analysis in markdown..."
//                 className="w-full h-full resize-none border border-gray-300 rounded-lg p-6 font-sans text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
//                 style={{
//                   lineHeight: "1.6",
//                   fontFamily:
//                     '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
//                 }}
//               />
//             </motion.div>
//           ) : (
//             <motion.div
//               key="preview"
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.2 }}
//               className="h-full overflow-y-auto"
//             >
//               {markdown ? (
//                 <div className="max-w-4xl mx-auto px-8 py-8">
//                   <article className="notion-preview">
//                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                       {String(markdown || "")}
//                     </ReactMarkdown>
//                   </article>
//                 </div>
//               ) : (
//                 <motion.div
//                   initial={{ scale: 0.9, opacity: 0 }}
//                   animate={{ scale: 1, opacity: 1 }}
//                   className="flex flex-col items-center justify-center h-full text-center"
//                 >
//                   <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
//                   <p className="text-gray-600 font-medium text-lg">
//                     No content yet
//                   </p>
//                   <p className="text-sm text-gray-400 mt-2">
//                     Click Edit to start writing your competitive analysis
//                   </p>
//                 </motion.div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import TiptapMarkdownViewer from "../../../components/TiptapMarkdownViewer";

import {
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  LockOpen,
  Shield,
  Clock,
  User,
  Info,
} from "lucide-react";


/* ===========================
        COMPONENT
=========================== */

export default function AnalysisEditor({
  analysis,
  onUpdateMarkdown,
  lockStatus,
  onAcquireLock,
  onReleaseLock,
  isAcquiringLock,
  isEditing: parentIsEditing,
  onEditingChange,
  onCheckLockStatus,
  inactivityTimeoutMinutes = 15,
  forcePreviewKey,
}) {
  const router = useRouter();

  const [editorTheme, setEditorTheme] = useState("light");

  const [markdown, setMarkdown] = useState(analysis?.analysis_markdown || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAcquireLockPrompt, setShowAcquireLockPrompt] = useState(false);

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Computed lock states
  const isLocked = lockStatus?.is_locked || false;
  const canEdit = lockStatus?.can_edit || false;
  const lockedBy = lockStatus?.locked_by;
  const isReadOnly = isLocked && !canEdit;

  // Debug logging
  console.log("[AnalysisEditor] Lock status:", {
    lockStatus,
    isLocked,
    canEdit,
    lockedBy,
    isReadOnly,
    parentIsEditing
  });

  const autoSaveTimerRef = useRef(null);

  /* ===========================
        LOAD ANALYSIS
=========================== */

  useEffect(() => {
    if (analysis?.analysis_markdown) {
      setMarkdown(analysis.analysis_markdown);
      setHasUnsavedChanges(false);
    }
  }, [analysis?.analysis_id]);


  /* ===========================
     HANDLE EDIT MODE CHANGE
=========================== */

  const handleBeforeEditMode = async () => {
    if (parentIsEditing) return true;

    onEditingChange?.(true);
    let allowEditing = false;

    try {
      const latestStatus = (await onCheckLockStatus?.()) ?? lockStatus;
      const latestCanEdit = latestStatus?.can_edit ?? canEdit;
      const latestIsLocked = latestStatus?.is_locked ?? lockStatus?.is_locked;

      if (!latestCanEdit) {
        const acquired = await onAcquireLock?.();
        if (!acquired) {
          return false;
        }
      } else if (latestIsLocked === false) {
        // Not locked but editable, ensure we hold it.
        const acquired = await onAcquireLock?.();
        if (!acquired) {
          return false;
        }
      }

      allowEditing = true;
      return true;
    } catch (error) {
      console.error("[AnalysisEditor] Error entering edit mode:", error);
      toast.error("Unable to enable editing. Please try again.");
      return false;
    } finally {
      if (!allowEditing) {
        onEditingChange?.(false, { forcePreview: true });
      }
    }
  };

  const handleReleaseLockClick = useCallback(async () => {
    await onReleaseLock?.();
  }, [onReleaseLock]);

  /* ===========================
           SAVE
=========================== */

  const handleSave = useCallback(
    async (showToast = true) => {
      if (!hasUnsavedChanges || isSaving) return;

      setIsSaving(true);
      try {
        const success = await onUpdateMarkdown(analysis.analysis_id, markdown);

        if (success) {
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          if (showToast) toast.success("Analysis saved");
        } else {
          toast.error("Save failed");
        }
      } catch (err) {
        toast.error("Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [hasUnsavedChanges, isSaving, markdown, analysis, onUpdateMarkdown]
  );

  /* ===========================
         AUTO SAVE
=========================== */

  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || isSaving || !canEdit) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(false);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, markdown, hasUnsavedChanges, isSaving, canEdit, handleSave]);

  /* ===========================
      BROWSER NAV WARNING
=========================== */

  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  if (!analysis) return null;

  /* ===========================
           RENDER
=========================== */

  return (
    <div className="flex flex-col h-full bg-white">

      {/* HEADER - Title and Manual Save */}
      <div
        className={
          editorTheme === "dark"
            ? "border-b border-white/10 px-6 py-3 flex items-center justify-between"
            : "border-b px-6 py-3 flex items-center justify-between"
        }
      >
        <h2
          className={
            editorTheme === "dark"
              ? "text-lg font-semibold truncate text-gray-100"
              : "text-lg font-semibold truncate"
          }
        >
          {analysis.analysis_title}
        </h2>

        <div className="flex items-center gap-3">
          {!canEdit ? (
            <button
              onClick={handleBeforeEditMode}
              disabled={isAcquiringLock}
              className={
                isAcquiringLock
                  ? editorTheme === "dark"
                    ? "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 cursor-not-allowed"
                    : "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600"
              }
            >
              {isAcquiringLock ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              {isAcquiringLock ? "Acquiring..." : "Acquire Lock"}
            </button>
          ) : isLocked ? (
            <button
              onClick={handleReleaseLockClick}
              className={
                editorTheme === "dark"
                  ? "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-gray-200 hover:bg-white/15"
                  : "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            >
              <LockOpen className="w-3.5 h-3.5" />
              Release Lock
            </button>
          ) : null}

          {canEdit && (
            <div className="flex items-center gap-2">
              <span
                className={
                  editorTheme === "dark"
                    ? "text-xs text-gray-300"
                    : "text-xs text-gray-600"
                }
              >
                Auto-save
              </span>
              <Switch
                size="small"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                inputProps={{ "aria-label": "Toggle auto-save" }}
              />
            </div>
          )}

          {/* SAVE STATUS */}
          <AnimatePresence>
            {isSaving ? (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
              </div>
            ) : hasUnsavedChanges ? (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="w-3 h-3" /> Unsaved
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </div>
            ) : null}
          </AnimatePresence>

          {/* MANUAL SAVE */}
          {canEdit && (
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || !hasUnsavedChanges}
              className={
                isSaving || !hasUnsavedChanges
                  ? editorTheme === "dark"
                    ? "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 cursor-not-allowed"
                    : "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600"
              }
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}
        </div>
      </div>

      {/* CONTENT - TiptapMarkdownViewer */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isReadOnly ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-8 py-6 max-w-lg text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-700" />
              </div>
              <h4 className="font-semibold text-gray-900 text-lg mb-2">
                Document Locked
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {lockedBy
                  ? `This document is being edited by ${lockedBy}`
                  : "This document is currently locked for editing"}
              </p>
              <button
                onClick={onAcquireLock}
                disabled={isAcquiringLock}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAcquiringLock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Requesting Access...
                  </>
                ) : (
                  <>
                    <LockOpen className="w-4 h-4" />
                    Request Editing Access
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <TiptapMarkdownViewer
            content={markdown}
            editable={canEdit}
            lockStatus={lockStatus}
            isAcquiringLock={isAcquiringLock}
            onAcquireLock={onAcquireLock}
            onReleaseLock={onReleaseLock}
            onRequestEdit={handleBeforeEditMode}
            onContentChange={(newContent) => {
              if (canEdit) {
                setMarkdown(newContent);
                setHasUnsavedChanges(true);
              }
            }}
            showToolbar={true}
            showBubbleMenu={true}
            showModeToggle={true}
            initialMode="preview"
            className="h-full"
            defaultTheme="light"
            showExpandButton={true}
            filename={analysis.analysis_title}
            forcePreviewKey={forcePreviewKey}
            expandedStatusBarProps={{
              alwaysVisible: true,
              visible: parentIsEditing || isAcquiringLock,
              isEditingEnabled: parentIsEditing && canEdit,
              statusMessage: isAcquiringLock
                ? 'Requesting edit…'
                : parentIsEditing && canEdit
                ? 'You have editing access'
                : 'View only',
              extendsLabel: 'Auto-extends every 5 min',
              idleLabel: `Releases after ${inactivityTimeoutMinutes} min idle`,
              statusDetail: isSaving
                ? 'Saving…'
                : hasUnsavedChanges
                ? 'Unsaved'
                : lastSaved
                ? 'Saved'
                : '',
              autoSaveEnabled: autoSaveEnabled,
              onToggleAutoSave: (checked) => setAutoSaveEnabled(checked),
              onSave: () => handleSave(true),
              saveDisabled: !hasUnsavedChanges || isSaving || !canEdit,
              saveLabel: 'Save',
              onRelease: handleReleaseLockClick,
              releaseDisabled: !canEdit,
              releaseLabel: 'Release Lock',
            }}
          />
        )}
      </div>
    </div>
  );
}
