"use client";

import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { getCurrentEnvironment } from "../../config/sentry.config";
import api from "../../api/axios";

const SentryEnvironmentTest = () => {
  const [environment, setEnvironment] = useState("loading...");
  const [results, setResults] = useState([]);

  useEffect(() => {
    setEnvironment(getCurrentEnvironment());
  }, []);

  const addResult = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setResults((prev) => [...prev, { message, type, timestamp }]);
  };

  const testEnvironmentDetection = () => {
    addResult(`Current environment: ${environment}`, "info");
    addResult(`NODE_ENV: ${process.env.NODE_ENV}`, "info");
    addResult(
      `NEXT_PUBLIC_SENTRY_ENVIRONMENT: ${
        process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "not set"
      }`,
      "info"
    );
    addResult(
      `NEXT_PUBLIC_VERCEL_ENV: ${
        process.env.NEXT_PUBLIC_VERCEL_ENV || "not set"
      }`,
      "info"
    );
  };

  const testSentryCapture = async () => {
    try {
      // Test message capture
      Sentry.captureMessage(
        `Test message from ${environment} environment`,
        "info"
      );
      addResult(`✅ Message sent to Sentry from ${environment}`, "success");

      // Test exception capture
      const testError = new Error(`Test error from ${environment} environment`);
      Sentry.captureException(testError, {
        tags: {
          test: "environment_test",
          environment: environment,
        },
        extra: {
          testType: "manual_environment_test",
          timestamp: new Date().toISOString(),
        },
      });
      addResult(`✅ Exception sent to Sentry from ${environment}`, "success");

      // Test connectivity
      const connectivity = await Sentry.diagnoseSdkConnectivity();
      addResult(
        `Sentry connectivity: ${connectivity}`,
        connectivity === "sentry-reachable" ? "success" : "error"
      );
    } catch (error) {
      addResult(`❌ Sentry test failed: ${error.message}`, "error");
    }
  };

  const testAxiosIntegration = async () => {
    try {
      addResult(
        "Testing axios integration with environment context...",
        "info"
      );

      // Test successful API call
      const response = await api.get("/api/sentry-example-api");
      addResult(`✅ API call successful: ${response.status}`, "success");
    } catch (error) {
      addResult(
        `API call captured error (expected): ${error.message}`,
        "warning"
      );
      addResult(
        "✅ Error should appear in Sentry with environment tags",
        "success"
      );
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Sentry Environment Test</h2>
      <p>Test the multi-environment Sentry setup and verify configuration.</p>

      <div
        style={{
          padding: "15px",
          backgroundColor: "#f0f8ff",
          borderRadius: "4px",
          marginBottom: "20px",
        }}
      >
        <h3>
          Current Environment:{" "}
          <span style={{ color: "#2196F3" }}>{environment}</span>
        </h3>
        <p>
          This component helps verify that Sentry is properly configured for
          different environments.
        </p>
      </div>

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
            onClick={testEnvironmentDetection}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Environment Detection
          </button>

          <button
            onClick={testSentryCapture}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Sentry Capture
          </button>

          <button
            onClick={testAxiosIntegration}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Test Axios Integration
          </button>

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
          {results.length === 0 ? (
            <div style={{ color: "#666", fontStyle: "italic" }}>
              No results yet. Click a test button to verify the environment
              setup.
            </div>
          ) : (
            results.map((result, index) => (
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
            ))
          )}
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
        <h4>Environment Configuration Summary:</h4>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>
            <strong>Development:</strong> 100% sampling, full debugging, all
            events captured
          </li>
          <li>
            <strong>Staging:</strong> 50% traces, 30% sessions, moderate
            filtering
          </li>
          <li>
            <strong>Production:</strong> 10% traces, 10% sessions, aggressive
            filtering
          </li>
        </ul>

        <h4 style={{ marginTop: "15px" }}>
          What to Check in Sentry Dashboard:
        </h4>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>
            Filter by <code>environment:{environment}</code> tag
          </li>
          <li>
            Look for <code>test:environment_test</code> tag on test events
          </li>
          <li>
            Check API errors have <code>environment:{environment}</code> tag
          </li>
          <li>Verify different sampling rates between environments</li>
        </ul>
      </div>
    </div>
  );
};

export default SentryEnvironmentTest;
