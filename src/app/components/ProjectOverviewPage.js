"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelection } from "../context/SelectionContext";
import { Skeleton } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../api/axios";
import useFeatureTracking from "../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../lib/analytics/featureTracking";

const ITEM_DETAILS_MD = {
  knowledge_base: `## Overview

Your Knowledge Base is the foundation for everything else in the product. Add your company materials here so the AI can generate outputs that stay on-brand and grounded in facts.

## How to use it (recommended flow)

1. **Add high-signal sources first**
   - Your website / landing pages
   - Pitch deck, product one-pagers
   - Pricing, positioning, competitor notes
2. **Organize sources**
   - Group by topic (product, ICP, differentiators, case studies, etc.)
   - Keep sources clean and up-to-date (remove outdated docs)
3. **Run research / enrichment (if available)**
   - Start research tasks to expand the knowledge base with structured insights
4. **Validate the knowledge base**
   - Spot-check key facts (names, offerings, claims)
   - Ensure the core messaging matches what you want to publish

## What you get

- A single source of truth used by Keywords, Topics, Articles, AI Optimizations, and Social content
- Faster, more consistent generation results

## Best practices

- Keep sources focused: fewer, higher-quality sources beats many noisy ones
- Refresh sources whenever your positioning changes
- If a generation result looks off, update sources first before regenerating
`,
  keywords: `## Overview

Use Keyword Repository to build and manage your keyword universe. This helps you plan content and measure visibility across search/AI surfaces.

## How to use it

1. **Generate expansions**
   - Start with a few seed topics (product categories, problems, use-cases)
   - Generate variations and long-tail keywords
2. **Curate and clean**
   - Remove duplicates and irrelevant queries
   - Keep keywords aligned to your ICP and offerings
3. **Organize into clusters**
   - Group keywords by intent (awareness, consideration, decision)
   - Create clusters that can map to a single page or article
4. **Use keywords downstream**
   - Feed clusters into Topics and Content Architecture
   - Use a short list of priority keywords for Search Ranking checks

## Output you should aim for

- A curated set of keywords + clusters you can turn into pages and articles

## Tips

- Start broad, then narrow to your highest-converting intents
- Re-run after updating the Knowledge Base or adding new products
`,
  competitor_analysis: `## Overview

Competitor Analysis helps you evaluate how rival companies position themselves, what messaging they use, and how their offers compare to yours.

## How to use it

1. **Start a competitor scan**
   - Provide a competitor URL or select one from your saved list
   - Let the agent gather positioning, offers, and proof points
2. **Compare positioning**
   - Review differentiators, gaps, and pricing signals
3. **Turn insights into action**
   - Feed findings into Topics, Content Architecture, or Search Ranking runs

## Tips

- Re-run the analysis whenever a major competitor updates their site/product
- Capture 2–3 direct competitors plus an aspirational benchmark
- Pair results with your Knowledge Base to align messaging updates
`,
  search_ranking: `## Overview

Search Ranking helps you understand visibility by query across providers and track how you (and competitors) perform over time.

## How to use it

1. **Pick a focused keyword set**
   - Choose 10–30 priority queries from your Keyword Repository
2. **Run a ranking check**
   - Submit a new query run (or select a previous run)
   - Wait for tasks to complete and then refresh results
3. **Interpret results**
   - Identify where you are missing from the top results
   - Compare providers and competitor performance for the same query
4. **Turn insights into actions**
   - Convert gaps into new Topics / Articles
   - Update Content Architecture to cover missing intent clusters

## Best practices

- Re-run your priority queries after publishing new content
- Use consistent query sets to see trend changes more clearly
- Treat ranking dips as signals to refresh pages and improve topical coverage
`,
  content_architecture: `## Overview

Content Architecture helps you design a structured blueprint of pages and topics so your site covers the right intents and is easy to expand over time.

## How to use it

1. **Generate an initial blueprint**
   - Use your curated keywords and top topics as input
2. **Review page structure**
   - Check if each page has a clear purpose and target intent
   - Merge pages that overlap and split pages that are too broad
3. **Prioritize pages**
   - Identify high-impact pages (money pages + supporting content)
4. **Create a production plan**
   - Turn prioritized pages into Topics and Articles
   - Track progress as you publish and iterate

## What good looks like

- Clear page hierarchy (core pages, supporting pages, FAQs)
- Each page maps to a keyword cluster and a user intent

## Tips

- Keep the first blueprint simple; iterate once you see ranking results
- Use it as your long-term plan, not a one-time output
`,
  topics: `## Overview

Topics helps you build a prioritized list of content ideas based on your product, audience, and keyword strategy.

## How to use it

1. **Choose your direction**
   - Start from keyword clusters (best) or from a product/category theme
2. **Generate topics**
   - Generate a batch, then scan for relevance and uniqueness
3. **Curate and prioritize**
   - Keep topics that match your ICP and business goals
   - Prioritize by intent (commercial > informational)
4. **Turn topics into production**
   - Move the best topics into Articles
   - Use the topic list as your publishing backlog

## Best practices

- Prefer topics that clearly map to a keyword cluster
- Mix content types (how-to, comparison, use-cases, FAQs)
- Re-run after adding new sources to the Knowledge Base
`,
  ai_optimization_questions: `## Overview

AI Optimization Questions helps you generate the exact questions your audience asks so you can structure content to win visibility in AI answers and rich result surfaces.

## How to use it

1. **Pick a focus area**
   - Choose a product, feature, or keyword cluster
2. **Generate question sets**
   - Generate questions across multiple intents (what/why/how/best/compare)
3. **Review and clean**
   - Remove duplicates and overly generic questions
   - Keep questions that match your real audience language
4. **Group questions by page**
   - Assign question groups to a landing page or an article

## Output you should aim for

- A clean, grouped list of questions that can become a FAQ section or a dedicated Q&A page

## Tips

- If questions feel off, improve the Knowledge Base and regenerate
- Aim for specificity (industry, use-case, constraints)
`,
  ai_optimization_answers: `## Overview

AI Optimization Answers turns your best questions into concise, reusable answers that you can place on pages (FAQs, feature pages, docs) to improve AI and search visibility.

## How to use it

1. **Select a question set**
   - Start with the highest-intent questions
2. **Generate answers**
   - Generate answers in batches
3. **Validate and edit**
   - Ensure claims match your sources and product reality
   - Tighten answers to be direct and structured
4. **Publish and reuse**
   - Add answers to landing pages, articles, or documentation
   - Reuse high-quality answers across multiple channels

## Best practices

- Prefer short, direct answers (then add optional detail below)
- Keep wording consistent with your positioning
- If the answer requires citations/accuracy, update sources first
`,
  articles: `## Overview

Articles helps you generate long-form content from your topics and knowledge base. Use it to draft, iterate, and publish consistently.

## How to use it

1. **Pick a topic**
   - Choose a topic tied to a keyword cluster and clear intent
2. **Generate a draft**
   - Start with an outline-first approach if available
3. **Edit for quality**
   - Add examples, screenshots, data, and product-specific detail
   - Ensure tone and positioning match your brand
4. **Publish + measure**
   - Publish the article and track ranking/visibility changes
   - Update older articles based on new ranking insights

## Best practices

- Start with 3–5 high-impact topics and publish consistently
- Avoid generic content: add product and audience specificity
- Re-run Search Ranking checks after publishing
`,
  opportunity_agent: `## Overview

Opportunity Agent helps you find growth opportunities and generate a clear engagement strategy based on your market and company context.

## How to use it

1. **Run the agent**
   - Ensure your Knowledge Base has enough context first
2. **Review the opportunities**
   - Look for high-signal opportunities aligned to your product and ICP
3. **Select an opportunity**
   - Choose the ones with clear messaging angles and reachable audience
4. **Generate an engagement strategy**
   - Use the strategy as input for Topics, Articles, and Social Posts

## Best practices

- Re-run after major product updates or new research
- Treat outputs as a starting point; validate with your team
`,
  social_posts: `## Overview

Social Posts helps you create short-form content variations that stay aligned to your brand messaging and reuse your best knowledge and article insights.

## How to use it

1. **Pick a source**
   - Start from a published article, a key topic, or a feature message
2. **Generate variations**
   - Generate multiple angles (tips, myth vs fact, mini-story, CTA)
3. **Edit for voice and clarity**
   - Keep posts simple and specific
   - Add a strong hook and a clear call-to-action
4. **Publish or schedule**
   - Use Social Scheduler to plan a consistent cadence

## Best practices

- Generate 5–10 variations, then pick the strongest 2–3
- Reuse the same idea across channels with small edits
`,
  connections: `## Overview

Connections is where you link external tools and social accounts so the app can publish and schedule content on your behalf.

## How to use it

1. **Connect an account**
   - Follow the authorization flow for the provider
2. **Verify permissions**
   - Ensure the account has rights to publish where you need (page/workspace)
3. **Test the workflow**
   - Create a draft post and confirm it can be scheduled/published

## Best practices

- Use a shared brand account (not a personal account) where possible
- Reconnect if tokens expire or permissions change
`,
  social_scheduler: `## Overview

Social Scheduler helps you plan, schedule, and publish posts consistently.

## How to use it

1. **Prepare posts**
   - Generate a few Social Posts first
2. **Schedule your cadence**
   - Pick a realistic schedule (e.g., 3x/week)
3. **Review before publishing**
   - Ensure links, tags, and formatting look correct
4. **Track and iterate**
   - Review performance externally and adjust your topics and messaging

## Best practices

- Schedule in batches to save time
- Reuse high-performing angles with new examples
`,
  opportunity_agent: `## Overview\n\nOpportunity Agent helps you find growth opportunities and generate a clear engagement strategy based on your market and company context.\n\n## How to use it\n\n1. **Run the agent**\n   - Ensure your Knowledge Base has enough context first\n2. **Review the opportunities**\n   - Look for high-signal opportunities aligned to your product and ICP\n3. **Select an opportunity**\n   - Choose the ones with clear messaging angles and reachable audience\n4. **Generate an engagement strategy**\n   - Use the strategy as input for Topics, Articles, and Social Posts\n\n## Best practices\n\n- Re-run after major product updates or new research\n- Treat outputs as a starting point; validate with your team\n`,
  social_posts: `## Overview\n\nSocial Posts helps you create short-form content variations that stay aligned to your brand messaging and reuse your best knowledge and article insights.\n\n## How to use it\n\n1. **Pick a source**\n   - Start from a published article, a key topic, or a feature message\n2. **Generate variations**\n   - Generate multiple angles (tips, myth vs fact, mini-story, CTA)\n3. **Edit for voice and clarity**\n   - Keep posts simple and specific\n   - Add a strong hook and a clear call-to-action\n4. **Publish or schedule**\n   - Use Social Scheduler to plan a consistent cadence\n\n## Best practices\n\n- Generate 5–10 variations, then pick the strongest 2–3\n- Reuse the same idea across channels with small edits\n`,
  connections: `## Overview\n\nConnections is where you link external tools and social accounts so the app can publish and schedule content on your behalf.\n\n## How to use it\n\n1. **Connect an account**\n   - Follow the authorization flow for the provider\n2. **Verify permissions**\n   - Ensure the account has rights to publish where you need (page/workspace)\n3. **Test the workflow**\n   - Create a draft post and confirm it can be scheduled/published\n\n## Best practices\n\n- Use a shared brand account (not a personal account) where possible\n- Reconnect if tokens expire or permissions change\n`,
  social_scheduler: `## Overview\n\nSocial Scheduler helps you plan, schedule, and publish posts consistently.\n\n## How to use it\n\n1. **Prepare posts**\n   - Generate a few Social Posts first\n2. **Schedule your cadence**\n   - Pick a realistic schedule (e.g., 3x/week)\n3. **Review before publishing**\n   - Ensure links, tags, and formatting look correct\n4. **Track and iterate**\n   - Review performance externally and adjust your topics and messaging\n\n## Best practices\n\n- Schedule in batches to save time\n- Reuse high-performing angles with new examples\n`,
};

