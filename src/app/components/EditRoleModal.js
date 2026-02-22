"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaSave,
  FaSpinner,
  FaCrown,
  FaUserShield,
  FaUser,
} from "react-icons/fa";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", Icon: FaCrown },
  { value: "manager", label: "Manager", Icon: FaUserShield },
  { value: "employee", label: "Employee", Icon: FaUser },
];

export default function EditRoleModal({ isOpen, onClose, member, onSave }) {
  const [role, setRole] = useState("employee");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      const normalized = (member.permission || "employee").toLowerCase();
      setRole(normalized === "member" ? "employee" : normalized);
    }
  }, [isOpen, member]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const res = await onSave({ role });
      if (res?.success) onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Role</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6">
            <div className="space-y-2">
              {ROLE_OPTIONS.map(({ value, label, Icon }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="w-4 h-4 text-primary"
                  />
                  <Icon size={14} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <FaSpinner className="animate-spin" size={14} />
                ) : (
                  <FaSave size={14} />
                )}
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
