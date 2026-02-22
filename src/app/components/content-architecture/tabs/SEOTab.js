"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Tag, X } from "lucide-react";
import api from "../../../../api/axios";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

export default function SEOTab({
  selectedNode,
  projectId,
  architectId,
  refetchPageDetails,
}) {
  const [primaryKeywords, setPrimaryKeywords] = useState([]);
  const [secondaryKeywords, setSecondaryKeywords] = useState([]);
  const [newPrimaryKeyword, setNewPrimaryKeyword] = useState("");
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);
  const [isMetaEditing, setIsMetaEditing] = useState(false);

  useEffect(() => {
    const keywordSource =
      selectedNode?.keywords || selectedNode?.data?.keywords || {};

    const keywords = keywordSource || {};

    const primary = Array.isArray(keywords.primary_keywords)
      ? keywords.primary_keywords
      : keywords.primary_keywords
      ? [keywords.primary_keywords]
      : [];

    const secondary = Array.isArray(keywords.secondary_keywords)
      ? keywords.secondary_keywords
      : keywords.secondary_keywords
      ? [keywords.secondary_keywords]
      : [];

    setPrimaryKeywords(primary);
    setSecondaryKeywords(secondary);
    setNewPrimaryKeyword("");
    setNewSecondaryKeyword("");
    setMetaTitle(
      selectedNode?.meta_title || selectedNode?.data?.meta_title || ""
    );
    setMetaDescription(
      selectedNode?.meta_description ||
        selectedNode?.data?.meta_description ||
        ""
    );
    setIsMetaEditing(false);
  }, [selectedNode]);

  const syncKeywords = async (nextPrimary, nextSecondary) => {
    if (!selectedNode) return;

    const pageId = selectedNode.page_id || selectedNode.id;
    const contentArchitectureId =
      architectId || selectedNode.content_architecture_data_id;

    if (!pageId || !contentArchitectureId) {
      throw new Error("Missing page information to update SEO keywords");
    }

    setIsUpdating(true);
    try {
      const payload = {
        content_architecture_data_id: contentArchitectureId,
        page_id: pageId,
        primary_keywords: nextPrimary,
        secondary_keywords: nextSecondary,
      };

      console.log("SEO keywords auto-save payload", payload);

      const response = await api.put(
        "/content-architecture/update-page-keywords/",
        payload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to update SEO keywords"
        );
      }

      await refetchPageDetails?.({ pageId, showLoading: false });
    } catch (error) {
      console.error("Error auto-saving SEO keywords:", error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const addPrimaryKeyword = async () => {
    const trimmed = newPrimaryKeyword.trim();
    if (!trimmed) return;
    if (primaryKeywords.includes(trimmed)) return;

    const previousPrimary = primaryKeywords;
    const previousSecondary = secondaryKeywords;
    const nextPrimary = [...previousPrimary, trimmed];

    // Optimistic update
    setPrimaryKeywords(nextPrimary);
    setNewPrimaryKeyword("");

    try {
      await syncKeywords(nextPrimary, previousSecondary);
    } catch (error) {
      // Rollback on failure
      setPrimaryKeywords(previousPrimary);
      toast.error(`Keyword update failed for "${trimmed}"`);
    }
  };

  const addSecondaryKeyword = async () => {
    const trimmed = newSecondaryKeyword.trim();
    if (!trimmed) return;
    if (secondaryKeywords.includes(trimmed)) return;

    const previousPrimary = primaryKeywords;
    const previousSecondary = secondaryKeywords;
    const nextSecondary = [...previousSecondary, trimmed];

    // Optimistic update
    setSecondaryKeywords(nextSecondary);
    setNewSecondaryKeyword("");

    try {
      await syncKeywords(previousPrimary, nextSecondary);
    } catch (error) {
      // Rollback on failure
      setSecondaryKeywords(previousSecondary);
      toast.error(`Keyword update failed for "${trimmed}"`);
    }
  };

  const removePrimaryKeyword = async (keyword) => {
    const previousPrimary = primaryKeywords;
    const previousSecondary = secondaryKeywords;
    const nextPrimary = previousPrimary.filter((k) => k !== keyword);

    // Optimistic update
    setPrimaryKeywords(nextPrimary);

    try {
      await syncKeywords(nextPrimary, previousSecondary);
    } catch (error) {
      // Rollback on failure
      setPrimaryKeywords(previousPrimary);
      toast.error(`Keyword update failed for "${keyword}"`);
    }
  };

  const removeSecondaryKeyword = async (keyword) => {
    const previousPrimary = primaryKeywords;
    const previousSecondary = secondaryKeywords;
    const nextSecondary = previousSecondary.filter((k) => k !== keyword);

    // Optimistic update
    setSecondaryKeywords(nextSecondary);

    try {
      await syncKeywords(previousPrimary, nextSecondary);
    } catch (error) {
      // Rollback on failure
      setSecondaryKeywords(previousSecondary);
      toast.error(`Keyword update failed for "${keyword}"`);
    }
  };

  const handleUpdateMeta = async () => {
    if (!selectedNode) return;

    const pageId = selectedNode.page_id || selectedNode.id;
    const contentArchitectureId =
      architectId || selectedNode.content_architecture_data_id;

    if (!pageId || !contentArchitectureId) {
      toast.error("Missing page information to update meta details");
      return;
    }

    setIsUpdatingMeta(true);
    try {
      const payload = {
        content_architecture_data_id: contentArchitectureId,
        page_id: pageId,
        meta_title: metaTitle,
        meta_description: metaDescription,
      };

      console.log("SEO meta update payload", payload);

      const response = await api.put(
        "/content-architecture/update-page-meta/",
        payload
      );

      if (response.data?.success) {
        toast.success(
          response.data?.message || "Meta information updated successfully"
        );

        await refetchPageDetails?.({ pageId, showLoading: false });
      } else {
        toast.error(response.data?.message || "Failed to update meta details");
      }
    } catch (error) {
      console.error("Error updating meta details:", error);
      toast.error(
        error?.response?.data?.error || "Failed to update meta details"
      );
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const hasMeta =
    !!metaTitle &&
    metaTitle.trim().length > 0 &&
    !!metaDescription &&
    metaDescription.trim().length > 0;
  const isMetaLocked = !hasMeta && !isMetaEditing;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Keywords Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        {/* Primary Keyword */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Keywords
          </label>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-blue-600" />
            {primaryKeywords.length === 0 ? (
              <span className="text-sm text-gray-600">
                No primary keywords added yet
              </span>
            ) : (
              primaryKeywords.map((keyword) => (
                <motion.span
                  key={keyword}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {keyword}
                  <button
                    onClick={() => removePrimaryKeyword(keyword)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newPrimaryKeyword}
              onChange={(e) => setNewPrimaryKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addPrimaryKeyword()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Add primary keyword (press Enter)"
            />
            <button
              onClick={addPrimaryKeyword}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium cursor-pointer"
            >
              Add
            </button>
          </div>
        </motion.div>

        {/* Secondary Keywords */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Keywords
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {secondaryKeywords.map((keyword) => (
              <motion.span
                key={keyword}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {keyword}
                <button
                  onClick={() => removeSecondaryKeyword(keyword)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newSecondaryKeyword}
              onChange={(e) => setNewSecondaryKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSecondaryKeyword()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Add secondary keyword (press Enter)"
            />
            <button
              onClick={addSecondaryKeyword}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium cursor-pointer"
            >
              Add
            </button>
          </div>
        </motion.div>
      </div>

      {/* Meta Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="relative">
          <div
            className={`space-y-4 ${
              isMetaLocked ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title & Description
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Meta title"
                />
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Meta description"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
              <button
                onClick={handleUpdateMeta}
                disabled={isUpdatingMeta}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingMeta ? (
                  <>
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Updating Meta...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {isMetaLocked && (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div
                onClick={() => setIsMetaEditing(true)}
                className="group bg-white/95 border border-blue-100 rounded-xl p-5 max-w-md w-full text-center shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50/80 cursor-pointer transition-all"
              >
                <p className="text-sm text-gray-700 mb-4">
                  Meta Title & Description will be created when article is
                  generated or you can write it
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 group-hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Edit now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
