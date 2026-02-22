"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  generatePostsSingleStep,
  getTags,
  getPostSetDataByProject,
  getConnectedSocialAccounts,
  getPlatformConnections,
} from "../../../../../api/socialApi";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle, Clock, X, Tag as TagIcon, Info } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube } from "react-icons/fa";
import Switch from "@mui/material/Switch";
import toast from "react-hot-toast";
import { INTENTS, KPIS, PLATFORMS } from "../../../../../constants";
import { useTaskMonitor } from "../../../../context/TaskMonitorContext";
import { useSelection } from "../../../../context/SelectionContext";

const TONE_OPTIONS = ["Professional", "Casual", "Enthusiastic", "Educational", "Conversational"];

const createInitialFormData = () => ({
  sourceUrl: "",
  postSetName: "",
  platforms: [],
  intent: "educate",
  additionalInstructions: "",
  destinationUrl: "",
  tags: [],
  kpi: null,
  tone: null,
  emojiEnabled: true,
  utmParams: {
    source: "",
    medium: "social",
    campaign: "",
  },
});

const XLogo = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path d="M2.5 2.25h4.71l5.16 6.86 4.85-6.86h4.71l-7.13 9.7 7.46 9.8h-4.71l-5.49-7.28-5.11 7.28H2.5l7.46-9.93-7.46-9.57z" />
  </svg>
);

const PLATFORM_BRANDS = {
  linkedin: {
    accent: "#0A66C2",
    accentSoft: "#E8F3FF",
    iconBg: "#0A66C2",
    iconColor: "#FFFFFF",
    Icon: FaLinkedinIn,
  },
  x: {
    accent: "#000000",
    accentSoft: "#F4F4F5",
    iconBg: "#000000",
    iconColor: "#FFFFFF",
    Icon: XLogo,
  },
  facebook: {
    accent: "#1877F2",
    accentSoft: "#E7F0FF",
    iconBg: "#1877F2",
    iconColor: "#FFFFFF",
    Icon: FaFacebookF,
  },
  instagram: {
    accent: "#E1306C",
    accentSoft: "#FFF0F7",
    iconGradient: "linear-gradient(135deg,#F58529 0%,#FEDA77 25%,#DD2A7B 50%,#8134AF 75%,#515BD4 100%)",
    iconColor: "#FFFFFF",
    Icon: FaInstagram,
  },
  tiktok: {
    accent: "#010101",
    accentSoft: "#F4F4F5",
    iconGradient: "linear-gradient(135deg,#25F4EE 0%,#25F4EE 30%,#FE2C55 100%)",
    iconColor: "#FFFFFF",
    Icon: FaTiktok,
  },
  youtube: {
    accent: "#FF0000",
    accentSoft: "#FFE5E5",
    iconBg: "#FF0000",
    iconColor: "#FFFFFF",
    Icon: FaYoutube,
  },
};

