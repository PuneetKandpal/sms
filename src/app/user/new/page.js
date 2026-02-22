"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BASE_URL, GET_COMPANIES_API } from "../../api/jbiAPI";
import { useSelection } from "../../context/SelectionContext";
import api from "../../../api/axios";

export default function NewUserPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const { selectedCompany, refreshUsers } = useSelection();
  const router = useRouter();

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const res = await api.get(`/api/companies/?user_id=${userId}`);
        const data = res.data;
        setCompanies(data);

        // If there's a selected company in context, use it as default
        if (selectedCompany?.id) {
          setSelectedCompanyId(selectedCompany.id);
        } else if (data.length > 0) {
          setSelectedCompanyId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading companies:", err);
        toast.error("Failed to load companies");
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [selectedCompany]);

  const handleCreate = async () => {
    // Validation
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Password validation (basic)
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    const payload = {
      email: email.trim(),
      name: name.trim(),
      password: password,
      company_id: selectedCompanyId,
    };

    setIsLoading(true);
    try {
      const res = await api.post(`/api/create-user/`, {
        email: email.trim(),
        name: name.trim(),
        password: password,
        company_id: selectedCompanyId,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to create user:", errData);

        // Handle specific error messages if available
        if (errData.email && errData.email.includes("already exists")) {
          toast.error("User with this email already exists");
        } else if (errData.detail) {
          toast.error(errData.detail);
        } else {
          toast.error("Failed to create user");
        }
        return;
      }

      const data = await res.json();
      toast.success("User created successfully");

      // Trigger refresh of users list if available
      if (refreshUsers) {
        refreshUsers();
      }

      // Navigate back to dashboard or previous page
      router.push("/");
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("An error occurred while creating user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl border border-gray-200 p-8 rounded-2xl space-y-6">
        <h2 className="text-2xl font-semibold text-black text-center">
          Create New User
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 text-black/80 rounded-lg border border-gray-200 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
              placeholder="Enter email address"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-50 text-black/80 rounded-lg border border-gray-200 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
              placeholder="Enter full name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 text-black/80 rounded-lg border border-gray-200 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
              placeholder="Enter password"
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Company *
            </label>
            {isLoadingCompanies ? (
              <div className="w-full p-3 bg-gray-50 text-gray-500 rounded-lg border border-gray-200">
                Loading companies...
              </div>
            ) : (
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-3 bg-gray-50 text-black/80 rounded-lg border border-gray-200 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                disabled={isLoading}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex space-x-3 mt-8">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isLoading || isLoadingCompanies}
              className={`flex-1 px-6 py-3 ${
                isLoading || isLoadingCompanies
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90 cursor-pointer"
              } rounded-lg font-semibold transition-colors`}
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>

        {companies.length === 0 && !isLoadingCompanies && (
          <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            No companies found. Please create a company first before adding
            users.
          </div>
        )}
      </div>
    </div>
  );
}
