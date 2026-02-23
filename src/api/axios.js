import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { getCurrentEnvironment } from "../config/sentry.config.js";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://educationmarket-production.up.railway.app/";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Using JWT tokens instead of cookies
  timeout: 1000 * 60 * 5, // 5 minute timeout
});

// ---- SENTRY HELPERS ---- //
const { logger } = Sentry;

// Get current environment for context
const currentEnvironment = getCurrentEnvironment();

// Helper to get component information from call stack
const getComponentInfo = () => {
  try {
    const stack = new Error().stack;
    const stackLines = stack?.split("\n") || [];

    // Look for React component patterns in the stack
    for (let i = 0; i < stackLines.length; i++) {
      const line = stackLines[i];

      // Multiple patterns to catch different browser formats
      let match = null;

      // Chrome/Edge format: at functionName (file:line:column)
      match = line.match(/at\s+.*?\s+\((.+):(\d+):(\d+)\)/);
      if (!match) {
        // Firefox format: functionName@file:line:column
        match = line.match(/(.+)@(.+):(\d+):(\d+)/);
        if (match) {
          match = [match[0], match[2], match[3], match[4]]; // Reorder to match Chrome format
        }
      }
      if (!match) {
        // Safari/other formats: at file:line:column
        match = line.match(/at\s+(.+):(\d+):(\d+)/);
      }

      if (
        match &&
        (line.includes(".js") ||
          line.includes(".jsx") ||
          line.includes(".ts") ||
          line.includes(".tsx"))
      ) {
        const [, filePath, lineNumber, columnNumber] = match;
        const fileName =
          filePath.split("/").pop()?.split("\\").pop() || filePath;

        // Skip internal files
        if (
          fileName.includes("axios") ||
          fileName.includes("sentry") ||
          fileName.includes("node_modules")
        ) {
          continue;
        }

        return {
          fileName,
          filePath,
          lineNumber: parseInt(lineNumber),
          columnNumber: parseInt(columnNumber),
          stackTrace: stackLines.slice(0, 10).join("\n"), // More stack trace for debugging
          fullStack: stack,
        };
      }
    }

    // Fallback: return basic info if no match found
    return {
      fileName: "unknown",
      filePath: "unknown",
      lineNumber: 0,
      columnNumber: 0,
      stackTrace: stackLines.slice(0, 5).join("\n"),
      fullStack: stack,
    };
  } catch (error) {
    console.warn("Failed to extract component info from stack trace", error);
    return {
      fileName: "error_parsing_stack",
      filePath: "error_parsing_stack",
      lineNumber: 0,
      columnNumber: 0,
      stackTrace: "Error parsing stack trace",
      error: error.message,
    };
  }
};

// Helper to sanitize request data for logging
const sanitizeRequestData = (data) => {
  if (!data) return null;

  try {
    // Convert to string if it's an object
    const dataStr = typeof data === "string" ? data : JSON.stringify(data);

    // Remove sensitive information
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
    ];
    let sanitized = dataStr;

    sensitiveFields.forEach((field) => {
      const regex = new RegExp(`"${field}"\\s*:\\s*"[^"]*"`, "gi");
      sanitized = sanitized.replace(regex, `"${field}":"[REDACTED]"`);
    });

    return sanitized.length > 1000
      ? sanitized.substring(0, 1000) + "..."
      : sanitized;
  } catch (error) {
    return "[Unable to serialize request data]";
  }
};

// ---- TOKEN STORAGE HELPERS ---- //
let isRefreshing = false;
let failedQueue = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};

const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

const getRefreshToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token");
  }
  return null;
};

const setTokens = (accessToken, refreshToken) => {
  console.log("setTokens accessToken------->", accessToken);
  console.log("setTokens refreshToken------->", refreshToken);

  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

const setAccessToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
};

const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
  }
  refreshAttempts = 0;
};

