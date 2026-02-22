// Strategy Brief component with hooks, patterns, and quality metrics

import React, { useState } from "react";
import { CONTENT_PATTERNS } from "../../../constants";

/**
 * StrategyBrief Component - Displays and manages content strategy elements
 * @param {Object} props - Component props
 * @param {string} props.intent - Current intent
 * @param {string} props.kpi - Current KPI
 * @param {Array} props.hooks - Array of hook strings
 * @param {number} props.selectedHook - Index of selected hook
 * @param {Function} props.onHookSelect - Callback for hook selection
 * @param {Function} props.onAddHook - Callback for adding new hook
 * @param {Function} props.onRemoveHook - Callback for removing hook
 * @param {Function} props.onGenerateHook - Callback for generating new hook
 * @param {number} props.selectedPattern - Index of selected pattern
 * @param {Function} props.onPatternSelect - Callback for pattern selection
 * @param {string} props.selectedAngle - Current selected angle
 * @param {Function} props.onAngleChange - Callback for angle change
 * @param {Object} props.metrics - Quality metrics object
 * @param {boolean} props.metricsLoading - Loading state for metrics
 */
const StrategyBrief = ({
  intent,
  kpi,
  hooks,
  selectedHook,
  onHookSelect,
  onAddHook,
  onRemoveHook,
  onGenerateHook,
  selectedPattern,
  onPatternSelect,
  selectedAngle,
  onAngleChange,
  metrics,
  metricsLoading,
}) => {
  const [newHook, setNewHook] = useState("");

  const handleAddHook = () => {
    if (newHook.trim()) {
      onAddHook(newHook.trim());
      setNewHook("");
    }
  };

  const handleGenerateHook = () => {
    onGenerateHook();
  };

  // Calculate average score
  const averageScore = metrics
    ? Math.round(
        Object.values(metrics).reduce((a, b) => a + b, 0) /
          Object.keys(metrics).length
      )
    : 0;

  // Get metric color class
  const getMetricColor = (value) => {
    if (value >= 80) return "bg-green-100 text-green-800";
    if (value >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">Strategy Brief</h2>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            Intent: {intent}
          </span>
          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
            KPI: {kpi}
          </span>
          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-xs font-medium">
            Persona: B2B
          </span>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
            Market: Enterprise
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Hooks Section */}
        <div className="col-span-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Hooks</h4>
            <div className="flex gap-2">
              <select
                value={selectedAngle}
                onChange={(e) => onAngleChange(e.target.value)}
                className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ROI">ROI</option>
                <option value="Speed">Speed</option>
                <option value="Novelty">Novelty</option>
                <option value="Community">Community</option>
                <option value="Deadline">Deadline</option>
                <option value="Case Study">Case Study</option>
              </select>
              <button
                onClick={handleGenerateHook}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {hooks.map((hook, index) => (
              <div
                key={index}
                onClick={() => onHookSelect(index)}
                className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                  selectedHook === index
                    ? "bg-blue-100 border-2 border-blue-500 text-blue-900"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      selectedHook === index
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedHook === index && (
                      <div className="w-1 h-1 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="flex-1">{hook}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveHook(index);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs px-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Add new hook input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newHook}
                onChange={(e) => setNewHook(e.target.value)}
                placeholder="+ Add new hook..."
                className="flex-1 px-2 py-1 border border-dashed rounded text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-solid"
                onKeyPress={(e) => e.key === "Enter" && handleAddHook()}
              />
              <button
                onClick={handleAddHook}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Patterns Section */}
        <div className="col-span-3">
          <h4 className="font-medium text-sm mb-2">Patterns</h4>
          <div className="space-y-1.5">
            {CONTENT_PATTERNS.map((pattern, index) => (
              <div
                key={index}
                onClick={() => onPatternSelect(index)}
                className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                  selectedPattern === index
                    ? "bg-blue-100 border-2 border-blue-500 text-blue-900"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      selectedPattern === index
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPattern === index && (
                      <div className="w-1 h-1 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="flex-1">{pattern}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Metrics Section */}
        <div className="col-span-4">
          <h4 className="font-medium text-sm mb-2">Quality Metrics</h4>

          {metricsLoading ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-1.5 bg-gray-100 rounded animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : metrics ? (
            <div className="space-y-2">
              {/* First Row */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: "Hook", value: metrics.hook },
                  { label: "Clarity", value: metrics.clarity },
                  { label: "Credibility", value: metrics.credibility },
                  { label: "CTA", value: metrics.cta },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={`p-1.5 rounded text-center ${getMetricColor(
                      metric.value
                    )}`}
                  >
                    <div className="font-medium">{metric.value}</div>
                    <div className="text-xs opacity-75">{metric.label}</div>
                  </div>
                ))}
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: "Platform", value: metrics.platformFit },
                  { label: "Readability", value: metrics.readability },
                  { label: "Originality", value: metrics.originality },
                  { label: "AVG", value: averageScore, isAverage: true },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={`p-1.5 rounded text-center ${
                      metric.isAverage
                        ? "bg-blue-100 text-blue-800 font-semibold"
                        : getMetricColor(metric.value)
                    }`}
                  >
                    <div className="font-medium">
                      {metric.value}
                      {metric.isAverage ? " ✓" : ""}
                    </div>
                    <div className="text-xs opacity-75">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              Generate content to see quality metrics
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyBrief;
