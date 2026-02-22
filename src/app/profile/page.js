"use client";

import React, { useEffect, useState } from "react";
import { formatLocalDateTime } from "../../utils/dateUtils";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaToggleOn,
  FaGlobe,
} from "react-icons/fa";
import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
} from "../utils/authService";
import { requireAuth, getCurrentUser, storeUserData } from "../utils/auth";
import PasswordStrengthChecker from "../components/PasswordStrengthChecker";
import {
  CheckCircle,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import useFeatureTracking from "../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../lib/analytics/featureTracking";
import { useSelection } from "../context/SelectionContext";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { setSelectedUser } = useSelection();

  // Track feature usage
  useFeatureTracking("Profile Settings", {
    feature_category: "user_management",
    page_section: "profile",
  });

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    requireAuth();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const result = await getCurrentUserProfile();
      if (result.success) {
        setUser(result.data);
        setSelectedUser?.(result.data);
        storeUserData(result.data);
        setProfileData({
          firstName: result.data.first_name || "",
          lastName: result.data.last_name || "",
          email: result.data.email || "",
        });
      } else {
        const localUser = getCurrentUser();
        if (localUser) {
          setUser(localUser);
          setProfileData({
            firstName: localUser.name?.split(" ")[0] || "",
            lastName: localUser.name?.split(" ").slice(1).join(" ") || "",
            email: localUser.email || "",
          });
        } else toast.error("Failed to load profile");
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      trackFeatureAction("profile_update_attempt", {
        action_type: "form_submit",
        fields_updated: ["first_name", "last_name"],
      });

      const result = await updateUserProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
      });

      if (result.success) {
        trackFeatureAction("profile_update_success", {
          action_type: "form_submit_success",
        });
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setUser(result.data);
        setSelectedUser?.(result.data);
        storeUserData(result.data);
        setProfileData({
          firstName: result.data.first_name || "",
          lastName: result.data.last_name || "",
          email: result.data.email || "",
        });
      } else {
        trackFeatureAction("profile_update_failed", {
          action_type: "form_submit_failed",
          error: result.error,
        });
        toast.error(result.error);
      }
    } catch (error) {
      trackFeatureAction("profile_update_error", {
        action_type: "form_submit_error",
        error: error.message,
      });
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (oldPassword === newPassword) {
      trackFeatureAction("password_change_same_as_current", {
        action_type: "validation_error",
        error: "new_password_matches_current",
      });
      toast.error("New password must be different from your current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      trackFeatureAction("password_change_mismatch", {
        action_type: "validation_error",
        error: "passwords_do_not_match",
      });
      toast.error("Passwords do not match");
      return;
    }

    // Strength validation
    const strongRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      trackFeatureAction("password_change_weak", {
        action_type: "validation_error",
        error: "password_too_weak",
      });
      toast.error(
        "Password must contain at least 8 chars, one uppercase, one lowercase, one number, and one symbol"
      );
      return;
    }

    try {
      trackFeatureAction("password_change_attempt", {
        action_type: "form_submit",
      });

      const result = await changePassword(oldPassword, newPassword);
      console.log("result ------------------->", result);
      if (result.success) {
        trackFeatureAction("password_change_success", {
          action_type: "form_submit_success",
        });
        toast.success("Password changed successfully!");
        setShowPasswordForm(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        trackFeatureAction("password_change_failed", {
          action_type: "form_submit_failed",
          error: result.error,
        });
        toast.error(result.error);
      }
    } catch (error) {
      trackFeatureAction("password_change_error", {
        action_type: "form_submit_error",
        error: error.message,
      });
      toast.error("Failed to change password");
    }
  };

  const handleTogglePasswordForm = () => {
    setShowPasswordForm((prev) => {
      const next = !prev;
      if (next) {
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
      return next;
    });
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-sky-600"></div>
      </div>
    );

  const avatarUrl = `https://ui-avatars.com/api/?name=${profileData.firstName}+${profileData.lastName}&background=8b5cf6&color=fff&size=128`;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-5">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account information and security
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-sky-200">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {profileData.firstName} {profileData.lastName}
              </h3>
              <p className="text-gray-500 mb-4">{profileData.email}</p>

              {/* Basic Info */}
              <div className="text-left space-y-3 text-sm">
                {/* Extra info from /auth/me */}
                <div className="border-t border-gray-200 my-3"></div>

                <div className="flex justify-between">
                  <span className="text-gray-700 flex items-center gap-1">
                    <Users className="w-4 h-4 text-sky-500 mr-2" /> Platform
                    Staff:
                  </span>
                  {user.is_platform_staff ? (
                    <CheckCircle className="text-green-400" />
                  ) : (
                    <XCircle className="text-red-400" />
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700 flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-sky-500 mr-2" />{" "}
                    Approved:
                  </span>
                  {user.is_approved ? (
                    <CheckCircle className="text-green-400" />
                  ) : (
                    <XCircle className="text-red-400" />
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700 flex items-center gap-1">
                    <UserPlus className="w-4 h-4 text-sky-500 mr-2" />{" "}
                    Invited:
                  </span>
                  {user.is_invited ? (
                    <CheckCircle className="text-green-400" />
                  ) : (
                    <XCircle className="text-red-400" />
                  )}
                </div>

                {/* Extra info from /auth/me */}
                <div className="border-t border-gray-200 my-3"></div>

                <div className="flex justify-between">
                  <span className="flex items-center text-gray-500">
                    <FaGlobe className="mr-2 text-sky-500" /> Timezone
                  </span>
                  <span className="text-gray-900 font-medium">
                    {user?.timezone || "UTC"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center text-gray-500">
                    <FaClock className="mr-2 text-sky-500" /> Created At
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatLocalDateTime(user?.created_at)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Updated At:</span>
                  <span className="text-gray-900 font-medium">
                    {formatLocalDateTime(user?.updated_at)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Last Login:</span>
                  <span className="text-gray-900 font-medium">
                    {formatLocalDateTime(user?.last_login)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
          {/* Profile Form + Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Personal Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex cursor-pointer items-center space-x-2 text-sky-600 hover:text-sky-700"
                  >
                    <FaEdit />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex cursor-pointer items-center space-x-2 text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex cursor-pointer items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                    >
                      <FaSave />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </form>
            </motion.div>

            {/* Security Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Security
                </h2>
                <button
                  onClick={handleTogglePasswordForm}
                  className="flex cursor-pointer items-center space-x-2 text-sky-600 hover:text-sky-700"
                >
                  <FaLock />
                  <span>Change Password</span>
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            oldPassword: e.target.value,
                          })
                        }
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {/* Password strength meter */}
                    <PasswordStrengthChecker
                      password={passwordData.newPassword}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                        passwordData.confirmPassword &&
                        passwordData.newPassword !==
                          passwordData.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {passwordData.confirmPassword &&
                      passwordData.newPassword !==
                        passwordData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">
                          Passwords do not match
                        </p>
                      )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}

              {!showPasswordForm && (
                <div className="text-gray-600">
                  <p>Keep your account secure by using a strong password.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
