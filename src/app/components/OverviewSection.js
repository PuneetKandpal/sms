"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Target,
  Lightbulb,
  Search,
  Globe,
  Tag,
  ExternalLink,
  FileText,
} from "lucide-react";
import api from "../../api/axios";

/** Helper function to get consistent source ID - SAME AS SourceSection **/
function getSourceId(source) {
  return source.id || source.source_id;
}

/** Helper function to determine source type from available data - SAME AS SourceSection **/
function getSourceType(source) {
  // If source_type is available, use it
  if (source.source_type) {
    return source.source_type;
  }

  // Check if it's a URL
  if (source.url) {
    if (source.url.includes("youtube.com") || source.url.includes("youtu.be")) {
      return "youtube";
    }
    return "website";
  }

  // Check file extension if file_name is available
  if (source.file_name) {
    const extension = source.file_name.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return "pdf";
      case "txt":
      case "doc":
      case "docx":
        return "document";
      default:
        return "file";
    }
  }

  // If only source_content is available, it's likely manual text
  if (source.source_content && !source.url && !source.file_name) {
    return "manual";
  }

  return "unknown";
}

/** Helper function to get source display URL/identifier **/
function getSourceIdentifier(source) {
  // Priority: URL -> file_name -> source_content (truncated)
  if (source.url) {
    return { type: "url", value: source.url };
  }
  if (source.file_name) {
    return { type: "file", value: source.file_name };
  }
  if (source.source_content) {
    const truncated =
      source.source_content.length > 50
        ? source.source_content.substring(0, 50) + "..."
        : source.source_content;
    return { type: "text", value: truncated };
  }
  return { type: "unknown", value: "Untitled Source" };
}