export default function ProjectOverviewPage({ id }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [agentStatusError, setAgentStatusError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedProject } = useSelection();
  const [selectedItemKey, setSelectedItemKey] = useState("knowledge_base");

  // Track feature usage
  useFeatureTracking("Project Overview", {
    feature_category: "project_management",
    page_section: "overview",
    project_id: id || selectedProject?.id,
  });

  const projectId = id ? id : selectedProject?.id;

  const overviewSections = [
    {
      section: "INTELLIGENCE & RESEARCH",
      items: [
        {
          key: "knowledge_base",
          completionKeys: [
            "company_research_agent",
            "competitor_research_agent",
          ],
          title: "Knowledge Base",
          description: "Upload sources and build the AI knowledge base.",
          path: "manage",
        },
        {
          key: "keywords",
          completionKeys: ["keyword_expansion", "keywords_add"],
          title: "Keyword Repository",
          description: "Discover, add, and manage your keyword universe.",
          path: "keywords",
        },
        {
          key: "search_ranking",
          completionKeys: ["search_ranking"],
          title: "Search Ranking",
          description: "See how companies rank across providers and queries.",
          path: "search-ranking",
        },
        {
          key: "competitor_analysis",
          completionKeys: ["competitor_research_agent"],
          title: "Competitor Analysis",
          description:
            "Compare competitor positioning, offers, and messaging insights.",
          path: "competitor-analysis",
        },
      ],
    },
    {
      section: "STRATEGY & PLANNING",
      items: [
        {
          key: "content_architecture",
          completionKeys: ["content_architect_agent"],
          title: "Content Architecture",
          description: "Generate structure and strategy for your site/content.",
          path: "content-architecture",
        },
        {
          key: "topics",
          completionKeys: ["topic_generation"],
          title: "Topics",
          description: "Generate topic ideas and organize your content plan.",
          path: "topic",
        },
        {
          key: "ai_optimization_questions",
          completionKeys: ["question_generation"],
          title: "AI Optimization Questions",
          description: "Generate questions to optimize for AI answers.",
          path: "ai-optimizations",
        },
      ],
    },
    {
      section: "CONTENT CREATION",
      items: [
        {
          key: "articles",
          completionKeys: ["article_generation"],
          title: "Articles",
          description: "Generate articles from topics and briefs.",
          path: "articles",
        },
        {
          key: "ai_optimization_answers",
          completionKeys: ["answer_generation"],
          title: "AI Optimization Answers",
          description: "Generate answers for your AI optimization questions.",
          path: "aio-answers",
        },
      ],
    },
    {
      section: "OPPORTUNITY & ENGAGEMENT",
      items: [
        {
          key: "opportunity_agent",
          completionKeys: ["opportunity_agent"],
          title: "Opportunity Agent",
          description: "Find market opportunities and engagement angles.",
          path: "opportunity-agent",
        },
      ],
    },
    {
      section: "PROMOTE",
      items: [
        {
          key: "social_posts",
          completionKeys: ["social_post"],
          title: "Social Posts",
          description: "Create social posts powered by your knowledge base.",
          path: "socials",
        },
        {
          key: "connections",
          completionKeys: ["connection"],
          title: "Connections",
          description: "Connect social accounts and integrations.",
          href: "/connections",
        },
        {
          key: "social_scheduler",
          completionKeys: ["social_scheduler"],
          title: "Social Scheduler",
          description: "Schedule and publish social posts.",
          href: "/social-scheduler",
        },
      ],
    },
  ];

  const overviewItems = overviewSections.flatMap((section) => section.items);

  useEffect(() => {
    console.log("ProjectOverviewPage projectId------->", projectId);

    if (!projectId) return;
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch project data
        const projectRes = await api.get(`/auth/projects/${projectId}/`);
        const projectData = projectRes.data;
        //console.log("ProjectOverviewPage projectData------->", projectData);
        setProject(projectData);

        // Fetch agent status data
        try {
          const agentStatusRes = await api.get(
            `/auth/projects/${projectId}/agent-status/`
          );
          setAgentStatus(agentStatusRes.data);
          setAgentStatusError(null);
        } catch (statusErr) {
          console.error("Error fetching agent status:", statusErr);
          setAgentStatus(null);
          setAgentStatusError(
            statusErr?.response?.data?.detail ||
              statusErr?.message ||
              "Failed to load agent status"
          );
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, selectedProject?.id]);

  const handleNavigation = ({ title, key, path, href }) => {
    const destination = href ? href : `/projects/${projectId}/${path}`;

    trackFeatureAction("overview_item_navigation", {
      action_type: "navigation",
      project_id: projectId,
      item_key: key,
      item_title: title,
      destination,
    });

    router.push(destination);
  };

  const handleSelectItem = (item) => {
    setSelectedItemKey(item.key);
    trackFeatureAction("overview_item_selected", {
      action_type: "selection",
      project_id: projectId,
      item_key: item.key,
      item_title: item.title,
    });
  };

  if (loading) {
    // Skeleton UI placeholders
    return (
      <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <Skeleton variant="text" width={110} height={18} />
              <Skeleton variant="text" width="40%" height={30} />
              <Skeleton variant="text" width="30%" height={20} />
            </div>
            <div className="shrink-0 text-right">
              <Skeleton variant="text" width={110} height={24} />
              <Skeleton variant="text" width={180} height={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 h-[calc(100vh-220px)] min-h-0 flex flex-col">
            <div className="px-2 pt-2 pb-3 shrink-0">
              <Skeleton variant="text" width={90} height={22} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-auto -mx-4 px-4 pb-4 space-y-2">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Skeleton variant="text" width="70%" height={18} />
                      </div>
                      <div className="shrink-0">
                        <Skeleton
                          variant="rectangular"
                          width={72}
                          height={28}
                          sx={{ borderRadius: 8 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 h-[calc(100vh-220px)] min-h-0 flex flex-col">
            <div className="shrink-0">
              <Skeleton variant="text" width={70} height={16} />
              <Skeleton variant="text" width="45%" height={36} />
              <Skeleton variant="text" width="60%" height={20} />
            </div>

            <div className="mt-6 flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-auto -mx-6 px-6 pb-6">
                <div className="space-y-2">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      variant="text"
                      width={
                        idx % 4 === 0
                          ? "85%"
                          : idx % 4 === 1
                          ? "92%"
                          : idx % 4 === 2
                          ? "78%"
                          : "88%"
                      }
                      height={18}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!project)
    return <div className="p-4 text-red-500">Project not found</div>;

  const getIsItemExplored = (item) => {
    if (!agentStatus) return false;
    const keys = Array.isArray(item?.completionKeys)
      ? item.completionKeys
      : item?.key
      ? [item.key]
      : [];

    return keys.some((k) => !!agentStatus?.[k]);
  };

  const completedCount = overviewItems.reduce((acc, item) => {
    return getIsItemExplored(item) ? acc + 1 : acc;
  }, 0);

  const totalCount = overviewItems.length;

  const selectedItem =
    overviewItems.find((item) => item.key === selectedItemKey) ||
    overviewItems[0];
  const selectedDetailsMd =
    (selectedItem && ITEM_DETAILS_MD[selectedItem.key]) ||
    "## Info\n\nSelect a feature to see details.";
  const selectedIsExplored = selectedItem
    ? getIsItemExplored(selectedItem)
    : false;

  return (
    <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-gray-500 text-xs font-semibold tracking-wider uppercase">
              Overview
            </div>
            <h1 className="text-gray-900 text-lg font-semibold mt-1">
              Project Overview
            </h1>
            <div className="text-gray-600 text-sm mt-1">
              {project.project_name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-900 text-sm font-semibold">
              {completedCount}/{totalCount} explored
            </div>
            <div className="text-xs mt-1">
              {agentStatusError ? (
                <span className="text-amber-700">
                  Status unavailable: {agentStatusError}
                </span>
              ) : (
                <span className="text-gray-500">Based on agent status</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LHS - Features List */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 h-[calc(100vh-220px)] min-h-0 flex flex-col">
          <div className="px-2 pt-2 pb-3 shrink-0">
            <div className="text-gray-900 font-semibold">Features</div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto -mx-4 px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {overviewSections.map((section) => (
                <div key={section.section}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {section.section}
                  </div>
                  <div className="space-y-1.5 mt-1 ml-2">
                    {section.items.map((item) => {
                      const explored = getIsItemExplored(item);
                      const isSelected = item.key === selectedItemKey;

                      return (
                        <div
                          key={item.key}
                          onClick={() => handleSelectItem(item)}
                          className={`group border rounded-lg p-3 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15 shadow-sm"
                              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-sm font-medium ${
                                  explored
                                    ? "text-gray-400 line-through"
                                    : "text-gray-900"
                                }`}
                              >
                                {item.title}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  explored
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-gray-50 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {explored ? "Explored" : "Explore"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RHS - Feature Description */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 h-[calc(100vh-220px)] min-h-0 flex flex-col">
          <div className="flex items-start justify-between gap-4 shrink-0">
            <div className="flex-1">
              <div className="text-gray-900 text-xl font-semibold mt-1">
                {selectedItem?.title || ""}
              </div>
              <div className="text-gray-600 text-sm mt-1">
                {selectedItem?.description || ""}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedIsExplored
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-50 text-gray-600 border border-gray-200"
                }`}
              >
                {selectedIsExplored ? "Explored" : "Explore"}
              </span>
              <button
                type="button"
                onClick={() => handleNavigation(selectedItem)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                View
              </button>
            </div>
          </div>

          <div className="mt-6 flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-auto -mx-6 px-6 pb-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-gray-900 text-sm font-semibold mt-4">
                      {children}
                    </h2>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 text-sm leading-6">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="leading-6">{children}</li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-800 text-xs">
                      {children}
                    </code>
                  ),
                }}
              >
                {selectedDetailsMd}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
