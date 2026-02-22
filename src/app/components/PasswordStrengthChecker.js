"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * PasswordStrengthMeter
 * Displays 6 animated horizontal bars based on password strength.
 * Props:
 *  - password (string): password to evaluate
 */
export default function PasswordStrengthMeter({ password = "" }) {
  const [strength, setStrength] = useState(0);

  // 🔍 Complex password strength evaluator
  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return 0;

    // 1️⃣ Length scoring
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;

    // 2️⃣ Character variety
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    // Cap score at 6
    return Math.min(score, 6);
  };

  useEffect(() => {
    setStrength(calculateStrength(password));
  }, [password]);

  // 🎨 Color palette for strength levels
  const getColor = () => {
    if (strength <= 2) return "#f87171"; // red
    if (strength <= 3) return "#facc15"; // yellow
    if (strength <= 4) return "#60a5fa"; // blue
    return "#34d399"; // green
  };

  return (
    <div className="mt-3 w-full">
      {/* Bars */}
      <div className="flex justify-between space-x-1">
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
          ></motion.div>
        ))}
      </div>

      {/* Strength label */}
      <div className="text-xs text-gray-600 mt-1 font-medium">
        {strength === 0
          ? ""
          : strength <= 2
          ? "Weak"
          : strength <= 3
          ? "Fair"
          : strength <= 4
          ? "Strong"
          : "Very Strong"}
      </div>
    </div>
  );
}
