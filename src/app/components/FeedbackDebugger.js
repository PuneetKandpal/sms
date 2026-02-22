/**
 * Feedback Debugger Component
 * Use this component to test and debug the feedback integration
 */

"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/auth.js";
import {
  openFeedbackWidget,
  updateFeedbackUserContext,
} from "../utils/sentryFeedback.js";

export default function FeedbackDebugger() {
  const [user, setUser] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Load user data
    const userData = getCurrentUser();
    setUser(userData);
  }, []);

  const handleRefreshContext = () => {
    updateFeedbackUserContext();
    const userData = getCurrentUser();
    setUser(userData);
    alert("User context refreshed!");
  };

  const handleOpenFeedback = () => {
    openFeedbackWidget();
  };

  const handleCheckLocalStorage = () => {
    const data = {
      userId: localStorage.getItem("userId"),
      userEmail: localStorage.getItem("userEmail"),
      userName: localStorage.getItem("userName"),
      userRole: localStorage.getItem("userRole"),
    };
    console.table(data);
    alert("Check console for localStorage data");
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 left-4 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm shadow-lg hover:bg-sky-700 z-50"
        title="Show Feedback Debugger"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 z-50 max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Feedback Debugger</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        {/* User Info */}
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <h4 className="font-semibold text-sm mb-2">Current User Data:</h4>
          {user ? (
            <div className="text-xs space-y-1">
              <div>
                <strong>ID:</strong> {user.id || "Not set"}
              </div>
              <div>
                <strong>Email:</strong> {user.email || "Not set"}
              </div>
              <div>
                <strong>Full Name:</strong> {user.fullName || "Not set"}
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-600">No user data found</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleOpenFeedback}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Open Feedback Widget
          </button>

          <button
            onClick={handleRefreshContext}
            className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Refresh User Context
          </button>

          <button
            onClick={handleCheckLocalStorage}
            className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            Check localStorage
          </button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 p-2 rounded border border-blue-200 text-xs">
          <strong>💡 Debug Tips:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check console for detailed logs</li>
            <li>
              Name should show:{" "}
              <code className="bg-white px-1">{user?.fullName || "N/A"}</code>
            </li>
            <li>Email should be disabled in form</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
