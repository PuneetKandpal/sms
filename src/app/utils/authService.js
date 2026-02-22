import toast from "react-hot-toast";
import axios from "axios";
import api, { setTokens } from "../../api/axios";
import { storeUserData } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://jbibackend-dev.up.railway.app";

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Register a new user
 * POST /auth/register/
 */
export async function registerUser(data) {
  try {
    const response = await api.post("/auth/register/", {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      password: data.password,
      password_confirm: data.passwordConfirm,
      company_website: data.company_website,
    });

    // If registration includes tokens (auto-accepted invitation), store them
    if (response.data.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
      storeUserData(response.data.user);
    }

    return { success: true, data: response.data };
  } catch (error) {
    toast.error(
      error.response?.data?.email?.join("\n") || "Registration failed"
    );

    return {
      success: false,
      error: error.response?.data?.message || "Registration failed",
      details: error.response?.email.join("\n"),
    };
  }
}

/**
 * Login user
 * POST /auth/login/
 */
export async function loginUser(email, password) {
  try {
    // Clear any existing tokens before login attempt
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }

    // IMPORTANT: Use a plain axios call for login to avoid token refresh/queue
    // interceptors from causing the login request to hang.
    const response = await axios.post(
      `${API_BASE_URL}/auth/login/`,
      {
        email,
        password,
      },
      {
        withCredentials: true,
        timeout: 1000 * 60 * 5,
      }
    );

    if (response.data.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
      storeUserData(response.data.user);
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.log("Login error:", error);
    console.log("Login error response:", error.response);
    const statusCode = error.response?.status;
    let message = "Login failed";

    if (statusCode === 401) {
      message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Invalid email or password";
    } else if (statusCode === 403) {
      message = "Account inactive or pending approval";
    } else {
      message = error.response?.data?.message || error.message;
    }

    return {
      success: false,
      error: message,
      statusCode,
      details: error.response?.data,
    };
  }
}

/**
 * Refresh access token
 * POST /auth/refresh/
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const response = await api.post("/auth/refresh/", {
      refresh_token: refreshToken,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Token refresh failed",
      details: error.response?.data,
    };
  }
}

/**
 * Get current user profile
 * GET /auth/me/
 */
export async function getCurrentUserProfile() {
  try {
    const response = await api.get("/auth/me/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to get user profile",
      details: error.response?.data,
    };
  }
}

/**
 * Update current user profile
 * PUT /auth/me/
 */
export async function updateUserProfile(data) {
  try {
    const response = await api.patch("/auth/me/", data);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update profile",
      details: error.response?.data,
    };
  }
}

/**
 * Change password
 * POST /auth/change-password/
 */
export async function changePassword(oldPassword, newPassword) {
  try {
    const response = await api.post("/auth/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPassword,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to change password",
      details: error.response?.data,
    };
  }
}

/**
 * Request password reset
 * POST /auth/password-reset/request/
 */