// ---- REQUEST INTERCEPTOR ---- //
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    console.log("request token------->", token);
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Add Sentry span and metadata for request tracking
    const componentInfo = getComponentInfo();
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store metadata in config for later use
    config.metadata = {
      requestId,
      componentInfo,
      startTime: Date.now(),
      method: config.method?.toUpperCase() || "GET",
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      requestData: sanitizeRequestData(config.data),
      params: config.params,
    };

    // Log request start with environment context
    logger.info(
      logger.fmt`API Request Started: ${config.metadata.method} ${config.metadata.fullUrl}`,
      {
        requestId,
        method: config.metadata.method,
        url: config.metadata.fullUrl,
        params: config.params,
        requestData: config.metadata.requestData,
        componentInfo,
        environment: currentEnvironment,
        userAgent:
          typeof window !== "undefined"
            ? window.navigator?.userAgent
            : "Server",
      }
    );

    return config;
  },
  (error) => {
    // Capture request configuration errors
    const componentInfo = getComponentInfo();

    try {
      Sentry.captureException(error, {
        tags: {
          errorType: "axios_request_config_error",
          component: componentInfo?.fileName || "unknown",
          environment: currentEnvironment,
        },
        extra: {
          componentInfo,
          errorMessage: error.message,
          errorStack: error.stack,
          environment: currentEnvironment,
        },
      });
    } catch (sentryError) {
      console.warn("Failed to capture error in Sentry:", sentryError);
    }

    logger.error("API Request Configuration Error", {
      error: error.message,
      componentInfo,
      stack: error.stack,
    });

    return Promise.reject(error);
  }
);

