"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, BarChart3, Table2 } from "lucide-react";
import clsx from "clsx";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import OutlinedInput from "@mui/material/OutlinedInput";
import SearchRankingChartView from "./SearchRankingChartView";

const BASE_COLUMNS = [
  { key: "companyName", label: "Company" },
  { key: "displayUrl", label: "Website" },
  { key: "description", label: "Description" },
  { key: "source", label: "Source" },
  { key: "foundBy", label: "Found By" },
  { key: "bestRank", label: "Best Rank" },
];

const PROVIDER_COLUMNS = [
  { key: "claude", label: "Claude Rank" },
  { key: "openai", label: "OpenAI Rank" },
  { key: "gemini", label: "Gemini Rank" },
  { key: "perplexity", label: "Perplexity Rank" },
  { key: "grok", label: "Grok Rank" },
];

const ALL_COLUMNS = [...BASE_COLUMNS, ...PROVIDER_COLUMNS];

const COMPACT_BREAKPOINT = 1280;

const SKELETON_ROW_COUNT = 6;
const SHIMMER_GRADIENT =
  "linear-gradient(90deg, rgba(243,244,246,0) 0%, rgba(203,213,225,0.4) 20%, rgba(226,232,240,1) 50%, rgba(203,213,225,0.4) 80%, rgba(243,244,246,0) 100%)";
const SHIMMER_WIDTHS = [75, 50, 60, 40, 85, 55];

