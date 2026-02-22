"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useSelection } from "../../context/SelectionContext";
import api from "../../../api/axios";
import useFeatureTracking from "../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../lib/analytics/featureTracking";

export default function NewOrganizationPage() {
  const router = useRouter();
  const {
    selectedUser,
    refreshCompanies,
    setSelectedCompany,
    fetchProjectsData,
  } = useSelection();

  // Track feature usage
  useFeatureTracking("Create Organization", {
    feature_category: "organization_management",
    page_section: "organization_create",
  });

  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    description: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isValidUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validateForm = (nextForm) => {
    const nextErrors = {};

    if (!nextForm.name?.trim())
      nextErrors.name = "Organization name is required";

    if (!nextForm.website?.trim()) {
      nextErrors.website = "Website URL is required";
    } else if (!isValidUrl(nextForm.website.trim())) {
      nextErrors.website = "Please enter a valid URL (include https://)";
    }

    if (!nextForm.industry?.trim())
      nextErrors.industry = "Industry is required";

    return nextErrors;
  };

  const syncFieldError = (fieldName, currentForm) => {
    const fieldErrors = validateForm(currentForm);
    setErrors((prevErrors) => {
      if (fieldErrors[fieldName]) {
        if (prevErrors[fieldName] === fieldErrors[fieldName]) return prevErrors;
        return { ...prevErrors, [fieldName]: fieldErrors[fieldName] };
      }
      if (!prevErrors[fieldName]) return prevErrors;
      const { [fieldName]: _removed, ...rest } = prevErrors;
      return rest;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    if (submitAttempted) {
      setErrors(validateForm(nextForm));
    } else if (touched[name]) {
      syncFieldError(name, nextForm);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    syncFieldError(name, form);
  };

  const normalizeProjectsResponse = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.data)) return payload.data;
    if (
      typeof payload === "object" &&
      Object.values(payload).every((value) => Array.isArray(value))
    ) {
      return Object.values(payload).flat();
    }
    return [];
  };

  const handleCreate = async () => {
    if (!selectedUser) {
      console.log("[Debug] No user selected, aborting creation");
      toast.error("Please select a user first");
      return;
    }

    setSubmitAttempted(true);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    console.log("[Debug] Starting organization creation with data:", form);
    setIsLoading(true);
    try {
      trackFeatureAction("organization_create_attempt", {
        action_type: "form_submit",
        organization_name: form.name,
        industry: form.industry,
        size: form.size,
      });

      const res = await api.post(`/auth/companies/`, form);
      const data = res.data;
      console.log("[Debug] Organization created successfully:", data);

      trackFeatureAction("organization_create_success", {
        action_type: "form_submit_success",
        organization_id: data.id,
        organization_name: data.name,
      });

      console.log("[Debug] Refreshing companies...");
      refreshCompanies();
      console.log("[Debug] Setting selected company to:", data);
      setSelectedCompany(data);
      localStorage.setItem("newCompany", JSON.stringify(data));
      console.log("[Debug] Showing success toast...");
      toast.success("Organization created successfully ✨");
      let redirectPath = "/projects/new";
      let shouldShowCreateProjectToast = false;
      try {
        if (fetchProjectsData) {
          console.log(
            "[Debug] Checking existing projects for new company:",
            data.id
          );
          const projectResponse = await fetchProjectsData(data.id);
          const projectPayload = projectResponse?.data;
          const normalizedProjects = normalizeProjectsResponse(projectPayload);
          const projectCount = normalizedProjects.length;
          console.log(
            "[Debug] Projects found after org creation:",
            projectCount
          );
          if (projectCount === 0) {
            console.log(
              "[Debug] No existing projects found. Redirecting to /projects/new"
            );
            shouldShowCreateProjectToast = true;
          }
        }
      } catch (projectErr) {
        console.error(
          "[Debug Error] Failed to check projects after org creation:",
          projectErr
        );
        // If projects cannot be fetched, guide the user to create one
        shouldShowCreateProjectToast = true;
      }
      if (shouldShowCreateProjectToast) {
        toast("Organization ready! Next, create a project to start working.");
      }
      console.log("[Debug] Redirecting to:", redirectPath);
      router.push(redirectPath);
    } catch (err) {
      console.error("[Debug Error] Failed to create organization:", err);
      console.log("[Debug Error] Showing error toast...");

      trackFeatureAction("organization_create_failed", {
        action_type: "form_submit_failed",
        error: err.response?.data?.detail || "Unknown error",
      });

      toast.error(
        Array.isArray(err?.response?.data?.name)
          ? err?.response?.data?.name.join("\n")
          : err.response.data?.detail || "Failed to create organization"
      );
    } finally {
      console.log("[Debug] Creation process ended, isLoading set to false");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const inputClasses =
    "w-full mt-1 p-2 bg-gray-50 text-black/80 rounded-lg border border-gray-200 focus:outline-none focus:border-primary/30 transition-all duration-200";

  const isFormValid = Object.keys(validateForm(form)).length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-lg mx-auto bg-white shadow-xl border border-gray-200 p-8 rounded-2xl space-y-6"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-semibold text-black flex items-center gap-2"
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          🏢
        </motion.span>
        Create New Organization
      </motion.h2>

      {!selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500"
        >
          <p>
            You must select a <strong>User</strong> in the Navbar before
            creating an organization.
          </p>
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.1 },
          },
        }}
        className="space-y-4"
      >
        {[
          {
            label: "Company Name",
            name: "name",
            type: "text",
            placeholder: "Enter company name",
            required: true,
          },
          {
            label: "Website URL",
            name: "website",
            type: "url",
            placeholder: "https://example.com",
            required: true,
          },
          {
            label: "Industry",
            name: "industry",
            type: "text",
            placeholder: "e.g. Finance, Tech",
            required: true,
          },
          {
            label: "Size",
            name: "size",
            type: "text",
            placeholder: "e.g. 11-50",
            required: false,
          },
        ].map((field) => (
          <motion.div
            key={field.name}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <label className="block text-sm text-gray-600">
              {field.label}{" "}
              {field.required ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-gray-400 text-xs">(Optional)</span>
              )}
            </label>
            <input
              {...field}
              value={form[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-required={field.required}
              required={field.required}
              className={`${inputClasses} ${
                (submitAttempted || touched[field.name]) && errors[field.name]
                  ? "border-red-300 focus:border-red-400"
                  : ""
              }`}
              disabled={isLoading}
            />
            {(submitAttempted || touched[field.name]) && errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </motion.div>
        ))}

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <label className="block text-sm text-gray-600">
            Description{" "}
            <span className="text-gray-400 text-xs font-normal">
              (Optional)
            </span>
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Briefly describe the company"
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-required="false"
            className={`${inputClasses} resize-none ${
              (submitAttempted || touched.description) && errors.description
                ? "border-red-300 focus:border-red-400"
                : ""
            }`}
            disabled={isLoading}
          />
        </motion.div>

        <motion.div
          className="flex space-x-3 mt-6"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 cursor-pointer px-6 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{
              scale: selectedUser && !isLoading && isFormValid ? 1.02 : 1,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={!selectedUser || isLoading || !isFormValid}
            className={`flex-1 cursor-pointer px-6 py-2.5 rounded-lg font-semibold transition-colors ${
              selectedUser && !isLoading && isFormValid
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Creating..." : "Create Organization"}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
