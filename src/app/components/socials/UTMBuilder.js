// UTM Builder component for tracking campaign parameters

import React from "react";

/**
 * UTMBuilder Component - Builds UTM tracking URLs
 * @param {Object} props - Component props
 * @param {Object} props.utmParams - UTM parameters object
 * @param {Function} props.onUtmParamsChange - Callback for UTM parameter changes
 * @param {string} props.builtUrl - The built UTM URL
 * @param {Function} props.onCopyUrl - Callback for copying URL to clipboard
 */
const UTMBuilder = ({ utmParams, onUtmParamsChange, builtUrl, onCopyUrl }) => {
  const handleParamChange = (param, value) => {
    onUtmParamsChange({ ...utmParams, [param]: value });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
      if (onCopyUrl) {
        onCopyUrl();
      }
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h4 className="font-medium mb-3">UTM Builder</h4>

      <div className="space-y-4">
        {/* UTM Parameter Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Source
            </label>
            <input
              type="text"
              value={utmParams.source}
              onChange={(e) => handleParamChange("source", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., social_media"
            />
            <p className="text-xs text-gray-500 mt-1">
              Traffic source (required)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Medium
            </label>
            <input
              type="text"
              value={utmParams.medium}
              onChange={(e) => handleParamChange("medium", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., organic_post"
            />
            <p className="text-xs text-gray-500 mt-1">
              Marketing medium (required)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Campaign
            </label>
            <input
              type="text"
              value={utmParams.campaign}
              onChange={(e) => handleParamChange("campaign", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., brand_awareness_q4"
            />
            <p className="text-xs text-gray-500 mt-1">
              Campaign name (required)
            </p>
          </div>
        </div>

        {/* Optional Parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Term (optional)
            </label>
            <input
              type="text"
              value={utmParams.term || ""}
              onChange={(e) => handleParamChange("term", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., social+media+marketing"
            />
            <p className="text-xs text-gray-500 mt-1">Paid search keywords</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Content (optional)
            </label>
            <input
              type="text"
              value={utmParams.content || ""}
              onChange={(e) => handleParamChange("content", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., variant_a"
            />
            <p className="text-xs text-gray-500 mt-1">A/B testing content</p>
          </div>
        </div>

        {/* Built UTM URL */}
        <div className="pt-2 border-t">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Built UTM URL
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md text-xs font-mono text-gray-700 overflow-hidden">
              <div className="truncate" title={builtUrl}>
                {builtUrl}
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Copy URL"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* UTM Parameter Preview */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Parameter Preview
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">utm_source:</span>
              <span className="font-mono text-gray-800">
                {utmParams.source || "(empty)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">utm_medium:</span>
              <span className="font-mono text-gray-800">
                {utmParams.medium || "(empty)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">utm_campaign:</span>
              <span className="font-mono text-gray-800">
                {utmParams.campaign || "(empty)"}
              </span>
            </div>
            {utmParams.term && (
              <div className="flex justify-between">
                <span className="text-gray-600">utm_term:</span>
                <span className="font-mono text-gray-800">
                  {utmParams.term}
                </span>
              </div>
            )}
            {utmParams.content && (
              <div className="flex justify-between">
                <span className="text-gray-600">utm_content:</span>
                <span className="font-mono text-gray-800">
                  {utmParams.content}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Quick Templates
          </h5>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Social Organic",
                source: "social_media",
                medium: "organic_post",
                campaign: "brand_awareness",
              },
              {
                label: "Social Paid",
                source: "facebook",
                medium: "paid_social",
                campaign: "lead_generation",
              },
              {
                label: "Email",
                source: "newsletter",
                medium: "email",
                campaign: "product_launch",
              },
              {
                label: "Blog",
                source: "blog",
                medium: "referral",
                campaign: "content_marketing",
              },
            ].map((template) => (
              <button
                key={template.label}
                onClick={() =>
                  onUtmParamsChange({
                    ...utmParams,
                    source: template.source,
                    medium: template.medium,
                    campaign: template.campaign,
                  })
                }
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMBuilder;
