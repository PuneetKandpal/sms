"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  Clock,
  RefreshCcw,
  Loader2,
  Search,
  FileText,
  GitBranch,
  History,
  ChevronDown,
} from "lucide-react";

import aiDiscoverService from "../../api/aiDiscoverService";
import { useSelection } from "../../context/SelectionContext";
import { useTaskMonitor } from "../../context/TaskMonitorContext";

import SearchRankingForm from "./SearchRankingForm";
import SearchRankingTable from "./SearchRankingTable";
import SearchRankingChart from "./SearchRankingChart";
import SearchRankingHistoryDrawer from "./SearchRankingHistoryDrawer";

const ACTIVE_TASK_POLL_INTERVAL_MS = 1000 * 10; // 10 seconds for active task polling
const BACKGROUND_POLL_INTERVAL_MS = 1000 * 30; // 30 seconds for background polling (only when tasks exist)
const MIN_TASK_FETCH_INTERVAL_MS = 1000 * 5; // Throttle task status fetches to at most once every 5 seconds
const MIN_QUERY_FETCH_INTERVAL_MS = 1000 * 5; // Throttle project query fetches to at most once every 5 seconds
const TAB_NEW_QUERY = "new-query";
const TAB_SELECT_PREVIOUS = "select-previous";

function formatDateLabel(value, { includeTime = true } = {}) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      ...(includeTime && {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    return date.toLocaleString(undefined, options);
  } catch (error) {
    return null;
  }
}

function formatMetricNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
    return String(value);
  }

  return numeric.toLocaleString();
}

function getSafeTimestamp(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function getQueryRecencyScore(query) {
  const candidates = [
    getSafeTimestamp(query.updatedAt),
    getSafeTimestamp(query.latestVersion?.createdAt),
    getSafeTimestamp(query.createdAt),
  ].filter((value) => value != null);

  return candidates.length > 0 ? Math.max(...candidates) : 0;
}

function getVersionRecencyScore(version) {
  const meta = version.metadata || {};
  const timestampCandidates = [
    getSafeTimestamp(version.created_at),
    getSafeTimestamp(version.createdAt),
    getSafeTimestamp(meta.created_at),
    getSafeTimestamp(meta.createdAt),
  ].filter((value) => value != null);

  if (timestampCandidates.length > 0) {
    return Math.max(...timestampCandidates);
  }

  const numericCandidates = [
    meta.version,
    meta.version_number,
    meta.sequence,
    version.versionId,
  ]
    .map((value) => {
      const numeric = Number(value);
      return Number.isNaN(numeric) ? null : numeric;
    })
    .filter((value) => value != null);

  return numericCandidates.length > 0 ? Math.max(...numericCandidates) : 0;
}

function extractVersionsArray(payload) {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  const dataRoot = payload.data ?? payload;

  if (Array.isArray(dataRoot)) {
    return dataRoot;
  }

  if (Array.isArray(dataRoot.versions)) {
    return dataRoot.versions;
  }

  if (Array.isArray(dataRoot.results)) {
    return dataRoot.results;
  }

  if (Array.isArray(dataRoot.items)) {
    return dataRoot.items;
  }

  return [];
}

function normalizeVersionItems(rawList) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((version, index) => ({
    versionId:
      version.version_id ||
      version.id ||
      version.versionId ||
      version.query_version_id ||
      `version-${index + 1}`,
    label:
      version.version_label ||
      version.label ||
      version.version_name ||
      (version.version !== undefined
        ? `Version ${version.version}`
        : `Version ${index + 1}`),
    createdAt: version.created_at || version.createdAt || null,
    metadata: version,
  }));
}

