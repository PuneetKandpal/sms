"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Eye,
  Clock,
  Target,
  FileDown,
  Bell,
  BarChart3,
} from "lucide-react";

export default function AnalyticsTab({ selectedNode }) {
  const metrics = [
    {
      label: "Page Views",
      value: "12,450",
      icon: Eye,
      color: "blue",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
    },
    {
      label: "Conversion Rate",
      value: "4.2%",
      icon: TrendingUp,
      color: "green",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      textColor: "text-green-600",
    },
    {
      label: "Avg. Time on Page",
      value: "3:45",
      icon: Clock,
      color: "orange",
      bgColor: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-600",
    },
    {
      label: "Keyword Ranking",
      value: "#3",
      icon: Target,
      color: "sky",
      bgColor: "from-sky-50 to-sky-100",
      borderColor: "border-sky-200",
      textColor: "text-sky-600",
    },
  ];

  const seoPerformance = [
    { keyword: "market research methods", position: "#3", change: "+2" },
    { keyword: "customer research", position: "#7", change: "0" },
    { keyword: "market analysis", position: "#12", change: "+5" },
  ];

  const recommendations = [
    "Add more internal links to related content",
    "Update meta description to improve CTR",
    "Add FAQ section for featured snippets",
    "Optimize images with better alt text",
    "Update outdated statistics with 2024 data",
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Time Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold text-gray-900">
          Performance Analytics
        </h2>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium cursor-pointer">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>Last 90 Days</option>
          <option>Last Year</option>
        </select>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`bg-gradient-to-br ${metric.bgColor} border ${metric.borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-8 w-8 ${metric.textColor}`} />
              </div>
              <div className={`text-3xl font-bold ${metric.textColor} mb-1`}>
                {metric.value}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {metric.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              SEO Performance
            </h3>
          </div>
          <div className="space-y-3">
            {seoPerformance.map((item, index) => (
              <motion.div
                key={item.keyword}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {item.keyword}
                  </div>
                  <div className="text-sm text-gray-600">
                    Position {item.position}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.change === "0"
                      ? "bg-gray-200 text-gray-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.change === "0" ? "—" : `+${item.change}`}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Optimization Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Optimization Recommendations
            </h3>
          </div>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {rec}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Traffic Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Traffic Trend
        </h3>
        <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center text-gray-500">
          [Traffic Chart Visualization]
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3"
      >
        <button className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium cursor-pointer">
          <FileDown className="h-4 w-4" />
          Export Report
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer">
          <Bell className="h-4 w-4" />
          Set Alerts
        </button>
      </motion.div>
    </div>
  );
}
