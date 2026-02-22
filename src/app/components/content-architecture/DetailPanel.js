"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Link2,
  Sparkles,
  Share2,
  BarChart3,
} from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import SEOTab from "./tabs/SEOTab";
import LinksTab from "./tabs/LinksTab";
import ContentTab from "./tabs/ContentTab";
import PromoteTab from "./tabs/PromoteTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import DetailPanelShimmer from "./DetailPanelShimmer";
import api from "../../../api/axios";
import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "seo", label: "SEO", icon: Search },
  { id: "links", label: "Links", icon: Link2 },
  { id: "content", label: "Content", icon: Sparkles },
  { id: "promote", label: "Promote", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function DetailPanel({
  selectedNode,
  architectId,
  projectDetails,
  projectId,
  onPageDeleted,
  onPageUpdated,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageDetailsRequestSeq = useRef(0);
  const pageIdFromUrl = searchParams?.get("pageId");

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const urlTab = searchParams?.get("caTab");
      if (urlTab && TABS.some((t) => t.id === urlTab)) {
        return urlTab;
      }

      const stored = localStorage.getItem("content-architecture-active-tab");
      if (stored && TABS.some((t) => t.id === stored)) {
        return stored;
      }
    }
    return "overview";
  });

  // Persist active tab to localStorage and URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("content-architecture-active-tab", activeTab);

    const params = new URLSearchParams(searchParams.toString());
    if (params.get("caTab") !== activeTab) {
      params.set("caTab", activeTab);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl);
    }
  }, [activeTab, router, searchParams]);

  const [loading, setLoading] = useState(() => Boolean(pageIdFromUrl));
  const [pageData, setPageData] = useState(null);
  const [pageTemplates, setPageTemplates] = useState([]);
  const [pageDetailsFromApi, setPageDetailsFromApi] = useState(null);

  const refetchPageDetails = useCallback(
    async ({ pageId, showLoading = false } = {}) => {
      const pageIdToFetch = pageId || selectedNode?.id || pageIdFromUrl;
      if (!pageIdToFetch || !architectId) return;

      const requestSeq = ++pageDetailsRequestSeq.current;

      if (showLoading) {
        setLoading(true);
        setPageData(null);
        setPageDetailsFromApi(null);
      }

      try {
        const response = await api.get(
          `/content-architecture/page/${architectId}/${pageIdToFetch}/`
        );

        if (requestSeq !== pageDetailsRequestSeq.current) {
          return;
        }

        if (response.data.success) {
          const normalizeUrl = (url) =>
            typeof url === "string" ? url.replace(/\/+$/, "") : url;
          const selectedUrl = normalizeUrl(selectedNode?.data?.url);
          const returnedUrl = normalizeUrl(response.data?.data?.url);
          if (selectedUrl && returnedUrl && selectedUrl !== returnedUrl) {
            console.error("Page details mismatch for selected node.", {
              selectedNodeId: selectedNode?.id,
              selectedUrl,
              returnedUrl,
            });
          }

          const apiData = response.data.data;
          setPageDetailsFromApi(apiData);
          setPageData({
            ...(selectedNode || {}),
            ...apiData,
            id: apiData?.page_id ?? selectedNode?.id,
            name: apiData?.page_title ?? selectedNode?.name,
            data: {
              ...(selectedNode?.data || {}),
              ...apiData,
              id:
                apiData?.page_id ??
                selectedNode?.data?.id ??
                selectedNode?.id,
              name:
                apiData?.page_title ??
                selectedNode?.data?.name ??
                selectedNode?.name,
            },
          });
        } else {
          console.error("Failed to fetch page details from API.", response.data);
        }
      } catch (err) {
        if (requestSeq !== pageDetailsRequestSeq.current) {
          return;
        }
        console.error("Error fetching page details from API:", err);
      } finally {
        if (showLoading && requestSeq === pageDetailsRequestSeq.current) {
          setLoading(false);
        }
      }
    },
    [architectId, pageIdFromUrl, selectedNode]
  );

  const handleRefreshPageDetails = useCallback(
    async ({ pageId, showLoading = true } = {}) => {
      await refetchPageDetails({
        pageId: pageId || selectedNode?.id || pageIdFromUrl,
        showLoading,
      });
    },
    [pageIdFromUrl, refetchPageDetails, selectedNode?.id]
  );

  useEffect(() => {
    if (projectId) {
      fetchBlueprints();
    }
  }, [projectId]);

  const fetchBlueprints = async () => {
    console.log("fetchBlueprints--------->", projectId);
    try {
      const response = await api.get(
        `/content-architecture/blueprint-information/${projectId}/`
      );
      if (response.data.success) {
        setPageTemplates(response.data.data.blueprint_information);
      }
    } catch (err) {
      console.error("An error occurred while fetching blueprints.", err);
    }
  };

  // Fetch page-specific details when selectedNode changes
  useEffect(() => {
    console.log("selectedNode--------->", selectedNode);
    console.log("architectId--------->", architectId);
    console.log("projectId--------->", projectId);
    console.log("selectedNode.id--------->", selectedNode?.id);
    console.log("pageIdFromUrl--------->", pageIdFromUrl);

    const pageIdToFetch = selectedNode?.id || pageIdFromUrl;

    if (pageIdToFetch && architectId) {
      refetchPageDetails({ pageId: pageIdToFetch, showLoading: true });
    } else if (!selectedNode) {
      setPageData(null);
      setPageDetailsFromApi(null);
    }
  }, [pageIdFromUrl, selectedNode?.uniqueId, selectedNode?.id, architectId, refetchPageDetails]);

  if (!selectedNode && !pageIdFromUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Page Selected
          </h3>
          <p className="text-gray-600">
            Select a page from the tree to view and edit its details
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading || (pageIdFromUrl && !pageData && !pageDetailsFromApi)) {
    return <DetailPanelShimmer />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-white overflow-x-auto"
    >
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-4 pb-2"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {pageData?.name ||
              pageDetailsFromApi?.page_title ||
              selectedNode?.name ||
              ""}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Node ID:{" "}
            {pageData?.id ||
              pageDetailsFromApi?.page_id ||
              selectedNode?.id ||
              ""}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 overflow-x-auto min-w-0">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "text-purple-600 bg-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                {tab.label}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-w-0 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full min-w-0"
          >
            {activeTab === "overview" && (
              <OverviewTab
                selectedNode={pageData || selectedNode}
                pageTemplates={pageTemplates}
                projectDetails={projectDetails}
                pageDetailsFromApi={pageDetailsFromApi}
                projectId={projectId}
                onPageDeleted={onPageDeleted}
                onPageUpdated={onPageUpdated}
                onRefreshPageDetails={handleRefreshPageDetails}
              />
            )}
            {activeTab === "seo" && (
              <SEOTab
                selectedNode={pageData || selectedNode}
                projectId={projectId}
                architectId={architectId}
                refetchPageDetails={refetchPageDetails}
              />
            )}
            {activeTab === "links" && (
              <LinksTab selectedNode={pageData || selectedNode} />
            )}
            {activeTab === "content" && (
              <ContentTab
                selectedNode={pageData || selectedNode}
                projectId={projectId}
              />
            )}
            {activeTab === "promote" && (
              <PromoteTab selectedNode={pageData || selectedNode} />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab selectedNode={pageData || selectedNode} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
