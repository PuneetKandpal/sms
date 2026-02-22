"use client";
import React, { useState } from "react";
import { formatUTCDate } from "../../utils/dateUtils";
import { Modal, Box, IconButton } from "@mui/material";
import { XIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { FaImage } from "react-icons/fa";

// Modal Style
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95vw",
  maxWidth: "1200px",
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

const ImageViewerModal = ({
  open,
  handleClose,
  imageUrl,
  imageText,
  postData,
}) => {
  if (!open) return null;

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `post-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 mb-1 leading-tight">
                Image Viewer
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  Post Image
                </span>
                {imageText && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-md">{imageText}</span>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-4">
              {imageUrl && (
                <>
                  <IconButton
                    onClick={handleDownload}
                    size="small"
                    sx={{
                      color: "#6B7280",
                      "&:hover": { backgroundColor: "#F3F4F6" },
                    }}
                    title="Download image"
                  >
                    <DownloadIcon size={20} />
                  </IconButton>
                  <IconButton
                    onClick={handleOpenInNewTab}
                    size="small"
                    sx={{
                      color: "#6B7280",
                      "&:hover": { backgroundColor: "#F3F4F6" },
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLinkIcon size={20} />
                  </IconButton>
                </>
              )}
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{
                  color: "#6B7280",
                  "&:hover": { backgroundColor: "#F3F4F6" },
                }}
                title="Close"
              >
                <XIcon size={20} />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex items-center justify-center p-8">
          {imageUrl ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt={imageText || "Post image"}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{ maxHeight: "calc(95vh - 200px)" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              {/* Error fallback */}
              <div
                className="hidden flex-col items-center justify-center text-gray-400 bg-gray-100 rounded-lg p-12 border-2 border-dashed border-gray-300"
                style={{ minHeight: "300px", minWidth: "400px" }}
              >
                <FaImage size={64} className="mb-4" />
                <p className="text-lg font-medium mb-2">Failed to load image</p>
                <p className="text-sm text-center">
                  The image could not be loaded. It may have been moved or
                  deleted.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-100 rounded-lg p-12 border-2 border-dashed border-gray-300">
              <FaImage size={64} className="mb-4" />
              <p className="text-lg font-medium mb-2">No image available</p>
              <p className="text-sm text-center">
                This post doesn't have an associated image.
              </p>
            </div>
          )}
        </div>

        {/* Footer with image details */}
        {(imageText || postData) && (
          <div className="border-t border-gray-200 bg-white px-8 py-4">
            <div className="max-w-4xl mx-auto">
              {imageText && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Description
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {imageText}
                  </div>
                </div>
              )}

              {postData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {postData.platform_name && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        Platform
                      </label>
                      <div className="text-gray-600 capitalize">
                        {postData.platform_name}
                      </div>
                    </div>
                  )}

                  {postData.created_at && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        Created
                      </label>
                      <div className="text-gray-600">
                        {formatLocalDate(postData.created_at)}
                      </div>
                    </div>
                  )}

                  {postData.image_mime && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        Format
                      </label>
                      <div className="text-gray-600 uppercase">
                        {postData.image_mime.split("/")[1] ||
                          postData.image_mime}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Box>
    </Modal>
  );
};

export default ImageViewerModal;
