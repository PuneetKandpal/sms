"use client";
import React, { useState } from "react";
import { formatUTCDateLong } from "../../utils/dateUtils";
import {
  FaTimes,
  FaUser,
  FaCalendar,
  FaClock,
  FaShield,
  FaExclamationTriangle,
  FaUnlink,
  FaCheckCircle,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaReddit,
  FaShieldAlt,
} from "react-icons/fa";

// Platform icon mapping
const PLATFORM_ICONS = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  tiktok: FaUser, // Using FaUser as fallback since FaTiktok might not be available
  youtube: FaYoutube,
  reddit: FaReddit,
};

// Platform colors
const PLATFORM_COLORS = {
  instagram: "from-pink-500 to-purple-600",
  facebook: "from-blue-500 to-blue-600",
  twitter: "from-gray-800 to-black",
  linkedin: "from-blue-600 to-blue-700",
  tiktok: "from-gray-900 to-black",
  youtube: "from-red-500 to-red-600",
  reddit: "from-orange-500 to-red-500",
};

/**
 * Modal for displaying detailed account information
 */
export const AccountDetailsModal = ({ isOpen, onClose, account, profile }) => {
  if (!isOpen || !account) return null;

  const PlatformIcon = PLATFORM_ICONS[account.platform] || FaUser;
  const platformGradient =
    PLATFORM_COLORS[account.platform] || "from-gray-500 to-gray-600";

  const isTokenExpired = () => {
    if (!account.tokenExpiresAt) return false;
    return new Date(account.tokenExpiresAt) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${platformGradient}`}
              >
                <PlatformIcon className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Account Details
                </h2>
                <p className="text-sm text-gray-600 capitalize">
                  {account.platform} Account
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Connection Status</h3>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  account.isActive && !isTokenExpired()
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {account.isActive && !isTokenExpired() ? (
                  <>
                    <FaCheckCircle size={12} />
                    Active
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle size={12} />
                    {isTokenExpired() ? "Token Expired" : "Inactive"}
                  </>
                )}
              </div>
            </div>

            {isTokenExpired() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <FaExclamationTriangle size={14} />
                  <span className="text-sm font-medium">Token Expired</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Please reconnect your account to continue using this
                  integration.
                </p>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Account Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FaUser className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Display Name
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {account.displayName || "Not provided"}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FaUser className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Username
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  @{account.username || "Not provided"}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FaCalendar className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Connected
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {formatLocalDateLong(account.createdAt)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FaClock className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Last Updated
                  </span>
                </div>
                <p className="text-gray-900 font-medium">
                  {formatLocalDateLong(account.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Token Information */}
          {account.tokenExpiresAt && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Token Information</h3>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FaShieldAlt className="text-gray-400" size={16} />
                  <span className="text-sm font-medium text-gray-600">
                    Token Expires
                  </span>
                </div>
                <p
                  className={`font-medium ${
                    isTokenExpired() ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatLocalDateLong(account.tokenExpiresAt)}
                </p>
                {!isTokenExpired() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Token is valid and active
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Profile Information */}
          {profile && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Associated Profile
              </h3>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: profile.color }}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{profile.name}</p>
                    <p className="text-sm text-gray-600">
                      {profile.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Permissions */}
          {account.permissions && account.permissions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Permissions</h3>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {account.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Technical Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Account ID
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono break-all">
                  {account._id}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Getlate Account ID
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono break-all">
                  {account.getlate_account_id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="cursor-pointer px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal for confirming account disconnection
 */
export const DisconnectConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  account,
  isDisconnecting = false,
}) => {
  if (!isOpen || !account) return null;

  const PlatformIcon = PLATFORM_ICONS[account.platform] || FaUser;
  const platformGradient =
    PLATFORM_COLORS[account.platform] || "from-gray-500 to-gray-600";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <FaExclamationTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Disconnect Account
              </h2>
              <p className="text-sm text-gray-600">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-r ${platformGradient}`}
              >
                <PlatformIcon className="text-white" size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {account.displayName || account.username}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {account.platform} Account
                </p>
              </div>
            </div>

            <div className="text-sm text-red-700">
              <p className="font-medium mb-2">
                Are you sure you want to disconnect this account?
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-600">
                <li>You will lose access to post content to this account</li>
                <li>Any scheduled posts for this account will be cancelled</li>
                <li>You'll need to reconnect to use this account again</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This will only disconnect the account from
              our platform. Your social media account itself will remain
              unchanged.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDisconnecting}
            className="cursor-pointer flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDisconnecting}
            className="cursor-pointer flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDisconnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Disconnecting...
              </>
            ) : (
              <>
                <FaUnlink size={14} />
                Disconnect
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
