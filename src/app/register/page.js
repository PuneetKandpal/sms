"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";
import { registerUser } from "../utils/authService";
import PasswordRequirementsChecker from "../components/PasswordRequirementsChecker";

// Marketing-focused SVG Component (same as login)
function MarketingIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-16 w-16 h-16 bg-white/10 rounded-full"></div>
      <div className="absolute bottom-32 right-20 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
        </svg>
      </div>
      <div className="absolute top-32 right-24 w-4 h-4 bg-white/20 rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-6 h-6 bg-white/15 rounded-full"></div>

      {/* Main illustration */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-sm">
        <svg width="280" height="320" viewBox="0 0 280 320" fill="none">
          {/* Professional woman figure */}
          <g>
            {/* Body */}
            <ellipse
              cx="140"
              cy="280"
              rx="60"
              ry="25"
              fill="rgba(255,255,255,0.1)"
            />
            <rect
              x="110"
              y="200"
              width="60"
              height="80"
              rx="30"
              fill="#E8F4FD"
            />

            {/* Arms */}
            <ellipse
              cx="85"
              cy="230"
              rx="12"
              ry="35"
              fill="#F4C2A1"
              transform="rotate(-20 85 230)"
            />
            <ellipse
              cx="195"
              cy="230"
              rx="12"
              ry="35"
              fill="#F4C2A1"
              transform="rotate(20 195 230)"
            />

            {/* Hands holding tablet */}
            <circle cx="75" cy="250" r="8" fill="#F4C2A1" />
            <circle cx="205" cy="250" r="8" fill="#F4C2A1" />

            {/* Tablet/Device */}
            <rect
              x="90"
              y="240"
              width="100"
              height="70"
              rx="8"
              fill="#2D3748"
            />
            <rect x="95" y="245" width="90" height="50" rx="4" fill="#4299E1" />
            <rect x="100" y="250" width="80" height="3" rx="1.5" fill="white" />
            <rect x="100" y="257" width="60" height="3" rx="1.5" fill="white" />
            <rect x="100" y="264" width="70" height="3" rx="1.5" fill="white" />

            {/* Charts/graphs on tablet */}
            <rect x="105" y="272" width="15" height="15" fill="#10B981" />
            <rect x="125" y="275" width="15" height="12" fill="#F59E0B" />
            <rect x="145" y="270" width="15" height="17" fill="#EF4444" />
            <rect x="165" y="273" width="15" height="14" fill="#8B5CF6" />

            {/* Head */}
            <circle cx="140" cy="160" r="30" fill="#F4C2A1" />

            {/* Hair */}
            <path
              d="M110 140 Q140 120 170 140 Q175 150 170 170 Q165 180 140 175 Q115 180 110 170 Q105 150 110 140"
              fill="#8B4513"
            />

            {/* Face features */}
            <circle cx="130" cy="155" r="2" fill="#2D3748" />
            <circle cx="150" cy="155" r="2" fill="#2D3748" />
            <path
              d="M135 165 Q140 170 145 165"
              stroke="#2D3748"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Shirt */}
            <path
              d="M110 190 Q140 185 170 190 L165 210 Q140 205 115 210 Z"
              fill="#60A5FA"
            />
          </g>

          {/* Marketing icons floating around */}
          <g opacity="0.7">
            {/* Chart icon */}
            <rect x="50" y="80" width="40" height="30" rx="4" fill="white" />
            <polyline
              points="55,100 62,95 69,102 76,88 85,92"
              stroke="#4299E1"
              strokeWidth="2"
              fill="none"
            />
            <rect x="55" y="105" width="6" height="2" fill="#10B981" />
            <rect x="63" y="103" width="6" height="4" fill="#F59E0B" />
            <rect x="71" y="101" width="6" height="6" fill="#EF4444" />
            <rect x="79" y="104" width="6" height="3" fill="#8B5CF6" />

            {/* Target icon */}
            <circle cx="220" cy="100" r="20" fill="white" />
            <circle
              cx="220"
              cy="100"
              r="15"
              stroke="#EF4444"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="220"
              cy="100"
              r="10"
              stroke="#EF4444"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="220" cy="100" r="5" fill="#EF4444" />

            {/* Growth arrow */}
            <rect x="200" y="180" width="30" height="20" rx="4" fill="white" />
            <polyline
              points="205,195 212,188 219,195"
              stroke="#10B981"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="212"
              y1="188"
              x2="212"
              y2="195"
              stroke="#10B981"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    passwordConfirm: "",
    company_website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Website validation function
  const isValidWebsite = (website) => {
    if (!website) return true; // Optional field
    const websiteRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return websiteRegex.test(website);
  };

  // Password validation function
  const isValidPassword = (password) => {
    return password.length >= 8;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const newErrors = { ...errors };

    if (name === "email") {
      if (value && !isValidEmail(value)) {
        newErrors.email = "Please enter a valid email address";
      } else {
        delete newErrors.email;
      }
    }

    if (name === "firstName") {
      if (value && value.trim().length < 2) {
        newErrors.firstName = "First name must be at least 2 characters";
      } else {
        delete newErrors.firstName;
      }
    }

    if (name === "lastName") {
      if (value && value.trim().length < 2) {
        newErrors.lastName = "Last name must be at least 2 characters";
      } else {
        delete newErrors.lastName;
      }
    }

    if (name === "password") {
      if (value && !isValidPassword(value)) {
        newErrors.password = "Password must be at least 8 characters";
      } else {
        delete newErrors.password;
      }

      // Check password confirmation match
      if (formData.passwordConfirm && value !== formData.passwordConfirm) {
        newErrors.passwordConfirm = "Passwords do not match";
      } else if (
        formData.passwordConfirm &&
        value === formData.passwordConfirm
      ) {
        delete newErrors.passwordConfirm;
      }
    }

    if (name === "passwordConfirm") {
      if (value && value !== formData.password) {
        newErrors.passwordConfirm = "Passwords do not match";
      } else {
        delete newErrors.passwordConfirm;
      }
    }

    if (name === "company_website") {
      if (value && !isValidWebsite(value)) {
        newErrors.company_website = "Please enter a valid website URL";
      } else {
        delete newErrors.company_website;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "Please confirm your password";
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors below");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser(formData);

      if (result.success) {
        const { data } = result;

        if (data.auto_accepted_invitation) {
          toast.success(data.message);
          // If user was auto-approved with invitation, redirect to login
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          toast.success(data.message);
          // For pending approval, redirect to login after showing message
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } else {
        toast.error(result.details);
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      {/* Left Side - Register Form */}
      <div className="w-full lg:w-1/2 flex justify-center px-8 py-12 bg-white overflow-y-auto items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold text-gray-900 mb-3 tracking-wide"
            >
              Register
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 text-lg"
            >
              Create your account to start your marketing journey...
            </motion.p>
          </div>

          {/* Register Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Email Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    errors.email ? "ring-2 ring-red-300 border-red-300" : ""
                  }`}
                  placeholder="Email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* First Name Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    errors.firstName ? "ring-2 ring-red-300 border-red-300" : ""
                  }`}
                  placeholder="First Name"
                  required
                />
              </div>
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    errors.lastName ? "ring-2 ring-red-300 border-red-300" : ""
                  }`}
                  placeholder="Last Name"
                  required
                />
              </div>
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            {/* Company Website Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaGlobe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  name="company_website"
                  value={formData.company_website}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    errors.company_website
                      ? "ring-2 ring-red-300 border-red-300"
                      : ""
                  }`}
                  placeholder="Company Website (Optional)"
                />
              </div>
              {errors.company_website && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.company_website}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    errors.password ? "ring-2 ring-red-300 border-red-300" : ""
                  }`}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-purple-600 transition-colors duration-200 cursor-pointer"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
              <PasswordRequirementsChecker
                password={formData.password}
                showRequirements={true}
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    errors.passwordConfirm
                      ? "ring-2 ring-red-300 border-red-300"
                      : ""
                  }`}
                  placeholder="Confirm Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-purple-600 transition-colors duration-200 cursor-pointer"
                >
                  {showPasswordConfirm ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.passwordConfirm && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </motion.button>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
                >
                  Sign in here
                </a>
              </p>
            </div>
          </motion.form>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full"
        >
          <MarketingIllustration />
        </motion.div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 right-16 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/3 right-8 w-16 h-16 border border-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