/** Component to display source identifier with appropriate icon - FIXED TO MATCH SourceSection **/
function SourceIdentifierCard({ source }) {
  const identifier = getSourceIdentifier(source);
  const sourceType = getSourceType(source);

  const getIcon = () => {
    switch (sourceType) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case "manual":
        return <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />;
      case "youtube":
        return <ExternalLink className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case "website":
        return <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />;
      case "document":
      case "file":
        return <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />;
      default:
        return <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />;
    }
  };

  const getBgColor = () => {
    switch (sourceType) {
      case "website":
        return "bg-blue-50 border-blue-200";
      case "pdf":
        return "bg-red-50 border-red-200";
      case "youtube":
        return "bg-red-50 border-red-200";
      case "manual":
        return "bg-green-50 border-green-200";
      case "document":
      case "file":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`border rounded-lg p-3 mb-4 ${getBgColor()}`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {sourceType}
            </span>
          </div>

          {identifier.type === "url" ? (
            <a
              href={identifier.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
              title={identifier.value}
            >
              {identifier.value}
            </a>
          ) : (
            <p
              className="text-sm text-gray-700 break-words"
              title={identifier.value}
            >
              {identifier.value}
            </p>
          )}

          {source.file_name && identifier.type !== "file" && (
            <p className="text-xs text-gray-500 mt-1">
              File: {source.file_name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection({ sources, selectedSources = [] }) {
  const [expandedIds, setExpandedIds] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [defaultOverview, setDefaultOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Fetch default overview data
  useEffect(() => {
    const fetchDefaultOverview = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/get-default-overview-details/");
        if (!response) {
          throw new Error("Failed to fetch overview data");
        }

        const data = response.data;
        if (data && data.length > 0) {
          setDefaultOverview(data[0]);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching default overview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultOverview();
  }, []);

  // Filter sources based on selected checkboxes - FIXED: Use getSourceId helper
  const filteredSources =
    sources?.filter((source) =>
      selectedSources.includes(getSourceId(source))
    ) || [];

  // Debug logging - Remove this after fixing
  console.log(
    "Sources:",
    sources?.map((s) => ({
      id: s.id,
      source_id: s.source_id,
      file_name: s.file_name,
    }))
  );
  console.log("Selected sources:", selectedSources);
  console.log(
    "Filtered sources:",
    filteredSources.map((s) => ({ id: getSourceId(s), file_name: s.file_name }))
  );

  const renderKeywords = (keywords) => {
    if (!keywords || keywords.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {keywords.map((keyword, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
          >
            <Tag className="w-3 h-3 mr-1" />
            {keyword}
          </span>
        ))}
      </div>
    );
  };

  const renderGeneratedContent = (generatedContent) => {
    if (!generatedContent) return null;

    return (
      <div className="space-y-6 mt-4">
        {/* School Types Section */}
        {generatedContent.industries && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => toggleSection("industries")}
              className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-gray-700" />
                <h4 className="font-semibold text-gray-800">School Types</h4>
              </div>
              {expandedSections.industries ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.industries && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-3">
                  {generatedContent.industries.overview}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {generatedContent.industries.list?.map((industry, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-800"
                    >
                      {industry}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audience Profiles Section */}
        {generatedContent.buyer_personas && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => toggleSection("buyer_personas")}
              className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h4 className="font-semibold text-gray-800">Audience Profiles</h4>
              </div>
              {expandedSections.buyer_personas ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.buyer_personas && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-3">
                  {generatedContent.buyer_personas.overview}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {generatedContent.buyer_personas.list?.map((persona, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-800"
                    >
                      {persona}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Programs and Services Section */}
        {generatedContent.products_and_services && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => toggleSection("products_services")}
              className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-gray-700" />
                <h4 className="font-semibold text-gray-800">Programs & Services</h4>
              </div>
              {expandedSections.products_services ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.products_services && (
              <div className="mt-3 space-y-4">
                {Object.entries(generatedContent.products_and_services).map(
                  ([service, details], idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-2">
                        {service}
                      </h5>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {details.map((detail, dIdx) => (
                          <li key={dIdx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Target Communities Section */}
        {generatedContent.target_markets && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => toggleSection("target_markets")}
              className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-gray-700" />
                <h4 className="font-semibold text-gray-800">Target Communities</h4>
              </div>
              {expandedSections.target_markets ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.target_markets && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-3">
                  {generatedContent.target_markets.overview}
                </p>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.target_markets.list?.map((market, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-50 border border-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {market}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reasons Families Choose You Section */}
        {generatedContent.differentiators && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => toggleSection("differentiators")}
              className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-gray-700" />
                <h4 className="font-semibold text-gray-800">Reasons Families Choose You</h4>
              </div>
              {expandedSections.differentiators ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.differentiators && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-3">
                  {generatedContent.differentiators.overview}
                </p>
                <div className="space-y-2">
                  {generatedContent.differentiators.list?.map((diff, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border-l-4 border-gray-400 p-2 rounded"
                    >
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        {diff.split(":")[0]}
                      </p>
                      {diff.includes(":") && (
                        <p className="text-xs text-gray-600">
                          {diff.split(":")[1].trim()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO Strategy Section */}
        {generatedContent.geo_leo_strategy && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => toggleSection("seo_strategy")}
              className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-700" />
                <h4 className="font-semibold text-gray-800">SEO Strategy</h4>
              </div>
              {expandedSections.seo_strategy ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.seo_strategy && (
              <div className="mt-3 space-y-4">
                <p className="text-sm text-gray-600">
                  {generatedContent.geo_leo_strategy.overview}
                </p>

                {generatedContent.geo_leo_strategy.seo_strategy && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h6 className="font-medium text-gray-900 mb-2">
                        Industry Modifiers
                      </h6>
                      {renderKeywords(
                        generatedContent.geo_leo_strategy.seo_strategy
                          .industry_modifiers
                      )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h6 className="font-medium text-gray-900 mb-2">
                        Location Terms
                      </h6>
                      {renderKeywords(
                        generatedContent.geo_leo_strategy.seo_strategy
                          .location_based_terms
                      )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h6 className="font-medium text-gray-900 mb-2">
                        Problem Language
                      </h6>
                      {renderKeywords(
                        generatedContent.geo_leo_strategy.seo_strategy
                          .problem_language
                      )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h6 className="font-medium text-gray-900 mb-2">
                        Keyword Combinations
                      </h6>
                      {renderKeywords(
                        generatedContent.geo_leo_strategy.seo_strategy
                          .recommended_keyword_combinations
                      )}
                    </div>
                  </div>
                )}

                {generatedContent.geo_leo_strategy.llm_optimization && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h6 className="font-medium text-gray-900 mb-2">
                      LLM Optimization
                    </h6>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Prompt Patterns:
                        </span>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                          {generatedContent.geo_leo_strategy.llm_optimization.prompt_patterns?.map(
                            (pattern, idx) => (
                              <li key={idx}>{pattern}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Context Enhancement:
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {
                            generatedContent.geo_leo_strategy.llm_optimization
                              .context_enhancement
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg h-full">
        <h3 className="font-semibold">Overview</h3>
        <div className="mt-4 flex items-center justify-center">
          <p className="text-gray-600">Loading overview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg h-full">
        <h3 className="font-semibold">Overview</h3>
        <div className="mt-4">
          <p className="text-red-600">Error loading overview: {error}</p>
        </div>
      </div>
    );
  }

  if (!sources?.length) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg h-full">
        <h3 className="font-semibold">Overview</h3>
        <div className="mt-4 space-y-4">
          <p className="text-gray-600 mb-4">
            {defaultOverview?.overview ||
              "An overview will be created using added sources."}
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Features and Capabilities
              </h4>
              <p className="text-gray-600 text-sm">
                {defaultOverview?.["Features and Capabilities"] ||
                  "What is the customer buying?"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Technical Specifications
              </h4>
              <p className="text-gray-600 text-sm">
                {defaultOverview?.["Technical Specifications"] ||
                  "How is it done?"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Integration Options
              </h4>
              <p className="text-gray-600 text-sm">
                {defaultOverview?.["Integration Options"] ||
                  "How does it scale?"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!filteredSources.length) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg h-[585px] overflow-auto space-y-4 text-sm">
        <h3 className="font-semibold text-lg">Overview</h3>

        <div className="space-y-4">
          <p className="text-gray-600">
            {defaultOverview?.overview ||
              "An overview will be created using added sources."}
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Features and Capabilities
              </h4>
              <p className="text-gray-600 text-sm">
                {defaultOverview?.["Features and Capabilities"] ||
                  "What is the customer buying?"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Technical Specifications
              </h4>
              <p className="text-gray-600 text-sm">
                {defaultOverview?.["Technical Specifications"] ||
                  "How is it done?"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Integration Options
              </h4>
              <p className="text-gray-600 text-sm">
                {defaultOverview?.["Integration Options"] ||
                  "How does it scale?"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-6">
          <p className="text-gray-500 text-center italic">
            Select sources from the left panel to view their overview here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-auto space-y-4 text-sm h-[585px]">
      <h3 className="text-lg font-semibold">
        Overview ({filteredSources.length} selected)
      </h3>

      {filteredSources.map((source) => {
        const sourceId = getSourceId(source);
        const isExpanded = expandedIds.includes(sourceId);
        const content = source.source_content || source.overview || "";
        const shouldTruncate = content.length > 300;
        const identifier = getSourceIdentifier(source);

        return (
          <div
            key={sourceId}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            {/* Source Identifier Card */}
            <SourceIdentifierCard source={source} />

            {/* Source Header - Only show if it's not already shown in identifier card */}
            {identifier.type !== "file" && source.file_name && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {source.file_name}
                </h4>
              </div>
            )}

            {/* Source Content - Only render if content exists */}
            {content && content.trim() && (
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {shouldTruncate && !isExpanded
                    ? content.slice(0, 300) + "..."
                    : content}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => toggleExpand(sourceId)}
                    className="text-blue-500 hover:underline text-xs mt-2 cursor-pointer"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {/* Generated Content */}
            {source.generated_content &&
              renderGeneratedContent(source.generated_content)}
          </div>
        );
      })}
    </div>
  );
}
