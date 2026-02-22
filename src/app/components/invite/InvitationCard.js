import React from "react";
import { motion } from "framer-motion";
import { FaBuilding } from "react-icons/fa";

export default function InvitationCard({ invitationData }) {
  if (!invitationData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 p-6 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-100"
    >
      <div className="flex items-center mb-3">
        <FaBuilding className="text-sky-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          {invitationData.invitation.company_name}
        </h3>
      </div>
      <p className="text-gray-600 text-sm mb-2">
        <span className="font-medium">Role:</span>{" "}
        {invitationData.invitation.role}
      </p>
      <p className="text-gray-600 text-sm">
        <span className="font-medium">Invited by:</span>{" "}
        {invitationData.invitation.invited_by}
      </p>
    </motion.div>
  );
}
