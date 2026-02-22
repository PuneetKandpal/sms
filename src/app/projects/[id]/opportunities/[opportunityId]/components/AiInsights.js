"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, Brain, Sparkles } from "lucide-react";

export default function AIInsights({ aiFiltering, blogArticleRecommendation }) {
  if (!aiFiltering) return null;

  const relevanceScore = aiFiltering.ai_relevance_score || 0;
  const relevanceReason =
    aiFiltering.ai_relevance_reason || "No reason provided.";
  const keyInsights = aiFiltering.ai_key_insights || "No insights available.";

  const blogTopic = blogArticleRecommendation?.topic;
  const blogBrief = blogArticleRecommendation?.content_brief;

  // Define score color scale
  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-600 border-emerald-300 bg-emerald-50";
    if (score >= 5) return "text-amber-600 border-amber-300 bg-amber-50";
    return "text-rose-600 border-rose-300 bg-rose-50";
  };

  const scoreColorClass = getScoreColor(relevanceScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 rounded-2xl p-6 mb-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center mb-6 space-x-3">
        <Sparkles className="text-sky-500 w-6 h-6" />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          AI Analysis & Insights
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Relevance Assessment Card */}
        <motion.div
          whileHover={{ scale: 1.001 }}
          className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border-l-4 border-blue-500 p-5 flex flex-col justify-between transition-transform"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Brain className="text-blue-600 w-5 h-5" />
              <h3 className="text-lg font-semibold text-blue-700">
                Relevance Assessment
              </h3>
            </div>
            <div
              className={`px-3 py-1 rounded-lg text-sm font-semibold border ${scoreColorClass}`}
            >
              {relevanceScore} / 10
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {relevanceReason}
          </p>
        </motion.div>

        {/* Key Strategic Insights */}
        <motion.div
          whileHover={{ scale: 1.001 }}
          className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border-l-4 border-emerald-500 p-5 flex flex-col justify-between transition-transform"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="text-emerald-600 w-5 h-5" />
            <h3 className="text-lg font-semibold text-emerald-700">
              Key Strategic Insights
            </h3>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-slate-700 text-sm leading-relaxed">
            {keyInsights}
          </div>
        </motion.div>

        {blogArticleRecommendation && (
          <motion.div
            whileHover={{ scale: 1.001 }}
            className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border-l-4 border-purple-500 p-5 flex flex-col justify-between transition-transform"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="text-purple-600 w-5 h-5" />
              <h3 className="text-lg font-semibold text-purple-700">
                Blog Article Recommendation
              </h3>
            </div>

            <div className="space-y-5">
              {blogTopic && (
                <div>
                  <p className="text-xs tracking-[0.2em] text-purple-500">Topic</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {blogTopic}
                  </p>
                </div>
              )}

              {blogBrief && (
                <div>
                  <p className="text-xs tracking-[0.2em] text-purple-500">Content details</p>
                  <div className="mt-3 space-y-4 text-sm text-slate-700 pl-4 border-l-2 border-purple-100">
                    {blogBrief.target_audience && (
                      <div className="bg-white/70 rounded-md p-3 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500">
                          Target audience
                        </p>
                        <p className="mt-1 text-slate-900">{blogBrief.target_audience}</p>
                      </div>
                    )}

                    {blogBrief.primary_problem && (
                      <div className="bg-white/70 rounded-md p-3 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500">
                          Primary problem
                        </p>
                        <p className="mt-1 text-slate-900">{blogBrief.primary_problem}</p>
                      </div>
                    )}

                    {Array.isArray(blogBrief.key_takeaways) &&
                      blogBrief.key_takeaways.length > 0 && (
                        <div className="bg-white/70 rounded-md p-3 shadow-sm">
                          <p className="text-xs font-semibold tracking-wide text-slate-500">
                            Key takeaways
                          </p>
                          <div className="mt-2 bg-purple-50 border border-purple-200 p-3 rounded-lg">
                            <ul className="list-disc ml-4 space-y-1 text-slate-900">
                              {blogBrief.key_takeaways.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    {Array.isArray(blogBrief.suggested_sections) &&
                      blogBrief.suggested_sections.length > 0 && (
                        <div className="bg-white/70 rounded-md p-3 shadow-sm">
                          <p className="text-xs font-semibold tracking-wide text-slate-500">
                            Suggested sections
                          </p>
                          <div className="mt-2 bg-purple-50 border border-purple-200 p-3 rounded-lg">
                            <ul className="list-disc ml-4 space-y-1 text-slate-900">
                              {blogBrief.suggested_sections.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    {blogBrief.evidence_from_post && (
                      <div className="bg-white/70 rounded-md p-3 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500">
                          Evidence from post
                        </p>
                        <div className="mt-2 bg-purple-50 border border-purple-200 p-3 rounded-lg leading-relaxed text-slate-900">
                          {blogBrief.evidence_from_post}
                        </div>
                      </div>
                    )}

                    {blogBrief.company_expertise_angle && (
                      <div className="bg-white/70 rounded-md p-3 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500">
                          Company expertise angle
                        </p>
                        <div className="mt-2 bg-purple-50 border border-purple-200 p-3 rounded-lg leading-relaxed text-slate-900">
                          {blogBrief.company_expertise_angle}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
