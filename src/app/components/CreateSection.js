'use client';

import { RiYoutubeLine } from "react-icons/ri";
import { TbClipboardText } from "react-icons/tb";

/**
 * The Create panel shows options like “Article Create,” etc.
 * Matches your wireframe’s look: heading + description in discrete boxes.
 */
export default function CreateSection() {
  return (
    <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg p-4 h-full">
      
       <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Create</h3>
      </div>
      <div className="space-y-3 flex-1 overflow-auto mt-2">
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            <TbClipboardText className="text-primary" />
            <span className="font-semibold text-gray-800">Article Create</span>
          </div>
          <p className="text-sm text-gray-700">
            Content supporting your product marketing strategy that your
            customers will find.
          </p>
        </div>

        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            <RiYoutubeLine className="text-primary" />
            <span className="font-semibold text-gray-800">
              YouTube Competitor Intelligence
            </span>
          </div>
          <p className="text-sm text-gray-700">
            Learn video topics and performance. What do your customers watch?
          </p>
        </div>

        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            <RiYoutubeLine className="text-primary" />
            <span className="font-semibold text-gray-800">
              YouTube Strategy
            </span>
          </div>
          <p className="text-sm text-gray-700">
            Create video topics, outlines, storyboards and scripts based on
            competitor intelligence and your product marketing strategy.
          </p>
        </div>
      </div>
    </div>
  );
}