// ---- RESPONSE INTERCEPTOR ---- //
api.interceptors.response.use(
  (response) => {
    // Log successful response
    const config = response.config;
    const metadata = config.metadata;

    if (metadata) {
      const duration = Date.now() - metadata.startTime;

      logger.info(
        logger.fmt`API Request Completed: ${metadata.method} ${metadata.fullUrl}`,
        {
          requestId: metadata.requestId,
          method: metadata.method,
          url: metadata.fullUrl,
          statusCode: response.status,
          duration,
          responseSize: JSON.stringify(response.data).length,
          componentInfo: metadata.componentInfo,
          environment: currentEnvironment,
        }
      );
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const metadata = originalRequest?.metadata;

    const isAuthEndpoint = (url) => {
      if (!url) return false;
      return (
        url.includes("/auth/login/") ||
        url.includes("/auth/refresh/") ||
        url.includes("/auth/register/")
      );
    };

    // Capture error details for Sentry
    const captureApiError = (err, errorType = "api_error") => {
      const duration = metadata ? Date.now() - metadata.startTime : null;
      const errorData = {
        requestId: metadata?.requestId,
        method: metadata?.method,
        url: metadata?.fullUrl,
        statusCode: err.response?.status,
        statusText: err.response?.statusText,
        duration,
        requestData: metadata?.requestData,
        params: metadata?.params,
        componentInfo: metadata?.componentInfo,
        responseData: err.response?.data
          ? sanitizeRequestData(err.response.data)
          : null,
        errorMessage: err.message,
        errorCode: err.code,
        userAgent:
          typeof window !== "undefined"
            ? window.navigator?.userAgent
            : "Server",
      };

      // Log error
      try {
        logger.error(
          logger.fmt`API Request Failed: ${metadata?.method || "UNKNOWN"} ${
            metadata?.fullUrl || "UNKNOWN"
          }`,
          errorData
        );
      } catch (logError) {
        console.warn("Failed to log error:", logError);
      }

      // Capture in Sentry with environment context
      try {
        Sentry.captureException(err, {
          tags: {
            errorType,
            component: metadata?.componentInfo?.fileName || "unknown",
            apiMethod: metadata?.method,
            statusCode: err.response?.status,
            environment: currentEnvironment,
          },
          extra: {
            ...errorData,
            environment: currentEnvironment,
          },
          contexts: {
            api_call: {
              request_id: metadata?.requestId,
              method: metadata?.method,
              url: metadata?.fullUrl,
              duration,
              status_code: err.response?.status,
              environment: currentEnvironment,
            },
          },
        });
      } catch (sentryError) {
        console.warn("Failed to capture error in Sentry:", sentryError);
      }
    };

    // if unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never attempt token refresh for auth endpoints
      if (isAuthEndpoint(originalRequest?.url)) {
        return Promise.reject(error);
      }

      // Log 401 error but don't capture as exception since it's expected behavior
      if (metadata) {
        const duration = Date.now() - metadata.startTime;
        logger.warn(
          logger.fmt`API Request Unauthorized: ${metadata.method} ${metadata.fullUrl}`,
          {
            requestId: metadata.requestId,
            method: metadata.method,
            url: metadata.fullUrl,
            statusCode: 401,
            duration,
            componentInfo: metadata.componentInfo,
            refreshAttempts,
          }
        );
      }

      const refreshToken = getRefreshToken();

      if (isRefreshing) {
        // queue requests while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            captureApiError(err, "token_refresh_queue_error");
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;

      if (!refreshToken || refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        const authError = new Error(
          `Authentication failed: ${
            !refreshToken ? "No refresh token" : "Max refresh attempts exceeded"
          }`
        );
        captureApiError(authError, "authentication_failure");

        processQueue(authError, null);
        isRefreshing = false;

        clearTokens();
        if (typeof window !== "undefined") {
          // Only redirect if not already on login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        refreshAttempts++;
        logger.info("Attempting token refresh", {
          refreshAttempts,
          requestId: metadata?.requestId,
          componentInfo: metadata?.componentInfo,
        });

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        setAccessToken(newAccessToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        logger.info("Token refresh successful", {
          requestId: metadata?.requestId,
          componentInfo: metadata?.componentInfo,
        });

        return api(originalRequest);
      } catch (err) {
        captureApiError(err, "token_refresh_error");
        processQueue(err, null);
        clearTokens();
        if (typeof window !== "undefined") {
          // Only redirect if not already on login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Capture all other API errors
    captureApiError(error, "api_request_error");
    return Promise.reject(error);
  }
);

// ---- ENHANCED API WRAPPER WITH SENTRY SPANS ---- //
// Wrapper function that creates Sentry spans for API calls
const apiWithSpan = {
  get: (url, config = {}) => {
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `GET ${url}`,
        attributes: {
          "http.method": "GET",
          "http.url": url,
          "component.name": getComponentInfo()?.fileName || "unknown",
        },
      },
      () => api.get(url, config)
    );
  },

  post: (url, data, config = {}) => {
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `POST ${url}`,
        attributes: {
          "http.method": "POST",
          "http.url": url,
          "component.name": getComponentInfo()?.fileName || "unknown",
          "request.size": data ? JSON.stringify(data).length : 0,
        },
      },
      () => api.post(url, data, config)
    );
  },

  put: (url, data, config = {}) => {
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `PUT ${url}`,
        attributes: {
          "http.method": "PUT",
          "http.url": url,
          "component.name": getComponentInfo()?.fileName || "unknown",
          "request.size": data ? JSON.stringify(data).length : 0,
        },
      },
      () => api.put(url, data, config)
    );
  },

  patch: (url, data, config = {}) => {
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `PATCH ${url}`,
        attributes: {
          "http.method": "PATCH",
          "http.url": url,
          "component.name": getComponentInfo()?.fileName || "unknown",
          "request.size": data ? JSON.stringify(data).length : 0,
        },
      },
      () => api.patch(url, data, config)
    );
  },

  delete: (url, config = {}) => {
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `DELETE ${url}`,
        attributes: {
          "http.method": "DELETE",
          "http.url": url,
          "component.name": getComponentInfo()?.fileName || "unknown",
        },
      },
      () => api.delete(url, config)
    );
  },

  // Direct access to the original axios instance for advanced usage
  request: (config) => {
    const method = config.method?.toUpperCase() || "REQUEST";
    const url = config.url || "unknown";

    return Sentry.startSpan(
      {
        op: "http.client",
        name: `${method} ${url}`,
        attributes: {
          "http.method": method,
          "http.url": url,
          "component.name": getComponentInfo()?.fileName || "unknown",
        },
      },
      () => api.request(config)
    );
  },
};

// Export helper functions for use in components
export { setTokens, clearTokens, getAccessToken, getRefreshToken, apiWithSpan };

// Export the original axios instance as default (with interceptors)
export default api;

// Export the span-wrapped version for enhanced tracing
export { apiWithSpan as sentryApi };
