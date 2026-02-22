"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Target,
  Lightbulb,
  Search,
  Globe,
  Check,
  X,
  AlertCircle,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Tooltip } from "@mui/material";
import { BiCollapseVertical, BiExpandVertical } from "react-icons/bi";

// Define the sections we want to compare
const COMPARISON_SECTIONS = [
  {
    key: "industries",
    title: "Industries",
    icon: Building2,
    colorClass: "blue",
  },
  {
    key: "buyer_personas",
    title: "Buyer Personas",
    icon: Users,
    colorClass: "green",
  },
  {
    key: "products_and_services",
    title: "Products & Services",
    icon: Lightbulb,
    colorClass: "purple",
  },
  {
    key: "target_markets",
    title: "Target Markets",
    icon: Target,
    colorClass: "orange",
  },
  {
    key: "differentiators",
    title: "Differentiators",
    icon: Globe,
    colorClass: "red",
  },
  {
    key: "geo_leo_strategy",
    title: "SEO Strategy",
    icon: Search,
    colorClass: "indigo",
  },
];

// Alias map for section keys coming from backend variations
const SECTION_ALIASES = {
  products_and_services: [
    "products_and_services",
    "product_and_services",
    "product_services",
    "products_services",
    "products-and-services",
    "product-and-services",
    "productsServices",
  ],
};

function resolveCanonicalKey(key) {
  for (const canonical in SECTION_ALIASES) {
    if (SECTION_ALIASES[canonical].includes(key)) return canonical;
  }
  return key;
}

function normalizeData(data) {
  if (!data || typeof data !== "object") return data;
  const normalized = { ...data };

  // Normalize aliases for products_and_services
  const aliasList = SECTION_ALIASES.products_and_services;
  let combinedPAS = null;
  aliasList.forEach((aliasKey) => {
    if (normalized[aliasKey]) {
      const val = normalized[aliasKey];
      // Prefer object merge when possible, fallback to overwrite
      if (combinedPAS === null) {
        combinedPAS =
          Array.isArray(val) || typeof val !== "object" ? val : { ...val };
      } else {
        if (
          typeof combinedPAS === "object" &&
          !Array.isArray(combinedPAS) &&
          typeof val === "object" &&
          !Array.isArray(val)
        ) {
          combinedPAS = { ...combinedPAS, ...val };
        }
      }
      if (aliasKey !== "products_and_services") delete normalized[aliasKey];
    }
  });
  if (combinedPAS !== null) normalized["products_and_services"] = combinedPAS;

  return normalized;
}

// Color mapping for different sections
const colorMap = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    iconText: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-600",
    iconText: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-600",
    iconText: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-600",
    iconText: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    iconText: "text-red-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-600",
    iconText: "text-indigo-600",
  },
};

