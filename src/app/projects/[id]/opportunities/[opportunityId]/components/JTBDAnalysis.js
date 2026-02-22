"use client";

import React from "react";

export default function JTBDAnalysis({ opportunity }) {
  const jtbdAnalysis = opportunity?.jtbd_analysis || {};

  const jtbdItems = [
    {
      question: "What job is the customer trying to get done?",
      answer: jtbdAnalysis.job_to_be_done || "Not specified",
    },
    {
      question: "What outcomes are they trying to achieve?",
      answer: jtbdAnalysis.outcomes_desired || "Not specified",
    },
    {
      question: "What's preventing them from success?",
      answer: jtbdAnalysis.barriers_to_success || "Not specified",
    },
    {
      question: "What alternatives are they considering?",
      answer: jtbdAnalysis.alternatives_considered || "Not specified",
    },
    {
      question: "What's their timeline for change?",
      answer: jtbdAnalysis.timeline || "Not specified",
    },
    {
      question: "Who else is involved in the decision?",
      answer: jtbdAnalysis.decision_makers || "Not specified",
    },
    {
      question: "What would success look like?",
      answer: jtbdAnalysis.success_criteria || "Not specified",
    },
  ];

  return (
    <div className="mx-auto bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🎯 Jobs-to-be-Done Analysis
      </h2>

      <div className="flex flex-col gap-4">
        {jtbdItems.map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 p-4 rounded-lg border-l-4 border-sky-600"
          >
            <h3 className="text-gray-800 font-semibold mb-1 text-base">
              {item.question}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
