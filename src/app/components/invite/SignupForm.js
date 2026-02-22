import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
} from "react-icons/fa";
import PasswordRequirementsChecker from "../PasswordRequirementsChecker";

export default function SignupForm({
  signupForm,
  invitationData,
  showPassword,
  setShowPassword,
  showPasswordConfirm,
  setShowPasswordConfirm,
  handleInputChange,
  handleSignup,
  isProcessing,
  formErrors,
}) {
  const passwordRequirements = useMemo(() => {
    const pwd = signupForm.password || "";
    return {
      minLength: pwd.length >= 8,
      hasLowercase: /[a-z]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[^A-Za-z0-9]/.test(pwd),
      isLongEnough: pwd.length >= 12,
    };
  }, [signupForm.password]);

  const requiredPasswordConditionsMet =
    passwordRequirements.minLength &&
    passwordRequirements.hasLowercase &&
    passwordRequirements.hasUppercase &&
    passwordRequirements.hasNumber &&
    passwordRequirements.hasSpecialChar;

  const passwordsMatch =
    signupForm.password &&
    signupForm.passwordConfirm &&
    signupForm.password === signupForm.passwordConfirm;

  const allRequiredFieldsFilled = Boolean(
    signupForm.firstName?.trim() &&
      signupForm.lastName?.trim() &&
      signupForm.password &&
      signupForm.passwordConfirm
  );

  const isSignupDisabled =
    isProcessing ||
    !allRequiredFieldsFilled ||
    !requiredPasswordConditionsMet ||
    !passwordsMatch;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      onSubmit={handleSignup}
      className="space-y-6 overflow-y-auto"
    >
      {/* Email Field (readonly) */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaEnvelope className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={invitationData?.invitation?.email || ""}
            readOnly
            className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-700 cursor-not-allowed"
          />
        </div>
      </div>

      {/* First Name */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaUser className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={signupForm.firstName}
            onChange={(e) =>
              handleInputChange("signup", "firstName", e.target.value)
            }
            className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
              formErrors.firstName ? "ring-2 ring-red-300 border-red-300" : ""
            }`}
            placeholder="First Name"
            required
          />
        </div>
        {formErrors.firstName && (
          <p className="mt-2 text-sm text-red-600">{formErrors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaUser className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={signupForm.lastName}
            onChange={(e) =>
              handleInputChange("signup", "lastName", e.target.value)
            }
            className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
              formErrors.lastName ? "ring-2 ring-red-300 border-red-300" : ""
            }`}
            placeholder="Last Name"
            required
          />
        </div>
        {formErrors.lastName && (
          <p className="mt-2 text-sm text-red-600">{formErrors.lastName}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaLock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={signupForm.password}
            onChange={(e) =>
              handleInputChange("signup", "password", e.target.value)
            }
            className={`w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
              formErrors.password ? "ring-2 ring-red-300 border-red-300" : ""
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
        {formErrors.password && (
          <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
        )}
        <PasswordRequirementsChecker
          password={signupForm.password}
          showRequirements={true}
        />
      </div>

      {/* Confirm Password */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaLock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPasswordConfirm ? "text" : "password"}
            value={signupForm.passwordConfirm}
            onChange={(e) =>
              handleInputChange("signup", "passwordConfirm", e.target.value)
            }
            className={`w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none ${
              formErrors.passwordConfirm
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
        {formErrors.passwordConfirm && (
          <p className="mt-2 text-sm text-red-600">
            {formErrors.passwordConfirm}
          </p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isSignupDisabled}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg cursor-pointer"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Creating account...</span>
          </div>
        ) : (
          <>
            <FaUserPlus className="mr-2" />
            Create Account & Join
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
