"use client";

export default function SourcePanelSkeleton({ isCollapsed = false }) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-4">
        {/* Sources Box - Collapsed */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg h-[280px] w-16 overflow-hidden animate-pulse">
          {/* Header */}
          <div className="flex bg-gray-100 py-4 px-4 items-center justify-center mb-4">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sources Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg h-[280px] w-72 overflow-hidden">
        {/* Header */}
        <div className="flex bg-gray-100 py-4 px-4 items-center justify-between mb-4 animate-pulse">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </div>

        {/* Sources List */}
        <div className="pl-4 pr-4 pt-1 pb-4 h-[calc(100%-80px)] flex flex-col">
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-1 pl-2 pr-2 pb-1 pt-1 rounded-md"
              >
                <div className="h-4 w-32 bg-gray-200 rounded flex-1"></div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="w-6 flex justify-end">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Box */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 w-72 animate-pulse">
        <div className="mb-4">
          <div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div>
        </div>
        <div className="border-1 border-gray-400 mt-1 mb-3"></div>

        {/* Topic Generation Button */}
        <div className="mt-1 mb-3">
          <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
        </div>

        {/* Approve/Reject Buttons */}
        <div className="flex gap-2 justify-between mb-3">
          <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
