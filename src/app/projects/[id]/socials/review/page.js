"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getPostSetById,
  getPostSets,
  getTaskStatus,
  updatePost,
  updatePostSet,
  updatePostSetUtm,
  bulkPostAction,
  generatePostImage,
  editPostImageDraft,
  savePostImageDraft,
  schedulePosts,
} from "../../../../../api/socialApi";
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  Loader2,
  Check,
  Calendar,
  Image as ImageIcon,
  Copy,
  Clock,
  Tag,
  ExternalLink,
  FileText,
  X,
  Plus,
  ThumbsUp,
  MessageCircle,
  Share2,
  Share,
  Send,
  MoreHorizontal,
  Globe,
  Heart,
  ArrowUpFromLine,
  BarChart2,
  Bookmark,
  Music,
  Play,
  Download,
  CheckSquare,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

const XLogo = ({ size = 14, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path d="M2.5 2.25h4.71l5.16 6.86 4.85-6.86h4.71l-7.13 9.7 7.46 9.8h-4.71l-5.49-7.28-5.11 7.28H2.5l7.46-9.93-7.46-9.57z" />
  </svg>
);

const PLATFORM_META = {
  linkedin: {
    Icon: FaLinkedinIn,
    color: "#0A66C2",
    label: "LinkedIn",
    charLimit: 3000,
    preview: {
      headerBg: "#0A66C2",
      headerText: "#FFFFFF",
      bodyBg: "#F3F2EF",
      cardBg: "#FFFFFF",
      accent: "#0A66C2",
    },
  },
  x: {
    Icon: XLogo,
    color: "#000000",
    label: "X",
    charLimit: 280,
    preview: {
      headerBg: "#000000",
      headerText: "#FFFFFF",
      bodyBg: "#111112",
      cardBg: "#1C1C1E",
      accent: "#F5F5F5",
    },
  },
  facebook: {
    Icon: FaFacebookF,
    color: "#1877F2",
    label: "Facebook",
    charLimit: 63206,
    preview: {
      headerBg: "#1877F2",
      headerText: "#FFFFFF",
      bodyBg: "#E7F0FF",
      cardBg: "#FFFFFF",
      accent: "#1C57D8",
    },
  },
  instagram: {
    Icon: FaInstagram,
    color: "#E1306C",
    label: "Instagram",
    charLimit: 2200,
    preview: {
      headerBg: "linear-gradient(90deg,#FF5F6D,#FFC371)",
      headerText: "#FFFFFF",
      bodyBg: "#FFF6F2",
      cardBg: "#FFFFFF",
      accent: "#E1306C",
    },
  },
  tiktok: {
    Icon: FaTiktok,
    color: "#010101",
    label: "TikTok",
    charLimit: 2200,
    preview: {
      headerBg: "#010101",
      headerText: "#FFFFFF",
      bodyBg: "#111111",
      cardBg: "#1C1C1C",
      accent: "#25F4EE",
    },
  },
  youtube: {
    Icon: FaYoutube,
    color: "#FF0000",
    label: "YouTube",
    charLimit: 5000,
    preview: {
      headerBg: "#FF0000",
      headerText: "#FFFFFF",
      bodyBg: "#FFF5F5",
      cardBg: "#FFFFFF",
      accent: "#E30000",
    },
  },
};

const STATUS_BADGE_STYLES = {
  ready: "bg-emerald-50 border-emerald-200 text-emerald-700",
  draft: "bg-amber-50 border-amber-200 text-amber-700",
};

const STATUS_CONFIG = {
  analyzing: { label: "Analyzing…", color: "bg-gray-50 text-gray-600 border-gray-200", spinning: true },
  strategy_ready: { label: "Strategy ready", color: "bg-blue-50 text-blue-700 border-blue-200" },
  generating: { label: "Generating…", color: "bg-violet-50 text-violet-700 border-violet-200", spinning: true },
  in_progress: { label: "In progress…", color: "bg-violet-50 text-violet-700 border-violet-200", spinning: true },
  draft: { label: "Draft", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ready: { label: "Ready", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  published: { label: "Published", color: "bg-blue-50 text-blue-700 border-blue-200" },
  failed: { label: "Failed", color: "bg-red-50 text-red-700 border-red-200" },
};

const PlatformChip = ({ platformId }) => {
  const meta = PLATFORM_META[platformId];
  if (!meta) return <span className="text-xs text-gray-500 capitalize">{platformId}</span>;
  const { Icon } = meta;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: meta.color }}>
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white" style={{ backgroundColor: meta.color }}>
        <Icon size={10} />
      </span>
      {meta.label}
    </span>
  );
};

const hashToHue = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) % 360;
  return hash;
};

const tagStyles = (tag) => {
  const hue = hashToHue(tag);
  return {
    backgroundColor: `hsla(${hue}, 80%, 96%, 1)`,
    borderColor: `hsla(${hue}, 75%, 85%, 1)`,
    color: `hsla(${hue}, 55%, 35%, 1)`,
  };
};

const safeFormatDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const parseUtmParams = (url) => {
  if (!url) return { source: "", medium: "", campaign: "" };
  try {
    const parsed = new URL(url);
    return {
      source: parsed.searchParams.get("utm_source") || "",
      medium: parsed.searchParams.get("utm_medium") || "",
      campaign: parsed.searchParams.get("utm_campaign") || "",
    };
  } catch {
    return { source: "", medium: "", campaign: "" };
  }
};

const extractBaseUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
};

const ensureAbsoluteUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const sanitizeCampaign = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildUtmUrl = (baseUrl, params) => {
  const safeBase = ensureAbsoluteUrl(baseUrl?.trim() || "https://example.com");
  try {
    const url = new URL(safeBase);
    if (params.source) url.searchParams.set("utm_source", params.source);
    if (params.medium) url.searchParams.set("utm_medium", params.medium);
    if (params.campaign) url.searchParams.set("utm_campaign", params.campaign);
    return url.toString();
  } catch {
    return safeBase;
  }
};

const isDarkHex = (color) => {
  if (!color || color.startsWith("linear")) return false;
  let hex = color.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const int = parseInt(hex, 16);
  if (Number.isNaN(int)) return false;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
};

