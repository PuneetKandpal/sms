"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { loginUser } from "../utils/authService";

// Marketing-focused SVG Component
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

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time email validation
    if (name === "email") {
      setEmailError("");
      if (value && !isValidEmail(value)) {
        setEmailError("Please enter a valid email address");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("handleSubmit called");

      if (!formData.email || !formData.password) {
        toast.error("Please fill in all fields");
        return false;
      }

      if (!isValidEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        setEmailError("Please enter a valid email address");
        return false;
      }

      setIsLoading(true);

      try {
        const result = await loginUser(formData.email, formData.password);

        console.log("Login result:", result);

        if (result.success) {
          toast.success("Login successful!");
          router.push("/");
        } else {
          toast.error(result.error || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }

      return false;
    } catch (error) {
      console.error("handleSubmit error:", error);
      toast.error("An error occurred while processing your request.");
      setIsLoading(false);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
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
              Login
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 text-lg"
            >
              Way to get started with your marketing journey...
            </motion.p>
          </div>

          {/* Login Form - Using div instead of form to prevent page refresh */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Email Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
                    emailError ? "ring-2 ring-red-300 border-red-300" : ""
                  }`}
                  placeholder="Email"
                  required
                />
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
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
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-purple-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" // Changed from submit to button
              onClick={handleSubmit} // Changed from onSubmit to onClick
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Login Now"
              )}
            </motion.button>

            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <a
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200 cursor-pointer"
              >
                Forgot your password?
              </a>
            </div>

            {/* Register Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
                >
                  Sign up here
                </a>
              </p>
            </div>
          </motion.div>
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
