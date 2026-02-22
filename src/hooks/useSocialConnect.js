// Custom hooks for Social Connect functionality

import { useState, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

/**
 * Custom hook for managing social media connections
 * Provides functions for profile and account management
 */
export const useSocialConnect = (userId) => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  const loadProfiles = useCallback(async () => {
    if (!userId) return { data: null, error: "User ID required" };

    try {
      setLoading(true);
      const response = await api.get(
        `/social-connect/profiles/?user_id=${userId}`
      );

      const data = response.data;
      setProfiles(data.profiles || []);
      return { data: data.profiles, error: null };
    } catch (error) {
      console.error("Error loading profiles:", error);
      return {
        data: null,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load profiles",
      };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadConnectedAccounts = useCallback(async () => {
    if (!userId) return { data: null, error: "User ID required" };

    try {
      setLoading(true);
      const response = await api.get(
        `/social-connect/accounts/?user_id=${userId}`
      );

      const data = response.data;
      setConnectedAccounts(data.accounts || []);
      return { data: data.accounts, error: null };
    } catch (error) {
      console.error("Error loading accounts:", error);
      return {
        data: null,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load connected accounts",
      };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createProfile = useCallback(
    async (profileData) => {
      if (!userId) return { data: null, error: "User ID required" };

      try {
        setLoading(true);
        const response = await api.post("/social-connect/profiles/", {
          user_id: userId,
          ...profileData,
        });

        const data = response.data;
        toast.success("Profile created successfully!");
        await loadProfiles(); // Refresh profiles
        return { data: data.profile, error: null };
      } catch (error) {
        console.error("Error creating profile:", error);
        toast.error("Failed to create profile");
        return {
          data: null,
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to create profile",
        };
      } finally {
        setLoading(false);
      }
    },
    [userId, loadProfiles]
  );

  const connectPlatform = useCallback(
    async (platformId) => {
      if (!userId) return { data: null, error: "User ID required" };

      try {
        setLoading(true);
        const response = await api.post("/social-connect/accounts/connect/", {
          user_id: userId,
          platform: platformId,
        });

        const data = response.data;
        toast.success(
          "OAuth initiated! Please complete authentication in the new window."
        );
        return { data: data.oauth_url, error: null };
      } catch (error) {
        console.error("Error connecting platform:", error);
        toast.error(`Failed to connect ${platformId}`);
        return {
          data: null,
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to initiate connection",
        };
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const disconnectAccount = useCallback(
    async (accountId) => {
      if (!userId) return { data: null, error: "User ID required" };

      try {
        setLoading(true);
        const response = await api.delete(
          `/social-connect/account/${userId}/`,
          {
            data: {
              account_id: accountId,
            },
          }
        );

        toast.success("Account disconnected successfully!");
        await loadConnectedAccounts(); // Refresh accounts
        return { data: true, error: null };
      } catch (error) {
        console.error("Error disconnecting account:", error);
        toast.error("Failed to disconnect account");
        return {
          data: null,
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to disconnect account",
        };
      } finally {
        setLoading(false);
      }
    },
    [userId, loadConnectedAccounts]
  );

  const isConnected = useCallback(
    (platformId) => {
      return connectedAccounts.some(
        (account) => account.platform === platformId
      );
    },
    [connectedAccounts]
  );

  const getConnectedAccount = useCallback(
    (platformId) => {
      return connectedAccounts.find(
        (account) => account.platform === platformId
      );
    },
    [connectedAccounts]
  );

  return {
    loading,
    profiles,
    connectedAccounts,
    loadProfiles,
    loadConnectedAccounts,
    createProfile,
    connectPlatform,
    disconnectAccount,
    isConnected,
    getConnectedAccount,
  };
};
