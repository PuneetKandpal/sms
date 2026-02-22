"use client";

import { useState, useEffect } from "react";
import { X, Users, Building2, Target, Lightbulb, Globe } from "lucide-react";
import { Button, Checkbox, FormControlLabel, Chip } from "@mui/material";
import { CREATE_OPPORTUNITY_AGENT_API } from "../../api/jbiAPI";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { useTaskMonitor } from "../../context/TaskMonitorContext";

const CheckboxSection = ({
  title,
  overview,
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
    red: "border-red-200 bg-red-50",
  };

  useEffect(() => {
    const allSelected =
      items.length > 0 && items.every((item) => selectedItems.includes(item));
    setSelectAll(allSelected);
  }, [items, selectedItems]);

  const handleSelectAllChange = () => {
    if (selectAll) {
      // Deselect all
      const newSelected = selectedItems.filter((item) => !items.includes(item));
      onSelectionChange(newSelected);
    } else {
      // Select all
      const newSelected = [...new Set([...selectedItems, ...items])];
      onSelectionChange(newSelected);
    }
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
          <div className="flex items-center gap-2">
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
                <span className="text-xs font-medium text-sky-600">
                  Select All
                </span>
              }
            />
          </div>
        </div>
      </div>

      {overview && (
        <div className="mb-3 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
          {overview}
        </div>
      )}

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
              label={<span className="text-sm text-gray-700">{item}</span>}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

function ProductsSection({
  title,
  items, // [{ name, keywords: [] }]
  selectedItems,
  onSelectionChange,
  icon: Icon,
}) {
  const [selectAll, setSelectAll] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const allSelected =
      items.length > 0 && items.every((p) => selectedItems.includes(p.name));
    setSelectAll(allSelected);
  }, [items, selectedItems]);

  const toggleAll = () => {
    if (selectAll) {
      const newSelected = selectedItems.filter(
        (item) => !items.map((p) => p.name).includes(item)
      );
      onSelectionChange(newSelected);
    } else {
      const newSelected = [
        ...new Set([...selectedItems, ...items.map((p) => p.name)]),
      ];
      onSelectionChange(newSelected);
    }
  };

  const toggleItem = (name, checked) => {
    if (checked) {
      onSelectionChange([...selectedItems, name]);
    } else {
      onSelectionChange(selectedItems.filter((i) => i !== name));
    }
  };

  const toggleExpand = (name) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`border rounded-lg p-4 bg-sky-50 border-sky-200`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectAll}
              onChange={toggleAll}
              size="small"
              sx={{ color: "#a855f7", "&.Mui-checked": { color: "#a855f7" } }}
            />
          }
          label={
            <span className="text-xs font-medium text-sky-600">
              Select All
            </span>
          }
        />
      </div>

      <div className="space-y-2">
        {items.map((product) => (
          <div
            key={product.name}
            className="rounded-md border border-sky-200 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedItems.includes(product.name)}
                    onChange={(e) => toggleItem(product.name, e.target.checked)}
                    size="small"
                    sx={{
                      color: "#a855f7",
                      "&.Mui-checked": { color: "#a855f7" },
                    }}
                  />
                }
                label={
                  <span className="text-sm font-medium text-gray-800">
                    {product.name}
                  </span>
                }
              />

              <button
                type="button"
                onClick={() => toggleExpand(product.name)}
                className="text-xs text-sky-600 hover:text-sky-700"
              >
                {expanded[product.name] ? "Hide keywords" : "Show keywords"}
              </button>
            </div>

            {expanded[product.name] && product.keywords?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.keywords.map((kw, idx) => (
                  <Chip
                    key={idx}
                    label={kw}
                    size="small"
                    sx={{
                      backgroundColor: "#f3e8ff",
                      color: "#6b21a8",
                      "& .MuiChip-label": {
                        paddingLeft: "6px",
                        paddingRight: "6px",
                      },
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentConfigurationModal({
  isOpen,
  onClose,
  onSave,
  agent,
  companyResearchData,
  projectId,
  userId,
  orgId,
}) {
  const { instantRefreshAfterTaskStart } = useTaskMonitor();
  const [formData, setFormData] = useState({
    name: "",
    instructions: "",
    status: "active",
    notifications: true,
    industries: [],
    buyer_personas: [],
    products_and_services: [],
    target_markets: [],
    differentiators: [],
    overview: "",
  });

  console.log("companyResearchData --------->", companyResearchData);

  const [availableData, setAvailableData] = useState({
    industries: { overview: "", list: [] },
    buyer_personas: { overview: "", list: [] },
    products_and_services: { items: [] },
    target_markets: { overview: "", list: [] },
    differentiators: { overview: "", list: [] },
    context_blocks: [],
  });

  // Initialize form data when modal opens or agent changes
  useEffect(() => {
    if (agent) {
      console.log("Agent data for editing:", agent);

      // Handle API response structure - agent data comes from request_data
      const requestData = agent.request_data || {};

      setFormData({
        name: agent.agent_name || agent.name || "",
        instructions:
          requestData.additional_instructions ||
          agent.config?.instructions ||
          "",
        status: agent.status || "active",
        notifications: agent.notifications || true,
        industries: requestData.industries || agent.config?.industries || [],
        buyer_personas:
          requestData.buyer_persona || agent.config?.buyer_personas || [],
        products_and_services:
          requestData.products_and_services ||
          agent.config?.products_and_services ||
          [],
        target_markets:
          requestData.target_markets || agent.config?.target_markets || [],
        differentiators:
          requestData.differentiators || agent.config?.differentiators || [],
        overview: agent.overview || "",
      });
    } else {
      setFormData({
        name: "",
        instructions: "",
        status: "active",
        notifications: true,
        industries: [],
        buyer_personas: [],
        products_and_services: [],
        target_markets: [],
        differentiators: [],
        overview: "",
      });
    }
  }, [agent]);

  // Process company research data
  useEffect(() => {
    if (companyResearchData) {
      const processed = {
        industries: {
          overview: companyResearchData.industries?.overview || "",
          list: companyResearchData.industries?.list || [],
        },
        buyer_personas: {
          overview: companyResearchData.buyer_personas?.overview || "",
          list: companyResearchData.buyer_personas?.list || [],
        },
        products_and_services: { items: [] },
        target_markets: {
          overview: companyResearchData.target_markets?.overview || "",
          list: companyResearchData.target_markets?.list || [],
        },
        differentiators: {
          overview: companyResearchData.differentiators?.overview || "",
          list: companyResearchData.differentiators?.list || [],
        },
        context_blocks: [],
        overview: companyResearchData.Overview || "",
      };

      const pas = companyResearchData.products_and_services;
      if (pas && typeof pas === "object" && !Array.isArray(pas)) {
        processed.products_and_services.items = Object.keys(pas).map(
          (name) => ({
            name,
            keywords: Array.isArray(pas[name]?.keywords)
              ? pas[name].keywords
              : Array.isArray(pas[name])
              ? pas[name]
              : [],
          })
        );
      } else if (Array.isArray(pas)) {
        processed.products_and_services.items = pas.map((name) => ({
          name,
          keywords: [],
        }));
      }

      const geo = companyResearchData.geo_leo_strategy;
      if (geo) {
        const blocks = [];
        if (geo.seo_strategy) {
          blocks.push({
            title: "SEO Strategy",
            groups: [
              {
                label: "Industry Modifiers",
                items: geo.seo_strategy.industry_modifiers || [],
              },
              {
                label: "Location Terms",
                items: geo.seo_strategy.location_based_terms || [],
              },
              {
                label: "Problem Language",
                items: geo.seo_strategy.problem_language || [],
              },
              {
                label: "Recommended Keywords",
                items: geo.seo_strategy.recommended_keyword_combinations || [],
              },
            ],
          });
        }
        if (geo.llm_optimization) {
          blocks.push({
            title: "LLM Optimization",
            groups: [
              {
                label: "Prompt Patterns",
                items: geo.llm_optimization.prompt_patterns || [],
              },
            ],
          });
        }
        processed.context_blocks = blocks;
      }

      setAvailableData(processed);
    }
  }, [companyResearchData]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter an agent name");
      return;
    }

    if (!projectId || !userId || !orgId) {
      toast.error("Missing required project or user information");
      return;
    }

    // Validate at least one selection in each category
    const hasSelections =
      formData.industries.length > 0 ||
      formData.buyer_personas.length > 0 ||
      formData.products_and_services.length > 0 ||
      formData.target_markets.length > 0;

    if (!hasSelections) {
      toast.error("Please select at least one monitoring target");
      return;
    }

    setIsLoading(true);

    try {
      if (agent) {
        // Update existing agent via API
        const requestData = {
          project_id: projectId,
          agent_id: agent.id,
          agent_name: formData.name.trim(),
          request_data: {
            products_and_services: formData.products_and_services,
            target_markets: formData.target_markets,
            differentiators: formData.differentiators,
            buyer_persona: formData.buyer_personas,
            industries: formData.industries,
            additional_instructions: formData.instructions.trim(),
          },
        };

        const response = await api.put(
          "/opportunity-agent/update-agent/",
          requestData
        );

        if (response.data?.success) {
          toast.success("Agent updated successfully!");
          onSave({
            ...agent,
            agent_name: formData.name.trim(),
            request_data: requestData.request_data,
          });
        } else {
          throw new Error(response.data?.message || "Failed to update agent");
        }
      } else {
        // Create new agent via API
        const requestData = {
          user_id: userId,
          org_id: orgId,
          project_id: projectId,
          agent_name: formData.name.trim(),
          overview: companyResearchData.Overview || "",
          industries: formData.industries,
          buyer_persona: formData.buyer_personas,
          products_and_services: formData.products_and_services,
          target_markets: formData.target_markets,
          differentiators: formData.differentiators,
          additional_instructions: formData.instructions.trim(),
        };

        const response = await api.post(
          "/opportunity-agent/opportunity-agent-pipeline/",
          {
            project_id: projectId,
            agent_name: formData.name.trim(),
            overview: companyResearchData.Overview || "",
            industries: formData.industries,
            buyer_persona: formData.buyer_personas,
            products_and_services: formData.products_and_services,
            target_markets: formData.target_markets,
            differentiators: formData.differentiators,
            additional_instructions: formData.instructions.trim(),
          }
        );

        console.log("response --------->", response);

        if (!response.data.success) {
          const errorData = await response.data;
          throw new Error(errorData.message || "Failed to create agent");
        }

        const data = await response.data;

        if (data.success) {
          toast.success(
            "Agent created successfully! Processing will begin shortly."
          );
          instantRefreshAfterTaskStart?.();
          onSave(data); // Pass the API response to parent
        } else {
          throw new Error(data.message || "Failed to create agent");
        }
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error(error.message || "Failed to save agent. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              {agent ? "Edit Agent" : "Create New Agent"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Configure monitoring targets and instructions for your opportunity
              agent. The agent will continuously scan for relevant business
              opportunities based on your selections.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 ">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Manufacturing Equipment Agent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-lg font-semibold"
                  required
                />
              </div>
              <div className="flex gap-4 pt-7">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        handleInputChange(
                          "status",
                          e.target.checked ? "active" : "paused"
                        )
                      }
                      size="small"
                      sx={{
                        padding: "10px",
                        color: "#a855f7",
                        "&.Mui-checked": { color: "#a855f7" },
                      }}
                    />
                  }
                  label={
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.notifications}
                      onChange={(e) =>
                        handleInputChange("notifications", e.target.checked)
                      }
                      size="small"
                      sx={{
                        color: "#a855f7",
                        "&.Mui-checked": { color: "#a855f7" },
                      }}
                    />
                  }
                  label={
                    <span className="text-sm font-medium text-gray-700">
                      Notifications
                    </span>
                  }
                />
              </div>
            </div>

            {/* Overview Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Overview
                <span className="text-xs text-gray-500 ml-2">
                  (Auto-populated from company data)
                </span>
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                {companyResearchData?.Overview || "No overview available"}
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Instructions
                <span className="text-xs text-gray-500 ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) =>
                  handleInputChange("instructions", e.target.value)
                }
                placeholder="Focus on private equity deals over $5MM. Monitor for companies with recent funding rounds or new equipment acquisitions. Alert on competitor mentions and equipment sale-leaseback opportunities."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide specific instructions to customize how this agent
                monitors for opportunities
              </p>
            </div>

            {/* Monitoring Targets */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Monitoring Targets
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose what the agent should monitor for opportunities
                  </p>
                </div>
              </div>

              {!companyResearchData ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span className="text-yellow-800 font-medium">
                      No company research data available
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    Please ensure your project has company research data to
                    configure monitoring targets.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <CheckboxSection
                    title="Industries"
                    overview={availableData.industries.overview}
                    items={availableData.industries.list}
                    selectedItems={formData.industries}
                    onSelectionChange={(selected) =>
                      handleInputChange("industries", selected)
                    }
                    icon={Building2}
                    color="blue"
                  />

                  <CheckboxSection
                    title="Buyer Personas"
                    overview={availableData.buyer_personas.overview}
                    items={availableData.buyer_personas.list}
                    selectedItems={formData.buyer_personas}
                    onSelectionChange={(selected) =>
                      handleInputChange("buyer_personas", selected)
                    }
                    icon={Users}
                    color="green"
                  />

                  <ProductsSection
                    title="Products & Services"
                    items={availableData.products_and_services.items}
                    selectedItems={formData.products_and_services}
                    onSelectionChange={(selected) =>
                      handleInputChange("products_and_services", selected)
                    }
                    icon={Lightbulb}
                  />

                  <CheckboxSection
                    title="Target Markets"
                    overview={availableData.target_markets.overview}
                    items={availableData.target_markets.list}
                    selectedItems={formData.target_markets}
                    onSelectionChange={(selected) =>
                      handleInputChange("target_markets", selected)
                    }
                    icon={Target}
                    color="orange"
                  />

                  <CheckboxSection
                    title="Differentiators"
                    overview={availableData.differentiators.overview}
                    items={availableData.differentiators.list}
                    selectedItems={formData.differentiators}
                    onSelectionChange={(selected) =>
                      handleInputChange("differentiators", selected)
                    }
                    icon={Globe}
                    color="red"
                  />

                  {/* {availableData.context_blocks.length > 0 && (
                    <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
                      <div className="font-medium text-gray-900 mb-2">
                        Additional Context (Read-only)
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        These insights can help you tune your agent
                        configuration.
                      </div>
                      <div className="space-y-3">
                        {availableData.context_blocks.map((block, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-gray-200 bg-white p-3"
                          >
                            <div className="text-sm font-semibold text-gray-800 mb-2">
                              {block.title}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {block.groups.map((grp, gidx) => (
                                <div key={gidx}>
                                  <div className="text-xs font-medium text-gray-700 mb-1">
                                    {grp.label}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(grp.items || []).map((it, k) => (
                                      <Chip
                                        key={k}
                                        label={it}
                                        size="small"
                                        sx={{
                                          backgroundColor: "#f3f4f6",
                                          color: "#374151",
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {!agent && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Agent will start processing immediately after creation
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
              disabled={isLoading}
              sx={{
                textTransform: "none",
                borderColor: "#e5e7eb",
                color: "#374151",
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f3f4f6",
                },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{
                textTransform: "none",
                backgroundColor: "#a855f7",
                "&:hover": { backgroundColor: "#9333EA" },
                "&:disabled": { backgroundColor: "#d1d5db" },
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                minWidth: "140px",
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {agent ? "Updating..." : "Creating..."}
                </div>
              ) : agent ? (
                "Update Agent"
              ) : (
                "Create Agent"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
