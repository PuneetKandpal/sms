"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  History,
  RefreshCcw,
  Loader2,
  Clock,
  BarChart3,
  ChevronRight,
  Timer,
} from "lucide-react";
import clsx from "clsx";

import formatLocalDateLabel from "./utils/formatLocalDateLabel";

function QueryListItem({
  query,
  isActive,
  isCurrent,
  onSelect,
  onRerun,
  index,
}) {
  const createdAtLabel = formatLocalDateLabel(query.createdAt);
  const updatedAtLabel = formatLocalDateLabel(query.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        delay: index * 0.03,
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={clsx(
        "group relative overflow-hidden rounded-xl border shadow-sm transition-all cursor-pointer",
        isActive
          ? "border-purple-400 bg-gradient-to-br from-purple-50 via-white to-purple-100/50 shadow-md ring-1 ring-purple-200/50"
          : "border-gray-200 bg-white hover:border-purple-300 hover:shadow"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          console.log("=== QUERY LIST ITEM BUTTON CLICK ===");
          console.log("Click event:", e);
          console.log("Query:", query);
          console.log("About to call onSelect");
          onSelect(query);
        }}
        className="relative flex w-full items-start justify-between gap-3 px-4 py-3 text-left cursor-pointer"
      >
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <div
              className={clsx(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                isActive
                  ? "bg-purple-200 text-purple-800"
                  : "bg-purple-100 text-purple-700"
              )}
            >
              <History className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="line-clamp-2 text-sm font-semibold text-gray-900 leading-tight">
                {query.query}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-[42px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
              <BarChart3 className="h-3 w-3" />
              {query.totalVersions}
            </span>
            {query.latestVersion?.companiesCount != null && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {query.latestVersion.companiesCount} companies
              </span>
            )}
            {createdAtLabel && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Clock className="h-3 w-3" />
                {createdAtLabel}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={clsx(
            "mt-1 h-4 w-4 shrink-0 transition-all",
            isActive
              ? "text-purple-600"
              : "text-gray-400 group-hover:translate-x-0.5 group-hover:text-purple-500"
          )}
        />
      </button>
      <div className="relative flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/30 px-4 py-2">
        {isCurrent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRerun(query);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-purple-700 cursor-pointer"
        >
          <RefreshCcw className="h-3 w-3" />
          Rerun
        </button>
      </div>
    </motion.div>
  );
}

function VersionList({ versions, loading, onSelect, empty, activeVersionId }) {
  console.log("=== VERSION LIST ===");
  console.log("versions count:", versions?.length || 0);
  console.log("activeVersionId:", activeVersionId);
  console.log("versions:", versions);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-6 w-6 text-purple-500" />
        </motion.div>
        <p className="font-medium">Loading versions...</p>
      </div>
    );
  }

  if (empty) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
          <BarChart3 className="h-7 w-7 text-purple-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">
            No versions yet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Run this query to generate version history.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2.5 overflow-y-auto pr-1">
      {versions.map((version, index) => {
        const metadata = version || {};

        console.log("version:", version);

        const createdAt =
          version.created_at ||
          metadata.created_at ||
          metadata.createdAt ||
          null;
        const createdAtLabel = formatLocalDateLabel(createdAt);
        const companiesCount =
          metadata.companies_count ?? metadata.companiesCount ?? null;
        const executionTime =
          metadata.execution_time_seconds ??
          metadata.executionTimeSeconds ??
          null;
        const isActive =
          activeVersionId != null &&
          String(activeVersionId) === String(version.version);

        console.log(
          `VERSION ${version.version}: isActive=${isActive}, ` +
            `activeVersionId=${activeVersionId}, version.version=${version.version}`
        );

        return (
          <motion.button
            key={version.version}
            type="button"
            onClick={() => onSelect(version)}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: index * 0.03,
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={clsx(
              "group relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left shadow-sm transition-all cursor-pointer",
              isActive
                ? "border-purple-400 bg-gradient-to-br from-purple-50 via-white to-purple-100/30 shadow-md ring-1 ring-purple-200/50"
                : "border-gray-200 bg-white hover:border-purple-300 hover:shadow"
            )}
          >
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={clsx(
                      "text-sm font-semibold leading-tight flex items-center gap-1",
                      isActive ? "text-purple-900" : "text-gray-900"
                    )}
                  >
                    <Clock className="h-3 w-3 mt-[2px]" />
                    {createdAtLabel}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-700 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {companiesCount != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        <BarChart3 className="h-3 w-3" />
                        {companiesCount}
                      </span>
                    )}
                    {executionTime != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        <Timer className="h-3 w-3" />
                        {typeof executionTime === "number"
                          ? executionTime.toFixed(1)
                          : executionTime}
                        s
                      </span>
                    )}
                  </div>
                  {version.version && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      Version {version.version}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                className={clsx(
                  "mt-1 h-4 w-4 shrink-0 transition-all",
                  isActive
                    ? "text-purple-600"
                    : "text-gray-400 group-hover:translate-x-0.5 group-hover:text-purple-500"
                )}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function SearchRankingHistoryDrawer({
  open,
  onClose,
  queries,
  loadingQueries,
  onRefreshQueries,
  selectedQueryId,
  onSelectQuery,
  versions,
  loadingVersions,
  onSelectVersion,
  onRerunQuery,
  activeDashboardQueryId,
  activeVersionId,
}) {
  console.log("versions------", versions);

  const handleQuerySelect = (query) => {
    console.log("=== HISTORY DRAWER: QUERY SELECT ===");
    console.log("Query clicked:", query);
    if (!query?.queryId) return;
    console.log("Calling onSelectQuery with query");
    onSelectQuery?.(query);
  };

  const handleVersionSelect = (version) => {
    if (!version) return;
    onSelectVersion?.(version);
  };

  const selectedQuery =
    queries.find((item) => item.queryId === selectedQueryId) || null;
  const versionListEmpty = !versions?.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Query History
                </h2>
                <p className="text-sm text-gray-500">
                  Review previous discovery queries and explore their versions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={onRefreshQueries}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  disabled={loadingQueries}
                >
                  {loadingQueries ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  {loadingQueries ? "Refreshing..." : "Refresh"}
                </motion.button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex h-full flex-1 flex-col md:flex-row">
              <div className="md:w-[45%] md:border-r md:border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-transparent px-6 py-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                    Saved Queries
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                    {queries.length}
                  </span>
                </div>
                <div className="h-full overflow-y-auto px-6 pb-6 md:pb-10">
                  {loadingQueries && !queries.length ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-gray-500">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="h-6 w-6 text-purple-500" />
                      </motion.div>
                      <p className="font-medium">Loading queries...</p>
                    </div>
                  ) : queries.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-10 text-center shadow-sm"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100">
                        <History className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        No discovery searches yet
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Run your first query to build history.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2.5">
                      {queries.map((query, index) => (
                        <QueryListItem
                          key={query.queryId}
                          query={query}
                          index={index}
                          isActive={selectedQueryId === query.queryId}
                          isCurrent={activeDashboardQueryId === query.queryId}
                          onSelect={handleQuerySelect}
                          onRerun={onRerunQuery}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Version History
                    </h3>
                    {selectedQuery ? (
                      <p className="mt-1 text-xs font-medium text-gray-600 line-clamp-1">
                        {selectedQuery.query}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        Select a query to view its versions.
                      </p>
                    )}
                  </div>
                  {selectedQuery && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {versions.length}
                    </span>
                  )}
                </div>
                <div className="h-full overflow-y-auto px-6 pb-6 md:pb-10">
                  {selectedQuery ? (
                    <VersionList
                      versions={versions}
                      loading={loadingVersions}
                      empty={versionListEmpty}
                      onSelect={handleVersionSelect}
                      activeVersionId={
                        selectedQueryId === activeDashboardQueryId
                          ? activeVersionId
                          : null
                      }
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
                        <History className="h-7 w-7 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          Select a query
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Choose a saved search to see its version breakdown.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
