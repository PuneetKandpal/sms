"use client";

import React, { useState, useEffect } from "react";
import {
  FaCog,
  FaTrash,
  FaEdit,
  FaLink,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
  FaReddit,
  FaUsers,
  FaShield,
  FaCrown,
  FaChevronRight,
  FaEye,
  FaUnlink,
  FaUserShield,
  FaBuilding,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  SOCIAL_CONNECT_BASE_URL,
  CONNECT_ACCOUNT_API,
  GET_ACCOUNTS_API,
  GET_PROFILE_DETAILS_API,
  DISCONNECT_ACCOUNT_API,
} from "../api/jbiAPI";
import {
  AccountDetailsModal,
  DisconnectConfirmModal,
} from "../components/AccountModals";
import { useSelection } from "../context/SelectionContext";
import api from "../../api/axios";
import { useRouter, useSearchParams } from "next/navigation";
import useTrackFeatureExploration from "../hooks/useTrackFeatureExploration";

// Platform configurations with enhanced styling
const PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebook,
    color: "#1877F2",
    gradient: "from-blue-500 to-blue-600",
    description: "Connect your Facebook school page",
    features: ["Pages", "Groups", "Ads Manager"],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: FaInstagram,
    color: "#E4405F",
    gradient: "from-pink-500 to-sky-600",
    description: "Connect your Instagram school account",
    features: ["Posts", "Stories", "Reels"],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: FaTwitter,
    color: "#1DA1F2",
    gradient: "from-sky-400 to-blue-500",
    description: "Connect your X profile",
    features: ["Tweets", "Threads", "Analytics"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: FaLinkedin,
    color: "#0077B5",
    gradient: "from-blue-600 to-blue-700",
    description: "Connect your LinkedIn school page",
    features: ["Posts", "Articles", "School Updates"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: FaTiktok,
    color: "#000000",
    gradient: "from-gray-900 to-black",
    description: "Connect your TikTok school account",
    features: ["Videos", "Live", "Ads"],
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: FaYoutube,
    color: "#FF0000",
    gradient: "from-red-500 to-red-600",
    description: "Connect your YouTube channel",
    features: ["Videos", "Shorts", "Live Streaming"],
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: FaReddit,
    color: "#FF4500",
    gradient: "from-orange-500 to-red-500",
    description: "Connect your Reddit account",
    features: ["Posts", "Comments", "Communities"],
  },
];

const formatLocalDateTime = (value, options = {}) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    });
  } catch {
    return value;
  }
};

