"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { History, RefreshCcw, Eye } from "lucide-react";
import clsx from "clsx";

import formatLocalDateLabel from "./utils/formatLocalDateLabel";

function QueryCard({ query, index, onRerun, onView }) {
  const latest = query.latestVersion;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900">
              {query.query}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>ID: {query.queryId}</span>
              <span>
                Created: {formatLocalDateLabel(query.createdAt) ?? "—"}
              </span>
              {query.updatedAt && (
                <span>Updated: {formatLocalDateLabel(query.updatedAt)}</span>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
            <History className="h-3.5 w-3.5" />
            {query.totalVersions} version{query.totalVersions === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          {latest ? (
            <div className="flex flex-wrap gap-3">
              <span className="font-semibold text-gray-800">
                Latest version: {latest.version}
              </span>
              {latest.companiesCount != null && (
                <span>
                  {latest.companiesCount} compan
                  {latest.companiesCount === 1 ? "y" : "ies"}
                </span>
              )}
              {latest.createdAt && (
                <span>Generated: {formatLocalDateLabel(latest.createdAt)}</span>
              )}
              {latest.executionTimeSeconds != null && (
                <span>Runtime: {latest.executionTimeSeconds.toFixed(1)}s</span>
              )}
            </div>
          ) : (
            <span>
              No versions generated yet. Rerun the query to create data.
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onRerun(query)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Rerun Query
          </button>
          <button
            type="button"
            onClick={() => onView(query)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
        <History className="h-6 w-6 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        No discovery searches yet
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        Submit your first query to start building ranking intelligence.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
      >
        Run a search
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-100"
        />
      ))}
    </div>
  );
}

function SearchRankingQueryList({
  queries,
  loading,
  onRerun,
  onView,
  onEmptyAction,
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (!queries.length) {
    return <EmptyState onCreate={onEmptyAction} />;
  }

  return (
    <div className="grid gap-4">
      {queries.map((query, index) => (
        <QueryCard
          key={query.queryId || index}
          query={query}
          index={index}
          onRerun={onRerun}
          onView={onView}
        />
      ))}
    </div>
  );
}

export default memo(SearchRankingQueryList);
