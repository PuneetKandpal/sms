"use client";
import React, { useState, useEffect } from "react";
import { formatLocalDateTime } from "../../utils/dateUtils";
import { Modal, Box } from "@mui/material";
import { XIcon } from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaThumbsUp,
  FaRetweet,
  FaPlay,
} from "react-icons/fa";

// Modal Style
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95vw",
  maxWidth: "800px",
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

// Platform-specific preview components
const InstagramPreview = ({ post }) => (
  <div className="bg-white border border-gray-200 rounded-lg max-w-sm mx-auto">
    {/* Header */}
    <div className="flex items-center p-3 border-b border-gray-100">
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <FaInstagram className="text-white" size={16} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">Your Account</div>
        <div className="text-xs text-gray-500">Sponsored</div>
      </div>
      <div className="text-gray-400">⋯</div>
    </div>

    {/* Image */}
    <div className="aspect-square bg-gray-100">
      {post.image_url ? (
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <FaImage size={48} />
        </div>
      )}
    </div>

    {/* Actions */}
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center space-x-4">
        <FaHeart className="text-gray-700" size={20} />
        <FaComment className="text-gray-700" size={20} />
        <FaShare className="text-gray-700" size={20} />
      </div>
      <FaBookmark className="text-gray-700" size={20} />
    </div>

    {/* Content */}
    <div className="px-3 pb-3">
      <div className="text-sm">
        <span className="font-semibold">your_account</span> {post.post_content}
      </div>
      {post.image_text && (
        <div className="text-xs text-gray-500 mt-1">
          Alt text: {post.image_text}
        </div>
      )}
    </div>
  </div>
);

const FacebookPreview = ({ post }) => (
  <div className="bg-white border border-gray-200 rounded-lg max-w-lg mx-auto">
    {/* Header */}
    <div className="flex items-center p-4">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
        <FaFacebook className="text-white" size={20} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">Your Page</div>
        <div className="text-xs text-gray-500 flex items-center">2h • 🌍</div>
      </div>
      <div className="text-gray-400">⋯</div>
    </div>

    {/* Content */}
    <div className="px-4 pb-3">
      <div className="text-sm leading-relaxed">{post.post_content}</div>
    </div>

    {/* Image */}
    {post.image_url && (
      <div className="bg-gray-100">
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-auto object-cover"
        />
      </div>
    )}

    {/* Actions */}
    <div className="border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
          <FaThumbsUp size={16} />
          <span className="text-sm">Like</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
          <FaComment size={16} />
          <span className="text-sm">Comment</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
          <FaShare size={16} />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  </div>
);

const TwitterPreview = ({ post }) => (
  <div className="bg-white border border-gray-200 rounded-lg max-w-lg mx-auto">
    {/* Header */}
    <div className="flex items-start p-4">
      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mr-3">
        <FaTwitter className="text-white" size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-sm">Your Account</span>
          <span className="text-blue-500">✓</span>
          <span className="text-gray-500 text-sm">@youraccount</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-500 text-sm">2h</span>
        </div>
        <div className="mt-1 text-sm leading-relaxed">{post.post_content}</div>

        {/* Image */}
        {post.image_url && (
          <div className="mt-3 border border-gray-200 rounded-2xl overflow-hidden">
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 max-w-md">
          <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
            <FaComment size={16} />
            <span className="text-sm">24</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
            <FaRetweet size={16} />
            <span className="text-sm">12</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500">
            <FaHeart size={16} />
            <span className="text-sm">89</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
            <FaShare size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const LinkedInPreview = ({ post }) => (
  <div className="bg-white border border-gray-200 rounded-lg max-w-lg mx-auto">
    {/* Header */}
    <div className="flex items-center p-4">
      <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
        <FaLinkedin className="text-white" size={20} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">Your Company</div>
        <div className="text-xs text-gray-500">Company • 2h • 🌍</div>
      </div>
      <div className="text-gray-400">⋯</div>
    </div>

    {/* Content */}
    <div className="px-4 pb-3">
      <div className="text-sm leading-relaxed">{post.post_content}</div>
    </div>

    {/* Image */}
    {post.image_url && (
      <div className="bg-gray-100">
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-auto object-cover"
        />
      </div>
    )}

    {/* Actions */}
    <div className="border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
          <FaThumbsUp size={16} />
          <span className="text-sm">Like</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
          <FaComment size={16} />
          <span className="text-sm">Comment</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
          <FaShare size={16} />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  </div>
);

const YouTubePreview = ({ post }) => (
  <div className="bg-white border border-gray-200 rounded-lg max-w-lg mx-auto">
    {/* Video Thumbnail */}
    {post.image_url ? (
      <div className="relative bg-black aspect-video">
        <img
          src={post.image_url}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-600 rounded-full p-3">
            <FaPlay className="text-white ml-1" size={20} />
          </div>
        </div>
      </div>
    ) : (
      <div className="bg-gray-900 aspect-video flex items-center justify-center">
        <div className="bg-red-600 rounded-full p-4">
          <FaPlay className="text-white ml-1" size={24} />
        </div>
      </div>
    )}

    {/* Content */}
    <div className="p-4">
      <div className="flex items-start space-x-3">
        <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center">
          <FaYoutube className="text-white" size={18} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm leading-tight mb-1">
            {post.hook || "Video Title"}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            Your Channel • 1.2K views • 2 hours ago
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {post.post_content}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PostPreviewModal = ({ open, handleClose, post }) => {
  if (!post || !post.post_data) return null;

  const platform = post.post_data?.platform_name?.toLowerCase() || "unknown";

  const renderPlatformPreview = () => {
    const postData = {
      post_content: post.post_data?.post_content || "",
      hook: post.post_data?.hook || "",
      image_url: post.post_data?.image_url || "",
      image_text: post.post_data?.image_text || "",
    };

    switch (platform) {
      case "instagram":
        return <InstagramPreview post={postData} />;
      case "facebook":
        return <FacebookPreview post={postData} />;
      case "twitter":
      case "x":
        return <TwitterPreview post={postData} />;
      case "linkedin":
        return <LinkedInPreview post={postData} />;
      case "youtube":
        return <YouTubePreview post={postData} />;
      default:
        return (
          <div className="text-center py-8">
            <div className="text-gray-500">
              Preview not available for {platform || "unknown"} platform
            </div>
          </div>
        );
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
                Post Preview
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  {platform
                    ? platform.charAt(0).toUpperCase() + platform.slice(1)
                    : "Unknown"}{" "}
                  Preview
                </span>
                <span>•</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                    post.status === "review"
                      ? "bg-yellow-100 text-yellow-700"
                      : post.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : post.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : post.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {post.status
                    ? post.status.charAt(0).toUpperCase() + post.status.slice(1)
                    : "Unknown"}
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

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <div className="max-w-2xl mx-auto">
            {/* Platform Preview */}
            <div className="mb-8">{renderPlatformPreview()}</div>

            {/* Post Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Post Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {post.post_data?.post_content || "No content"}
                  </div>
                </div>

                {post.post_data?.hook && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hook
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {post.post_data.hook}
                    </div>
                  </div>
                )}

                {post.post_data?.pattern && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pattern
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {post.post_data.pattern}
                    </div>
                  </div>
                )}

                {post.post_data?.image_text && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Text
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {post.post_data.image_text}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created
                    </label>
                    <div className="text-sm text-gray-600">
                      {formatLocalDateTime(post.created_at) || "Unknown"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Updated
                    </label>
                    <div className="text-sm text-gray-600">
                      {formatLocalDateTime(post.updated_at) || "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default PostPreviewModal;
