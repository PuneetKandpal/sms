"use client";

import React, { useState, useEffect } from "react";
import { formatLocalDate } from "../../../../../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRightIcon,
  MessageSquare,
  TrendingUp,
  ArrowBigUp,
  ArrowBigDown,
  BarChart3,
  Zap,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import api from "../../../../../../api/axios";

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    // Timestamp is in seconds, convert to milliseconds
    const date = new Date(timestamp * 1000);
    return formatLocalDate(date);
  } catch (e) {
    return "N/A";
  }
};

// Recursive Comment Component
const CommentItem = ({ comment, depth = 0, index = 0 }) => {
  const [showReplies, setShowReplies] = useState(false); // Changed to false by default
  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 5; // Limit visual nesting depth

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`${
        depth > 0 ? "ml-2 sm:ml-4 border-l-2 border-blue-200 pl-2 sm:pl-4" : ""
      }`}
      style={{ marginLeft: Math.min(depth, maxDepth) * 8 }}
    >
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-2 sm:p-4 flex gap-2 sm:gap-4 shadow-sm mb-3">
        {/* Score Column */}
        <div className="flex flex-col items-center text-slate-400 select-none min-w-[40px] sm:min-w-[48px]">
          <ArrowBigUp className="w-3 h-3 sm:w-4 sm:h-4 hover:text-emerald-600 cursor-pointer" />
          <span className="text-slate-700 font-semibold text-xs sm:text-sm">
            {comment.score || 0}
          </span>
          <ArrowBigDown className="w-3 h-3 sm:w-4 sm:h-4 hover:text-rose-600 cursor-pointer" />
        </div>

        {/* Comment Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm mb-1 gap-1 sm:gap-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                {comment.author || "Unknown"}
              </span>
              {hasReplies && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-700 text-xs whitespace-nowrap"
                >
                  {showReplies ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  Show {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>
            <span className="text-slate-500 text-xs sm:text-sm truncate">
              {formatDate(comment.created_utc)}
            </span>
          </div>
          <p className="text-slate-700 text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">
            {comment.body || "No content available"}
          </p>
          {/* <div className="flex gap-3 sm:gap-6 text-xs text-slate-500 mt-2">
            <span className="hover:text-blue-600 cursor-pointer">Reply</span>
            <span className="hover:text-blue-600 cursor-pointer">Share</span>
            <span className="hover:text-blue-600 cursor-pointer">Report</span>
          </div> */}
        </div>
      </div>

      {/* Recursive Replies */}
      <AnimatePresence>
        {showReplies && hasReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {comment.replies.map((reply, replyIndex) => (
              <CommentItem
                key={reply.id || `${comment.id}-${replyIndex}`}
                comment={reply}
                depth={depth + 1}
                index={replyIndex}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function PostContent({ opportunity, postId }) {
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [totalComments, setTotalComments] = useState(0);

  console.log("opportunity-------", opportunity);

  const postInfo = opportunity?.post_info || {};
  const metrics = opportunity?.reddit_data?.opportunity_metrics || {};

  // Extract project_id and post_id for the API call
  const projectId = opportunity?.relationships?.project_id;

  // Fetch comments from the new API
  useEffect(() => {
    const fetchComments = async () => {
      if (!projectId || !postId) {
        console.log("Missing IDs for comments fetch:", {
          projectId,
          postId,
          opportunity,
        });
        return;
      }

      console.log("Fetching comments with:", { projectId, postId });

      setCommentsLoading(true);
      setCommentsError(null);

      try {
        const response = await api.get(
          `/opportunity-agent/fetch-post-comments/?project_id=${projectId}&post_id=${postId}&depth=10`
        );

        const data = response.data;
        console.log("Comments API response:", data);

        if (data.success) {
          setComments(data.comments || []);
          setTotalComments(
            data.total_all_comments || data.comments?.length || 0
          );
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        setCommentsError(error.message);
        // Fallback to existing comments from opportunity data
        const fallbackComments = opportunity?.reddit_data?.comments || [];
        setComments(fallbackComments);
        setTotalComments(fallbackComments.length);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [projectId, postId, opportunity]);

  const toggleComments = () => setShowComments(!showComments);

  const postUrl = postInfo.post_url?.startsWith("https://https://")
    ? postInfo.post_url.replace("https://https://", "https://")
    : postInfo.post_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Original Post Content
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Main Reddit post and key community interactions
          </p>
        </div>
      </div>

      {/* Post Info */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white/90 backdrop-blur-md rounded-xl border border-blue-100 shadow-sm p-4 mb-4 transition-transform"
      >
        <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-orange-600">
              r/{postInfo.post_subreddit || "logistics"}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-700">
              u/{postInfo.post_author || "unknown"}
            </span>
            <span>•</span>
            <span>{formatDate(postInfo.post_created_utc)}</span>
          </div>
          <div className="flex items-center gap-3">
            {postUrl && (
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700"
              >
                View Original{" "}
                <ArrowUpRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            )}
          </div>
        </div>

        {/* Post Body */}
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {postInfo.post_title}
        </h3>
        <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
          {postInfo.post_content}
        </p>
      </motion.div>

      {/* Metrics Section */}
      <div className="flex flex-wrap justify-start md:justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-600 transition-colors">
          <ArrowBigUp className="w-4 h-4" />
          <span>{metrics.upvotes || 0} Upvotes</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 transition-colors">
          <ArrowBigDown className="w-4 h-4" />
          <span>
            {Math.max(
              0,
              Math.round(
                (metrics.upvotes || 0) * (1 - (metrics.upvote_ratio || 1))
              )
            )}{" "}
            Downvotes
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>{metrics.comments_count || 0} Comments</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <BarChart3 className="w-4 h-4" />
          <span>
            {Math.round((metrics.upvote_ratio || 0) * 100)}% Upvote Ratio
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{metrics.engagement_score || 0} Engagement</span>
        </div>
      </div>

      {/* Comments Toggle */}
      {/* Comments Toggle Button */}
      {(comments.length > 0 || commentsLoading) && (
        <button
          onClick={toggleComments}
          className="mt-6 text-blue-600 font-semibold text-base flex items-center gap-1 hover:text-blue-700"
          disabled={commentsLoading}
        >
          {showComments ? "Hide" : "Show"}{" "}
          {commentsLoading ? "Loading..." : `${totalComments} Comments`}
        </button>
      )}

      {/* Comments Error */}
      {commentsError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">
            Failed to load comments: {commentsError}
          </p>
        </div>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (comments.length > 0 || commentsLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-2 sm:space-y-4 mt-4 border-t border-slate-200 pt-4 max-h-[60vh] sm:max-h-[75vh] overflow-y-auto"
          >
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">Loading comments...</span>
              </div>
            ) : (
              comments.map((comment, index) => (
                <CommentItem
                  key={comment.id || index}
                  comment={comment}
                  depth={0}
                  index={index}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