function ComparisonItem({
  type,
  content,
  isOverview = false,
  sectionKey,
  itemIndex,
  onAccept,
  onReject,
  onRemoveFromNew,
  onRemoveFromOld,
  colorClass,
  decision = null,
  showRemoveFromOld = false,
  isDuplicate = false,
}) {
  const acceptDisabled = isDuplicate;
  const handleAccept = () => {
    if (acceptDisabled) return;
    onAccept(sectionKey, isOverview ? "overview" : "item", content, itemIndex);
  };
  const handleReject = () =>
    onReject(sectionKey, isOverview ? "overview" : itemIndex);

  const handleRemoveFromNew = () =>
    onRemoveFromNew(
      sectionKey,
      isOverview ? "overview" : "item",
      itemIndex,
      content
    );

  const handleRemoveFromOld = () =>
    onRemoveFromOld(
      sectionKey,
      isOverview ? "overview" : "item",
      itemIndex,
      content
    );

  const getTypeLabel = () => {
    if (decision === "accepted") return "ACCEPTED";
    if (decision === "rejected") return "REJECTED";

    switch (type) {
      case "added":
        return "NEW";
      case "removed":
        return "REMOVED";
      case "changed":
        return "CHANGED";
      case "same":
        return "UNCHANGED";
      default:
        return "";
    }
  };

  const getTypeColors = () => {
    if (decision === "accepted")
      return "bg-green-100 text-green-800 border-green-300";
    if (decision === "rejected")
      return "bg-red-100 text-red-800 border-red-300";

    switch (type) {
      case "added":
        return "bg-green-100 text-green-800 border-green-200";
      case "removed":
        return "bg-red-100 text-red-800 border-red-200";
      case "changed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "same":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getBorderColor = () => {
    if (isDuplicate) return "border-amber-500 bg-amber-50 border-2";
    if (decision === "accepted") return "border-green-400 bg-green-50";
    if (decision === "rejected") return "border-red-400 bg-red-50";
    if (type === "same")
      return `${colorMap[colorClass].bg} border ${colorMap[colorClass].border}`;
    return "border-yellow-300 bg-yellow-50";
  };

  // Show unchanged items with simple styling when not duplicate
  if (type === "same" && !isDuplicate) {
    return (
      <div
        className={`p-3 rounded-lg ${colorMap[colorClass].bg} border ${colorMap[colorClass].border}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isOverview ? (
              <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
            ) : (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-800">
                  {Array.isArray(content) ? content.join(", ") : content}
                </span>
              </div>
            )}
          </div>
          <span
            className={`ml-3 px-2 py-1 text-xs font-medium rounded-full border ${getTypeColors()}`}
          >
            {getTypeLabel()}
          </span>
        </div>
      </div>
    );
  }

  // Show completed decisions with success/error styling
  const isCompleted = decision === "accepted" || decision === "rejected";

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${getBorderColor()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          {isOverview ? (
            <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
          ) : (
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {Array.isArray(content) ? content.join(", ") : content}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isDuplicate ? (
            <div className="flex items-center px-2 py-1 bg-amber-100 border border-amber-300 rounded-full">
              <AlertTriangle className="w-3 h-3 text-amber-600 mr-1" />
              <span className="text-xs font-medium text-amber-800">
                DUPLICATE
              </span>
            </div>
          ) : (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColors()}`}
            >
              {getTypeLabel()}
            </span>
          )}

          {!isCompleted && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleAccept}
                disabled={acceptDisabled}
                className={`p-1 rounded cursor-pointer transition-colors border ${
                  acceptDisabled
                    ? "bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                    : "bg-white text-green-600 hover:bg-green-50 border-green-300"
                }`}
                title={
                  acceptDisabled
                    ? "Duplicate: remove from Company Overview to accept"
                    : "Accept this change"
                }
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleRemoveFromNew}
                className="p-1 rounded cursor-pointer transition-colors bg-white text-red-600 hover:bg-red-50 border border-red-300"
                title="Reject this change"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center space-x-1">
              {decision === "accepted" ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-600" />
              )}
              {showRemoveFromOld && decision === "accepted" && (
                <button
                  onClick={handleRemoveFromOld}
                  className="p-1 rounded transition-colors bg-white text-red-600 hover:bg-red-50 border border-red-300"
                  title="Remove from the company overview"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonSection({
  section,
  oldData,
  newData,
  decisions,
  expanded,
  onToggle,
  onAcceptChange,
  onRejectChange,
  onRemoveFromNew,
  onRemoveFromOld,
  duplicateItems = [],
}) {
  const { key, title, icon: Icon, colorClass } = section;

  const oldSection = oldData?.[key];
  const newSection = newData?.[key];

  // console.log("key", key);
  // console.log("newSection", newSection);
  // console.log("oldSection", oldSection);

  // console.log("oldData", oldData);
  // console.log("newData", newData);

  // Helper function to check if an item is duplicate
  const isDuplicate = (content, type) => {
    return duplicateItems.some(
      (dup) =>
        dup.sectionKey === key &&
        dup.type === type &&
        (typeof content === "string"
          ? dup.content === content || dup.item === content
          : JSON.stringify(dup.content || dup.item) === JSON.stringify(content))
    );
  };

  // Skip section if no new data exists or section is an empty object (no changes to show)
  if (!newSection) return null;
  if (
    typeof newSection === "object" &&
    !Array.isArray(newSection) &&
    Object.keys(newSection).length === 0
  ) {
    return null;
  }

  // Count pending and completed changes
  let pendingCount = 0;
  let completedCount = 0;

  // Check overview changes
  if (newSection.overview !== oldSection?.overview && newSection.overview) {
    const decisionKey = `${key}_overview`;
    if (decisions[decisionKey]) {
      completedCount++;
    } else {
      pendingCount++;
    }
  }

  // Check list changes
  if (newSection.list && Array.isArray(newSection.list)) {
    const oldList = oldSection?.list || [];
    const newList = newSection.list;
    const oldSet = new Set(oldList);

    newList.forEach((item, index) => {
      if (!oldSet.has(item)) {
        const decisionKey = `${key}_${index}_${item}`;
        if (decisions[decisionKey]) {
          completedCount++;
        } else {
          pendingCount++;
        }
      }
    });
  }

  // const totalChanges = pendingCount + completedCount;
  // if (totalChanges === 0) return null;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <button
        onClick={() => onToggle(key)}
        className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
      >
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${colorMap[colorClass].iconText}`} />
          <h4 className="font-semibold text-gray-800">{title}</h4>
          {key === "products_and_services" &&
            newSection &&
            typeof newSection === "object" &&
            !newSection.list &&
            !newSection.overview &&
            (() => {
              const pasCount = Object.keys(newSection || {}).length;
              return pasCount > 0 ? (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {pasCount} pending
                </span>
              ) : null;
            })()}
          {pendingCount > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              {pendingCount} pending
            </span>
          )}
          {completedCount > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {completedCount} completed
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Overview Comparison */}
          {newSection.overview &&
            newSection.overview !== oldSection?.overview && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                  Overview (Pending Change)
                </h5>

                {/* Show current (old) version */}
                {oldSection?.overview && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Current:
                    </div>
                    <div
                      className={`p-3 rounded-lg ${colorMap[colorClass].bg} border ${colorMap[colorClass].border}`}
                    >
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {oldSection.overview}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show new version */}
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Proposed:
                </div>
                <ComparisonItem
                  type="changed"
                  content={newSection.overview}
                  isOverview={true}
                  sectionKey={key}
                  onAccept={onAcceptChange}
                  onReject={onRejectChange}
                  onRemoveFromNew={onRemoveFromNew}
                  onRemoveFromOld={onRemoveFromOld}
                  colorClass={colorClass}
                  decision={decisions[`${key}_overview`]}
                  showRemoveFromOld={true}
                  isDuplicate={isDuplicate(newSection.overview, "overview")}
                />
              </div>
            )}

          {/* List Comparison */}
          {newSection.list && Array.isArray(newSection.list) && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Items</h5>

              {/* Show current items */}
              {oldSection?.list && oldSection.list.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    Current items:
                  </div>
                  <div
                    className={`p-3 rounded-lg ${colorMap[colorClass].bg} border ${colorMap[colorClass].border}`}
                  >
                    <div className="space-y-1">
                      {oldSection.list.map((item, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          •{" "}
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Show new/changed items */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Proposed new items:
                </div>
                {newSection.list.map((item, index) => {
                  const itemText =
                    typeof item === "string" ? item : JSON.stringify(item);
                  const oldList = oldSection?.list || [];
                  const isNew = !oldList.some((oldItem) => {
                    const oldItemText =
                      typeof oldItem === "string"
                        ? oldItem
                        : JSON.stringify(oldItem);
                    return oldItemText === itemText;
                  });

                  // Show all items including duplicates, but don't show truly unchanged items
                  if (!isNew && !isDuplicate(itemText, "item")) return null;

                  return (
                    <ComparisonItem
                      key={`new_${index}`}
                      type="added"
                      content={itemText}
                      isOverview={false}
                      sectionKey={key}
                      itemIndex={index}
                      onAccept={onAcceptChange}
                      onReject={onRejectChange}
                      onRemoveFromNew={onRemoveFromNew}
                      onRemoveFromOld={onRemoveFromOld}
                      colorClass={colorClass}
                      decision={decisions[`${key}_${index}_${itemText}`]}
                      showRemoveFromOld={true}
                      isDuplicate={isDuplicate(itemText, "item")}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Handle Products & Services nested structure */}
          {key == "products_and_services" && (
            <div className="space-y-4">
              {(() => {
                const newKeys = Object.keys(newSection);
                const oldKeys = Object.keys(oldSection || {});

                // Keys present in new but not in old => whole key is NEW
                const addedKeys = newKeys.filter((k) => !oldKeys.includes(k));
                // Keys present in both
                const commonKeys = newKeys.filter((k) => oldKeys.includes(k));

                return (
                  <>
                    {/* Entirely new product keys: propose accepting whole list */}
                    {addedKeys.map((productKey) => {
                      const productData = newSection[productKey];
                      const newKeywords = Array.isArray(productData)
                        ? productData
                        : productData?.keywords || [];

                      if (!newKeywords.length) return null;

                      return (
                        <div
                          key={`added_${productKey}`}
                          className="border border-purple-300 rounded-lg p-3 bg-purple-50/40"
                        >
                          <h6 className="text-sm font-medium text-gray-800 mb-2 capitalize">
                            {productKey.replace(/_/g, " ")} (New Category)
                          </h6>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            Proposed keywords (accepting ✓ will add the entire
                            list):
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {newKeywords.map((kw, i) => (
                              <div
                                key={i}
                                className="text-xs bg-white px-2 py-1 rounded border border-purple-200"
                              >
                                {kw}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                // Accept entire category: add to oldData using product key
                                onAcceptChange(
                                  key,
                                  "product_category",
                                  productKey,
                                  newKeywords
                                );
                              }}
                              className="px-3 py-1.5 text-xs rounded-lg border border-green-300 bg-white text-green-700 hover:bg-green-50 font-medium transition-colors"
                              title="Accept entire category"
                            >
                              ✓ Accept All
                            </button>
                            <button
                              onClick={() => {
                                // Reject entire category from newData
                                onRemoveFromNew(
                                  key,
                                  "product_category",
                                  productKey,
                                  null
                                );
                              }}
                              className="px-3 py-1.5 text-xs rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 font-medium transition-colors"
                              title="Reject entire category"
                            >
                              ✗ Reject All
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Common product keys: compare keyword lists */}
                    {commonKeys.map((productKey) => {
                      const productNew = newSection[productKey];
                      const productOld = oldSection?.[productKey];
                      const newKeywords = Array.isArray(productNew)
                        ? productNew
                        : productNew?.keywords || [];
                      const oldKeywords = Array.isArray(productOld)
                        ? productOld
                        : productOld?.keywords || [];

                      const oldSet = new Set(oldKeywords);
                      const onlyNew = newKeywords.filter(
                        (kw) => !oldSet.has(kw)
                      );
                      const duplicateKeywords = newKeywords.filter((kw) =>
                        oldSet.has(kw)
                      );

                      // Show section if there are new items OR duplicates
                      if (
                        onlyNew.length === 0 &&
                        duplicateKeywords.length === 0
                      )
                        return null;

                      return (
                        <div
                          key={`common_${productKey}`}
                          className="border border-purple-200 rounded-lg p-3"
                        >
                          <h6 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                            {productKey.replace(/_/g, " ")}
                          </h6>

                          {/* Show old keywords */}
                          {oldKeywords.length > 0 && (
                            <div className="mb-2">
                              <div className="text-xs font-medium text-gray-500 mb-1">
                                Current keywords:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {oldKeywords.map((kw, i) => (
                                  <div
                                    key={i}
                                    className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded"
                                  >
                                    {kw}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Propose new keywords for accept/reject */}
                          {onlyNew.length > 0 && (
                            <>
                              <div className="text-xs font-medium text-gray-500 mb-1">
                                Proposed new keywords:
                              </div>
                              <div className="space-y-1">
                                {onlyNew.map((keyword, index) => (
                                  <ComparisonItem
                                    key={`product_${productKey}_${index}`}
                                    type="added"
                                    content={keyword}
                                    isOverview={false}
                                    sectionKey={key}
                                    itemIndex={productKey}
                                    onAccept={(sKey, fType, content, itemIdx) =>
                                      onAcceptChange(
                                        sKey,
                                        "product_keyword",
                                        content,
                                        itemIdx
                                      )
                                    }
                                    onReject={onRejectChange}
                                    onRemoveFromNew={(
                                      sKey,
                                      fType,
                                      itemIdx,
                                      content
                                    ) =>
                                      onRemoveFromNew(
                                        sKey,
                                        "product_keyword",
                                        itemIdx,
                                        content
                                      )
                                    }
                                    onRemoveFromOld={onRemoveFromOld}
                                    colorClass={colorClass}
                                    decision={
                                      decisions[
                                        `${key}_${productKey}_${index}_${keyword}`
                                      ]
                                    }
                                    showRemoveFromOld={true}
                                    isDuplicate={isDuplicate(
                                      keyword,
                                      "product"
                                    )}
                                  />
                                ))}
                              </div>
                            </>
                          )}

                          {/* Show duplicate keywords with highlighting */}
                          {duplicateKeywords.length > 0 && (
                            <>
                              <div className="text-xs font-medium text-gray-500 mb-1 mt-3">
                                Duplicate keywords (already exist in current
                                data):
                              </div>
                              <div className="space-y-1">
                                {duplicateKeywords.map((keyword, index) => (
                                  <ComparisonItem
                                    key={`duplicate_${productKey}_${index}`}
                                    type="added"
                                    content={keyword}
                                    isOverview={false}
                                    sectionKey={key}
                                    itemIndex={productKey}
                                    onAccept={(sKey, fType, content, itemIdx) =>
                                      onAcceptChange(
                                        sKey,
                                        "product_keyword",
                                        content,
                                        itemIdx
                                      )
                                    }
                                    onReject={onRejectChange}
                                    onRemoveFromNew={(
                                      sKey,
                                      fType,
                                      itemIdx,
                                      content
                                    ) =>
                                      onRemoveFromNew(
                                        sKey,
                                        "product_keyword",
                                        itemIdx,
                                        content
                                      )
                                    }
                                    onRemoveFromOld={onRemoveFromOld}
                                    colorClass={colorClass}
                                    decision={
                                      decisions[
                                        `${key}_${productKey}_${
                                          onlyNew.length + index
                                        }_${keyword}`
                                      ]
                                    }
                                    showRemoveFromOld={true}
                                    isDuplicate={true} // Always mark as duplicate
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SourceComparisonView({
  oldData,
  newData,
  title,
  onMergeChange,
  onPublish,
  onReset,
  onRemoveFromOld,
  onRemoveFromNew,
  onAcceptChange,
  duplicateItems = [],
  expandedSections: externalExpandedSections,
  setExpandedSections: externalSetExpandedSections,
}) {
  // Normalize incoming data once per change
  const normalizedOld = useMemo(() => normalizeData(oldData), [oldData]);
  const normalizedNew = useMemo(() => normalizeData(newData), [newData]);

  // Use external expansion state if provided, otherwise use local state
  const [localExpandedSections, setLocalExpandedSections] = useState({});
  const expandedSections = externalExpandedSections || localExpandedSections;
  const setExpandedSections =
    externalSetExpandedSections || setLocalExpandedSections;
  const [mergedOldData, setMergedOldData] = useState(normalizedOld);
  const [mergedNewData, setMergedNewData] = useState(normalizedNew);
  const [decisions, setDecisions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Keep merged data in sync when props change
  useEffect(() => {
    setMergedOldData(normalizedOld);
  }, [normalizedOld]);
  useEffect(() => {
    setMergedNewData(normalizedNew);
  }, [normalizedNew]);

  // Check if there are any pending changes
  const hasPendingChanges =
    mergedNewData &&
    Object.keys(mergedNewData).some((key) => {
      if (
        key.startsWith("_") ||
        key === "created_at" ||
        key === "project_id" ||
        key === "source_id" ||
        key === "document_type" ||
        key === "document_id" ||
        key === "base_data"
      ) {
        return false;
      }
      const canonical = resolveCanonicalKey(key);
      const sectionExists = COMPARISON_SECTIONS.some(
        (section) => section.key === canonical
      );
      if (!sectionExists) return false;
      const sectionData = mergedNewData[key];
      if (
        sectionData &&
        typeof sectionData === "object" &&
        !Array.isArray(sectionData) &&
        Object.keys(sectionData).length === 0
      ) {
        return false; // ignore empty section objects
      }
      return true;
    });

  // Count total changes by status
  const changeCounts = COMPARISON_SECTIONS.reduce(
    (counts, section) => {
      const newSection = mergedNewData?.[section.key];
      if (!newSection) return counts;

      // Count overview changes
      if (
        newSection.overview &&
        newSection.overview !== mergedOldData?.[section.key]?.overview
      ) {
        const decisionKey = `${section.key}_overview`;
        const decision = decisions[decisionKey];
        if (decision === "accepted") counts.accepted++;
        else if (decision === "rejected") counts.rejected++;
        else counts.pending++;
      }

      // Count list changes
      if (newSection.list) {
        const oldList = mergedOldData?.[section.key]?.list || [];
        const newList = newSection.list;
        const oldSet = new Set(oldList);

        newList.forEach((item, index) => {
          if (!oldSet.has(item)) {
            const decisionKey = `${section.key}_${index}_${item}`;
            const decision = decisions[decisionKey];
            if (decision === "accepted") counts.accepted++;
            else if (decision === "rejected") counts.rejected++;
            else counts.pending++;
          }
        });
      }

      return counts;
    },
    { pending: 0, accepted: 0, rejected: 0 }
  );

  const {
    pending: totalPendingChanges,
    accepted: acceptedChanges,
    rejected: rejectedChanges,
  } = changeCounts;

  const hasDecisions = acceptedChanges > 0 || rejectedChanges > 0;

  const lastPayloadRef = useRef(null);
  useEffect(() => {
    setHasChanges(hasPendingChanges);
    if (onMergeChange) {
      const payload = {
        oldData: mergedOldData,
        newData: mergedNewData,
        decisions: decisions,
        hasChanges: hasPendingChanges,
        pending: totalPendingChanges,
        accepted: acceptedChanges,
        rejected: rejectedChanges,
      };
      const prev = lastPayloadRef.current;
      const currStr = JSON.stringify(payload);
      if (!prev || prev !== currStr) {
        lastPayloadRef.current = currStr;
        onMergeChange(payload);
      }
    }
  }, [
    mergedOldData,
    mergedNewData,
    decisions,
    hasPendingChanges,
    totalPendingChanges,
    acceptedChanges,
    rejectedChanges,
  ]);

  const handleToggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleAcceptChange = (
    sectionKey,
    fieldType,
    content,
    itemIndex = null
  ) => {
    const decisionKey = `${sectionKey}_${fieldType}${
      typeof fieldType === "number" ? `_${content}` : ""
    }`;
    const newDecisions = { ...decisions, [decisionKey]: "accepted" };
    setDecisions(newDecisions);

    // Apply the change to merged data for final result
    const newOldData = { ...mergedOldData };
    if (!newOldData[sectionKey]) {
      newOldData[sectionKey] = {};
    }

    if (fieldType === "overview") {
      newOldData[sectionKey].overview = content;
    } else if (fieldType === "product_category") {
      // Handle entire product category acceptance
      const productKey = content; // content is productKey in this case
      const keywords = itemIndex; // itemIndex is keywords array in this case
      if (!newOldData[sectionKey][productKey]) {
        newOldData[sectionKey][productKey] = { keywords: [] };
      }
      // Add all keywords to the product category
      const existingKeywords =
        newOldData[sectionKey][productKey].keywords || [];
      const allKeywords = [...new Set([...existingKeywords, ...keywords])];
      newOldData[sectionKey][productKey].keywords = allKeywords;
    } else if (fieldType === "product_keyword") {
      // Handle individual product keyword acceptance
      const productKey = itemIndex; // itemIndex is productKey in this case
      const keyword = content; // content is the keyword
      if (!newOldData[sectionKey][productKey]) {
        newOldData[sectionKey][productKey] = { keywords: [] };
      }
      const existingKeywords =
        newOldData[sectionKey][productKey].keywords || [];
      if (!existingKeywords.includes(keyword)) {
        newOldData[sectionKey][productKey].keywords = [
          ...existingKeywords,
          keyword,
        ];
      }
    } else {
      const currentList = newOldData[sectionKey].list || [];
      if (!currentList.includes(content)) {
        newOldData[sectionKey].list = [...currentList, content];
      }
    }

    setMergedOldData(newOldData);

    // Call the parent's onAcceptChange to remove from newData
    if (onAcceptChange) {
      onAcceptChange(sectionKey, fieldType, itemIndex, content);
    }
  };

  const handleRejectChange = (sectionKey, fieldType, content) => {
    const decisionKey = `${sectionKey}_${fieldType}${
      typeof fieldType === "number" ? `_${content}` : ""
    }`;
    const newDecisions = { ...decisions, [decisionKey]: "rejected" };
    setDecisions(newDecisions);
  };

  const handleRemoveFromOldData = (sectionKey, fieldType, itemIndex = null) => {
    const newOldData = { ...mergedOldData };

    if (fieldType === "overview") {
      if (newOldData[sectionKey]) {
        delete newOldData[sectionKey].overview;
        if (
          !newOldData[sectionKey].list ||
          newOldData[sectionKey].list.length === 0
        ) {
          delete newOldData[sectionKey];
        }
      }
    } else if (fieldType === "item" && itemIndex !== null) {
      if (newOldData[sectionKey]?.list) {
        newOldData[sectionKey].list = newOldData[sectionKey].list.filter(
          (_, index) => index !== itemIndex
        );
        if (newOldData[sectionKey].list.length === 0) {
          delete newOldData[sectionKey].list;
          if (!newOldData[sectionKey].overview) {
            delete newOldData[sectionKey];
          }
        }
      }
    }

    setMergedOldData(newOldData);

    if (onRemoveFromOld) {
      onRemoveFromOld(newOldData);
    }
  };

  const handleRemoveFromNewData = (
    sectionKey,
    fieldType,
    itemIndex = null,
    content = null
  ) => {
    const newNewData = { ...mergedNewData };

    if (fieldType === "overview") {
      if (newNewData[sectionKey]) {
        delete newNewData[sectionKey].overview;
        if (
          !newNewData[sectionKey].list ||
          newNewData[sectionKey].list.length === 0
        ) {
          delete newNewData[sectionKey];
        }
      }
    } else if (fieldType === "product_category") {
      // Remove entire product category from newData
      const productKey = itemIndex; // itemIndex is productKey in this case
      if (newNewData[sectionKey] && newNewData[sectionKey][productKey]) {
        delete newNewData[sectionKey][productKey];
        // If no more product keys, delete the entire section
        if (Object.keys(newNewData[sectionKey]).length === 0) {
          delete newNewData[sectionKey];
        }
      }
    } else if (fieldType === "product_keyword") {
      // Remove individual product keyword from newData
      const productKey = itemIndex; // itemIndex is productKey in this case
      const keyword = content; // content is the keyword
      if (newNewData[sectionKey] && newNewData[sectionKey][productKey]) {
        const productData = newNewData[sectionKey][productKey];
        if (Array.isArray(productData)) {
          // Handle direct array structure
          newNewData[sectionKey][productKey] = productData.filter(
            (kw) => kw !== keyword
          );
          if (newNewData[sectionKey][productKey].length === 0) {
            delete newNewData[sectionKey][productKey];
          }
        } else if (productData.keywords) {
          // Handle object with keywords array structure
          productData.keywords = productData.keywords.filter(
            (kw) => kw !== keyword
          );
          if (productData.keywords.length === 0) {
            delete newNewData[sectionKey][productKey];
          }
        }
        // If no more product keys, delete the entire section
        if (Object.keys(newNewData[sectionKey]).length === 0) {
          delete newNewData[sectionKey];
        }
      }
    } else if (fieldType === "item" && content) {
      if (newNewData[sectionKey]?.list) {
        newNewData[sectionKey].list = newNewData[sectionKey].list.filter(
          (item) => item !== content
        );
        if (newNewData[sectionKey].list.length === 0) {
          delete newNewData[sectionKey].list;
          if (!newNewData[sectionKey].overview) {
            delete newNewData[sectionKey];
          }
        }
      }
    }

    setMergedNewData(newNewData);

    if (onRemoveFromNew) {
      onRemoveFromNew(newNewData);
    }
  };

  if (!hasPendingChanges) {
    return (
      <div className="flex items-center justify-center h-[calc(68vh)]">
        <div className="text-center">
          <div>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Pending Changes
            </h3>
          </div>
          <p className="text-gray-600">
            All sources are up to date. No changes need to be reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col">
      {/* Header - similar to Current Data Section */}
      <div className="flex items-center justify-between px-4 py-4 bg-gray-100 border-b border-gray-200 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Expand all
                const all = {};
                COMPARISON_SECTIONS.forEach((s) => (all[s.key] = true));
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
                COMPARISON_SECTIONS.forEach((s) => (all[s.key] = false));
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
        <div className="flex items-center space-x-4 text-sm">
          {totalPendingChanges > 0 && (
            <span className="text-yellow-600 font-medium">
              {totalPendingChanges} pending
            </span>
          )}
          {acceptedChanges > 0 && (
            <span className="text-green-600 font-medium">
              {acceptedChanges} accepted
            </span>
          )}
          {rejectedChanges > 0 && (
            <span className="text-red-600 font-medium">
              {rejectedChanges} rejected
            </span>
          )}
        </div>
      </div>

      {/* Content area - Independently scrollable */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Source Overview - Show at top if available in new data */}
        {(mergedNewData?.overview || mergedNewData?.Overview) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">
                  Source Overview (New Data)
                </h4>
                <p className="text-sm text-green-800 leading-relaxed">
                  {mergedNewData.overview || mergedNewData.Overview}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning about pending changes */}
        {totalPendingChanges > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Review Required
                </h4>
                <p className="text-sm text-blue-700">
                  Please review each change below. Accept (✓) the changes you
                  want to keep or reject (✗) the ones you don't want. Once all
                  changes are reviewed, you can publish the updates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Sections */}
        {COMPARISON_SECTIONS.map((section) => (
          <ComparisonSection
            key={section.key}
            section={section}
            oldData={mergedOldData}
            newData={mergedNewData}
            decisions={decisions}
            expanded={expandedSections[section.key]}
            onToggle={handleToggleSection}
            onAcceptChange={handleAcceptChange}
            onRejectChange={handleRejectChange}
            onRemoveFromNew={handleRemoveFromNewData}
            onRemoveFromOld={handleRemoveFromOldData}
            duplicateItems={duplicateItems}
          />
        ))}
      </div>
    </div>
  );
}
