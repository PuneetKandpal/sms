"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { useSelection } from "../../context/SelectionContext";
import useFeatureTracking from "../../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../../lib/analytics/featureTracking";

export default function NewProjectPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const router = useRouter();
  const { selectedUser, selectedCompany, refreshProjects } = useSelection();
  const isContextReady = !!selectedUser && !!selectedCompany;

  // Track feature usage
  useFeatureTracking("Create Project", {
    feature_category: "project_management",
    page_section: "project_create",
  });

  const validateForm = (nextForm) => {
    const nextErrors = {};

    if (!nextForm.name?.trim())
      nextErrors.name = "Project name is required";

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

  const handleNext = async () => {
    setSubmitAttempted(true);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!isContextReady) {
      toast.error("Please select a user and company first");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || "", // Send empty string if no description
      company: selectedCompany.id,
      status: "active",
    };

    try {
      setIsSubmitting(true);
      trackFeatureAction("project_creation_started", {
        action_type: "form_submit",
        project_name: form.name.trim(),
        has_description: !!form.description.trim(),
      });

      const response = await api.post("/auth/projects/", payload);

      const data = response.data;

      console.log("handle next data------->", data);
      localStorage.setItem("newProject", JSON.stringify(data));
      // Now read project_id instead of id
      const newProjectId = data.id;

      trackFeatureAction("project_creation_success", {
        action_type: "form_submit_success",
        project_id: newProjectId,
      });

      toast.success("Project created successfully");
      refreshProjects();
      router.push("/");
    } catch (err) {
      console.error("Error creating project:", err);

      trackFeatureAction("project_creation_failed", {
        action_type: "form_submit_failed",
        error: err.response?.data?.detail || err.message,
      });

      toast.error(
        err.response?.data?.name?.length == 0
          ? err.response?.data?.name
          : err.response?.data?.name.join("\n ") ||
              err.message ||
              "An error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full mt-1 p-2 bg-gray-50 text-black/80 rounded-lg border border-gray-200 focus:outline-none focus:border-primary/30 transition-all duration-200";

  const isFormValid = Object.keys(validateForm(form)).length === 0;

  return (
    <div className="max-w-lg mx-auto bg-white shadow-xl border border-gray-200 p-8 rounded-2xl space-y-6">
      <h2 className="text-2xl font-semibold text-black">Project Information</h2>

      {!isContextReady && (
        <div className="text-red-500">
          <p>
            You must select a <strong>User</strong> and a{" "}
            <strong>Company</strong> in the Navbar above before creating a
            project.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-required="true"
            required
            className={`${inputClasses} ${
              (submitAttempted || touched.name) && errors.name
                ? "border-red-300 focus:border-red-400"
                : ""
            }`}
          />
          {(submitAttempted || touched.name) && errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            placeholder="Description"
            aria-required="false"
            className={`${inputClasses} resize-none`}
          />
        </div>

        <button
          onClick={handleNext}
          disabled={!isContextReady || isSubmitting || !isFormValid}
          className={`w-full mt-4 px-6 py-2.5 flex items-center justify-center gap-2 cursor-pointer ${
            isContextReady && !isSubmitting && isFormValid
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          } rounded-lg font-semibold transition-colors`}
        >
          {isSubmitting && (
            <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
          )}
          <span>{isSubmitting ? "Creating..." : "Create"}</span>
        </button>
      </div>
    </div>
  );
}
