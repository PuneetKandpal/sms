"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, ExternalLink, Link } from "lucide-react";

export default function LinksTab({ selectedNode }) {
  const [internalLinks, setInternalLinks] = useState([
    {
      type: "Prerequisite",
      title: "Introduction to Market Research",
      note: "Users should read this first",
    },
    {
      type: "Supporting",
      title: "Customer Interview Templates",
      note: "Related reading",
    },
  ]);

  const [textLinks, setTextLinks] = useState([
    {
      linkText: "market research best practices",
      url: "/discover/market-research-methods",
    },
    {
      linkText: "customer interview guide",
      url: "/discover/customer-interviews",
    },
    {
      linkText: "educational resources",
      url: "/discover/educational-foundation",
    },
  ]);

  const [externalLinks, setExternalLinks] = useState([
    {
      type: "Source",
      title: "Industry Research Report 2024",
      url: "https://example.com/research-report",
    },
  ]);

  return (
    <div className="relative p-6 max-w-5xl mx-auto space-y-8">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/20 flex items-start justify-end p-4 z-10 rounded-lg pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 300, x: -400 }}
          transition={{ duration: 0 }}
          className="px-4 py-1.5 top-0 right-0 bg-purple-600 text-white text-sm font-semibold rounded-full shadow-md border border-white/30"
        >
          Coming Soon
        </motion.div>
      </div>

      {/* Internal Text Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Link className="h-5 w-5 text-purple-600" />
          Internal Text Links
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Link Text
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  URL
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {textLinks.map((link, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {link.linkText}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600">
                    {link.url}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1 ml-2 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Text Link
        </button>
      </motion.div>

      {/* Internal Content Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Link className="h-5 w-5 text-green-600" />
          Internal Content Links
        </h3>
        <div className="space-y-3">
          {internalLinks.map((link, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                    {link.type}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {link.title}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{link.note}</p>
              </div>
              <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium cursor-pointer">
                Edit
              </button>
            </motion.div>
          ))}
        </div>
        <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Content Link
        </button>
      </motion.div>

      {/* External Resources */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-orange-600" />
          External Resources
        </h3>
        <div className="space-y-3">
          {externalLinks.map((link, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-semibold rounded">
                    {link.type}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {link.title}
                  </span>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {link.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <button className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium cursor-pointer">
                Edit
              </button>
            </motion.div>
          ))}
        </div>
        <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
      </motion.div>

      {/* Link Strategy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Link Strategy Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>
              Use prerequisite links to guide users through content in the right
              order
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>
              Add supporting links to provide additional context and depth
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <span>
              Include external resources to build credibility and provide
              citations
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
