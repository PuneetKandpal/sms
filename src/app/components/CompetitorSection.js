"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaBuilding,
} from "react-icons/fa";
import { FiSidebar } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import {
  AddCompetitorModal,
  RenameModal,
  DeleteConfirmModal,
} from "./CompetitorModals";
import { useSelection } from "../context/SelectionContext";

function getCompetitorId(competitor) {
  return competitor.source_id || competitor.id || competitor.competitor_id;
}

export default function CompetitorSection({
  projectId,
  collapsed,
  toggleCollapse,
  competitors,
  setCompetitors,
  selectedCompetitors = [],
  setSelectedCompetitors,
  onCompetitorAdded,
  hasPendingChanges = false,
  onOpenReviewRequested,
  hasActiveResearchTasks = false,
  hasCompetitorResearchInProgress = null,
  onOpenResearchTasksView,
  onResearchTaskStarted,
  onCompetitorSelect,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const menuRef = useRef(null);

  const [showRename, setShowRename] = useState(false);
  const [renamingCompetitor, setRenamingCompetitor] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCompetitor, setDeletingCompetitor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedProject } = useSelection();

  const handleCheckboxChange = (competitorId) => {
    const isCurrentlySelected = selectedCompetitors.includes(competitorId);

    if (isCurrentlySelected) {
      setSelectedCompetitors([]);
      if (onCompetitorSelect) {
        onCompetitorSelect(null);
      }
    } else {
      setSelectedCompetitors([competitorId]);
      if (onCompetitorSelect) {
        onCompetitorSelect(competitorId);
      }
    }
  };

  const handleCompetitorNameClick = (competitorId) => {
    handleCheckboxChange(competitorId);
  };

  const handleDelete = async (competitor) => {
    const competitorId = getCompetitorId(competitor);
    setIsDeleting(true);

    try {
      const res = await api.delete(`/api/competitor/${competitorId}`);
      setCompetitors((prev) =>
        prev.filter((c) => getCompetitorId(c) !== competitorId)
      );
      setSelectedCompetitors((prev) =>
        prev.filter((id) => id !== competitorId)
      );
      toast.success("Competitor deleted successfully");

      if (onCompetitorAdded) {
        await onCompetitorAdded();
      }
    } catch (e) {
      console.error("Delete error:", e);
      let errorMessage = "Delete failed";

      if (e.message && e.message !== "Delete failed") {
        try {
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingCompetitor(null);
      setMenuId(null);
    }
  };

  const handleRename = async (competitorId, newName) => {
    try {
      const res = await api.put(`/api/competitor/${competitorId}`, {
        competitor_name: newName,
      });

      if (res.status !== 200)
        throw new Error(res.data?.message || "Rename failed");
      setCompetitors((prev) =>
        prev.map((c) =>
          getCompetitorId(c) === competitorId
            ? { ...c, competitor_name: newName }
            : c
        )
      );
      toast.success(res.data.message || "Competitor renamed");
    } catch (e) {
      console.error(e);
      let errorMessage = "Rename failed";

      if (e.message && e.message !== "Rename failed") {
        try {
          const errorData = JSON.parse(e.message);
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = e.message;
          }
        } catch (parseError) {
          errorMessage = e.message;
        }
      }

      toast.error(errorMessage);
    }
    setShowRename(false);
    setRenamingCompetitor(null);
    setMenuId(null);
  };

  const handleRenameClick = (competitor) => {
    setRenamingCompetitor(competitor);
    setShowRename(true);
    setMenuId(null);
  };

  const handleDeleteClick = (competitor) => {
    setDeletingCompetitor(competitor);
    setShowDeleteConfirm(true);
    setMenuId(null);
  };

  const handleAddCompetitor = async (newCompetitor) => {
    setCompetitors((prev) => [newCompetitor, ...prev]);

    if (onCompetitorAdded) {
      setTimeout(async () => {
        await onCompetitorAdded();
      }, 1000);
    }

    setShowAdd(false);
  };

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
              <h3 className="font-semibold">Competitors</h3>
              <FiSidebar className="text-primary text-xl cursor-pointer" />
            </>
          )}
        </div>

        {!collapsed && (
          <div className="p-4 flex-1 flex flex-col overflow-auto scrollbar-none">
            <button
              onClick={() => {
                const isCompetitorBlocked =
                  typeof hasCompetitorResearchInProgress === "boolean"
                    ? hasCompetitorResearchInProgress
                    : hasActiveResearchTasks;

                if (isCompetitorBlocked) {
                  if (onOpenResearchTasksView) {
                    toast.error(
                      "Competitor research is in progress. Please wait for it to complete before adding new competitors."
                    );
                    onOpenResearchTasksView();
                  }
                  return;
                }
                setShowAdd(true);
              }}
              className={
                "mb-4 py-1 w-fit px-3 rounded inline-flex items-center gap-1 bg-primary text-white cursor-pointer hover:bg-primary-dark"
              }
              title={
                (typeof hasCompetitorResearchInProgress === "boolean"
                  ? hasCompetitorResearchInProgress
                  : hasActiveResearchTasks)
                  ? "Competitor research is in progress. Please wait for it to complete before adding new competitors."
                  : ""
              }
            >
              <FaPlus size={12} /> Add Competitor
            </button>

            <div className="flex-1 overflow-auto">
              {competitors.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No competitors added yet
                </div>
              ) : (
                <ul className="space-y-2">
                  {competitors.map((competitor) => {
                    const competitorId = getCompetitorId(competitor);
                    const isSelected =
                      selectedCompetitors.includes(competitorId);
                    const competitorName =
                      competitor.competitor_name ||
                      competitor.url ||
                      "Untitled competitor";

                    return (
                      <li
                        key={competitorId}
                        className={`p-2 border rounded flex items-center gap-2 ${
                          isSelected
                            ? "bg-blue-50 border-blue-200"
                            : "border-gray-200"
                        }`}
                      >
                        <div
                          className="flex-1 flex items-start gap-2 cursor-pointer"
                          onClick={() =>
                            handleCompetitorNameClick(competitorId)
                          }
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            <FaBuilding className="text-gray-800 w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`leading-snug ${
                                isSelected ? "font-medium" : ""
                              }`}
                            >
                              {competitorName}
                            </span>
                            {competitor.competitor_type && (
                              <span className="text-xs text-gray-500">
                                {competitor.competitor_type}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative flex-shrink-0" ref={menuRef}>
                          <button
                            onClick={() =>
                              setMenuId(
                                menuId === competitorId ? null : competitorId
                              )
                            }
                            className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
                            title="Competitor options"
                          >
                            <FaEllipsisV size={14} />
                          </button>
                          {menuId === competitorId && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <button
                                onClick={() => handleRenameClick(competitor)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
                              >
                                <FaEdit size={12} /> Rename
                              </button>
                              <button
                                onClick={() => handleDeleteClick(competitor)}
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
      <AddCompetitorModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        projectId={selectedProject?.id}
        onAdd={handleAddCompetitor}
        onResearchTaskStarted={onResearchTaskStarted}
        onOpenResearchTasksView={onOpenResearchTasksView}
      />
      <RenameModal
        isOpen={showRename}
        onClose={() => setShowRename(false)}
        currentName={renamingCompetitor?.competitor_name || ""}
        onRename={(newName) =>
          handleRename(getCompetitorId(renamingCompetitor), newName)
        }
      />
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={() => handleDelete(deletingCompetitor)}
        itemName={deletingCompetitor?.competitor_name || "this competitor"}
        isSubmitting={isDeleting}
      />
    </>
  );
}
