"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Target,
  Activity,
  Filter,
  ChevronDown,
  Waves,
  Zap,
  Check,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  LabelList,
} from "recharts";

import {
  PROVIDER_KEYS,
  PROVIDER_COLORS,
  PROVIDER_GRADIENT_COLORS,
  PROVIDER_ICON_PATHS,
  getProviderInfo,
  getProviderLabel,
  getProviderChipStyles,
  getProviderKey,
  getProviderIconPath,
  getProviderGradient,
} from "./providerTheme";

const MIN_VISUAL_PORTION = 0.1;
const RADIAN = Math.PI / 180;

const CHART_TYPES = [
  { id: "provider-ranking", label: "Provider Rankings", icon: BarChart3 },
  // { id: "provider-trends", label: "Provider Performance", icon: Waves },
  { id: "provider-insights", label: "Provider Insights", icon: Zap },
  { id: "company-comparison", label: "Company Comparison", icon: TrendingUp },
  { id: "provider-coverage", label: "Provider Coverage", icon: Users },
  { id: "top-companies", label: "Top Companies", icon: Award },
  { id: "ranking-distribution", label: "Ranking Distribution", icon: Target },
];

const CHART_DESCRIPTIONS = {
  "provider-ranking": "Compare provider rankings for the selected companies.",
  "provider-insights":
    "Review average rank, extremes, and consistency per provider.",
  "company-comparison": "Contrast top companies side-by-side across providers.",
  "provider-coverage": "See which providers discovered the most companies.",
  "top-companies": "Highlight best-performing companies overall.",
  "ranking-distribution":
    "Understand how rankings are distributed for each provider.",
};

