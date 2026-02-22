import api from "../../api/axios";

const aiDiscoverService = {
  async submitSearch({ projectId, companyId, query, queries }) {
    try {
      const queriesPayload = Array.isArray(queries)
        ? queries
        : query
        ? [query]
        : [];

      const payload = {
        project_id: projectId,
        company_id: companyId,
        queries: queriesPayload,
      };

      if (payload.queries.length === 0) {
        return {
          success: false,
          data: null,
          error: "At least one search query is required",
        };
      }

      const response = await api.post("/ai-discover-agent/search/", payload);
      return {
        success: response.data?.success ?? false,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error submitting search:", error);
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to start search",
      };
    }
  },

  async getTaskStatus({ projectId, taskId }) {
    if (!projectId) {
      return { success: false, data: null, error: "Project ID is required" };
    }

    try {
      const response = await api.get(`/ai-discover-agent/task-status/`, {
        params: {
          project_id: projectId,
          ...(taskId ? { task_id: taskId } : {}),
        },
      });

      return {
        success: response.data?.success ?? false,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching task status:", error);
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch task status",
      };
    }
  },

  async getProjectQueries({ projectId, companyId }) {
    if (!projectId) {
      return { success: false, data: null, error: "Project ID is required" };
    }

    if (!companyId) {
      return { success: false, data: null, error: "Company ID is required" };
    }

    try {
      const response = await api.get(`/ai-discover-agent/queries/`, {
        params: {
          project_id: projectId,
          company_id: companyId,
        },
      });

      return {
        success: response.data?.success ?? false,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching project queries:", error);
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch project queries",
      };
    }
  },

  async getQueryVersions({ projectId, queryId, companyId }) {
    if (!projectId) {
      return { success: false, data: null, error: "Project ID is required" };
    }

    if (!queryId) {
      return { success: false, data: null, error: "Query ID is required" };
    }

    if (!companyId) {
      return { success: false, data: null, error: "Company ID is required" };
    }

    try {
      const response = await api.get(`/ai-discover-agent/query-versions/`, {
        params: {
          project_id: projectId,
          query_id: queryId,
          company_id: companyId,
        },
      });

      return {
        success: response.data?.success ?? false,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching query versions:", error);
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch query versions",
      };
    }
  },

  async getQueryData({ projectId, companyId, queryId, versionId }) {
    if (!projectId) {
      return { success: false, data: null, error: "Project ID is required" };
    }

    if (!companyId) {
      return { success: false, data: null, error: "Company ID is required" };
    }

    if (!queryId) {
      return { success: false, data: null, error: "Query ID is required" };
    }

    try {
      const response = await api.get(`/ai-discover-agent/query-data/`, {
        params: {
          project_id: projectId,
          company_id: companyId,
          query_id: queryId,
          ...(versionId ? { version_id: versionId } : {}),
        },
      });

      return {
        success: response.data?.success ?? false,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching query data:", error);
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch query data",
      };
    }
  },
};

export default aiDiscoverService;
