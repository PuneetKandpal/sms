/**
 * Feedback Button Component
 * A simple button component that opens the Sentry feedback widget
 * with user context automatically populated
 */

"use client";

import { useState } from "react";
import {
  openFeedbackWidget,
  isFeedbackAvailable,
} from "../utils/sentryFeedback.js";

export default function FeedbackButton({
  className = "",
  children = "Send Feedback",
  variant = "primary",
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFeedbackClick = async () => {
    try {
      setIsLoading(true);

      // Check if feedback is available
      if (!isFeedbackAvailable()) {
        console.warn("Sentry feedback integration is not available");
        alert(
          "Feedback feature is currently unavailable. Please try again later."
        );
        return;
      }

      // Open feedback widget with user context
      openFeedbackWidget();
    } catch (error) {
      console.error("Failed to open feedback:", error);
      alert("Failed to open feedback form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Base button styles
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant styles
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
  };

  // Disabled styles
  const disabledStyles = "opacity-50 cursor-not-allowed";

  const buttonClass = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${disabled || isLoading ? disabledStyles : ""}
    ${className}
  `.trim();

  return (
    <button
      onClick={handleFeedbackClick}
      disabled={disabled || isLoading}
      className={buttonClass}
      type="button"
      aria-label="Open feedback form"
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Opening...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Floating Feedback Button Component
 * A fixed position feedback button that stays in the corner of the screen
 */
export function FloatingFeedbackButton({
  position = "bottom-right",
  className = "",
  children = "💬",
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFeedbackClick = async () => {
    try {
      setIsLoading(true);

      if (!isFeedbackAvailable()) {
        console.warn("Sentry feedback integration is not available");
        return;
      }

      openFeedbackWidget();
    } catch (error) {
      console.error("Failed to open feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Position styles
  const positionStyles = {
    "bottom-right": "fixed bottom-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "top-right": "fixed top-4 right-4",
    "top-left": "fixed top-4 left-4",
  };

  const buttonClass = `
    ${positionStyles[position] || positionStyles["bottom-right"]}
    w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full
    shadow-lg hover:shadow-xl transition-all duration-200
    flex items-center justify-center text-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    z-50
    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
    ${className}
  `.trim();

  return (
    <button
      onClick={handleFeedbackClick}
      disabled={isLoading}
      className={buttonClass}
      type="button"
      aria-label="Open feedback form"
      title="Send Feedback"
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
