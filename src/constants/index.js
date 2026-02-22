// Constants and data structures for Social Post Agent

export const PLATFORMS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    label: "LinkedIn",
    icon: "in",
    color: "#0077B5",
  },
  {
    id: "x",
    name: "X",
    label: "X",
    icon: "𝕏",
    color: "#000000",
  },
  {
    id: "facebook",
    name: "Facebook",
    label: "Facebook",
    icon: "f",
    color: "#1877F2",
  },
  {
    id: "instagram",
    name: "Instagram",
    label: "Instagram",
    icon: "📷",
    color: "#E4405F",
  },
  {
    id: "tiktok",
    name: "TikTok",
    label: "TikTok",
    icon: "♪",
    color: "#010101",
  },
  {
    id: "youtube",
    name: "YouTube",
    label: "YouTube",
    icon: "▶️",
    color: "#FF0000",
  },
];

export const INTENTS = [
  { id: "promote", label: "Promote" },
  { id: "educate", label: "Educate" },
  { id: "announce", label: "Announce" },
  { id: "launch", label: "Launch" },
  { id: "nurture", label: "Nurture" },
  { id: "engage", label: "Engage" },
];

export const KPIS = [
  { id: "ctr", label: "CTR" },
  { id: "engagement", label: "Engagement Rate" },
  { id: "reach", label: "Reach" },
  { id: "impressions", label: "Impressions" },
  { id: "conversions", label: "Conversions" },
  { id: "shares", label: "Shares" },
  { id: "comments", label: "Comments" },
  { id: "saves", label: "Saves" },
  { id: "leads", label: "Lead Generation" },
];

export const CHARACTER_LIMITS = {
  linkedin: 3000,
  x: 280,
  facebook: 63206,
  reddit: 40000,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
};

export const CONTENT_PATTERNS = [
  "Pain → Promise → Proof",
  "Stat → Insight → CTA",
  "Story → Lesson → Invite",
];

export const VISUAL_FORMATS = [
  "All",
  "Carousel",
  "Single Image",
  "Infographic",
  "Video Thumbnail",
  "Quote Card",
];

// Default form data structure
export const DEFAULT_FORM_DATA = {
  sourceUrl: "",
  rawText: "",
  destinationUrl: "",
  campaignId: "",
  campaignName: "", // Keep for UI display purposes
  taskName: "",
  intent: "Promote",
  kpi: "CTR",
  selectedPlatform: "linkedin",
  brandSettings: { emoji: false },
};

// Default UTM parameters
export const DEFAULT_UTM_PARAMS = {
  source: "social_media",
  medium: "organic_post",
  campaign: "brand_awareness_q4",
};

// Default mobile preview settings
export const DEFAULT_MOBILE_PREVIEW = {
  darkMode: false,
  overlayBg: "#000000",
  textColor: "#ffffff",
  showAsset: true,
};
