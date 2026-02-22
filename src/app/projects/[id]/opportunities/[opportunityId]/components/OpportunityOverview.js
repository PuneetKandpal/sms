"use client";

import React, { useEffect, useState, useRef } from "react";
import { formatNumber } from "../../../../../../utils/dateUtils";
import AnimatedCircularProgress from "./CircularProgress";

const getJourneyStage = (stage) => {
  const stages = ["Awareness", "Consideration", "Decision"];
  const currentIndex = stages.findIndex((s) =>
    s.toLowerCase().includes(stage?.toLowerCase())
  );

  return stages.map((name, index) => ({
    name,
    active: index === currentIndex,
  }));
};

export default function OpportunityOverview({ opportunity }) {
  const assessment = opportunity?.assessment || {};
  const authorInfo = opportunity?.reddit_data?.author_info || {};
  const subredditInfo = opportunity?.reddit_data?.subreddit_info || {};
  const metrics = opportunity?.reddit_data?.opportunity_metrics || {};
  const assessments = assessment.assessments || [];
  const overallScore = assessment.overall_score || 0;
  const [expanded, setExpanded] = useState(false);

  const detailsRef = useRef(null); // 👈 scroll target ref

  const journeyStage = assessment.customer_journey_stage || "Consideration";
  const journeyStages = getJourneyStage(journeyStage);

  const guidelines = subredditInfo.public_description || "";
  const description = subredditInfo.description || "";
  const shortGuidelines = guidelines.split(" ").slice(0, 5).join(" ");
  const shortDescription = description.split(" ").slice(0, 5).join(" ");
  const hasMoreGuidelines = guidelines.split(" ").length > 5;
  const hasMoreDescription = description.split(" ").length > 5;

  // 👇 Smooth scroll to expanded breakdown
  useEffect(() => {
    if (expanded && detailsRef.current) {
      detailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [expanded]);

  return (
    <div className="my-4 animate-fadeIn">
      {/* --- Top Summary Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4">
        {/* Author Profile */}
        <Card
          title="Author Profile"
          color="violet"
          className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2"
        >
          <InfoRow label="Username" value={authorInfo.username || "N/A"} />
          <InfoRow
            label="Link Karma"
            value={formatNumber(authorInfo.link_karma) || "N/A"}
          />
          <InfoRow
            label="Comment Karma"
            value={formatNumber(authorInfo.comment_karma) || "N/A"}
          />
          <InfoRow
            label="Account Age"
            value={
              authorInfo.account_age_days
                ? `${authorInfo.account_age_days} days`
                : "N/A"
            }
          />
          <InfoRow
            label="Email Verified"
            value={authorInfo.has_verified_email ? "Yes" : "No"}
          />
        </Card>

        {/* Subreddit Profile */}
        <Card
          title="Subreddit Profile"
          color="sky"
          className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2"
        >
          <InfoRow label="Name" value={subredditInfo.display_name || "N/A"} />
          <InfoRow
            label="Members"
            value={formatNumber(subredditInfo.subscribers) || "N/A"}
          />
          <TooltipText
            label="Description"
            shortText={shortDescription}
            fullText={description}
            hasMore={hasMoreDescription}
          />
          <TooltipText
            label="Guidelines"
            shortText={shortGuidelines}
            fullText={guidelines}
            hasMore={hasMoreGuidelines}
          />
        </Card>

        {/* Opportunity Metrics */}
        <Card
          title="Opportunity Metrics"
          color="amber"
          className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2"
        >
          <InfoRow label="Upvotes" value={metrics.upvotes || 0} />
          <InfoRow label="Comments" value={metrics.comments_count || 0} />
          <InfoRow
            label="Engagement Score"
            value={metrics.engagement_score?.toFixed(1) || "0"}
          />
          <InfoRow
            label="Upvote Ratio"
            value={`${Math.round((metrics.upvote_ratio || 0) * 100)}%`}
          />
        </Card>

        {/* Customer Journey */}
        <Card
          title="Customer Journey"
          color="fuchsia"
          className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2"
        >
          <div className="flex flex-col gap-0">
            {journeyStages.map((stage) => (
              <div
                key={stage.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border-l-4 ${
                  stage.active
                    ? "bg-fuchsia-100 border-fuchsia-600 text-fuchsia-700 font-semibold shadow-sm"
                    : "border-transparent text-gray-500 hover:bg-fuchsia-50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    stage.active
                      ? "bg-fuchsia-600"
                      : "bg-fuchsia-200 group-hover:bg-fuchsia-400"
                  }`}
                ></div>
                <span>{stage.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Assessment Breakdown */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 rounded-2xl p-4 shadow-sm col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-4 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-sky-700">
              Assessment Breakdown
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs cursor-pointer font-semibold text-sky-600 hover:underline transition-all"
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Circular Overall Score */}
            <div className="flex flex-col items-center justify-center min-w-[30%]">
              <AnimatedCircularProgress
                value={overallScore}
                maxValue={100}
                size={120}
                strokeWidth={12}
                circleColor="#34d399"
                textColor="#000000"
                trackColor="#d1d5db"
              />
            </div>

            {/* Compact Score Bars */}
            <CompactAnimatedAssessmentBars assessments={assessments} />
          </div>
        </div>
      </div>

      {/* Expanded Breakdown (Scroll Target) */}
      <div ref={detailsRef} className="scroll-mt-20">
        <AnimatedAssessmentDetails
          overallScore={overallScore}
          assessments={assessments}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

const Card = ({ title, color, children, className }) => {
  const colorMap = {
    violet: "from-violet-50 border-violet-200 text-violet-700",
    sky: "from-sky-50 border-sky-200 text-sky-700",
    amber: "from-amber-50 border-amber-200 text-amber-700",
    fuchsia: "from-fuchsia-50 border-fuchsia-200 text-fuchsia-700",
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border shadow-sm p-3 sm:p-4 hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <h3 className="text-sm font-bold uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between text-gray-700 text-xs sm:text-sm gap-1 sm:gap-0">
    <span className="font-medium text-gray-500">{label}:</span>
    <span className="font-semibold text-gray-800 sm:text-right break-words">
      {value}
    </span>
  </div>
);

const TooltipText = ({ label, shortText, fullText, hasMore }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm gap-1 sm:gap-0">
    <span className="font-medium text-gray-500">{label}:</span>
    <span
      className="font-semibold text-gray-800 sm:text-right sm:max-w-[80%] cursor-help break-words"
      title={hasMore ? fullText : ""}
    >
      {shortText}
      {hasMore && " ..."}
    </span>
  </div>
);

/* ---------- Animated Assessment Bars ---------- */
function CompactAnimatedAssessmentBars({ assessments = [] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return "emerald";
    if (score >= 60) return "blue";
    if (score >= 40) return "amber";
    return "rose";
  };

  const colorClasses = {
    emerald: { text: "text-emerald-600", bg: "bg-emerald-400" },
    blue: { text: "text-blue-600", bg: "bg-blue-400" },
    amber: { text: "text-amber-600", bg: "bg-amber-400" },
    rose: { text: "text-rose-600", bg: "bg-rose-400" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-2 w-full">
      {assessments.map((assessment, index) => {
        const color = getScoreColor(assessment.score);
        const { text, bg } = colorClasses[color];
        return (
          <div key={index}>
            <div className="flex justify-between">
              <span className="font-medium text-[9px] sm:text-[10px] truncate text-slate-700 max-w-[70%]">
                {assessment.dimension}
              </span>
              <span className={`font-bold text-[9px] sm:text-[10px] ${text}`}>
                {assessment.score}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-[6px] sm:h-[8px] overflow-hidden">
              <div
                className={`h-[6px] sm:h-[8px] ${bg} rounded-full transition-[width] duration-700 ease-in-out`}
                style={{
                  width: mounted ? `${assessment.score}%` : "0%",
                  transitionDelay: `${index * 120}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Animated Detailed Breakdown ---------- */
function AnimatedAssessmentDetails({
  assessments = [],
  expanded,
  overallScore,
  setExpanded,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (expanded) {
      const timer = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(timer);
    } else {
      setMounted(false);
    }
  }, [expanded]);

  const getScoreColor = (score) => {
    if (score >= 80) return "emerald";
    if (score >= 60) return "blue";
    if (score >= 40) return "amber";
    return "rose";
  };

  const colorClasses = {
    emerald: {
      text: "text-emerald-600",
      bg: "bg-emerald-400",
      border: "border-emerald-400",
    },
    blue: {
      text: "text-blue-600",
      bg: "bg-blue-400",
      border: "border-blue-400",
    },
    amber: {
      text: "text-amber-600",
      bg: "bg-amber-400",
      border: "border-amber-400",
    },
    rose: {
      text: "text-rose-600",
      bg: "bg-rose-400",
      border: "border-rose-400",
    },
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  };

  if (!expanded) return null;

  return (
    <div className="border border-slate-300 p-3 sm:p-5 rounded-2xl mt-6 bg-white/70 backdrop-blur-md shadow-sm animate-fadeIn scroll-mt-24">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg sm:text-xl font-semibold uppercase tracking-wide text-sky-800">
          Assessment Breakdown Details
        </h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100"
          title="Close details"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Summary */}
        <div className="flex flex-col items-center justify-center lg:max-w-[30%] gap-4 sm:gap-6">
          <span className="text-base sm:text-lg font-semibold text-sky-800 text-center">
            Overall Performance
          </span>
          <AnimatedCircularProgress
            value={overallScore}
            maxValue={100}
            size={220}
            strokeWidth={18}
            circleColor="#34d399"
            textColor="#0f172a"
            trackColor="#d1d5db"
          />
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-center px-2">
            This score represents the overall AI-evaluated performance across
            multiple assessment dimensions, summarizing engagement, clarity, and
            opportunity alignment.
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-2 w-full">
          {assessments.map((assessment, index) => {
            const color = getScoreColor(assessment.score);
            const { text, bg, border } = colorClasses[color];
            const label = getScoreLabel(assessment.score);
            return (
              <div
                key={index}
                className={`p-3 sm:p-4 bg-white/80 backdrop-blur-md rounded-xl border-l-4 ${border}
                  shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300
                  transform ${
                    mounted
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                  }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1 sm:gap-0">
                  <h3 className="text-sm sm:text-md font-semibold text-slate-800 truncate">
                    {assessment.dimension}
                  </h3>
                  <div className="flex space-x-2 sm:space-x-3 items-center">
                    <p className={`text-lg sm:text-xl font-bold ${text}`}>
                      {assessment.score}
                    </p>
                    <span className={`text-xs sm:text-sm ${text}`}>
                      ({label})
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm mb-2 line-clamp-3 leading-relaxed">
                  {assessment.overview}
                </p>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 ${bg} rounded-full transition-[width] duration-700 ease-in-out`}
                    style={{
                      width: mounted ? `${assessment.score}%` : "0%",
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