function EmptyState({ loading, hasFilter }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-48 flex-col items-center justify-center text-center"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="h-10 w-10 rounded-full border-3 border-purple-500 border-t-transparent" />
          </motion.div>
          <p className="font-medium">Fetching ranking data...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 text-gray-500"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
            <TrendingUp className="h-7 w-7 text-purple-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {hasFilter
                ? "No companies match your filters"
                : "No ranking results yet"}
            </p>
            <p className="mt-1 text-sm">
              {hasFilter
                ? "Try adjusting your search or column visibility."
                : "Submit a search to populate this table."}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SearchRankingTable({ rows, loading }) {
  const [viewMode, setViewMode] = useState("chart"); // "table" or "chart" - default to chart
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(() =>
    ALL_COLUMNS.map((column) => column.key).filter(
      (key) => key !== "description"
    )
  );
  const toggleContainerRef = useRef(null);
  const toggleRefs = useRef({});
  const [toggleIndicator, setToggleIndicator] = useState({ width: 0, left: 0 });
  const [isCompactTable, setIsCompactTable] = useState(false);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;

    const normalizedTerm = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const name = row.companyName?.toLowerCase() || "";
      const url = row.displayUrl?.toLowerCase() || "";
      return name.includes(normalizedTerm) || url.includes(normalizedTerm);
    });
  }, [rows, searchTerm]);

  const visibleColumnSet = useMemo(
    () => new Set(visibleColumns),
    [visibleColumns]
  );

  const activeColumns = useMemo(
    () => ALL_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
    [visibleColumns]
  );

  const activeProviderColumns = useMemo(
    () =>
      PROVIDER_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
    [visibleColumns]
  );

  const skeletonPatterns = useMemo(() => {
    const columnCount = Math.max(activeColumns.length, 1);
    return Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) =>
      Array.from({ length: columnCount }, (_, columnIndex) => {
        return SHIMMER_WIDTHS[(rowIndex + columnIndex) % SHIMMER_WIDTHS.length];
      })
    );
  }, [activeColumns.length]);

  const updateToggleIndicator = useCallback(() => {
    const activeEl = toggleRefs.current[viewMode];
    const containerEl = toggleContainerRef.current;
    if (activeEl && containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setToggleIndicator({
        width: activeRect.width,
        left: activeRect.left - containerRect.left,
      });
    }
  }, [viewMode]);

  useEffect(() => {
    updateToggleIndicator();

    const evaluateCompactState = () => {
      if (typeof window === "undefined") return;
      setIsCompactTable(window.innerWidth < COMPACT_BREAKPOINT);
    };

    evaluateCompactState();

    const handleResize = () => {
      updateToggleIndicator();
      evaluateCompactState();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateToggleIndicator]);

  const handleColumnChange = (event) => {
    const value = event.target.value;
    const normalized = typeof value === "string" ? value.split(",") : value;
    if (!normalized.length) return; // keep at least one column visible
    setVisibleColumns(normalized);
  };

  const isColumnVisible = useCallback(
    (key) => visibleColumnSet.has(key),
    [visibleColumnSet]
  );

  const renderCell = (row, columnKey) => {
    switch (columnKey) {
      case "companyName":
        return (
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {row.companyName}
            </div>
          </div>
        );
      case "displayUrl":
        return row.companyUrl ? (
          <a
            href={row.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-xl text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
          >
            {row.displayUrl || row.companyUrl.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span className="text-sm text-gray-500">—</span>
        );
      case "description":
        return row.description ? (
          <p className="max-w-2xl text-sm text-gray-700">{row.description}</p>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      case "source":
        return row.source ? (
          <div className="w-[120px]">
            {row.source.split(",").map((source) => (
              <span
                key={source}
                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
              >
                {source}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      case "foundBy":
        return row.foundBy?.length ? (
          <div className="flex flex-wrap gap-1 w-[120px]">
            {row.foundBy.map((provider) => (
              <span
                key={provider}
                className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
              >
                {provider}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      case "bestRank":
        return (
          <span className="flex items-center justify-center text-sm font-semibold text-gray-900 w-[50px]">
            {row.bestRank != null ? row.bestRank : "—"}
          </span>
        );
      case "claude":
      case "openai":
      case "gemini":
      case "perplexity":
      case "grok":
        return (
          <span className="flex items-center justify-center text-sm text-gray-700 min-w-[50px]">
            {row.providerRanks?.[columnKey] != null
              ? row.providerRanks[columnKey]
              : "—"}
          </span>
        );
      default:
        return <span className="text-sm text-gray-500">—</span>;
    }
  };

  const showSkeleton = loading && rows.length === 0;

  const shimmerAnimation = {
    backgroundPosition: ["200% 0", "-200% 0"],
  };

  const shimmerDelay = (rowIndex, columnIndex) => {
    return rowIndex * 0.08 + columnIndex * 0.02;
  };

  const renderCompactRow = (row, index) => (
    <motion.div
      key={row.id || index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-900">
            {row.companyName || "Unnamed company"}
          </p>
          {isColumnVisible("displayUrl") && row.companyUrl ? (
            <a
              href={row.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              {row.displayUrl || row.companyUrl.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          {isColumnVisible("source") && row.source ? (
            <div className="flex flex-wrap gap-1">
              {row.source.split(",").map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {source}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {isColumnVisible("bestRank") && (
          <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            Best #{row.bestRank ?? "—"}
          </div>
        )}
      </div>

      {isColumnVisible("description") && row.description && (
        <p className="mt-3 text-sm text-gray-600">{row.description}</p>
      )}

      {isColumnVisible("foundBy") && row.foundBy?.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {row.foundBy.map((provider) => (
            <span
              key={provider}
              className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
            >
              {provider}
            </span>
          ))}
        </div>
      ) : null}

      {activeProviderColumns.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Provider ranks
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeProviderColumns.map((column) => (
              <div
                key={`${row.id || index}-${column.key}`}
                className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2"
              >
                <p className="text-xs text-gray-500">
                  {column.label.replace(" Rank", "")}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {row.providerRanks?.[column.key] ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderCompactContent = () => {
    if (showSkeleton) {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <motion.div
              key={`compact-skeleton-${index}`}
              className="h-40 rounded-2xl border border-gray-100 bg-gray-100/70"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            />
          ))}
        </div>
      );
    }

    if (filteredRows.length === 0) {
      return (
        <div className="bg-white">
          <EmptyState loading={loading} hasFilter={Boolean(searchTerm)} />
        </div>
      );
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredRows.map((row, index) => renderCompactRow(row, index))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-white px-6 py-4"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Top Ranking Companies
              </h3>
              <p className="text-sm text-gray-600">
                Review company signals collected from multiple AI providers.
              </p>
            </div>
            {/* View Mode Toggle */}
            <div className="relative">
              <div
                ref={toggleContainerRef}
                className="relative flex items-center gap-1 rounded-full border border-gray-200 bg-white/80 p-1 shadow-sm"
              >
                <motion.span
                  className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-purple-100/90"
                  style={{ width: toggleIndicator.width || 0 }}
                  initial={false}
                  animate={{ x: toggleIndicator.left || 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                />
                {[
                  { id: "table", label: "Table", icon: Table2 },
                  { id: "chart", label: "Chart", icon: BarChart3 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = viewMode === tab.id;

                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        if (el) toggleRefs.current[tab.id] = el;
                        else delete toggleRefs.current[tab.id];
                      }}
                      onClick={() => setViewMode(tab.id)}
                      title={tab.label} // tooltip on hover
                      className={clsx(
                        "relative z-10 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        isActive
                          ? "text-purple-600"
                          : "text-gray-500 hover:text-purple-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {viewMode === "table" && (
              <>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search company or website"
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <FormControl
                  size="small"
                  className="w-full sm:w-auto sm:min-w-[240px]"
                >
                  <InputLabel id="column-selector-label">Columns</InputLabel>
                  <Select
                    labelId="column-selector-label"
                    multiple
                    value={visibleColumns}
                    onChange={handleColumnChange}
                    input={<OutlinedInput label="Columns" />}
                    renderValue={(selected) =>
                      selected.map(
                        (key) =>
                          ALL_COLUMNS.find((column) => column.key === key)
                            ?.label || key
                      ).length + " selected"
                    }
                  >
                    {ALL_COLUMNS.map((column) => {
                      const selected = visibleColumns.includes(column.key);
                      return (
                        <MenuItem key={column.key} value={column.key}>
                          <Checkbox
                            style={{
                              color: "#6f40c7ff",
                            }}
                            checked={selected}
                          />
                          <ListItemText primary={column.label} />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </>
            )}
          </div>
          {viewMode === "table" && isCompactTable && (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Compact cards are shown on smaller screens for readability. Expand
              your window to return to the spreadsheet-style table.
            </p>
          )}
        </div>
      </motion.div>

      {/* Conditionally render table or chart view */}
      <AnimatePresence mode="wait">
        {viewMode === "chart" ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-hidden"
          >
            <SearchRankingChartView rows={rows} isLoading={loading} />
          </motion.div>
        ) : isCompactTable ? (
          <motion.div
            key="table-compact"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {renderCompactContent()}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-x-auto"
          >
            <table className="w-full">
              <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                <tr>
                  {activeColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-700"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {showSkeleton ? (
                  skeletonPatterns.map((pattern, rowIndex) => (
                    <motion.tr
                      key={`skeleton-${rowIndex}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        delay: rowIndex * 0.06,
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="hover:bg-transparent"
                    >
                      {pattern.map((width, columnIndex) => (
                        <td
                          key={columnIndex}
                          className="px-6 py-4 align-middle"
                        >
                          {columnIndex === 0 ? (
                            <div className="space-y-3">
                              <motion.div
                                className="h-4 rounded-lg bg-gray-200"
                                style={{
                                  width: `${width}%`,
                                  backgroundImage: SHIMMER_GRADIENT,
                                  backgroundSize: "400% 100%",
                                }}
                                animate={shimmerAnimation}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay: shimmerDelay(rowIndex, columnIndex),
                                }}
                              />
                              <motion.div
                                className="h-3 rounded-lg bg-gray-200"
                                style={{
                                  width: `${Math.max(35, width - 20)}%`,
                                  backgroundImage: SHIMMER_GRADIENT,
                                  backgroundSize: "400% 100%",
                                }}
                                animate={shimmerAnimation}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay:
                                    shimmerDelay(rowIndex, columnIndex) + 0.15,
                                }}
                              />
                            </div>
                          ) : (
                            <motion.div
                              className="h-3.5 rounded-lg bg-gray-200"
                              style={{
                                width: `${Math.max(30, width - 15)}%`,
                                backgroundImage: SHIMMER_GRADIENT,
                                backgroundSize: "400% 100%",
                              }}
                              animate={shimmerAnimation}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                                delay: shimmerDelay(rowIndex, columnIndex),
                              }}
                            />
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length}>
                      <EmptyState
                        loading={loading}
                        hasFilter={Boolean(searchTerm)}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <motion.tr
                      key={row.id || index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.04,
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="group transition-colors hover:bg-purple-50/30 cursor-default"
                    >
                      {activeColumns.map((column) => (
                        <td key={column.key} className="px-6 py-3.5 align-top">
                          {renderCell(row, column.key)}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
