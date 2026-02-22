// Visuals panel component for managing asset ideas

import React from "react";
import { VISUAL_FORMATS } from "../../../constants";

/**
 * VisualsPanel Component - Manages visual asset ideas and generation
 * @param {Object} props - Component props
 * @param {Object} props.assetIdeas - Asset ideas data structure
 * @param {string} props.selectedPlatform - Currently selected platform
 * @param {string} props.selectedVariant - Currently selected variant
 * @param {string} props.selectedVisualType - Currently selected visual type filter
 * @param {Function} props.onVisualTypeChange - Callback for visual type filter change
 * @param {Function} props.onGenerateIdeas - Callback for generating new ideas
 * @param {Function} props.onAddVariant - Callback for adding variant
 * @param {Function} props.onGenerateVisual - Callback for generating visual
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 */
const VisualsPanel = ({
  assetIdeas,
  selectedPlatform,
  selectedVariant,
  selectedVisualType,
  onVisualTypeChange,
  onGenerateIdeas,
  onAddVariant,
  onGenerateVisual,
  loading,
  error,
}) => {
  // Get ideas for current platform and variant
  const currentIdeas = assetIdeas[selectedPlatform]?.[selectedVariant] || [];

  // Filter ideas based on selected visual type
  const filteredIdeas =
    selectedVisualType === "All"
      ? currentIdeas
      : currentIdeas.filter((idea) => idea.format === selectedVisualType);

  // Sample idea for demonstration when no ideas exist
  const sampleIdea = {
    id: "sample",
    format: "Single Image",
    overview:
      "Professional business infographic showcasing key statistics and insights",
    textOnImage: "Transform Your Business with AI-Powered Solutions",
    prompt:
      'Create a modern, professional single image for LinkedIn featuring clean typography, business charts, and a gradient blue background. Include the text "Transform Your Business with AI-Powered Solutions" prominently displayed with supporting statistics and icons.',
  };

  const handleGenerateVisual = (ideaId) => {
    if (onGenerateVisual) {
      onGenerateVisual(ideaId, selectedPlatform, selectedVariant);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h4 className="font-medium mb-3">Visuals</h4>

      {/* Visual Type Filter Chiclets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {VISUAL_FORMATS.map((type) => (
          <button
            key={type}
            onClick={() => onVisualTypeChange(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedVisualType === type
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-700 font-medium">
              Error loading visuals
            </span>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Asset Ideas List */}
      <div className="space-y-3 mb-4">
        {/* Show sample idea for variant A when no ideas exist */}
        {selectedVariant === "A" && filteredIdeas.length === 0 && !loading && (
          <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
            <div className="flex gap-4">
              {/* Left side - Content */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">{sampleIdea.format}</div>
                  <div className="text-xs text-gray-500">#{sampleIdea.id}</div>
                </div>
                <div className="text-sm text-gray-700">
                  {sampleIdea.overview}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Text on Image: </span>
                  <span className="italic">"{sampleIdea.textOnImage}"</span>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Prompt
                  </label>
                  <textarea
                    value={sampleIdea.prompt}
                    readOnly
                    rows="3"
                    className="w-full px-2 py-1 text-xs bg-gray-50 border rounded resize-none"
                  />
                </div>
              </div>

              {/* Right side - Preview */}
              <div className="w-32 flex-shrink-0 space-y-2">
                <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  <div className="text-center z-10">
                    <div className="text-xs font-bold mb-1">AI Solutions</div>
                    <div className="text-xs opacity-90">📊 +47% Growth</div>
                    <div className="text-xs opacity-75 mt-1">
                      Transform Business
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 w-3 h-3 bg-white bg-opacity-20 rounded-full"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-white bg-opacity-15 rounded-full"></div>
                </div>
                <button
                  onClick={() => handleGenerateVisual(sampleIdea.id)}
                  className="w-full px-2 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600 transition-colors"
                >
                  🎨 Generate Visual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actual asset ideas */}
        {filteredIdeas.map((idea) => (
          <div key={idea.id} className="border rounded-lg p-3">
            <div className="flex gap-4">
              {/* Left side - Content */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">{idea.format}</div>
                  <div className="text-xs text-gray-500">#{idea.id}</div>
                </div>
                <div className="text-sm text-gray-700">{idea.overview}</div>
                <div className="text-sm">
                  <span className="font-medium">Text on Image: </span>
                  <span className="italic">"{idea.textOnImage}"</span>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Prompt
                  </label>
                  <textarea
                    value={idea.prompt}
                    readOnly
                    rows="2"
                    className="w-full px-2 py-1 text-xs bg-gray-50 border rounded resize-none"
                  />
                </div>
              </div>

              {/* Right side - Preview */}
              <div className="w-32 flex-shrink-0 space-y-2">
                <div className="w-full h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Preview</div>
                    <div className="text-gray-400 text-xs">Placeholder</div>
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateVisual(idea.id)}
                  disabled={loading}
                  className="w-full px-2 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600 transition-colors disabled:bg-gray-400"
                >
                  🎨 Generate Visual
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="border rounded-lg p-3 animate-pulse">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
              <div className="w-32 space-y-2">
                <div className="w-full h-24 bg-gray-200 rounded-lg"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredIdeas.length === 0 && !loading && selectedVariant !== "A" && (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">No visual ideas yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Generate ideas to get started
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <button
          onClick={onGenerateIdeas}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          ✨ Generate new ideas
        </button>
        <button
          onClick={onAddVariant}
          disabled={loading || currentIdeas.length === 0}
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
        >
          📋 Add variant
        </button>
      </div>
    </div>
  );
};

export default VisualsPanel;
