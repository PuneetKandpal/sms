export const FEATURE_EXPLORATION_SECTIONS = [
  {
    section: "INTELLIGENCE & RESEARCH",
    items: [
      {
        key: "knowledge_base",
        title: "Knowledge Base",
        description: "Upload sources and build the AI knowledge base.",
        path: "manage",
      },
      {
        key: "keywords",
        title: "Keyword Repository",
        description: "Discover, add, and manage your keyword universe.",
        path: "keywords",
      },
      {
        key: "search_ranking",
        title: "Search Ranking",
        description: "See how companies rank across providers and queries.",
        path: "search-ranking",
      },
      {
        key: "competitor_analysis",
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
        title: "Content Architecture",
        description: "Generate structure and strategy for your site/content.",
        path: "content-architecture",
      },
      {
        key: "topics",
        title: "Topics",
        description: "Generate topic ideas and organize your content plan.",
        path: "topic",
      },
      {
        key: "ai_optimizations",
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
        title: "Articles",
        description: "Generate articles from topics and briefs.",
        path: "articles",
      },
      {
        key: "aio_answers",
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
        key: "socials",
        title: "Social Posts",
        description: "Create social posts powered by your knowledge base.",
        path: "socials",
      },
      {
        key: "connections",
        title: "Connections",
        description: "Connect social accounts and integrations.",
        href: "/connections",
      },
      {
        key: "social_scheduler",
        title: "Social Scheduler",
        description: "Schedule and publish social posts.",
        href: "/social-scheduler",
      },
    ],
  },
];

export const FEATURE_EXPLORATION_ITEMS = FEATURE_EXPLORATION_SECTIONS.flatMap(
  (section) => section.items
);

export const TOTAL_FEATURE_COUNT = FEATURE_EXPLORATION_ITEMS.length;
