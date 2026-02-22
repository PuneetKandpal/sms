"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { AutoAwesome, ContentCopy, Edit, Check } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function AIGeneratedResponse({
  opportunity,
  onFetchStrategy,
  isLoading,
  responseData,
}) {
  const [hasContent, setHasContent] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedResponse, setEditedResponse] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if we have existing engagement strategy data
  const existingEngagementStrategy = opportunity?.raw_data?.engagement_strategy;
  const existingResponse = existingEngagementStrategy?.recommended_response;

  // Set initial state based on existing data
  useEffect(() => {
    if (existingResponse) {
      setHasContent(true);
      setCurrentResponse(existingResponse);
    } else if (responseData) {
      setHasContent(true);
      setCurrentResponse(responseData);
    }
  }, [existingResponse, responseData]);

  const dummyResponse = `Hi there! It sounds like you're eager to expand your network and connect business owners with private equity firms. Building a strong Rolodex can indeed be challenging, especially when trust is crucial in these financial relationships.

Here are a few tips that might help:

• Attend Networking Events: Look for industry-specific conferences or seminars where private equity firms are likely to be present. This can be a great way to meet potential partners face-to-face.
• Leverage LinkedIn: Utilize LinkedIn to connect with professionals in the private equity space. Join relevant groups and participate in discussions to showcase your expertise and build credibility.
• Consider Partnerships: Collaborate with financial advisors or consultants who already have connections in the private equity realm.

If you'd like to share more about your specific needs, I'd be happy to help brainstorm further! Feel free to reach out or DM me.

#Networking #PrivateEquity #BusinessGrowth`;

  const handleFetchData = async () => {
    if (onFetchStrategy) {
      const result = await onFetchStrategy();
      if (result) {
        setHasContent(true);
        setCurrentResponse(result.recommended_response || dummyResponse);
      }
    }
  };

  const handleCopyResponse = async () => {
    const textToCopy = currentResponse || responseData || dummyResponse;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setCopySuccess(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleEditResponse = () => {
    setEditedResponse(currentResponse || responseData || dummyResponse);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (newContent) => {
    setCurrentResponse(newContent);
    setEditModalOpen(false);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditedResponse("");
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: "100%",
        borderRadius: 3,
        background: "linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)",
        border: "1px solid #C4B5FD",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: 3,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AutoAwesome sx={{ color: "#8B5CF6", fontSize: "1.5rem" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#6B21A8", fontSize: "1.5rem" }}
          >
            AI-Generated Response
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontSize: "1rem",
            color: "#7C3AED",
            mb: 3,
            fontStyle: "italic",
          }}
        >
          Tailored outreach crafted by AI, based on opportunity insights
        </Typography>

        {!hasContent && !existingResponse ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            {/* Blurred Dummy Content */}
            <Box
              sx={{
                p: 3,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: 2,
                border: "1px solid rgba(139, 92, 246, 0.2)",
                mb: 4,
                filter: "blur(3px)",
                userSelect: "none",
                pointerEvents: "none",
                width: "100%",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "#374151",
                  whiteSpace: "pre-line",
                }}
              >
                {dummyResponse}
              </Typography>
            </Box>

            {/* Fetch Button */}
            <Button
              variant="contained"
              onClick={handleFetchData}
              disabled={isLoading}
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <AutoAwesome />
              }
              sx={{
                backgroundColor: "#8B5CF6",
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                "&:hover": { backgroundColor: "#7C3AED" },
                "&:disabled": { backgroundColor: "#8B5CF6", color: "white" },
              }}
            >
              {isLoading ? "Generating..." : "Get Response"}
            </Button>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            {/* Actual Content */}
            <Box
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                p: 3,
                borderRadius: 2,
                border: "1px solid rgba(139, 92, 246, 0.2)",
                mb: 3,
                flexGrow: 1,
              }}
            >
              <ReactMarkdown
                children={currentResponse || existingResponse || dummyResponse}
                components={{
                  p: ({ node, ...props }) => (
                    <Box
                      component="p"
                      sx={{
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        color: "#374151",
                        mb: 1,
                      }}
                      {...props}
                    />
                  ),
                  h1: ({ node, ...props }) => (
                    <Box
                      component="h1"
                      sx={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        mt: 2,
                        mb: 1,
                      }}
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <Box
                      component="h2"
                      sx={{
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        mt: 2,
                        mb: 1,
                      }}
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <Box component="li" sx={{ ml: 4, mb: 0.5 }} {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <Box
                      component="a"
                      sx={{ color: "#8B5CF6", textDecoration: "underline" }}
                      {...props}
                    />
                  ),
                }}
              />
            </Box>

            {/* Action Buttons */}
            <Box
              display="flex"
              gap={2}
              justifyContent="flex-end"
              flexWrap="wrap"
            >
              <Button
                variant="contained"
                size="medium"
                onClick={handleCopyResponse}
                startIcon={copied ? <Check /> : <ContentCopy />}
                sx={{
                  backgroundColor: copied ? "#10B981" : "#3B82F6",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: copied ? "#059669" : "#2563EB",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  },
                }}
              >
                {copied ? "Copied!" : "Copy Response"}
              </Button>
              <Button
                variant="outlined"
                size="medium"
                onClick={handleEditResponse}
                startIcon={<Edit />}
                sx={{
                  backgroundColor: "#6B7280",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 500,
                  borderColor: "#6B7280",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "#4B5563",
                    borderColor: "#4B5563",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  },
                }}
              >
                Edit Response
              </Button>
            </Box>
          </Box>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editModalOpen && (
            <EditMarkdownModal
              open={editModalOpen}
              initialContent={editedResponse}
              onClose={handleCloseEdit}
              onSave={handleSaveEdit}
            />
          )}
        </AnimatePresence>

        {/* Copy Success Snackbar */}
        <Snackbar
          open={copySuccess}
          autoHideDuration={2000}
          onClose={() => setCopySuccess(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setCopySuccess(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Response copied to clipboard!
          </Alert>
        </Snackbar>
      </CardContent>
    </Paper>
  );
}

// -----------------------
// Edit Modal Component
// -----------------------
function EditMarkdownModal({ open, onClose, initialContent, onSave }) {
  const [editedContent, setEditedContent] = useState(initialContent || "");

  useEffect(() => {
    setEditedContent(initialContent || "");
  }, [initialContent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-lg w-full max-w-5xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-purple-100 text-purple-700 px-6 py-4 font-semibold text-lg">
          Edit AI-Generated Response
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-4 p-6">
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-sm md:text-base font-semibold">
              Edit Content
            </span>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={12}
              className="flex-1 border border-gray-300 rounded-lg p-4 text-sm md:text-base resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Edit content in Markdown..."
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-sm md:text-base font-semibold">
              Preview Content
            </span>
            <div className="flex-1 flex-col gap-2 border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-auto max-h-[400px]">
              <ReactMarkdown
                children={editedContent}
                components={{
                  p: ({ node, ...props }) => (
                    <p
                      className="text-gray-800 text-sm md:text-base mb-1"
                      {...props}
                    />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-lg md:text-xl font-bold mt-2 mb-1"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-md md:text-lg font-semibold mt-2 mb-1"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="ml-4 mb-1" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-purple-600 underline" {...props} />
                  ),
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedContent)}
            className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
