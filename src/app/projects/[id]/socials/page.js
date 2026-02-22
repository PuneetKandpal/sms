"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostSets, deletePostSet, getTags, getTaskStatus } from "../../../../api/socialApi";
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { Search, Plus, X, Tag, Clock, CheckCircle, FileText, Trash2, Calendar, Loader2, ChevronLeft, ChevronRight, ExternalLink, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useSelection } from "../../../context/SelectionContext";
import { useTaskMonitor } from "../../../context/TaskMonitorContext";
import KnowledgeBaseGateAlert from "../../../components/KnowledgeBaseGateAlert";
import api from "../../../../api/axios";
import useFeatureTracking from "../../../../hooks/useFeatureTracking";
import useTrackFeatureExploration from "../../../hooks/useTrackFeatureExploration";

const XLogo = ({ size = 14, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path d="M2.5 2.25h4.71l5.16 6.86 4.85-6.86h4.71l-7.13 9.7 7.46 9.8h-4.71l-5.49-7.28-5.11 7.28H2.5l7.46-9.93-7.46-9.57z" />
  </svg>
);

const PLATFORM_META = {
  linkedin: { Icon: FaLinkedinIn, color: "#0A66C2", label: "LinkedIn" },
  x: { Icon: XLogo, color: "#000000", label: "X" },
  facebook: { Icon: FaFacebookF, color: "#1877F2", label: "Facebook" },
  instagram: { Icon: FaInstagram, color: "#E1306C", label: "Instagram" },
  tiktok: { Icon: FaTiktok, color: "#010101", label: "TikTok" },
  youtube: { Icon: FaYoutube, color: "#FF0000", label: "YouTube" },
};

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: FileText, color: "bg-amber-50 text-amber-700 border-amber-200" },
  ready: { label: "Ready", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  published: { label: "Published", icon: Calendar, color: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  analyzing: { label: "Analyzing…", icon: Clock, color: "bg-gray-50 text-gray-600 border-gray-200" },
  generating: { label: "Generating…", icon: Loader2, color: "bg-violet-50 text-violet-700 border-violet-200" },
};

const PlatformPill = ({ platformId }) => {
  const meta = PLATFORM_META[platformId];
  if (!meta) return null;
  const { Icon } = meta;
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white"
      style={{ backgroundColor: meta.color }}
      title={meta.label}
    >
      <Icon size={12} />
    </span>
  );
};

