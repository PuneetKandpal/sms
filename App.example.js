// Example App.js for standard React applications (Vite/CRA)
// This shows how to integrate the Social Post Agent into a standard React app

import React from "react";
import SocialsPage from "./src/app/socials/page";
import "./App.css"; // Your global styles
// Make sure to import TailwindCSS in your index.css or App.css

/**
 * Main App Component
 * This is a simple wrapper that renders the Social Post Agent
 */
function App() {
  return (
    <div className="App">
      {/* Optional: Add a header/navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Social Post Agent
            </h1>
            <nav className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Analytics
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Social Post Agent Component */}
      <main>
        <SocialsPage />
      </main>

      {/* Optional: Add a footer */}
      <footer className="bg-gray-50 border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Social Post Agent. Built with React & TailwindCSS.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

// Alternative: If you want to use individual components
/*
import React, { useState } from 'react';
import InputForm from './src/components/InputForm';
import PostVariants from './src/components/PostVariants';
import MobilePreview from './src/components/MobilePreview';
import { useFormState, usePostGeneration } from './src/hooks/useSocialPostAgent';

function CustomApp() {
  const { formData, updateFormData } = useFormState();
  const { postVariants, generatePostVariants, generationState } = usePostGeneration();
  const [selectedVariant, setSelectedVariant] = useState('A');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Custom Social Tool</h1>
        
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <InputForm
              formData={formData}
              onFormDataChange={updateFormData}
              onGenerate={() => generatePostVariants(formData)}
              generationState={generationState}
            />
          </div>
          
          <div className="col-span-5">
            <PostVariants
              selectedPlatform={formData.selectedPlatform}
              postVariants={postVariants}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
              onExport={() => console.log('Export')}
              onRefine={() => console.log('Refine')}
            />
          </div>
          
          <div className="col-span-3">
            <MobilePreview
              selectedPlatform={formData.selectedPlatform}
              selectedVariant={selectedVariant}
              postContent={postVariants[formData.selectedPlatform]?.[selectedVariant]}
              previewSettings={{ darkMode: false, overlayBg: '#000000', textColor: '#ffffff', showAsset: true }}
              onPreviewSettingsChange={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomApp;
*/
