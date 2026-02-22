"use client";

import React, { useEffect, useState, useRef } from "react";
import { FaEllipsisV, FaTrash, FaEdit } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { useRouter } from "next/navigation";
import api from "../../api/axios";
import { useSelection } from "../context/SelectionContext";
import ProjectTableSkeleton from "./shimmer/ProjectTableSkeleton";
import toast from "react-hot-toast";

export default function ProjectTable() {
  const router = useRouter();
  const {
    selectedUser,
    selectedProject,
    setSelectedProject,
    setSelectedCompany,
    selectedCompany,
    refreshProjects,
  } = useSelection();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  const [renameModeId, setRenameModeId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamingId, setIsRenamingId] = useState(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedCompany?.id) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/auth/projects/?company_id=${selectedCompany.id}`
        );
        const data = response.data;
        console.log("ProjectTable data------->", data);
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [selectedCompany?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const startRename = (proj) => {
    setRenameModeId(proj.id);
    setRenameValue(proj.name || proj.project_name);
    setOpenMenuId(null);
  };

  const confirmRename = async (id) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    setIsRenamingId(id);
    try {
      // API call first
      await api.patch(`/auth/projects/${id}/`, {
        name: trimmed,
      });

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, name: trimmed, project_name: trimmed } : p
        )
      );

      // Refresh projects in navbar
      refreshProjects();

      setRenameModeId(null);
      toast.success("Project renamed successfully");
    } catch (err) {
      console.error("Rename failed", err);
      toast.error("Failed to rename project");
    } finally {
      setIsRenamingId(null);
    }
  };

  const requestDelete = (id) => {
    setDeleteConfirmId(id);
    setOpenMenuId(null);
  };

  const confirmDelete = async (id) => {
    setIsDeletingId(id);
    try {
      // API call first
      await api.delete(`/auth/projects/${id}/`);

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== id));

      // If the deleted project was selected, clear it
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }

      // Refresh projects in navbar
      refreshProjects();

      setDeleteConfirmId(null);
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete project");
    } finally {
      setIsDeletingId(null);
    }
  };

  console.log(selectedProject, "AllSelectedProject");

  // Show shimmer loading when loading
  if (isLoading) {
    return <ProjectTableSkeleton />;
  }

  // Show message when no company is selected
  if (!selectedCompany?.id) {
    return (
      <div className="max-w-4xl rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">
          Please select a company to view projects
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl rounded-lg border border-gray-200 overflow-visible">
        <div className="overflow-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr className="rounded-lg">
                <th className="rounded-tl-lg px-6 py-4 text-left text-sm font-medium text-gray-800">
                  Project Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800">
                  Organization
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800">
                  Members
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800">
                  Created By
                </th>
                <th className="rounded-tr-lg px-6 py-4 text-center text-sm font-medium text-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {error && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-red-500"
                  >
                    Failed to load projects.
                  </td>
                </tr>
              )}
              {!error && projects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No projects found for this organization.
                  </td>
                </tr>
              )}
              {!error &&
                projects.length > 0 &&
                projects.map((proj) => (
                  <tr
                    key={proj.id}
                    className="hover:bg-gray-100/20 transition-colors cursor-pointer"
                    onClick={() => {
                      router.push(`/projects/${proj?.id}/overview`);
                      setSelectedProject(proj);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a258d3]">
                      {proj.name || proj.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {proj.company_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center space-x-1">
                      <span>{proj.member_count || proj.users || 0}</span>
                      <HiUsers className="text-[#cc8df6] mt-[4px] text-lg" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {proj.created_by_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      <button
                        className="p-2 hover:bg-gray-200/80 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropdownWidth = 144;
                          setMenuCoords({
                            x: rect.right - dropdownWidth,
                            y: rect.bottom + 4,
                          });
                          setOpenMenuId(
                            openMenuId === proj.id ? null : proj.id
                          );
                        }}
                      >
                        <FaEllipsisV size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown */}
      {openMenuId && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuCoords.y - 65,
            left: menuCoords.x,
            width: "144px",
            zIndex: 1000,
          }}
          className="bg-[#fafafa] border border-gray-400 shadow rounded text-sm"
        >
          <button
            onClick={() =>
              startRename(projects.find((p) => p.id === openMenuId))
            }
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
          >
            <FaEdit /> Rename
          </button>
          <button
            onClick={() => requestDelete(openMenuId)}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-400 hover:bg-gray-100"
          >
            <FaTrash /> Delete
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renameModeId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-100 z-50">
          <div className="bg-white rounded-lg max-w-80 w-full mx-4 p-6 ">
            <h3 className="text-lg font-semibold text-black mb-4">
              Rename Project
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-100 text-gray-800 rounded border border-gray-200"
              placeholder="New project name"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRenameModeId(null)}
                className="cursor-pointer px-4 py-2 bg-[#6b5a99] text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmRename(renameModeId)}
                className="cursor-pointer px-4 py-2 bg-primary text-white rounded"
                disabled={isRenamingId === renameModeId}
              >
                {isRenamingId === renameModeId ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-100 z-50">
          <div className="bg-[#fafafa] p-6 rounded-lg w-80">
            <h3 className="text-lg font-semibold text-black mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-800 mb-6">
              Are you sure you want to delete this project?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="cursor-pointer px-4 py-2 bg-[#6b5a99] text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded"
                disabled={isDeletingId === deleteConfirmId}
              >
                {isDeletingId === deleteConfirmId ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