export default function SocialPostsHome({ params }) {
  const { id: projectId } = use(params);
  useSelection(); // context dependency
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshTasks, setIsDrawerOpen } = useTaskMonitor();

  const taskIdParam = searchParams.get("taskId");
  const postSetIdParam = searchParams.get("postSetId");
  const pollRef = React.useRef(null);

  useTrackFeatureExploration("socials");
  useFeatureTracking("Social Media Posts", {
    feature_category: "content_creation",
    project_id: projectId,
  });

  const [postSets, setPostSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCompanyResearch, setHasCompanyResearch] = useState(false);
  const [companyResearchChecked, setCompanyResearchChecked] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    tags: [],
    search: "",
  });

  const [availableTags, setAvailableTags] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [tagQuery, setTagQuery] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const tagOptions = useMemo(() => {
    return availableTags.map((t) => ({
      value: typeof t === "string" ? t : t.tag,
      count: typeof t === "object" ? t.usage_count : null,
    }));
  }, [availableTags]);

  const filteredTagOptions = useMemo(() => {
    if (!tagQuery) return tagOptions;
    const search = tagQuery.trim().toLowerCase();
    return tagOptions.filter((opt) => opt.value.toLowerCase().includes(search));
  }, [tagOptions, tagQuery]);

  const addTagFilter = useCallback((tagValue) => {
    const next = tagValue?.trim();
    if (!next) return;
    setFilters((prev) => {
      if (prev.tags.includes(next)) return prev;
      return { ...prev, tags: [...prev.tags, next] };
    });
    setTagQuery("");
    setShowTagDropdown(false);
  }, []);

  const removeTagFilter = useCallback((tagValue) => {
    setFilters((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagValue) }));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const check = async () => {
      try {
        const response = await api.get(`/keyword-api/company-research-data/exists/?project_id=${projectId}`);
        setHasCompanyResearch(response.data?.exists || false);
      } catch {
        setHasCompanyResearch(false);
      } finally {
        setCompanyResearchChecked(true);
      }
    };
    check();
  }, [projectId]);

  const loadPostSets = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const { postSets: data, pagination: pg, filters: f } = await getPostSets({
        projectId,
        status: filters.status || undefined,
        tags: filters.tags,
        search: filters.search,
        page: pagination.page,
        limit: pagination.limit,
      });

      setPostSets(data);
      setPagination((prev) => ({ ...prev, total: pg.total, pages: pg.pages }));
      setAvailableTags(f.available_tags || []);
      setStatusCounts(f.status_counts || {});
    } catch (error) {
      console.error("Error loading post sets:", error);
      if (!silent) toast.error("Failed to load post sets");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (!projectId || !companyResearchChecked) return;
    loadPostSets();
  }, [projectId, filters, pagination.page, companyResearchChecked, loadPostSets]);

  useEffect(() => {
    if (!projectId) return;
    if (!taskIdParam) return;

    refreshTasks();
    setIsDrawerOpen(true);

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const tick = async () => {
      try {
        const data = await getTaskStatus(taskIdParam);
        const status = (data?.status || "").toLowerCase();

        await loadPostSets({ silent: true });

        if (status === "completed" || status === "failed") {
          stopPolling();
          const next = new URLSearchParams(searchParams.toString());
          next.delete("taskId");
          router.replace(`/projects/${projectId}/socials${next.toString() ? `?${next.toString()}` : ""}`);

          if (status === "completed" && postSetIdParam) {
            toast.success("Posts generated — ready to review");
          }
          if (status === "failed") toast.error("Post generation failed");
        }
      } catch (e) {
        await loadPostSets({ silent: true });
      }
    };

    tick();
    pollRef.current = setInterval(tick, 5000);

    return () => stopPolling();
  }, [projectId, taskIdParam, postSetIdParam, refreshTasks, setIsDrawerOpen, loadPostSets, router, searchParams]);

  const [deleteModal, setDeleteModal] = useState({ open: false, postSet: null });
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (postSet, e) => {
    e?.stopPropagation();
    setDeleteModal({ open: true, postSet });
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal({ open: false, postSet: null });
  };

  const handleDeletePostSet = async () => {
    if (!deleteModal.postSet) return;
    setDeleting(true);
    try {
      await deletePostSet(deleteModal.postSet.post_set_id, projectId);
      toast.success("Post set deleted");
      loadPostSets();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting post set:", error);
      toast.error("Failed to delete post set");
    } finally {
      setDeleting(false);
    }
  };

  const handlePostSetClick = (ps) => {
    router.push(`/projects/${projectId}/socials/review?postSetId=${ps.post_set_id}`);
  };

  const toggleTagFilter = (tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const clearFilters = () => {
    setFilters({ status: "", tags: [], search: "" });
  };

  const activeFilterCount = useMemo(() => filters.tags.length, [filters.tags]);

  const renderHeader = ({ centered = false, showActions = true } = {}) => (
    <div
      className={`flex flex-col gap-4 ${
        centered ? "items-center text-center" : "sm:flex-row sm:items-center sm:justify-between"
      }`}
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Social Media Posts</h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage social posts to promote your content</p>
      </div>
      {showActions && (
        <button
          onClick={() => router.push(`/projects/${projectId}/socials/create`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Post
        </button>
      )}
    </div>
  );

  if (!companyResearchChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasCompanyResearch) {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="w-full px-6 sm:px-10 lg:px-16 py-6">
            {renderHeader({ centered: false, showActions: false })}
          </div>
        </div>

        <div className="w-full px-6 sm:px-10 lg:px-16">
          <div className="py-16 flex justify-center">
            <KnowledgeBaseGateAlert
              title="Knowledge base sources are required to use this feature"
              description="Add your company research sources in the knowledge base before using Social Media Posts."
              actionText="Go to knowledge base"
              actionLink={`/projects/${projectId}/keywords`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-6 sm:px-10 lg:px-16 py-8 space-y-6">
        {/* Header */}
        {renderHeader()}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="relative">
              <label className="sr-only" htmlFor="tag-filter">Filter by tags</label>
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="tag-filter"
                type="text"
                value={tagQuery}
                onChange={(e) => {
                  setTagQuery(e.target.value);
                  setShowTagDropdown(true);
                }}
                onFocus={() => setShowTagDropdown(true)}
                onBlur={() => setTimeout(() => setShowTagDropdown(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTagFilter(tagQuery);
                  }
                }}
                placeholder={tagOptions.length ? "Filter by tags…" : "No tags available"}
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {tagQuery && (
                <button
                  type="button"
                  onClick={() => setTagQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear tag search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {showTagDropdown && filteredTagOptions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredTagOptions.map(({ value, count }) => {
                    const isSelected = filters.tags.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!isSelected) addTagFilter(value);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-indigo-50 ${
                          isSelected ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 border border-gray-100">
                            <Tag className="w-3.5 h-3.5 text-gray-400" />
                          </span>
                          <span className="truncate">{value}</span>
                        </span>
                        <span className="flex items-center gap-2 text-xs text-gray-400">
                          {count != null && <span>({count})</span>}
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="sr-only" htmlFor="post-search">Search post sets</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="post-search"
                type="text"
                placeholder="Search post sets…"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((p) => ({ ...p, search: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {filters.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mr-1">Active tags</span>
              {filters.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[12px] text-indigo-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTagFilter(tag)}
                    className="text-indigo-500 hover:text-indigo-800"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, tags: [] }))}
                className="ml-auto text-[11px] text-gray-500 hover:text-gray-900"
              >
                Clear tags
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading post sets…</p>
          </div>
        ) : postSets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {activeFilterCount > 0 ? "No matching post sets" : "Create your first social post"}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {activeFilterCount > 0
                ? "Try adjusting your filters."
                : "Promote your content across social media in just a few steps. Generate AI-powered posts optimized for each platform."}
            </p>
            {activeFilterCount === 0 && (
              <button
                onClick={() => router.push(`/projects/${projectId}/socials/create`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create New Post
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {postSets.map((ps) => {
              const genStatus = ps.generation_status || ps.status || "draft";
              const statusKey = genStatus === "completed" ? (ps.status || "draft") : genStatus;
              const totalPosts = ps.counts?.total_posts ?? ps.posts?.length ?? 0;
              const platforms = ps.platforms || [];
              const tags = (ps.tags || []).filter((t) => !t.startsWith("platform:"));

              return (
                <div
                  key={ps.post_set_id}
                  onClick={() => handlePostSetClick(ps)}
                  className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer overflow-visible flex flex-col h-full"
                >
                  <button
                    onClick={(e) => openDeleteModal(ps, e)}
                    className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all w-10 h-10 rounded-full bg-red-50 border-2 border-white shadow-lg text-red-500 hover:bg-red-100 hover:scale-105 flex items-center justify-center cursor-pointer"
                    title="Delete"
                    aria-label="Delete post set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-5 space-y-3 flex-1">

                    {/* Name */}
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {ps.post_set_name}
                    </h3>

                    {/* Platforms + count */}
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1">
                        {platforms.map((p) => (
                          <PlatformPill key={p} platformId={p} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{totalPosts} post{totalPosts !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Source URL */}
                    {ps.source_url && (
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {ps.source_url.replace(/^https?:\/\//, "").split("/")[0]}
                      </p>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md">
                            {tag}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-md">+{tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>{ps.updated_at ? new Date(ps.updated_at).toLocaleDateString() : "—"}</span>
                    <span className="text-indigo-600 font-medium group-hover:underline">
                      Open →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeDeleteModal} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close delete modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Delete post set?</p>
                  <p className="text-xs text-gray-500">This cannot be undone and will remove all generated posts inside this set.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                {deleteModal.postSet?.post_set_name || "Untitled"}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePostSet}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? "Deleting" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
