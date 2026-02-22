"use client";
import React from "react";

export default function ScreenShimmer() {
  return (
    <div className="h-full bg-[#fafafa] p-0">
      <div className="w-full px-6 pt-2">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Company Management
          </h1>
          <p className=" text-gray-600">
            Browse companies, select a project, and manage members.
          </p>
        </div>
        {/* Tabs shimmer */}
        <div className="border-2 border-gray-300 rounded-lg bg-white">
          <div className="border-b border-gray-300 overflow-x-auto">
            <div className="inline-flex gap-0 w-full">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="min-w-[220px] border-r border-gray-300 p-4 last:border-r-0"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columns shimmer */}
          <div className="flex min-h-[calc(100vh-260px)]">
            {/* Left column */}
            <div className="w-2/5 border-r border-gray-300 p-4">
              <div className="h-5 w-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-60"></div>
                          </div>
                        </div>
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-3 bg-gray-100 rounded w-24"></div>
                        <div className="h-3 bg-gray-100 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right column */}
            <div className="w-3/5 p-4">
              <div className="h-5 w-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="animate-pulse">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-60 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-40"></div>
                          </div>
                        </div>
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
