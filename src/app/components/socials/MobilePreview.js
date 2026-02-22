// Mobile preview component for post visualization

import React from "react";
import { PLATFORMS } from "../../../constants";

/**
 * MobilePreview Component - Shows how posts will look on mobile devices
 * @param {Object} props - Component props
 * @param {string} props.selectedPlatform - Currently selected platform
 * @param {string} props.selectedVariant - Currently selected variant
 * @param {Object} props.postContent - Post content for the selected variant
 * @param {Object} props.previewSettings - Mobile preview settings
 * @param {Function} props.onPreviewSettingsChange - Callback for preview settings changes
 */
const MobilePreview = ({
  selectedPlatform,
  selectedVariant,
  postContent,
  previewSettings,
  onPreviewSettingsChange,
}) => {
  const platformData = PLATFORMS.find((p) => p.id === selectedPlatform);

  // Calculate contrast ratio for accessibility
  const calculateContrastRatio = (color1, color2) => {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;

      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  };

  const contrastRatio = calculateContrastRatio(
    previewSettings.overlayBg,
    previewSettings.textColor
  );
  const contrastPasses = contrastRatio >= 4.5;

  const handleSettingChange = (setting, value) => {
    onPreviewSettingsChange({ [setting]: value });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Mobile Preview</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Dark mode</span>
          <input
            type="checkbox"
            checked={previewSettings.darkMode}
            onChange={(e) => handleSettingChange("darkMode", e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Preview Frame */}
      <div
        className={`mx-auto border rounded-lg overflow-hidden ${
          ["tiktok", "instagram"].includes(selectedPlatform)
            ? "max-w-[380px]"
            : "max-w-[420px]"
        } ${
          previewSettings.darkMode
            ? "bg-black text-white"
            : "bg-white text-black"
        }`}
      >
        {/* Header Row */}
        <div
          className={`flex items-center gap-3 p-3 ${
            previewSettings.darkMode ? "border-gray-700" : "border-gray-200"
          } border-b`}
        >
          <div
            className={`w-8 h-8 rounded-full ${
              previewSettings.darkMode ? "bg-gray-600" : "bg-gray-300"
            }`}
          ></div>
          <div className="flex-1">
            <div className="font-medium text-sm">@brand_handle</div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              previewSettings.darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {platformData?.label || "Platform"}
          </span>
        </div>

        {/* Post Body */}
        <div className="p-3">
          <div className="text-sm leading-relaxed">
            {postContent?.text || "Your post content will appear here..."}
          </div>

          {/* Hashtags */}
          {postContent?.hashtags && postContent.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {postContent.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className={`text-xs ${
                    previewSettings.darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Asset Preview */}
        {previewSettings.showAsset && (
          <div className="mx-3 mb-3">
            <div
              className="h-48 border rounded-lg flex items-center justify-center relative"
              style={{
                backgroundColor: previewSettings.overlayBg,
                color: previewSettings.textColor,
              }}
            >
              <div className="text-center">
                <div className="text-lg font-medium mb-1">Sample Asset</div>
                <div className="text-sm opacity-90">Overlay text preview</div>
                <div className="text-xs opacity-75 mt-2">
                  Variant {selectedVariant}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-2 right-2 w-3 h-3 bg-white bg-opacity-20 rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-white bg-opacity-15 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Engagement Bar */}
        <div
          className={`flex items-center justify-between px-3 py-2 ${
            previewSettings.darkMode ? "border-gray-700" : "border-gray-200"
          } border-t`}
        >
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm">
              <span>❤️</span>
              <span className="text-xs">42</span>
            </button>
            <button className="flex items-center gap-1 text-sm">
              <span>💬</span>
              <span className="text-xs">8</span>
            </button>
            <button className="flex items-center gap-1 text-sm">
              <span>🔄</span>
              <span className="text-xs">12</span>
            </button>
          </div>
          <button className="text-sm">
            <span>🔖</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      {previewSettings.showAsset && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Overlay BG
              </label>
              <input
                type="color"
                value={previewSettings.overlayBg}
                onChange={(e) =>
                  handleSettingChange("overlayBg", e.target.value)
                }
                className="w-full h-8 border rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={previewSettings.textColor}
                onChange={(e) =>
                  handleSettingChange("textColor", e.target.value)
                }
                className="w-full h-8 border rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Contrast Ratio */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">Contrast Ratio:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{contrastRatio.toFixed(2)}:1</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  contrastPasses
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {contrastPasses ? "Pass" : "Fail"}
              </span>
            </div>
          </div>

          {/* Show Asset Toggle */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Show Asset Preview</span>
            <input
              type="checkbox"
              checked={previewSettings.showAsset}
              onChange={(e) =>
                handleSettingChange("showAsset", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePreview;
