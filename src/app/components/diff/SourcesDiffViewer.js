"use client";

import React, { useState, useEffect } from "react";
import { formatLocalDateTime } from "../../../utils/dateUtils";
import { DiffViewer } from "./";

/**
 * Specialized component for comparing sources arrays from the JBI API
 * Always compares the last object in the sources array with the previous objects
 */
export default function SourcesDiffViewer({
  sources = [],
  title = "Sources Comparison",
  onMergedSourceChange,
}) {
  const [comparisonMode, setComparisonMode] = useState("latest"); // 'latest' or 'custom'
  const [selectedOldIndex, setSelectedOldIndex] = useState(0);

  // Get the comparison objects
  const { oldObject, newObject, comparisonTitle } = useMemo(() => {
    if (!sources || sources.length === 0) {
      return {
        oldObject: {},
        newObject: {},
        comparisonTitle: "No sources available",
      };
    }

    if (sources.length === 1) {
      return {
        oldObject: {},
        newObject: sources[0],
        comparisonTitle: "Single source (no comparison)",
      };
    }

    const latestSource = sources[sources.length - 1];

    if (comparisonMode === "latest") {
      // Compare with the second-to-last object
      const previousSource = sources[sources.length - 2];
      return {
        oldObject: previousSource,
        newObject: latestSource,
        comparisonTitle: `${title} - Latest vs Previous`,
      };
    } else {
      // Compare with selected index
      const selectedSource = sources[selectedOldIndex];
      return {
        oldObject: selectedSource,
        newObject: latestSource,
        comparisonTitle: `${title} - Latest vs Source ${selectedOldIndex + 1}`,
      };
    }
  }, [sources, comparisonMode, selectedOldIndex, title]);

  const handleMergedObjectChange = (mergedObject) => {
    if (onMergedSourceChange) {
      onMergedSourceChange(mergedObject);
    }
  };

  if (!sources || sources.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-yellow-900 mb-2">
          No Sources Available
        </h3>
        <p className="text-yellow-700">
          Please provide sources array to compare.
        </p>
      </div>
    );
  }

  if (sources.length === 1) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Single Source
        </h3>
        <p className="text-blue-700">
          Only one source available. Need at least 2 sources to compare.
        </p>
        <div className="mt-4">
          <details className="text-left">
            <summary className="cursor-pointer text-blue-800 font-medium">
              View Source Data
            </summary>
            <pre className="mt-2 text-xs bg-white p-4 rounded border overflow-auto max-h-96">
              {JSON.stringify(sources[0], null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Comparison Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Comparing {sources.length} sources. Latest source is always on the
              right.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Compare with:
              </label>
              <select
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="latest">Previous Source</option>
                <option value="custom">Select Source</option>
              </select>
            </div>

            {comparisonMode === "custom" && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Source:
                </label>
                <select
                  value={selectedOldIndex}
                  onChange={(e) =>
                    setSelectedOldIndex(parseInt(e.target.value))
                  }
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  {sources.slice(0, -1).map((_, index) => (
                    <option key={index} value={index}>
                      Source {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Sources Timeline */}
        <div className="mt-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {sources.map((source, index) => {
              const isSelected =
                comparisonMode === "custom"
                  ? index === selectedOldIndex || index === sources.length - 1
                  : index >= sources.length - 2;

              const isLatest = index === sources.length - 1;
              const isComparisonTarget =
                comparisonMode === "custom"
                  ? index === selectedOldIndex
                  : index === sources.length - 2;

              return (
                <div key={index} className="flex-shrink-0">
                  <div
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                      isLatest
                        ? "bg-blue-100 border-blue-300 text-blue-800"
                        : isComparisonTarget
                        ? "bg-green-100 border-green-300 text-green-800"
                        : isSelected
                        ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                        : "bg-gray-100 border-gray-300 text-gray-600"
                    }`}
                  >
                    Source {index + 1}
                    {isLatest && <span className="ml-1">(Latest)</span>}
                    {isComparisonTarget && (
                      <span className="ml-1">(Comparing)</span>
                    )}
                  </div>
                  {index < sources.length - 1 && (
                    <div className="inline-block mx-2 text-gray-400">→</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Source Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Comparing Source</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <strong>URL:</strong> {oldObject.url || "N/A"}
            </div>
            <div>
              <strong>Source Type:</strong> {oldObject.source_type || "N/A"}
            </div>
            <div>
              <strong>Created:</strong>{" "}
              {formatLocalDateTime(oldObject.created_at) || "N/A"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Latest Source</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <strong>URL:</strong> {newObject.url || "N/A"}
            </div>
            <div>
              <strong>Source Type:</strong> {newObject.source_type || "N/A"}
            </div>
            <div>
              <strong>Created:</strong>{" "}
              {formatLocalDateTime(newObject.created_at) || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Diff Viewer */}
      <DiffViewer
        oldObject={oldObject}
        newObject={newObject}
        title={comparisonTitle}
        onMergedObjectChange={handleMergedObjectChange}
      />
    </div>
  );
}
