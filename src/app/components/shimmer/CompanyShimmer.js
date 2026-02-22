"use client";
import React from "react";

export const CompanyTabShimmer = () => (
  <div className="flex">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="flex-1 border-r border-gray-300 last:border-r-0 p-4"
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
);

export const ProjectShimmer = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-3">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const MemberShimmer = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-3">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-40 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
