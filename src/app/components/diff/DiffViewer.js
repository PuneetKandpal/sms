"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import DiffField from "./DiffField";
import NestedDiff from "./NestedDiff";
import { deepCompare, applyChanges } from "./utils";

export default function DiffViewer({
  oldObject,
  newObject,
  title = "Object Comparison",
  onMergedObjectChange,
}) {
  const [acceptedChanges, setAcceptedChanges] = useState({});
  const [showMergedResult, setShowMergedResult] = useState(false);

  // Deep compare the objects
  const differences = useMemo(() => {
    return deepCompare(oldObject, newObject);
  }, [oldObject, newObject]);

  // Calculate merged object
  const mergedObject = useMemo(() => {
    return applyChanges(newObject, differences, acceptedChanges);
  }, [newObject, differences, acceptedChanges]);

  // Notify parent of merged object changes
  useEffect(() => {
    if (onMergedObjectChange) {
      onMergedObjectChange(mergedObject);
    }
  }, [mergedObject, onMergedObjectChange]);

  const handleAccept = (path, value = true) => {
    setAcceptedChanges((prev) => ({
      ...prev,
      [path]: value,
    }));
  };

  const handleReject = (path) => {
    setAcceptedChanges((prev) => ({
      ...prev,
      [path]: false,
    }));
  };

  const handleAcceptAll = () => {
    const newAccepted = {};

    function processChanges(changesObj, currentPath = "") {
      for (const [key, change] of Object.entries(changesObj)) {
        const changePath = currentPath ? `${currentPath}.${key}` : key;

        if (change.type === "nested") {
          processChanges(change.nested, changePath);
        } else if (change.type !== "same") {
          newAccepted[changePath] = true;
        }
      }
    }

    processChanges(differences);
    setAcceptedChanges(newAccepted);
  };

  const handleRejectAll = () => {
    const newAccepted = {};

    function processChanges(changesObj, currentPath = "") {
      for (const [key, change] of Object.entries(changesObj)) {
        const changePath = currentPath ? `${currentPath}.${key}` : key;

        if (change.type === "nested") {
          processChanges(change.nested, changePath);
        } else if (change.type !== "same") {
          newAccepted[changePath] = false;
        }
      }
    }

    processChanges(differences);
    setAcceptedChanges(newAccepted);
  };

  const handleResetAll = () => {
    setAcceptedChanges({});
  };

  const handleDownloadResult = () => {
    const dataStr = JSON.stringify(mergedObject, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "merged-result.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const counts = {
      added: 0,
      removed: 0,
      changed: 0,
      same: 0,
      nested: 0,
      total: 0,
    };
    const decisions = { accepted: 0, rejected: 0, pending: 0 };

    function countChanges(changesObj, currentPath = "") {
      for (const [key, change] of Object.entries(changesObj)) {
        const changePath = currentPath ? `${currentPath}.${key}` : key;
        counts[change.type]++;
        counts.total++;

        if (change.type === "nested") {
          countChanges(change.nested, changePath);
        } else if (change.type !== "same") {
          const decision = acceptedChanges[changePath];
          if (decision === true) decisions.accepted++;
          else if (decision === false) decisions.rejected++;
          else decisions.pending++;
        }
      }
    }

    countChanges(differences);
    return { ...counts, ...decisions };
  }, [differences, acceptedChanges]);

  const hasNoDifferences = stats.added + stats.removed + stats.changed === 0;

  if (hasNoDifferences) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-green-900 mb-2">
          No Differences Found
        </h3>
        <p className="text-green-700">The objects are identical.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{stats.added} Added</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>{stats.removed} Removed</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>{stats.changed} Changed</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>{stats.same} Unchanged</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAcceptAll}
              className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <CheckCircle size={16} />
              <span>Accept All</span>
            </button>
            <button
              onClick={handleRejectAll}
              className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <XCircle size={16} />
              <span>Reject All</span>
            </button>
            <button
              onClick={handleResetAll}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                stats.pending === 0
                  ? 100
                  : ((stats.accepted + stats.rejected) /
                      (stats.accepted + stats.rejected + stats.pending)) *
                    100
              }%`,
            }}
          ></div>
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {stats.accepted} Accepted, {stats.rejected} Rejected,{" "}
            {stats.pending} Pending
          </span>
          <span>
            {stats.pending === 0
              ? "All changes reviewed"
              : `${stats.pending} changes need review`}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMergedResult(!showMergedResult)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <AlertCircle size={16} />
              <span>{showMergedResult ? "Hide" : "Show"} Merged Result</span>
            </button>
          </div>

          <button
            onClick={handleDownloadResult}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Download size={16} />
            <span>Download Result</span>
          </button>
        </div>
      </div>

      {/* Merged Result Preview */}
      {showMergedResult && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Merged Result Preview
            </h3>
          </div>
          <div className="p-4">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(mergedObject, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Diff Content */}
      <div className="space-y-4">
        {Object.entries(differences).map(([key, change]) => (
          <div key={key}>
            {change.type === "nested" ? (
              <NestedDiff
                fieldName={key}
                change={change}
                onAccept={handleAccept}
                onReject={handleReject}
                acceptedState={acceptedChanges}
              />
            ) : (
              <DiffField
                fieldName={key}
                change={change}
                onAccept={handleAccept}
                onReject={handleReject}
                acceptedState={acceptedChanges}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
