"use client";

import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/axios";

function ModalBackdrop({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4">
        {children}
      </div>
    </div>
  );
}

export function AddCompetitorModal({
  isOpen,
  onClose,
  projectId,
  onAdd,
  onResearchTaskStarted,
  onOpenResearchTasksView,
}) {
  const [competitorTypes, setCompetitorTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    competitor_type: "",
    website: "",
    name: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchCompetitorTypes();
    }
  }, [isOpen]);

  const fetchCompetitorTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await api.get("/api/competitor-types/");
      setCompetitorTypes(response.data.competitor_types || []);
    } catch (error) {
      console.error("Error fetching competitor types:", error);
      toast.error("Failed to load competitor types");
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.competitor_type || !formData.website || !formData.name) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        url: formData.website,
        project_id: projectId,
        is_competitor: "true",
        competitor_type: formData.competitor_type,
        competitor_name: formData.name,
      };

      const response = await api.post(
        "/keyword-api/company-research/",
        payload
      );
      const data = response.data;

      toast.success(
        "Competitor analysis started. You can track progress in Task Monitor."
      );

      if (onResearchTaskStarted) {
        onResearchTaskStarted({
          ...data,
          type: "competitor",
          source_type: "competitor",
          agent_type: data?.agent_type || "CompanyCompetitorResearchAgent",
          origin: "competitor_add",
          project_id: projectId,
          competitor_name: formData.name,
          competitor_type: formData.competitor_type,
          url: formData.website,
        });
      }

      // Open task monitor and refresh immediately after API success
      if (onOpenResearchTasksView) {
        setTimeout(() => {
          onOpenResearchTasksView();
        }, 500);
      }

      if (onAdd) {
        onAdd({
          competitor_name: formData.name,
          competitor_type: formData.competitor_type,
          url: formData.website,
          id: data.task_id,
        });
      }

      setFormData({
        competitor_type: "",
        website: "",
        name: "",
      });

      onClose();
    } catch (error) {
      console.error("Error adding competitor:", error);
      let errorMessage = "Failed to add competitor";

      const responseData = error && error.response ? error.response.data : null;
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
      } else if (error && error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        competitor_type: "",
        website: "",
        name: "",
      });
      onClose();
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Competitor</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Competitor Type <span className="text-red-500">*</span>
            </label>
            {loadingTypes ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                Loading types...
              </div>
            ) : (
              <select
                name="competitor_type"
                value={formData.competitor_type}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select competitor type</option>
                {competitorTypes.map((type) => (
                  <option key={type.id} value={type.competitor_type}>
                    {type.competitor_type}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Competitor name"
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isSubmitting && (
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
              )}
              <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function RenameModal({ isOpen, onClose, currentName, onRename, isSubmitting = false }) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(newName.trim());
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={!isSubmitting ? onClose : () => {}}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Rename Competitor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter new name"
            autoFocus
            disabled={isSubmitting}
          />
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && (
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
              )}
              Rename
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isSubmitting,
}) {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Confirm Delete</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{itemName}</strong>? This
          action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isSubmitting && (
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
            )}
            <span>{isSubmitting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
