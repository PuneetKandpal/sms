"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Target,
  Lightbulb,
  Search,
  Globe,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
  X,
  SquarePlus,
  Expand,
} from "lucide-react";
import { BiCollapseVertical } from "react-icons/bi";
import { BiExpandVertical } from "react-icons/bi";
import Tooltip from "@mui/material/Tooltip";

const SECTIONS = [
  { key: "industries", title: "Industries", icon: Building2, color: "blue" },
  {
    key: "buyer_personas",
    title: "Buyer Personas",
    icon: Users,
    color: "green",
  },
  {
    key: "products_and_services",
    title: "Products & Services",
    icon: Lightbulb,
    color: "purple",
  },
  {
    key: "target_markets",
    title: "Target Markets",
    icon: Target,
    color: "orange",
  },
  {
    key: "differentiators",
    title: "Differentiators",
    icon: Globe,
    color: "red",
  },
  {
    key: "geo_leo_strategy",
    title: "SEO Strategy",
    icon: Search,
    color: "indigo",
  },
];

const COLORS = {
  blue: "bg-blue-50 border-blue-200 text-blue-600",
  green: "bg-green-50 border-green-200 text-green-600",
  purple: "bg-purple-50 border-purple-200 text-purple-600",
  orange: "bg-orange-50 border-orange-200 text-orange-600",
  red: "bg-red-50 border-red-200 text-red-600",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
};

