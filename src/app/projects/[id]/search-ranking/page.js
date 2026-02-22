"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchRankingDashboard from "../../../components/search-ranking/SearchRankingDashboard";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import api from "../../../../api/axios";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

export default function SearchRankingPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  useTrackFeatureExploration("search_ranking");

  // Knowledge base gate state
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);

  // Check if company research data exists
  useEffect(() => {
    if (!id) return;

    const checkCompanyResearch = async () => {
      try {
        const response = await api.get(
          `/keyword-api/company-research-data/exists/?project_id=${id}`
        );

        if (response.data?.exists) {
          setHasCompanyResearch(true);
        } else {
          setHasCompanyResearch(false);
        }
      } catch (err) {
        console.error("Error checking company research data:", err);
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };

    checkCompanyResearch();
  }, [id]);

  // Track feature usage
  useFeatureTracking("Search Ranking", {
    feature_category: "analytics",
    page_section: "search_ranking",
    project_id: id,
  });

  // Knowledge base gate - show modal if company research doesn't exist
  if (companyResearchChecked && !hasCompanyResearch) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-4">
        <div className="mx-auto space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">Search Ranking</h1>
            <p className="text-gray-600 mt-2">
              Analyze search ranking performance across providers for your
              project.
            </p>
          </div>

          <div className="flex items-center justify-center pt-28">
            <KnowledgeBaseGateAlert
              projectId={id}
              description="Add your company research sources in the knowledge base before using Search Ranking."
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking
  if (!companyResearchChecked) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return <SearchRankingDashboard projectId={id} />;
}
