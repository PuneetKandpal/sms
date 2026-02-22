"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

const CircularLoader = ({
  isOpen,
  onClose,
  title = "Processing",
  url = "",
  duration = 15000, // 15 seconds default
  steps = [],
  currentStep = 0,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("Initializing...");

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStepText("Initializing...");
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 100 / (duration / 100), 100);

        // Update step text based on progress
        if (steps && steps.length > 0) {
          const stepIndex = Math.floor((newProgress / 100) * steps.length);
          const step = steps[Math.min(stepIndex, steps.length - 1)];
          if (step) {
            setCurrentStepText(step.text || step.description || step);
          }
        }

        // Show "Finalizing..." when near completion
        if (newProgress >= 95) {
          setCurrentStepText("Finalizing...");
        }

        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, duration, steps]);

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-[200]"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center relative shadow-xl"
        >
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>

          {/* URL display */}
          {url && (
            <div className="text-sm text-blue-600 mb-6 break-all px-2">
              {url}
            </div>
          )}

          {/* Circular Progress */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg
              className="w-20 h-20 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#3b82f6"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-out"
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-800">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Current step text */}
          <div className="text-gray-600 mb-6 text-sm">{currentStepText}</div>

          {/* Cancel button */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CircularLoader;
