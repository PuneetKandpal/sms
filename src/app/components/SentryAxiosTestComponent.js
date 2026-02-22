"use client";

import React, { useState } from "react";
import api, { sentryApi } from "../../api/axios";
import * as Sentry from "@sentry/nextjs";

const SentryAxiosTestComponent = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setResults((prev) => [...prev, { message, type, timestamp }]);
  };

  // Test 1: Successful API call with automatic Sentry integration
  const testSuccessfulCall = async () => {
    setLoading(true);
    addResult(
      "Testing successful API call with automatic Sentry integration...",
      "info"
    );

    try {
      // This will automatically capture request/response metadata and create spans
      const response = await api.get("/api/sentry-example-api");
      addResult(`✅ Success: ${JSON.stringify(response.data)}`, "success");
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Test 2: API call with enhanced Sentry span wrapper
  const testWithSentrySpan = async () => {
    setLoading(true);
    addResult("Testing API call with enhanced Sentry span wrapper...", "info");

    try {
      // This creates additional Sentry spans on top of the interceptor integration
      const response = await sentryApi.get("/api/sentry-example-api");
      addResult(
        `✅ Success with enhanced tracing: ${JSON.stringify(response.data)}`,
        "success"
      );
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Test 3: API call that will fail (404 error)
  const testFailedCall = async () => {
    setLoading(true);
    addResult("Testing failed API call (404 error)...", "info");

    try {
      // This will automatically capture the error with full metadata
      await api.get("/api/non-existent-endpoint");
    } catch (error) {
      addResult(`❌ Expected 404 Error captured: ${error.message}`, "warning");
      // The error should already be captured by axios interceptors
      // But let's also verify it's in Sentry by adding some context
      console.log("404 Error captured by axios interceptors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: POST request with data
  const testPostWithData = async () => {
    setLoading(true);
    addResult("Testing POST request with data...", "info");

    try {
      const testData = {
        message: "Test message from Sentry integration",
        timestamp: new Date().toISOString(),
        component: "SentryAxiosTestComponent",
      };

      // This will capture request data (sanitized) and response
      const response = await sentryApi.post(
        "/api/sentry-example-api",
        testData
      );
      addResult(`✅ POST Success: ${JSON.stringify(response.data)}`, "success");
    } catch (error) {
      addResult(`❌ POST Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Call the same API that works in sentry-example-page
  const testSentryExampleAPI = async () => {
    setLoading(true);
    addResult(
      "Testing the same API endpoint as sentry-example-page...",
      "info"
    );

    try {
      // This should trigger the same backend error as the working example
      const response = await api.get("/api/sentry-example-api");
      addResult(
        `✅ Unexpected success: ${JSON.stringify(response.data)}`,
        "success"
      );
    } catch (error) {
      addResult(
        `❌ Backend Error (should appear in Sentry): ${error.message}`,
        "error"
      );
      console.log("Backend error captured by axios interceptors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Manual Sentry span with API call
  const testManualSpan = async () => {
    setLoading(true);
    addResult("Testing manual Sentry span with API call...", "info");

    await Sentry.startSpan(
      {
        op: "ui.action",
        name: "Manual Test Button Click",
        attributes: {
          "component.name": "SentryAxiosTestComponent",
          "test.type": "manual_span",
        },
      },
      async (span) => {
        try {
          span.setAttribute("test.step", "api_call_start");

          const response = await api.get("/api/sentry-example-api");

          span.setAttribute("test.step", "api_call_success");
          span.setAttribute("response.status", response.status);

          addResult(
            `✅ Manual span success: ${JSON.stringify(response.data)}`,
            "success"
          );
        } catch (error) {
          span.setAttribute("test.step", "api_call_error");
          span.setAttribute("error.message", error.message);

          addResult(`❌ Manual span error: ${error.message}`, "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Test 7: Throw a frontend error like the original example
  const testFrontendError = async () => {
    setLoading(true);
    addResult(
      "Testing frontend error (like original sentry-example-page)...",
      "info"
    );

    try {
      // First make an API call, then throw a frontend error
      await api.get("/api/sentry-example-api");
    } catch (apiError) {
      addResult(`API Error: ${apiError.message}`, "warning");
    }

    // Now throw a frontend error like the original example
    try {
      throw new Error("Frontend error thrown from SentryAxiosTestComponent");
    } catch (frontendError) {
      // Manually capture this error to ensure it appears in Sentry
      Sentry.captureException(frontendError, {
        tags: {
          errorType: "frontend_test_error",
          component: "SentryAxiosTestComponent",
        },
        extra: {
          testType: "manual_frontend_error",
          timestamp: new Date().toISOString(),
        },
      });

      addResult(`❌ Frontend Error thrown: ${frontendError.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Test 8: Debug Sentry connectivity and axios interceptor
  const testSentryDebug = async () => {
    setLoading(true);
    addResult(
      "Testing Sentry connectivity and axios interceptor debug...",
      "info"
    );

    try {
      // Test Sentry connectivity
      const connectivity = await Sentry.diagnoseSdkConnectivity();
      addResult(
        `Sentry connectivity: ${connectivity}`,
        connectivity === "sentry-reachable" ? "success" : "error"
      );

      // Test manual Sentry capture
      Sentry.captureMessage(
        "Test message from SentryAxiosTestComponent",
        "info"
      );
      addResult("✅ Manual Sentry message sent", "success");

      // Test axios with detailed logging
      console.log("About to make axios call with detailed logging...");

      try {
        const response = await api.get("/api/non-existent-endpoint");
        addResult(`Unexpected success: ${response.status}`, "warning");
      } catch (axiosError) {
        console.log("Axios error details:", {
          message: axiosError.message,
          status: axiosError.response?.status,
          config: axiosError.config,
          metadata: axiosError.config?.metadata,
        });

        addResult(
          `Axios error captured: ${axiosError.message} (Status: ${axiosError.response?.status})`,
          "warning"
        );
      }
    } catch (error) {
      addResult(`Debug test error: ${error.message}`, "error");
      console.error("Debug test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Sentry + Axios Integration Test Component</h2>
      <p>
        This component demonstrates the automatic Sentry integration with axios
        calls.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <h3>Test Actions:</h3>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={testSuccessfulCall}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Success Call
          </button>

          <button
            onClick={testWithSentrySpan}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test with Sentry Span
          </button>

          <button
            onClick={testFailedCall}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test 404 Error
          </button>

          <button
            onClick={testPostWithData}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#9C27B0",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test POST Data
          </button>

          <button
            onClick={testSentryExampleAPI}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FF5722",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Sentry Example API
          </button>

          <button
            onClick={testManualSpan}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#607D8B",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Manual Span
          </button>

          <button
            onClick={testFrontendError}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#E91E63",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Frontend Error
          </button>

          <button
            onClick={testSentryDebug}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#795548",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Debug Sentry
          </button>
        </div>

        <button
          onClick={clearResults}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Results:</h3>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "10px",
            maxHeight: "400px",
            overflowY: "auto",
            backgroundColor: "#f9f9f9",
          }}
        >
          {loading && (
            <div style={{ color: "#666", fontStyle: "italic" }}>
              Loading... (Check Sentry dashboard for real-time data)
            </div>
          )}

          {results.length === 0 && !loading && (
            <div style={{ color: "#666", fontStyle: "italic" }}>
              No results yet. Click a test button to see Sentry integration in
              action.
            </div>
          )}

          {results.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: "8px",
                padding: "8px",
                borderRadius: "4px",
                backgroundColor:
                  result.type === "success"
                    ? "#e8f5e8"
                    : result.type === "error"
                    ? "#ffeaea"
                    : result.type === "warning"
                    ? "#fff3cd"
                    : "#e3f2fd",
              }}
            >
              <span style={{ fontSize: "12px", color: "#666" }}>
                [{result.timestamp}]
              </span>
              <br />
              <span>{result.message}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#f0f8ff",
          borderRadius: "4px",
        }}
      >
        <h4>What's being captured automatically:</h4>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>
            <strong>Request metadata:</strong> Method, URL, parameters, request
            data (sanitized)
          </li>
          <li>
            <strong>Response data:</strong> Status codes, response times,
            response sizes
          </li>
          <li>
            <strong>Component information:</strong> File name, line number where
            the call originated
          </li>
          <li>
            <strong>Error details:</strong> Full error context with
            request/response data
          </li>
          <li>
            <strong>Performance spans:</strong> Automatic tracing for all HTTP
            requests
          </li>
          <li>
            <strong>Authentication flows:</strong> Token refresh attempts and
            failures
          </li>
        </ul>

        <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          Check your Sentry dashboard to see the captured data, performance
          traces, and error details.
        </p>
      </div>
    </div>
  );
};

export default SentryAxiosTestComponent;