export default function SearchRankingChartView({
  rows = [],
  isLoading = false,
  error = null,
  onRetry,
}) {
  const [selectedChart, setSelectedChart] = useState("provider-ranking");
  const [selectedProviders, setSelectedProviders] = useState(PROVIDER_KEYS);
  const [topN, setTopN] = useState(15);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const providerDropdownRef = useRef(null);
  const providerEntries = PROVIDER_KEYS.map((provider) => [
    provider,
    PROVIDER_COLORS[provider],
  ]);
  const totalProviderCount = providerEntries.length;
  const tabContainerRef = useRef(null);
  const tabRefs = useRef({});
  const tabLabelRefs = useRef({});
  const [tabIndicator, setTabIndicator] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target)
      ) {
        setIsProviderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const loadingSkeletonItems = Array.from({
    length: Math.min(totalProviderCount, 6) || 4,
  });

  const ProductSkeleton = ({ className }) => (
    <motion.div
      className={clsx(
        "relative overflow-hidden rounded-xl bg-gray-200",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(243,244,246,0) 0%, rgba(203,213,225,0.4) 20%, rgba(226,232,240,1) 50%, rgba(203,213,225,0.4) 80%, rgba(243,244,246,0) 100%)",
        backgroundSize: "400% 100%",
      }}
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );

  const renderLoadingState = () => {
    const activeChartMeta = CHART_TYPES.find(
      (chart) => chart.id === selectedChart
    );
    const ActiveChartIcon = activeChartMeta?.icon ?? BarChart3;
    const activeChartDescription =
      CHART_DESCRIPTIONS[selectedChart] ||
      "Explore search ranking insights across AI providers.";

    return (
      <div className="space-y-4">
        {/* Header - Show actual content, not shimmer */}
        <div className="rounded-xl border border-sky-200/60 bg-gradient-to-br from-sky-50/40 via-blue-50/30 to-emerald-50/20 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {"Provider Rankings Comparison"}
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                {
                  "Compare how each AI provider ranks the top companies - lower bars indicate better rankings"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Chart area - Show shimmer */}
        <div className="">
          <ProductSkeleton className="h-[360px] w-full rounded-xl" />
        </div>
      </div>
    );
  };

  const renderErrorState = () => {
    const message =
      typeof error === "string"
        ? error
        : error?.message || "Something went wrong while fetching chart data.";

    return (
      <div className="flex h-[420px] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h3 className="text-lg font-semibold text-red-600">
            Unable to load charts
          </h3>
          <p className="mt-2 text-sm text-red-500">{message}</p>
          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  };

  const updateTabIndicator = useCallback(() => {
    const containerEl = tabContainerRef.current;
    if (!containerEl) return;

    const labelEl = tabLabelRefs.current[selectedChart];
    if (labelEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const labelRect = labelEl.getBoundingClientRect();
      const indicatorPadding = 24;
      setTabIndicator({
        width: labelRect.width + indicatorPadding,
        left: labelRect.left - containerRect.left - indicatorPadding / 2,
      });
      return;
    }

    const activeEl = tabRefs.current[selectedChart];
    if (activeEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setTabIndicator({
        width: activeRect.width,
        left: activeRect.left - containerRect.left,
      });
    }
  }, [selectedChart]);

  useEffect(() => {
    updateTabIndicator();

    const handleResize = () => updateTabIndicator();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateTabIndicator]);

  const activeChartMeta = CHART_TYPES.find(
    (chart) => chart.id === selectedChart
  );
  const ActiveChartIcon = activeChartMeta?.icon ?? BarChart3;
  const activeChartDescription =
    CHART_DESCRIPTIONS[selectedChart] ||
    "Explore search ranking insights across AI providers.";
  const headerGradient = "bg-white";

  // Process data for various charts
  const chartData = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return null;

    // Provider ranking data - aggregate rankings
    const providerRankings = {};
    const companyCoverage = {};
    const providerCoverage = PROVIDER_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    rows.forEach((row) => {
      const company = row.companyName || row.displayUrl || row.companyUrl;
      if (!company) return; // Skip entries without company identifier

      if (!companyCoverage[company]) {
        companyCoverage[company] = {
          company,
          url: row.companyUrl || "",
          description: row.description || "",
          providers: [],
          avgRank: 0,
          totalRanks: 0,
        };
      }

      PROVIDER_KEYS.forEach((provider) => {
        const rank = row.providerRanks?.[provider];

        if (rank !== null && rank !== undefined) {
          if (!providerRankings[provider]) {
            providerRankings[provider] = [];
          }
          providerRankings[provider].push({ company, rank });
          companyCoverage[company].providers.push(provider);
          companyCoverage[company].totalRanks += rank;
          providerCoverage[provider]++;
        }
      });

      if (companyCoverage[company].providers.length > 0) {
        companyCoverage[company].avgRank =
          companyCoverage[company].totalRanks /
          companyCoverage[company].providers.length;
      }
    });

    // Top companies by average ranking
    const topCompanies = Object.values(companyCoverage)
      .filter((c) => c.providers.length > 0)
      .sort((a, b) => a.avgRank - b.avgRank)
      .slice(0, topN);

    // Provider rankings comparison for top companies
    const providerComparisonData = topCompanies.map((company) => {
      const data = { company: company.company };
      rows
        .filter(
          (r) =>
            (r.companyName || r.displayUrl || r.companyUrl) === company.company
        )
        .forEach((row) => {
          ["claude", "openai", "gemini", "perplexity", "grok"].forEach(
            (provider) => {
              const rank = row.providerRanks?.[provider];
              if (rank !== null && rank !== undefined) {
                data[provider] = rank;
              }
            }
          );
        });
      return data;
    });

    // Provider coverage pie data
    // Compute total coverage across all providers so percentages are normalized
    const totalCoverageCount = PROVIDER_KEYS.reduce((sum, provider) => {
      const value = providerCoverage[provider];
      if (!Number.isFinite(value) || value <= 0) return sum;
      return sum + value;
    }, 0);

    const providerCoverageData = PROVIDER_KEYS.map((provider) => {
      const count = Number.isFinite(providerCoverage[provider])
        ? providerCoverage[provider]
        : 0;
      const visualCount = count > 0 ? count : MIN_VISUAL_PORTION;
      const percentageValue =
        totalCoverageCount > 0 ? (count / totalCoverageCount) * 100 : 0;
      const { label: providerLabel, icon } = getProviderInfo(provider);
      return {
        provider,
        providerLabel,
        providerIcon: icon,
        count,
        visualCount,
        percentage: percentageValue.toFixed(1),
        percentageValue,
      };
    });

    // Ranking distribution data
    const rankingDistribution = {};
    PROVIDER_KEYS.forEach((provider) => {
      rankingDistribution[provider] = {
        "1-3": 0,
        "4-7": 0,
        "8-12": 0,
        "13+": 0,
      };

      rows.forEach((row) => {
        const rank = row.providerRanks?.[provider];
        if (rank !== null && rank !== undefined) {
          if (rank <= 3) rankingDistribution[provider]["1-3"]++;
          else if (rank <= 7) rankingDistribution[provider]["4-7"]++;
          else if (rank <= 12) rankingDistribution[provider]["8-12"]++;
          else rankingDistribution[provider]["13+"]++;
        }
      });
    });

    const distributionData = ["1-3", "4-7", "8-12", "13+"].map((range) => {
      const data = { range };
      PROVIDER_KEYS.forEach((provider) => {
        const actualCount = rankingDistribution[provider][range];
        data[`${provider}Actual`] = actualCount;
        data[provider] = actualCount > 0 ? actualCount : MIN_VISUAL_PORTION;
      });
      return data;
    });

    // Radar chart data for top companies
    const radarData = selectedProviders.map((provider) => {
      const data = { provider, __tooltipMeta: {} };
      topCompanies.slice(0, 5).forEach((company) => {
        const row = rows.find(
          (r) =>
            (r.companyName || r.displayUrl || r.companyUrl) === company.company
        );
        if (row) {
          const rank = row.providerRanks?.[provider];
          const visualValue =
            rank !== null && rank !== undefined ? 20 - rank : 0;
          data[company.company] = visualValue;
          data[`${company.company}__actual`] =
            rank !== null && rank !== undefined ? rank : null;
          data.__tooltipMeta[company.company] = {
            company: company.company,
            provider,
            actualRank: rank !== null && rank !== undefined ? rank : null,
          };
        } else {
          data[company.company] = 0;
          data[`${company.company}__actual`] = null;
          data.__tooltipMeta[company.company] = {
            company: company.company,
            provider,
            actualRank: null,
          };
        }
      });
      return data;
    });

    // Area chart data - provider performance across top companies
    const areaChartData = topCompanies.slice(0, 10).map((company, index) => {
      const dataPoint = {
        company: company.company,
        index: index + 1,
      };

      PROVIDER_KEYS.forEach((provider) => {
        const row = rows.find(
          (r) =>
            (r.companyName || r.displayUrl || r.companyUrl) === company.company
        );
        if (row) {
          const rank = row.providerRanks?.[provider];
          // Store actual rank (lower is better)
          dataPoint[provider] =
            rank !== null && rank !== undefined ? rank : null;
        }
      });

      return dataPoint;
    });

    // Provider insights - average, best, worst, consistency
    const providerInsights = PROVIDER_KEYS.map((providerKey) => {
      const rankings = [];
      rows.forEach((row) => {
        const rank = row.providerRanks?.[providerKey];
        if (rank !== null && rank !== undefined) {
          rankings.push(rank);
        }
      });

      if (rankings.length === 0) {
        const { label } = getProviderInfo(providerKey);
        return {
          provider: label,
          providerKey,
          color: PROVIDER_COLORS[providerKey],
          avgRank: 0,
          bestRank: 0,
          worstRank: 0,
          consistency: 0,
          icon: getProviderIconPath(providerKey),
        };
      }

      const avgRank = rankings.reduce((a, b) => a + b, 0) / rankings.length;
      const bestRank = Math.min(...rankings);
      const worstRank = Math.max(...rankings);
      const variance =
        rankings.reduce((sum, rank) => sum + Math.pow(rank - avgRank, 2), 0) /
        rankings.length;
      const consistency =
        100 - Math.min(100, (Math.sqrt(variance) / avgRank) * 100); // Higher is more consistent

      const { label } = getProviderInfo(providerKey);
      return {
        provider: label,
        providerKey,
        color: PROVIDER_COLORS[providerKey],
        avgRank: Math.round(avgRank * 10) / 10,
        bestRank,
        worstRank,
        consistency: Math.round(consistency),
        totalCompanies: rankings.length,
        icon: getProviderIconPath(providerKey),
      };
    });

    const providerInsightsChart = providerInsights.map((insight) => ({
      provider: insight.provider,
      providerKey: insight.providerKey,
      color: insight.color,
      icon: insight.icon,
      avgRank: insight.avgRank,
      bestRank: insight.bestRank,
      worstRank: insight.worstRank,
      rangeStart: insight.bestRank,
      rangeLength: Math.max(insight.worstRank - insight.bestRank, 0.15),
      consistency: insight.consistency,
      totalCompanies: insight.totalCompanies,
    }));

    return {
      providerComparisonData,
      topCompanies,
      providerCoverageData,
      distributionData,
      radarData,
      areaChartData,
      providerInsights,
      providerInsightsChart,
    };
  }, [rows, topN, selectedProviders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const resolvedLabel = getProviderLabel(getProviderKey(label)) || label;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-sky-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl"
      >
        <p className="mb-2 border-b border-gray-200 pb-2 text-sm font-bold text-gray-900">
          {resolvedLabel}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const entryPayload = entry.payload || {};
            const tooltipMeta =
              entryPayload.__tooltipMeta?.[entry.dataKey] ||
              entryPayload.__tooltipMeta?.[entry.name];
            const isRadarEntry = Boolean(tooltipMeta);

            const providerKeyFromDataKey = getProviderKey(entry.dataKey);
            const providerKeyFromName = getProviderKey(entry.name);
            const providerKeyFromAxis = getProviderKey(entryPayload.provider);

            let iconProviderKey = isRadarEntry
              ? null
              : providerKeyFromDataKey ||
                providerKeyFromName ||
                providerKeyFromAxis;
            let displayLabel = isRadarEntry
              ? tooltipMeta?.company ||
                entry.dataKey ||
                entry.name ||
                resolvedLabel
              : entry.dataKey || entry.name || resolvedLabel;

            let colorToken =
              entry.color ||
              (iconProviderKey ? PROVIDER_COLORS[iconProviderKey] : "#6B7280");
            if (isRadarEntry && tooltipMeta?.provider) {
              colorToken =
                entry.color ||
                PROVIDER_COLORS[tooltipMeta.provider] ||
                colorToken;
            } else if (!entry.color && providerKeyFromAxis) {
              colorToken = PROVIDER_COLORS[providerKeyFromAxis] || colorToken;
            }

            const showProviderIcon = Boolean(
              iconProviderKey &&
                getProviderIconPath(iconProviderKey) &&
                !isRadarEntry
            );

            let valueToDisplay;
            let prefix = "";

            if (isRadarEntry) {
              const actualRank = tooltipMeta?.actualRank;
              if (typeof actualRank === "number") {
                prefix = "#";
                valueToDisplay = actualRank;
              } else {
                valueToDisplay = "—";
              }
            } else {
              const actualKeyCandidates = [];
              if (entry.dataKey) {
                actualKeyCandidates.push(`${entry.dataKey}__actual`);
                actualKeyCandidates.push(`${entry.dataKey}Actual`);
              }
              actualKeyCandidates.push("actualValue");

              for (const candidate of actualKeyCandidates) {
                if (
                  candidate &&
                  Object.prototype.hasOwnProperty.call(
                    entryPayload,
                    candidate
                  ) &&
                  entryPayload[candidate] !== null &&
                  entryPayload[candidate] !== undefined
                ) {
                  valueToDisplay = entryPayload[candidate];
                  if (
                    typeof valueToDisplay === "number" &&
                    /actual/i.test(candidate)
                  ) {
                    prefix = "#";
                  }
                  break;
                }
              }

              if (valueToDisplay === undefined) {
                if (typeof entryPayload.count === "number") {
                  valueToDisplay = entryPayload.count;
                } else if (typeof entryPayload.value === "number") {
                  valueToDisplay = entryPayload.value;
                } else if (typeof entryPayload.percentage === "number") {
                  valueToDisplay = `${entryPayload.percentage}%`;
                } else {
                  valueToDisplay = entry.value;
                }
              }
            }

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-2">
                  {showProviderIcon ? (
                    <ProviderIcon provider={iconProviderKey} size="xs" />
                  ) : (
                    <span
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{
                        backgroundColor: colorToken,
                        boxShadow: `0 0 8px ${colorToken || "#A855F7"}50`,
                      }}
                    />
                  )}
                  <span className="font-medium text-gray-700">
                    {displayLabel}
                  </span>
                </div>
                <span className="font-bold text-gray-900 tabular-nums">
                  {prefix}
                  {valueToDisplay}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const ProviderInsightTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;
    const providerKey = data.providerKey || getProviderKey(data.provider);
    const providerColor = providerKey
      ? PROVIDER_COLORS[providerKey] || "#7C3AED"
      : "#7C3AED";

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-sky-100 bg-white/95 px-4 py-3 text-xs shadow-xl"
      >
        <div className="mb-2 flex items-center justify-between gap-4 border-b border-gray-100 pb-2">
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <ProviderIcon provider={providerKey} size="sm" />
            {data.provider}
          </span>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
            {data.totalCompanies} companies
          </span>
        </div>
        <div className="space-y-1.5 text-gray-600">
          <div className="flex items-center justify-between">
            <span>Best rank</span>
            <span className="font-semibold" style={{ color: providerColor }}>
              #{data.bestRank}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Average rank</span>
            <span className="font-semibold" style={{ color: providerColor }}>
              #{data.avgRank}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Worst rank</span>
            <span className="font-semibold" style={{ color: providerColor }}>
              #{data.worstRank}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Consistency</span>
            <span className="font-semibold text-gray-900">
              {data.consistency}%
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const CompanyLegend = ({ payload, className }) => {
    if (!payload || payload.length === 0) return null;

    return (
      <div
        className={clsx(
          "mt-3 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-center",
          className
        )}
      >
        {payload.map((entry) => (
          <span
            key={entry.value}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span
              className="inline-flex h-3 w-6 rounded-full"
              style={{ backgroundColor: entry.color || "#6B7280" }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: entry.color || "#1F2937" }}
            >
              {entry.value}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const renderPolarAngleTick = ({ payload, x, y }) => {
    const providerKey = getProviderKey(payload.value) || payload.value;
    const label = getProviderLabel(providerKey);
    const iconSrc = getProviderIconPath(providerKey);
    const iconSize = 18;

    const angleRad = (payload.coordinate * Math.PI) / 180;
    const directionX = Math.cos(angleRad);
    const directionY = -Math.sin(angleRad);

    const iconDistance = 11;
    const labelDistance = 22;

    const iconCenterX = x + directionX * iconDistance;
    const iconCenterY = y + directionY * iconDistance;
    const labelX = x + directionX * labelDistance;
    const labelY = y + directionY * labelDistance;

    let textAnchor = "middle";
    if (directionX > 0.4) textAnchor = "start";
    else if (directionX < -0.4) textAnchor = "end";

    let dominantBaseline = "middle";
    if (directionY > 0.45) dominantBaseline = "hanging";
    else if (directionY < -0.45) dominantBaseline = "baseline";

    return (
      <g>
        {iconSrc && (
          <image
            xlinkHref={iconSrc}
            x={iconCenterX - iconSize / 2}
            y={iconCenterY - iconSize / 2}
            height={iconSize}
            width={iconSize}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
        <text
          x={labelX}
          y={labelY}
          textAnchor={textAnchor}
          dominantBaseline={dominantBaseline}
          fill="#374151"
          fontSize={12}
          fontWeight={600}
        >
          {label}
        </text>
      </g>
    );
  };

  const ProviderIcon = ({ provider, size = "sm", className }) => {
    const key = getProviderKey(provider) || provider;
    const iconSrc = getProviderIconPath(key);
    const label = getProviderLabel(key);
    const sizeMap = {
      xs: { wrapper: "h-5 w-5", image: 14 },
      sm: { wrapper: "h-6 w-6", image: 16 },
      md: { wrapper: "h-8 w-8", image: 20 },
      lg: { wrapper: "h-10 w-10", image: 24 },
    };
    const resolved = sizeMap[size] || sizeMap.sm;
    if (!iconSrc) return null;

    return (
      <span
        className={clsx(
          "flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5",
          resolved.wrapper,
          className
        )}
        style={{
          backgroundColor: `${PROVIDER_COLORS[key] || "#E0E7FF"}14`,
        }}
      >
        <Image
          src={iconSrc}
          alt={`${label} logo`}
          width={resolved.image}
          height={resolved.image}
          className="h-[85%] w-[85%] object-contain"
        />
      </span>
    );
  };

  const ProviderLegend = ({ payload, className }) => {
    if (!payload || payload.length === 0) return null;
    const seen = new Set();

    const items = payload
      .map((entry) => {
        const providerKey =
          getProviderKey(entry.dataKey) ||
          getProviderKey(entry.value) ||
          getProviderKey(entry.payload?.provider) ||
          entry.payload?.provider ||
          entry.dataKey ||
          entry.value;
        if (!providerKey || seen.has(providerKey)) return null;
        seen.add(providerKey);
        return {
          providerKey,
          label: getProviderLabel(providerKey),
          color: PROVIDER_COLORS[providerKey],
        };
      })
      .filter(Boolean);

    if (items.length === 0) return null;

    return (
      <div
        className={clsx(
          "mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-700",
          className
        )}
      >
        {items.map(({ providerKey, label, color }) => (
          <span key={providerKey} className="flex items-center gap-2">
            <ProviderIcon provider={providerKey} size="sm" />
            <span style={{ color }}>{label}</span>
          </span>
        ))}
      </div>
    );
  };

  const renderProviderAxisTick = ({ x, y, payload }) => {
    const providerKey = getProviderKey(payload.value) || payload.value;
    const label = getProviderLabel(providerKey);
    const iconSrc = getProviderIconPath(providerKey);
    const providerColor = PROVIDER_COLORS[providerKey] || "#6366F1";

    const width = 170;
    const height = 32;

    return (
      <foreignObject
        x={x - width}
        y={y - height / 2}
        width={width}
        height={height}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#1F2937",
            paddingRight: "8px",
          }}
        >
          {iconSrc ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "26px",
                height: "26px",
                borderRadius: "9999px",
                backgroundColor: `${providerColor}14`,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
              }}
            >
              <img
                src={iconSrc}
                alt={`${label} logo`}
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain",
                }}
              />
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "26px",
                height: "26px",
                borderRadius: "9999px",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                fontSize: "11px",
                color: providerColor,
              }}
            >
              {label?.[0] || "?"}
            </span>
          )}
          <span>{label}</span>
        </div>
      </foreignObject>
    );
  };

  const renderRangeLabels = (props) => {
    const { x, y, width, height, payload, index } = props;
    if (x == null || y == null || width == null || height == null) return null;
    const dataPoint = payload || chartData?.providerInsightsChart?.[index];
    if (!dataPoint) return null;

    const centerY = y + height / 2;
    const bestRank =
      dataPoint.bestRank != null ? `#${dataPoint.bestRank}` : "—";
    const worstRank =
      dataPoint.worstRank != null ? `#${dataPoint.worstRank}` : "—";

    const labelHeight = 20;
    const labelWidth = 64;

    return (
      <g>
        <foreignObject
          x={x - labelWidth - 24}
          y={centerY - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              fontSize: "11px",
              fontWeight: 600,
              color: "#4B5563",
            }}
          >
            {bestRank}
          </div>
        </foreignObject>
        <foreignObject
          x={x + width + 24}
          y={centerY - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "11px",
              fontWeight: 600,
              color: "#4B5563",
            }}
          >
            {worstRank}
          </div>
        </foreignObject>
      </g>
    );
  };

  const renderChart = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    if (error) {
      return renderErrorState();
    }

    if (!chartData) {
      return (
        <div className="flex h-96 items-center justify-center text-gray-500">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No data available for visualization</p>
          </div>
        </div>
      );
    }

    switch (selectedChart) {
      case "provider-ranking":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-200/60 bg-gradient-to-br from-sky-50/40 via-blue-50/30 to-emerald-50/20 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Provider Rankings Comparison
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Compare how each AI provider ranks the top companies - lower
                    bars indicate better rankings
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    Show:
                  </span>
                  <select
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="rounded-lg border-2 border-sky-300 bg-white px-3 py-2 text-xs font-bold cursor-pointer hover:border-sky-500 hover:shadow-md transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value={10}>Top 10</option>
                    <option value={15}>Top 15</option>
                    <option value={20}>Top 20</option>
                    <option value={30}>Top 30</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 mt-10">
              <ResponsiveContainer width="100%" height={520}>
                <BarChart
                  data={chartData.providerComparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <defs>
                    {Object.entries(PROVIDER_GRADIENT_COLORS).map(
                      ([provider, [start, end]]) => (
                        <linearGradient
                          key={provider}
                          id={`gradient-${provider}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={start}
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor={end}
                            stopOpacity={0.7}
                          />
                        </linearGradient>
                      )
                    )}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#E5E7EB"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="company"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                    axisLine={{ stroke: "#D1D5DB", strokeWidth: 1.5 }}
                    tickLine={false}
                  />
                  <YAxis
                    label={{
                      value: "Ranking Position (lower is better)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fontSize: 12,
                        fill: "#374151",
                        fontWeight: 700,
                        marginTop: 30,
                      },
                    }}
                    tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                    domain={[0, 10]}
                    axisLine={{ stroke: "#D1D5DB", strokeWidth: 1.5 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#A855F708" }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 24 }}
                    content={<ProviderLegend className="justify-center" />}
                  />
                  {selectedProviders.map((provider) => (
                    <Bar
                      key={provider}
                      dataKey={provider}
                      fill={`url(#gradient-${provider})`}
                      name={getProviderLabel(provider)}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "provider-trends":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 p-4 border border-sky-200">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Provider Performance Across Top Companies
              </h3>
              <p className="text-xs text-gray-600">
                Line chart showing ranking positions - lower values = higher
                rankings (better performance)
              </p>
            </div>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart
                data={chartData.areaChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <defs>
                  {Object.entries(PROVIDER_GRADIENT_COLORS).map(
                    ([provider, [start, end]]) => (
                      <linearGradient
                        key={`line-${provider}`}
                        id={`line-gradient-${provider}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={start} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={end} stopOpacity={0.1} />
                      </linearGradient>
                    )
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="company"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                />
                <YAxis
                  label={{
                    value: "Ranking Position (Lower = Better)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#6B7280", fontWeight: 600 },
                  }}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  domain={[0, 20]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#9333EA",
                    strokeWidth: 2,
                    strokeDasharray: "5 5",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  content={<ProviderLegend />}
                />
                {selectedProviders.map((provider) => (
                  <Line
                    key={provider}
                    type="monotone"
                    dataKey={provider}
                    stroke={PROVIDER_COLORS[provider]}
                    strokeWidth={3}
                    name={getProviderLabel(provider)}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: "#fff",
                      fill: PROVIDER_COLORS[provider],
                    }}
                    dot={{
                      r: 5,
                      fill: PROVIDER_COLORS[provider],
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "provider-insights":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-200/60 bg-gradient-to-br from-sky-50/40 via-white to-blue-50/30 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Provider Performance Range
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Horizontal bars show best to worst rank per provider with a
                    dot marking the average.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-2 w-8 rounded-full bg-gradient-to-r from-sky-400 to-sky-600" />
                    <span>Range</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full border-2 border-sky-600 bg-white shadow-sm" />
                    <span>Average</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="">
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart
                  data={chartData.providerInsightsChart}
                  layout="vertical"
                  barCategoryGap="55%"
                  margin={{ top: 10, right: 44, left: 72, bottom: 56 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="4 4"
                    stroke="#E5E7EB"
                    opacity={0.5}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 20]}
                    tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                    axisLine={{ stroke: "#D1D5DB", strokeWidth: 1.5 }}
                    tickLine={false}
                    label={{
                      value: "Ranking Position (lower is better)",
                      position: "bottom",
                      offset: 36,
                      style: { fontSize: 12, fill: "#374151", fontWeight: 600 },
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="provider"
                    width={180}
                    tick={renderProviderAxisTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ProviderInsightTooltip />}
                    cursor={{ fill: "#A855F710" }}
                  />
                  <Bar
                    dataKey="rangeStart"
                    stackId="range"
                    fill="transparent"
                  />
                  <Bar
                    dataKey="rangeLength"
                    stackId="range"
                    barSize={10}
                    radius={[999, 999, 999, 999]}
                  >
                    {chartData.providerInsightsChart.map((entry) => (
                      <Cell
                        key={entry.providerKey}
                        fill={`url(#gradient-${entry.providerKey})`}
                        stroke={entry.color}
                        strokeWidth={2}
                      />
                    ))}
                    <LabelList dataKey="provider" content={renderRangeLabels} />
                  </Bar>
                  <Scatter dataKey="avgRank" legendType="none" shape="circle">
                    {chartData.providerInsightsChart.map((entry) => (
                      <Cell
                        key={`avg-${entry.providerKey}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                        r={5}
                      />
                    ))}
                  </Scatter>
                  <defs>
                    {chartData.providerInsightsChart.map((entry) => (
                      <linearGradient
                        key={`gradient-${entry.providerKey}`}
                        id={`gradient-${entry.providerKey}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={0.9}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "company-comparison":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 p-4 border border-blue-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Top 5 Companies - Provider Performance
              </h3>
              <p className="text-xs text-gray-600">
                Radar view comparing top companies across all AI providers
              </p>
            </div>
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={chartData.radarData}>
                <PolarGrid stroke="#D1D5DB" strokeWidth={1.5} />
                <PolarAngleAxis
                  dataKey="provider"
                  tick={renderPolarAngleTick}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 20]}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />
                {chartData.topCompanies.slice(0, 5).map((company, index) => {
                  const providerKeys = Object.keys(PROVIDER_COLORS);
                  const colorKey = providerKeys[index % providerKeys.length];
                  const color = PROVIDER_COLORS[colorKey] || "#6B7280";
                  return (
                    <Radar
                      key={company.company}
                      name={company.company}
                      dataKey={company.company}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.28}
                      strokeWidth={3}
                      style={{
                        marginTop: "10px",
                      }}
                    />
                  );
                })}
                <Legend content={<CompanyLegend className="mt-2" />} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#A855F718" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case "provider-coverage":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 p-4 border border-emerald-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Provider Coverage Distribution
              </h3>
              <p className="text-xs text-gray-600">
                How many companies each AI provider discovered in search results
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <defs>
                  {chartData.providerCoverageData.map((entry) => {
                    const gradient = getProviderGradient(entry.provider);
                    const start =
                      gradient?.[0] ||
                      PROVIDER_COLORS[entry.provider] ||
                      "#6366F1";
                    const end = gradient?.[1] || start;
                    return (
                      <linearGradient
                        key={`pie-gradient-${entry.provider}`}
                        id={`pie-gradient-${entry.provider}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={start}
                          stopOpacity={0.95}
                        />
                        <stop
                          offset="100%"
                          stopColor={end}
                          stopOpacity={0.85}
                        />
                      </linearGradient>
                    );
                  })}
                </defs>
                <Pie
                  data={chartData.providerCoverageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    outerRadius,
                    payload,
                    index,
                  }) => {
                    const radius = outerRadius + 35;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    // Smart positioning based on angle to avoid overlap
                    let textAnchor = "middle";
                    let dy = 0;

                    // Position labels in a circle around the pie
                    if (midAngle >= 340 || midAngle < 20) {
                      textAnchor = "start";
                      dy = 5;
                    } else if (midAngle >= 20 && midAngle < 70) {
                      textAnchor = "start";
                      dy = 0;
                    } else if (midAngle >= 70 && midAngle < 110) {
                      textAnchor = "middle";
                      dy = -5;
                    } else if (midAngle >= 110 && midAngle < 160) {
                      textAnchor = "end";
                      dy = 0;
                    } else if (midAngle >= 160 && midAngle < 200) {
                      textAnchor = "end";
                      dy = 5;
                    } else if (midAngle >= 200 && midAngle < 250) {
                      textAnchor = "end";
                      dy = 0;
                    } else if (midAngle >= 250 && midAngle < 290) {
                      textAnchor = "middle";
                      dy = 5;
                    } else {
                      textAnchor = "start";
                      dy = 0;
                    }

                    return (
                      <g>
                        <text
                          x={x}
                          y={y}
                          fill="#374151"
                          fontSize={11}
                          fontWeight={600}
                          textAnchor={textAnchor}
                          dominantBaseline="middle"
                          className="select-none"
                        >
                          {payload.providerLabel}
                        </text>
                        <text
                          x={x}
                          y={y + 12}
                          fill="#6B7280"
                          fontSize={9}
                          fontWeight={500}
                          textAnchor={textAnchor}
                          dominantBaseline="middle"
                          className="select-none"
                        >
                          {`${payload.percentage}%`}
                        </text>
                      </g>
                    );
                  }}
                  outerRadius={130}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="visualCount"
                  nameKey="providerLabel"
                  minAngle={5}
                  paddingAngle={3}
                >
                  {chartData.providerCoverageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#pie-gradient-${entry.provider})`}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {/* <Legend
                  content={<ProviderLegend className="mt-4 justify-center" />}
                /> */}
              </PieChart>
            </ResponsiveContainer>
            <div className="mx-auto flex flex-wrap justify-center gap-4">
              {chartData.providerCoverageData.map((item, index) => (
                <motion.div
                  key={item.provider}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group w-[200px] relative flex items-center gap-4 overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    borderColor: `${PROVIDER_COLORS[item.provider]}22`,
                    boxShadow: `0 12px 22px -18px ${
                      PROVIDER_COLORS[item.provider]
                    }B0`,
                  }}
                >
                  <ProviderIcon
                    provider={item.provider}
                    size="sm"
                    className="shrink-0"
                  />
                  <div className="relative flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span style={{ color: PROVIDER_COLORS[item.provider] }}>
                        {item.providerLabel}
                      </span>
                      <span className="text-gray-400">
                        {Number(item.percentage).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xl font-extrabold tracking-tight text-gray-900">
                      {item.count}
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, item.percentageValue)}%`,
                        }}
                        transition={{ duration: 0.6, delay: 0.08 * index }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${
                            (PROVIDER_GRADIENT_COLORS[item.provider] || [
                              PROVIDER_COLORS[item.provider] || "#6366F1",
                              PROVIDER_COLORS[item.provider] || "#6366F1",
                            ])[0]
                          }, ${
                            (PROVIDER_GRADIENT_COLORS[item.provider] || [
                              PROVIDER_COLORS[item.provider] || "#6366F1",
                              PROVIDER_COLORS[item.provider] || "#6366F1",
                            ])[1]
                          })`,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "top-companies":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-sky-50 p-4 border border-amber-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Top Companies by Average Ranking
              </h3>
              <p className="text-xs text-gray-600">
                Best performing companies ranked by their average position
                across all providers
              </p>
            </div>
            <div className="space-y-2">
              {chartData.topCompanies.slice(0, 15).map((company, index) => (
                <motion.div
                  key={company.company}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all hover:shadow-lg hover:border-sky-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-bold text-white shadow-md">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-gray-900">
                        {company.company}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                        {company.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {company.providers.map((provider) => (
                          <span
                            key={provider}
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                            style={getProviderChipStyles(provider)}
                          >
                            <ProviderIcon provider={provider} size="xs" />
                            {getProviderLabel(provider)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500">
                        Avg Rank
                      </div>
                      <div className="text-2xl font-bold text-sky-600">
                        {company.avgRank.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {company.providers.length} provider
                        {company.providers.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "ranking-distribution":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-pink-50 to-sky-50 p-4 border border-pink-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Ranking Distribution by Provider
              </h3>
              <p className="text-xs text-gray-600">
                How companies are distributed across ranking tiers for each
                provider
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData.distributionData}
                margin={{ top: 20, right: 24, left: 12, bottom: 72 }}
                barGap={6}
                barCategoryGap="18%"
              >
                <defs>
                  {Object.entries(PROVIDER_GRADIENT_COLORS).map(
                    ([provider, [start, end]]) => (
                      <linearGradient
                        key={`dist-${provider}`}
                        id={`dist-gradient-${provider}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={start} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={end} stopOpacity={0.7} />
                      </linearGradient>
                    )
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  label={{
                    value: "Ranking Range",
                    position: "insideBottom",
                    offset: -5,
                    style: { fontSize: 12, fill: "#6B7280" },
                  }}
                />
                <YAxis
                  label={{
                    value: "Number of Companies",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#6B7280" },
                  }}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#A855F708" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 24 }}
                  content={<ProviderLegend className="justify-center" />}
                />
                {selectedProviders.map((provider) => (
                  <Bar
                    key={provider}
                    dataKey={provider}
                    fill={`url(#dist-gradient-${provider})`}
                    name={provider.charAt(0).toUpperCase() + provider.slice(1)}
                    radius={[6, 6, 0, 0]}
                    stroke={PROVIDER_COLORS[provider]}
                    strokeWidth={1}
                    activeBar={{
                      fill: `url(#dist-gradient-${provider})`,
                      stroke: PROVIDER_COLORS[provider],
                      strokeWidth: 2,
                      radius: [8, 8, 0, 0],
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  const toggleProvider = (provider) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with Chart Type Selector */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full">
            <div className="relative overflow-hidden">
              <div
                ref={tabContainerRef}
                className="relative flex items-center gap-2 bg-white pb-2 overflow-x-auto flex-nowrap"
              >
                {CHART_TYPES.map((chart) => {
                  const Icon = chart.icon;
                  const isActive = selectedChart === chart.id;
                  return (
                    <button
                      key={chart.id}
                      onClick={() => setSelectedChart(chart.id)}
                      className={clsx(
                        "relative flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-all duration-200",
                        isActive
                          ? "text-sky-700"
                          : "text-gray-600 hover:text-sky-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span
                        ref={(el) => {
                          if (el) tabLabelRefs.current[chart.id] = el;
                          else delete tabLabelRefs.current[chart.id];
                        }}
                        className="relative whitespace-nowrap"
                      >
                        {chart.label}
                      </span>
                    </button>
                  );
                })}
                <motion.div
                  className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-gradient-to-r from-sky-500 via-fuchsia-500 to-blue-500"
                  initial={false}
                  animate={{
                    left: tabIndicator.left || 0,
                    width: tabIndicator.width || 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                />
              </div>
            </div>
          </div>

          <div className="relative" ref={providerDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProviderDropdownOpen((prev) => !prev)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 transition hover:border-sky-200 hover:text-sky-600",
                isProviderDropdownOpen && "border-sky-400 text-sky-600"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Providers
              <ChevronDown
                className={clsx(
                  "h-4 w-4 transition-transform",
                  isProviderDropdownOpen && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {isProviderDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  <div className="max-h-64 overflow-y-auto py-2">
                    {providerEntries.map(([provider, color]) => {
                      const isSelected = selectedProviders.includes(provider);
                      const providerLabel = getProviderLabel(provider);
                      const checkboxId = `provider-${provider}`;
                      const providerIcon = getProviderIconPath(provider);
                      return (
                        <label
                          key={provider}
                          htmlFor={checkboxId}
                          className={clsx(
                            "flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-gray-700 transition",
                            isSelected ? "bg-sky-50/70" : "hover:bg-gray-50"
                          )}
                        >
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProvider(provider)}
                            className="sr-only"
                          />
                          <div className="flex flex-1 items-center gap-3">
                            <motion.span
                              aria-hidden
                              className="flex h-5 w-5 items-center justify-center rounded-md border"
                              initial={false}
                              animate={{
                                backgroundColor: isSelected
                                  ? "#8b5cf6"
                                  : "rgba(255,255,255,1)",
                                borderColor: isSelected ? "#8b5cf6" : "#d1d5db",
                                boxShadow: isSelected
                                  ? "0 6px 16px rgba(139,92,246,0.28)"
                                  : "0 1px 2px rgba(148,163,184,0.2)",
                              }}
                              transition={{
                                duration: 0.18,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                            >
                              <AnimatePresence initial={false}>
                                {isSelected && (
                                  <motion.span
                                    key="check"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{
                                      duration: 0.14,
                                      ease: [0.4, 0, 0.2, 1],
                                    }}
                                    className="text-white"
                                  >
                                    <Check
                                      className="h-3 w-3"
                                      strokeWidth={3}
                                    />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.span>
                            <span className="flex items-center gap-2">
                              {providerIcon && (
                                <span
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                                  style={{
                                    boxShadow: isSelected
                                      ? "0 4px 16px rgba(90, 69, 255, 0.28)"
                                      : "0 1px 4px rgba(148, 163, 184, 0.22)",
                                  }}
                                >
                                  <Image
                                    src={providerIcon}
                                    alt={`${providerLabel} icon`}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5 object-contain"
                                  />
                                </span>
                              )}
                              <span
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                                style={getProviderChipStyles(provider)}
                              >
                                {providerLabel}
                              </span>
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-sky-50/30 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedChart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-white/80 backdrop-blur-sm p-2"
          >
            {renderChart()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