const PreviewScaffold = ({ platformId, content, hook, pattern, imageUrl, tags = [], utmUrl }) => {
  const meta = PLATFORM_META[platformId] || {};
  const label = meta.label || platformId;
  const primary = meta.color || "#4F46E5";
  const theme = meta.preview || {
    headerBg: "#111111",
    headerText: "#FFFFFF",
    bodyBg: "#F7F7F7",
    cardBg: "#FFFFFF",
    accent: primary,
  };
  
  // Platform-specific flags
  const isLinkedIn = platformId === "linkedin";
  const isX = platformId === "x";
  const isFacebook = platformId === "facebook";
  const isInstagram = platformId === "instagram";
  const isTiktok = platformId === "tiktok";
  const isYoutube = platformId === "youtube";

  // Dark mode detection
  const isDarkCard = isDarkHex(theme.cardBg);
  const bodyText = isDarkCard ? "#F8FAFC" : "#111827";
  const subText = isDarkCard ? "rgba(248,250,252,0.7)" : "#6B7280";
  const tagOverride = isDarkCard
    ? {
        backgroundColor: "rgba(255,255,255,0.08)",
        color: "#F8FAFC",
        borderColor: "rgba(255,255,255,0.15)",
      }
    : null;

  // Platform-specific header content
  const renderPlatformHeader = () => {
    if (isLinkedIn) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <meta.Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Your Company</p>
            <p className="text-[11px] text-blue-100">Promoted</p>
          </div>
          <div className="ml-auto">
            <button className="text-white/60 hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    if (isX) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <meta.Icon className="w-5 h-5 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Your Brand</p>
            <p className="text-[11px] text-gray-400">@yourbrand</p>
          </div>
          <div className="ml-auto">
            <MoreHorizontal className="w-5 h-5 text-white/60" />
          </div>
        </div>
      );
    }

    if (isFacebook) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <meta.Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Your Brand Name</p>
            <p className="text-[11px] text-blue-100">Sponsored · <Globe className="w-3 h-3 inline" /></p>
          </div>
          <div className="ml-auto">
            <MoreHorizontal className="w-5 h-5 text-white/60" />
          </div>
        </div>
      );
    }

    if (isInstagram) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-pink-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 to-pink-500 flex items-center justify-center text-white">
                <meta.Icon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">yourbrand</p>
            <p className="text-[11px] text-white/70">Sponsored</p>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <MoreHorizontal className="w-5 h-5" />
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25">
              <X className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      );
    }

    if (isTiktok) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <meta.Icon className="w-5 h-5 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">@yourbrand</p>
            <p className="text-[11px] text-gray-400">Sponsored</p>
          </div>
          <div className="ml-auto">
            <MoreHorizontal className="w-5 h-5 text-white/60" />
          </div>
        </div>
      );
    }

    if (isYoutube) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <meta.Icon className="w-6 h-6 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Your Brand</p>
            <p className="text-[11px] text-gray-300">1M subscribers</p>
          </div>
          <button className="ml-auto px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700">
            Subscribe
          </button>
        </div>
      );
    }

    // Default header
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold" style={{ background: theme.cardBg, color: theme.accent }}>
          {label?.[0] || "P"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Your Brand</p>
          <p className="text-[11px] opacity-80 truncate">Preview · {label}</p>
        </div>
      </div>
    );
  };

  // Platform-specific content rendering
  const renderPlatformContent = () => {
    if (isLinkedIn) {
      return (
        <div className="space-y-3">
          {hook && (
            <div className="text-sm font-semibold text-blue-700">
              {hook}
            </div>
          )}

          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>

          {imageUrl && (
            <div className="w-full rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[11px] text-blue-700 bg-blue-50 rounded-md border border-blue-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-700">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs">Like</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-700">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Comment</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-700">
                <Share2 className="w-4 h-4" />
                <span className="text-xs">Share</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-700">
                <Send className="w-4 h-4" />
                <span className="text-xs">Send</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isX) {
      return (
        <div className="space-y-3">
          <div className="text-sm text-white whitespace-pre-wrap leading-relaxed">
            {content}
          </div>

          {imageUrl && (
            <div className="w-full rounded-2xl overflow-hidden border border-gray-800">
              <img
                src={imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">12</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-green-400">
                <ArrowUpFromLine className="w-4 h-4 rotate-180" />
                <span className="text-xs">45</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-red-400">
                <Heart className="w-4 h-4" />
                <span className="text-xs">128</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-400">
                <BarChart2 className="w-4 h-4" />
                <span className="text-xs">8.9K</span>
              </button>
              <div className="ml-auto">
                <button className="text-gray-500 hover:text-blue-400">
                  <Share className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isFacebook) {
      return (
        <div className="space-y-3">
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>

          {imageUrl && (
            <div className="w-full rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
                <ThumbsUp className="w-5 h-5" />
                <span className="text-xs font-medium">Like</span>
              </button>
              <button className="flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Comment</span>
              </button>
              <button className="flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
                <Share2 className="w-5 h-5" />
                <span className="text-xs font-medium">Share</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isInstagram) {
      const instagramTagLines = [];
      if (tags.length > 0) {
        for (let i = 0; i < tags.length; i += 4) {
          instagramTagLines.push(tags.slice(i, i + 4));
        }
      }

      return (
        <div className="space-y-3">
          {hook && (
            <div className="text-[13px] font-semibold text-[#FD8C31]">
              {hook}
            </div>
          )}

          <div className="text-[14px] text-gray-900 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>

          {tags.length > 0 && (
            <div className="space-y-1 text-[13px] font-medium text-[#1056D9]">
              {instagramTagLines.map((line, idx) => (
                <p key={`${line.join("-")}-${idx}`} className="tracking-tight">
                  {line.map((tag) => `#${tag}`).join("  ")}
                </p>
              ))}
            </div>
          )}

          {imageUrl && (
            <div className="w-full rounded-[22px] border border-white shadow-sm overflow-hidden">
              <img
                src={imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-5 text-gray-900">
              <button className="hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </button>
              <button className="hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <button className="text-gray-900">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>
        </div>
      );
    }

    if (isTiktok) {
      return (
        <div className="space-y-3">
          <div className="text-sm text-white whitespace-pre-wrap leading-relaxed">
            {content}
          </div>

          {imageUrl && (
            <div className="w-full rounded-2xl overflow-hidden relative">
              <img
                src={imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[11px] text-white/80 hover:text-white"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white">456K</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white">2,341</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white">Save</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isYoutube) {
      return (
        <div className="space-y-3">
          <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
            {content}
          </div>

          {imageUrl && (
            <div className="w-full rounded-lg overflow-hidden relative bg-black">
              <img
                src={imageUrl}
                alt="Video thumbnail"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                3:45
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ThumbsUp className="w-5 h-5" />
                <span className="text-sm">12K</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ThumbsUp className="w-5 h-5 rotate-180" />
                <span className="text-sm">234</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Download className="w-5 h-5" />
                <span className="text-sm">Download</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-gray-600 hover:text-gray-900">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default content rendering
    return (
      <div className="space-y-3">
        {hook && (
          <div className="text-xs font-semibold" style={{ color: theme.accent }}>
            {hook}
          </div>
        )}

        {pattern && (
          <p className="text-[11px] font-medium" style={{ color: subText }}>
            Pattern: {pattern}
          </p>
        )}

        <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: bodyText }}>
          {content}
        </div>

        {imageUrl ? (
          <div className="w-full rounded-xl overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt="Post media"
              className="w-full h-auto object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 10).map((t) => (
              <span
                key={t}
                style={tagOverride || tagStyles(t)}
                className="px-2 py-0.5 text-[11px] rounded-md border"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {utmUrl ? (
          <div className={`mt-2 text-[11px] ${isDarkCard ? "text-indigo-200" : "text-indigo-600"}`}>
            <span className="font-semibold">UTM:</span> {utmUrl}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden ${isInstagram ? 'border-gray-200' : ''}`}
      style={{ background: theme.bodyBg, borderColor: isInstagram ? 'rgba(0,0,0,0.1)' : "rgba(0,0,0,0.05)" }}
    >
      <div
        className={`px-4 py-3 ${isInstagram ? 'border-b border-gray-200' : ''}`}
        style={{ background: theme.headerBg, color: theme.headerText }}
      >
        {renderPlatformHeader()}
      </div>

      <div className="p-4" style={{ background: theme.cardBg }}>
        {renderPlatformContent()}
      </div>
    </div>
  );
};

export default function ReviewPosts({ params }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const postSetId = searchParams.get("postSetId");
  const taskIdParam = searchParams.get("taskId");

  const [resolvedPostSetId, setResolvedPostSetId] = useState(null);

  const [postSet, setPostSet] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ strategy: false });

  const [isEditingPostSetTags, setIsEditingPostSetTags] = useState(false);
  const [postSetTagDraft, setPostSetTagDraft] = useState([]);
  const [postSetTagInput, setPostSetTagInput] = useState("");
  const [savingPostSetTags, setSavingPostSetTags] = useState(false);

  const [postTagInput, setPostTagInput] = useState("");
  const [editingImage, setEditingImage] = useState(false);
  const [hasImageDraft, setHasImageDraft] = useState(false);

  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);
  const [editImagePrompt, setEditImagePrompt] = useState("");
  const [editImageTargetPost, setEditImageTargetPost] = useState(null);

  const [platformFilter, setPlatformFilter] = useState("");
  const [postTagFilters, setPostTagFilters] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [utmModal, setUtmModal] = useState({
    open: false,
    post: null,
    postId: null,
    baseUrl: "",
    source: "",
    medium: "",
    campaign: "",
  });
  const [copiedUtmPostId, setCopiedUtmPostId] = useState(null);
  const copiedTimeoutRef = useRef(null);
  const [utmSaving, setUtmSaving] = useState(false);

  const availablePostTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach((p) => {
      (p.post_tags || [])
        .filter((t) => !String(t).toLowerCase().startsWith("platform:"))
        .forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  const visiblePosts = useMemo(() => {
    return posts.filter((p) => {
      const platformMatches = !platformFilter
        ? true
        : (p.platform_name || p.platform || "").toLowerCase() === platformFilter;
      if (!platformMatches) return false;
      if (postTagFilters.length === 0) return true;
      const tags = (p.post_tags || []).map((t) => String(t));
      return postTagFilters.every((tag) => tags.includes(tag));
    });
  }, [posts, platformFilter, postTagFilters]);

  const selectedPost = useMemo(() => {
    const found = visiblePosts.find((p) => (p.post_id || p.id || p._id) === activePostId);
    return found || visiblePosts[0] || null;
  }, [visiblePosts, activePostId]);

  const availablePlatforms = useMemo(() => {
    return Array.from(
      new Set(
        posts
          .map((p) => (p.platform_name || p.platform || "").toLowerCase())
          .filter(Boolean)
      )
    );
  }, [posts]);

  const hasSelection = selectedPosts.length > 0;

  const editingPostData = useMemo(() => {
    if (!editingPost) return null;
    return posts.find((p) => (p.post_id || p.id || p._id) === editingPost) || null;
  }, [editingPost, posts]);

  const canEditImage = useMemo(() => {
    const sourcePost = editingPostData || selectedPost;
    if (!sourcePost) return true;
    const updatedRaw =
      sourcePost.updated_at ||
      sourcePost.updatedAt ||
      sourcePost.updated ||
      sourcePost.updated_on ||
      sourcePost.updatedOn;
    const createdRaw =
      sourcePost.created_at ||
      sourcePost.createdAt ||
      sourcePost.created ||
      sourcePost.created_on ||
      sourcePost.createdOn ||
      sourcePost.created_date;

    const referenceRaw = updatedRaw || createdRaw;
    if (!referenceRaw) return true;

    const referenceDate = new Date(referenceRaw);
    if (Number.isNaN(referenceDate.getTime())) return true;
    const diffMs = Date.now() - referenceDate.getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return diffMs <= threeDaysMs;
  }, [editingPostData, selectedPost]);

  useEffect(() => {
    if (!activePostId && selectedPost) setActivePostId(selectedPost.post_id || selectedPost.id || selectedPost._id);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, [activePostId, selectedPost]);

  // Task polling
  const [taskStatus, setTaskStatus] = useState(null);
  const [taskProgress, setTaskProgress] = useState(0);
  const [taskStep, setTaskStep] = useState("");
  const pollRef = useRef(null);

  const activePostSetId = resolvedPostSetId || postSetId;
  const refreshRef = useRef(null);

  const loadPostSetData = useCallback(async (idToLoad, options = {}) => {
    const targetId = idToLoad || activePostSetId;
    if (!targetId) return;

    const { silent = false } = options;
    if (!silent) setLoading(true);
    let found = null;
    let primaryError = null;

    try {
      found = await getPostSetById(targetId, projectId);
    } catch (error) {
      primaryError = error;
    }

    if (!found) {
      try {
        const { postSets } = await getPostSets({ projectId, page: 1, limit: 50 });
        found = postSets.find(
          (ps) => ps.post_set_id === targetId || ps._id === targetId || ps.id === targetId
        );
      } catch (fallbackError) {
        console.error("Error loading post set via fallback:", fallbackError);
      }
    }

    if (found) {
      setPostSet(found);
      setPosts(found.posts || []);
    } else {
      console.error("Error loading post set:", primaryError);
      toast.error("Failed to load post set");
    }

    if (!silent) setLoading(false);
  }, [activePostSetId, projectId]);

  useEffect(() => {
    if (!projectId || !activePostSetId) return;

    const stop = () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      await loadPostSetData(undefined, { silent: true });
    };

    tick();
    refreshRef.current = setInterval(tick, 8000);

    return () => stop();
  }, [projectId, activePostSetId, loadPostSetData]);

  // Poll task status
  const pollTask = useCallback(async (tid) => {
    try {
      const data = await getTaskStatus(tid);
      setTaskStatus(data.status);
      setTaskProgress(data.progress_percentage || 0);
      setTaskStep(data.current_step || "");

      if (data.status === "completed" || data.status === "success") {
        clearInterval(pollRef.current);
        pollRef.current = null;
        toast.success("Posts generated successfully!");

        const docId = data.document_id || data.result_data?.document_id || data.result_data?.post_set_id;
        if (docId) {
          setResolvedPostSetId(docId);
          loadPostSetData(docId, { silent: true });
        } else {
          // Fall back to loading whatever we currently have
          loadPostSetData(undefined, { silent: true });
        }
      } else if (data.status === "failed") {
        clearInterval(pollRef.current);
        pollRef.current = null;
        toast.error(data.error_message || "Post generation failed");
      }
    } catch (error) {
      console.error("Error polling task:", error);
    }
  }, [loadPostSetData]);

  // Initial load + start polling
  useEffect(() => {
    // If we have a postSetId, load it immediately.
    // If we only have taskId, do NOT error — poll until we get document_id.
    if (postSetId) {
      loadPostSetData(postSetId);
    } else if (!taskIdParam) {
      toast.error("Post set ID is required");
      router.push(`/projects/${projectId}/socials`);
      return;
    }

    const tid = taskIdParam || null;
    if (tid) {
      setTaskStatus("in_progress");
      pollRef.current = setInterval(() => pollTask(tid), 4000);
      pollTask(tid);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [postSetId, taskIdParam, projectId, loadPostSetData, pollTask, router]);

  // Auto-poll if postSet comes back with a still-processing status
  useEffect(() => {
    if (!postSet) return;
    const genStatus = postSet.generation_status || postSet.status;
    const isProcessing = ["analyzing", "generating", "in_progress"].includes(genStatus);

    if (isProcessing && postSet.task_id && !pollRef.current) {
      pollRef.current = setInterval(() => pollTask(postSet.task_id), 4000);
    }
  }, [postSet, pollTask]);

  const isProcessing = taskStatus === "in_progress" || taskStatus === "analyzing" || taskStatus === "generating" ||
    ["analyzing", "generating", "in_progress"].includes(postSet?.generation_status || postSet?.status);

  const togglePostSelection = (postId) => {
    setSelectedPosts((prev) => prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]);
  };

  const togglePostTagFilter = (tag) => {
    setPostTagFilters((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleSelectAll = () => {
    setSelectedPosts(selectedPosts.length === visiblePosts.length ? [] : visiblePosts.map((p) => p.post_id || p.id || p._id));
  };

  const handleEditPost = (post) => {
    const pid = post.post_id || post.id || post._id;
    setEditingPost(pid);
    setActivePostId(pid);
    setEditFormData({
      post_content: post.post_content || post.content || "",
      hook: post.hook || "",
      image_url: post.image_url || "",
      post_tags: Array.isArray(post.post_tags) ? post.post_tags : [],
      platform_id: (post.platform_name || post.platform || "").toLowerCase(),
    });
    setHasImageDraft(false);
    setImagePrompt(post.image_prompt || "");
    setPostTagInput("");
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingPost(null);
    setImagePrompt("");
    setIsEditImageModalOpen(false);
    setEditImagePrompt("");
    setEditImageTargetPost(null);
    setPostTagInput("");
    setHasImageDraft(false);
  };

  const handleSavePost = async () => {
    try {
      setSaving(true);

      if (hasImageDraft && editingPost) {
        await savePostImageDraft(editingPost);
        setHasImageDraft(false);
      }

      const existingTags = Array.isArray(editFormData.post_tags) ? editFormData.post_tags : [];
      const platformId = (editFormData.platform_id || "").toLowerCase();
      const platformTag = platformId ? `platform:${platformId}` : null;
      const nonPlatformTags = existingTags.filter((t) => !String(t).toLowerCase().startsWith("platform:"));
      const finalTags = Array.from(
        new Set([...(platformTag ? [platformTag] : []), ...nonPlatformTags].filter(Boolean))
      );

      await updatePost(editingPost, projectId, {
        post_content: editFormData.post_content,
        hook: editFormData.hook,
        tags: finalTags,
      });

      toast.success("Post updated");
      closeEditor();
      loadPostSetData();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateImage = async (postId) => {
    if (!imagePrompt.trim()) {
      toast.error("Please enter an image prompt");
      return;
    }
    try {
      setGeneratingImage(true);
      const response = await generatePostImage(postId, imagePrompt);
      toast.success("Image generated!");
      setEditFormData((prev) => ({ ...prev, image_url: response.image_url || response.data?.image_url }));
      setHasImageDraft(false);
      loadPostSetData();
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleEditImage = async (postId, promptValue) => {
    const nextPrompt = (promptValue || "").trim();
    if (!nextPrompt) {
      toast.error("Please enter an edit prompt");
      return;
    }
    try {
      setEditingImage(true);
      const response = await editPostImageDraft(postId, nextPrompt);
      const nextUrl = response.draft_image_url || response.draftImageUrl || response.image_url || response.data?.draft_image_url;
      if (nextUrl) {
        setEditFormData((prev) => ({ ...prev, image_url: nextUrl }));
        setHasImageDraft(true);
        toast.success("Draft image ready — click Save changes to finalize");
        setIsEditImageModalOpen(false);
      } else {
        toast.error("Failed to generate draft image");
      }
    } catch (error) {
      console.error("Error editing image:", error);
      toast.error(error?.message || "Failed to edit image");
    } finally {
      setEditingImage(false);
    }
  };

  const openEditImageModal = (postId) => {
    if (!postId) return;
    setEditImageTargetPost(postId);
    setEditImagePrompt("");
    setIsEditImageModalOpen(true);
  };

  const closeEditImageModal = () => {
    if (editingImage) return;
    setIsEditImageModalOpen(false);
    setEditImagePrompt("");
    setEditImageTargetPost(null);
  };

  const openPostSetTagEditor = () => {
    const rawTags = Array.isArray(postSet?.tags) ? postSet.tags : [];
    const nonPlatformTags = rawTags.filter((t) => !String(t).toLowerCase().startsWith("platform:"));
    setPostSetTagDraft(nonPlatformTags);
    setPostSetTagInput("");
    setIsEditingPostSetTags(true);
  };

  const savePostSetTags = async () => {
    if (!postSet) return;
    try {
      setSavingPostSetTags(true);
      const rawTags = Array.isArray(postSet?.tags) ? postSet.tags : [];
      const platformTags = rawTags.filter((t) => String(t).toLowerCase().startsWith("platform:"));
      const nextTags = Array.from(new Set([...(platformTags || []), ...(postSetTagDraft || [])].filter(Boolean)));
      const targetId = activePostSetId;
      if (!targetId) throw new Error("Missing post set id");
      await updatePostSet(targetId, projectId, { tags: nextTags });
      toast.success("Post set tags updated");
      setIsEditingPostSetTags(false);
      loadPostSetData();
    } catch (error) {
      console.error("Error updating post set tags:", error);
      toast.error(error?.message || "Failed to update tags");
    } finally {
      setSavingPostSetTags(false);
    }
  };

  const handleBulkAction = async (action, params = {}) => {
    if (selectedPosts.length === 0) {
      toast.error("Select at least one post");
      return;
    }
    try {
      await bulkPostAction(projectId, action, selectedPosts, params);
      toast.success(`${action.replace("_", " ")} completed`);
      loadPostSetData();
      setSelectedPosts([]);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action.replace("_", " ")}`);
    }
  };

  const handleSendToScheduler = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Select at least one post");
      return;
    }

    try {
      const documentId = resolvedPostSetId || postSetId;

      const postsForBatch = selectedPosts
        .map((pid) => ({
          post_id: pid,
          document_id: documentId,
          project_id: projectId,
        }))
        .filter((p) => p.post_id && p.document_id && p.project_id);

      if (postsForBatch.length === 0) {
        toast.error("No valid posts to schedule");
        return;
      }

      const result = await schedulePosts(postsForBatch);
      if (!result?.success) {
        throw new Error(result?.message || result?.error || "Failed to schedule posts");
      }

      const summary = result?.summary || {};
      const newlyScheduled = summary.newly_scheduled ?? summary.successful ?? 0;
      const alreadyScheduled = summary.already_scheduled ?? 0;
      const failed = summary.failed ?? 0;

      let successMessage = "";
      if (newlyScheduled > 0) {
        successMessage += `${newlyScheduled} post${newlyScheduled !== 1 ? "s" : ""} scheduled successfully`;
      }
      if (alreadyScheduled > 0) {
        if (successMessage) successMessage += ", ";
        successMessage += `${alreadyScheduled} post${alreadyScheduled !== 1 ? "s were" : " was"} already scheduled`;
      } 
      if (successMessage) toast.success(`${successMessage}!`);
      if (failed > 0) toast.error(`${failed} post${failed !== 1 ? "s" : ""} failed to schedule`);

      setSelectedPosts([]);
      await loadPostSetData();
    } catch (error) {
      console.error("Error scheduling posts:", error);
      toast.error(error?.message || "Failed to schedule posts");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const openUtmModal = (post) => {
    const rawUrl = post.utm_url || post.utm_link || post.destination_url || postSet?.destination_url || "";
    const params = parseUtmParams(rawUrl);
    const baseUrl = extractBaseUrl(rawUrl) || post.destination_url || post.source_url || "";
    setUtmModal({
      open: true,
      post,
      postId: post.post_id || post.id || post._id,
      baseUrl,
      source: params.source || (post.platform_name || post.platform || "social").toLowerCase(),
      medium: params.medium || "social",
      campaign: params.campaign || sanitizeCampaign(postSet?.post_set_name || post.campaign_name || "campaign"),
    });
  };

  const closeUtmModal = () => {
    setUtmModal({ open: false, post: null, postId: null, baseUrl: "", source: "", medium: "", campaign: "" });
    setUtmSaving(false);
  };

  const handleSaveUtm = async () => {
    if (!utmModal.open || !utmModal.post) return;

    const post = utmModal.post;
    const documentId = post.document_id || post.documentId || post.post_set_id || postSet?.post_set_id;
    if (!documentId) {
      toast.error("Missing document ID for this post");
      return;
    }

    if (!utmModal.baseUrl?.trim()) {
      toast.error("Enter a base URL first");
      return;
    }

    const utmUrl = buildUtmUrl(utmModal.baseUrl, {
      source: utmModal.source,
      medium: utmModal.medium,
      campaign: utmModal.campaign,
    });

    try {
      setUtmSaving(true);
      await updatePostSetUtm({ projectId, documentId, utmUrl });
      toast.success("UTM updated");
      closeUtmModal();
      loadPostSetData();
    } catch (error) {
      console.error("Error updating UTM:", error);
      toast.error(error?.message || "Failed to update UTM");
    } finally {
      setUtmSaving(false);
    }
  };

  // Loading state
  if (loading && !postSet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Not found state
  if (!postSet && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <FileText className="w-12 h-12 text-gray-300" />
        <p className="text-gray-600">Post set not found</p>
        <button onClick={() => router.push(`/projects/${projectId}/socials`)} className="text-sm text-indigo-600 hover:underline cursor-pointer">
          ← Back to Posts
        </button>
      </div>
    );
  }

  const displayStatus = taskStatus || postSet?.generation_status || postSet?.status || "draft";
  const sCfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.draft;
  const platforms = postSet?.platforms || [];
  const tags = (postSet?.tags || []).filter((t) => !t.startsWith("platform:"));
  const selectedPlatformId = (selectedPost?.platform_name || selectedPost?.platform || "").toLowerCase();
  const highlightedPlatformId = platformFilter || "";
  const highlightedPlatformLabel = highlightedPlatformId ? (PLATFORM_META[highlightedPlatformId]?.label || highlightedPlatformId) : null;
  const createdAtLabel = safeFormatDateTime(postSet?.created_at || postSet?.createdAt || postSet?.created);
  const updatedAtLabel = safeFormatDateTime(postSet?.updated_at || postSet?.updatedAt || postSet?.updated);
  const detailItems = [
    createdAtLabel && { label: "Created", value: createdAtLabel },
    updatedAtLabel && { label: "Updated", value: updatedAtLabel },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full max-w-10xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push(`/projects/${projectId}/socials`)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Posts
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 whitespace-pre-wrap">
                  {postSet.post_set_name || "Post Set"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${sCfg.color}`}
                >
                  {sCfg.spinning && <Loader2 className="w-3 h-3 animate-spin" />}
                  {sCfg.label}
                </span>
              </div>

              {platforms.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPlatformFilter("")}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.25 text-sm font-medium border cursor-pointer transition-all ${
                      platformFilter === ""
                        ? "bg-indigo-600 border-indigo-600 text-white shadow"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    All platforms
                  </button>
                  {availablePlatforms.map((platformId) => {
                    const meta = PLATFORM_META[platformId];
                    const isSelected = platformFilter === platformId;
                    const baseClasses = "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.25 text-sm font-medium cursor-pointer transition-all";
                    const selectedClasses = meta
                      ? "text-white"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700";
                    return (
                      <button
                        key={platformId}
                        onClick={() => setPlatformFilter(platformId === platformFilter ? "" : platformId)}
                        className={`${baseClasses} ${
                          isSelected
                            ? meta
                              ? "shadow border-transparent"
                              : selectedClasses
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                        style={
                          isSelected && meta
                            ? {
                                backgroundColor: `${meta.color}22`,
                                borderColor: meta.color,
                                color: meta.color,
                              }
                            : undefined
                        }
                      >
                        {meta ? (
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] ${
                              isSelected ? "ring-2 ring-offset-1 ring-offset-white" : ""
                            }`}
                            style={{ backgroundColor: meta.color }}
                          >
                            <meta.Icon size={10} />
                          </span>
                        ) : (
                          <span className="text-xs uppercase font-semibold">{platformId.slice(0, 2)}</span>
                        )}
                        <span className="capitalize">{meta?.label || platformId}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {postSet.source_url && (
                <a href={postSet.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  Source
                </a>
              )}
              {posts.length > 0 && <span>{posts.length} post{posts.length !== 1 ? "s" : ""}</span>}
              {highlightedPlatformLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                  <span className="text-[11px] uppercase tracking-wide text-indigo-500">Active</span>
                  {highlightedPlatformLabel}
                </span>
              )}
            </div>
          </div>

          {detailItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {detailItems.map((item) => (
                <span
                  key={`${item.label}-${item.value}`}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-100 bg-gray-50 text-xs text-gray-600"
                >
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {(postSet?.tags || []).filter((t) => !t.startsWith("platform:")).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {(postSet?.tags || []).filter((t) => !t.startsWith("platform:")).map((tag) => (
                  <span
                    key={tag}
                    style={tagStyles(tag)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {postSet && (
              <button
                type="button"
                onClick={() => (isEditingPostSetTags ? setIsEditingPostSetTags(false) : openPostSetTagEditor())}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {isEditingPostSetTags ? "Close" : "Edit tags"}
              </button>
            )}
          </div>

          {isEditingPostSetTags && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {postSetTagDraft.map((t) => (
                  <span
                    key={t}
                    style={tagStyles(t)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border"
                  >
                    <Tag className="w-3 h-3" />
                    {t}
                    <button
                      type="button"
                      onClick={() => setPostSetTagDraft((prev) => prev.filter((x) => x !== t))}
                      className="text-gray-500 hover:text-gray-900 cursor-pointer"
                      title="Remove tag"
                      aria-label="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={postSetTagInput}
                  onChange={(e) => setPostSetTagInput(e.target.value)}
                  placeholder="Add tag…"
                  className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const v = (postSetTagInput || "").trim();
                    if (!v) return;
                    setPostSetTagDraft((prev) => Array.from(new Set([...prev, v])));
                    setPostSetTagInput("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = (postSetTagInput || "").trim();
                    if (!v) return;
                    setPostSetTagDraft((prev) => Array.from(new Set([...prev, v])));
                    setPostSetTagInput("");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
                <button
                  type="button"
                  onClick={savePostSetTags}
                  disabled={savingPostSetTags}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                >
                  {savingPostSetTags ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          )}

          {postSet.strategy && (
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => setExpandedSections((p) => ({ ...p, strategy: !p.strategy }))}
                className="flex items-center justify-between w-full text-left cursor-pointer"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Strategy Summary</span>
                {expandedSections.strategy ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.strategy && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{postSet.strategy}</p>
              )}
            </div>
          )}
        </div>

        {/* Processing banner */}
        {isProcessing && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-indigo-900">
                {taskStep || "Generating your posts…"}
              </p>
              <p className="text-xs text-indigo-700">This may take a few minutes. You can leave and come back later.</p>
              {taskProgress > 0 && (
                <div className="relative h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all" style={{ width: `${taskProgress}%` }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post grid */}
        {!isProcessing && posts.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-600 hover:border-gray-300 hover:text-gray-900 cursor-pointer shadow-sm"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {selectedPosts.length === visiblePosts.length ? "Deselect all" : "Select all"}
                </button>
                <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-600">
                  <span className="font-semibold text-gray-900">{visiblePosts.length}</span>
                  <span>visible</span>
                  {posts.length > 0 && visiblePosts.length !== posts.length && (
                    <span className="text-gray-400 text-[12px]">of {posts.length}</span>
                  )}
                </div>
                {hasSelection && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-indigo-700 text-[12px] font-medium">
                    {selectedPosts.length} selected
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("update_status", { status: "ready" })}
                  disabled={!hasSelection}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    hasSelection
                      ? "text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
                      : "text-slate-400 border-slate-200 bg-white"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={handleSendToScheduler}
                  disabled={!hasSelection}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    hasSelection
                      ? "text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
                      : "text-slate-400 border-slate-200 bg-white"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
              <div className="space-y-4">
                {visiblePosts.map((post) => {
                const pid = post.post_id || post.id || post._id;
                const platform = post.platform_name || post.platform || "";
                const meta = PLATFORM_META[platform.toLowerCase()] || {};
                const charLimit = meta.charLimit || 3000;
                const content = post.post_content || post.content || "";
                const isOverLimit = content.length > charLimit;
                const isSelected = selectedPosts.includes(pid);
                const status = post.status || "draft";
                const hook = post.hook || "";
                const pattern = post.pattern || "";
                const postTags = post.post_tags || [];
                const utmUrl = post.utm_url || post.utm_link || post.destination_url || "";
                const isActivePreview = (pid || "") === activePostId;
                const postCreatedRaw = post.created_at || post.createdAt || post.created;
                const postUpdatedRaw = post.updated_at || post.updatedAt || post.updated;
                const postCreatedDate = postCreatedRaw ? new Date(postCreatedRaw) : null;
                const postUpdatedDate = postUpdatedRaw ? new Date(postUpdatedRaw) : null;
                const postCreatedLabel = safeFormatDateTime(postCreatedRaw);
                const showPostUpdated =
                  postUpdatedDate && !Number.isNaN(postUpdatedDate.getTime())
                    ? !postCreatedDate || Number.isNaN(postCreatedDate.getTime()) || postUpdatedDate >= postCreatedDate
                    : false;
                const postUpdatedLabel = showPostUpdated ? safeFormatDateTime(postUpdatedRaw) : null;

                return (
                  <div
                    key={pid}
                    onClick={() => setActivePostId(pid)}
                    className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                      isActivePreview
                        ? "border-indigo-400 shadow-md"
                        : isSelected
                          ? "border-indigo-300 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePostSelection(pid)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlatformFilter((prev) => {
                              const p = platform.toLowerCase();
                              return prev === p ? "" : p;
                            });
                          }}
                          className="cursor-pointer"
                          title="Filter by this platform"
                        >
                          <PlatformChip platformId={platform.toLowerCase()} />
                        </button>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${
                            STATUS_BADGE_STYLES[status] || "border-gray-200 text-gray-600 bg-gray-50"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(postCreatedLabel || postUpdatedLabel) && (
                          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-400">
                            {postCreatedLabel && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-gray-300">Created</span>
                                <span className="normal-case tracking-normal text-gray-500">{postCreatedLabel}</span>
                              </span>
                            )}
                            {postUpdatedLabel && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-gray-300">Updated</span>
                                <span className="normal-case tracking-normal text-gray-500">{postUpdatedLabel}</span>
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(content);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPost(post);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePostId(pid);
                          }}
                          className="px-2 py-0.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          View
                        </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
                        <div>
                          {post.image_url ? (
                            <div className="w-full h-52 rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                              <img
                                src={post.image_url}
                                alt="Post"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-52 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs">
                              <ImageIcon className="w-5 h-5 mb-1" />
                              No image provided
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {hook && (
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full">
                              <span role="img" aria-hidden="true">
                                🚀
                              </span>
                              {hook}
                            </p>
                          )}

                          {pattern && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium text-gray-600">Pattern:</span> {pattern}
                            </p>
                          )}

                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {content}
                          </p>

                          {postTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {postTags.slice(0, 8).map((t) => (
                                <span
                                  key={t}
                                  style={tagStyles(t)}
                                  className="px-2 py-0.5 text-[11px] rounded-md border"
                                >
                                  {t}
                                </span>
                              ))}
                              {postTags.length > 8 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-md">
                                  +{postTags.length - 8}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                            <span className={isOverLimit ? "text-red-500 font-medium" : ""}>
                              {content.length}/{charLimit}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2 bg-gray-50 rounded-xl border border-gray-100 p-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                              <span className="font-semibold text-gray-800">UTM URL</span>
                              {utmUrl ? (
                                <a
                                  href={utmUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate flex-1 min-w-0 text-indigo-600 hover:underline"
                                >
                                  {utmUrl}
                                </a>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                              <div className="flex items-center gap-1">
                                {utmUrl && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(utmUrl);
                                      toast.success("UTM copied");
                                      setCopiedUtmPostId(pid);
                                      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
                                      copiedTimeoutRef.current = setTimeout(() => setCopiedUtmPostId(null), 3000);
                                    }}
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                                      copiedUtmPostId === pid
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 animate-pulse"
                                        : ""
                                    }`}
                                    title="Copy UTM"
                                    aria-label="Copy UTM"
                                  >
                                    {copiedUtmPostId === pid ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                    <span className="sr-only">Copy UTM</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUtmModal(post);
                                  }}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                                  title="Edit UTM"
                                  aria-label="Edit UTM"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="sr-only">Edit UTM</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>

              <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
                <PreviewScaffold
                  platformId={(selectedPost?.platform_name || selectedPost?.platform || "").toLowerCase()}
                  content={selectedPost?.post_content || selectedPost?.content || ""}
                  hook={selectedPost?.hook || ""}
                  pattern={selectedPost?.pattern || ""}
                  imageUrl={selectedPost?.image_url || ""}
                  tags={selectedPost?.post_tags || []}
                  utmUrl={selectedPost?.utm_url || selectedPost?.utm_link || selectedPost?.destination_url || ""}
                />
              </div>
            </div>
          </>
        )}

        {/* Empty state (after generation complete) */}
        {!isProcessing && posts.length === 0 && postSet && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No posts yet</h3>
            <p className="text-sm text-gray-500">Posts may still be generating. Check back shortly.</p>
          </div>
        )}

        {/* UTM Builder Modal */}
        {utmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
            <div className="absolute inset-0 bg-black/50" onClick={closeUtmModal} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">UTM Builder</p>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {utmModal.post?.hook || utmModal.post?.post_title || "Post"}
                  </h3>
                </div>
                <button onClick={closeUtmModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Base URL</label>
                    <input
                      type="url"
                      value={utmModal.baseUrl}
                      onChange={(e) => setUtmModal((prev) => ({ ...prev, baseUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                    <p className="text-[11px] text-gray-400">We’ll append UTM parameters to this URL</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">UTM Source</label>
                    <input
                      type="text"
                      value={utmModal.source}
                      onChange={(e) => setUtmModal((prev) => ({ ...prev, source: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="facebook"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">UTM Medium</label>
                    <input
                      type="text"
                      value={utmModal.medium}
                      onChange={(e) => setUtmModal((prev) => ({ ...prev, medium: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="social"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">UTM Campaign</label>
                    <input
                      type="text"
                      value={utmModal.campaign}
                      onChange={(e) => setUtmModal((prev) => ({ ...prev, campaign: sanitizeCampaign(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="spring_launch"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Preview</label>
                  <div className="flex items-start gap-2">
                    <textarea
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs font-mono text-gray-800 leading-5 min-h-[90px] resize-y break-all whitespace-pre-wrap"
                      value={buildUtmUrl(utmModal.baseUrl, {
                        source: utmModal.source,
                        medium: utmModal.medium,
                        campaign: utmModal.campaign,
                      })}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(
                        buildUtmUrl(utmModal.baseUrl, {
                          source: utmModal.source,
                          medium: utmModal.medium,
                          campaign: utmModal.campaign,
                        })
                      )}
                      className="px-3 py-2 text-xs rounded-lg border border-gray-300 hover:bg-gray-100"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">Drag the corner to expand if the URL is long.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-3">
                <button
                  onClick={closeUtmModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUtm}
                  disabled={utmSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                >
                  {utmSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {utmSaving ? "Saving" : "Save UTM"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Sidebar */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={closeEditor} />
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Editing post</p>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{selectedPost?.hook || selectedPost?.post_title || "Post"}</h3>
                </div>
                <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                <section className="space-y-4">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Content</label>
                  <textarea
                    value={editFormData.post_content}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, post_content: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-[11px] mt-1 text-gray-400">
                    {editFormData.post_content?.length || 0} characters
                  </p>
                </section>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {(editFormData.post_tags || [])
                        .filter((t) => !String(t).toLowerCase().startsWith("platform:"))
                        .map((t) => (
                          <span
                            key={t}
                            style={tagStyles(t)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border"
                          >
                            <Tag className="w-3 h-3" />
                            {t}
                            <button
                              type="button"
                              onClick={() =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  post_tags: (prev.post_tags || []).filter((x) => x !== t),
                                }))
                              }
                              className="text-gray-500 hover:text-gray-900 cursor-pointer"
                              title="Remove tag"
                              aria-label="Remove tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={postTagInput}
                        onChange={(e) => setPostTagInput(e.target.value)}
                        placeholder="Add tag…"
                        className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          const v = (postTagInput || "").trim();
                          if (!v) return;
                          setEditFormData((prev) => ({
                            ...prev,
                            post_tags: Array.from(new Set([...(prev.post_tags || []), v])),
                          }));
                          setPostTagInput("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = (postTagInput || "").trim();
                          if (!v) return;
                          setEditFormData((prev) => ({
                            ...prev,
                            post_tags: Array.from(new Set([...(prev.post_tags || []), v])),
                          }));
                          setPostTagInput("");
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide">Hook</label>
                    <input
                      type="text"
                      value={editFormData.hook}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, hook: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Current image</label>
                    {editFormData.image_url ? (
                      <div className="w-full rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <img
                          src={editFormData.image_url}
                          alt="Post visual"
                          className="w-full h-auto max-h-[480px] object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-sm">
                        <ImageIcon className="w-5 h-5 mb-1" />
                        No image yet
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                        Image prompt
                        <span className="flex items-center gap-1 text-[10px] font-normal uppercase tracking-normal text-gray-400">
                          <Info className="w-3 h-3" />
                          Used for regenerate
                        </span>
                      </label>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the image you want to generate…"
                        rows={6}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid gap-2 pt-1 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateImage(editingPost)}
                        disabled={generatingImage}
                        className={`group rounded-2xl border px-4 py-3 text-left transition shadow-sm ${
                          generatingImage
                            ? "opacity-60 cursor-not-allowed bg-gray-50"
                            : "bg-white hover:border-indigo-300 hover:bg-indigo-50/70 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          {generatingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-indigo-500" />
                          )}
                          <span>Regenerate image</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                          Creates a fresh visual instantly
                          <span className="text-[10px] uppercase tracking-wide text-rose-500">replaces post</span>
                        </p>
                      </button>
                      {canEditImage ? (
                        <button
                          type="button"
                          onClick={() => openEditImageModal(editingPost)}
                          disabled={editingImage}
                          className={`group rounded-2xl border px-4 py-3 text-left transition shadow-sm ${
                            editingImage
                              ? "opacity-60 cursor-not-allowed bg-gray-50"
                              : "bg-white hover:border-amber-300 hover:bg-amber-50/70 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            {editingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Edit2 className="w-4 h-4 text-amber-500" />
                            )}
                            <span>Edit draft</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                            Preview tweaks before saving
                            <span className="text-[10px] uppercase tracking-wide text-amber-500">playground</span>
                          </p>
                        </button>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 bg-gray-50">
                          <div className="flex items-center gap-2 font-medium">
                            <Edit2 className="w-4 h-4" />
                            Image editing disabled
                          </div>
                          <p className="mt-1 text-xs">Draft edits are available only within 3 days of the latest post update.</p>
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 text-[11px] ${
                        hasImageDraft ? "text-amber-600" : "text-gray-400"
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      {hasImageDraft
                        ? "Draft preview active — click Save changes to finalize the image."
                        : "Draft previews stay local until you press Save changes."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-white">
                <div className="flex flex-wrap justify-start gap-3">
                  <button
                    onClick={handleSavePost}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save changes
                  </button>
                  <button
                    onClick={closeEditor}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditImageModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 py-10">
            <div className="absolute inset-0 bg-black/40" onClick={closeEditImageModal} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Edit image draft</p>
                  <p className="text-xs text-gray-500 mt-0.5">Enter an edit prompt to generate a draft preview. Save changes to finalize.</p>
                </div>
                <button
                  onClick={closeEditImageModal}
                  disabled={editingImage}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  aria-label="Close edit image modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-3">
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Edit prompt</label>
                <textarea
                  value={editImagePrompt}
                  onChange={(e) => setEditImagePrompt(e.target.value)}
                  placeholder="e.g., keep the same composition, but make it more minimal and add a blue gradient background…"
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Info className="w-3.5 h-3.5" />
                  This creates a draft preview only.
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button
                  onClick={closeEditImageModal}
                  disabled={editingImage}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditImage(editImageTargetPost, editImagePrompt)}
                  disabled={editingImage}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  Generate draft
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