function normalizeCompanyRows(payload, preferredVersionId) {
  const entries = Array.isArray(payload?.data) ? payload.data : [];

  if (!entries.length) {
    return {
      rows: [],
      resolvedVersionId: null,
      versionLabel: null,
    };
  }

  const targetId =
    preferredVersionId != null ? String(preferredVersionId) : null;

  const selectedEntry =
    entries.find((item) => {
      const dataId =
        item.data_id || item.version_id || item.id || item.query_version_id;
      if (dataId != null && targetId && String(dataId) === targetId) {
        return true;
      }

      if (
        targetId &&
        item.version != null &&
        String(item.version) === targetId
      ) {
        return true;
      }

      return false;
    }) || entries[0];

  const resolvedVersionId =
    (selectedEntry.version != null ? String(selectedEntry.version) : null) ||
    selectedEntry.data_id ||
    selectedEntry.version_id ||
    selectedEntry.id;

  const versionLabel =
    selectedEntry.version_label ||
    (selectedEntry.version != null ? `Version ${selectedEntry.version}` : null);

  const companiesByQuery =
    selectedEntry.companies_by_url_per_query || selectedEntry.results || {};

  const rows = [];

  Object.entries(companiesByQuery).forEach(([queryText, companiesMap]) => {
    Object.entries(companiesMap || {}).forEach(([domainKey, info], index) => {
      const providerRanks = {
        claude: info?.claude_rank ?? null,
        openai: info?.openai_rank ?? null,
        gemini: info?.gemini_rank ?? null,
        perplexity: info?.perplexity_rank ?? null,
        grok: info?.grok_rank ?? null,
      };

      const rankValues = Object.values(providerRanks).filter(
        (value) => typeof value === "number" && !Number.isNaN(value)
      );
      const bestRank = rankValues.length ? Math.min(...rankValues) : null;

      const rawUrl = info?.company_url?.trim() || "";
      const fallbackDomain = (domainKey || "").trim();
      const normalizedDomain = (rawUrl || fallbackDomain)
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      const companyUrl = rawUrl
        ? rawUrl
        : normalizedDomain
        ? `https://${normalizedDomain}`
        : null;
      const displayUrl =
        normalizedDomain || (companyUrl || "").replace(/^https?:\/\//, "");

      rows.push({
        id: `${resolvedVersionId || "version"}-${domainKey}-${index}`,
        queryText,
        companyName:
          info?.company_name || normalizedDomain || "Unknown company",
        companyUrl,
        displayUrl,
        domain: normalizedDomain,
        description: info?.brief_description || "",
        source: info?.source || null,
        foundBy: Array.isArray(info?.found_by_providers)
          ? info.found_by_providers
          : [],
        providerRanks,
        bestRank,
      });
    });
  });

  rows.sort((a, b) => {
    const aRank = a.bestRank ?? Number.POSITIVE_INFINITY;
    const bRank = b.bestRank ?? Number.POSITIVE_INFINITY;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.companyName.localeCompare(b.companyName);
  });

  return {
    rows,
    resolvedVersionId,
    versionLabel,
  };
}

function useNormalizedHistory(queryData) {
  return useMemo(() => {
    if (!queryData) return [];

    const dataRoot = queryData.data || queryData;
    const history =
      dataRoot.history ||
      dataRoot.ranking_history ||
      dataRoot.versions ||
      dataRoot.trend ||
      [];

    if (!Array.isArray(history)) return [];

    return history.map((item, index) => {
      const averageRank =
        item.average_rank ?? item.avg_rank ?? item.mean_rank ?? null;
      const bestRank = item.best_rank ?? item.top_rank ?? item.min_rank ?? null;
      const worstRank =
        item.worst_rank ?? item.bottom_rank ?? item.max_rank ?? null;
      const createdAt = item.created_at || item.date || item.timestamp || null;

      return {
        id: item.version_id || item.id || `history-${index}`,
        label:
          item.version_label ||
          item.version_name ||
          (item.version !== undefined
            ? `Version ${item.version}`
            : `Version ${index + 1}`),
        averageRank: averageRank ?? 0,
        bestRank: bestRank ?? null,
        worstRank: worstRank ?? null,
        timestamp: createdAt ? new Date(createdAt).toISOString() : null,
      };
    });
  }, [queryData]);
}

export default function SearchRankingDashboard({ projectId }) {
  const { selectedCompany } = useSelection();
  const { instantRefreshAfterTaskStart, setIsDrawerOpen } = useTaskMonitor();

  const [versionsByQuery, setVersionsByQuery] = useState({}); // queryId -> versions list
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [activeTab, setActiveTab] = useState(TAB_SELECT_PREVIOUS);

  const [queryData, setQueryData] = useState(null);
  const [loadingQueryData, setLoadingQueryData] = useState(false);
  const [rankingRows, setRankingRows] = useState([]);
  const [currentVersionLabel, setCurrentVersionLabel] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [pollingTask, setPollingTask] = useState(null); // { taskId, queryId }
  const [isPolling, setIsPolling] = useState(false);
  const isPollingRef = useRef(false);
  useEffect(() => {
    isPollingRef.current = isPolling;
  }, [isPolling]);

  const [taskStatus, setTaskStatus] = useState({
    summary: null,
    processing: [],
    completed: [],
    failed: [],
  });
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [projectQueries, setProjectQueries] = useState([]);
  const [loadingProjectQueries, setLoadingProjectQueries] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyPanelQueryId, setHistoryPanelQueryId] = useState(null);
  const [historyPanelVersionId, setHistoryPanelVersionId] = useState(null);

  const historyRows = useNormalizedHistory(queryData);

  const companyId = selectedCompany?.id;

  const isFetchingTasksRef = useRef(false);
  const lastTaskFetchRef = useRef(0);
  const isFetchingProjectQueriesRef = useRef(false);
  const lastProjectQueriesFetchRef = useRef(0);
  const lastAutoScrollKeyRef = useRef(null);

  const [apiErrors, setApiErrors] = useState([]);
  const [isAnyApiLoading, setIsAnyApiLoading] = useState(false);

  useEffect(() => {
    setIsAnyApiLoading(
      loadingTasks || loadingProjectQueries || loadingQueryData || isPolling
    );
  }, [
    loadingTasks,
    loadingProjectQueries,
    loadingQueryData,
    isPolling,
    setIsAnyApiLoading,
  ]);

  useEffect(() => {
    if (apiErrors.length > 0) {
      const errorMessage = apiErrors[0] || "One or more API requests failed";
      toast.error(errorMessage);
    }
  }, [apiErrors, setApiErrors]);

  // Function to handle API errors
  const handleApiError = useCallback(
    (error, context) => {
      console.error(`Error in ${context}:`, error);
      setApiErrors((prev) => [
        ...prev.filter((e) => e !== error),
        `${context}: ${error.message || error}`,
      ]);
    },
    [setApiErrors]
  );

  // Function to clear API errors
  const clearApiErrors = useCallback(() => {
    setApiErrors([]);
  }, []);

  const fetchTaskStatus = useCallback(
    async ({ showErrors = false, force = false } = {}) => {
      if (!projectId) {
        return;
      }

      const now = Date.now();
      if (
        !force &&
        now - lastTaskFetchRef.current < MIN_TASK_FETCH_INTERVAL_MS
      ) {
        return;
      }

      if (isFetchingTasksRef.current) {
        return;
      }

      isFetchingTasksRef.current = true;
      setLoadingTasks(true);
      try {
        const response = await aiDiscoverService.getTaskStatus({ projectId });

        if (!response.success) {
          handleApiError(
            response.error || "Failed to load task status",
            "task status"
          );
          if (showErrors || isPollingRef.current) {
            // toast.error(response.error || "Failed to load task status");
          }
          return;
        }

        const payload = response.data?.data || response.data || {};

        const normalizeTask = (task) => ({
          taskId: task.task_id || task.taskId,
          status: task.status || task.state || "UNKNOWN",
          progress:
            task.progress ?? task.percentage ?? task.progress_percent ?? null,
          totalQueries: task.total_queries ?? task.totalQueries ?? null,
          processedQueries:
            task.processed_queries ?? task.processedQueries ?? null,
          successfulQueries:
            task.successful_queries ?? task.successfulQueries ?? null,
          failedQueries: task.failed_queries ?? task.failedQueries ?? null,
          createdAt: task.created_at || task.createdAt || null,
          updatedAt: task.updated_at || task.updatedAt || null,
          completedAt: task.completed_at || task.completedAt || null,
          queries: task.queries || [],
          error: task.error || null,
          providers: task.providers || [],
          storedData: task.stored_data || [],
        });

        setTaskStatus({
          summary: {
            total: payload.total_tasks ?? 0,
            processing: payload.processing_count ?? 0,
            completed: payload.completed_count ?? 0,
            failed: payload.failed_count ?? 0,
          },
          processing: (payload.processing_tasks || []).map(normalizeTask),
          completed: (payload.completed_tasks || []).map(normalizeTask),
          failed: (payload.failed_tasks || []).map(normalizeTask),
        });
        lastTaskFetchRef.current = Date.now();
      } finally {
        isFetchingTasksRef.current = false;
        setLoadingTasks(false);
      }
    },
    [projectId]
  );

  const normalizeProjectQueries = useCallback((payload) => {
    const list = payload?.queries || payload?.data?.queries || [];
    if (!Array.isArray(list)) return [];

    const normalized = list.map((item, index) => {
      const latest = item.latest_version || item.latestVersion || null;
      return {
        queryId: item.query_id || item.id || `query-${index}`,
        query: item.query || item.query_text || "Untitled query",
        createdAt: item.created_at || item.createdAt || null,
        updatedAt: item.updated_at || item.updatedAt || null,
        totalVersions:
          item.total_versions ??
          item.totalVersions ??
          (latest?.version != null ? latest.version : 0),
        latestVersion: latest
          ? {
              version: latest.version ?? latest.version_number ?? null,
              companiesCount:
                latest.companies_count ?? latest.companiesCount ?? null,
              createdAt: latest.created_at || latest.createdAt || null,
              executionTimeSeconds:
                latest.execution_time_seconds ??
                latest.executionTimeSeconds ??
                null,
            }
          : null,
        raw: item,
      };
    });

    normalized.sort((a, b) => {
      const diff = getQueryRecencyScore(b) - getQueryRecencyScore(a);
      if (diff !== 0) return diff;
      return String(b.queryId).localeCompare(String(a.queryId));
    });

    return normalized;
  }, []);

  const fetchProjectQueries = useCallback(
    async ({ silent = false, force = false } = {}) => {
      if (!projectId || !companyId) return;

      const now = Date.now();
      if (
        !force &&
        now - lastProjectQueriesFetchRef.current < MIN_QUERY_FETCH_INTERVAL_MS
      ) {
        return;
      }

      if (isFetchingProjectQueriesRef.current) {
        return;
      }

      isFetchingProjectQueriesRef.current = true;

      if (!silent) {
        setLoadingProjectQueries(true);
      }

      try {
        const response = await aiDiscoverService.getProjectQueries({
          projectId,
          companyId,
        });

        if (!response.success) {
          handleApiError(
            response.error || "Failed to fetch project queries",
            "project queries"
          );
          return;
        }

        const normalizedQueries = normalizeProjectQueries(response.data);
        setProjectQueries(normalizedQueries);
        lastProjectQueriesFetchRef.current = Date.now();

        // If there are no previous queries for this project, default to the
        // "Search New Query" tab once the API has responded.
        if (!silent && normalizedQueries.length === 0) {
          setActiveTab(TAB_NEW_QUERY);
        }
      } finally {
        if (!silent) {
          setLoadingProjectQueries(false);
        }
        isFetchingProjectQueriesRef.current = false;
      }
    },
    [projectId, companyId, normalizeProjectQueries]
  );

  const fetchQueryData = useCallback(
    async ({ queryId, versionId = null, silent = false } = {}) => {
      if (!projectId || !companyId || !queryId) return;

      if (!silent) {
        setLoadingQueryData(true);
        setStatusMessage("Loading query data...");
      }

      const response = await aiDiscoverService.getQueryData({
        projectId,
        companyId,
        queryId,
        versionId,
      });

      if (!response.success) {
        const errorMessage = response.error || "Failed to load query data";

        // Treat "No data found for this query" as a normal empty state rather
        // than a global API error so we don't show the bottom error bar for it.
        const normalizedError = String(errorMessage).toLowerCase();
        const isNoDataError = normalizedError.includes(
          "no data found for this query"
        );

        if (!isNoDataError) {
          handleApiError(errorMessage, "query data");
        }

        if (!silent) {
          setLoadingQueryData(false);
        }

        setStatusMessage(errorMessage || "Unable to load query data");
        setRankingRows([]);
        setCurrentVersionLabel(null);
        setQueryData(null);
        return;
      }

      const payload = response.data;
      const { rows, resolvedVersionId, versionLabel } = normalizeCompanyRows(
        payload,
        versionId
      );

      console.log("=== FETCH QUERY DATA ===");
      console.log("Input versionId:", versionId);
      console.log("Resolved versionId:", resolvedVersionId);
      console.log("Version label:", versionLabel);
      console.log("Current selectedVersionId:", selectedVersionId);
      console.log("Data payload keys:", Object.keys(payload || {}));
      console.log("Rows count:", rows?.length || 0);

      setQueryData(payload);
      setRankingRows(rows);

      const fallbackVersionLabel =
        versionLabel ||
        (selectedQueryId &&
          versionsByQuery[selectedQueryId]?.find((item) => {
            const candidateId = String(item.versionId ?? item.version_id ?? "");
            const comparisonTarget = String(
              resolvedVersionId ?? versionId ?? ""
            );
            return comparisonTarget && candidateId === comparisonTarget;
          })?.label) ||
        null;

      setCurrentVersionLabel(fallbackVersionLabel);

      if (!selectedVersionId && (resolvedVersionId || versionId)) {
        setSelectedVersionId(resolvedVersionId || versionId);
      }

      if (!silent) {
        setLoadingQueryData(false);
        setStatusMessage("Query data loaded successfully");
      }
    },
    [projectId, companyId, selectedVersionId, selectedQueryId, versionsByQuery]
  );

  const fetchQueryVersions = useCallback(
    async ({ queryId, silent = false, force = false } = {}) => {
      console.log("=== FETCH QUERY VERSIONS ===");
      console.log("queryId:", queryId);
      console.log("silent:", silent);
      console.log("force:", force);

      if (!projectId || !companyId || !queryId) {
        console.log("FETCH VERSIONS: Missing required params, returning");
        return [];
      }

      const targetQueryId = String(queryId);
      console.log("FETCH VERSIONS: Starting fetch for query:", targetQueryId);
      console.log("FETCH VERSIONS: force:", !!force);
      console.log("FETCH VERSIONS: silent:", !!silent);

      const cachedVersions = versionsByQuery[targetQueryId];
      console.log("FETCH VERSIONS: Cached versions:", cachedVersions);
      console.log(
        "FETCH VERSIONS: Cached versions length:",
        cachedVersions?.length || 0
      );

      if (!force && cachedVersions && cachedVersions.length > 0) {
        console.log(
          "FETCH VERSIONS: Returning cached versions (count:",
          cachedVersions.length,
          ")"
        );
        if (!silent) setLoadingVersions(false);
        return cachedVersions;
      }

      if (!silent) {
        setLoadingVersions(true);
        setStatusMessage("Loading query versions...");
      }

      try {
        console.log(
          "FETCH VERSIONS: Making API call for query:",
          targetQueryId
        );
        console.log("FETCH VERSIONS: API params:", {
          projectId,
          companyId,
          queryId: targetQueryId,
        });
        console.log("FETCH VERSIONS: aiDiscoverService:", aiDiscoverService);
        console.log(
          "FETCH VERSIONS: getQueryVersions method:",
          aiDiscoverService.getQueryVersions
        );

        const response = await aiDiscoverService.getQueryVersions({
          projectId,
          companyId,
          queryId: targetQueryId,
        });

        console.log("FETCH VERSIONS: Full API response:", response);
        console.log("FETCH VERSIONS: response.success:", response.success);
        console.log("FETCH VERSIONS: response.data:", response.data);
        console.log(
          "FETCH VERSIONS: response.data type:",
          typeof response.data
        );
        console.log(
          "FETCH VERSIONS: response.data isArray:",
          Array.isArray(response.data)
        );

        // Debug: Log all keys and nested structure
        if (response.data && typeof response.data === "object") {
          console.log(
            "FETCH VERSIONS: response.data keys:",
            Object.keys(response.data)
          );
          // Check if versions are nested under a 'versions' key
          if (response.data.versions) {
            console.log(
              "FETCH VERSIONS: found versions key:",
              response.data.versions
            );
            console.log(
              "FETCH VERSIONS: versions type:",
              typeof response.data.versions
            );
            console.log(
              "FETCH VERSIONS: versions isArray:",
              Array.isArray(response.data.versions)
            );
          }
          // Check for other possible version keys
          [
            "versions",
            "version_list",
            "versionData",
            "query_versions",
            "items",
          ].forEach((key) => {
            if (response.data[key]) {
              console.log(
                `FETCH VERSIONS: found potential versions in '${key}':`,
                response.data[key]
              );
            }
          });
        }

        if (!response.success) {
          console.log("FETCH VERSIONS: API error:", response.error);
          handleApiError(
            response.error || "Failed to load query versions",
            "versions"
          );
          if (!silent) setLoadingVersions(false);
          setStatusMessage(response.error || "Unable to load query versions");
          return [];
        }

        // Extract versions from the nested structure
        const versionsArray = Array.isArray(response.data)
          ? response.data
          : response.data?.versions || [];
        console.log(
          "FETCH VERSIONS: Got",
          versionsArray.length,
          "versions from API"
        );

        const sortedVersions = [...versionsArray].sort(
          (a, b) => getVersionRecencyScore(b) - getVersionRecencyScore(a)
        );

        console.log(
          "FETCH VERSIONS: After sorting, first version (latest):",
          sortedVersions[0]
        );

        setVersionsByQuery((prev) => ({
          ...prev,
          [targetQueryId]: sortedVersions,
        }));

        if (!silent) setLoadingVersions(false);
        console.log(
          "FETCH VERSIONS: Success, returning",
          sortedVersions.length,
          "versions"
        );
        return sortedVersions;
      } catch (error) {
        console.log("FETCH VERSIONS: Exception:", error);
        if (!silent) setLoadingVersions(false);
        handleApiError(
          error.message || "Failed to load query versions",
          "versions"
        );
        setStatusMessage(error.message || "Unable to load query versions");
        return [];
      }
    },
    [projectId, companyId, selectedQueryId, versionsByQuery, handleApiError]
  );

  // Function to retry all failed API calls
  const handleRetryAll = useCallback(() => {
    clearApiErrors();
    fetchTaskStatus({ force: true });
    fetchProjectQueries({ force: true });
    if (selectedQueryId) {
      fetchQueryData({
        queryId: selectedQueryId,
        versionId: selectedVersionId,
        force: true,
      });
    }
  }, [
    clearApiErrors,
    fetchTaskStatus,
    fetchProjectQueries,
    fetchQueryData,
    selectedQueryId,
    selectedVersionId,
  ]);

  useEffect(() => {
    fetchTaskStatus({ showErrors: false });
    // Load project queries with visible loader so previous-query UI reflects loading state
    fetchProjectQueries();
  }, [fetchTaskStatus, fetchProjectQueries]);

  // Initial default query selection when there is history but nothing is
  // selected yet.
  useEffect(() => {
    console.log("=== INITIAL QUERY SELECTION USEEFFECT ===");
    console.log("selectedQueryId:", selectedQueryId);
    console.log("projectQueries.length:", projectQueries.length);

    if (selectedQueryId || projectQueries.length === 0) {
      console.log("EARLY RETURN - selectedQueryId exists or no queries");
      return;
    }

    const defaultQuery = projectQueries[0];
    console.log("Default query:", defaultQuery);

    if (!defaultQuery?.queryId) {
      console.log("NO QUERY ID ON DEFAULT QUERY");
      return;
    }

    const defaultQueryId = defaultQuery.queryId;
    console.log("Setting default queryId:", defaultQueryId);

    setSelectedQueryId(defaultQueryId);
    setHistoryPanelQueryId(defaultQueryId);

    console.log("Calling fetchQueryVersions for default query");
    fetchQueryVersions({ queryId: defaultQueryId, silent: true }).then(
      (versions) => {
        console.log("INITIAL QUERY SELECTION: Got versions:", versions);
        if (Array.isArray(versions) && versions.length > 0) {
          const [{ label, metadata }] = versions;
          setCurrentVersionLabel((current) => {
            if (current) return current;
            const versionMetadata = metadata || {};
            return (
              label ||
              versionMetadata.version_label ||
              (versionMetadata.version != null
                ? `Version ${versionMetadata.version}`
                : null)
            );
          });
        }
      }
    );
  }, [projectQueries, selectedQueryId, fetchQueryVersions]);

  // Keep history drawer query in sync with main selection so the same
  // query is highlighted when the drawer opens.
  useEffect(() => {
    if (!selectedQueryId) return;
    setHistoryPanelQueryId(selectedQueryId);
  }, [selectedQueryId]);

  // Auto-select latest version when query changes
  useEffect(() => {
    console.log("=== AUTO-SELECT USEEFFECT TRIGGERED ===");
    console.log("selectedQueryId:", selectedQueryId);
    console.log("selectedVersionId:", selectedVersionId);
    console.log("versionsByQuery keys:", Object.keys(versionsByQuery));

    if (!selectedQueryId) {
      console.log("AUTO-SELECT: Early return - no queryId");
      return;
    }

    const versions = versionsByQuery[selectedQueryId];
    console.log("AUTO-SELECT: Available versions:", versions);

    // Always fetch versions if they're missing, regardless of selectedVersionId
    if (!versions || versions.length === 0) {
      console.log("AUTO-SELECT: No versions available, fetching them...");
      fetchQueryVersions({ queryId: selectedQueryId, force: true });
      return;
    }

    // Only auto-select version if none is selected
    if (!selectedVersionId) {
      console.log("AUTO-SELECT: No version selected, choosing latest...");
      // Sort by version number (descending) to get the latest
      const sortedVersions = [...versions].sort((a, b) => {
        const aVersion = parseInt(a.version || 0);
        const bVersion = parseInt(b.version || 0);
        return bVersion - aVersion;
      });

      const latestVersion = sortedVersions[0];
      console.log("AUTO-SELECT: Selected latest version:", latestVersion);

      if (latestVersion) {
        // Generate versionId from queryId and version number
        const versionId = `${latestVersion.version}`;
        setSelectedVersionId(versionId);
        setHistoryPanelVersionId(versionId);
      }
    } else {
      console.log("AUTO-SELECT: Version already selected, skipping");
    }
  }, [selectedQueryId, selectedVersionId, versionsByQuery, fetchQueryVersions]);

  useEffect(() => {
    if (!historyPanelQueryId) return;

    if (historyPanelQueryId === selectedQueryId) {
      setHistoryPanelVersionId(selectedVersionId);
    }
  }, [historyPanelQueryId, selectedQueryId, selectedVersionId]);

  // Fetch query data when query or version changes
  useEffect(() => {
    console.log("=== FETCH DATA USEEFFECT TRIGGERED ===");
    console.log("selectedQueryId:", selectedQueryId);
    console.log("selectedVersionId:", selectedVersionId);

    if (!selectedQueryId) {
      console.log("FETCH DATA: No queryId, returning");
      return;
    }

    console.log(
      "FETCH DATA: Calling fetchQueryData with versionId:",
      selectedVersionId
    );
    fetchQueryData({ queryId: selectedQueryId, versionId: selectedVersionId });
    console.log("=== FETCH DATA USEEFFECT END ===");
  }, [selectedQueryId, selectedVersionId, fetchQueryData]);

  useEffect(() => {
    if (
      selectedQueryId &&
      !projectQueries.some((item) => item.queryId === selectedQueryId)
    ) {
      setSelectedQueryId(null);
      setSelectedVersionId(null);
      setQueryData(null);
      setRankingRows([]);
      setCurrentVersionLabel(null);
    }
  }, [projectQueries, selectedQueryId]);

  // Periodic background polling
  // - Always poll every BACKGROUND_POLL_INTERVAL_MS to keep data fresh
  useEffect(() => {
    if (!projectId) return;

    // Check if there are any active tasks in the processing array
    const hasActiveTasks =
      Array.isArray(taskStatus?.processing) && taskStatus.processing.length > 0;

    if (!hasActiveTasks) {
      // No active tasks, no need to poll frequently
      return;
    }

    const interval = setInterval(() => {
      fetchTaskStatus({ showErrors: false });
      fetchProjectQueries({ silent: true });
    }, BACKGROUND_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [projectId, taskStatus, fetchTaskStatus, fetchProjectQueries]);

  useEffect(() => {
    if (!pollingTask?.taskId) return;

    setIsPolling(true);
    setStatusMessage("Processing search...");

    const interval = setInterval(async () => {
      const response = await aiDiscoverService.getTaskStatus({
        projectId,
        taskId: pollingTask.taskId,
      });

      if (!response.success) {
        // Silent error - no toast during polling
        setIsPolling(false);
        setPollingTask(null);
        clearInterval(interval);
        return;
      }

      const payload = response.data?.data || response.data || {};

      // Support both detailed single-task payloads and aggregated
      // task-status payloads with processing/completed/failed arrays.
      let taskPayload = payload;

      if (
        !taskPayload.status &&
        (Array.isArray(payload.processing_tasks) ||
          Array.isArray(payload.completed_tasks) ||
          Array.isArray(payload.failed_tasks))
      ) {
        const allTasks = [
          ...(payload.processing_tasks || []),
          ...(payload.completed_tasks || []),
          ...(payload.failed_tasks || []),
        ];

        taskPayload =
          allTasks.find(
            (task) => (task.task_id || task.taskId) === pollingTask.taskId
          ) || {};
      }

      const rawStatus =
        taskPayload.status ||
        taskPayload.state ||
        taskPayload.task_status ||
        payload.status ||
        payload.state ||
        payload.task_status;
      const status =
        typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";

      if (status === "completed" || status === "success") {
        toast.success("Search completed successfully");
        setStatusMessage("Search completed successfully");
        setIsPolling(false);
        setPollingTask(null);
        clearInterval(interval);

        // Derive completed query + version from both top-level fields and
        // nested stored_data, to match the current backend payload shape.
        let completedQueryId =
          payload.query_id ||
          payload.queryId ||
          taskPayload.query_id ||
          taskPayload.queryId ||
          pollingTask.queryId ||
          null;

        let completedVersionId =
          payload.version_id ||
          payload.versionId ||
          taskPayload.version_id ||
          taskPayload.versionId ||
          null;

        if (
          Array.isArray(taskPayload.stored_data) &&
          taskPayload.stored_data[0]
        ) {
          const stored = taskPayload.stored_data[0];

          if (!completedQueryId) {
            completedQueryId = stored.query_id || stored.queryId || null;
          }

          if (
            !completedVersionId &&
            (stored.version != null || stored.version_number != null)
          ) {
            completedVersionId = String(
              stored.version ?? stored.version_number
            );
          }
        }

        if (completedQueryId) {
          await fetchQueryVersions({
            queryId: completedQueryId,
            silent: true,
            force: true,
          });
          await fetchTaskStatus({ showErrors: true });
          await fetchProjectQueries({ silent: true });

          setSelectedQueryId(completedQueryId);
          setSelectedVersionId(completedVersionId || null);

          fetchQueryData({
            queryId: completedQueryId,
            versionId: completedVersionId || undefined,
            silent: true,
          });
        }

        // After a successful search completion, make sure the UI reflects
        // this as a historical query by showing the "Select Previous Query"
        // tab with the completed query/version selected.
        setActiveTab(TAB_SELECT_PREVIOUS);
      } else if (status === "failed" || status === "error") {
        toast.error(payload.message || "Search failed");
        setStatusMessage(payload.message || "Search failed");
        setIsPolling(false);
        setPollingTask(null);
        clearInterval(interval);
      } else {
        const progress =
          payload.progress ?? payload.percentage ?? payload.progress_percent;
        if (progress != null) {
          setStatusMessage(`Processing search (${Math.round(progress)}%)...`);
        } else {
          setStatusMessage("Processing search...");
        }
      }
    }, ACTIVE_TASK_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [
    pollingTask,
    projectId,
    fetchQueryData,
    fetchQueryVersions,
    fetchTaskStatus,
    fetchProjectQueries,
    setActiveTab,
  ]);

  const handleOpenHistoryDrawer = useCallback(() => {
    const fallbackQueryId =
      historyPanelQueryId ||
      selectedQueryId ||
      projectQueries?.[0]?.queryId ||
      null;

    if (fallbackQueryId) {
      setHistoryPanelQueryId(fallbackQueryId);
      if (fallbackQueryId === selectedQueryId && selectedVersionId != null) {
        setHistoryPanelVersionId(selectedVersionId);
      } else {
        const cachedVersions = versionsByQuery[fallbackQueryId];
        if (Array.isArray(cachedVersions) && cachedVersions.length > 0) {
          setHistoryPanelVersionId(cachedVersions[0].versionId);
        }
      }
      fetchQueryVersions({ queryId: fallbackQueryId, silent: true });
    }

    setActiveTab(TAB_SELECT_PREVIOUS);
    setIsHistoryDrawerOpen(true);
  }, [
    historyPanelQueryId,
    selectedQueryId,
    projectQueries,
    fetchQueryVersions,
    setActiveTab,
  ]);

  const handleSubmitSearch = useCallback(
    async ({ query, queries }) => {
      if (!projectId) {
        toast.error("No project selected. Please pick a project first.");
        return;
      }

      if (!companyId) {
        toast.error("No company context found. Please pick a company first.");
        return;
      }

      if (!query?.trim()) {
        toast.error("Please enter a search query");
        return;
      }

      const queriesPayload =
        Array.isArray(queries) && queries.length > 0 ? queries : [query.trim()];

      const trimmedPrimaryQuery = (queriesPayload[0] || "").trim();
      setSearchInputValue(trimmedPrimaryQuery);

      const existingRecord =
        projectQueries.find(
          (item) => (item.query || "").trim() === trimmedPrimaryQuery
        ) || null;

      if (existingRecord) {
        setSelectedQueryId(existingRecord.queryId);
        setHistoryPanelQueryId((prev) => prev ?? existingRecord.queryId);
        setActiveTab(TAB_SELECT_PREVIOUS);
      }

      setSubmitting(true);
      setStatusMessage("Submitting search request...");

      const response = await aiDiscoverService.submitSearch({
        projectId,
        companyId,
        query: query.trim(),
        queries: queriesPayload,
      });

      setSubmitting(false);

      if (!response.success) {
        handleApiError(
          response.error || "Failed to submit search",
          "submit search"
        );
        setStatusMessage(response.error || "Failed to submit search");
        return;
      }

      const payload = response.data?.data || response.data || {};
      const taskId = payload.task_id || payload.taskId;
      const queryId = payload.query_id || payload.queryId;

      if (!taskId) {
        handleApiError(
          "No task information returned by the server",
          "submit search"
        );
        setStatusMessage("Unable to track search progress");
        return;
      }

      toast.success("Search started. We will update you shortly.");
      setStatusMessage("Search started. Waiting for results...");

      // Track whether this project already had historical queries when this
      // polling cycle started, so we can treat the very first successful query
      // specially (switching to the Select Previous Query tab).
      const hadQueriesAtStart = projectQueries.length > 0;

      setPollingTask({ taskId, queryId, hadQueriesAtStart });
      fetchTaskStatus({ showErrors: false });
      fetchProjectQueries();

      // Open global task monitor and refresh after task start
      await instantRefreshAfterTaskStart();
      setIsDrawerOpen(true);

      // Extra version toast: check if any versions exist for this query yet
      if (queryId) {
        fetchQueryVersions({ queryId, silent: true }).then((versions) => {
          if (!Array.isArray(versions) || versions.length === 0) {
            toast.error("versions: No versions found for this query.");
          }
        });
      }
    },
    [
      projectId,
      companyId,
      fetchTaskStatus,
      fetchProjectQueries,
      projectQueries,
      fetchQueryVersions,
      setActiveTab,
      instantRefreshAfterTaskStart,
      setIsDrawerOpen,
    ]
  );

  const handleRerunQuery = useCallback(
    (queryItem) => {
      if (!queryItem?.query) return;
      handleSubmitSearch({
        query: queryItem.query,
        queries: [queryItem.query],
      });
    },
    [handleSubmitSearch]
  );

  const currentQueryInfo = useMemo(() => {
    const dataRoot = (queryData && (queryData.data || queryData)) || {};
    const queryDetails = dataRoot.query || dataRoot.details || {};

    const queryText =
      queryDetails.query ||
      queryDetails.query_text ||
      dataRoot.query ||
      dataRoot.query_text ||
      "";

    const createdAt =
      queryDetails.created_at || queryDetails.createdAt || dataRoot.created_at;

    const versionLabel =
      queryDetails.version_label ||
      queryDetails.version_name ||
      (queryDetails.version !== undefined
        ? `Version ${queryDetails.version}`
        : null);

    const summaryMetrics = {
      averageRank:
        dataRoot.average_rank ||
        dataRoot.avg_rank ||
        dataRoot.summary?.average_rank ||
        null,
      bestRank: dataRoot.best_rank || dataRoot.summary?.best_rank || null,
      totalResults: rankingRows.length,
    };

    return {
      queryText,
      createdAt,
      versionLabel,
      summaryMetrics,
    };
  }, [queryData, rankingRows.length]);

  const selectedQueryRecord = useMemo(() => {
    if (!selectedQueryId) return null;
    return (
      projectQueries.find((item) => item.queryId === selectedQueryId) || null
    );
  }, [projectQueries, selectedQueryId]);

  const matchingSavedQuery = useMemo(() => {
    const trimmed = searchInputValue.trim();
    if (!trimmed) return null;
    return (
      projectQueries.find((item) => (item.query || "").trim() === trimmed) ||
      null
    );
  }, [projectQueries, searchInputValue]);

  const latestVersionSummary = selectedQueryRecord?.latestVersion || null;

  const isNewQueryTab = activeTab === TAB_NEW_QUERY;
  const isSelectPreviousTab = activeTab === TAB_SELECT_PREVIOUS;

  const submitLabel = useMemo(() => {
    const trimmed = searchInputValue.trim();
    if (!trimmed) {
      return "Run Search";
    }
    // For new query tab, always show "Add New Query" regardless of existing matches
    return isNewQueryTab
      ? "Add New Query"
      : matchingSavedQuery
      ? "Rerun Search"
      : "Add New Query";
  }, [matchingSavedQuery, searchInputValue, isNewQueryTab]);

  // --- Drawer context ----
  const drawerQueryId =
    historyPanelQueryId ??
    selectedQueryId ??
    selectedQueryRecord?.queryId ??
    null;

  const drawerQueryRecord = useMemo(
    () =>
      drawerQueryId
        ? projectQueries.find((item) => item.queryId === drawerQueryId) || null
        : null,
    [projectQueries, drawerQueryId]
  );

  const currentVersionMeta = useMemo(() => {
    console.log("=== CALCULATING CURRENT VERSION META ===");
    console.log("selectedQueryId:", selectedQueryId);
    console.log("selectedVersionId:", selectedVersionId);
    console.log("versionsByQuery keys:", Object.keys(versionsByQuery));

    if (!selectedQueryId || !selectedVersionId) {
      console.log("VERSION META: Missing queryId or versionId, returning null");
      return null;
    }

    const variants = versionsByQuery[selectedQueryId] || [];
    console.log("VERSION META: Available versions for query:", variants.length);

    const foundVersion =
      variants.find(
        (version) => String(version.version) === String(selectedVersionId)
      ) || null;

    console.log(
      "VERSION META: Found version:",
      foundVersion
        ? {
            version: foundVersion.version,
            created_at: foundVersion.created_at,
          }
        : "NOT FOUND"
    );

    console.log("=== VERSION META CALCULATION END ===");
    return foundVersion;
  }, [selectedQueryId, selectedVersionId, versionsByQuery]);

  const drawerVersions =
    drawerQueryId && Array.isArray(versionsByQuery[drawerQueryId])
      ? (() => {
          console.log("=== DRAWER VERSIONS DEBUG ===");
          console.log("drawerQueryId:", drawerQueryId);
          console.log(
            "versionsByQuery[drawerQueryId]:",
            versionsByQuery[drawerQueryId]
          );
          console.log(
            "Number of versions:",
            versionsByQuery[drawerQueryId].length
          );
          console.log("versionsByQuery keys:", Object.keys(versionsByQuery));
          console.log("All versionsByQuery:", versionsByQuery);
          console.log("=== DRAWER VERSIONS DEBUG END ===");
          return versionsByQuery[drawerQueryId];
        })()
      : (() => {
          console.log("=== NO DRAWER VERSIONS ===");
          console.log("drawerQueryId:", drawerQueryId);
          console.log("versionsByQuery:", versionsByQuery);
          console.log("=== NO DRAWER VERSIONS END ===");
          return [];
        })();

  const drawerActiveVersionId = useMemo(() => {
    console.log("=== DRAWER ACTIVE VERSION ID ===");
    console.log("historyPanelQueryId:", historyPanelQueryId);
    console.log("historyPanelVersionId:", historyPanelVersionId);
    console.log("selectedQueryId:", selectedQueryId);
    console.log("selectedVersionId:", selectedVersionId);

    if (!historyPanelQueryId) {
      console.log(
        "DRAWER ACTIVE: No history panel query, returning historyPanelVersionId:",
        historyPanelVersionId
      );
      return historyPanelVersionId;
    }
    if (historyPanelQueryId === selectedQueryId) {
      console.log(
        "DRAWER ACTIVE: Same query, returning selectedVersionId:",
        selectedVersionId
      );
      return selectedVersionId;
    }
    console.log(
      "DRAWER ACTIVE: Different query, returning historyPanelVersionId:",
      historyPanelVersionId
    );
    return historyPanelVersionId;
  }, [
    historyPanelQueryId,
    historyPanelVersionId,
    selectedQueryId,
    selectedVersionId,
  ]);

  const handleHistoryQuerySelect = useCallback(
    async (queryItem) => {
      console.log("=== HANDLE QUERY SELECT START ===");
      console.log("Query item:", queryItem);

      if (!queryItem?.queryId) {
        console.log("ERROR: No queryId in queryItem");
        return;
      }

      console.log("SETTING UP NEW QUERY SELECTION");
      console.log("Previous selectedQueryId:", selectedQueryId);
      console.log("Previous selectedVersionId:", selectedVersionId);
      console.log("New queryId:", queryItem.queryId);

      setStatusMessage("Loading query selection...");
      setHistoryPanelQueryId(queryItem.queryId);
      setSelectedQueryId(queryItem.queryId);
      setSelectedVersionId(null);
      setHistoryPanelVersionId(null);
      setRankingRows([]);
      setCurrentVersionLabel(null);
      setQueryData(null);

      console.log("ABOUT TO CALL FETCH QUERY VERSIONS");
      // Always fetch fresh versions from API
      const versions = await fetchQueryVersions({
        queryId: queryItem.queryId,
        force: true,
      });
      console.log("FETCH QUERY VERSIONS RETURNED:", versions);
      console.log("=== HANDLE QUERY SELECT END ===");
    },
    [fetchQueryVersions, selectedQueryId, selectedVersionId]
  );

  const handleHistoryVersionSelect = useCallback(
    (versionItem) => {
      if (!versionItem) return;

      const targetQueryId =
        historyPanelQueryId ||
        versionItem.metadata?.query_id ||
        selectedQueryId ||
        drawerQueryId;

      if (!targetQueryId) {
        setIsHistoryDrawerOpen(false);
        return;
      }

      const nextVersionId = versionItem.version
        ? `${versionItem.version}`
        : null;
      const versionMetadata = versionItem.metadata || {};
      const friendlyLabel =
        versionItem.label ||
        versionMetadata.version_label ||
        versionMetadata.label ||
        (versionMetadata.version != null
          ? `Version ${versionMetadata.version}`
          : versionMetadata.version_number != null
          ? `Version ${versionMetadata.version_number}`
          : null);

      const isSameSelection =
        String(selectedQueryId) === String(targetQueryId) &&
        ((selectedVersionId == null && nextVersionId == null) ||
          String(selectedVersionId) === String(nextVersionId));

      setHistoryPanelQueryId(targetQueryId);
      setSelectedQueryId(targetQueryId);
      setSelectedVersionId(nextVersionId);
      setHistoryPanelVersionId(nextVersionId);
      setCurrentVersionLabel(friendlyLabel);
      setIsHistoryDrawerOpen(false);

      if (isSameSelection) {
        fetchQueryData({
          queryId: targetQueryId,
          versionId: nextVersionId,
          silent: false,
        });
      }
    },
    [
      historyPanelQueryId,
      selectedQueryId,
      selectedVersionId,
      drawerQueryId,
      fetchQueryData,
    ]
  );

  const hasHistoricalData = historyRows.length > 0;

  const hasProjectQueries = projectQueries.length > 0;
  const currentQueryVersions =
    selectedQueryId && Array.isArray(versionsByQuery[selectedQueryId])
      ? versionsByQuery[selectedQueryId]
      : [];
  const hasVersionsForSelectedQuery = currentQueryVersions.length > 0;

  const summaryMetricCards = selectedQueryId
    ? [
        {
          label: "Average Rank",
          value: formatMetricNumber(
            currentQueryInfo.summaryMetrics.averageRank ?? null
          ),
        },
        {
          label: "Best Rank",
          value: formatMetricNumber(
            currentQueryInfo.summaryMetrics.bestRank ?? null
          ),
        },
        {
          label: "Results Displayed",
          value: formatMetricNumber(
            currentQueryInfo.summaryMetrics.totalResults ?? rankingRows.length
          ),
        },
      ]
    : [];

  const handleRefreshSelection = useCallback(() => {
    if (!selectedQueryId) {
      fetchProjectQueries();
      return;
    }

    setStatusMessage("Refreshing selection...");
    fetchQueryVersions({
      queryId: selectedQueryId,
      silent: true,
      force: true,
    });
    fetchQueryData({
      queryId: selectedQueryId,
      versionId: selectedVersionId,
      silent: true,
    });
  }, [
    selectedQueryId,
    selectedVersionId,
    fetchProjectQueries,
    fetchQueryVersions,
    fetchQueryData,
  ]);

  return (
    <div className="space-y-8 py-4 px-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Search Ranking Intelligence
          </h1>
          <p className="text-gray-600">
            Run AI-powered discovery queries and explore ranking trends for key
            companies.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative inline-flex items-center rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab(TAB_NEW_QUERY)}
              className={clsx(
                "relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
                isNewQueryTab
                  ? "text-sky-800"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {isNewQueryTab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-sky-100"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">Search New Query</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TAB_SELECT_PREVIOUS)}
              className={clsx(
                "relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors text-nowrap cursor-pointer",
                isSelectPreviousTab
                  ? "text-sky-800"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {isSelectPreviousTab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-sky-100"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">Select Previous Query</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isSelectPreviousTab && (
            <motion.div
              key="previous-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/30 shadow-md"
            >
              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <motion.button
                    type="button"
                    onClick={handleOpenHistoryDrawer}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md cursor-pointer"
                    title="Click to select query"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-50/0 via-sky-50/50 to-sky-50/0 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 transition-colors group-hover:bg-sky-200">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                            Selected Query
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 group-hover:text-sky-600 transition-colors">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {loadingProjectQueries ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Loading previous queries...
                            </span>
                          ) : !hasProjectQueries ? (
                            <span className="text-xs text-gray-400 italic">
                              No previous queries yet
                            </span>
                          ) : !selectedQueryRecord ? (
                            <span className="text-xs text-gray-400 italic">
                              Select a query from history
                            </span>
                          ) : (
                            selectedQueryRecord.query
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleOpenHistoryDrawer}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md cursor-pointer"
                    title="Click to select version"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-50/0 via-sky-50/50 to-sky-50/0 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
                        <GitBranch className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                            Version Date
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-600 transition-colors">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {loadingProjectQueries || loadingVersions ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Loading versions...
                            </span>
                          ) : !hasProjectQueries ||
                            !hasVersionsForSelectedQuery ? (
                            <span className="text-xs text-gray-400 italic">
                              No previous versions yet
                            </span>
                          ) : !currentVersionMeta ? (
                            <span className="text-xs text-gray-400 italic">
                              Select a version
                            </span>
                          ) : currentVersionMeta?.created_at ? (
                            formatDateLabel(currentVersionMeta.created_at)
                          ) : (
                            currentVersionMeta?.label ||
                            `Version ${currentVersionMeta?.version}`
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.span
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {formatMetricNumber(
                        selectedQueryRecord?.totalVersions ?? 0
                      )}{" "}
                      version
                      {selectedQueryRecord?.totalVersions === 1 ? "" : "s"}
                    </motion.span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={handleOpenHistoryDrawer}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg cursor-pointer"
                    >
                      <History className="h-3.5 w-3.5" />
                      Browse History
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() =>
                        selectedQueryRecord &&
                        !submitting &&
                        handleRerunQuery(selectedQueryRecord)
                      }
                      disabled={!selectedQueryRecord || submitting}
                      whileHover={
                        selectedQueryRecord && !submitting
                          ? { scale: 1.02 }
                          : {}
                      }
                      whileTap={
                        selectedQueryRecord && !submitting
                          ? { scale: 0.98 }
                          : {}
                      }
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-md transition-all",
                        "border-2 border-sky-400 bg-white text-sky-700",
                        selectedQueryRecord && !submitting
                          ? "hover:bg-sky-50 hover:shadow-lg cursor-pointer"
                          : "cursor-not-allowed opacity-50"
                      )}
                    >
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-3.5 w-3.5" />
                      )}
                      {submitting ? "Regenerating..." : "Regenerate"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* {statusMessage && (
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          <Clock className="h-3.5 w-3.5 text-gray-500" />
          <span>{statusMessage}</span>
        </div>
      )} */}

      <AnimatePresence mode="wait">
        {isNewQueryTab && (
          <motion.div
            key="new-query-tab"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <SearchRankingForm
              onSubmit={handleSubmitSearch}
              submitting={submitting}
              disabled={!companyId || !projectId || isPolling}
              queryValue={searchInputValue}
              onQueryChange={setSearchInputValue}
              submitLabel={submitLabel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <motion.div
          layout
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <SearchRankingTable loading={loadingQueryData} rows={rankingRows} />
        </motion.div>

        <AnimatePresence>
          {hasHistoricalData && (
            <motion.div
              key="history"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <SearchRankingChart
                data={historyRows}
                loading={loadingQueryData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SearchRankingHistoryDrawer
        open={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        queries={projectQueries}
        loadingQueries={loadingProjectQueries}
        onRefreshQueries={() => {
          fetchProjectQueries();
          fetchTaskStatus({ showErrors: true });
        }}
        selectedQueryId={historyPanelQueryId}
        onSelectQuery={handleHistoryQuerySelect}
        versions={drawerVersions}
        loadingVersions={loadingVersions}
        onSelectVersion={handleHistoryVersionSelect}
        onRerunQuery={handleRerunQuery}
        activeDashboardQueryId={selectedQueryId}
        activeVersionId={drawerActiveVersionId}
      />
      {isAnyApiLoading || apiErrors.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isAnyApiLoading ? "Loading..." : "Error"}
              </motion.span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                type="button"
                onClick={handleRetryAll}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg cursor-pointer"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry All
              </motion.button>
            </div>
          </div>
          {apiErrors.length > 0 && (
            <div className="text-sm font-medium text-gray-600">
              {apiErrors[0]}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
