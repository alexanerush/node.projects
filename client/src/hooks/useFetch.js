import { useCallback } from "react";

const STORAGE_KEY = "apiLogs";

const useFetch = () => {
  const logRequest = useCallback((logEntry) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      const newLogs = [
        ...existing,
        {
          ...logEntry,
          timestamp: new Date().toISOString(),
        },
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
    } catch (error) {
      console.error("Failed to save log to localStorage", error);
    }
  }, []);

  const fetchWithLog = useCallback(
    async (url, options = {}) => {
      const { method = "GET", body } = options;

      let payload = body;
      if (typeof body === "string") {
        try {
          payload = JSON.parse(body);
        } catch {
        }
      }

      try {
        const response = await fetch(url, options);

        logRequest({
          url,
          method,
          payload,
          status: response.status,
        });

        return response;
      } catch (error) {
  
        logRequest({
          url,
          method,
          payload,
          status: "NETWORK_ERROR",
        });

        throw error;
      }
    },
    [logRequest]
  );

  return { fetchWithLog };
};

export default useFetch;