function DataItem({ children, color, onRemove, showRemove = false }) {
  return (
    <div
      className={`${COLORS[color]} rounded px-3 py-2 text-xs font-medium flex items-center justify-between group`}
    >
      <span className="flex-1">{children}</span>
      {showRemove && (
        <button
          onClick={onRemove}
          className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 text-red-600 hover:bg-red-200"
          title="Remove this item"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function DataSection({
  section,
  data,
  expanded,
  onToggle,
  onRemove,
  showRemove = false,
  isSourceData = false,
  pendingCount = 0,
  onPendingIndicatorClick,
  newPsKeyCount,
}) {
  const { key, title, icon: Icon, color } = section;
  const sectionData = data?.[key];

  if (!sectionData) return null;

  const hasOverview = Boolean(sectionData.overview);
  const hasItems = Boolean(sectionData.list?.length);
  const itemCount = sectionData.list?.length || 0;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <button
        onClick={() => onToggle(key)}
        className="flex items-center justify-between w-full text-left hover:bg-gray-50 -m-2 p-2 rounded"
      >
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <h4 className="font-semibold text-gray-800">{title}</h4>
          <div className="flex items-center space-x-2">
            {key === "products_and_services" &&
              typeof sectionData === "object" &&
              !sectionData.list &&
              !sectionData.overview && (
                <>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {Object.keys(sectionData || {}).length} items
                  </span>
                </>
              )}
            {hasOverview && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Overview
              </span>
            )}
            {hasItems && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {itemCount} items
              </span>
            )}
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPendingIndicatorClick &&
                    onPendingIndicatorClick(section.key);
                }}
                className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200 hover:bg-amber-200"
                title="Pending changes — click to review"
              >
                {pendingCount} pending
              </button>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Overview */}
          {hasOverview && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">Overview</h5>
                {showRemove && (
                  <button
                    onClick={() => onRemove(key, "overview")}
                    className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Remove overview"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className={`p-3 rounded-lg ${COLORS[color]} border`}>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {sectionData.overview}
                </p>
              </div>
            </div>
          )}

          {/* List Items */}
          {hasItems && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Items</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sectionData.list.map((item, index) => (
                  <DataItem
                    key={index}
                    color={color}
                    showRemove={showRemove}
                    onRemove={() => onRemove(key, "item", null, null, index)}
                  >
                    {typeof item === "string" ? item : JSON.stringify(item)}
                  </DataItem>
                ))}
              </div>
            </div>
          )}

          {/* Handle SEO Strategy nested data */}
          {key === "geo_leo_strategy" && sectionData.seo_strategy && (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900 mb-2">SEO Strategy</h5>

              {sectionData.seo_strategy.industry_modifiers && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                    Industry Modifiers
                  </h6>
                  <div className="flex flex-wrap gap-1">
                    {sectionData.seo_strategy.industry_modifiers.map(
                      (item, index) => (
                        <DataItem key={index} color={color}>
                          <Tag className="w-3 h-3 mr-1 inline" />
                          {item}
                        </DataItem>
                      )
                    )}
                  </div>
                </div>
              )}

              {sectionData.seo_strategy.location_based_terms && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                    Location Terms
                  </h6>
                  <div className="flex flex-wrap gap-1">
                    {sectionData.seo_strategy.location_based_terms.map(
                      (item, index) => (
                        <DataItem key={index} color={color}>
                          <Tag className="w-3 h-3 mr-1 inline" />
                          {item}
                        </DataItem>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Handle Products & Services nested structure */}
          {key === "products_and_services" &&
            typeof sectionData === "object" &&
            !sectionData.list &&
            !sectionData.overview && (
              <div className="space-y-3">
                {Object.entries(sectionData).map(
                  ([productKey, productData]) => {
                    if (
                      typeof productData === "object" &&
                      productData !== null &&
                      productData.keywords
                    ) {
                      return (
                        <div key={productKey} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="text-sm font-medium text-gray-700 capitalize">
                              {productKey.replace(/_/g, " ")}
                            </h6>
                            {showRemove && !isSourceData && (
                              <button
                                onClick={() =>
                                  onRemove?.(
                                    key,
                                    "product_category",
                                    productKey
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                title="Remove entire category"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {productData.keywords.map((keyword, index) => (
                              <DataItem
                                key={index}
                                color={color}
                                showRemove={showRemove && !isSourceData}
                                onRemove={() =>
                                  onRemove?.(
                                    key,
                                    "product_keyword",
                                    productKey,
                                    keyword,
                                    index
                                  )
                                }
                              >
                                {keyword}
                              </DataItem>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (Array.isArray(productData)) {
                      return (
                        <div key={productKey} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="text-sm font-medium text-gray-700 capitalize">
                              {productKey.replace(/_/g, " ")}
                            </h6>
                            {showRemove && !isSourceData && (
                              <button
                                onClick={() =>
                                  onRemove?.(
                                    key,
                                    "product_category",
                                    productKey
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                title="Remove entire category"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {productData.map((item, index) => (
                              <DataItem
                                key={index}
                                color={color}
                                showRemove={showRemove && !isSourceData}
                                onRemove={() =>
                                  onRemove?.(
                                    key,
                                    "product_keyword",
                                    productKey,
                                    item,
                                    index
                                  )
                                }
                              >
                                {item}
                              </DataItem>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default function CurrentDataSection({
  data,
  title = "Company Overview (Source of Truth)",
  onRemove,
  showRemove = false,
  expandedSections: externalExpandedSections,
  setExpandedSections: externalSetExpandedSections,
  isSourceData = false,
  pendingCountBySection = {},
  onPendingIndicatorClick,
  scrollRef,
  onScroll,
}) {
  // Use external expansion state if provided, otherwise use local state
  const [localExpandedSections, setLocalExpandedSections] = useState({});
  const expandedSections = externalExpandedSections || localExpandedSections;
  const setExpandedSections =
    externalSetExpandedSections || setLocalExpandedSections;

  const handleToggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No company overview available</p>
      </div>
    );
  }

  // Count total items across all sections
  const totalItems = SECTIONS.reduce((count, section) => {
    const sectionData = data[section.key];
    if (!sectionData) return count;

    let sectionCount = 0;
    if (sectionData.overview) sectionCount++;
    if (sectionData.list) sectionCount += sectionData.list.length;

    // Handle nested structures
    if (
      section.key === "products_and_services" &&
      typeof sectionData === "object" &&
      !sectionData.list &&
      !sectionData.overview
    ) {
      Object.values(sectionData).forEach((productData) => {
        if (typeof productData === "object" && productData !== null && productData.keywords) {
          sectionCount += productData.keywords.length;
        } else if (Array.isArray(productData)) {
          sectionCount += productData.length;
        }
      });
    }

    if (section.key === "geo_leo_strategy" && sectionData.seo_strategy) {
      if (sectionData.seo_strategy.industry_modifiers) {
        sectionCount += sectionData.seo_strategy.industry_modifiers.length;
      }
      if (sectionData.seo_strategy.location_based_terms) {
        sectionCount += sectionData.seo_strategy.location_based_terms.length;
      }
    }

    return count + sectionCount;
  }, 0);

  return (
    <div className="bg-gray-50 border border-gray-200 h-[calc(100vh-150px)] relative overflow-hidden rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-gray-100 border-b border-gray-200 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center">
            <button
              onClick={() => {
                // Expand all
                const all = {};
                SECTIONS.forEach((s) => (all[s.key] = true));
                setExpandedSections(all);
              }}
              className="text-gray-500 hover:text-gray-800 scale-105 transition-all duration-300 cursor-pointer p-1"
              title="Expand all sections"
            >
              <Tooltip title="Expand all sections">
                <BiExpandVertical size={16} />
              </Tooltip>
            </button>
            <button
              onClick={() => {
                // Collapse all
                const all = {};
                SECTIONS.forEach((s) => (all[s.key] = false));
                setExpandedSections(all);
              }}
              className="text-gray-500 hover:text-gray-800 scale-105 transition-all duration-300 cursor-pointer p-1"
              title="Collapse all sections"
            >
              <Tooltip title="Collapse all sections">
                <BiCollapseVertical size={16} />
              </Tooltip>
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">{totalItems} total items</div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-auto p-4 space-y-4"
      >
        {/* Overview Section - Show at top if available */}
        {(data.overview || data.Overview) && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-start gap-2">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Overview</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {data.overview || data.Overview}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sections - Independently scrollable */}
        <div className="flex-1 space-y-4">
          {SECTIONS.map((section) => (
            <DataSection
              key={section.key}
              section={section}
              data={data}
              expanded={expandedSections[section.key]}
              onToggle={handleToggleSection}
              onRemove={onRemove}
              showRemove={showRemove}
              isSourceData={isSourceData}
              pendingCount={pendingCountBySection?.[section.key] || 0}
              onPendingIndicatorClick={onPendingIndicatorClick}
              newPsKeyCount={
                section.key === "products_and_services"
                  ? pendingCountBySection?.[section.key]
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
