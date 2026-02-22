"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../../api/axios";

const BlueprintPanel = ({
  projectId,
  onBlueprintSelect,
  selectedBlueprint,
}) => {
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchBlueprints();
    }
  }, [projectId]);

  const fetchBlueprints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/content-architecture/blueprint-information/${projectId}/`
      );
      if (response.data.success) {
        setBlueprints(response.data.data.blueprint_information);
      } else {
        setError("Failed to load blueprints.");
      }
    } catch (err) {
      setError("An error occurred while fetching blueprints.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    open: { opacity: 1, height: "auto" },
    closed: { opacity: 0, height: 0 },
  };

  return (
    <div className="border-t border-gray-200">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Layers size={16} />
          Page Templates
        </h3>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="overflow-y-auto">
              {loading && <div className="p-4">Loading...</div>}
              {error && <div className="p-4 text-red-500">{error}</div>}
              {!loading && !error && (
                <ul>
                  {blueprints.map((bp) => (
                    <li
                      key={bp.blueprint_id}
                      onClick={() => onBlueprintSelect(bp)}
                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 ${
                        selectedBlueprint?.blueprint_id === bp.blueprint_id
                          ? "bg-blue-50 text-blue-700"
                          : ""
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {bp.blueprint_type}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlueprintPanel;
