"use client";

import { motion } from "framer-motion";
import { FolderTree, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ArchitectsListShimmer() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <motion.header
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-64 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="h-12 w-56 bg-gray-200 rounded-xl"></div>
        </div>
      </motion.header>

      {/* Architect Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <motion.div
              key={index}
              animate={{ opacity: [0.5, 0.7, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.1,
              }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              {/* Header with status badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-7 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1"></div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Details section */}
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>

                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-5 w-48 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Company data preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-5 w-full bg-gray-200 rounded"></div>
              </div>

              {/* Action footer */}
              <div className="mt-2 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-28 bg-gray-200 rounded"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
