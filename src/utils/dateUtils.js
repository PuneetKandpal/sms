/**
 * Centralized Date Utility Functions
 *
 * IMPORTANT: All dates from the server are assumed to be in UTC (without timezone info).
 * These utilities properly convert UTC dates to local time for display.
 */

/**
 * Parses a date string from the server (assumed UTC) and returns a Date object
 * @param {string|number|Date} dateValue - Date string, timestamp, or Date object from server
 * @returns {Date|null} - Date object or null if invalid
 */
export function parseUTCDate(dateValue) {
  if (!dateValue) return null;

  try {
    // If already a Date object, return it
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    // If it's a Unix timestamp (number)
    if (typeof dateValue === "number") {
      const date = new Date(dateValue * 1000);
      return isNaN(date.getTime()) ? null : date;
    }

    // If it's a string
    if (typeof dateValue === "string") {
      // Check if the date string already has timezone info (Z or +/- offset)
      const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateValue);

      if (hasTimezone) {
        // Already has timezone, parse as-is
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      }

      // No timezone info - treat as UTC by appending 'Z'
      const utcString = dateValue.trim().replace(" ", "T");
      const dateWithZ = utcString.includes("T")
        ? `${utcString}Z`
        : `${utcString}T00:00:00Z`;
      const date = new Date(dateWithZ);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

/**
 * Formats a UTC date to local date string
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string or fallback
 */
export function formatLocalDate(dateValue, options = {}) {
  const date = parseUTCDate(dateValue);
  if (!date) return "-";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(undefined, defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
}

/**
 * Formats a UTC date to local date and time string
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date-time string or fallback
 */
export function formatLocalDateTime(dateValue, options = {}) {
  const date = parseUTCDate(dateValue);
  if (!date) return "-";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(undefined, defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date-time:", error);
    return "-";
  }
}

/**
 * Formats a UTC date to local time string only
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time string or fallback
 */
export function formatLocalTime(dateValue, options = {}) {
  const date = parseUTCDate(dateValue);
  if (!date) return "-";

  const defaultOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(undefined, defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting time:", error);
    return "-";
  }
}

/**
 * Formats a UTC date to local date string (long format)
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @returns {string} - Formatted date string in long format
 */
export function formatLocalDateLong(dateValue) {
  return formatLocalDate(dateValue, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a UTC date to local date string (medium format with time)
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @returns {string} - Formatted date-time string
 */
export function formatLocalDateTimeMedium(dateValue) {
  return formatLocalDateTime(dateValue, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a UTC date for chart labels (medium format with optional time)
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @param {Object} config - Configuration options
 * @returns {string|null} - Formatted date string or null
 */
export function formatLocalDateLabel(dateValue, { includeTime = true } = {}) {
  const date = parseUTCDate(dateValue);
  if (!date) return null;

  try {
    const options = includeTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" };

    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch (error) {
    console.error("Error formatting date label:", error);
    return null;
  }
}

/**
 * Converts a local Date object to UTC ISO string for API submission
 * @param {Date} date - Local date object
 * @returns {string} - UTC ISO string without Z suffix (server format)
 */
export function toUTCString(date) {
  if (!date || !(date instanceof Date)) return null;

  try {
    // Get UTC ISO string and remove the 'Z' suffix
    return date.toISOString().replace("Z", "");
  } catch (error) {
    console.error("Error converting to UTC string:", error);
    return null;
  }
}

/**
 * Gets a relative time string (e.g., "2 hours ago")
 * @param {string|number|Date} dateValue - Date from server (assumed UTC)
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(dateValue) {
  const date = parseUTCDate(dateValue);
  if (!date) return "-";

  try {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    if (diffHour < 24)
      return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

    return formatLocalDate(dateValue);
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "-";
  }
}

/**
 * Format number with locale-specific thousands separators
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return "-";
  return num.toLocaleString();
}
