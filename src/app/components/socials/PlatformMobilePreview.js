// Platform-specific mobile preview component for post visualization

import React from "react";
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
  FaImage,
  FaReddit,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

// Instagram Preview Component
const InstagramPreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-sm mx-auto ${
      darkMode
        ? "bg-black text-white border-gray-800"
        : "bg-white text-black border-gray-200"
    }`}
  >
    {/* Header */}
    <div
      className={`flex items-center p-3 ${
        darkMode ? "border-gray-800" : "border-gray-100"
      } border-b`}
    >
      <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-pink-500 rounded-full flex items-center justify-center">
        <FaInstagram className="text-white" size={16} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">@brand_handle</div>
        <div
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Sponsored
        </div>
      </div>
      <div className={darkMode ? "text-gray-500" : "text-gray-400"}>⋯</div>
    </div>

    {/* Image */}
    {post.image_url ? (
      <div className="aspect-square">
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <div
        className={`aspect-square flex items-center justify-center ${
          darkMode ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <FaImage
          className={darkMode ? "text-gray-700" : "text-gray-400"}
          size={48}
        />
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center space-x-4">
        <FaHeart
          className={darkMode ? "text-white" : "text-gray-700"}
          size={20}
        />
        <FaComment
          className={darkMode ? "text-white" : "text-gray-700"}
          size={20}
        />
        <FaShare
          className={darkMode ? "text-white" : "text-gray-700"}
          size={20}
        />
      </div>
      <FaBookmark
        className={darkMode ? "text-white" : "text-gray-700"}
        size={20}
      />
    </div>

    {/* Content */}
    <div className="px-3 pb-3">
      <div className="text-sm">
        <span className="font-semibold">brand_handle</span>{" "}
        {post.post_content || "Your post content will appear here..."}
      </div>
      {post.image_text && (
        <div
          className={`text-xs mt-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Alt text: {post.image_text}
        </div>
      )}
    </div>
  </div>
);

// Facebook Preview Component
const FacebookPreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-lg mx-auto ${
      darkMode
        ? "bg-gray-900 text-white border-gray-800"
        : "bg-white text-black border-gray-200"
    }`}
  >
    {/* Header */}
    <div className="flex items-center p-4">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
        <FaFacebook className="text-white" size={20} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">Your Page</div>
        <div
          className={`text-xs flex items-center ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          2h • 🌍
        </div>
      </div>
      <div className={darkMode ? "text-gray-500" : "text-gray-400"}>⋯</div>
    </div>

    {/* Content */}
    <div className="px-4 pb-3">
      <div className="text-sm leading-relaxed">
        {post.post_content || "Your post content will appear here..."}
      </div>
    </div>

    {/* Image */}
    {post.image_url ? (
      <div>
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-auto object-cover"
        />
      </div>
    ) : (
      <div
        className={`h-48 flex items-center justify-center ${
          darkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <FaImage
          className={darkMode ? "text-gray-700" : "text-gray-400"}
          size={48}
        />
      </div>
    )}

    {/* Actions */}
    <div
      className={`${darkMode ? "border-gray-800" : "border-gray-200"} border-t`}
    >
      <div className="flex items-center justify-around py-2">
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded ${
            darkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaThumbsUp size={16} />
          <span className="text-sm">Like</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded ${
            darkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaComment size={16} />
          <span className="text-sm">Comment</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded ${
            darkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaShare size={16} />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  </div>
);

// Twitter/X Preview Component
const TwitterPreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-lg mx-auto ${
      darkMode
        ? "bg-black text-white border-gray-800"
        : "bg-white text-black border-gray-200"
    }`}
  >
    {/* Header */}
    <div className="flex items-start p-4">
      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mr-3">
        <FaTwitter className="text-white" size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-sm">Your Account</span>
          <span className="text-blue-500">✓</span>
          <span
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            @youraccount
          </span>
          <span className={darkMode ? "text-gray-600" : "text-gray-500"}>
            ·
          </span>
          <span
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            2h
          </span>
        </div>
        <div className="mt-1 text-sm leading-relaxed">
          {post.post_content || "Your post content will appear here..."}
        </div>

        {/* Image */}
        {post.image_url ? (
          <div
            className={`mt-3 border rounded-2xl overflow-hidden ${
              darkMode ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover"
            />
          </div>
        ) : (
          <div
            className={`mt-3 border rounded-2xl overflow-hidden h-48 flex items-center justify-center ${
              darkMode
                ? "border-gray-800 bg-gray-900"
                : "border-gray-200 bg-gray-100"
            }`}
          >
            <FaImage
              className={darkMode ? "text-gray-700" : "text-gray-400"}
              size={48}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 max-w-md">
          <button
            className={`flex items-center space-x-2 ${
              darkMode
                ? "text-gray-400 hover:text-blue-400"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            <FaComment size={16} />
            <span className="text-sm">24</span>
          </button>
          <button
            className={`flex items-center space-x-2 ${
              darkMode
                ? "text-gray-400 hover:text-green-400"
                : "text-gray-500 hover:text-green-500"
            }`}
          >
            <FaRetweet size={16} />
            <span className="text-sm">12</span>
          </button>
          <button
            className={`flex items-center space-x-2 ${
              darkMode
                ? "text-gray-400 hover:text-red-400"
                : "text-gray-500 hover:text-red-500"
            }`}
          >
            <FaHeart size={16} />
            <span className="text-sm">89</span>
          </button>
          <button
            className={`flex items-center space-x-2 ${
              darkMode
                ? "text-gray-400 hover:text-blue-400"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            <FaShare size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// LinkedIn Preview Component
const LinkedInPreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-lg mx-auto ${
      darkMode
        ? "bg-gray-900 text-white border-gray-800"
        : "bg-white text-black border-gray-200"
    }`}
  >
    {/* Header */}
    <div className="flex items-center p-4">
      <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
        <FaLinkedin className="text-white" size={20} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">Your Company</div>
        <div
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Company • 2h • 🌍
        </div>
      </div>
      <div className={darkMode ? "text-gray-500" : "text-gray-400"}>⋯</div>
    </div>

    {/* Content */}
    <div className="px-4 pb-3">
      <div className="text-sm leading-relaxed">
        {post.post_content || "Your post content will appear here..."}
      </div>
    </div>

    {/* Image */}
    {post.image_url ? (
      <div>
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-auto object-cover"
        />
      </div>
    ) : (
      <div
        className={`h-48 flex items-center justify-center ${
          darkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <FaImage
          className={darkMode ? "text-gray-700" : "text-gray-400"}
          size={48}
        />
      </div>
    )}

    {/* Actions */}
    <div
      className={`${darkMode ? "border-gray-800" : "border-gray-200"} border-t`}
    >
      <div className="flex items-center justify-around py-2">
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded ${
            darkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaThumbsUp size={16} />
          <span className="text-sm">Like</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded ${
            darkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaComment size={16} />
          <span className="text-sm">Comment</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded ${
            darkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaShare size={16} />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  </div>
);

// YouTube Preview Component
const YouTubePreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-lg mx-auto ${
      darkMode
        ? "bg-gray-900 text-white border-gray-800"
        : "bg-white text-black border-gray-200"
    }`}
  >
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
          <div
            className={`text-xs mb-2 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Your Channel • 1.2K views • 2 hours ago
          </div>
          <div
            className={`text-sm leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {post.post_content || "Your post content will appear here..."}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// TikTok Preview Component
const TikTokPreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-sm mx-auto ${
      darkMode
        ? "bg-black text-white border-gray-800"
        : "bg-white text-black border-gray-200"
    }`}
  >
    {/* Video Container */}
    {post.image_url ? (
      <div className="relative bg-black aspect-[9/16]">
        <img
          src={post.image_url}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <FaPlay className="text-white ml-1" size={24} />
          </div>
        </div>
        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="font-semibold text-white text-sm mb-1">
            @youraccount
          </div>
          <div className="text-white text-xs leading-relaxed">
            {post.post_content || "Your post content will appear here..."}
          </div>
        </div>
      </div>
    ) : (
      <div className="bg-gray-900 aspect-[9/16] flex items-center justify-center">
        <div className="bg-white bg-opacity-20 rounded-full p-4">
          <FaPlay className="text-white ml-1" size={32} />
        </div>
      </div>
    )}
  </div>
);

// Reddit Preview Component
const RedditPreview = ({ post, darkMode }) => (
  <div
    className={`border rounded-lg max-w-sm mx-auto ${
      darkMode
        ? "bg-gray-900 text-white border-gray-700"
        : "bg-white text-black border-gray-200"
    }`}
  >
    {/* Header */}
    <div
      className={`flex items-center p-3 ${
        darkMode ? "border-gray-700" : "border-gray-100"
      } border-b`}
    >
      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
        <FaReddit className="text-white" size={16} />
      </div>
      <div className="ml-3 flex-1">
        <div className="font-semibold text-sm">r/subreddit</div>
        <div
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Posted by u/username • 2h ago
        </div>
      </div>
    </div>

    {/* Post Content */}
    <div className="p-3">
      <div className="font-semibold text-sm mb-2">
        {post.hook || "Post Title"}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img
            src={post.image_url}
            alt="Reddit post"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div
        className={`text-sm leading-relaxed ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {post.post_content || "Your post content will appear here..."}
      </div>
    </div>

    {/* Engagement Bar */}
    <div
      className={`flex items-center justify-between px-3 py-2 ${
        darkMode ? "border-gray-700" : "border-gray-100"
      } border-t`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <FaArrowUp
            className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
            size={16}
          />
          <span
            className={`text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            42
          </span>
          <FaArrowDown
            className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
            size={16}
          />
        </div>
        <div className="flex items-center space-x-1">
          <FaComment
            className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
            size={14}
          />
          <span
            className={`text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            12
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <FaShare
            className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
            size={14}
          />
          <span
            className={`text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Share
          </span>
        </div>
      </div>
      <FaBookmark
        className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
        size={14}
      />
    </div>
  </div>
);

/**
 * PlatformMobilePreview Component - Shows platform-specific post previews
 * @param {Object} props - Component props
 * @param {string} props.platform - Platform name (instagram, facebook, twitter, linkedin, youtube, tiktok)
 * @param {Object} props.postData - Post content data
 * @param {boolean} props.darkMode - Dark mode toggle
 */
const PlatformMobilePreview = ({ platform, postData, darkMode = false }) => {
  const normalizedPlatform = platform?.toLowerCase();

  const renderPlatformPreview = () => {
    const post = {
      post_content: postData?.text || postData?.post_content || "",
      hook: postData?.hook || "",
      image_url: postData?.image_url || postData?.imageUrl || "",
      image_text: postData?.image_text || postData?.imageText || "",
    };

    switch (normalizedPlatform) {
      case "instagram":
        return <InstagramPreview post={post} darkMode={darkMode} />;
      case "facebook":
        return <FacebookPreview post={post} darkMode={darkMode} />;
      case "twitter":
      case "x":
        return <TwitterPreview post={post} darkMode={darkMode} />;
      case "linkedin":
        return <LinkedInPreview post={post} darkMode={darkMode} />;
      case "youtube":
        return <YouTubePreview post={post} darkMode={darkMode} />;
      case "tiktok":
        return <TikTokPreview post={post} darkMode={darkMode} />;
      case "reddit":
        return <RedditPreview post={post} darkMode={darkMode} />;
      default:
        return (
          <div
            className={`text-center py-8 px-4 rounded-lg ${
              darkMode
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            <div className="text-sm">
              Preview not available for {platform || "this"} platform
            </div>
            <div className="text-xs mt-2">
              Supported platforms: Instagram, Facebook, Twitter, LinkedIn,
              YouTube, TikTok, Reddit
            </div>
          </div>
        );
    }
  };

  return <div className="w-full">{renderPlatformPreview()}</div>;
};

export default PlatformMobilePreview;
