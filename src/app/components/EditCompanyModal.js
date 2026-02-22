"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaBuilding, FaSave, FaSpinner } from "react-icons/fa";

export default function EditCompanyModal({ isOpen, onClose, company, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && company) {
      setName(company.name || "");
      setDescription(company.description || "");
      setError("");
    }
  }, [isOpen, company]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await onSave({
        name: name.trim(),
        description: description.trim(),
      });
      if (res?.success) onClose();
      else setError(res?.error || "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !company) return null;

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
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/15 rounded-lg">
                  <FaBuilding className="text-primary" size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Edit Company
                  </h2>
                  <p className="text-sm text-gray-600">Update basic details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                className={`w-full px-4 py-3 rounded-xl border ${
                  error ? "border-red-300" : "border-gray-200"
                } focus:ring-2 focus:ring-primary focus:border-transparent`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Company description"
              />
            </div>
            {!!error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
