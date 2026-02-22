"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X, RotateCcw } from "lucide-react";
import { getChangeTypeClass, formatValue, isExpandable } from "./utils";

export default function DiffField({
  fieldName,
  change,
  onAccept,
  onReject,
  acceptedState,
  level = 0,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { type, oldValue, newValue, path } = change;

  const isAccepted = acceptedState[path];
  const hasDecision = isAccepted !== undefined;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleAccept = () => onAccept(path);
  const handleReject = () => onReject(path);
  const handleReset = () => onAccept(path, undefined); // Reset to no decision

  const renderValue = (value, label) => {
    if (!isExpandable(value)) {
      return (
        <div className="font-mono text-sm">
          <span className="text-gray-600">{label}:</span>
          <span className="ml-2">{formatValue(value)}</span>
        </div>
      );
    }

    return (
      <div>
        <button
          onClick={toggleExpand}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{label}:</span>
        </button>
        {isExpanded && (
          <pre className="mt-2 ml-4 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {formatValue(value)}
          </pre>
        )}
      </div>
    );
  };

  const renderControls = () => {
    if (type === "same") return null;

    return (
      <div className="flex items-center space-x-2 ml-4">
        {type === "added" && (
          <>
            <button
              onClick={handleAccept}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                isAccepted === true
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <Check size={14} />
              <span>Accept</span>
            </button>
            <button
              onClick={handleReject}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                isAccepted === false
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              <X size={14} />
              <span>Reject</span>
            </button>
          </>
        )}

        {type === "removed" && (
          <>
            <button
              onClick={handleReject}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                isAccepted === false
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <RotateCcw size={14} />
              <span>Restore</span>
            </button>
            <button
              onClick={handleAccept}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                isAccepted === true
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </>
        )}

        {type === "changed" && (
          <>
            <button
              onClick={handleAccept}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                isAccepted === true
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <Check size={14} />
              <span>Accept New</span>
            </button>
            <button
              onClick={handleReject}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                isAccepted === false
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              <X size={14} />
              <span>Keep Old</span>
            </button>
          </>
        )}

        {hasDecision && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-2 py-1 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>
    );
  };

  const getStatusBadge = () => {
    if (!hasDecision) return null;

    const statusClass = isAccepted
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusClass}`}
      >
        {isAccepted ? "Accepted" : "Rejected"}
      </span>
    );
  };

  return (
    <div
      className={`p-4 rounded-lg border mb-3 ${getChangeTypeClass(type)}`}
      style={{ marginLeft: `${level * 16}px` }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3">
          <h4 className="font-semibold text-gray-800">{fieldName}</h4>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              type === "added"
                ? "bg-green-200 text-green-800"
                : type === "removed"
                ? "bg-red-200 text-red-800"
                : type === "changed"
                ? "bg-yellow-200 text-yellow-800"
                : type === "same"
                ? "bg-gray-200 text-gray-800"
                : "bg-blue-200 text-blue-800"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-3">
        {type === "added" && renderValue(newValue, "New Value")}

        {type === "removed" && renderValue(oldValue, "Removed Value")}

        {type === "changed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-red-700 mb-2">
                Old Value
              </h5>
              <div className="bg-red-50 p-2 rounded">
                {renderValue(oldValue, "Old")}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-green-700 mb-2">
                New Value
              </h5>
              <div className="bg-green-50 p-2 rounded">
                {renderValue(newValue, "New")}
              </div>
            </div>
          </div>
        )}

        {type === "same" && renderValue(newValue, "Value")}

        {renderControls()}
      </div>
    </div>
  );
}
