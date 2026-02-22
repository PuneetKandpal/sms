import api, { setTokens, clearTokens, getAccessToken } from "../../api/axios";
import * as Sentry from "@sentry/nextjs";

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  const accessToken = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user");
  return !!(accessToken && userId);
}

/**
 * Get current user information from localStorage
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail");
  const userName = localStorage.getItem("userName");

  if (!userId) return null;

  return {
    id: userId,
    email: userEmail,
    fullName: userName,
  };
}

/**
 * Get current company from localStorage
 */
export function getCurrentCompany() {
  if (typeof window === "undefined") return null;
  const selectedCompany = localStorage.getItem("selectedCompany");
  return selectedCompany ? JSON.parse(selectedCompany) : null;
}

/**
 * Get current project from localStorage
 */
export function getCurrentProject() {
  if (typeof window === "undefined") return null;
  const selectedProject = localStorage.getItem("selectedProject");
  return selectedProject ? JSON.parse(selectedProject) : null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(role) {
  if (typeof window === "undefined") return false;
  const userRole = localStorage.getItem("userRole");
  return userRole === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles) {
  if (typeof window === "undefined") return false;
  const userRole = localStorage.getItem("userRole");
  return roles.includes(userRole);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(permission) {
  if (typeof window === "undefined") return false;
  const userPermissions = localStorage.getItem("userPermissions");
  if (!userPermissions) return false;

  try {
    const permissions = JSON.parse(userPermissions);
    return permissions.includes(permission);
  } catch {
    return false;
  }
}

/**
 * Check if user is approved
 */
export function isApproved() {
  if (typeof window === "undefined") return false;
  const isApproved = localStorage.getItem("isApproved");
  return isApproved === "true";
}

/**
 * Logout user and clear all stored data
 */
export function logout() {
  if (typeof window === "undefined") return;

  // Clear API tokens
  clearTokens();

  // Clear user data
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userPermissions");
  localStorage.removeItem("isApproved");
  localStorage.removeItem("selectedCompany");
  localStorage.removeItem("selectedProject");

  // Clear Sentry user context
  updateSentryUserContext();

  // Add logout breadcrumb
  Sentry.addBreadcrumb({
    message: "User logged out",
    category: "auth",
    level: "info",
  });

  // Redirect to login
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Verify token with backend
 */
export async function verifyToken() {
  try {
    const token = getAccessToken();
    if (!token) return false;

    const response = await api.get("/auth/me/");
    return response.status === 200;
  } catch (error) {
    console.error("Token verification failed:", error);
    return false;
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export function requireAuth() {
  if (typeof window === "undefined") return;

  if (!isLoggedIn()) {
    window.location.href = "/login";
    return false;
  }

  return true;
}

/**
 * Require specific role - redirect to unauthorized if user doesn't have role
 */
export function requireRole(roles) {
  if (!requireAuth()) return false;

  const userRole = localStorage.getItem("userRole");
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page or show error
    console.error("Insufficient permissions");
    return false;
  }

  return true;
}

/**
 * Require specific permission
 */
export function requirePermission(permission) {
  if (!requireAuth()) return false;

  if (!hasPermission(permission)) {
    console.error("Insufficient permissions");
    return false;
  }

  return true;
}

/**
 * Store user data in localStorage
 */
export function storeUserData(userData) {
  if (typeof window === "undefined") return;

  console.log("storeUserData userData------->", userData);

  // Store user data
  localStorage.setItem("user", JSON.stringify(userData));

  // Also store individual fields for easier access
  if (userData.id) localStorage.setItem("userId", userData.id);
  if (userData.email) localStorage.setItem("userEmail", userData.email);

  // Handle different backend response formats for user's full name
  let fullName = null;

  if (userData.full_name) {
    // Backend returns full_name
    fullName = userData.full_name;
  } else if (userData.fullName) {
    // Backend returns fullName (camelCase)
    fullName = userData.fullName;
  } else if (userData.first_name && userData.last_name) {
    // Backend returns first_name and last_name separately
    fullName = `${userData.first_name} ${userData.last_name}`.trim();
  } else if (userData.firstName && userData.lastName) {
    // Backend returns firstName and lastName (camelCase)
    fullName = `${userData.firstName} ${userData.lastName}`.trim();
  } else if (userData.name) {
    // Backend returns just 'name'
    fullName = userData.name;
  }

  if (fullName) {
    localStorage.setItem("userName", fullName);
    console.log("✅ userName stored as:", fullName);
  } else {
    console.warn(
      "⚠️ Could not determine user's full name from userData:",
      userData
    );
    // Fallback: use email as name
    if (userData.email) {
      localStorage.setItem("userName", userData.email);
      console.log("⚠️ Using email as userName fallback:", userData.email);
    }
  }

  // Update Sentry user context with new user data
  updateSentryUserContext();

  // Add login breadcrumb
  Sentry.addBreadcrumb({
    message: "User data stored/updated",
    category: "auth",
    level: "info",
    data: {
      user_id: userData.id,
      user_email: userData.email,
      user_name: fullName,
    },
  });
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin() {
  return hasRole("super_admin");
}

/**
 * Check if user is platform staff
 */
export function isPlatformStaff() {
  return hasRole("platform_staff");
}

/**
 * Check if user is company owner
 */
export function isCompanyOwner() {
  return hasRole("company_owner");
}

/**
 * Check if user is company manager
 */
export function isCompanyManager() {
  return hasRole("company_manager");
}

/**
 * Get user's display name
 */
export function getUserDisplayName() {
  const user = getCurrentUser();
  return user?.name || user?.email || "User";
}

/**
 * Get user's initials for avatar
 */
export function getUserInitials() {
  const user = getCurrentUser();
  if (!user?.name) return "U";

  const parts = user.name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

/**
 * Update Sentry user context with current user data
 */
export function updateSentryUserContext() {
  try {
    const user = getCurrentUser();

    if (user) {
      console.log("updateSentryUserContext user------->", user);
      // Set authenticated user context
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.fullName,
        name: user.fullName,
      });

      // Add user-related tags
      Sentry.setTag("user_authenticated", true);
      Sentry.setTag("user_id", user.id);

      // Add user context
      Sentry.setContext("user_profile", {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
      });

      console.log("🎯 Sentry user context updated:", user.email);
    } else {
      // Set anonymous user context
      Sentry.setUser({
        id: "anonymous",
        email: "anonymous@unknown.com",
        username: "anonymous",
        name: "Anonymous User",
      });

      Sentry.setTag("user_authenticated", false);
      // Clear user context instead of removing it
      Sentry.setContext("user_profile", null);

      console.log("🎯 Sentry user context set to anonymous");
    }
  } catch (error) {
    console.warn("Failed to update Sentry user context:", error);
  }
}
