"use client";
import { createContext, useContext, useState } from "react";
import api from "../../api/axios";

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [usersRefreshTrigger, setUsersRefreshTrigger] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsRefreshTrigger, setProjectsRefreshTrigger] = useState(0);

  // 🔍 DEBUG: Wrapper for setSelectedCompany with logging
  const setSelectedCompanyWithDebug = (company) => {
    console.log(
      "🔍 [SelectionContext] setSelectedCompany called with:",
      company
    );
    console.log(
      "🔍 [SelectionContext] Previous selectedCompany was:",
      selectedCompany
    );
    setSelectedCompany(company);
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get(`/auth/companies/`);
      console.log("fetchCompanies response.data------->", response.data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error("Error fetching companies:", error);
      return {
        data: null,
        error:
          error.response?.data?.message || error.message || "Unknown error",
      };
    }
  };

  // inside SelectionProvider
  const fetchProjectsData = async (companyId) => {
    try {
      const response = await api.get(`/auth/projects/?company_id=${companyId}`);
      //console.log("fetchProjectsData response.data------->", response.data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error("Error fetching projects:", error);
      if (error.response?.status === 404) {
        return { data: [], error: null }; // 404 is not an error here
      }
      return {
        data: null,
        error:
          error.response?.data?.message || error.message || "Unknown error",
      };
    }
  };

  const refreshCompanies = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const refreshUsers = () => {
    setUsersRefreshTrigger((prev) => prev + 1);
  };

  const refreshProjects = () => setProjectsRefreshTrigger((prev) => prev + 1);

  return (
    <SelectionContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        selectedCompany,
        setSelectedCompany: setSelectedCompanyWithDebug,
        refreshCompanies,
        refreshTrigger,
        refreshUsers,
        setSelectedProject,
        selectedProject,
        usersRefreshTrigger,
        fetchCompanies,
        fetchProjectsData,
        projectsRefreshTrigger,
        refreshProjects,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
