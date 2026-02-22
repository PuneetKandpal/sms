"use client";

import React from "react";
import { CircularProgress } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Reusable Loading Button Component
 * Handles loading states, disabled states, and visual feedback
 *
 * Usage:
 * <LoadingButton
 *   onClick={handleClick}
 *   isLoading={isLoading}
 *   disabled={isDisabled}
 *   variant="primary" | "secondary" | "danger"
 *   size="sm" | "md" | "lg"
 *   icon={<IconComponent />}
 * >
 *   Button Text
 * </LoadingButton>
 */

export default function LoadingButton({
  onClick,
  isLoading = false,
  disabled = false,
  children,
  className = "",
  variant = "primary",
  size = "md",
  icon = null,
  loadingText = "Loading...",
  fullWidth = false,
  type = "button",
  ...props
}) {
  // Determine base classes based on variant
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white",
    danger: "bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white",
    success: "bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white",
    warning:
      "bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white",
    purple:
      "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white",
    ghost:
      "bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-700",
  };

  // Determine size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${isLoading || disabled ? "cursor-not-allowed" : "cursor-pointer"}
    ${fullWidth ? "w-full" : ""}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${className}
  `;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={baseClasses}
      whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      {...props}
    >
      {isLoading ? (
        <>
          <CircularProgress
            size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
            color="inherit"
          />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
}
