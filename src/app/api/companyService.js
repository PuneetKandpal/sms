import toast from "react-hot-toast";
import api from "../../api/axios";

/**
 * Company Service - Handles all company-related API calls
 */
class CompanyService {
  /**
   * Get all companies the user has access to
   */
  async getCompanies() {
    try {
      const response = await api.get("/auth/companies/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching companies:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch companies",
      };
    }
  }

  /**
   * Get a specific company by ID
   */
  async getCompany(companyId) {
    try {
      const response = await api.get(`/auth/companies/${companyId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching company:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch company",
      };
    }
  }

  /**
   * Create a new company
   */
  async createCompany(companyData) {
    try {
      const response = await api.post("/auth/companies/", companyData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating company:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.name?.[0] ||
          "Failed to create company",
      };
    }
  }

  /**
   * Update a company
   */
  async updateCompany(companyId, companyData) {
    try {
      const response = await api.patch(
        `/auth/companies/${companyId}/`,
        companyData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error updating company:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.name?.[0] ||
          "Failed to update company",
      };
    }
  }

  /**
   * Delete a company
   */
  async deleteCompany(companyId) {
    try {
      await api.delete(`/auth/companies/${companyId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting company:", error);
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to delete company",
      };
    }
  }

  /**
   * Get company members
   */
  async getCompanyMembers(companyId) {
    try {
      const response = await api.get(`/auth/companies/${companyId}/members/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching company members:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to fetch company members",
      };
    }
  }

  /**
   * Update a company member's role
   */
  async updateCompanyMember(companyId, membershipId, memberData) {
    try {
      const response = await api.patch(
        `/auth/companies/${companyId}/members/${membershipId}/`,
        memberData
      );
      toast.success("Member role updated successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error updating company member:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to update member"
      );
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update member",
      };
    }
  }

  /**
   * Remove a company member
   */
  async removeCompanyMember(companyId, membershipId) {
    try {
      await api.delete(
        `/auth/companies/${companyId}/members/${membershipId}/delete/`
      );
      return {
        success: true,
      };
    } catch (error) {
      console.error("Error removing company member:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to remove member",
      };
    }
  }

  /**
   * Get company projects
   */
  async getCompanyProjects(companyId) {
    try {
      const response = await api.get(`/auth/projects/?company_id=${companyId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching company projects:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to fetch company projects",
      };
    }
  }

  /**
   * Update a project
   */
  async updateProject(projectId, projectData) {
    try {
      const response = await api.patch(
        `/auth/projects/${projectId}/`,
        projectData
      );
      toast.success("Project updated successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error updating project:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update project",
      };
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    try {
      await api.delete(`/auth/projects/${projectId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting project:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete project",
      };
    }
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId) {
    try {
      const response = await api.get(`/auth/projects/${projectId}/members/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching project members:", error);
      return {
        success: false,
        error:
          error.response?.data?.detail || "Failed to fetch project members",
      };
    }
  }

  /**
   * Invite a user to join the company
   */
  async inviteCompanyMember(companyId, inviteData) {
    try {
      const response = await api.post(
        `/companies/${companyId}/members/invite/`,
        inviteData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error inviting company member:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to invite member",
      };
    }
  }

  /**
   * Create invitation for a user to join a company
   */
  async createInvitation(invitationData) {
    try {
      const response = await api.post(
        "/auth/invitations/create/",
        invitationData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating invitation:", error);
      console.log("error.response?.data", error.response?.data);
      
      // Extract error message from response
      let errorMessage = "Failed to create invitation";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for email-specific errors
        if (errorData.email && Array.isArray(errorData.email) && errorData.email.length > 0) {
          errorMessage = errorData.email[0];
        }
        // Check for detail field
        else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        // Check for message field
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Check for non-field errors
        else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get company invitations
   */
  async getCompanyInvitations(companyId) {
    try {
      const response = await api.get(
        `/auth/companies/${companyId}/invitations/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching company invitations:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch invitations",
      };
    }
  }

  /**
   * Get all pending invitations across all companies (for people page)
   */
  async getAllPendingInvitations() {
    try {
      // First get all companies
      const companiesResult = await this.getCompanies();
      if (!companiesResult.success) {
        return companiesResult;
      }

      // Then get invitations for each company
      const invitationPromises = companiesResult.data.map(async (company) => {
        const invitationsResult = await this.getCompanyInvitations(company.id);
        if (invitationsResult.success) {
          // Filter only pending invitations and add company info
          return invitationsResult.data
            .filter((invitation) => invitation.status === "pending")
            .map((invitation) => ({
              ...invitation,
              company_info: {
                id: company.id,
                name: company.name,
                website: company.website,
                industry: company.industry,
                size: company.size,
                created_at: company.created_at,
              },
            }));
        }
        return [];
      });

      const invitationArrays = await Promise.all(invitationPromises);
      const allPendingInvitations = invitationArrays.flat();

      return {
        success: true,
        data: allPendingInvitations,
      };
    } catch (error) {
      console.error("Error fetching all pending invitations:", error);
      return {
        success: false,
        error: "Failed to fetch pending invitations",
      };
    }
  }

  /**
   * Cancel/delete an invitation
   */
  async cancelInvitation(invitationId) {
    try {
      const response = await api.post("/auth/invitations/cancel/", {
        invitation_id: invitationId,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error canceling invitation:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to cancel invitation",
      };
    }
  }

  /**
   * Get all members across all companies (for people page)
   */
  async getAllMembers() {
    try {
      // First get all companies
      const companiesResult = await this.getCompanies();
      if (!companiesResult.success) {
        return companiesResult;
      }

      // Then get members for each company
      const memberPromises = companiesResult.data.map(async (company) => {
        const membersResult = await this.getCompanyMembers(company.id);
        if (membersResult.success) {
          return membersResult.data.map((member) => ({
            ...member,
            company_info: {
              id: company.id,
              name: company.name,
              website: company.website,
              industry: company.industry,
              size: company.size,
              created_at: company.created_at,
            },
          }));
        }
        return [];
      });

      const memberArrays = await Promise.all(memberPromises);
      const allMembers = memberArrays.flat();

      return {
        success: true,
        data: allMembers,
      };
    } catch (error) {
      console.error("Error fetching all members:", error);
      return {
        success: false,
        error: "Failed to fetch all members",
      };
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId) {
    try {
      const [membersResponse, projectsResponse] = await Promise.all([
        this.getCompanyMembers(companyId),
        this.getCompanyProjects(companyId),
      ]);

      return {
        success: true,
        data: {
          totalMembers: membersResponse.success
            ? membersResponse.data.length
            : 0,
          totalProjects: projectsResponse.success
            ? projectsResponse.data.length
            : 0,
          activeMembers: membersResponse.success
            ? membersResponse.data.filter((member) => member.is_active).length
            : 0,
        },
      };
    } catch (error) {
      console.error("Error fetching company stats:", error);
      return {
        success: false,
        error: "Failed to fetch company statistics",
      };
    }
  }
}

// Export singleton instance
export default new CompanyService();
