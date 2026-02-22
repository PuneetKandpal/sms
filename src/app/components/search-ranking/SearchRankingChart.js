"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";

function EmptyState({ loading }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-gray-500">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          Loading historical trend...
        </div>
      ) : (
        <div className="space-y-3">
          <Activity className="mx-auto h-8 w-8 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700">No history available</p>
            <p className="text-xs text-gray-500">
              Run additional searches to build historical context for the area chart.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatXAxisLabel(timestamp, index) {
  if (!timestamp) return `V${index + 1}`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return `V${index + 1}`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SearchRankingChart({ data, isAnyApiLoading, apiError, handleRetryAll }) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      xLabel: formatXAxisLabel(item.timestamp, index),
      averageRank: item.averageRank ?? 0,
    }));
  }, [data]);

  return (
    <motion.div
      layout
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ranking Trend
            </h3>
            <p className="text-sm text-gray-500">
              Track how average position changes across versions.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 pb-6 pt-4">
        {chartData.length === 0 ? (
          <EmptyState loading={isAnyApiLoading} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="avgRankGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 8" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="xLabel"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
                allowDecimals={false}
                reversed
                label={{
                  value: "Average Rank (lower is better)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: "#6B7280", fontSize: 12 },
                }}
              />
              <Tooltip
                cursor={{ stroke: "#C4B5FD", strokeDasharray: "4 4" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#E5E7EB",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                }}
                formatter={(value) => Math.round(value)}
                labelFormatter={(label) => `Version: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="averageRank"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#avgRankGradient)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#8B5CF6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export default memo(SearchRankingChart);
