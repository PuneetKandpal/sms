"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaLink,
  FaGlobe,
} from "react-icons/fa";
import { FiSidebar } from "react-icons/fi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { RiYoutubeLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { TbClipboardText } from "react-icons/tb";
import api from "../../api/axios";
import {
  AddSourcesModal,
  TextModal,
  LinkModal,
  RenameModal,
  DeleteConfirmModal,
  ProcessingStatusModal,
  createProgressSimulation,
} from "./SourceModals";
import { useSelection } from "../context/SelectionContext";

/** Helper function to determine source type **/
function getSourceType(source) {
  if (source.source_type) {
    return source.source_type;
  }

  if (source.url) {
    if (source.url.includes("youtube.com") || source.url.includes("youtu.be")) {
      return "youtube";
    }
    return "website";
  }

  if (source.file_name) {
    const extension = source.file_name.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return "pdf";
      case "txt":
      case "doc":
      case "docx":
        return "document";
      default:
        return "file";
    }
  }

  if (source.source_content && !source.url && !source.file_name) {
    return "manual";
  }

  return "unknown";
}

/** Icon by source_type **/
function IconForSourceItem({ source }) {
  const sourceType = getSourceType(source);
  const iconClass = "text-gray-800 w-4 h-4";

  switch (sourceType) {
    case "pdf":
      return <IoDocumentTextOutline className={iconClass} />;
    case "manual":
      return <TbClipboardText className={iconClass} />;
    case "youtube":
      return <RiYoutubeLine className={iconClass} />;
    case "website":
      return <FaGlobe className={iconClass} />;
    case "document":
    case "file":
      return <IoDocumentTextOutline className={iconClass} />;
    default:
      return <FaLink className={iconClass} />;
  }
}

/** Helper function to get consistent source ID **/
function getSourceId(source) {
  return source.id || source.source_id;
}

