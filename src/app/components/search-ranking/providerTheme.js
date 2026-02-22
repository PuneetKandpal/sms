export const PROVIDER_META = {
  claude: {
    label: "Claude",
    color: "#FF6B4A",
    gradient: ["#FF6B4A", "#FF934D"],
    chipBg: "rgba(255, 107, 74, 0.18)",
    chipText: "#C2410C",
    icon: "/providers-icons/claude.png",
  },
  openai: {
    label: "OpenAI",
    color: "#00A67E",
    gradient: ["#00A67E", "#0E7C6B"],
    chipBg: "rgba(0, 166, 126, 0.18)",
    chipText: "#0F766E",
    icon: "/providers-icons/openai.png",
  },
  gemini: {
    label: "Gemini",
    color: "#3369FF",
    gradient: ["#3369FF", "#4C8CFF"],
    chipBg: "rgba(51, 105, 255, 0.18)",
    chipText: "#1D4ED8",
    icon: "/providers-icons/gemini.png",
  },
  perplexity: {
    label: "Perplexity",
    color: "#FFB000",
    gradient: ["#FFB000", "#E99900"],
    chipBg: "rgba(255, 176, 0, 0.2)",
    chipText: "#9A6700",
    icon: "/providers-icons/preplexity.png",
  },
  grok: {
    label: "Grok",
    color: "#FF4B8C",
    gradient: ["#FF4B8C", "#FF7AA2"],
    chipBg: "rgba(255, 75, 140, 0.2)",
    chipText: "#BE185D",
    icon: "/providers-icons/grok.png",
  },
};

const DEFAULT_COLOR = "#6366F1";
const DEFAULT_GRADIENT = ["#6366F1", "#4C1D95"];

const ensureGradient = (meta) => {
  if (!meta) return DEFAULT_GRADIENT;
  const gradient = meta.gradient;
  if (Array.isArray(gradient) && gradient.length >= 2) {
    return gradient;
  }
  const fallbackColor = meta.color || DEFAULT_COLOR;
  return [fallbackColor, fallbackColor];
};

export const PROVIDER_KEYS = Object.keys(PROVIDER_META);

const PROVIDER_ALIAS_MAP = PROVIDER_KEYS.reduce((accumulator, key) => {
  const meta = PROVIDER_META[key];
  const canonical = key.toLowerCase();
  accumulator[canonical] = key;
  accumulator[key] = key;
  if (meta?.label) {
    accumulator[meta.label.toLowerCase()] = key;
  }
  return accumulator;
}, {});

export const PROVIDER_COLORS = PROVIDER_KEYS.reduce((acc, key) => {
  acc[key] = PROVIDER_META[key].color || DEFAULT_COLOR;
  return acc;
}, {});

export const PROVIDER_GRADIENT_COLORS = PROVIDER_KEYS.reduce((acc, key) => {
  acc[key] = ensureGradient(PROVIDER_META[key]);
  return acc;
}, {});

export const PROVIDER_ICON_PATHS = PROVIDER_KEYS.reduce((acc, key) => {
  acc[key] = PROVIDER_META[key].icon;
  return acc;
}, {});

const DEFAULT_PROVIDER_INFO = {
  key: null,
  label: "Provider",
  color: DEFAULT_COLOR,
  gradient: DEFAULT_GRADIENT,
  chipStyles: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    color: "#4338CA",
  },
  icon: null,
};

export const getProviderKey = (value) => {
  if (!value) return null;
  const normalized = `${value}`.trim().toLowerCase();
  return PROVIDER_ALIAS_MAP[normalized] || null;
};

export const getProviderMeta = (value) => {
  const key = getProviderKey(value);
  return key ? PROVIDER_META[key] : null;
};

export const getProviderInfo = (value) => {
  const key = getProviderKey(value);
  const meta = key ? PROVIDER_META[key] : null;

  if (!meta) {
    const rawLabel = value ? `${value}`.trim() : "";
    return {
      ...DEFAULT_PROVIDER_INFO,
      key,
      label:
        rawLabel.length > 0
          ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
          : DEFAULT_PROVIDER_INFO.label,
    };
  }

  return {
    key,
    label: meta.label,
    color: meta.color || DEFAULT_COLOR,
    gradient: ensureGradient(meta),
    chipStyles: {
      backgroundColor: meta.chipBg,
      color: meta.chipText,
    },
    icon: meta.icon,
  };
};

export const getProviderChipStyles = (provider) =>
  getProviderInfo(provider).chipStyles;

export const getProviderLabel = (provider) => getProviderInfo(provider).label;

export const getProviderIconPath = (provider) => getProviderInfo(provider).icon;

export const getProviderGradient = (provider) =>
  getProviderInfo(provider).gradient;
