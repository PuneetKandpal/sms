"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaUpload, FaFile } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/axios";

function ModalBackdrop({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export function AddInternalModal({
  isOpen,
  onClose,
  projectId,
  onAdd,
}) {
  const [activeTab, setActiveTab] = useState("file");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [step, setStep] = useState(1);
  const [previewData, setPreviewData] = useState(null);
  const [contentTypes, setContentTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [contentType, setContentType] = useState("");
  const [contentTypeDescription, setContentTypeDescription] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        const response = await api.get("/internal-sources/content-types/");
        setContentTypes(response.data.content_types || []);
      } catch (error) {
        console.error("Error fetching content types:", error);
      }
    };
    
    if (isOpen) {
      fetchContentTypes();
    }
  }, [isOpen]);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleBack = () => {
    setStep(1);
    setPreviewData(null);
    setTags([]);
    setContentType("");
    setContentTypeDescription("");
    setDisplayName("");
  };

  const handleConfirm = async () => {
    if (!previewData?.preview_id) {
      toast.error("Missing preview id. Please re-upload and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/internal-sources/internal-data/confirm/", {
        preview_id: previewData.preview_id,
        file_name: displayName || previewData?.file_name,
        tags: tags,
        content_type: contentType,
        content_type_description: contentTypeDescription,
      });

      toast.success(response.data.message || "Internal source added successfully");
      
      if (onAdd) {
        await onAdd();
      }
      
      onClose();
      handleBack();
    } catch (error) {
      console.error("Error confirming internal source:", error);
      let errorMessage = "Failed to save internal source";
      
      const responseData = error && error.response ? error.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage = responseData.message || responseData.error || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/plain" && !file.name.endsWith(".txt") && file.type !== "application/pdf") {
        toast.error("Please upload a .txt or .pdf file");
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      toast.error("Please enter some text content");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is missing");
      return;
    }

    //test
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("context", textContent);
      formData.append("file_name", fileName || "Text Content");

      const response = await api.post("/internal-sources/internal-data/preview/", formData);
      const data = response.data;

      if (!data?.preview_id) {
        toast.error(data?.message || "Failed to preview internal source");
        setDisplayName(data?.file_name || fileName || "Text Content");
        return;
      }

      setPreviewData(data);
      setDisplayName(data.file_name || fileName || "Text Content");
      setTags(data.tags || []);
      setContentType(data.content_type || "");
      setContentTypeDescription(data.content_type_description || "");
      setStep(2);
      setTextContent("");
      setFileName("");
    } catch (error) {
      console.error("Error previewing internal source:", error);
      let errorMessage = "Failed to preview internal source";

      const responseData = error && error.response ? error.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage =
            responseData.message ||
            responseData.error ||
            errorMessage;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("file_name", selectedFile.name);
      formData.append("file", selectedFile);

      const response = await api.post("/internal-sources/internal-data/preview/", formData);
      const data = response.data;

      if (!data?.preview_id) {
        toast.error(data?.message || "Failed to preview internal source");
        setDisplayName(data?.file_name || selectedFile.name);
        return;
      }

      setPreviewData(data);
      setDisplayName(data.file_name || selectedFile.name);
      setTags(data.tags || []);
      setContentType(data.content_type || "");
      setContentTypeDescription(data.content_type_description || "");
      setStep(2);
      setSelectedFile(null);
      setFileName("");
    } catch (error) {
      console.error("Error previewing internal source:", error);
      let errorMessage = "Failed to preview internal source";

      const responseData = error && error.response ? error.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage =
            responseData.message ||
            responseData.error ||
            errorMessage;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "text") {
      handleTextSubmit();
    } else {
      handleFileSubmit();
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 ? "Add Internal Source" : "Review & Confirm Internal Source"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {isSubmitting && step === 1 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Processing file...</p>
          </div>
        ) : step === 1 ? (
          <>
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("text")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "text"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaFile className="inline mr-2" />
                Paste Text
              </button>
              <button
                onClick={() => setActiveTab("file")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "file"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaUpload className="inline mr-2" />
                Upload File
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === "text" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Enter file name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                    />
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Content
                    </label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your text content here..."
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Add any text content to feed into the knowledge base
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Text File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        accept=".txt,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <FaUpload className="text-gray-400 text-4xl mb-3" />
                        <span className="text-sm font-medium text-gray-700">
                          {selectedFile ? selectedFile.name : "Click to upload a .txt or .pdf file"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Only .txt and .pdf files are supported
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Processing..." : "Next"}
                </button>
              </div>
            </form>
          </>
        ) : (
          // Step 2: Review and confirm
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Column - File Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">File Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        You can edit this name before saving.
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">File Type:</span>
                      <p className="text-sm text-gray-900 capitalize">{previewData?.file_type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Source:</span>
                      <p className="text-sm text-gray-900 capitalize">{previewData?.source_from?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Content Length:</span>
                      <p className="text-sm text-gray-900">{previewData?.content_length} characters</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Metadata */}
              <div className="flex flex-col gap-4 min-h-[260px]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => {
                      setContentType(e.target.value);
                      const selected = contentTypes.find(ct => ct.slug === e.target.value);
                      setContentTypeDescription(selected?.description || "");
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select content type</option>
                    {contentTypes.map((ct) => (
                      <option key={ct.slug} value={ct.slug}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col flex-1 min-h-[220px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type Description
                  </label>
                  <textarea
                    value={contentTypeDescription}
                    onChange={(e) => setContentTypeDescription(e.target.value)}
                    className="w-full flex-1 px-3 py-2.5 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Describe the content type..."
                  />
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-colors"
                >
                  Add Tag
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || !contentType}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
}

export function RenameModal({ isOpen, onClose, currentName, onRename }) {
  const [newName, setNewName] = useState(currentName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(newName);
      onClose();
    } catch (error) {
      console.error("Rename error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Rename Internal Source</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new name"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Renaming..." : "Rename"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function DeleteConfirmModal({ isOpen, onClose, sourceName, onConfirm, isDeleting }) {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Delete Internal Source</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{sourceName}</strong>? This action
          cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export function InternalSourcePreviewModal({ 
  isOpen, 
  onClose, 
  previewData, 
  onConfirm,
  projectId 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(previewData?.tags || []);
  const [contentType, setContentType] = useState(previewData?.content_type || "");
  const [contentTypeDescription, setContentTypeDescription] = useState(previewData?.content_type_description || "");
  const [contentTypes, setContentTypes] = useState([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        const response = await api.get("/internal-sources/content-types/");
        setContentTypes(response.data.content_types || []);
      } catch (error) {
        console.error("Error fetching content types:", error);
      }
    };
    
    if (isOpen) {
      fetchContentTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    setTags(previewData?.tags || []);
    setContentType(previewData?.content_type || "");
    setContentTypeDescription(previewData?.content_type_description || "");
  }, [previewData]);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post("/internal-sources/internal-data/confirm/", {
        preview_id: previewData.preview_id,
        tags: tags,
        content_type: contentType,
        content_type_description: contentTypeDescription,
      });

      toast.success(response.data.message || "Internal source added successfully");
      
      if (onConfirm) {
        await onConfirm();
      }
      
      onClose();
    } catch (error) {
      console.error("Error confirming internal source:", error);
      let errorMessage = "Failed to save internal source";
      
      const responseData = error && error.response ? error.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage = responseData.message || responseData.error || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Review & Confirm Internal Source
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - File Info */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">File Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">File Name:</span>
                  <p className="text-sm text-gray-900">{previewData?.file_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">File Type:</span>
                  <p className="text-sm text-gray-900 capitalize">{previewData?.file_type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Source:</span>
                  <p className="text-sm text-gray-900 capitalize">{previewData?.source_from?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Content Length:</span>
                  <p className="text-sm text-gray-900">{previewData?.content_length} characters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  const selected = contentTypes.find(ct => ct.slug === e.target.value);
                  setContentTypeDescription(selected?.description || "");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select content type</option>
                {contentTypes.map((ct) => (
                  <option key={ct.slug} value={ct.slug}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type Description
              </label>
              <textarea
                value={contentTypeDescription}
                onChange={(e) => setContentTypeDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the content type..."
              />
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Tag
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !contentType}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