export default function CreateSocialPost({ params }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { setIsDrawerOpen, instantRefreshAfterTaskStart } = useTaskMonitor();

  const [formData, setFormData] = useState(() => createInitialFormData());

  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [platformConnections, setPlatformConnections] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    options: false,
    advanced: false,
  });
  const [touched, setTouched] = useState({
    sourceUrl: false,
    postSetName: false,
    platforms: false,
  });

  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const [postSetTemplates, setPostSetTemplates] = useState([]);
  const [selectedPostSetTemplate, setSelectedPostSetTemplate] = useState(null);
  const [showPostSetSuggestions, setShowPostSetSuggestions] = useState(false);
  const postSetSuggestionsRef = useRef(null);
  const [postSetTemplatesLoading, setPostSetTemplatesLoading] = useState(false);
  const postSetFetchTimeoutRef = useRef(null);

  const isTemplateLocked = Boolean(selectedPostSetTemplate);

  const connectedPlatforms = useMemo(
    () =>
      Object.entries(platformConnections)
        .filter(([, value]) => value?.connected)
        .map(([key]) => key),
    [platformConnections]
  );

  const selectedPlatformCount = useMemo(
    () => formData.platforms.length,
    [formData.platforms]
  );

  const selectedPlatformNames = useMemo(
    () =>
      PLATFORMS.filter((platform) => formData.platforms.includes(platform.id)).map(
        (platform) => platform.name
      ),
    [formData.platforms]
  );

  const connectedSummary = useMemo(() => {
    if (connectedPlatforms.length === 0) {
      return "None";
    }

    return connectedPlatforms
      .map((platformId) => PLATFORMS.find((platform) => platform.id === platformId)?.name || platformId)
      .join(", ");
  }, [connectedPlatforms]);

  useEffect(() => {
    loadTags();
    loadPlatformConnections();
    loadPostSetTemplates("");
  }, [projectId]);

  const loadTags = async () => {
    try {
      const tags = await getTags(projectId);
      // tags may be [{tag, usage_count}] or [string]
      setAvailableTags(tags.map((t) => (typeof t === "string" ? t : t.tag)));
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const loadPlatformConnections = async () => {
    try {
      const connections = await getPlatformConnections(projectId);
      setPlatformConnections(connections);
    } catch (error) {
      console.error("Error loading platform connections:", error);
    }
  };

  const loadPostSetTemplates = async (search = "") => {
    try {
      setPostSetTemplatesLoading(true);
      const res = await getPostSetDataByProject(projectId, { search, pageSize: 20 });
      const data = res?.data || res;
      const results = data?.results;
      setPostSetTemplates(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error("Error loading post set templates:", error);
      setPostSetTemplates([]);
    } finally {
      setPostSetTemplatesLoading(false);
    }
  };

  const applyTemplatePayload = useCallback((template) => {
    const payload = template?.request_payload || {};
    setFormData((prev) => ({
      ...prev,
      postSetName: payload.post_set_name || template?.post_set_name || prev.postSetName,
      sourceUrl: payload.source_url || prev.sourceUrl,
      destinationUrl: payload.destination_url || prev.destinationUrl,
      platforms: Array.isArray(payload.platforms) ? payload.platforms : prev.platforms,
      intent: payload.intent || prev.intent,
      kpi: payload.kpi || prev.kpi,
      tone: payload.tone || prev.tone,
      additionalInstructions: payload.additional_instructions || prev.additionalInstructions,
      tags: Array.isArray(payload.tags) ? payload.tags : prev.tags,
      emojiEnabled: payload.allow_emoji ? payload.allow_emoji === "Yes" : prev.emojiEnabled,
    }));

    setErrors((prev) => ({ ...prev, sourceUrl: "", postSetName: "" }));
    setTouched((prev) => ({ ...prev, sourceUrl: true, postSetName: true }));
  }, []);

  const clearSelectedTemplate = useCallback(() => {
    setSelectedPostSetTemplate(null);
    setShowPostSetSuggestions(false);
    setFormData(createInitialFormData());
    setTagInput("");
    setErrors({});
    setTouched({ sourceUrl: false, postSetName: false, platforms: false });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!postSetSuggestionsRef.current) return;
      if (!postSetSuggestionsRef.current.contains(event.target)) {
        setShowPostSetSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showPostSetSuggestions) return;
    if (isTemplateLocked) return;

    if (postSetFetchTimeoutRef.current) clearTimeout(postSetFetchTimeoutRef.current);
    postSetFetchTimeoutRef.current = setTimeout(() => {
      loadPostSetTemplates(formData.postSetName || "");
    }, 250);

    return () => {
      if (postSetFetchTimeoutRef.current) clearTimeout(postSetFetchTimeoutRef.current);
    };
  }, [showPostSetSuggestions, formData.postSetName, isTemplateLocked]);

  const handleSourceUrlChange = (url) => {
    setFormData((prev) => ({
      ...prev,
      sourceUrl: url,
      postSetName: prev.postSetName || extractTitleFromUrl(url),
    }));
    setErrors((prev) => ({ ...prev, sourceUrl: "" }));
  };

  const extractTitleFromUrl = (url) => {
    try {
      const parts = url.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      return lastPart
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .substring(0, 50);
    } catch {
      return "";
    }
  };

  const togglePlatform = (platform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
    setErrors((prev) => ({ ...prev, platforms: "" }));
    setTouched((prev) => ({ ...prev, platforms: true }));
  };

  const handleAddTag = (tag) => {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, "-");
    if (!formData.tags.includes(normalizedTag) && formData.tags.length < 8) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, normalizedTag],
      }));
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sourceUrl.trim()) {
      newErrors.sourceUrl = "Content URL is required";
    } else if (!isValidUrl(formData.sourceUrl)) {
      newErrors.sourceUrl = "Please enter a valid URL";
    }

    if (!formData.postSetName.trim()) {
      newErrors.postSetName = "Post set name is required";
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = "Select at least one platform";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setTouched((prev) => ({
        ...prev,
        sourceUrl: true,
        postSetName: true,
        platforms: true,
      }));
      toast.error("Please fix the errors before submitting");
      return;
    }

    setGenerating(true);

    try {
      const response = await generatePostsSingleStep({
        projectId,
        postSetName: formData.postSetName,
        sourceUrl: formData.sourceUrl,
        destinationUrl: formData.destinationUrl || undefined,
        platforms: formData.platforms,
        intent: formData.intent,
        kpi: formData.kpi || "engagement",
        allowEmoji: formData.emojiEnabled,
        additionalInstructions: formData.additionalInstructions,
        tags: formData.tags,
        postsPerPlatform: 3,
        contentType: "article",
      });

      const taskId = response?.task_id ?? response?.taskId;
      const postSetId =
        response?.post_set_id ??
        response?.postSetId ??
        response?.document_id ??
        response?.documentId;

      toast.success("Posts are being generated!");
      setIsDrawerOpen(true);
      instantRefreshAfterTaskStart();

      const params = new URLSearchParams();
      if (postSetId) params.set("postSetId", postSetId);
      if (taskId) params.set("taskId", taskId);

      const socialsUrl = `/projects/${projectId}/socials${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      router.push(socialsUrl);
    } catch (error) {
      console.error("Error generating posts:", error);
      toast.error(error.message || "Failed to generate posts");
    } finally {
      setGenerating(false);
    }
  };

  const filteredTagSuggestions = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !formData.tags.includes(tag)
  );

  const filteredPostSetSuggestions = useMemo(() => {
    const q = (formData.postSetName || "").trim().toLowerCase();
    if (!q) return postSetTemplates.slice(0, 8);
    return postSetTemplates
      .filter((t) => (t.post_set_name || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [formData.postSetName, postSetTemplates]);

  const getPlatformIcon = (platformId) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform?.icon || platformId;
  };

  const getPlatformColor = (platformId) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform?.color || "#4F46E5";
  };

  const hexToRgba = (hex, alpha = 1) => {
    let sanitized = hex.replace("#", "");
    if (sanitized.length === 3) {
      sanitized = sanitized
        .split("")
        .map((char) => char + char)
        .join("");
    }

    const numeric = parseInt(sanitized, 16);
    const r = (numeric >> 16) & 255;
    const g = (numeric >> 8) & 255;
    const b = numeric & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const isConnected = (platformId) => {
    return platformConnections[platformId]?.connected || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-10 space-y-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Posts
        </button>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Create Social Posts</h1>
                <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">Beta</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Stay on-brand and generate ready-to-review social drafts from any source link.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                {selectedPlatformCount > 0 ? `${selectedPlatformCount} platform${selectedPlatformCount > 1 ? "s" : ""} selected` : "No platform yet"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-600">
                Connected: <span className="text-gray-900 font-medium">{connectedSummary}</span>
              </span>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">1. Content</h2>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Required</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => handleSourceUrlChange(e.target.value)}
                    disabled={isTemplateLocked}
                    placeholder="https://example.com/your-article"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.sourceUrl ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {touched.sourceUrl && errors.sourceUrl && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.sourceUrl}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Paste the article, landing page, or resource you want to promote. We'll pull page context automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post set name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={postSetSuggestionsRef}>
                    <input
                      type="text"
                      value={formData.postSetName}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        setFormData((prev) => ({ ...prev, postSetName: nextName }));
                        setErrors((prev) => ({ ...prev, postSetName: "" }));
                        setShowPostSetSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowPostSetSuggestions(true);
                        if (!isTemplateLocked) loadPostSetTemplates(formData.postSetName || "");
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, postSetName: true }))}
                      disabled={isTemplateLocked}
                      placeholder="Enter a descriptive name"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.postSetName ? "border-red-500" : "border-gray-300"
                      }`}
                    />

                    {selectedPostSetTemplate && (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <div className="truncate">
                          Using earlier post set: <span className="font-medium">{selectedPostSetTemplate.post_set_name}</span>
                          <span className="ml-2 text-gray-500">(Content fields locked — clear to edit)</span>
                        </div>
                        <button
                          type="button"
                          onClick={clearSelectedTemplate}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Clear template
                        </button>
                      </div>
                    )}

                    {showPostSetSuggestions && !isTemplateLocked && (
                      <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <div className="max-h-56 overflow-auto">
                          {postSetTemplatesLoading ? (
                            <div className="px-4 py-3 text-sm text-gray-500">Loading…</div>
                          ) : filteredPostSetSuggestions.length > 0 ? (
                            filteredPostSetSuggestions.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectedPostSetTemplate(template);
                                  applyTemplatePayload(template);
                                  setShowPostSetSuggestions(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50"
                              >
                                <div className="text-sm font-medium text-gray-800">
                                  {template.post_set_name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {(template.request_payload?.source_url || "").slice(0, 80)}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">No previous post sets found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {touched.postSetName && errors.postSetName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.postSetName}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Start typing to reuse an earlier post set, or enter a new name.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">2. Platforms</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Info className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  <span>Choose one or more channels</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 w-full lg:max-w-[80%]">
                {PLATFORMS.map((platform) => {
                  const isSelected = formData.platforms.includes(platform.id);
                  const connected = isConnected(platform.id);
                  const platformColor = getPlatformColor(platform.id);
                  const brand = PLATFORM_BRANDS[platform.id] || {};
                  const accentColor = brand.accent || platformColor;
                  const accentSoft = brand.accentSoft || hexToRgba(accentColor, 0.08);
                  const cardStyles = isSelected
                    ? {
                        borderColor: accentColor,
                        boxShadow: `0 12px 30px ${hexToRgba(accentColor, 0.2)}`,
                        background: accentSoft,
                      }
                    : {
                        borderColor: hexToRgba(accentColor, 0.18),
                        background: "#ffffff",
                      };

                  const iconStyles = {
                    color: brand.iconColor || (isSelected ? "#FFFFFF" : accentColor),
                    borderColor: brand.iconRing || "transparent",
                    boxShadow: brand.iconShadow || "none",
                  };

                  if (brand.iconGradient) {
                    iconStyles.background = brand.iconGradient;
                  } else {
                    iconStyles.backgroundColor = brand.iconBg || hexToRgba(accentColor, 0.15);
                  }

                  const badgeStyles = connected
                    ? {
                        color: accentColor,
                        backgroundColor: hexToRgba(accentColor, 0.1),
                      }
                    : {};

                  const IconComponent = brand.Icon;

                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      style={{
                        ...cardStyles,
                        "--tw-ring-color": platformColor,
                      }}
                      className="relative overflow-hidden p-3 border-2 rounded-xl transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer"
                    >
                      <div className="absolute top-2 right-2">
                        {connected ? (
                          <span
                            style={badgeStyles}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          >
                            <CheckCircle className="w-3 h-3" /> Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Not linked
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div
                          style={iconStyles}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-semibold border transition-colors"
                        >
                          {IconComponent ? (
                            <IconComponent size={20} />
                          ) : (
                            <span className="uppercase font-semibold">
                              {platform.icon}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 truncate">{platform.name}</div>
                          <p className="text-[11px] text-gray-500">Reach {platform.label}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {touched.platforms && errors.platforms && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.platforms}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span className="text-gray-600">
                  Connected: <span className="font-medium text-gray-800">{connectedSummary}</span>
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedSections((prev) => ({ ...prev, options: !prev.options }))}
                className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 px-5 py-4 cursor-pointer"
              >
                <span>3. Options</span>
                {expandedSections.options ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.options && (
                <div className="space-y-4 border-t border-gray-100 px-5 py-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intent preset
                    </label>
                    <div className="relative">
                      <select
                        value={formData.intent}
                        onChange={(e) => setFormData((prev) => ({ ...prev, intent: e.target.value }))}
                        disabled={isTemplateLocked}
                        className="w-full appearance-none px-4 py-2 border border-gray-300 rounded-lg bg-white pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        {INTENTS.map((intent) => (
                          <option key={intent.id} value={intent.id}>
                            {intent.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional instructions
                    </label>
                    <textarea
                      value={formData.additionalInstructions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, additionalInstructions: e.target.value }))}
                      placeholder="e.g., Focus on time-saving benefits, use technical language..."
                      rows={3}
                      disabled={isTemplateLocked}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Click-through URL
                    </label>
                    <input
                      type="url"
                      value={formData.destinationUrl}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, destinationUrl: e.target.value }));
                      }}
                      placeholder="Leave empty to use content URL"
                      disabled={isTemplateLocked}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      The URL users will visit when clicking your post link
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (optional, max 8)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          setShowTagSuggestions(e.target.value.length > 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tagInput.trim()) {
                            e.preventDefault();
                            handleAddTag(tagInput.trim());
                          }
                        }}
                        placeholder="Type to add or search tags..."
                        disabled={formData.tags.length >= 8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg تحریک focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                      />
                      {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredTagSuggestions.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddTag(tag)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                          >
                            <TagIcon className="w-3 h-3" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-indigo-900 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      • Autocomplete - Shows existing tags as you type<br />
                      • Normalized - Auto-converts to lowercase-with-hyphens<br />
                      • Optional - Never required, can skip entirely<br />
                      • Max 8 tags - Prevents clutter
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedSections((prev) => ({ ...prev, advanced: !prev.advanced }))}
                className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 px-5 py-4 cursor-pointer"
              >
                <span>Advanced (KPI, brand voice, emoji settings)</span>
                {expandedSections.advanced ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.advanced && (
                <div className="space-y-4 border-t border-gray-100 px-5 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target KPI</label>
                      <div className="relative">
                        <select
                          value={formData.kpi || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, kpi: e.target.value || null }))}
                          disabled={isTemplateLocked}
                          className="w-full appearance-none px-4 py-2 border border-gray-300 rounded-lg bg-white pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value="">None (Auto-select)</option>
                          {KPIS.map((kpi) => (
                            <option key={kpi.id} value={kpi.id}>
                              {kpi.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                      <div className="relative">
                        <select
                          value={formData.tone || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, tone: e.target.value || null }))}
                          disabled={isTemplateLocked}
                          className="w-full appearance-none px-4 py-2 border border-gray-300 rounded-lg bg-white pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value="">Adaptive (auto-detect)</option>
                          {TONE_OPTIONS.map((tone) => (
                            <option key={tone} value={tone.toLowerCase()}>
                              {tone}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 bg-white/70">
                      <div>
                        <p className="font-semibold text-gray-900">Emoji flair</p>
                        <p className="text-xs text-gray-500">Let AI sprinkle light emojis when relevant.</p>
                      </div>
                      <Switch
                        checked={formData.emojiEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emojiEnabled: e.target.checked }))}
                        disabled={isTemplateLocked}
                        inputProps={{ "aria-label": "Enable emojis" }}
                      />
                    </div>

                    <div className="border border-gray-200 rounded-2xl px-4 py-3 bg-white/70">
                      <p className="font-semibold text-gray-900 mb-1">UTM Medium</p>
                      <p className="text-xs text-gray-500 mb-3">We’ll auto-fill source & campaign per platform. Adjust medium if needed.</p>
                      <input
                        type="text"
                        value={formData.utmParams.medium}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            utmParams: { ...prev.utmParams, medium: e.target.value },
                          }))
                        }
                        placeholder="e.g., social"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Posts...
                  </>
                ) : (
                  <>
                    🚀 Generate Posts
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
