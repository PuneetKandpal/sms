"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Sparkles,
  FileText,
  Users,
  Eye,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import api from "../../../../api/axios";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";

export default function OverviewTab({
  selectedNode,
  pageTemplates = [],
  projectDetails,
  pageDetailsFromApi,
  projectId,
  onPageDeleted,
  onPageUpdated,
  onRefreshPageDetails,
}) {
  console.log("pageDetailsFromApi--------->", pageDetailsFromApi);

  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();

  const [formData, setFormData] = useState({
    contentTitle: selectedNode?.name || "",
    description: "",
    pageTemplate: "",
    targetAudience: "",
    wordCount: 2500,
    url: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const derivedSourceInfo = (() => {
    if (!pageDetailsFromApi) return null;
    if (
      pageDetailsFromApi.created_from_article ||
      pageDetailsFromApi.article_id ||
      pageDetailsFromApi.data_type === "article"
    ) {
      return { label: "Generated from Article" };
    }
    if (
      pageDetailsFromApi.created_from_aio ||
      pageDetailsFromApi.aio_answer_id ||
      pageDetailsFromApi.data_type === "answer"
    ) {
      return { label: "Generated from Answer" };
    }
    return null;
  })();

  const getPageUrl = (urlValue) => {
    if (!urlValue) {
      return "/";
    }

    let url = urlValue.trim();

    if (!url.startsWith("/")) {
      url = "/" + url;
    }

    if (url.length > 1 && url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    const lastSlashIndex = url.lastIndexOf("/");

    if (lastSlashIndex <= 0) {
      return "/";
    }

    const parent = url.substring(0, lastSlashIndex);

    return parent || "/";
  };

  const getDisplayChildUrl = (urlValue) => {
    if (!urlValue) {
      return "";
    }

    let url = urlValue.trim();

    if (!url.startsWith("/")) {
      url = "/" + url;
    }

    return url;
  };

  useEffect(() => {
    if (projectDetails) {
      setFormData((prev) => ({
        ...prev,
        targetAudience: projectDetails.buyer_personas?.overview || "",
      }));
    }
  }, [projectDetails]);

  useEffect(() => {
    console.log("pageTemplates--------->", pageTemplates);
    if (pageTemplates.length > 0 && pageDetailsFromApi) {
      const selectedPageTemplate = pageTemplates.find(
        (template) =>
          template.blueprint_id == pageDetailsFromApi?.blueprint_letter
      );

      console.log("selectedPageTemplate--------->", selectedPageTemplate);

      setFormData((prev) => ({
        ...prev,
        contentTitle: pageDetailsFromApi?.page_title,
        pageTemplate: selectedPageTemplate?.blueprint_id,
        url: pageDetailsFromApi?.url,
        description: pageDetailsFromApi?.notes,
        wordCount:
          pageDetailsFromApi?.word_count ?? prev.wordCount ?? prev.wordCount,
      }));
    } else if (pageTemplates.length > 0) {
      setFormData((prev) => ({
        ...prev,
        pageTemplate: pageTemplates[0].blueprint_id,
      }));
    }
  }, [pageTemplates, pageDetailsFromApi]);

  const handleGenerateArticle = async () => {
    console.log("projectId--------->", projectId);
    console.log("pageDetailsFromApi--------->", pageDetailsFromApi);
    setIsGenerating(true);
    try {
      const payload = {
        word_count: formData.wordCount,
        project_id: projectId,
        page_id: pageDetailsFromApi.page_id,
      };
      const response = await api.post(
        "/content-architecture/generate-article/",
        payload
      );
      console.log("Generate article response:", response.data);
      if (response.data.success) {
        toast.success(
          response.data.message || "Article generation started successfully"
        );

        // Refresh task monitor to show the new task
        if (instantRefreshAfterTaskStart) {
          await instantRefreshAfterTaskStart();
        }

        // Open task monitor drawer to show article generation progress
        if (setIsDrawerOpen) {
          setIsDrawerOpen(true);
        }
      } else {
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error generating article:", error);
      toast.error(error.response.data.error || "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePage = async () => {
    if (!formData.contentTitle.trim()) {
      toast.error("Page title is required");
      return;
    }

    if (!formData.url.trim()) {
      toast.error("URL is required");
      return;
    }

    // Ensure URL starts with / and ends with /
    let formattedUrl = formData.url.trim();
    if (!formattedUrl.startsWith("/")) {
      formattedUrl = "/" + formattedUrl;
    }
    if (!formattedUrl.endsWith("/")) {
      formattedUrl = formattedUrl + "/";
    }

    setIsUpdating(true);
    try {
      const response = await api.put(
        "/content-architecture/update-nested-page/",
        {
          page_id: pageDetailsFromApi.page_id,
          project_id: projectId,
          page_title: formData.contentTitle.trim(),
          url: formattedUrl,
          content_brief: formData.description.trim(),
          blueprint_letter: formData.pageTemplate,
          word_count: Number(formData.wordCount) || 0,
        }
      );

      if (response.data.success) {
        toast.success("Page updated successfully!");
        setIsEditMode(false);
        if (onPageUpdated) {
          await onPageUpdated();
        }
        if (onRefreshPageDetails) {
          try {
            await onRefreshPageDetails({ showLoading: false });
          } catch (refreshError) {
            console.error("Failed to refresh page details:", refreshError);
          }
        }
      } else {
        toast.error(response.data.message || "Failed to update page");
      }
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error(error.response?.data?.error || "Failed to update page");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePage = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(
        "/content-architecture/delete-nested-page/",
        {
          data: {
            page_id: pageDetailsFromApi.page_id,
            project_id: projectId,
          },
        }
      );

      if (response.data.success) {
        toast.success("Page deleted successfully!");
        setShowDeleteConfirm(false);
        if (onPageDeleted) {
          onPageDeleted(pageDetailsFromApi.parent_page_id);
        }
      } else {
        toast.error(response.data.message || "Failed to delete page");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error(error.response?.data?.error || "Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form to original values
    if (pageDetailsFromApi && pageTemplates.length > 0) {
      const selectedPageTemplate = pageTemplates.find(
        (template) =>
          template.blueprint_id == pageDetailsFromApi?.blueprint_letter
      );
      setFormData((prev) => ({
        ...prev,
        contentTitle: pageDetailsFromApi?.page_title,
        pageTemplate: selectedPageTemplate?.blueprint_id,
        url: pageDetailsFromApi?.url,
        description: pageDetailsFromApi?.notes,
      }));
    }
  };

  const pageUrl = getPageUrl(formData.url);
  const childUrl = getDisplayChildUrl(formData.url);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Status Bar */}
      {/* <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Published
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Published on: January 15, 2024
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer">
          <Eye className="h-4 w-4" />
          View Live
        </button>
      </motion.div> */}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form Fields */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Content Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={formData.contentTitle}
              onChange={(e) =>
                setFormData({ ...formData, contentTitle: e.target.value })
              }
              disabled={!isEditMode || isUpdating || isDeleting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter content title"
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page URL
            </label>
            <input
              type="text"
              value={pageUrl}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child URL
            </label>
            <input
              type="text"
              value={childUrl}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              disabled={!isEditMode || isUpdating || isDeleting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter child URL"
            />
          </div>

          {/* Content Brief */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Brief
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              disabled={!isEditMode || isUpdating || isDeleting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Describe the content purpose and key messages"
            />
          </div>

          {/* Page Template - Enhanced */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              Page Template
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">
                SEO Optimized
              </span>
            </label>
            {derivedSourceInfo ? (
              <div className="space-y-2">
                <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm font-semibold">
                  {derivedSourceInfo.label}
                </div>
                <p className="text-xs text-gray-500">
                  Template selection is locked because this page originated from an automated{" "}
                  {derivedSourceInfo.label.includes("Article") ? "article" : "answer"} workflow.
                </p>
              </div>
            ) : (
              <>
                <div className="group">
                  <select
                    value={formData.pageTemplate}
                    onChange={(e) =>
                      setFormData({ ...formData, pageTemplate: e.target.value })
                    }
                    disabled={!isEditMode || isUpdating || isDeleting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white hover:border-purple-300 transition-all cursor-pointer appearance-none font-medium text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {pageTemplates.map((template) => (
                      <option
                        key={template.blueprint_id}
                        value={template.blueprint_id}
                      >
                        {template.blueprint_type}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                {/* Custom helper text */}
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block"></span>
                  Template determines content structure and SEO optimization strategy
                </div>
              </>
            )}
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word Count
            </label>
            <input
              type="number"
              value={formData.wordCount}
              onChange={(e) =>
                setFormData({ ...formData, wordCount: e.target.value })
              }
              disabled={!isEditMode || isUpdating || isDeleting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!isEditMode ? (
              <>
                <motion.button
                  onClick={() => setIsEditMode(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isUpdating || isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Page
                </motion.button>
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isUpdating || isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Page
                </motion.button>
                <motion.button
                  onClick={handleGenerateArticle}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer"
                  disabled={isGenerating || isUpdating || isDeleting}
                >
                  {isGenerating ? (
                    <FaSpinner className="animate-spin w-4 h-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : "Generate Article"}
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={handleUpdatePage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isUpdating || isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <FaSpinner className="animate-spin w-4 h-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </motion.button>
                <motion.button
                  onClick={handleCancelEdit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isUpdating || isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Right Column - Audience & Voice */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Audience & Voice
          </h3>

          {/* Buyer Persona */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-blue-900">Buyer Persona</span>
              <span className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded-full">
                📊 Loaded
              </span>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              {projectDetails?.buyer_personas?.overview || "Not available"}
            </p>
          </div>

          {/* Target Market */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-green-900">Target Market</span>
              <span className="text-xs px-2 py-1 bg-green-200 text-green-700 rounded-full">
                📊 Loaded
              </span>
            </div>
            <p className="text-sm text-green-800 leading-relaxed">
              {projectDetails?.target_markets?.overview || "Not available"}
            </p>
          </div>

          {/* Differentiators */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-purple-900">
                Differentiators
              </span>
              <span className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded-full">
                📊 Loaded
              </span>
            </div>
            <p className="text-sm text-purple-800 leading-relaxed">
              {projectDetails?.differentiators?.overview || "Not available"}
            </p>
          </div>

          {/* Brand Voice */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-orange-900">Brand Voice</span>
              <span className="text-xs px-2 py-1 bg-orange-200 text-orange-700 rounded-full">
                📊 Loaded
              </span>
            </div>
            <p className="text-sm text-orange-800 leading-relaxed">
              {projectDetails?.Overview || "Not available"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
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
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Delete Page
                  </h3>
                </div>
                {!isDeleting && (
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete this page?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-1">
                    This action cannot be undone
                  </h4>
                  <p className="text-sm text-red-700">
                    The page and all its content will be permanently deleted.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Page to delete:
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formData.contentTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePage}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <FaSpinner className="animate-spin h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Page
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Overlay to disable interactions during update/delete */}
      {(isUpdating || isDeleting) && (
        <div className="fixed inset-0 bg-transparent z-30 pointer-events-auto" />
      )}
    </div>
  );
}
