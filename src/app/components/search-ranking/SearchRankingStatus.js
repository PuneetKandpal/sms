"use client";

import { motion } from "framer-motion";
import { Clock, Loader2, LineChart } from "lucide-react";

import formatLocalDateLabel from "./utils/formatLocalDateLabel";

function InfoRow({ label, value }) {
  if (value == null || value === "") return null;

  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function SearchRankingStatus({
  isPolling,
  submitting,
  statusMessage,
  currentQuery,
}) {
  const showSpinner = isPolling || submitting;
  const summary = currentQuery?.summaryMetrics ?? {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Status & Activity
            </h2>
            <p className="text-sm text-gray-500">
              Track the current progress of your ranking workflows.
            </p>
          </div>
          <div className="rounded-xl bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
            {isPolling ? "Processing" : submitting ? "Submitting" : "Idle"}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-gray-700">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
            {showSpinner ? (
              <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
            ) : (
              <Clock className="h-5 w-5 text-sky-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {statusMessage || "No active tasks"}
            </p>
            {currentQuery?.queryText && (
              <p className="truncate text-xs text-gray-500">
                Current query: {currentQuery.queryText}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-gray-600">
          <LineChart className="h-4 w-4" />
          <span className="text-sm font-medium">Summary</span>
        </div>

        <div className="space-y-3">
          <InfoRow label="Average rank" value={summary.averageRank} />
          <InfoRow label="Best rank" value={summary.bestRank} />
          <InfoRow label="Results tracked" value={summary.totalResults} />
          <InfoRow
            label="Version"
            value={currentQuery?.versionLabel || "Latest"}
          />
          <InfoRow
            label="Last updated"
            value={formatLocalDateLabel(currentQuery?.createdAt)}
          />
        </div>
      </div>
    </motion.div>
  );
}
