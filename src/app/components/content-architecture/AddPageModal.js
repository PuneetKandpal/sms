"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import { Close, Add } from "@mui/icons-material";
import api from "../../../api/axios";
import toast from "react-hot-toast";

export default function AddPageModal({
  isOpen,
  onClose,
  parentPageId,
  projectId,
  onPageAdded,
  parentPageName,
  parentPageUrl,
}) {
  const [formData, setFormData] = useState({
    page_title: "",
    url: "",
    content_brief: "",
    blueprint_letter: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageTemplates, setPageTemplates] = useState([]);
  const [fetchingTemplates, setFetchingTemplates] = useState(false);

  // Fetch blueprint information when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      fetchBlueprintInformation();
    }
  }, [isOpen, projectId]);

  // Reset child URL path when modal opens or parent changes
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        url: "",
      }));
    }
  }, [isOpen, parentPageUrl]);

  const buildFullUrl = (base, childRaw) => {
    let childPath = (childRaw || "").trim();

    while (childPath.startsWith("/")) {
      childPath = childPath.slice(1);
    }

    let parent = base || "";
    if (parent) {
      if (!parent.startsWith("/")) {
        parent = "/" + parent;
      }
      if (!parent.endsWith("/")) {
        parent = parent + "/";
      }
    }

    let full = parent ? `${parent}${childPath}` : `/${childPath}`;

    if (!full.startsWith("/")) {
      full = "/" + full;
    }
    if (!full.endsWith("/")) {
      full = full + "/";
    }

    return full;
  };

  const fetchBlueprintInformation = async () => {
    setFetchingTemplates(true);
    try {
      const response = await api.get(
        `/content-architecture/blueprint-information/${projectId}/`
      );
      if (response.data.success) {
        setPageTemplates(response.data.data.blueprint_information || []);
        // Set default blueprint to first available option
        if (response.data.data.blueprint_information?.length > 0) {
          const firstBlueprint = response.data.data.blueprint_information[0];
          setFormData((prev) => ({
            ...prev,
            blueprint_letter: firstBlueprint.blueprint_id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching blueprint information:", error);
      toast.error("Failed to load page templates");
    } finally {
      setFetchingTemplates(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.page_title.trim()) {
      toast.error("Page title is required");
      return;
    }

    if (!formData.url.trim()) {
      toast.error("URL path is required");
      return;
    }

    // URL validation
    const urlPattern = /^[a-zA-Z0-9\-_\/]+$/;
    const childPathRaw = formData.url.trim();

    if (!urlPattern.test(childPathRaw)) {
      toast.error(
        "URL can only contain letters, numbers, hyphens, underscores, and forward slashes"
      );
      return;
    }

    if (!formData.blueprint_letter) {
      toast.error("Page template is required");
      return;
    }

    const formattedUrl = buildFullUrl(parentPageUrl, childPathRaw);

    setLoading(true);

    try {
      const response = await api.post(
        "/content-architecture/add-nested-page/",
        {
          parent_page_id: parentPageId,
          project_id: projectId,
          page_title: formData.page_title.trim(),
          url: formattedUrl,
          content_brief: formData.content_brief.trim(),
          blueprint_letter: formData.blueprint_letter,
        }
      );

      if (response.data.success) {
        // Reset form
        setFormData({
          page_title: "",
          url: "",
          content_brief: "",
          blueprint_letter: pageTemplates[0]?.blueprint_id || "",
        });
        onPageAdded();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to add page");
      }
    } catch (error) {
      console.error("Error adding page:", error);
      toast.error(error.response?.data?.error || "Failed to add page");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    // Don't close if loading or fetching templates
    if (loading || fetchingTemplates) return;
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="add-page-modal-title"
      aria-describedby="add-page-modal-description"
      disableEscapeKeyDown={loading || fetchingTemplates}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 500,
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #9333ea 0%, #2563eb 100%)",
            color: "white",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Add sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                Add New Page
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Child of: {parentPageName || "Root"}
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={handleClose}
            sx={{
              color: "white",
              minWidth: "auto",
              p: 1,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
            disabled={loading || fetchingTemplates}
          >
            <Close />
          </Button>
        </Box>

        {/* Modal Body */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 3,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Page Title */}
          <TextField
            fullWidth
            label="Page Title"
            value={formData.page_title}
            onChange={(e) => handleInputChange("page_title", e.target.value)}
            margin="normal"
            required
            disabled={loading}
            placeholder="Enter page title"
            sx={{ mb: 2 }}
          />

          {/* URL */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={parentPageUrl ? "Child URL Path" : "URL Path"}
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              margin="normal"
              required
              disabled={loading}
              placeholder={parentPageUrl ? "new-page/" : "new-page/"}
              InputProps={{
                sx: {
                  fontFamily: "monospace",
                  fontSize: 12,
                },
              }}
            />

            <FormHelperText sx={{ mt: 0.5 }}>
              {parentPageUrl
                ? formData.url.trim()
                  ? `Full URL: ${buildFullUrl(parentPageUrl, formData.url)}`
                  : `Parent: ${buildFullUrl(parentPageUrl, "")}`
                : formData.url.trim()
                ? `Full URL: ${buildFullUrl("", formData.url)}`
                : "URL will be automatically formatted to start and end with '/'"}
            </FormHelperText>
          </Box>

          {/* Page Template (Blueprint) */}
          <FormControl
            fullWidth
            margin="normal"
            required
            disabled={loading || fetchingTemplates}
            sx={{ mb: 2 }}
          >
            {!fetchingTemplates && (
              <InputLabel>Page Template (Blueprint)</InputLabel>
            )}
            {fetchingTemplates ? (
              <Select value="" displayEmpty disabled>
                <MenuItem value="">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">
                      Loading templates...
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            ) : pageTemplates.length > 0 ? (
              <Select
                value={formData.blueprint_letter}
                label="Page Template (Blueprint)"
                onChange={(e) =>
                  handleInputChange("blueprint_letter", e.target.value)
                }
              >
                {pageTemplates.map((template) => (
                  <MenuItem
                    key={template.blueprint_id}
                    value={template.blueprint_id}
                  >
                    {template.blueprint_type}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Select value="" displayEmpty disabled>
                <MenuItem value="">No templates found</MenuItem>
              </Select>
            )}
            <FormHelperText>
              Select the appropriate template for this page type
            </FormHelperText>
          </FormControl>

          {/* Content Brief */}
          <TextField
            fullWidth
            label="Content Brief *"
            value={formData.content_brief}
            onChange={(e) => handleInputChange("content_brief", e.target.value)}
            margin="normal"
            multiline
            rows={4}
            disabled={loading}
            placeholder="Brief description of the page content and purpose..."
            helperText="Optional: Describe the purpose and key content of this page"
            sx={{ mb: 2 }}
          />
        </Box>

        {/* Modal Footer */}
        <Box
          sx={{
            bgcolor: "grey.50",
            p: 3,
            display: "flex",
            gap: 2,
            justifyContent: "flex-end",
            borderTop: 1,
            borderColor: "grey.200",
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading || fetchingTemplates}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            variant="contained"
            disabled={
              loading ||
              fetchingTemplates ||
              !formData.page_title.trim() ||
              !formData.url.trim() ||
              !formData.blueprint_letter ||
              !formData.content_brief.trim().length
            }
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : <Add />
            }
            sx={{
              minWidth: 120,
              background: "linear-gradient(135deg, #9333ea 0%, #2563eb 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #7c3aed 0%, #1d4ed8 100%)",
              },
            }}
          >
            {loading ? "Adding..." : "Add Page"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