export async function requestPasswordReset(email) {
  try {
    const response = await api.post("/auth/password-reset/request/", {
      email,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message || "Failed to request password reset",
      details: error.response?.data,
    };
  }
}

/**
 * Confirm password reset
 * POST /auth/password-reset/confirm/
 */
export async function confirmPasswordReset(data) {
  try {
    const response = await api.post("/auth/password-reset/confirm/", {
      token: data.token,
      new_password: data.newPassword,
      new_password_confirm: data.newPasswordConfirm,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to reset password",
      details: error.response?.data,
    };
  }
}

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * List all users (Super admin only)
 * GET /users/
 */
export async function listUsers(params = {}) {
  try {
    const response = await api.get("/users/", { params });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load users",
      details: error.response?.data,
    };
  }
}

/**
 * Get user details (Super admin only)
 * GET /users/{user_id}/
 */
export async function getUserDetails(userId) {
  try {
    const response = await api.get(`/users/${userId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to get user details",
      details: error.response?.data,
    };
  }
}

/**
 * Update user (Super admin only)
 * PUT /users/{user_id}/
 */
export async function updateUser(userId, data) {
  try {
    const response = await api.put(`/users/${userId}/`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update user",
      details: error.response?.data,
    };
  }
}

/**
 * Delete user (Super admin only)
 * DELETE /users/{user_id}/
 */
export async function deleteUser(userId) {
  try {
    await api.delete(`/users/${userId}/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete user",
      details: error.response?.data,
    };
  }
}

/**
 * Approve/reject user (Super admin only)
 * POST /users/approve/
 */
export async function approveUser(data) {
  try {
    const response = await api.post("/users/approve/", {
      user_id: data.userId,
      approve: data.approve,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update user status",
      details: error.response?.data,
    };
  }
}

// ============================================================================
// COMPANY MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * List companies
 * GET /companies/
 */
export async function listCompanies(params = {}) {
  try {
    const response = await api.get("/companies/", { params });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load companies",
      details: error.response?.data,
    };
  }
}

/**
 * Create company
 * POST /companies/
 */
export async function createCompany(data) {
  try {
    const response = await api.post("/companies/", {
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      description: data.description,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create company",
      details: error.response?.data,
    };
  }
}

/**
 * Get company details
 * GET /companies/{company_id}/
 */
export async function getCompanyDetails(companyId) {
  try {
    const response = await api.get(`/companies/${companyId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to get company details",
      details: error.response?.data,
    };
  }
}

/**
 * Update company
 * PUT /companies/{company_id}/
 */
export async function updateCompany(companyId, data) {
  try {
    const response = await api.put(`/companies/${companyId}/`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update company",
      details: error.response?.data,
    };
  }
}

/**
 * Delete company
 * DELETE /companies/{company_id}/
 */
export async function deleteCompany(companyId) {
  try {
    const response = await api.delete(`/companies/${companyId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete company",
      details: error.response?.data,
    };
  }
}

/**
 * List company members
 * GET /companies/{company_id}/members/
 */
export async function listCompanyMembers(companyId) {
  try {
    const response = await api.get(`/companies/${companyId}/members/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load company members",
      details: error.response?.data,
    };
  }
}

/**
 * Update company member
 * PUT /companies/{company_id}/members/{membership_id}/
 */
export async function updateCompanyMember(companyId, membershipId, data) {
  try {
    const response = await api.put(
      `/companies/${companyId}/members/${membershipId}/`,
      data
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update company member",
      details: error.response?.data,
    };
  }
}

/**
 * Remove company member
 * DELETE /companies/{company_id}/members/{membership_id}/delete/
 */
export async function removeCompanyMember(companyId, membershipId) {
  try {
    await api.delete(`/companies/${companyId}/members/${membershipId}/delete/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to remove company member",
      details: error.response?.data,
    };
  }
}

// ============================================================================
// INVITATION ENDPOINTS
// ============================================================================

/**
 * Create invitation
 * POST /invitations/create/
 */
export async function createInvitation(data) {
  try {
    const response = await api.post("/invitations/create/", {
      company: data.companyId,
      email: data.email,
      role: data.role.toLowerCase(), // Ensure lowercase
      message: data.message,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to send invitation",
      details: error.response?.data,
    };
  }
}

/**
 * List company invitations
 * GET /companies/{company_id}/invitations/
 */
export async function listCompanyInvitations(companyId) {
  try {
    const response = await api.get(`/companies/${companyId}/invitations/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load invitations",
      details: error.response?.data,
    };
  }
}

/**
 * Check invitation
 * GET /invitations/check/{token}/
 */
export async function checkInvitation(token) {
  try {
    const response = await api.get(`/auth/invitations/check/${token}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Invalid invitation",
      details: error.response?.data,
    };
  }
}

/**
 * Accept invitation
 * POST /invitations/accept/
 */
export async function acceptInvitation(data) {
  try {
    const payload = { token: data.token };

    // If new user signup data is provided
    if (data.firstName && data.lastName && data.password) {
      payload.first_name = data.firstName;
      payload.last_name = data.lastName;
      payload.password = data.password;
    }

    const response = await api.post("/auth/invitations/accept/", payload);

    // If tokens are returned, store them
    if (response.data.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
      storeUserData(response.data.user);
    }

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to accept invitation",
      details: error.response?.data,
    };
  }
}

/**
 * Cancel invitation
 * POST /auth/invitations/cancel/
 */
export async function cancelInvitation(invitationId) {
  try {
    const response = await api.post("/auth/invitations/cancel/", {
      invitation_id: invitationId,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to cancel invitation",
      details: error.response?.data,
    };
  }
}

// ============================================================================
// PROJECT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * List projects
 * GET /projects/
 */
export async function listProjects(params = {}) {
  try {
    const response = await api.get("/projects/", { params });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load projects",
      details: error.response?.data,
    };
  }
}

/**
 * Create project
 * POST /projects/
 */
export async function createProject(data) {
  try {
    const response = await api.post("/projects/", {
      name: data.name,
      description: data.description,
      company: data.companyId,
      status: data.status || "active",
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create project",
      details: error.response?.data,
    };
  }
}

/**
 * Get project details
 * GET /projects/{project_id}/
 */
export async function getProjectDetails(projectId) {
  try {
    const response = await api.get(`/projects/${projectId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to get project details",
      details: error.response?.data,
    };
  }
}

/**
 * Update project
 * PUT /projects/{project_id}/
 */
export async function updateProject(projectId, data) {
  try {
    const response = await api.put(`/projects/${projectId}/`, {
      name: data.name,
      description: data.description,
      company: data.companyId,
      status: data.status,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update project",
      details: error.response?.data,
    };
  }
}

/**
 * Delete project
 * DELETE /projects/{project_id}/
 */
export async function deleteProject(projectId) {
  try {
    await api.delete(`/projects/${projectId}/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete project",
      details: error.response?.data,
    };
  }
}

/**
 * List project members
 * GET /projects/{project_id}/members/
 */
export async function listProjectMembers(projectId) {
  try {
    const response = await api.get(`/projects/${projectId}/members/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load project members",
      details: error.response?.data,
    };
  }
}

/**
 * Add project member
 * POST /projects/{project_id}/members/add/
 */
export async function addProjectMember(projectId, data) {
  try {
    const response = await api.post(`/projects/${projectId}/members/add/`, {
      user: data.userId,
      project: projectId,
      permission: data.permission,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add project member",
      details: error.response?.data,
    };
  }
}

/**
 * Update project member
 * PUT /projects/{project_id}/members/{membership_id}/
 */
export async function updateProjectMember(projectId, membershipId, data) {
  try {
    const response = await api.put(
      `/projects/${projectId}/members/${membershipId}/`,
      data
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update project member",
      details: error.response?.data,
    };
  }
}

/**
 * Remove project member
 * DELETE /projects/{project_id}/members/{membership_id}/delete/
 */
export async function removeProjectMember(projectId, membershipId) {
  try {
    await api.delete(`/projects/${projectId}/members/${membershipId}/delete/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to remove project member",
      details: error.response?.data,
    };
  }
}

// ============================================================================
// COMPONENT & DOMAIN ENDPOINTS
// ============================================================================

/**
 * List components
 * GET /components/
 */
export async function listComponents() {
  try {
    const response = await api.get("/components/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load components",
      details: error.response?.data,
    };
  }
}

/**
 * Create component
 * POST /components/
 */
export async function createComponent(data) {
  try {
    const response = await api.post("/components/", {
      name: data.name,
      description: data.description,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create component",
      details: error.response?.data,
    };
  }
}

/**
 * List domains
 * GET /domains/
 */
export async function listDomains() {
  try {
    const response = await api.get("/domains/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to load domains",
      details: error.response?.data,
    };
  }
}

/**
 * Create domain
 * POST /domains/
 */
export async function createDomain(data) {
  try {
    const response = await api.post("/domains/", {
      name: data.name,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create domain",
      details: error.response?.data,
    };
  }
}
