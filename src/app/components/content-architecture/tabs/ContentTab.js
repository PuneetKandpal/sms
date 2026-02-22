"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Copy, Eye, FileText, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../../../api/axios";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";

export default function ContentTab({ selectedNode, projectId }) {
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();

  const [articleData, setArticleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const articleHtmlRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const loadArticle = async () => {
      if (!selectedNode?.id || !projectId) {
        setArticleData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/content-architecture/get-article/?project_id=${projectId}&page_id=${selectedNode.id}`
        );

        if (!isActive) return;

        const data = response.data;
        const combinedMessage = data?.message || data?.error || "";

        if (data?.success && data?.article) {
          setArticleData(data.article);
          setError(null);
        } else if (data?.success && !data?.article) {
          // No article exists yet for this page - not an error
          setArticleData(null);
          setError(null);
        } else if (
          typeof combinedMessage === "string" &&
          combinedMessage.toLowerCase().includes("no article found")
        ) {
          // Backend explicitly says no article found - treat as empty state
          setArticleData(null);
          setError(null);
        } else {
          setArticleData(null);
          console.log("response.data------", data);
          setError(combinedMessage || "Unable to load article.");
        }
      } catch (fetchError) {
        if (!isActive) return;
        console.error("Error fetching article content:", fetchError);
        setArticleData(null);

        const errorMsg = fetchError?.response?.data?.error || "";

        // Backend returns this error when there simply isn't an article yet.
        // Treat it as a normal empty state instead of an error.
        if (
          typeof errorMsg === "string" &&
          errorMsg.toLowerCase().includes("no article found")
        ) {
          setError(null);
        } else {
          setError(errorMsg || "Failed to load article. Please try again.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadArticle();

    return () => {
      isActive = false;
    };
  }, [projectId, selectedNode?.id]);

  useEffect(() => {
    if (!copiedFormat) return;

    const timeout = setTimeout(() => setCopiedFormat(null), 2000);
    return () => clearTimeout(timeout);
  }, [copiedFormat]);

  const hasArticleContent = Boolean(articleData?.generated_content);

  const handleGenerateArticle = async () => {
    if (!projectId || !selectedNode?.id) return;

    const wordCount = articleData?.word_count || 2500;

    setIsGenerating(true);
    try {
      const payload = {
        word_count: wordCount,
        project_id: projectId,
        page_id: selectedNode.id,
      };

      const response = await api.post(
        "/content-architecture/generate-article/",
        payload
      );

      if (response.data?.success) {
        toast.success(
          response.data?.message || "Article generation started successfully"
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
        toast.error(
          response.data?.message ||
            "Failed to generate article. Please try again."
        );
      }
    } catch (error) {
      console.error("Error generating article:", error);
      toast.error(
        error?.response?.data?.error ||
          "Failed to generate article. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!hasArticleContent) return;

    try {
      await navigator.clipboard.writeText(articleData.generated_content);
      setCopiedFormat("markdown");
    } catch (copyError) {
      console.error("Failed to copy markdown:", copyError);
    }
  };

  const handleCopyHtml = async () => {
    if (!hasArticleContent || !articleHtmlRef.current) return;

    const htmlContent = articleHtmlRef.current.innerHTML;

    try {
      if (window.ClipboardItem) {
        const blobHtml = new Blob([htmlContent], { type: "text/html" });
        const blobText = new Blob([articleData.generated_content], {
          type: "text/plain",
        });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(htmlContent);
      }
      setCopiedFormat("html");
    } catch (copyError) {
      console.error("Failed to copy HTML:", copyError);
    }
  };

  const renderProcessingState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto text-center py-16"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1 mb-6 rounded-full bg-sky-100 text-sky-700 text-sm font-semibold">
        <Sparkles className="h-4 w-4" />
        Generating Article
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
        Crafting your article for {selectedNode?.name ?? "this page"}
      </h3>
      <p className="text-gray-600 max-w-xl mx-auto">
        We’re pulling together the latest blueprint guidance and navigation
        data. This usually takes a few moments—feel free to explore other tabs
        while we finish up.
      </p>
      <div className="mt-10 flex justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin"></div>
      </div>
    </motion.div>
  );

  const renderArticleContent = () => {
    if (!hasArticleContent) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center py-16"
        >
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No article content yet
          </h3>
          <p className="text-gray-500">
            Use the Generate Article action in the Overview tab to create an
            article for this page.
          </p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 max-w-5xl mx-auto"
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {articleData?.word_count && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              {articleData.word_count} words
            </span>
          )}
          {articleData?.status && articleData.status !== "completed" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              Status: {articleData.status}
            </span>
          )}
        </div>
        <div
          ref={articleHtmlRef}
          className="notion-prose bg-white shadow-sm border border-gray-100 rounded-2xl p-4 md:p-6 lg:p-8 transition-colors overflow-x-hidden"
          style={{
            maxWidth: '100%',
          }}
        >
          <style jsx>{`
            .notion-prose table {
              display: block;
              overflow-x: auto;
              white-space: nowrap;
              max-width: 100%;
            }
            .notion-prose pre {
              overflow-x: auto;
              max-width: 100%;
            }
            .notion-prose code {
              word-wrap: break-word;
              white-space: pre-wrap;
            }
            .notion-prose a,
            .notion-prose p,
            .notion-prose li,
            .notion-prose blockquote {
              overflow-wrap: anywhere;
              word-break: break-word;
            }
            .notion-prose * {
              max-width: 100%;
            }
            .notion-prose img {
              max-width: 100%;
              height: auto;
            }
            .notion-prose h1,
            .notion-prose h2,
            .notion-prose h3,
            .notion-prose h4,
            .notion-prose h5,
            .notion-prose h6 {
              word-wrap: break-word;
            }
          `}</style>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {articleData.generated_content}
          </ReactMarkdown>
        </div>
      </motion.div>
    );
  };

  const renderErrorState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto text-center py-16"
    >
      <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Unable to load article
      </h3>
      <p className="text-gray-500">{error}</p>
    </motion.div>
  );

  const renderNoArticleState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto text-center py-16"
    >
      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No article generated yet
      </h3>
      <p className="text-gray-500 max-w-xl mx-auto">
        Use the Generate Article button in the Overview tab to request an
        article for this page, then return here to view the content.
      </p>
    </motion.div>
  );

  const renderNoPageSelectedState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto text-center py-16"
    >
      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Content Available
      </h3>
      <p className="text-gray-500">
        Select a page from the tree to view or generate its article content.
      </p>
    </motion.div>
  );

  // const handleDelete = () => {
  //   setShowDeleteModal(true);
  // };

  const confirmDelete = () => {
    // Handle delete logic here
    setShowDeleteModal(false);
    // Add your delete API call here
  };
  return (
    <div className="flex flex-col h-full">
      {/* Content Editor */}
      <div className="flex-1 overflow-y-auto bg-white p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          renderErrorState()
        ) : articleData?.status === "processing" ? (
          renderProcessingState()
        ) : articleData ? (
          renderArticleContent()
        ) : selectedNode?.id ? (
          renderNoArticleState()
        ) : (
          renderNoPageSelectedState()
        )}
      </div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-gray-200 bg-gray-50 p-4"
      >
        <div className="w-full ml-4 mx-auto flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleCopyMarkdown}
              disabled={!hasArticleContent}
              className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium ${
                hasArticleContent
                  ? "hover:bg-gray-50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Copy className="h-4 w-4" />
              {copiedFormat === "markdown" ? "Copied" : "Copy Markdown"}
            </button>
            <button
              onClick={handleGenerateArticle}
              disabled={
                isGenerating || !selectedNode?.id || !projectId || loading
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Article
                </>
              )}
            </button>
            {/* <button
              onClick={handleCopyHtml}
              disabled={!hasArticleContent}
              className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium ${
                hasArticleContent
                  ? "hover:bg-gray-50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Copy className="h-4 w-4" />
              {copiedFormat === "html" ? "Copied" : "Copy HTML"}
            </button> */}
            {/* <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
            >
              <AlertTriangle className="h-4 w-4" />
              Delete Article
            </button> */}
          </div>
        </div>
      </motion.div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
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
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Delete Article
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete this article?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-1">
                    This action cannot be undone
                  </h4>
                  <p className="text-sm text-red-700">
                    The article content will be permanently deleted and cannot
                    be recovered.
                  </p>
                </div>

                {selectedNode && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">
                      Article to delete:
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedNode.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Delete Article
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
