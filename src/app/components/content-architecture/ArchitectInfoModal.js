"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Users, Package, Target, Sparkles, Globe, TrendingUp } from "lucide-react";

export default function ArchitectInfoModal({ architect, isOpen, onClose }) {
  if (!architect || !architect.companyDoc) return null;

  const companyDoc = architect.companyDoc;

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{architect.name}</h2>
                  <p className="text-sm text-white/80">Company Research Details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Overview */}
              {companyDoc.Overview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Overview</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{companyDoc.Overview}</p>
                </motion.div>
              )}

              {/* Industries */}
              {companyDoc.industries && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Industries</h3>
                  </div>
                  {companyDoc.industries.overview && (
                    <p className="text-sm text-gray-600 mb-3">{companyDoc.industries.overview}</p>
                  )}
                  <ul className="space-y-2">
                    {companyDoc.industries.list?.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Buyer Personas */}
              {companyDoc.buyer_personas && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Buyer Personas</h3>
                  </div>
                  {companyDoc.buyer_personas.overview && (
                    <p className="text-sm text-gray-600 mb-3">{companyDoc.buyer_personas.overview}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {companyDoc.buyer_personas.list?.map((persona, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
                      >
                        <span className="text-sm font-medium text-gray-700">{persona}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Products and Services */}
              {companyDoc.products_and_services && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Products and Services</h3>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(companyDoc.products_and_services).map(
                      ([product, data], index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{product}</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {data.keywords?.map((keyword, kidx) => (
                              <span
                                key={kidx}
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              )}

              {/* Target Markets */}
              {companyDoc.target_markets && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Target Markets</h3>
                  </div>
                  {companyDoc.target_markets.overview && (
                    <p className="text-sm text-gray-600 mb-3">{companyDoc.target_markets.overview}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {companyDoc.target_markets.list?.map((market, index) => (
                      <div
                        key={index}
                        className="bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200"
                      >
                        <span className="text-sm font-medium text-gray-700">{market}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Differentiators */}
              {companyDoc.differentiators && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900">Differentiators</h3>
                  </div>
                  {companyDoc.differentiators.overview && (
                    <p className="text-sm text-gray-600 mb-3">{companyDoc.differentiators.overview}</p>
                  )}
                  <ul className="space-y-2">
                    {companyDoc.differentiators.list?.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                        </span>
                        <span className="text-sm text-gray-700 flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* GEO LEO Strategy */}
              {companyDoc.geo_leo_strategy && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">GEO LEO Strategy</h3>
                  </div>
                  {companyDoc.geo_leo_strategy.overview && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {companyDoc.geo_leo_strategy.overview}
                    </p>
                  )}

                  {/* SEO Strategy */}
                  {companyDoc.geo_leo_strategy.seo_strategy && (
                    <div className="mt-4 space-y-3">
                      {companyDoc.geo_leo_strategy.seo_strategy.industry_modifiers && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Industry Modifiers</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {companyDoc.geo_leo_strategy.seo_strategy.industry_modifiers.map((mod, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-purple-200 text-gray-700">
                                {mod}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {companyDoc.geo_leo_strategy.seo_strategy.location_based_terms && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Location-Based Terms</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {companyDoc.geo_leo_strategy.seo_strategy.location_based_terms.map((term, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-purple-200 text-gray-700">
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Metadata */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Created At</p>
                    <p className="font-medium text-gray-900">
                      {new Date(architect.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Task ID</p>
                    <p className="font-medium text-gray-900 truncate" title={architect.taskId}>
                      {architect.taskId}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
