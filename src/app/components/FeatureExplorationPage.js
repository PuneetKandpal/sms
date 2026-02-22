"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelection } from "../context/SelectionContext";
import { useFeatureExploration } from "../context/FeatureExplorationContext";
import useTrackFeatureExploration from "../hooks/useTrackFeatureExploration";
import { Skeleton } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FEATURE_EXPLORATION_SECTIONS } from "../constants/featureExploration";

const ITEM_DETAILS_MD = {
  knowledge_base: `## Overview\n\nYour Knowledge Base is the foundation for everything else in the product. Add your company materials here so the AI can generate outputs that stay on-brand and grounded in facts.\n\n## How to use it (recommended flow)\n\n1. **Add high-signal sources first**\n   - Your website / landing pages\n   - Pitch deck, product one-pagers\n   - Pricing, positioning, competitor notes\n2. **Organize sources**\n   - Group by topic (product, ICP, differentiators, case studies, etc.)\n   - Keep sources clean and up-to-date (remove outdated docs)\n3. **Run research / enrichment (if available)**\n   - Start research tasks to expand the knowledge base with structured insights\n4. **Validate the knowledge base**\n   - Spot-check key facts (names, offerings, claims)\n   - Ensure the core messaging matches what you want to publish\n\n## What you get\n\n- A single source of truth used by Keywords, Topics, Articles, AI Optimizations, and Social content\n- Faster, more consistent generation results\n\n## Best practices\n\n- Keep sources focused: fewer, higher-quality sources beats many noisy ones\n- Refresh sources whenever your positioning changes\n- If a generation result looks off, update sources first before regenerating\n`,
  keywords: `## Overview\n\nUse Keyword Repository to build and manage your keyword universe. This helps you plan content and measure visibility across search/AI surfaces.\n\n## How to use it\n\n1. **Generate expansions**\n   - Start with a few seed topics (product categories, problems, use-cases)\n   - Generate variations and long-tail keywords\n2. **Curate and clean**\n   - Remove duplicates and irrelevant queries\n   - Keep keywords aligned to your ICP and offerings\n3. **Organize into clusters**\n   - Group keywords by intent (awareness, consideration, decision)\n   - Create clusters that can map to a single page or article\n4. **Use keywords downstream**\n   - Feed clusters into Topics and Content Architecture\n   - Use a short list of priority keywords for Search Ranking checks\n\n## Output you should aim for\n\n- A curated set of keywords + clusters you can turn into pages and articles\n\n## Tips\n\n- Start broad, then narrow to your highest-converting intents\n- Re-run after updating the Knowledge Base or adding new products\n`,
  competitor_analysis: `## Overview\n\nCompetitor Analysis helps you evaluate how rival companies position themselves, what messaging they use, and how their offers compare to yours.\n\n## How to use it\n\n1. **Start a competitor scan**\n   - Provide a competitor URL or select one from your saved list\n   - Let the agent gather positioning, offers, and proof points\n2. **Compare positioning**\n   - Review differentiators, gaps, and pricing signals\n3. **Turn insights into action**\n   - Feed findings into Topics, Content Architecture, or Search Ranking runs\n\n## Tips\n\n- Re-run the analysis whenever a major competitor updates their site/product\n- Capture 2–3 direct competitors plus an aspirational benchmark\n- Pair results with your Knowledge Base to align messaging updates\n`,
  search_ranking: `## Overview\n\nSearch Ranking helps you understand visibility by query across providers and track how you (and competitors) perform over time.\n\n## How to use it\n\n1. **Pick a focused keyword set**\n   - Choose 10–30 priority queries from your Keyword Repository\n2. **Run a ranking check**\n   - Submit a new query run (or select a previous run)\n   - Wait for tasks to complete and then refresh results\n3. **Interpret results**\n   - Identify where you are missing from the top results\n   - Compare providers and competitor performance for the same query\n4. **Turn insights into actions**\n   - Convert gaps into new Topics / Articles\n   - Update Content Architecture to cover missing intent clusters\n\n## Best practices\n\n- Re-run your priority queries after publishing new content\n- Use consistent query sets to see trend changes more clearly\n- Treat ranking dips as signals to refresh pages and improve topical coverage\n`,
  content_architecture: `## Overview\n\nContent Architecture helps you design a structured blueprint of pages and topics so your site covers the right intents and is easy to expand over time.\n\n## How to use it\n\n1. **Generate an initial blueprint**\n   - Use your curated keywords and top topics as input\n2. **Review page structure**\n   - Check if each page has a clear purpose and target intent\n   - Merge pages that overlap and split pages that are too broad\n3. **Prioritize pages**\n   - Identify high-impact pages (money pages + supporting content)\n4. **Create a production plan**\n   - Turn prioritized pages into Topics and Articles\n   - Track progress as you publish and iterate\n\n## What good looks like\n\n- Clear page hierarchy (core pages, supporting pages, FAQs)\n- Each page maps to a keyword cluster and a user intent\n\n## Tips\n\n- Keep the first blueprint simple; iterate once you see ranking results\n- Use it as your long-term plan, not a one-time output\n`,
  topics: `## Overview\n\nTopics helps you build a prioritized list of content ideas based on your product, audience, and keyword strategy.\n\n## How to use it\n\n1. **Choose your direction**\n   - Start from keyword clusters (best) or from a product/category theme\n2. **Generate topics**\n   - Generate a batch, then scan for relevance and uniqueness\n3. **Curate and prioritize**\n   - Keep topics that match your ICP and business goals\n   - Prioritize by intent (commercial > informational)\n4. **Turn topics into production**\n   - Move the best topics into Articles\n   - Use the topic list as your publishing backlog\n\n## Best practices\n\n- Prefer topics that clearly map to a keyword cluster\n- Mix content types (how-to, comparison, use-cases, FAQs)\n- Re-run after adding new sources to the Knowledge Base\n`,
  ai_optimizations: `## Overview\n\nAI Optimization Questions helps you generate the exact questions your audience asks so you can structure content to win visibility in AI answers and rich result surfaces.\n\n## How to use it\n\n1. **Pick a focus area**\n   - Choose a product, feature, or keyword cluster\n2. **Generate question sets**\n   - Generate questions across multiple intents (what/why/how/best/compare)\n3. **Review and clean**\n   - Remove duplicates and overly generic questions\n   - Keep questions that match your real audience language\n4. **Group questions by page**\n   - Assign question groups to a landing page or an article\n\n## Output you should aim for\n\n- A clean, grouped list of questions that can become a FAQ section or a dedicated Q&A page\n\n## Tips\n\n- If questions feel off, improve the Knowledge Base and regenerate\n- Aim for specificity (industry, use-case, constraints)\n`,
  aio_answers: `## Overview\n\nAI Optimization Answers turns your best questions into concise, reusable answers that you can place on pages (FAQs, feature pages, docs) to improve AI and search visibility.\n\n## How to use it\n\n1. **Select a question set**\n   - Start with the highest-intent questions\n2. **Generate answers**\n   - Generate answers in batches\n3. **Validate and edit**\n   - Ensure claims match your sources and product reality\n   - Tighten answers to be direct and structured\n4. **Publish and reuse**\n   - Add answers to landing pages, articles, or documentation\n   - Reuse high-quality answers across multiple channels\n\n## Best practices\n\n- Prefer short, direct answers (then add optional detail below)\n- Keep wording consistent with your positioning\n- If the answer requires citations/accuracy, update sources first\n`,
  articles: `## Overview\n\nArticles helps you generate long-form content from your topics and knowledge base. Use it to draft, iterate, and publish consistently.\n\n## How to use it\n\n1. **Pick a topic**\n   - Choose a topic tied to a keyword cluster and clear intent\n2. **Generate a draft**\n   - Start with an outline-first approach if available\n3. **Edit for quality**\n   - Add examples, screenshots, data, and product-specific detail\n   - Ensure tone and positioning match your brand\n4. **Publish + measure**\n   - Publish the article and track ranking/visibility changes\n   - Update older articles based on new ranking insights\n\n## Best practices\n\n- Start with 3–5 high-impact topics and publish consistently\n- Avoid generic content: add product and audience specificity\n- Re-run Search Ranking checks after publishing\n`,
  opportunity_agent: `## Overview\n\nOpportunity Agent helps you find growth opportunities and generate a clear engagement strategy based on your market and company context.\n\n## How to use it\n\n1. **Run the agent**\n   - Ensure your Knowledge Base has enough context first\n2. **Review the opportunities**\n   - Look for high-signal opportunities aligned to your product and ICP\n3. **Select an opportunity**\n   - Choose the ones with clear messaging angles and reachable audience\n4. **Generate an engagement strategy**\n   - Use the strategy as input for Topics, Articles, and Social Posts\n\n## Best practices\n\n- Re-run after major product updates or new research\n- Treat outputs as a starting point; validate with your team\n`,
  socials: `## Overview\n\nSocial Posts helps you create short-form content variations that stay aligned to your brand messaging and reuse your best knowledge and article insights.\n\n## How to use it\n\n1. **Pick a source**\n   - Start from a published article, a key topic, or a feature message\n2. **Generate variations**\n   - Generate multiple angles (tips, myth vs fact, mini-story, CTA)\n3. **Edit for voice and clarity**\n   - Keep posts simple and specific\n   - Add a strong hook and a clear call-to-action\n4. **Publish or schedule**\n   - Use Social Scheduler to plan a consistent cadence\n\n## Best practices\n\n- Generate 5–10 variations, then pick the strongest 2–3\n- Reuse the same idea across channels with small edits\n`,
  connections: `## Overview\n\nConnections is where you link external tools and social accounts so the app can publish and schedule content on your behalf.\n\n## How to use it\n\n1. **Connect an account**\n   - Follow the authorization flow for the provider\n2. **Verify permissions**\n   - Ensure the account has rights to publish where you need (page/workspace)\n3. **Test the workflow**\n   - Create a draft post and confirm it can be scheduled/published\n\n## Best practices\n\n- Use a shared brand account (not a personal account) where possible\n- Reconnect if tokens expire or permissions change\n`,
  social_scheduler: `## Overview\n\nSocial Scheduler helps you plan, schedule, and publish posts consistently.\n\n## How to use it\n\n1. **Prepare posts**\n   - Generate a few Social Posts first\n2. **Schedule your cadence**\n   - Pick a realistic schedule (e.g., 3x/week)\n3. **Review before publishing**\n   - Ensure links, tags, and formatting look correct\n4. **Track and iterate**\n   - Review performance externally and adjust your topics and messaging\n\n## Best practices\n\n- Schedule in batches to save time\n- Reuse high-performing angles with new examples\n`,
};