export default function ConnectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useTrackFeatureExploration("connections");
  const [loading, setLoading] = useState(true);

  // 🔍 DEBUG: Track loading state changes
  const setLoadingWithDebug = (newValue) => {
    console.log("🔍 [setLoading] Changing loading state:", {
      from: loading,
      to: newValue,
      stack: new Error().stack.split("\n")[2]?.trim() || "unknown",
    });
    setLoading(newValue);
  };

  const handleConnectClick = (platformId) => {
    if (platformId === "youtube") {
      toast.success("Feature coming soon");
      return;
    }
    connectPlatform(platformId);
  };
  const [connecting, setConnecting] = useState({});
  const [activeTab, setActiveTab] = useState("platforms");
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  const { selectedCompany } = useSelection();

  // 🔍 DEBUG: Track selectedCompany changes
  useEffect(() => {
    console.log("🔍 [ConnectionsPage] selectedCompany changed:", {
      selectedCompany,
      id: selectedCompany?.id,
      name: selectedCompany?.name,
    });
  }, [selectedCompany]);

  // 🔍 DEBUG: Get userId from localStorage on client side
  useEffect(() => {
    const userData = localStorage.getItem("user");

    const user = JSON.parse(userData);

    console.log("ConnectionsPage user------->", user);

    // console.log(
    //   "🔍 [ConnectionsPage] Getting userId from localStorage:",
    //   storedUserId
    // );
    setUserId(user.id);
  }, []);

  // 🔍 DEBUG: Component initialization
  console.log("🔍 [ConnectionsPage] Component initialized with:", {
    userId,
    loading,
    connectedAccounts: connectedAccounts.length,
    selectedCompany,
  });

  useEffect(() => {
    console.log("🔍 [ConnectionsPage] useEffect triggered with:", {
      userId,
      selectedCompany,
      selectedCompanyId: selectedCompany?.id,
    });

    if (userId && selectedCompany?.id) {
      console.log(
        "🔍 [ConnectionsPage] userId and organization exist, calling load functions"
      );
      loadConnectedAccounts();
    } else if (userId === null) {
      console.log(
        "🔍 [ConnectionsPage] userId is null, waiting for localStorage"
      );
      // Don't do anything yet, wait for userId to be set from localStorage
    } else if (!selectedCompany?.id) {
      console.log(
        "🔍 [ConnectionsPage] Waiting for organization selection to be available"
      );
      setLoadingWithDebug(false);
    } else {
      console.log(
        "🔍 [ConnectionsPage] No userId found, setting loading to false"
      );
      setLoadingWithDebug(false);
    }
  }, [userId, selectedCompany]);

  // Handle OAuth return
  useEffect(() => {
    const handleOAuthReturn = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      // Check if this is an OAuth callback
      if (code || error) {
        const platform = localStorage.getItem("oauth_platform");
        const returnUrl = localStorage.getItem("oauth_return_url");

        if (error) {
          toast.error(`Authentication failed: ${error}`);
        } else if (code) {
          toast.success(
            `${
              platform
                ? platform.charAt(0).toUpperCase() + platform.slice(1)
                : "Account"
            } connected successfully!`
          );
          // Reload connected accounts to show the new connection
          loadConnectedAccounts();
        }

        // Clean up localStorage
        localStorage.removeItem("oauth_platform");
        localStorage.removeItem("oauth_return_url");

        // Redirect back to the original page without OAuth parameters
        if (returnUrl) {
          window.history.replaceState({}, document.title, returnUrl);
        } else {
          // Fallback: clean the URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }
    };

    handleOAuthReturn();
  }, []);

  const loadConnectedAccounts = async () => {
    console.log("🔍 [loadConnectedAccounts] Starting with:", {
      selectedCompany,
      organizationId: selectedCompany?.id,
      userId,
      currentLoading: loading,
    });

    const organizationId = selectedCompany?.id;
    if (!organizationId) {
      console.log(
        "🔍 [loadConnectedAccounts] Missing organization, clearing accounts and setting loading to false"
      );
      setConnectedAccounts([]);
      setLoadingWithDebug(false); // Set loading to false when no organization is selected
      return;
    }

    try {
      console.log("🔍 [loadConnectedAccounts] Setting loading to true");
      setLoadingWithDebug(true);

      try {
        console.log(
          "🔍 [loadConnectedAccounts] Making API call to fetch accounts"
        );
        const response = await api.get(
          `/social-connect/accounts/?user_id=${userId}&organization_id=${organizationId}`
        );
        const data = response.data;

        console.log("🔍 [loadConnectedAccounts] API response:", data);
        setConnectedAccounts(data.accounts || []);
        console.log(
          "🔍 [loadConnectedAccounts] Set connected accounts:",
          data.accounts || []
        );
      } catch (error) {
        console.error("🔍 [loadConnectedAccounts] API error:", error);
        toast.error("Failed to load connected accounts");
        setConnectedAccounts([]);
      } finally {
        console.log(
          "🔍 [loadConnectedAccounts] Setting loading to false (inner finally)"
        );
        setLoadingWithDebug(false);
      }
    } catch (error) {
      console.error("🔍 [loadConnectedAccounts] Outer error:", error);
      toast.error("Failed to load connected accounts");
      setConnectedAccounts([]);
    } finally {
      console.log(
        "🔍 [loadConnectedAccounts] Setting loading to false (outer finally)"
      );
      setLoadingWithDebug(false);
    }
  };

  const connectPlatform = async (platformId) => {
    try {
      setConnecting({ ...connecting, [platformId]: true });

      const organizationId = selectedCompany?.id;
      if (!organizationId) {
        toast.error("Please select an organization first");
        setConnecting({ ...connecting, [platformId]: false });
        return;
      }

      try {
        const response = await api.post(CONNECT_ACCOUNT_API, {
          user_id: userId,
          organization_id: organizationId,
          platform: platformId,
        });

        if (response.data) {
          const data = response.data;

          // Store the current URL to return to after OAuth
          const returnUrl = window.location.href;
          localStorage.setItem("oauth_return_url", returnUrl);
          localStorage.setItem("oauth_platform", platformId);

          // Redirect in the same window
          window.location.href = data.oauth_url;

          toast.success("Redirecting to complete authentication...");
        } else {
          throw new Error("Failed to initiate connection");
        }
      } catch (error) {
        console.error("Error connecting platform:", error);
        toast.error(error.response.data.error);
        setConnecting({ ...connecting, [platformId]: false });
      }
    } catch (error) {
      console.error("Error connecting platform:", error);
      toast.error(error.response.data.error);
      setConnecting({ ...connecting, [platformId]: false });
    }
  };

  const handleViewDetails = async (account) => {
    setSelectedAccount(account);
    setShowAccountDetails(true);
  };

  const handleDisconnectClick = (account) => {
    setSelectedAccount(account);
    setShowDisconnectConfirm(true);
  };

  const disconnectAccount = async () => {
    if (!selectedAccount) return;

    console.log("Selected account ------------------", selectedAccount);

    try {
      setDisconnecting(true);
      try {
        const response = await api.delete(
          `/social-connect/accounts/disconnect/${selectedAccount._id}/?user_id=${userId}`,
          {
            data: {
              organization_id: selectedCompany?.id,
            },
          }
        );

        if (response.data) {
          const data = response.data;
          toast.success("Account disconnected successfully!");
          setShowDisconnectConfirm(false);
          setSelectedAccount(null);
          loadConnectedAccounts();
        } else {
          throw new Error("Failed to disconnect account");
        }
      } catch (error) {
        console.error("Error disconnecting account:", error);
        toast.error(error.response.data.error);
      } finally {
        setDisconnecting(false);
      }
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error(error.response.data.error);
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = (platformId) => {
    return connectedAccounts.some((account) => account.platform === platformId);
  };

  const getConnectedAccount = (platformId) => {
    return connectedAccounts.find((account) => account.platform === platformId);
  };

  // 🔍 DEBUG: Render decision points
  console.log("🔍 [ConnectionsPage] Render decision:", {
    loading,
    selectedCompany,
    selectedCompanyExists: !!selectedCompany,
    userId,
    connectedAccountsLength: connectedAccounts.length,
  });

  if (loading) {
    console.log("🔍 [ConnectionsPage] Rendering SHIMMER UI (loading=true)");
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            {/* Platforms Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-24 bg-gray-200 rounded"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show message when no company is selected (but we have userId)
  if (userId && !selectedCompany) {
    console.log("🔍 [ConnectionsPage] Rendering NO COMPANY SELECTED message");
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="mx-auto px-12 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Social Connections
            </h1>
            <p className="text-lg text-gray-600">
              Manage your social media accounts and active profile
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="mb-6">
              <FaBuilding className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No School Selected
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Please select a school from the navigation bar to view and
                manage your social media connections.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("🔍 [ConnectionsPage] Rendering MAIN CONTENT");
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Social Connections
              </h1>
              <p className="text-lg text-gray-600">
                Manage your social media accounts and active profile
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id);
            const account = getConnectedAccount(platform.id);
            const isConnecting = connecting[platform.id];
            const IconComponent = platform.icon;
            const isYoutube = platform.id === "youtube";
            const connectButtonCursorClass =
              isConnecting || isYoutube ? "cursor-not-allowed" : "cursor-pointer";
            const connectButtonHoverClass = isYoutube
              ? "hover:shadow-none transform hover:-translate-y-0"
              : "hover:shadow-lg transform hover:-translate-y-0.5";
            const connectButtonOpacityClass = isYoutube ? "opacity-70" : "";

            return (
              <div
                key={platform.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                  connected
                    ? "border-green-200 bg-gradient-to-br from-green-50 to-white"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      connected
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {connected ? (
                      <>
                        <FaCheckCircle size={12} />
                        Connected
                      </>
                    ) : (
                      "Not Connected"
                    )}
                  </div>
                  {connected && (
                    <button
                      onClick={() => handleDisconnectClick(account)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Disconnect"
                    >
                      <FaUnlink size={14} />
                    </button>
                  )}
                </div>

                {/* Platform Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${platform.gradient}`}
                  >
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {platform.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {platform.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Account Details or Connect Button */}
                {connected && account ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {account.displayName?.[0] || "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {account.displayName || account.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          Connected {formatLocalDateTime(account.createdAt)}
                        </p>
                      </div>
                      <FaChevronRight className="text-gray-400" size={14} />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(account)}
                        className="cursor-pointer flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaEye size={14} />
                        View Details
                      </button>
                      <button
                        onClick={() => handleDisconnectClick(account)}
                        className="cursor-pointer flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaUnlink size={14} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleConnectClick(platform.id)}
                      disabled={isConnecting}
                      aria-disabled={isYoutube}
                      className={`${connectButtonCursorClass} ${connectButtonOpacityClass} w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 bg-gradient-to-r ${
                        platform.gradient
                      } ${connectButtonHoverClass}`}
                    >
                      {isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <FaLink size={16} />
                          Connect Account
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toast.success("Feature coming soon")}
                      className="cursor-pointer w-full px-4 py-2 border-2 border-dashed border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaLink size={14} />
                      Generate Invite Link
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Account Details Modal */}
        <AccountDetailsModal
          isOpen={showAccountDetails}
          onClose={() => {
            setShowAccountDetails(false);
            setSelectedAccount(null);
          }}
          account={selectedAccount}
          profile={null}
        />

        {/* Disconnect Confirmation Modal */}
        <DisconnectConfirmModal
          isOpen={showDisconnectConfirm}
          onClose={() => {
            setShowDisconnectConfirm(false);
            setSelectedAccount(null);
          }}
          onConfirm={disconnectAccount}
          account={selectedAccount}
          isDisconnecting={disconnecting}
        />
      </div>
    </div>
  );
}
