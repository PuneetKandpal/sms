import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import MarketingIllustration from "./MarketingIllustration";

export default function ErrorState({ error }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 text-lg mb-8">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 cursor-pointer"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        <MarketingIllustration />
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
