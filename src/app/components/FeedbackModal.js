"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaTimes } from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function FeedbackModal({ isOpen, onClose, maxStars = 10 }) {
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starIndex) => {
    setSelectedStars(starIndex);
  };

  const handleStarHover = (starIndex) => {
    setHoveredStars(starIndex);
  };

  const handleStarLeave = () => {
    setHoveredStars(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedStars === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/auth/feedback/", {
        star_rating: selectedStars,
        feedback_message: feedbackMessage.trim(),
      });

      toast.success("Thank you for your feedback!");
      handleClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStars(0);
    setHoveredStars(0);
    setFeedbackMessage("");
    setIsSubmitting(false);
    onClose();
  };

  const getStarColor = (starIndex) => {
    const isSelected = starIndex <= selectedStars;
    const isHovered = starIndex <= hoveredStars;

    if (isSelected || isHovered) {
      return "#FFD700"; // Golden color
    }
    return "#E5E7EB"; // Gray color
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FiMessageSquare className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Share Your Feedback
                  </h2>
                  <p className="text-sm text-gray-600">
                    Help us improve your experience
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Star Rating */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                How would you rate your experience?
              </label>

              <div className="flex items-center justify-center gap-2 py-4">
                {Array.from({ length: maxStars }, (_, index) => {
                  const starIndex = index + 1;
                  return (
                    <motion.button
                      key={starIndex}
                      type="button"
                      onClick={() => handleStarClick(starIndex)}
                      onMouseEnter={() => handleStarHover(starIndex)}
                      onMouseLeave={handleStarLeave}
                      className="cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 rounded"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <motion.div
                        animate={{
                          color: getStarColor(starIndex),
                          filter:
                            starIndex <= (hoveredStars || selectedStars)
                              ? "drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))"
                              : "none",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <FaStar
                          size={32}
                          className="transition-all duration-200"
                        />
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Rating Display */}
              <div className="text-center">
                <motion.p
                  key={selectedStars}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-600"
                >
                  {selectedStars > 0 ? (
                    <>
                      <span className="font-semibold text-gray-900">
                        {selectedStars}
                      </span>{" "}
                      out of {maxStars} stars
                    </>
                  ) : (
                    "Click on a star to rate"
                  )}
                </motion.p>
              </div>
            </div>

            {/* Feedback Message */}
            <div className="space-y-2">
              <label
                htmlFor="feedback-message"
                className="block text-sm font-medium text-gray-700"
              >
                Tell us more (optional)
              </label>
              <textarea
                id="feedback-message"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or any issues you encountered..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-0 focus:ring-offset-0 focus:border-transparent resize-none transition-colors"
                maxLength={1000}
              />
              <div className="text-right text-xs text-gray-500">
                {feedbackMessage.length}/1000 characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={handleClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                disabled={selectedStars === 0 || isSubmitting}
                whileHover={{ scale: selectedStars > 0 ? 1.02 : 1 }}
                whileTap={{ scale: selectedStars > 0 ? 0.98 : 1 }}
                className={`flex-1 px-6 cursor-pointer py-3 rounded-xl font-medium transition-all ${
                  selectedStars > 0 && !isSubmitting
                    ? "bg-sky-600 text-white hover:bg-sky-700 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Submitting...
                  </div>
                ) : (
                  "Submit Feedback"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
