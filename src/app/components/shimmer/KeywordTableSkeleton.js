"use client";
import { Box } from "@mui/material";

export default function KeywordTableSkeleton() {
  return (
    <Box sx={{ backgroundColor: "#FAFAFA", width: "100%", p: 1 }}>
      {/* Search and Controls Bar */}
      <div className="flex justify-between items-center mt-1 mb-2 animate-pulse">
        {/* Search Field */}
        <div className="h-10 w-80 bg-gray-200 rounded"></div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-black overflow-hidden animate-pulse">
        <table className="min-w-full">
          {/* Table Header */}
          <thead className="bg-white">
            <tr className="border-b border-black">
              {/* Checkbox + Keyword */}
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              </th>
              {/* Other columns */}
              {[
                "Primary",
                "Volume",
                "Competition",
                "Category",
                "Products",
                "Intent",
                "Status",
                "CPC",
              ].map((_, i) => (
                <th key={i} className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-3 w-3 bg-gray-200 rounded"></div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
              <tr key={row} className="hover:bg-gray-50">
                {/* Checkbox + Keyword */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  </div>
                </td>
                {/* Primary checkbox */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </div>
                </td>
                {/* Volume */}
                <td className="px-4 py-3 text-center">
                  <div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div>
                </td>
                {/* Competition */}
                <td className="px-4 py-3 text-center">
                  <div className="h-6 w-16 bg-gray-200 rounded-full mx-auto"></div>
                </td>
                {/* Category */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                </td>
                {/* Products */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                  </div>
                </td>
                {/* Intent */}
                <td className="px-4 py-3 text-center">
                  <div className="h-6 w-20 bg-gray-200 rounded-full mx-auto"></div>
                </td>
                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <div className="h-6 w-18 bg-gray-200 rounded-full mx-auto"></div>
                </td>
                {/* CPC */}
                <td className="px-4 py-3 text-center">
                  <div className="h-4 w-12 bg-gray-200 rounded mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center mt-2 animate-pulse">
        <div className="flex gap-1 items-center">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Box>
  );
}
