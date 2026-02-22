"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaLink,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaFile,
} from "react-icons/fa";
import { FiSidebar } from "react-icons/fi";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import toast from "react-hot-toast";
import api from "../../api/axios";
import {
  AddSourcesModal,
  TextModal,
  LinkModal,
  RenameModal,
  DeleteConfirmModal,
} from "./SourceModals";
import {
  AddCompetitorModal,
  RenameModal as CompetitorRenameModal,
  DeleteConfirmModal as CompetitorDeleteConfirmModal,
} from "./CompetitorModals";
import {
  AddInternalModal,
  RenameModal as InternalRenameModal,
  DeleteConfirmModal as InternalDeleteConfirmModal,
} from "./InternalModals";
import { useSelection } from "../context/SelectionContext";

function getSourceId(source) {
  return source.id || source.source_id;
}

function getCompetitorId(competitor) {
  return competitor.source_id || competitor.id || competitor.competitor_id;
}

export default function SourcesAndCompetitorsPanel({
  projectId,
  collapsed,
  toggleCollapse,
  sources,
  setSources,
  selectedSources,
  setSelectedSources,
  competitors,
  setCompetitors,
  selectedCompetitors,
  setSelectedCompetitors,
  internalSources,
  setInternalSources,
  selectedInternalSources,
  setSelectedInternalSources,
  onSourceAdded,
  onCompetitorAdded,
  onInternalSourceAdded,
  hasPendingChanges,
  onOpenReviewRequested,
  hasActiveResearchTasks,
  hasCompanyResearchInProgress = false,
  hasCompetitorResearchInProgress = false,
  onOpenResearchTasksView,
  openGlobalTaskMonitor,
  onResearchTaskStarted,
  onCompetitorSelect,
  onSourceSelect,
  onInternalSourceSelect,
  onCurrentDataSelect,
}) {
  const [sourcesExpanded, setSourcesExpanded] = useState(true);
  const [currentDataExpanded, setCurrentDataExpanded] = useState(false);
  const [competitorsExpanded, setCompetitorsExpanded] = useState(false);
  const [internalsExpanded, setInternalsExpanded] = useState(false);

  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkType, setLinkType] = useState("website");

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [showFileProgress, setShowFileProgress] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileStatusText, setFileStatusText] = useState("Processing file...");

  const [sourceMenuAnchor, setSourceMenuAnchor] = useState(null);
  const [competitorMenuAnchor, setCompetitorMenuAnchor] = useState(null);
  const [internalMenuAnchor, setInternalMenuAnchor] = useState(null);
  const [selectedSourceForMenu, setSelectedSourceForMenu] = useState(null);
  const [selectedCompetitorForMenu, setSelectedCompetitorForMenu] =
    useState(null);
  const [selectedInternalForMenu, setSelectedInternalForMenu] = useState(null);
  const sourceTreeMaxHeight = Math.min(
    480,
    Math.max(140, (sources?.length || 1) * 56)
  );

  const [showSourceRename, setShowSourceRename] = useState(false);
  const [renamingSource, setRenamingSource] = useState(null);
  const [showSourceDeleteConfirm, setShowSourceDeleteConfirm] = useState(false);
  const [deletingSource, setDeletingSource] = useState(null);
  const [isDeletingSource, setIsDeletingSource] = useState(false);
  const [isRenamingSource, setIsRenamingSource] = useState(false);

  const [showCompetitorRename, setShowCompetitorRename] = useState(false);
  const [renamingCompetitor, setRenamingCompetitor] = useState(null);
  const [showCompetitorDeleteConfirm, setShowCompetitorDeleteConfirm] =
    useState(false);
  const [deletingCompetitor, setDeletingCompetitor] = useState(null);
  const [isDeletingCompetitor, setIsDeletingCompetitor] = useState(false);
  const [isRenamingCompetitor, setIsRenamingCompetitor] = useState(false);

  const [showInternalRename, setShowInternalRename] = useState(false);
  const [renamingInternal, setRenamingInternal] = useState(null);
  const [showInternalDeleteConfirm, setShowInternalDeleteConfirm] = useState(false);
  const [deletingInternal, setDeletingInternal] = useState(null);
  const [isDeletingInternal, setIsDeletingInternal] = useState(false);

  const { selectedProject } = useSelection();

  const handleSourceCheckboxChange = (sourceId) => {
    const isCurrentlySelected = selectedSources.includes(sourceId);

    if (isCurrentlySelected) {
      setSelectedSources([]);
      if (onSourceSelect) {
        onSourceSelect(null);
      }
    } else {
      setSelectedCompetitors([]);
      if (onCompetitorSelect) {
        onCompetitorSelect(null);
      }
      setSelectedSources([sourceId]);
      setCompetitorsExpanded(false);
      if (toggleCollapse && !collapsed) {
        toggleCollapse();
      }
      if (onSourceSelect) {
        onSourceSelect(sourceId);
      }
    }
  };

  const handleSourceNameClick = (sourceId) => {
    handleSourceCheckboxChange(sourceId);
  };

  const handleCurrentDataClick = () => {
    setSelectedSources([]);
    setSelectedCompetitors([]);
    setSelectedInternalSources([]);
    if (onCurrentDataSelect) {
      onCurrentDataSelect();
    }
  };

  const handleCompetitorCheckboxChange = (competitorId) => {
    const isCurrentlySelected = selectedCompetitors.includes(competitorId);

    if (isCurrentlySelected) {
      setSelectedCompetitors([]);
      if (onCompetitorSelect) {
        onCompetitorSelect(null);
      }
    } else {
      setSelectedSources([]);
      if (onSourceSelect) {
        onSourceSelect(null);
      }
      setSelectedCompetitors([competitorId]);
      setSourcesExpanded(false);
      // Collapse the entire panel when competitor is selected
      if (toggleCollapse && !collapsed) {
        toggleCollapse();
      }
      if (onCompetitorSelect) {
        onCompetitorSelect(competitorId);
      }
    }
  };

  const handleCompetitorNameClick = (competitorId) => {
    handleCompetitorCheckboxChange(competitorId);
  };

  const handleSourceDelete = async (source) => {
    const sourceId = getSourceId(source);
    setIsDeletingSource(true);

    try {
      const res = await api.delete(`/api/source-update-delete/${sourceId}`, {
        data: {
          project_id: selectedProject.id,
        },
      });
      setSources((prev) => prev.filter((s) => getSourceId(s) !== sourceId));
      setSelectedSources((prev) => prev.filter((id) => id !== sourceId));
      toast.success("Source deleted successfully");
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(e.response?.data?.error || "Delete failed");
    } finally {
      setIsDeletingSource(false);
      setShowSourceDeleteConfirm(false);
      setDeletingSource(null);
      setSourceMenuAnchor(null);
    }
  };

  const handleSourceRename = async (sourceId, newName) => {
    setIsRenamingSource(true);
    try {
      const res = await api.put(`/api/source-update-delete/${sourceId}`, {
        file_name: newName,
        project_id: selectedProject.id,
      });

      if (res.status !== 200)
        throw new Error(res.data?.message || "Rename failed");
      setSources((prev) =>
        prev.map((s) =>
          getSourceId(s) === sourceId ? { ...s, file_name: newName } : s
        )
      );
      toast.success(res.data.message || "Source renamed");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Rename failed");
    } finally {
      setIsRenamingSource(false);
      setShowSourceRename(false);
      setRenamingSource(null);
      setSourceMenuAnchor(null);
    }
  };

  const handleCompetitorDelete = async (competitor) => {
    const competitorId = getCompetitorId(competitor);
    setIsDeletingCompetitor(true);

    try {
      const res = await api.delete(`/api/source-update-delete/${competitorId}`, {
        data: {
          project_id: selectedProject.id,
        },
      });
      setCompetitors((prev) =>
        prev.filter((c) => getCompetitorId(c) !== competitorId)
      );
      setSelectedCompetitors((prev) =>
        prev.filter((id) => id !== competitorId)
      );
      toast.success("School removed successfully");
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(e.response.data.error || "Delete failed");
    } finally {
      setIsDeletingCompetitor(false);
      setShowCompetitorDeleteConfirm(false);
      setDeletingCompetitor(null);
      setCompetitorMenuAnchor(null);
    }
  };

  const handleCompetitorRename = async (competitorId, newName) => {
    setIsRenamingCompetitor(true);
    try {
      const res = await api.put(`/api/source-update-delete/${competitorId}`, {
        file_name: newName,
        project_id: selectedProject.id,
      });

      if (res.status !== 200)
        throw new Error(res.data?.message || "Rename failed");
      setCompetitors((prev) =>
        prev.map((c) =>
          getCompetitorId(c) === competitorId
            ? { ...c, competitor_name: newName, file_name: newName }
            : c
        )
      );
      toast.success(res.data.message || "Other school renamed");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Rename failed");
    } finally {
      setIsRenamingCompetitor(false);
      setShowCompetitorRename(false);
      setRenamingCompetitor(null);
      setCompetitorMenuAnchor(null);
    }
  };

  const handleAddSource = async (newSource) => {
    setSources((prev) => [newSource, ...prev]);

    if (onSourceAdded) {
      setTimeout(async () => {
        await onSourceAdded();
      }, 1000);
    }

    setShowAddSource(false);
  };

  const handleFileUpload = async (file) => {
    const fd = new FormData();
    fd.append("project_id", projectId);
    fd.append("component_id", "manage");
    fd.append("domain_id", "default");
    fd.append("file", file);
    try {
      setIsUploading(true);
      setUploadingFileName(file.name);

      const response = await api.post("/keyword-api/file-research/", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const d = response.data;

      toast.success(
        d?.message ||
          "File research started. You can track progress in Task Monitor."
      );

      if (onResearchTaskStarted) {
        onResearchTaskStarted({
          ...d,
          type: "file",
          source_type: "file",
          origin: "file_upload",
          project_id: projectId,
          component_id: "manage",
          domain_id: "default",
          file_name: d?.file_name || file.name,
        });
      }

      if (openGlobalTaskMonitor) {
        openGlobalTaskMonitor();
      }
    } catch (e) {
      console.error("File upload error:", e);

      let errorMessage = "Upload failed";

      const responseData = e && e.response ? e.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage =
            responseData.message ||
            responseData.error ||
            responseData.action_required ||
            errorMessage;
        }
      } else if (e && e.message) {
        errorMessage = e.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadingFileName("");
      setShowFileProgress(false);
      setFileProgress(0);
      setFileStatusText("Processing file...");
    }
  };

  const handleAddCompetitor = async (newCompetitor) => {
    setCompetitors((prev) => [newCompetitor, ...prev]);

    if (onCompetitorAdded) {
      setTimeout(async () => {
        await onCompetitorAdded();
      }, 1000);
    }

    setShowAddCompetitor(false);
  };

  // Internal source handlers
  const handleInternalSourceCheckboxChange = (internalSourceId) => {
    const isCurrentlySelected = selectedInternalSources.includes(internalSourceId);

    if (isCurrentlySelected) {
      setSelectedInternalSources([]);
      if (onInternalSourceSelect) {
        onInternalSourceSelect(null);
      }
    } else {
      setSelectedSources([]);
      setSelectedCompetitors([]);
      if (onSourceSelect) {
        onSourceSelect(null);
      }
      if (onCompetitorSelect) {
        onCompetitorSelect(null);
      }
      setSelectedInternalSources([internalSourceId]);
      setSourcesExpanded(false);
      setCompetitorsExpanded(false);
      if (toggleCollapse && !collapsed) {
        toggleCollapse();
      }
      if (onInternalSourceSelect) {
        onInternalSourceSelect(internalSourceId);
      }
    }
  };

  const handleInternalSourceNameClick = (internalSourceId) => {
    handleInternalSourceCheckboxChange(internalSourceId);
  };

  const handleInternalSourceDelete = async (internalSource) => {
    const sourceId = internalSource.source_id;
    setIsDeletingInternal(true);

    try {
      const res = await api.delete(`/internal-sources/internal-data/update-delete/${sourceId}/`, {
        data: {
          project_id: projectId,
        },
      });
      setInternalSources((prev) => prev.filter((s) => s.source_id !== sourceId));
      setSelectedInternalSources((prev) => prev.filter((id) => id !== sourceId));
      toast.success("Internal source deleted successfully");

      if (onInternalSourceAdded) {
        await onInternalSourceAdded();
      }
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(e.message || "Delete failed");
    } finally {
      setIsDeletingInternal(false);
      setShowInternalDeleteConfirm(false);
      setDeletingInternal(null);
      setInternalMenuAnchor(null);
    }
  };

  const handleInternalSourceRename = async (sourceId, newName) => {
    try {
      const res = await api.put(`/internal-sources/internal-data/update-delete/${sourceId}/`, {
        file_name: newName,
        project_id: projectId,
      });

      if (res.status !== 200)
        throw new Error(res.data?.message || "Rename failed");
      setInternalSources((prev) =>
        prev.map((s) =>
          s.source_id === sourceId
            ? { ...s, file_name: newName }
            : s
        )
      );
      toast.success(res.data.message || "Internal source renamed");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Rename failed");
    }
    setShowInternalRename(false);
    setRenamingInternal(null);
    setInternalMenuAnchor(null);
  };

  const handleInternalMenuOpen = (event, internalSource) => {
    event.stopPropagation();
    setInternalMenuAnchor(event.currentTarget);
    setSelectedInternalForMenu(internalSource);
  };

  const handleInternalMenuClose = () => {
    setInternalMenuAnchor(null);
    setSelectedInternalForMenu(null);
  };

  const handleSourceMenuOpen = (event, source) => {
    event.stopPropagation();
    setSourceMenuAnchor(event.currentTarget);
    setSelectedSourceForMenu(source);
  };

  const handleSourceMenuClose = () => {
    setSourceMenuAnchor(null);
    setSelectedSourceForMenu(null);
  };

  const handleCompetitorMenuOpen = (event, competitor) => {
    event.stopPropagation();
    setCompetitorMenuAnchor(event.currentTarget);
    setSelectedCompetitorForMenu(competitor);
  };

  const handleCompetitorMenuClose = () => {
    setCompetitorMenuAnchor(null);
    setSelectedCompetitorForMenu(null);
  };

  return (
    <>
      {collapsed ? (
        <div
          className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex justify-center cursor-pointer hover:bg-gray-200 transition-colors h-[calc(100vh-180px)]"
          onClick={toggleCollapse}
        >
          <FiSidebar className="text-primary text-xl" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-[calc(100vh-180px)] flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                School Knowledge Base
              </h3>
            </div>
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Collapse panel"
            >
              <FiSidebar className="text-gray-500 w-4 h-4" />
            </button>
          </div>

          {/* Panel Content - Independent scrollable sections */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Sources Section */}
            <div className="flex flex-col border-b border-gray-200">
              <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all duration-300 ease-in-out"
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
              >
                <div className="flex items-center gap-2">
                  <FaLink className="text-gray-600 w-3.5 h-3.5" />
                  <span className="font-semibold text-xs uppercase tracking-wide text-gray-700">
                    School Profile
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {sources.length}
                  </span>
                </div>
                {sourcesExpanded ? (
                  <FaChevronUp className="text-gray-500 w-3 h-3" />
                ) : (
                  <FaChevronDown className="text-gray-500 w-3 h-3" />
                )}
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  sourcesExpanded
                    ? "h-72 opacity-100"
                    : "h-0 opacity-0 overflow-hidden"
                }`}
              >
                {sourcesExpanded && (
                  <div className="flex flex-col h-full">
                    <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (hasCompanyResearchInProgress) {
                            if (onOpenResearchTasksView) {
                              toast.error(
                                "Company research is in progress. Please wait for it to complete before adding new sources."
                              );
                              onOpenResearchTasksView();
                            }
                            return;
                          }
                          if (hasPendingChanges) {
                            // Close competitor panel if open
                            setSelectedCompetitors([]);
                            if (onCompetitorSelect) {
                              onCompetitorSelect(null);
                            }
                            onOpenReviewRequested && onOpenReviewRequested();
                            return;
                          }
                          setShowAddSource(true);
                        }}
                        className="py-1.5 w-full px-2 rounded inline-flex items-center justify-center gap-1 bg-primary text-white cursor-pointer hover:bg-primary-dark hover:shadow-md active:scale-95 transition-all duration-200 ease-in-out text-xs"
                      >
                        <FaPlus size={10} /> Add School Details
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <ul className="px-2 py-1">
                        <li
                          className={`group px-3 py-2 flex items-center justify-between gap-2 text-xs cursor-pointer rounded-lg border transition-colors ${
                            currentDataExpanded
                              ? "bg-white shadow-sm border-gray-200"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className="flex-1 flex items-center gap-2"
                            onClick={handleCurrentDataClick}
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                              <FaLink className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col -space-y-0.5">
                              <span
                                className="text-sm font-medium text-gray-800 leading-tight"
                                title="currentdata"
                              >
                                School Profile
                              </span>
                              <span className="text-[11px] uppercase tracking-wide text-gray-400">
                                {sources.length} source
                                {sources.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentDataExpanded((prev) => !prev);
                            }}
                            className={`p-1.5 rounded-full hover:bg-gray-100 transition-all ${
                              currentDataExpanded ? "bg-gray-100" : ""
                            }`}
                            title={
                              currentDataExpanded
                                ? "Collapse sources"
                                : "Expand sources"
                            }
                          >
                            <FaChevronDown
                              className={`text-gray-500 w-3 h-3 transition-transform duration-200 ${
                                currentDataExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </li>
                      </ul>

                      <div
                        className={`relative overflow-hidden transition-all duration-300 ease-out ${
                          currentDataExpanded
                            ? "opacity-100 pt-2"
                            : "opacity-0 pointer-events-none"
                        }`}
                        style={{
                          maxHeight: currentDataExpanded
                            ? `${sourceTreeMaxHeight}px`
                            : "0px",
                        }}
                      >
                        {sources.length === 0 ? (
                          <div className="text-center text-gray-500 py-4 text-xs">
                            No school details added yet
                          </div>
                        ) : (
                          <ul className="px-2 py-1">
                            {sources.map((source) => {
                              const sourceId = getSourceId(source);
                              const isSelected = selectedSources.includes(sourceId);
                              const sourceName =
                                source.file_name || source.url || "Untitled item";

                              return (
                                <li
                                  key={sourceId}
                                  className={`group px-2 py-1.5 flex items-center gap-2 text-xs hover:bg-gray-100 cursor-pointer rounded ${
                                    isSelected ? "bg-sky-50" : ""
                                  }`}
                                >
                                  <div
                                    className="flex-1 flex items-center gap-1.5"
                                    onClick={(e) => {
                                      if (!e.defaultPrevented) {
                                        handleSourceNameClick(sourceId);
                                      }
                                    }}
                                  >
                                    <FaLink className="text-gray-500 w-3 h-3 flex-shrink-0" />
                                    <span
                                      className={`text-xs truncate ${
                                        isSelected
                                          ? "font-medium text-gray-900"
                                          : "text-gray-700"
                                      }`}
                                      title={sourceName}
                                    >
                                      {sourceName}
                                    </span>
                                  </div>

                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleSourceMenuOpen(e, source)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    sx={{ padding: "2px" }}
                                  >
                                    <FaEllipsisV
                                      className="text-gray-500"
                                      style={{ width: "10px", height: "10px" }}
                                    />
                                  </IconButton>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Competitors Section */}
            <div className="flex flex-col">
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 transition-all duration-300 ease-in-out bg-gray-50 flex-shrink-0"
                onClick={() => setCompetitorsExpanded(!competitorsExpanded)}
              >
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-gray-600 w-3.5 h-3.5" />
                  <span className="font-semibold text-xs uppercase tracking-wide text-gray-700">
                    Other Schools
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {competitors.length}
                  </span>
                </div>
                {competitorsExpanded ? (
                  <FaChevronUp className="text-gray-500 w-3 h-3" />
                ) : (
                  <FaChevronDown className="text-gray-500 w-3 h-3" />
                )}
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  competitorsExpanded
                    ? "h-72 opacity-100"
                    : "h-0 opacity-0 overflow-hidden"
                }`}
              >
                {competitorsExpanded && (
                  <div className="flex flex-col h-full">
                    <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (hasCompetitorResearchInProgress) {
                            toast(
                              "School research is already running. New schools will be researched in parallel."
                            );
                          }
                          setShowAddCompetitor(true);
                        }}
                        title={
                          hasCompetitorResearchInProgress
                            ? "School research is already running. New schools will be researched in parallel."
                            : "Start a new school research task."
                        }
                        className="py-1.5 w-full px-2 rounded inline-flex items-center justify-center gap-1 bg-primary text-white cursor-pointer hover:bg-primary-dark hover:shadow-md active:scale-95 transition-all duration-200 ease-in-out text-xs"
                      >
                        <FaPlus size={10} /> Add Another School
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {competitors.length === 0 ? (
                        <div className="text-center text-gray-500 py-4 text-xs">
                          No other schools added yet
                        </div>
                      ) : (
                        <ul className="px-2 py-1">
                          {competitors.map((competitor) => {
                            const competitorId = getCompetitorId(competitor);
                            const isSelected =
                              selectedCompetitors.includes(competitorId);
                            const competitorName =
                              competitor.competitor_name ||
                              competitor.file_name ||
                              competitor.url ||
                              "Untitled competitor";

                            return (
                              <li
                                key={competitorId}
                                className={`group px-2 py-1.5 flex items-center gap-2 text-xs hover:bg-gray-100 cursor-pointer rounded ${
                                  isSelected ? "bg-sky-50" : ""
                                }`}
                              >
                                <div
                                  className="flex-1 flex items-center gap-1.5"
                                  onClick={(e) => {
                                    if (!e.defaultPrevented) {
                                      handleCompetitorNameClick(competitorId);
                                    }
                                  }}
                                >
                                  <FaBuilding className="text-gray-500 w-3 h-3 flex-shrink-0" />
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span
                                      className={`text-xs truncate ${
                                        isSelected
                                          ? "font-medium text-gray-900"
                                          : "text-gray-700"
                                      }`}
                                      title={competitorName}
                                    >
                                      {competitorName}
                                    </span>
                                    {competitor.competitor_type && (
                                      <span className="text-[10px] text-gray-500 truncate">
                                        {competitor.competitor_type}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleCompetitorMenuOpen(e, competitor)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  sx={{ padding: "2px" }}
                                >
                                  <FaEllipsisV
                                    className="text-gray-500"
                                    style={{ width: "10px", height: "10px" }}
                                  />
                                </IconButton>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Section */}
            <div className="flex flex-col border-t border-gray-200">
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 transition-all duration-300 ease-in-out bg-gray-50 flex-shrink-0"
                onClick={() => setInternalsExpanded(!internalsExpanded)}
              >
                <div className="flex items-center gap-2">
                  <FaFile className="text-gray-600 w-3.5 h-3.5" />
                  <span className="font-semibold text-xs uppercase tracking-wide text-gray-700">
                    Your Files
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {internalSources.length}
                  </span>
                </div>
                {internalsExpanded ? (
                  <FaChevronUp className="text-gray-500 w-3 h-3" />
                ) : (
                  <FaChevronDown className="text-gray-500 w-3 h-3" />
                )}
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  internalsExpanded
                    ? "h-72 opacity-100"
                    : "h-0 opacity-0 overflow-hidden"
                }`}
              >
                {internalsExpanded && (
                  <div className="flex flex-col h-full">
                    <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
                      <button
                        onClick={() => setShowAddInternal(true)}
                        className="py-1.5 w-full px-2 rounded inline-flex items-center justify-center gap-1 bg-primary text-white cursor-pointer hover:bg-primary-dark hover:shadow-md active:scale-95 transition-all duration-200 ease-in-out text-xs"
                      >
                        <FaPlus size={10} /> Add File
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {internalSources.length === 0 ? (
                        <div className="text-center text-gray-500 py-4 text-xs">
                          No files added yet
                        </div>
                      ) : (
                        <ul className="px-2 py-1">
                          {internalSources.map((internalSource) => {
                            const sourceId = internalSource.source_id;
                            const isSelected =
                              selectedInternalSources.includes(sourceId);
                            const sourceName =
                              internalSource?.file_name?.trim() ||
                              internalSource?.title?.trim() ||
                              "Untitled internal source";

                            return (
                              <li
                                key={sourceId}
                                className={`group px-2 py-1.5 flex items-center gap-2 text-xs hover:bg-gray-100 cursor-pointer rounded ${
                                  isSelected ? "bg-sky-50" : ""
                                }`}
                              >
                                <div
                                  className="flex-1 flex items-center gap-1.5"
                                  onClick={(e) => {
                                    if (!e.defaultPrevented) {
                                      handleInternalSourceNameClick(sourceId);
                                    }
                                  }}
                                >
                                  <FaFile className="text-gray-500 w-3 h-3 flex-shrink-0" />
                                  <span
                                    className={`text-xs truncate ${
                                      isSelected
                                        ? "font-medium text-gray-900"
                                        : "text-gray-700"
                                    }`}
                                    title={sourceName}
                                  >
                                    {sourceName}
                                  </span>
                                </div>

                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleInternalMenuOpen(e, internalSource)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  sx={{ padding: "2px" }}
                                >
                                  <FaEllipsisV
                                    className="text-gray-500"
                                    style={{ width: "10px", height: "10px" }}
                                  />
                                </IconButton>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddSource && (
        <AddSourcesModal
          projectId={projectId}
          isOpen={showAddSource}
          onClose={() => setShowAddSource(false)}
          onFileUpload={handleFileUpload}
          onShowText={() => setShowText(true)}
          onShowLink={(type) => {
            setLinkType(type);
            setShowLink(true);
          }}
        />
      )}

      <TextModal
        isOpen={showText}
        onClose={() => setShowText(false)}
        projectId={projectId}
        componentId="manage"
        domainId="default"
        onAdd={handleAddSource}
        isCompanyResearchContext={true}
        onResearchTaskStarted={onResearchTaskStarted}
        onOpenResearchTasksView={openGlobalTaskMonitor}
      />
      <LinkModal
        isOpen={showLink}
        onClose={() => setShowLink(false)}
        onAdd={handleAddSource}
        linkType={linkType}
        projectId={projectId}
        componentId="manage"
        domainId="default"
        onResearchTaskStarted={onResearchTaskStarted}
        onOpenResearchTasksView={openGlobalTaskMonitor}
      />

      {showSourceRename && renamingSource && (
        <RenameModal
          isOpen={showSourceRename}
          onClose={() => {
            setShowSourceRename(false);
            setRenamingSource(null);
          }}
          onRename={(newName) =>
            handleSourceRename(getSourceId(renamingSource), newName)
          }
          currentName={renamingSource.file_name || renamingSource.url || ""}
          title="Rename Source"
          isSubmitting={isRenamingSource}
        />
      )}

      {showSourceDeleteConfirm && deletingSource && (
        <DeleteConfirmModal
          isOpen={showSourceDeleteConfirm}
          onClose={() => {
            setShowSourceDeleteConfirm(false);
            setDeletingSource(null);
          }}
          onConfirm={() => handleSourceDelete(deletingSource)}
          sourceName={
            deletingSource.file_name || deletingSource.url || "this source"
          }
          isSubmitting={isDeletingSource}
        />
      )}

      {showAddCompetitor && (
        <AddCompetitorModal
          isOpen={showAddCompetitor}
          projectId={projectId}
          onClose={() => setShowAddCompetitor(false)}
          onSuccess={handleAddCompetitor}
          onResearchTaskStarted={onResearchTaskStarted}
          onOpenResearchTasksView={openGlobalTaskMonitor}
        />
      )}

      {showCompetitorRename && renamingCompetitor && (
        <CompetitorRenameModal
          isOpen={showCompetitorRename}
          onClose={() => {
            setShowCompetitorRename(false);
            setRenamingCompetitor(null);
          }}
          onRename={(newName) =>
            handleCompetitorRename(getCompetitorId(renamingCompetitor), newName)
          }
          currentName={
            renamingCompetitor.competitor_name || renamingCompetitor.url || ""
          }
          title="Rename Other School"
          isSubmitting={isRenamingCompetitor}
        />
      )}

      {showCompetitorDeleteConfirm && deletingCompetitor && (
        <CompetitorDeleteConfirmModal
          isOpen={showCompetitorDeleteConfirm}
          onClose={() => {
            setShowCompetitorDeleteConfirm(false);
            setDeletingCompetitor(null);
          }}
          onConfirm={() => handleCompetitorDelete(deletingCompetitor)}
          itemName={
            deletingCompetitor.competitor_name ||
            deletingCompetitor.url ||
            "this school"
          }
          isSubmitting={isDeletingCompetitor}
        />
      )}

      {/* MUI Menu for Source Actions */}
      <Menu
        anchorEl={sourceMenuAnchor}
        open={Boolean(sourceMenuAnchor)}
        onClose={handleSourceMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            if (selectedSourceForMenu) {
              setRenamingSource(selectedSourceForMenu);
              setShowSourceRename(true);
            }
            handleSourceMenuClose();
          }}
          sx={{ fontSize: "0.75rem", padding: "6px 12px" }}
          disabled={isRenamingSource}
        >
          {isRenamingSource && renamingSource === selectedSourceForMenu ? (
            <div className="mr-2 w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaEdit className="mr-2" style={{ width: "10px", height: "10px" }} />
          )}
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedSourceForMenu) {
              setDeletingSource(selectedSourceForMenu);
              setShowSourceDeleteConfirm(true);
            }
            handleSourceMenuClose();
          }}
          sx={{ fontSize: "0.75rem", padding: "6px 12px", color: "#dc2626" }}
          disabled={isDeletingSource}
        >
          {isDeletingSource && deletingSource === selectedSourceForMenu ? (
            <div className="mr-2 w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaTrash className="mr-2" style={{ width: "10px", height: "10px" }} />
          )}
          Delete
        </MenuItem>
      </Menu>

      {/* MUI Menu for Competitor Actions */}
      <Menu
        anchorEl={competitorMenuAnchor}
        open={Boolean(competitorMenuAnchor)}
        onClose={handleCompetitorMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            if (selectedCompetitorForMenu) {
              setRenamingCompetitor(selectedCompetitorForMenu);
              setShowCompetitorRename(true);
            }
            handleCompetitorMenuClose();
          }}
          sx={{ fontSize: "0.75rem", padding: "6px 12px" }}
          disabled={isRenamingCompetitor}
        >
          {isRenamingCompetitor && renamingCompetitor === selectedCompetitorForMenu ? (
            <div className="mr-2 w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaEdit className="mr-2" style={{ width: "10px", height: "10px" }} />
          )}
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedCompetitorForMenu) {
              setDeletingCompetitor(selectedCompetitorForMenu);
              setShowCompetitorDeleteConfirm(true);
            }
            handleCompetitorMenuClose();
          }}
          sx={{ fontSize: "0.75rem", padding: "6px 12px", color: "#dc2626" }}
          disabled={isDeletingCompetitor}
        >
          {isDeletingCompetitor && deletingCompetitor === selectedCompetitorForMenu ? (
            <div className="mr-2 w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaTrash className="mr-2" style={{ width: "10px", height: "10px" }} />
          )}
          Delete
        </MenuItem>
      </Menu>

      {/* Internal Source Modals */}
      {showAddInternal && (
        <AddInternalModal
          isOpen={showAddInternal}
          projectId={projectId}
          onClose={() => setShowAddInternal(false)}
          onAdd={onInternalSourceAdded}
        />
      )}

      {showInternalRename && renamingInternal && (
        <InternalRenameModal
          isOpen={showInternalRename}
          onClose={() => {
            setShowInternalRename(false);
            setRenamingInternal(null);
          }}
          onRename={(newName) =>
            handleInternalSourceRename(renamingInternal.source_id, newName)
          }
          currentName={renamingInternal.file_name || ""}
        />
      )}

      {showInternalDeleteConfirm && deletingInternal && (
        <InternalDeleteConfirmModal
          isOpen={showInternalDeleteConfirm}
          onClose={() => {
            setShowInternalDeleteConfirm(false);
            setDeletingInternal(null);
          }}
          onConfirm={() => handleInternalSourceDelete(deletingInternal)}
          sourceName={deletingInternal.file_name || "this internal source"}
          isDeleting={isDeletingInternal}
        />
      )}

      {/* MUI Menu for Internal Source Actions */}
      <Menu
        anchorEl={internalMenuAnchor}
        open={Boolean(internalMenuAnchor)}
        onClose={handleInternalMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            if (selectedInternalForMenu) {
              setRenamingInternal(selectedInternalForMenu);
              setShowInternalRename(true);
            }
            handleInternalMenuClose();
          }}
          sx={{ fontSize: "0.75rem", padding: "6px 12px" }}
        >
          <FaEdit className="mr-2" style={{ width: "10px", height: "10px" }} />
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedInternalForMenu) {
              setDeletingInternal(selectedInternalForMenu);
              setShowInternalDeleteConfirm(true);
            }
            handleInternalMenuClose();
          }}
          sx={{ fontSize: "0.75rem", padding: "6px 12px", color: "#dc2626" }}
        >
          <FaTrash className="mr-2" style={{ width: "10px", height: "10px" }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
