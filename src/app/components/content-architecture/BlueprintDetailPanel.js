'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BlueprintDetailPanel({ blueprint }) {
  const [editableBlueprint, setEditableBlueprint] = useState(null);

  useEffect(() => {
    if (blueprint) {
      setEditableBlueprint(blueprint);
    }
  }, [blueprint]);

  const handleInputChange = (field, value) => {
    setEditableBlueprint(prev => ({ ...prev, [field]: value }));
  };

  const handleBlockStructureChange = (value) => {
    setEditableBlueprint(prev => ({ ...prev, block_structure: value.split('\n') }));
  };

  const handleUpdate = () => {
    console.log("Saving data:", editableBlueprint);
    toast.success('Blueprint updated successfully!');
  };

  const handleCancel = () => {
    setEditableBlueprint(blueprint);
    toast('Changes have been cancelled.', { icon: 'ℹ️' });
  };

  if (!blueprint) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md">
          <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Blueprint Selected
          </h3>
          <p className="text-gray-600">
            Select a blueprint from the list to view its details.
          </p>
        </div>
      </div>
    );
  }

  if (!editableBlueprint) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{editableBlueprint.blueprint_type}</h2>
        <div className="flex gap-2">
          <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Save size={16} /> Update
          </button>
          <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2">
            <X size={16} /> Cancel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-lg font-semibold mb-2 block">Content</label>
          <textarea
            value={editableBlueprint.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full h-48 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-lg font-semibold mb-2 block">Use Case</label>
          <textarea
            value={editableBlueprint.use_case}
            onChange={(e) => handleInputChange('use_case', e.target.value)}
            className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-lg font-semibold mb-2 block">Block Structure</label>
          <textarea
            value={editableBlueprint.block_structure.join('\n')}
            onChange={(e) => handleBlockStructureChange(e.target.value)}
            className="w-full h-48 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-lg font-semibold mb-2 block">Example</label>
          <textarea
            value={editableBlueprint.example}
            onChange={(e) => handleInputChange('example', e.target.value)}
            className="w-full h-96 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
