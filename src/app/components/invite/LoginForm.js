import React from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
} from "react-icons/fa";

export default function LoginForm({
  loginForm,
  showPassword,
  setShowPassword,
  handleInputChange,
  handleLogin,
  isProcessing,
}) {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      onSubmit={handleLogin}
      className="space-y-6"
    >
      {/* Email Field (readonly) */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaEnvelope className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={loginForm.email}
            readOnly
            className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-700 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaLock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={loginForm.password}
            onChange={(e) =>
              handleInputChange("login", "password", e.target.value)
            }
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none"
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
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg cursor-pointer"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Joining...</span>
          </div>
        ) : (
          <>
            <FaUserPlus className="mr-2" />
            Sign In & Join
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
