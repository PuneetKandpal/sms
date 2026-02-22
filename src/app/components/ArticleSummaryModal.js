"use client";
import React from "react";
import { Modal, Box } from "@mui/material";
import { XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Modal Style - Notion-like clean design (reusing from ArticlesTable)
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95vw",
  maxWidth: "1000px",
  height: "95vh",
  bgcolor: "#ffffff",
  boxShadow:
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
};

const ArticleSummaryModal = ({ open, handleClose, articleSummary }) => {
  if (!articleSummary) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      }}
    >
      <Box sx={modalStyle}>
        {/* Header with floating controls */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 mb-1 leading-tight">
                Article Content
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  Extracted Content
                </span>
                <span>•</span>
                <span>
                  Length:{" "}
                  {articleSummary?.content_extraction?.page_content_length || 0}{" "}
                  characters
                </span>
                <span>•</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                    articleSummary?.content_extraction?.extraction_successful
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {articleSummary?.content_extraction?.extraction_successful
                    ? "Success"
                    : "Failed"}
                </span>
              </div>
            </div>

            {/* Close button */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content area with Notion-like styling */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="prose prose-lg prose-gray max-w-none">
              <style jsx global>{`
                .prose {
                  color: #374151;
                  line-height: 1.75;
                }
                .prose h1 {
                  color: #111827;
                  font-weight: 700;
                  font-size: 2.25rem;
                  line-height: 1.2;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .prose h2 {
                  color: #111827;
                  font-weight: 600;
                  font-size: 1.875rem;
                  line-height: 1.3;
                  margin-top: 2rem;
                  margin-bottom: 0.75rem;
                }
                .prose h3 {
                  color: #111827;
                  font-weight: 600;
                  font-size: 1.5rem;
                  line-height: 1.4;
                  margin-top: 1.5rem;
                  margin-bottom: 0.5rem;
                }
                .prose p {
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                  color: #374151;
                }
                .prose ul,
                .prose ol {
                  margin-top: 1rem;
                  margin-bottom: 1rem;
                  padding-left: 1.5rem;
                }
                .prose li {
                  margin-top: 0.5rem;
                  margin-bottom: 0.5rem;
                  color: #374151;
                }
                .prose blockquote {
                  border-left: 4px solid #e5e7eb;
                  padding-left: 1rem;
                  margin: 1.5rem 0;
                  font-style: italic;
                  color: #6b7280;
                  background-color: #f9fafb;
                  padding: 1rem;
                  border-radius: 0.5rem;
                }
                .prose code {
                  background-color: #f3f4f6;
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-size: 0.875em;
                  color: #dc2626;
                  font-weight: 500;
                }
                .prose pre {
                  background-color: #1f2937;
                  color: #f9fafb;
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                  margin: 1.5rem 0;
                }
                .prose pre code {
                  background-color: transparent;
                  color: inherit;
                  padding: 0;
                }
                .prose strong {
                  color: #111827;
                  font-weight: 600;
                }
                .prose a {
                  color: #3b82f6;
                  text-decoration: none;
                  font-weight: 500;
                }
                .prose a:hover {
                  color: #2563eb;
                  text-decoration: underline;
                }
                .prose table {
                  border-collapse: collapse;
                  margin: 1.5rem 0;
                  width: 100%;
                }
                .prose th,
                .prose td {
                  border: 1px solid #e5e7eb;
                  padding: 0.75rem;
                  text-align: left;
                }
                .prose th {
                  background-color: #f9fafb;
                  font-weight: 600;
                  color: #111827;
                }
                .prose hr {
                  border: none;
                  height: 1px;
                  background-color: #e5e7eb;
                  margin: 2rem 0;
                }
              `}</style>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {articleSummary?.content_extraction?.page_content ||
                  "No content available"}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default ArticleSummaryModal;