export default function FeatureExplorationPage() {
  const router = useRouter();
  const { selectedProject } = useSelection();
  const { featureLog, isLoading, fetchFeatureLog } = useFeatureExploration();
  const [selectedItemKey, setSelectedItemKey] = useState("knowledge_base");

  useTrackFeatureExploration("overview");

  const explorationSections = FEATURE_EXPLORATION_SECTIONS;

  const explorationItems = explorationSections.flatMap(
    (section) => section.items
  );

  useEffect(() => {
    fetchFeatureLog();
  }, [fetchFeatureLog]);

  const getIsItemExplored = (item) => {
    if (!featureLog || !featureLog.children) return false;
    return !!featureLog.children[item.key]?.isExp;
  };

  const getUnexploredItems = () => {
    return explorationItems.filter((item) => !getIsItemExplored(item));
  };

  const completedCount = explorationItems.reduce((acc, item) => {
    return getIsItemExplored(item) ? acc + 1 : acc;
  }, 0);

  const totalCount = explorationItems.length;
  const unexploredItems = getUnexploredItems();

  const handleNavigation = ({ title, key, path, href }) => {
    if (!selectedProject?.id && !href) {
      alert("Please select a project first from the projects page.");
      router.push("/");
      return;
    }

    const destination = href ? href : `/projects/${selectedProject.id}/${path}`;
    router.push(destination);
  };

  const handleSelectItem = (item) => {
    setSelectedItemKey(item.key);
  };

  const selectedItem =
    explorationItems.find((item) => item.key === selectedItemKey) ||
    explorationItems[0];
  const selectedDetailsMd =
    (selectedItem && ITEM_DETAILS_MD[selectedItem.key]) ||
    "## Info\n\nSelect a feature to see details.";
  const selectedIsExplored = selectedItem
    ? getIsItemExplored(selectedItem)
    : false;

  if (isLoading) {
    return (
      <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton variant="text" width={110} height={18} />
              <Skeleton variant="text" width="40%" height={30} />
            </div>
            <div className="shrink-0 text-right">
              <Skeleton variant="text" width={110} height={24} />
              <Skeleton variant="text" width={180} height={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 h-[calc(100vh-220px)]">
            <Skeleton variant="text" width={90} height={22} />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 10 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  variant="rectangular"
                  height={60}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 h-[calc(100vh-220px)]">
            <Skeleton variant="text" width="70%" height={36} />
            <Skeleton variant="text" width="50%" height={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-gray-500 text-xs font-semibold tracking-wider uppercase">
              Exploration
            </div>
            <h1 className="text-gray-900 text-lg font-semibold mt-1">
              Feature Exploration
            </h1>
            <div className="text-gray-600 text-sm mt-1">
              Track your journey through the platform
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-900 text-sm font-semibold">
              {completedCount}/{totalCount} explored
            </div>
            <div className="text-xs mt-1 text-gray-500">
              {unexploredItems.length} features to discover
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
              {explorationSections.map((section) => (
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
