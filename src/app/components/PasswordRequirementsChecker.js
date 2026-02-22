"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaTimes } from "react-icons/fa";

/**
 * PasswordRequirementsChecker
 * Shows password strength meter and detailed requirements
 * Props:
 *  - password (string): password to evaluate
 *  - showRequirements (boolean): whether to show detailed requirements list
 */
export default function PasswordRequirementsChecker({
  password = "",
  showRequirements = true,
}) {
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isLongEnough: false,
  });

  // Password requirements checker
  const checkRequirements = (pwd) => {
    const reqs = {
      minLength: pwd.length >= 8,
      hasLowercase: /[a-z]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[^A-Za-z0-9]/.test(pwd),
      isLongEnough: pwd.length >= 12,
    };
    return reqs;
  };

  // Calculate strength score (0-6)
  const calculateStrength = (pwd, reqs) => {
    if (!pwd) return 0;

    let score = 0;
    if (reqs.minLength) score++;
    if (reqs.hasLowercase) score++;
    if (reqs.hasUppercase) score++;
    if (reqs.hasNumber) score++;
    if (reqs.hasSpecialChar) score++;
    if (reqs.isLongEnough) score++;

    return score;
  };

  useEffect(() => {
    const reqs = checkRequirements(password);
    const strengthScore = calculateStrength(password, reqs);

    setRequirements(reqs);
    setStrength(strengthScore);
  }, [password]);

  // Color palette for strength levels
  const getColor = () => {
    if (strength <= 2) return "#f87171"; // red
    if (strength <= 3) return "#facc15"; // yellow
    if (strength <= 4) return "#60a5fa"; // blue
    return "#34d399"; // green
  };

  const getStrengthLabel = () => {
    if (strength === 0) return "";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  const requirementsList = [
    {
      key: "minLength",
      label: "At least 8 characters",
      met: requirements.minLength,
    },
    {
      key: "hasLowercase",
      label: "One lowercase letter",
      met: requirements.hasLowercase,
    },
    {
      key: "hasUppercase",
      label: "One uppercase letter",
      met: requirements.hasUppercase,
    },
    { key: "hasNumber", label: "One number", met: requirements.hasNumber },
    {
      key: "hasSpecialChar",
      label: "One special character",
      met: requirements.hasSpecialChar,
    },
    {
      key: "isLongEnough",
      label: "12+ characters (recommended)",
      met: requirements.isLongEnough,
      optional: true,
    },
  ];

  return (
    <div className="mt-3 w-full">
      {/* Strength Meter Bars */}
      <div className="flex justify-between space-x-1 mb-2">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.2, scaleX: 0.5 }}
            animate={{
              opacity: i < strength ? 1 : 0.3,
              scaleX: i < strength ? 1 : 0.7,
              backgroundColor: i < strength ? getColor() : "#e5e7eb",
            }}
            transition={{ duration: 0.3 }}
            className="h-2 flex-1 rounded-full"
          />
        ))}
      </div>

      {/* Strength Label */}
      {password && (
        <div className="text-xs font-medium mb-3" style={{ color: getColor() }}>
          Password Strength: {getStrengthLabel()}
        </div>
      )}

      {/* Requirements List */}
      {showRequirements && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          <div className="text-xs font-medium text-gray-700 mb-2">
            Password Requirements:
          </div>
          {requirementsList.map((req) => {
            const unmetColor = req.optional ? "text-gray-500" : "text-red-500";
            const unmetIconBg = req.optional ? "bg-gray-100" : "bg-red-50";
            const unmetIconColor = req.optional
              ? "text-gray-400"
              : "text-red-500";

            return (
              <motion.div
                key={req.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center space-x-2 text-xs ${
                  req.met ? "text-green-600" : unmetColor
                }`}
              >
                <div
                  className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                    req.met ? "bg-green-100" : unmetIconBg
                  }`}
                >
                  {req.met ? (
                    <FaCheck className="w-2 h-2 text-green-600" />
                  ) : (
                    <FaTimes className={`w-2 h-2 ${unmetIconColor}`} />
                  )}
                </div>
                <span className={req.met ? "font-medium" : ""}>
                  {req.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
