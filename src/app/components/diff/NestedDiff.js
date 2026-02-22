"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import DiffField from "./DiffField";
import { getChangeTypeClass } from "./utils";

export default function NestedDiff({
  fieldName,
  change,
  onAccept,
  onReject,
  acceptedState,
  level = 0,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { nested, path } = change;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Count different types of changes in nested structure
  const changeCounts = Object.values(nested).reduce((acc, nestedChange) => {
    acc[nestedChange.type] = (acc[nestedChange.type] || 0) + 1;
    return acc;
  }, {});

  const hasChanges = Object.keys(changeCounts).some((type) => type !== "same");

  const renderChangeSummary = () => {
    const summaryParts = [];

    if (changeCounts.added) {
      summaryParts.push(`${changeCounts.added} added`);
    }
    if (changeCounts.removed) {
      summaryParts.push(`${changeCounts.removed} removed`);
    }
    if (changeCounts.changed) {
      summaryParts.push(`${changeCounts.changed} changed`);
    }
    if (changeCounts.same) {
      summaryParts.push(`${changeCounts.same} unchanged`);
    }

    return summaryParts.length > 0 ? `(${summaryParts.join(", ")})` : "";
  };

  return (
    <div
      className={`rounded-lg border mb-3 ${
        hasChanges ? getChangeTypeClass("nested") : getChangeTypeClass("same")
      }`}
      style={{ marginLeft: `${level * 16}px` }}
    >
      <div
        className="p-4 cursor-pointer hover:bg-opacity-80"
        onClick={toggleExpand}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <h4 className="font-semibold text-gray-800">{fieldName}</h4>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                hasChanges
                  ? "bg-blue-200 text-blue-800"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Nested Object
            </span>
          </div>
          <div className="text-sm text-gray-600">{renderChangeSummary()}</div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-l-2 border-gray-200 pl-4">
            {Object.entries(nested).map(([key, nestedChange]) => (
              <div key={key}>
                {nestedChange.type === "nested" ? (
                  <NestedDiff
                    fieldName={key}
                    change={nestedChange}
                    onAccept={onAccept}
                    onReject={onReject}
                    acceptedState={acceptedState}
                    level={level + 1}
                  />
                ) : (
                  <DiffField
                    fieldName={key}
                    change={nestedChange}
                    onAccept={onAccept}
                    onReject={onReject}
                    acceptedState={acceptedState}
                    level={level + 1}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
