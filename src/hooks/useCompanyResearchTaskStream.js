import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://jbibackend-dev.up.railway.app";

/**
 * Lightweight SSE client for company research task streams.
 *
 * Usage:
 *   const { events, state, error } = useCompanyResearchTaskStream(taskId);
 */
export default function useCompanyResearchTaskStream(taskId) {
  const [events, setEvents] = useState([]);
  const [state, setState] = useState("idle"); // idle | connecting | open | closed | error
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => {
    // If no task selected, reset and do nothing
    if (!taskId) {
      setEvents([]);
      setState("idle");
      setError(null);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function connect() {
      setState("connecting");
      setError(null);
      setEvents([]);

      const token = getAccessToken();
      const url = `${API_BASE_URL}/keyword-api/company-research/task/${taskId}/stream/`;

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          if (cancelled) return;
          setState("error");
          setError(
            `Stream request failed with status ${response.status || "unknown"}`
          );
          return;
        }

        setState("open");
        setEvents((prev) => [
          ...prev,
          {
            id: `connected-${Date.now()}`,
            event: "connected",
            data: { message: "Connected to task stream" },
            timestamp: new Date().toISOString(),
          },
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          buffer += decoder.decode(value, { stream: true });

          // Split on double newlines (end of SSE event)
          let parts = buffer.split(/\n\n|\r\n\r\n|\r\r/);
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const raw = part.trim();
            if (!raw) continue;

            const lines = raw.split(/\r?\n/);
            let eventName = "message";
            let dataLines = [];
            let id;

            for (const line of lines) {
              if (line.startsWith(":")) continue; // comment
              if (line.startsWith("event:")) {
                eventName = line.slice("event:".length).trim() || "message";
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice("data:".length).trim());
              } else if (line.startsWith("id:")) {
                id = line.slice("id:".length).trim();
              }
            }

            const dataStr = dataLines.join("\n");
            let parsedData = null;
            if (dataStr) {
              try {
                parsedData = JSON.parse(dataStr);
              } catch {
                parsedData = dataStr;
              }
            }

            const evt = {
              id:
                id ||
                `${eventName}-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,
              event: eventName,
              data: parsedData,
              timestamp: new Date().toISOString(),
            };

            if (cancelled) break outer;

            setEvents((prev) => [...prev, evt]);

            // Stop streaming once task is complete
            if (eventName === "complete") {
              controller.abort();
              setState("closed");
              break outer;
            }
          }
        }

        if (!cancelled && state !== "closed") {
          setState("closed");
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) {
          return;
        }
        setState("error");
        setError(err.message || "Failed to connect to task stream");
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [taskId]);

  return { events, state, error };
}