/** SourceSection Component **/
export default function SourceSection({
  projectId,
  componentId,
  domainId,
  collapsed,
  toggleCollapse,
  sources,
  setSources,
  selectedSources = [],
  setSelectedSources,
  onSourceAdded,
  hasPendingChanges = false,
  onOpenReviewRequested,
  hasActiveResearchTasks = false,
  hasCompanyResearchInProgress = null,
  onOpenResearchTasksView,
  onResearchTaskStarted,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkType, setLinkType] = useState("website");
  const [menuId, setMenuId] = useState(null);
  const menuRef = useRef(null);

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [fileProgress, setFileProgress] = useState(0);
  const [fileStatusText, setFileStatusText] = useState("Processing file...");
  const [showFileProgress, setShowFileProgress] = useState(false);

  // Modal states
  const [showRename, setShowRename] = useState(false);
  const [renamingSource, setRenamingSource] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSource, setDeletingSource] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedProject } = useSelection();

  // Handle checkbox selection - only one source at a time
  const handleCheckboxChange = (sourceId) => {
    setSelectedSources(
      (prev) =>
        prev.includes(sourceId)
          ? [] // Uncheck if already selected
          : [sourceId] // Select only this source, uncheck others
    );
  };

  // Handle source name click
  const handleSourceNameClick = (sourceId) => {
    handleCheckboxChange(sourceId);
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    const fd = new FormData();
    fd.append("project_id", selectedProject?.id);
    fd.append("component_id", componentId);
    fd.append("domain_id", domainId);
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
          project_id: selectedProject?.id,
          component_id: componentId,
          domain_id: domainId,
          file_name: d?.file_name || file.name,
        });
      }

      if (onOpenResearchTasksView) {
        onOpenResearchTasksView();
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

  // Handle file upload cancel
  const handleFileCancel = () => {
    setIsUploading(false);
    setUploadingFileName("");
    setShowFileProgress(false);
    setFileProgress(0);
    setFileStatusText("Processing file...");
  };

  // Handle source deletion
  const handleDelete = async (source) => {
    const sourceId = getSourceId(source);
    setIsDeleting(true);

    try {
      const res = await api.delete(`/api/source-update-delete/${sourceId}`);
      setSources((prev) => prev.filter((s) => getSourceId(s) !== sourceId));
      setSelectedSources((prev) => prev.filter((id) => id !== sourceId));
      toast.success("Source deleted successfully");

      // Refetch all data after successful deletion
      if (onSourceAdded) {
        await onSourceAdded();
      }
    } catch (e) {
      console.error("Delete error:", e);
      let errorMessage = "Delete failed";

      // The error message is already in e.message from the fetch
      if (e.message && e.message !== "Delete failed") {
        try {
          // Try to parse JSON from the error message
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          // If not JSON, use the raw error message
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingSource(null);
      setMenuId(null);
    }
  };

  // Handle source renaming
  const handleRename = async (sourceId, newName) => {
    try {
      const res = await api.put(`/api/source-update-delete/${sourceId}`, {
        file_name: newName,
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
      let errorMessage = "Rename failed";

      // The error message is already in e.message from the fetch
      if (e.message && e.message !== "Rename failed") {
        try {
          // Try to parse JSON from the error message
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          // If not JSON, use the raw error message
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);
    }
    setShowRename(false);
    setRenamingSource(null);
    setMenuId(null);
  };

  // Handle rename click
  const handleRenameClick = (source) => {
    setRenamingSource(source);
    setShowRename(true);
    setMenuId(null);
  };

  // Handle delete click
  const handleDeleteClick = (source) => {
    setDeletingSource(source);
    setShowDeleteConfirm(true);
    setMenuId(null);
  };

  // Handle adding a new source
  // const handleAddSource = async (newSource) => {
  //   if (newSource.source_type !== "website") {
  //     setSources((prev) => [newSource, ...prev]);
  //   }

  //   if (
  //     onSourceAdded &&
  //     (newSource.source_type === "website" ||
  //       newSource.source_type === "manual")
  //   ) {
  //     if (newSource.source_type === "website") {
  //       setTimeout(async () => {
  //         await onSourceAdded();
  //       }, 1000);
  //     } else {
  //       await onSourceAdded();
  //     }
  //   }
  // };

  // Update the handleAddSource function
  const handleAddSource = async (newSource) => {
    if (newSource.source_type !== "website") {
      setSources((prev) => [newSource, ...prev]);
    }

    if (
      onSourceAdded &&
      (newSource.source_type === "website" ||
        newSource.source_type === "manual")
    ) {
      if (newSource.source_type === "website") {
        setTimeout(async () => {
          await onSourceAdded();
        }, 1000);
      } else {
        await onSourceAdded();
      }
    }

    // Close the add sources modal when a source is added
    setShowAdd(false);
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div
        className={`flex flex-col bg-gray-50 border border-gray-200 rounded-lg h-[calc(50vh-100px)] relative overflow-auto ${
          collapsed ? "cursor-pointer" : ""
        }`}
      >
        <div
          className="flex items-center justify-between px-4 py-4 bg-gray-100"
          onClick={toggleCollapse}
        >
          {collapsed ? (
            <div className="w-full flex justify-center py-1.5">
              <FiSidebar className="text-primary text-xl" />
            </div>
          ) : (
            <>
              <h3 className="font-semibold">Sources</h3>
              <FiSidebar className="text-primary text-xl cursor-pointer" />
            </>
          )}
        </div>

        {!collapsed && (
          <div className="p-4 flex-1 flex flex-col overflow-auto scrollbar-none">
            <button
              onClick={() => {
                if (isUploading) return;
                const isCompanyBlocked =
                  typeof hasCompanyResearchInProgress === "boolean"
                    ? hasCompanyResearchInProgress
                    : hasActiveResearchTasks;

                if (isCompanyBlocked) {
                  if (onOpenResearchTasksView) {
                    toast.error(
                      "Company research is in progress. Please wait for it to complete before adding new sources."
                    );
                    onOpenResearchTasksView();
                  }
                  return;
                }
                if (hasPendingChanges) {
                  onOpenReviewRequested && onOpenReviewRequested();
                  return;
                }
                setShowAdd(true);
              }}
              className={
                "mb-4 py-1.5 w-fit px-3 rounded inline-flex items-center gap-1 bg-primary text-white cursor-pointer hover:bg-primary-dark hover:shadow-md active:scale-95 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              }
              disabled={isUploading}
              title={
                hasPendingChanges
                  ? "Review pending changes before adding new sources"
                  : (typeof hasCompanyResearchInProgress === "boolean"
                      ? hasCompanyResearchInProgress
                      : hasActiveResearchTasks)
                  ? "Company research is in progress. Please wait for it to complete before adding new sources."
                  : ""
              }
            >
              <FaPlus size={12} /> {isUploading ? "Uploading..." : "Add Source"}
            </button>

            <div className="flex-1 overflow-auto">
              {sources.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No sources added yet
                </div>
              ) : (
                <ul className="space-y-2">
                  {sources.map((source) => {
                    const sourceId = getSourceId(source);
                    const isSelected = selectedSources.includes(sourceId);
                    const sourceName =
                      source.file_name || source.url || "Untitled source";
                    const sourceType = getSourceType(source);

                    return (
                      <li
                        key={sourceId}
                        className={`p-2 border rounded flex items-center gap-2 ${
                          isSelected
                            ? "bg-blue-50 border-blue-200"
                            : "border-gray-200"
                        }`}
                      >
                        {/* <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(sourceId)}
                          className="cursor-pointer"
                        /> */}
                        <div className="flex-1 flex items-start gap-2">
                          <div className="mt-0.5 flex-shrink-0">
                            <IconForSourceItem source={source} />
                          </div>
                          <span
                            className={`cursor-pointer leading-snug ${
                              isSelected ? "font-medium" : ""
                            }`}
                            // onClick={() => handleSourceNameClick(sourceId)}
                          >
                            {sourceName}
                          </span>
                        </div>

                        <div className="relative flex-shrink-0" ref={menuRef}>
                          <button
                            onClick={() =>
                              setMenuId(menuId === sourceId ? null : sourceId)
                            }
                            className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
                            title="Source options"
                          >
                            <FaEllipsisV size={14} />
                          </button>
                          {menuId === sourceId && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <button
                                onClick={() => handleRenameClick(source)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
                              >
                                <FaEdit size={12} /> Rename
                              </button>
                              <button
                                onClick={() => handleDeleteClick(source)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 cursor-pointer"
                              >
                                <FaTrash size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Modals */}
      <AddSourcesModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onFileUpload={handleFileUpload}
        onShowText={() => setShowText(true)}
        onShowLink={(type) => {
          setLinkType(type);
          setShowLink(true);
        }}
      />
      {/* <SourceButton
				isOpen={showButton}
				onClose={() => setShowButton(false)}
				projectId={projectId}
				componentId={componentId}
				domainId={domainId}
				showAdd={showAdd}
				setShowAdd={setShowAdd}
				setShowLink={setShowLink}
				setLinkType={setLinkType}
				setShowText={setShowText}
				showText={showText}
				handleAddSource={handleAddSource}
				handleFileUpload={handleFileUpload}
			/> */}
      <TextModal
        isOpen={showText}
        onClose={() => setShowText(false)}
        projectId={selectedProject?.id}
        componentId={componentId}
        domainId={domainId}
        onAdd={handleAddSource}
        isCompanyResearchContext={true}
        onResearchTaskStarted={onResearchTaskStarted}
        onOpenResearchTasksView={onOpenResearchTasksView}
      />
      <LinkModal
        isOpen={showLink}
        onClose={() => setShowLink(false)}
        onAdd={handleAddSource}
        linkType={linkType}
        projectId={selectedProject?.id}
        componentId={componentId}
        domainId={domainId}
        onResearchTaskStarted={onResearchTaskStarted}
        onOpenResearchTasksView={onOpenResearchTasksView}
      />
      <RenameModal
        isOpen={showRename}
        onClose={() => setShowRename(false)}
        currentName={renamingSource?.file_name || ""}
        onRename={(newName) =>
          handleRename(getSourceId(renamingSource), newName)
        }
      />
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={() => handleDelete(deletingSource)}
        sourceName={deletingSource?.file_name || "this source"}
        isSubmitting={isDeleting}
      />
    </>
  );
}
