"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FolderTree,
  Loader,
  Sparkles,
  Building2,
  Users,
  Target,
} from "lucide-react";
import { Button, Checkbox, FormControlLabel } from "@mui/material";

const CheckboxSection = ({
  title,
  items,
  selectedItems,
  onSelectionChange,
  icon: Icon,
  color = "blue",
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    sky: "border-sky-200 bg-sky-50",
    orange: "border-orange-200 bg-orange-50",
  };

  const handleSelectAllChange = () => {
    if (selectAll) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...items]);
    }
    setSelectAll(!selectAll);
  };

  const handleItemChange = (item, checked) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter((i) => i !== item));
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {items.length} available
          </span>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAllChange}
                size="small"
                sx={{
                  color: "#a855f7",
                  "&.Mui-checked": { color: "#a855f7" },
                }}
              />
            }
            label={
              <span className="text-xs font-medium text-sky-600 cursor-pointer">
                Select All
              </span>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onChange={(e) => handleItemChange(item, e.target.checked)}
                  size="small"
                  sx={{
                    color: "#a855f7",
                    "&.Mui-checked": { color: "#a855f7" },
                  }}
                />
              }
              label={
                <span className="text-sm text-gray-700 cursor-pointer">
                  {item}
                </span>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CreateArchitectModal({
  isOpen,
  onClose,
  onCreate,
  companyData,
}) {
  const [formData, setFormData] = useState({
    name: "",
    industries: [],
    targetMarkets: [],
    contentTypes: [],
  });
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual company data
  const availableOptions = {
    industries: companyData?.industries?.list || [
      "Manufacturing Equipment",
      "Industrial Machinery",
      "Food Processing",
      "Construction Equipment",
    ],
    targetMarkets: companyData?.target_markets?.list || [
      "Small Businesses (1-50 employees)",
      "Mid-Market (51-500 employees)",
      "Enterprise (500+ employees)",
    ],
    contentTypes: [
      "Blog Posts",
      "How-To Guides",
      "Product Comparisons",
      "Case Studies",
      "Video Tutorials",
      "Whitepapers",
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      // API call will be made here
      await onCreate(formData.name.trim(), formData);
      setFormData({
        name: "",
        industries: [],
        targetMarkets: [],
        contentTypes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <FolderTree className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        Create Content Architect
                        <Sparkles className="h-5 w-5" />
                      </h2>
                      <p className="text-sky-100 text-sm mt-1">
                        Build your content strategy structure
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6"
              >
                <div className="space-y-6">
                  {/* Architect Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Architect Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Main Website Content Architecture"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-lg font-semibold"
                      autoFocus
                    />
                  </div>

                  {/* Selection Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Content Strategy Targets
                        </h3>
                        <p className="text-sm text-gray-600">
                          Select what content the architecture should cover
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <CheckboxSection
                        title="Industries"
                        items={availableOptions.industries}
                        selectedItems={formData.industries}
                        onSelectionChange={(selected) =>
                          setFormData({ ...formData, industries: selected })
                        }
                        icon={Building2}
                        color="blue"
                      />

                      <CheckboxSection
                        title="Target Markets"
                        items={availableOptions.targetMarkets}
                        selectedItems={formData.targetMarkets}
                        onSelectionChange={(selected) =>
                          setFormData({ ...formData, targetMarkets: selected })
                        }
                        icon={Users}
                        color="green"
                      />

                      <CheckboxSection
                        title="Content Types"
                        items={availableOptions.contentTypes}
                        selectedItems={formData.contentTypes}
                        onSelectionChange={(selected) =>
                          setFormData({ ...formData, contentTypes: selected })
                        }
                        icon={FolderTree}
                        color="sky"
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <div className="text-sm text-blue-900 leading-relaxed">
                        <strong className="font-semibold">
                          AI-Powered Generation:
                        </strong>{" "}
                        The system will automatically call an API to generate
                        your hierarchical content structure based on your
                        project data and selections. This usually takes 10-30
                        seconds.
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Architecture will be generated immediately</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={onClose}
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      borderColor: "#e5e7eb",
                      color: "#374151",
                      "&:hover": {
                        borderColor: "#d1d5db",
                        backgroundColor: "#f3f4f6",
                        cursor: "pointer",
                      },
                      "&:disabled": { opacity: 0.5 },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!formData.name.trim() || loading}
                    sx={{
                      textTransform: "none",
                      backgroundColor: "#a855f7",
                      "&:hover": {
                        backgroundColor: "#9333EA",
                        cursor: "pointer",
                      },
                      "&:disabled": { backgroundColor: "#d1d5db" },
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      minWidth: "160px",
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      "Create Architect"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
