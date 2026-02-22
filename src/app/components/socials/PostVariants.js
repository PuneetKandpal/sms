// Post Variants component for displaying and editing post content

import React, { useState } from "react";
import { PLATFORMS, CHARACTER_LIMITS } from "../../../constants";

/**
 * PostVariants Component - Displays post variants with editing capabilities
 * @param {Object} props - Component props
 * @param {string} props.selectedPlatform - Currently selected platform
 * @param {Object} props.postVariants - Post variants data
 * @param {Function} props.onPostVariantChange - Callback for post variant changes
 * @param {string} props.selectedVariant - Currently selected variant (A, B, or C)
 * @param {Function} props.onVariantSelect - Callback for variant selection
 * @param {Function} props.onExport - Callback for export action
 * @param {Function} props.onRefine - Callback for refine action
 */
const PostVariants = ({
  selectedPlatform,
  postVariants,
  onPostVariantChange,
  selectedVariant,
  onVariantSelect,
  onExport,
  onRefine,
}) => {
  const [variantContent, setVariantContent] = useState({
    A: {
      text: "🚀 Transform your content strategy with AI-powered insights that drive real engagement. Stop guessing what works and start creating posts that convert.",
      hashtags: ["#marketing", "#saas", "#content", "#growth"],
    },
    B: {
      text: "Your team has incredible insights, but they're getting lost in generic posts. Let's change that with content that actually reflects your expertise.",
      hashtags: ["#marketing", "#teamwork", "#expertise", "#content"],
    },
    C: {
      text: "Ready to see what happens when your content strategy gets a 15-minute AI makeover? The results might surprise you.",
      hashtags: ["#ai", "#productivity", "#marketing", "#results"],
    },
  });

  const platformData = PLATFORMS.find((p) => p.id === selectedPlatform);
  const characterLimit = CHARACTER_LIMITS[selectedPlatform] || 280;

  // Use generated content if available, otherwise use default content
  const currentVariants = postVariants[selectedPlatform] || variantContent;

  const handleTextChange = (variant, newText) => {
    const updatedContent = {
      ...currentVariants[variant],
      text: newText,
    };

    if (onPostVariantChange) {
      onPostVariantChange(selectedPlatform, variant, updatedContent);
    } else {
      // Fallback to local state
      setVariantContent((prev) => ({
        ...prev,
        [variant]: updatedContent,
      }));
    }
  };

  const getCharacterCount = (text) => text.length;
  const isOverLimit = (text) => getCharacterCount(text) > characterLimit;

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Post Variants • {platformData?.label || "Unknown Platform"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
          >
            📥 Export JSON
          </button>
          <button
            onClick={onRefine}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
          >
            🚀 Refine
          </button>
        </div>
      </div>

      {/* Variant Cards */}
      <div className="space-y-4">
        {["A", "B", "C"].map((variant) => {
          const content = currentVariants[variant] || {
            text: "",
            hashtags: [],
          };
          const isSelected = selectedVariant === variant;

          return (
            <div
              key={variant}
              onClick={() => onVariantSelect(variant)}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {variant}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-blue-600 font-medium">
                        ● Preview
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      value={content.text}
                      onChange={(e) =>
                        handleTextChange(variant, e.target.value)
                      }
                      rows="3"
                      className={`w-full px-2 py-1.5 border rounded text-sm resize-y min-h-[3rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isOverLimit(content.text)
                          ? "border-red-300 bg-red-50"
                          : ""
                      }`}
                      placeholder={`Variant ${variant} content...`}
                    />
                    {isOverLimit(content.text) && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-600">
                        Content exceeds character limit
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-40 flex-shrink-0 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {content.hashtags?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs">
                      <span
                        className={`font-medium ${
                          isOverLimit(content.text)
                            ? "text-red-600"
                            : "text-gray-700"
                        }`}
                      >
                        {getCharacterCount(content.text)}
                      </span>
                      <span className="text-gray-500">/{characterLimit}</span>
                    </div>

                    {/* Character limit indicator */}
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          isOverLimit(content.text)
                            ? "bg-red-500"
                            : getCharacterCount(content.text) / characterLimit >
                              0.8
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (getCharacterCount(content.text) / characterLimit) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: platformData?.color }}
            ></div>
            <span className="font-medium">{platformData?.label}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">
              Character limit: {characterLimit.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-600">3 variants ready</div>
        </div>
      </div>
    </div>
  );
};

export default PostVariants;
