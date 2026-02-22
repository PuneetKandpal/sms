import React from "react";
import { motion } from "framer-motion";

export default function LoadingState() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Checking invitation...</p>
      </motion.div>
    </div>
  );
}
