"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KnowledgeBaseGateAlert({
  projectId,
  description,
  title = "Knowledge base sources are required to use this feature",
  buttonLabel = "Go to knowledge base",
  actionLink,
}) {
  const router = useRouter();

  const handleClick = () => {
    const fallback = projectId ? `/projects/${projectId}/manage` : "/projects";
    router.push(actionLink || fallback);
  };

  return (
    <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-2xl border border-red-100 p-8 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      {description && (
        <p className="text-sm text-gray-600 mb-6">{description}</p>
      )}
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center w-full px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium cursor-pointer"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
