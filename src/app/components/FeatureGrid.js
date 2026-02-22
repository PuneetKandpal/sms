"use client";
import { FaBook, FaChartBar, FaBolt, FaFileAlt } from "react-icons/fa";
import { Compass, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFeatureExploration } from "../context/FeatureExplorationContext";
import { useEffect, useState } from "react";

const features = [
  {
    id: 1,
    icon: <FaBook className="text-black w-4 h-4" />,
    title: "Marketing Knowledge Base",
    description:
      "Store and organize all your marketing assets and insights in one place.",
  },
  {
    id: 2,
    icon: <FaChartBar className="text-black w-4 h-4" />,
    title: "Create Strategy",
    description:
      "Develop comprehensive marketing strategies with AI-powered tools.",
  },
  {
    id: 3,
    icon: <FaBolt className="text-black w-4 h-4" />,
    title: "Create Campaigns",
    description:
      "Design and launch marketing campaigns across multiple channels.",
  },
  {
    id: 4,
    icon: <FaFileAlt className="text-black w-4 h-4" />,
    title: "Create Content",
    description:
      "Generate and manage content for all your marketing initiatives.",
  },
];

export default function FeatureGrid() {
  const router = useRouter();
  const { getExplorationStats } = useFeatureExploration();
  const [stats, setStats] = useState({ explored: 0, total: 0, percentage: 0 });

  useEffect(() => {
    const newStats = getExplorationStats();
    setStats(newStats);
  }, [getExplorationStats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Feature Exploration Card */}
      <div
        onClick={() => router.push("/exploration")}
        className="border border-gray-200 rounded-xl p-6 flex flex-col space-y-4 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-sky-50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-sky-400/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="text-blue-600 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">
            Feature Exploration
          </h3>
          <p className="text-gray-600 text-sm">
            Track your journey through the platform features.
          </p>
          {stats.total > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {stats.percentage}%
              </span>
            </div>
          )}
        </div>
      </div>

      {features.map((feature) => (
        <div
          key={feature.id}
          className="border border-gray-200 rounded-xl p-6 flex flex-col space-y-4"
        >
          <div className="text-black w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {feature.icon}
          </div>
          <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
          <p className="text-gray-400 text-sm">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
