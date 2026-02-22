"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaLink,
  FaGlobe,
  FaYoutube,
  FaFileAlt,
} from "react-icons/fa";
import { FiSidebar, FiUpload } from "react-icons/fi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { RiYoutubeLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { MdOutlineContentPaste } from "react-icons/md";
import { IoIosLink } from "react-icons/io";
import { TbClipboardText } from "react-icons/tb";

import api from "../../api/axios";

/** Progress Circle Component **/
function ProgressCircle({ progress }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg width="50" height="50" className="transform -rotate-90">
          <circle
            cx="25"
            cy="25"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="25"
            cy="25"
            r={radius}
            stroke="#3b82f6"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}

/** Processing Status Modal **/
function ProcessingStatusModal({
  title,
  onCancel,
  progress = 0,
  statusText = "Processing...",
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Processing</h3>
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-2 truncate">{title}</p>
            <ProgressCircle progress={Math.round(progress)} />
          </div>
          <p className="text-gray-600 text-sm mb-4">{statusText}</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Backdrop for modals **/
function ModalBackdrop({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4">
        {children}
      </div>
    </div>
  );
}

/** Progress Simulation Helper **/
export function createProgressSimulation(type) {
  const configs = {
    file: {
      totalTime: 30000,
      stages: [
        { threshold: 20, multiplier: 0.7, text: "Uploading file..." },
        { threshold: 50, multiplier: 1.0, text: "Processing content..." },
        { threshold: 80, multiplier: 1.1, text: "Analyzing information..." },
        { threshold: 100, multiplier: 0.8, text: "Finalizing..." },
      ],
    },
    text: {
      totalTime: 15000,
      stages: [
        { threshold: 30, multiplier: 0.8, text: "Processing text..." },
        { threshold: 70, multiplier: 1.2, text: "Extracting information..." },
        { threshold: 100, multiplier: 0.9, text: "Finalizing..." },
      ],
    },
    website: {
      totalTime: 110000,
      stages: [
        { threshold: 20, multiplier: 0.7, text: "Connecting to website..." },
        { threshold: 40, multiplier: 1.2, text: "Extracting content..." },
        { threshold: 60, multiplier: 1.1, text: "Analyzing data..." },
        { threshold: 80, multiplier: 1.0, text: "Processing details..." },
        { threshold: 95, multiplier: 0.8, text: "Compiling insights..." },
        { threshold: 100, multiplier: 0.5, text: "Finalizing..." },
      ],
    },
  };

  const config = configs[type] || configs.text;
  const updateInterval = type === "website" ? 1000 : 500;
  const totalUpdates = config.totalTime / updateInterval;

  return { config, updateInterval, totalUpdates };
}

function AddSourcesModal({
  isOpen,
  onClose,
  onFileUpload,
  onShowText,
  onShowLink,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setSelectedFile(f);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleTextClick = () => {
    onClose(); // Close this modal first
    onShowText(); // Then open text modal
  };

  const handleLinkClick = (type) => {
    onClose(); // Close this modal first
    onShowLink(type); // Then open link modal
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !onFileUpload || isUploading) return;

    try {
      setIsUploading(true);
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Error during file upload from AddSourcesModal:", error);
      // onFileUpload is responsible for showing toasts; just close the modal
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Sources</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
            dragOver ? "border-primary bg-primary/10" : "border-gray-300"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <FiUpload className="text-4xl text-primary mx-auto mb-2" />
          <p>
            Drag & drop or{" "}
            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="cursor-pointer text-primary underline"
            >
              choose file
            </button>
          </p>
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,video/*,audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-sm mt-3 text-gray-400">
            Supported file types: .txt, Markdown, PDF
          </p>

          {selectedFile && (
            <div className="mt-4 flex items-center justify-between rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700">
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {selectedFile.name?.[0]?.toUpperCase() || "F"}
                </span>
                <div className="flex flex-col">
                  <span className="truncate max-w-[180px] font-medium">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {`${(selectedFile.size / 1024).toFixed(1)} KB`}
                  </span>
                </div>
              </div>
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUploading && (
                  <svg
                    className="animate-spin h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                <span>{isUploading ? "Uploading..." : "Upload"}</span>
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3 border border-gray-200 rounded-lg p-4">
            <p className="flex items-center gap-1">
              <MdOutlineContentPaste /> Paste Text
            </p>
            <button
              onClick={handleTextClick}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-200 rounded"
            >
              <FaFileAlt /> <span>Copied Text</span>
            </button>
          </div>

          <div className="space-y-3 border border-gray-200 rounded-lg p-4">
            <p className="flex items-center gap-1">
              <IoIosLink /> Link
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleLinkClick("website")}
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-200 rounded"
              >
                <FaGlobe /> <span>Website</span>
              </button>
              <button
                // onClick={() => handleLinkClick("youtube")}
                onClick={() => {
                  toast.success("Feature coming soon");
                }}
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-200 rounded"
              >
                <FaYoutube /> <span>YouTube</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function AddKeywordModal({ isOpen, onClose, onFileUpload, onShowText }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      onFileUpload(f);
      onClose();
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      onClose();
    }
  };

  const handleTextClick = () => {
    onClose();
    onShowText();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="w-full h-full bg-white rounded-none p-0 m-0 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-1 px-4 pt-4">
          <h2 className="text-lg font-semibold text-black">Add Keywords</h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-black font-medium mb-4 text-sm px-4">
          Keywords are used to generate marketing that matters to your goals.
        </p>

        {/* Upload Box */}
        <div className="mb-6 px-4">
          <div
            className={`w-full border-2 border-dashed rounded-xl px-6 pt-6 pb-14 text-center transition-all duration-300 ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <h3 className="text-2xl font-medium text-gray-800 mb-2">
              One Keyword per line
            </h3>

            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
              <FiUpload className="text-[28px] text-blue-600" />
            </div>

            <p className="text-lg font-bold text-black">Upload keywords</p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop or{" "}
              <button
                onClick={() => document.getElementById("fileInput").click()}
                className="text-blue-600 cursor-pointer hover:text-blue-700 underline font-medium"
              >
                choose file
              </button>{" "}
              to upload
            </p>

            <input
              id="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,video/*,audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <p className="text-sm font-medium text-black mt-4">
              Supported file types: .txt, .csv
            </p>
          </div>
        </div>

        {/* Paste Text Option */}
        <div className="w-full flex justify-center px-4">
          <div className="w-full space-y-3 border border-gray-200 rounded-xl p-4 text-center">
            <p className="flex items-center justify-center gap-2 font-medium text-gray-700">
              <MdOutlineContentPaste />
              Paste Text
            </p>
            <button
              onClick={handleTextClick}
              className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-purple-200 hover:bg-purple-300 transition rounded-lg"
            >
              <FaFileAlt />
              <span>Copied Text</span>
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function AddSourcesCompetitor({
  isOpen,
  onClose,
  onFileUpload,
  onShowText,
  onShowLink,
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      onFileUpload(f);
      onClose(); // Close the modal after file upload starts
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      onClose(); // Close the modal after file upload starts
    }
  };

  const handleTextClick = () => {
    onClose(); // Close this modal first
    onShowText(); // Then open text modal
  };

  const handleLinkClick = (type) => {
    onClose(); // Close this modal first
    onShowLink(type); // Then open link modal
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6 mx-auto">
        <div className="flex justify-between items-center mb-[8px]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Add Sources</h2>
            <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
              <IoIosLink className="text-purple-600" />
              <span className="text-purple-600 font-medium">Competitor</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-black text-[14px] font-medium mb-[13px]">
          Add competitor sources for our AI to find opportunities.
        </p>

        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center mb-8 transition-colors ${
            dragOver
              ? "border-purple-400 bg-purple-50"
              : "border-gray-200 bg-gray-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <FiUpload className="text-4xl text-[#9c07ff] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Upload sources
          </h3>
          <p className="text-gray-600 mb-4">
            Drag & drop or{" "}
            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="text-blue-500 cursor-pointer hover:text-blue-600 underline font-medium"
            >
              choose file
            </button>{" "}
            to upload
          </p>
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,video/*,audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-sm text-gray-500">
            Supported file types: .txt, Markdown, PDF
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3 border border-gray-200 rounded-lg p-4">
            <p className="flex items-center gap-1">
              <MdOutlineContentPaste />
            </p>
            <button
              onClick={handleTextClick}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-200 rounded"
            >
              <FaFileAlt /> <span>Copied Text</span>
            </button>
          </div>

          <div className="space-y-3 border border-gray-200 rounded-lg p-4">
            <p className="flex items-center gap-1">
              <IoIosLink /> Link
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleLinkClick("website")}
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-200 rounded"
              >
                <FaGlobe /> <span>Website</span>
              </button>
              <button
                disabled
                onClick={() => handleLinkClick("youtube")}
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-200 rounded"
              >
                <FaYoutube /> <span>YouTube</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/** Text Modal **/

function TextModal({
  isOpen,
  onClose,
  projectId,
  componentId,
  domainId,
  onAdd,
  isKeword,
  fetchKeywords = () => {},
  fetchSourceData = () => {},
  isCompanyResearchContext = false,
  onResearchTaskStarted,
  onOpenResearchTasksView,
}) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Processing text...");

  const isCompanyContextFlow = isCompanyResearchContext && !isKeword;

  // 👉 Custom popup state
  const [customPopupMessage, setCustomPopupMessage] = useState("");
  const [showCustomPopup, setShowCustomPopup] = useState(false);

  const simulateProgress = () => {
    const { config, updateInterval, totalUpdates } =
      createProgressSimulation("text");
    let currentUpdate = 0;

    const progressInterval = setInterval(() => {
      currentUpdate++;
      const baseProgress = (currentUpdate / totalUpdates) * 100;

      let newProgress = 0;
      let currentText = "Processing text...";

      for (let i = 0; i < config.stages.length; i++) {
        const stage = config.stages[i];
        const prevThreshold = i > 0 ? config.stages[i - 1].threshold : 0;

        if (baseProgress <= stage.threshold) {
          const stageProgress =
            ((baseProgress - prevThreshold) /
              (stage.threshold - prevThreshold)) *
            100;
          newProgress =
            prevThreshold +
            (stageProgress *
              stage.multiplier *
              (stage.threshold - prevThreshold)) /
              100;
          currentText = stage.text;
          break;
        }
      }

      setProgress(Math.min(newProgress, 99));
      setStatusText(currentText);

      if (currentUpdate >= totalUpdates) {
        clearInterval(progressInterval);
      }
    }, updateInterval);

    return progressInterval;
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter text");
      return;
    }

    setIsProcessing(true);

    let progressInterval = null;

    if (!isCompanyContextFlow) {
      setProgress(0);
      setStatusText("Initializing text processing...");
      progressInterval = simulateProgress();
    }

    try {
      if (isCompanyContextFlow) {
        const response = await api.post("/keyword-api/context-research/", {
          project_id: projectId,
          component_id: componentId,
          domain_id: domainId,
          context: text,
        });

        const d = response.data;

        if (onResearchTaskStarted) {
          onResearchTaskStarted({
            ...d,
            type: "context",
            source_type: "manual",
            origin: "manual_context",
            project_id: projectId,
            component_id: componentId,
            domain_id: domainId,
          });
        }

        setText("");
        onClose();

        toast.success(
          d?.message ||
            "Context research started. We'll update your project data when it's ready.",
        );

        if (onOpenResearchTasksView) {
          onOpenResearchTasksView();
        }
      } else {
        const API_URL = isKeword
          ? "/keyword-api/upload/context/"
          : "/api/add-context/";
        const response = await api.post(API_URL, {
          project_id: projectId,
          component_id: componentId,
          domain_id: domainId,
          context: text,
        });

        const d = response.data;

        setProgress(100);
        setStatusText("Text processed successfully!");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onAdd({
          id: d.file_name,
          source_type: "manual",
          source_content: d.content,
          file_name: d.file_name,
          likes: 0,
        });

        setText("");
        onClose();
        fetchSourceData();
        fetchKeywords();

        setCustomPopupMessage(d?.message || "Text added successfully");
        setShowCustomPopup(true);
        setTimeout(() => setShowCustomPopup(false), 10000);
      }
    } catch (e) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error(e);

      let errorMessage = "Text upload failed";

      const responseData = e && e.response ? e.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage =
            responseData.message ||
            responseData.error ||
            responseData.action_required ||
            errorMessage;
        }
      } else if (e && e.message) {
        errorMessage = e.message;
      }

      if (isCompanyContextFlow) {
        toast.error(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsProcessing(false);

      if (!isCompanyContextFlow) {
        setProgress(0);
        setStatusText("Processing text...");
      }
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setText("");
    setProgress(0);
    setStatusText("Processing text...");
    onClose();
  };

  return (
    <>
      <ModalBackdrop
        isOpen={isCompanyContextFlow ? isOpen : isOpen && !isProcessing}
        onClose={onClose}
      >
        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 cursor-pointer hover:text-black text-[30px]"
            aria-label="Close"
          >
            &times;
          </button>

          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-semibold">Paste Text </h2>
            <span className="text-gray-500 text-sm">
              (values must be in comma seperated format)
            </span>
          </div>
          <textarea
            rows={6}
            className="w-full border p-2 rounded mb-4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
          />
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="cursor-pointer px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCompanyContextFlow && isProcessing && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            <span>
              {isCompanyContextFlow && isProcessing ? "Starting..." : "Upload"}
            </span>
          </button>
        </div>
      </ModalBackdrop>

      {isProcessing && !isCompanyContextFlow && (
        <ProcessingStatusModal
          title="Processing text content..."
          onCancel={handleCancel}
          progress={progress}
          statusText={statusText}
        />
      )}

      {/* ✅ Custom Centered Popup */}
      {showCustomPopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#e6ffed",
            color: "#065f46",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: "300px",
            maxWidth: "90%",
          }}
        >
          <span style={{ flex: 1 }}>{customPopupMessage}</span>
          <button
            onClick={() => setShowCustomPopup(false)}
            style={{
              marginLeft: "16px",
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#065f46",
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default TextModal;

/** URL Validation Helper **/
const validateUrl = (url) => {
  url = url.trim();

  if (!url) {
    return { isValid: false, error: "Please enter a URL" };
  }

  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const urlObj = new URL(url);

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { isValid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    if (!urlObj.hostname || urlObj.hostname === "") {
      return { isValid: false, error: "Please enter a valid domain name" };
    }

    const domainPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainPattern.test(urlObj.hostname)) {
      return { isValid: false, error: "Please enter a valid domain name" };
    }

    if (
      urlObj.hostname.includes("youtube.") ||
      urlObj.hostname.includes("youtu.be")
    ) {
      if (!urlObj.pathname && !urlObj.search) {
        return { isValid: false, error: "Please enter a complete YouTube URL" };
      }
    }

    return { isValid: true, validUrl: url };
  } catch (error) {
    return {
      isValid: false,
      error: "Please enter a valid URL format (e.g., https://example.com)",
    };
  }
};

/** Link Modal **/
function LinkModal({
  isOpen,
  onClose,
  onAdd,
  linkType,
  projectId,
  componentId,
  domainId,
  onResearchTaskStarted,
  onOpenResearchTasksView,
}) {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingUrl, setProcessingUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing processing...");
  const abortControllerRef = useRef(null);

  const isAsyncResearchFlow = !!onResearchTaskStarted && linkType === "website";

  const abortRequest = () => {
    if (
      abortControllerRef.current &&
      !abortControllerRef.current.signal.aborted
    ) {
      abortControllerRef.current.abort();
    }
  };

  useEffect(() => {
    return () => {
      abortRequest();
    };
  }, []);

  const simulateWebsiteProgress = () => {
    const { config, updateInterval, totalUpdates } =
      createProgressSimulation("website");
    let currentUpdate = 0;

    const progressInterval = setInterval(() => {
      currentUpdate++;
      const baseProgress = (currentUpdate / totalUpdates) * 100;

      let newProgress = 0;
      let currentText = "Initializing processing...";

      for (let i = 0; i < config.stages.length; i++) {
        const stage = config.stages[i];
        const prevThreshold = i > 0 ? config.stages[i - 1].threshold : 0;

        if (baseProgress <= stage.threshold) {
          const stageProgress =
            ((baseProgress - prevThreshold) /
              (stage.threshold - prevThreshold)) *
            100;
          const stageRange = stage.threshold - prevThreshold;
          newProgress =
            prevThreshold +
            (stageProgress * stage.multiplier * stageRange) / 100;

          // Add some randomization for realism
          if (i < config.stages.length - 1) {
            newProgress += Math.random() * (i < 2 ? 2 : 1);
          }

          currentText = stage.text;
          break;
        }
      }

      setProgress(Math.min(newProgress, 99));
      setStatusText(currentText);

      if (currentUpdate >= totalUpdates) {
        clearInterval(progressInterval);
      }
    }, updateInterval);

    return progressInterval;
  };

  const handleWebsiteProcess = async (websiteUrl) => {
    try {
      setIsProcessing(true);
      setProcessingUrl(websiteUrl);
      let progressInterval = null;

      if (!isAsyncResearchFlow) {
        setProgress(0);
        setStatusText("Initializing website research...");
        abortControllerRef.current = new AbortController();
        progressInterval = simulateWebsiteProgress();
      }

      const response = await api.post(
        "/keyword-api/company-research/",
        {
          url: websiteUrl,
          project_id: projectId,
          component_id: componentId,
          domain_id: domainId,
        },
        isAsyncResearchFlow
          ? undefined
          : {
              signal: abortControllerRef.current.signal,
            },
      );

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      const data = response.data;

      if (onResearchTaskStarted) {
        onResearchTaskStarted({
          ...data,
          type: "website",
          source_type: "website",
          origin: "website_link",
          project_id: projectId,
          component_id: componentId,
          domain_id: domainId,
          url: websiteUrl,
        });
      }

      toast.success(
        data?.message ||
          "Website research started. We'll update your project data when it's ready.",
      );

      if (isAsyncResearchFlow && onOpenResearchTasksView) {
        onOpenResearchTasksView();
      }
      onClose();
    } catch (error) {
      if (error.name === "AbortError") {
        toast.info("Website processing was cancelled");
        return;
      }

      console.error("Website processing error:", error);

      let errorMessage = "Failed to process website";

      const responseData = error && error.response ? error.response.data : null;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else {
          errorMessage =
            responseData.message ||
            responseData.error ||
            responseData.action_required ||
            errorMessage;
        }
      } else if (error && error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingUrl("");

      if (!isAsyncResearchFlow) {
        setProgress(0);
        setStatusText("Initializing processing...");
      }
    }
  };

  const handleSubmit = async () => {
    const validation = validateUrl(url);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const validatedUrl = validation.validUrl;

    if (linkType === "website") {
      await handleWebsiteProcess(validatedUrl);
    } else if (linkType === "youtube") {
      const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubePattern.test(validatedUrl)) {
        toast.error("Please enter a valid YouTube URL");
        return;
      }

      onAdd({
        id: Date.now().toString(),
        source_type: linkType,
        source_content: validatedUrl,
        likes: 0,
      });
      onClose();
      toast.success("YouTube link added successfully!");
    } else {
      onAdd({
        id: Date.now().toString(),
        source_type: linkType,
        source_content: validatedUrl,
        likes: 0,
      });
      onClose();
      toast.success("Link added successfully!");
    }
  };

  const handleCancel = () => {
    abortRequest();
    setIsProcessing(false);
    setProcessingUrl("");
    setProgress(0);
    setStatusText("Initializing processing...");
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <>
      <ModalBackdrop
        isOpen={isAsyncResearchFlow ? isOpen : isOpen && !isProcessing}
        onClose={onClose}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Add {linkType === "youtube" ? "YouTube" : "Website"} Link
          </h2>
          <div className="mb-4">
            <input
              type="url"
              placeholder={
                linkType === "youtube"
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://example.com"
              }
              className="w-full border p-2 rounded"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {linkType === "youtube"
                ? "Enter a complete YouTube URL"
                : "Enter a complete website URL"}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="cursor-pointer px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="cursor-pointer px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAsyncResearchFlow && isProcessing && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>
                {isAsyncResearchFlow && isProcessing
                  ? "Starting..."
                  : `Add ${
                      linkType === "youtube" ? "YouTube Video" : "Website"
                    }`}
              </span>
            </button>
          </div>
        </div>
      </ModalBackdrop>

      {isProcessing && !isAsyncResearchFlow && (
        <ProcessingStatusModal
          title={processingUrl}
          onCancel={handleCancel}
          progress={progress}
          statusText={statusText}
        />
      )}
    </>
  );
}

/** Rename Modal **/
function RenameModal({
  isOpen,
  onClose,
  currentName,
  onRename,
  isSubmitting = false,
}) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName || "");
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    onRename(newName.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Rename Source</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <input
          type="text"
          className="w-full border p-2 rounded mb-4"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter new name"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="cursor-pointer px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/** Delete Confirmation Modal **/
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  sourceName,
  isSubmitting = false,
}) {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={!isSubmitting ? onClose : () => {}}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Delete Source</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
        <p className="mb-6 text-gray-600">
          Are you sure you want to delete "{sourceName}"? This action cannot be
          undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isSubmitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/** Product Link Confirmation Modal **/
function ProductLinkConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  keywordName,
  productName,
  isSubmitting = false,
}) {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Link Product to Keyword</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to link the following product to this keyword?
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Keyword:</strong> {keywordName}
            </p>
            <p className="text-sm">
              <strong>Product:</strong> {productName}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Linking..." : "Link Product"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export {
  AddSourcesModal,
  TextModal,
  LinkModal,
  RenameModal,
  DeleteConfirmModal,
  ProductLinkConfirmModal,
  ProcessingStatusModal,
  AddKeywordModal,
  AddSourcesCompetitor,
};

export const AddSourceModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const CHARACTER_LIMIT = 360;
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUserInput("");
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmed = userInput.trim();
    if (trimmed) {
      await onSubmit(trimmed);
      setUserInput("");
      onClose();
    } else {
      toast.error("Please enter some text for the source.");
    }
  };

  const remainingCharacters = Math.max(0, CHARACTER_LIMIT - userInput.length);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0b0b12]/80 via-[#151526]/75 to-[#0b0b12]/80 backdrop-blur ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white/95 backdrop-blur-xl border border-white/60 rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.15)] transform transition-all sm:max-w-2xl w-[92%] ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="px-8 py-7 border-b border-gray-100/80 bg-gradient-to-b from-white to-gray-50 rounded-t-[28px]">
          <div className="inline-flex items-center rounded-full bg-purple-50 text-purple-600 text-[11px] font-semibold px-3 py-1 uppercase tracking-[0.35em]">
            Core Idea Model
          </div>
          <div className="mt-3 space-y-2">
            <h3 className="text-[26px] font-semibold text-gray-900 leading-snug">
              Turn One Idea Into a Full-Funnel Topic Plan
            </h3>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              Enter a single concept, problem, or theme. Iriscale will generate
              coordinated top-, middle-, and bottom-of-funnel topics that
              educate, convert, and support buyers.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1">
              ✦ Full-funnel coverage
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1">
              ✦ Audience aware prompts
            </span>
          </div>
        </div>

        <div className="px-8 py-7 space-y-5">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-4 text-sm text-gray-600">
            <label className="text-sm font-semibold text-gray-900">
              Core Idea
              <span className="block text-sm font-normal text-gray-500">
                Describe the core concept, problem, or capability you want
                customers to understand.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <textarea
              rows="5"
              maxLength={CHARACTER_LIMIT}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/30 transition-all duration-200 shadow-sm focus:shadow-xl"
              placeholder="Describe the core concept, problem, or capability you want customers to understand..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              ref={textareaRef}
            />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>We’ll seed your topic funnel with this description.</span>
              <span>{remainingCharacters} characters left</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50/70 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-100/70 rounded-b-[28px]">
          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#0ea5e9] hover:from-[#6d28d9] hover:via-[#4f46e5] hover:to-[#0284c7] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Generate Topics"}
          </button>
        </div>
      </div>
    </div>
  );
};
