// Input form component for Social Post Agent

import React from "react";
import { PLATFORMS, INTENTS, KPIS } from "../../../constants";

/**
 * InputForm Component - Handles user input for post generation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onFormDataChange - Callback for form data changes
 * @param {Function} props.onBrandSettingsChange - Callback for brand settings changes
 * @param {Function} props.onGenerate - Callback for generate button click
 * @param {Object} props.generationState - Current generation state
 */
const InputForm = ({
  formData,
  onFormDataChange,
  onBrandSettingsChange,
  onGenerate,
  generationState,
}) => {
  const handleInputChange = (field, value) => {
    onFormDataChange({ [field]: value });
  };

  const handlePlatformSelect = (platformId) => {
    onFormDataChange({ selectedPlatform: platformId });
  };

  const handleEmojiToggle = (checked) => {
    onBrandSettingsChange({ emoji: checked });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow border-2 border-blue-400 ring-2 ring-blue-100">
      <h3 className="text-xl font-semibold mb-3">Input</h3>

      <div className="space-y-3">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://example.com/article"
              value={formData.sourceUrl}
              onChange={(e) => handleInputChange("sourceUrl", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Optional Details */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Optional Details
          </label>
          <input
            type="text"
            placeholder="additional details..."
            value={formData.rawText}
            onChange={(e) => handleInputChange("rawText", e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Destination URL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Destination URL
          </label>
          <input
            type="text"
            placeholder="https://landing.page"
            value={formData.destinationUrl}
            onChange={(e) =>
              handleInputChange("destinationUrl", e.target.value)
            }
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Intent and KPI */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Intent</label>
            <select
              value={formData.intent}
              onChange={(e) => handleInputChange("intent", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {INTENTS.map((intent) => (
                <option key={intent} value={intent}>
                  {intent}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">KPI</label>
            <select
              value={formData.kpi}
              onChange={(e) => handleInputChange("kpi", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {KPIS.map((kpi) => (
                <option key={kpi} value={kpi}>
                  {kpi}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Emoji Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emoji-toggle"
              checked={formData.brandSettings.emoji}
              onChange={(e) => handleEmojiToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="emoji-toggle" className="text-sm font-medium">
              Allow emoji
            </label>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              formData.brandSettings.emoji
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {formData.brandSettings.emoji ? "on" : "off"}
          </span>
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Platforms</label>
          <div className="flex gap-1">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformSelect(platform.id)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                  formData.selectedPlatform === platform.id
                    ? "ring-2 ring-blue-300"
                    : "hover:bg-gray-200"
                }`}
                style={{
                  backgroundColor:
                    formData.selectedPlatform === platform.id
                      ? platform.color
                      : "#f3f4f6",
                  color:
                    formData.selectedPlatform === platform.id
                      ? "white"
                      : platform.color,
                }}
                title={platform.label}
                dangerouslySetInnerHTML={{ __html: platform.icon }}
              />
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={onGenerate}
            disabled={generationState.isGenerating}
            className={`w-full px-4 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${
              generationState.isGenerating
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {generationState.isGenerating
              ? "⚡ Generating..."
              : "✨ Generate Strategy"}
          </button>
        </div>

        {/* Progress Section */}
        {generationState.isGenerating && (
          <div className="pt-3 border-t mt-3">
            <div className="space-y-2">
              {/* Current Activity */}
              <div className="text-sm font-medium text-blue-600">
                {generationState.currentActivity}
              </div>

              {/* Task Checklist */}
              <div className="space-y-1">
                {generationState.tasks.map((task) => (
                  <div key={task} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                        generationState.completedTasks.includes(task)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {generationState.completedTasks.includes(task) ? "✓" : ""}
                    </span>
                    <span
                      className={
                        generationState.completedTasks.includes(task)
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      {task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputForm;
