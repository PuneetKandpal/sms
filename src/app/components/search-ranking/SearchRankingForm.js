"use client";

import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";

const formCardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export default function SearchRankingForm({
  onSubmit,
  submitting,
  disabled,
  queryValue = "",
  onQueryChange,
  submitLabel = "Run Search",
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting || disabled) return;

    const trimmed = queryValue.trim();
    if (!trimmed) return;

    const queries = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    onSubmit({ query: queries[0], queries });
  };

  const handleQueryChange = (event) => {
    onQueryChange?.(event.target.value);
  };

  const primaryDisabled =
    submitting || disabled || queryValue.trim().length === 0;

  return (
    <motion.form
      layout
      variants={formCardVariants}
      initial="initial"
      animate="animate"
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/30 shadow-md"
    >
      <div className="bg-gradient-to-r from-sky-50/50 to-transparent border-b border-gray-100 px-6 py-3">
        <label
          htmlFor="search-query"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700"
        >
          <Search className="h-4 w-4 text-sky-600" />
          New Discovery Query
        </label>
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <input
              id="search-query"
              type="text"
              value={queryValue}
              onChange={handleQueryChange}
              placeholder="e.g., Top dehydrated onion suppliers in India"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-gray-50 disabled:text-gray-500"
              disabled={submitting || disabled}
            />
          </div>

          <motion.button
            type="submit"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            disabled={primaryDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:from-sky-300 disabled:to-sky-400 disabled:shadow-none cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : (
              <div className="flex items-center gap-2 text-nowrap">
                <span>{submitLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}
