// Pillar Tree Structure Data
const pillarTreeData = {
    pillars: [
        {
            id: "discover",
            name: "Discover Pillar",
            expanded: true,
            nodes: [
                {
                    id: "problem-id",
                    name: "Problem Identification",
                    expanded: true,
                    subNodes: [
                        {
                            id: "market-research",
                            name: "Market Research Methods",
                            expanded: false,
                            content: [
                                { id: "blog-post-1", title: "Market Research Blog Post", status: "published" },
                                { id: "video-1", title: "Problem Discovery Video", status: "ready" }
                            ]
                        },
                        {
                            id: "customer-interviews",
                            name: "Customer Interviews",
                            expanded: false,
                            content: []
                        }
                    ]
                },
                {
                    id: "education",
                    name: "Educational Foundation",
                    expanded: false,
                    subNodes: [],
                    content: []
                }
            ]
        },
        {
            id: "evaluate",
            name: "Evaluate Pillar",
            expanded: false,
            nodes: []
        },
        {
            id: "decide",
            name: "Decide Pillar",
            expanded: false,
            nodes: []
        },
        {
            id: "succeed",
            name: "Succeed Pillar",
            expanded: false,
            nodes: []
        },
        {
            id: "evidence",
            name: "Evidence Pillar",
            expanded: false,
            nodes: []
        }
    ]
};

// Detail Panel Content Data
const detailPanelData = {
    content: {
        contentTitle: "Market Research Blog Post",
        description: "Comprehensive blog post covering market research methodologies and best practices for identifying customer problems.",
        pageTemplate: "SR-TH: Clustered Topic Hub",
        targetAudience: "Marketing professionals, Product managers",
        wordCount: 2500
    },
    seo: {
        primaryKeyword: "market research methods",
        secondaryKeywords: ["customer research", "market analysis", "user research techniques"],
        metaTitle: "Complete Guide to Market Research Methods | TechCorp",
        metaDescription: "Learn proven market research methods to identify customer problems and validate product ideas. Complete guide with templates and examples."
    },
    links: {
        internal: [
            { type: "Prerequisite", title: "Introduction to Market Research", note: "Users should read this first" },
            { type: "Supporting", title: "Customer Interview Templates", note: "Related reading" }
        ],
        external: [
            { type: "Source", title: "Industry Research Report 2024", url: "https://example.com/research-report" }
        ]
    },
    generation: {
        agent: "Blog Writer Agent",
        contentBrief: "Create a comprehensive blog post about market research methods. Include practical examples, templates, and actionable tips. Target audience: marketing professionals with 2-5 years experience.",
        brandGuidelines: "Professional but approachable tone. Use data-driven insights. Include real examples. Avoid jargon. Write in active voice."
    },
    publishing: {
        status: "Published",
        url: "https://techcorp.com/blog/market-research-methods",
        publicationDate: "2024-01-15",
        channels: {
            websiteBlog: true,
            linkedin: true,
            twitter: false,
            newsletter: false
        }
    },
    analytics: {
        pageViews: "12,450",
        conversionRate: "4.2%",
        avgTime: "3:45",
        keywordRanking: "#3",
        seoPerformance: [
            { keyword: "market research methods", position: "#3" },
            { keyword: "customer research", position: "#7" },
            { keyword: "market analysis", position: "#12" }
        ],
        recommendations: [
            "Add more internal links to related content",
            "Update meta description to improve CTR",
            "Add FAQ section for featured snippets"
        ]
    }
};
