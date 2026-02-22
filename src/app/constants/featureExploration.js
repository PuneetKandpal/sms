export const FEATURE_EXPLORATION_SECTIONS = [
  {
    section: "INTELLIGENCE & RESEARCH",
    items: [
      {
        key: "knowledge_base",
        title: "School Knowledge Base",
        description: "Upload sources and build your school's AI knowledge base.",
        path: "manage",
      },
      {
        key: "keywords",
        title: "Enrollment Keywords",
        description: "Discover, add, and manage keywords for your prospective families.",
        path: "keywords",
      },
      {
        key: "competitor_analysis",
        title: "Other Schools Analysis",
        description:
          "Compare other schools' positioning, programs, and messaging insights.",
        path: "competitor-analysis",
      },
    ],
  },
  {
    section: "STRATEGY & PLANNING",
    items: [
      {
        key: "content_architecture",
        title: "Content Architecture AI",
        description: "Generate structure and strategy for your school's website and content.",
        path: "content-architecture",
      },
      {
        key: "ai_optimizations",
        title: "Topics",
        description: "Generate topic ideas and organize your content plan.",
        path: "ai-optimizations",
      },
    ],
  },
  {
    section: "CONTENT CREATION",
    items: [
      {
        key: "aio_answers",
        title: "Articles",
        description: "Generate articles from topics and briefs.",
        path: "aio-answers",
      },
    ],
  },
  {
    section: "PROMOTE",
    items: [
      {
        key: "socials",
        title: "Social Posts",
        description: "Create social posts powered by your school's knowledge base.",
        path: "socials",
      },
      {
        key: "connections",
        title: "Connections",
        description: "Connect your school's social accounts and integrations.",
        href: "/connections",
      },
      {
        key: "social_scheduler",
        title: "Social Scheduler",
        description: "Schedule and publish social posts for your school.",
        href: "/social-scheduler",
      },
    ],
  },
];

export const FEATURE_EXPLORATION_ITEMS = FEATURE_EXPLORATION_SECTIONS.flatMap(
  (section) => section.items
);

export const TOTAL_FEATURE_COUNT = FEATURE_EXPLORATION_ITEMS.length;
