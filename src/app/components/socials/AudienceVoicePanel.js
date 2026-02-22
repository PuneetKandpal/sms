// Audience & Voice panel component

import React from "react";

/**
 * AudienceVoicePanel Component - Displays audience and brand voice information
 * @param {Object} props - Component props
 * @param {Object} props.audienceData - Audience data from API
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 */
const AudienceVoicePanel = ({ audienceData, loading, error }) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold">Audience & Voice</h3>
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
          <svg
            className="w-3 h-3 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-blue-600 font-medium">
            Auto-populated
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm text-gray-700 font-medium">
              Company data will be automatically retrieved
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Your brand voice, audience personas, and differentiators will be
              loaded from your company's knowledge base during generation.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[
            "Buyer persona",
            "Target market",
            "Differentiators",
            "Brand Voice",
          ].map((field) => (
            <div key={field}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">{field}</label>
                <span className="text-xs text-blue-500">📊 Loading...</span>
              </div>
              <div className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 border-dashed">
                <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
                Failed to load audience data
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Data Loaded State */}
      {audienceData && !loading && !error && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Buyer persona</label>
              <span className="text-xs text-green-500">📊 Loaded</span>
            </div>
            <div className="w-full px-3 py-2 border rounded-md text-sm bg-green-50 border-green-200">
              {audienceData.buyerPersona}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Target market</label>
              <span className="text-xs text-green-500">📊 Loaded</span>
            </div>
            <div className="w-full px-3 py-2 border rounded-md text-sm bg-green-50 border-green-200">
              {audienceData.targetMarket}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">
                Differentiators
              </label>
              <span className="text-xs text-green-500">📊 Loaded</span>
            </div>
            <div className="w-full px-3 py-2 border rounded-md text-sm bg-green-50 border-green-200">
              {audienceData.differentiators}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Brand Voice</label>
              <span className="text-xs text-green-500">📊 Loaded</span>
            </div>
            <div className="w-full px-3 py-2 border rounded-md text-sm bg-green-50 border-green-200">
              {audienceData.brandVoice}
            </div>
          </div>
        </div>
      )}

      {/* Default State */}
      {!audienceData && !loading && !error && (
        <div className="space-y-4">
          {[
            "Buyer persona",
            "Target market",
            "Differentiators",
            "Brand Voice",
          ].map((field) => (
            <div key={field}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">{field}</label>
                <span className="text-xs text-blue-500">
                  📊 From knowledge base
                </span>
              </div>
              <div className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 text-gray-500 border-dashed">
                Will be populated automatically during generation...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudienceVoicePanel;
