"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Target,
  Globe,
  Calendar,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

export default function AnalysisList({
  analyses,
  selectedAnalysisId,
  onSelectAnalysis,
}) {
  const [expandedCards, setExpandedCards] = useState({});

  // Auto-expand when a new analysis is selected
  useEffect(() => {
    if (selectedAnalysisId) {
      setExpandedCards((prev) => ({
        ...prev,
        [selectedAnalysisId]: true,
      }));
    }
  }, [selectedAnalysisId]);

  const toggleExpand = (e, analysisId) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({
      ...prev,
      [analysisId]: !prev[analysisId],
    }));
  };

  const getCompetitorTypeColor = (type) => {
    const typeColors = {
      "Direct Competitor": "bg-red-100 text-red-700 border-red-200",
      "Budget / Price-Based Competitors":
        "bg-orange-100 text-orange-700 border-orange-200",
      "Indirect Competitor": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Alternative Solution": "bg-blue-100 text-blue-700 border-blue-200",
      Main: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return typeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getSourceIcon = (sourceType) => {
    if (sourceType === "website") return <Globe className="w-3 h-3" />;
    return <Target className="w-3 h-3" />;
  };

  return (
    <div className="space-y-2 p-3">
      {analyses.map((analysis, index) => {
        const isSelected = selectedAnalysisId === analysis.analysis_id;
        const isExpanded = expandedCards[analysis.analysis_id];

        return (
          <motion.div
            key={analysis.analysis_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            whileHover={{ scale: 1.01 }}
            className={`
              rounded-lg border transition-all duration-200 overflow-hidden
              ${
                isSelected
                  ? "bg-purple-50 border-purple-300 shadow-md ring-1 ring-purple-200"
                  : "bg-white border-gray-200 hover:border-purple-200 hover:shadow-sm"
              }
            `}
          >
            <div
              onClick={() => onSelectAnalysis(analysis)}
              className="w-full text-left px-3 py-2.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold truncate ${
                      isSelected ? "text-purple-900" : "text-gray-900"
                    }`}
                  >
                    {analysis.analysis_title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-600 truncate">
                      {analysis.competitor_name}
                    </span>
                    {analysis.created_at && (
                      <span className="text-[10px] text-gray-400">
                        • {format(new Date(analysis.created_at), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <motion.button
                    onClick={(e) => toggleExpand(e, analysis.analysis_id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-1 rounded-md transition-colors ${
                      isSelected ? "hover:bg-purple-200" : "hover:bg-gray-100"
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-purple-600" : "text-gray-400"
                        }`}
                      />
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200">
                    {/* Competitor Type Badge */}
                    {analysis.competitor_type && (
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.05 }}
                      >
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getCompetitorTypeColor(
                            analysis.competitor_type
                          )}`}
                        >
                          <Target className="w-2.5 h-2.5" />
                          {analysis.competitor_type}
                        </span>
                      </motion.div>
                    )}

                    {/* Source Info */}
                    {analysis.competitor_source && (
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                            isSelected
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getSourceIcon(analysis.competitor_source_type)}
                          <span className="font-medium truncate max-w-[250px]">
                            {analysis.competitor_source}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Company Name */}
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="flex items-center gap-1.5 text-[10px] text-gray-500"
                    >
                      <Building className="w-3 h-3" />
                      <span>{analysis.company_name}</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
