"use client";

import { useState } from "react";
import {
  adminGetCollection,
  adminUpdateDocument,
  adminDeleteDocument,
  adminCreateDocument
} from "../lib/firebase";

export default function AdminDatabaseEditor() {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState('');
  const [customId, setCustomId] = useState('');
  
  const collections = [
    'users',
    'subscriptions', 
    'blocked_sites',
    'user_overrides',
    'override_history',
    'override_purchases',
    'credit_purchases',
    'admin_audit_log'
  ];

  const loadCollection = async (collectionName) => {
    if (!collectionName) return;
    
    setLoading(true);
    try {
      const docs = await adminGetCollection(collectionName);
      setDocuments(docs);
    } catch (error) {
      console.error(`Error loading ${collectionName}:`, error);
    }
    setLoading(false);
  };

  const handleCollectionChange = (collectionName) => {
    setSelectedCollection(collectionName);
    setSelectedDoc(null);
    setEditingDoc(null);
    loadCollection(collectionName);
  };

  const handleDocumentClick = (doc) => {
    setSelectedDoc(doc);
    setEditingDoc(JSON.stringify(doc, null, 2));
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc || !editingDoc) return;
    
    try {
      const updatedData = JSON.parse(editingDoc);
      // Remove the id from the data to update
      const { id, ...dataToUpdate } = updatedData;
      
      await adminUpdateDocument(selectedCollection, selectedDoc.id, dataToUpdate);
      
      // Refresh the collection
      loadCollection(selectedCollection);
      setSelectedDoc(null);
      setEditingDoc(null);
      
      alert('Document updated successfully!');
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error updating document: ' + error.message);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminDeleteDocument(selectedCollection, docId, true);
      loadCollection(selectedCollection);
      setSelectedDoc(null);
      setEditingDoc(null);
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  const handleCreateDocument = async () => {
    if (!createData) return;
    
    try {
      const newDocData = JSON.parse(createData);
      await adminCreateDocument(selectedCollection, newDocData, customId || null);
      
      // Refresh the collection
      loadCollection(selectedCollection);
      setShowCreateModal(false);
      setCreateData('');
      setCustomId('');
      
      alert('Document created successfully!');
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error creating document: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Collection Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Database Collection Manager</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select a collection to view and manage documents. Use with extreme caution.
        </p>
        
        <div className="flex gap-4 items-center mb-4">
          <select
            value={selectedCollection}
            onChange={(e) => handleCollectionChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
          
          {selectedCollection && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Document
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </div>

      {/* Documents List */}
      {selectedCollection && documents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documents List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">
                {selectedCollection} ({documents.length} documents)
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`px-6 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedDoc?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleDocumentClick(doc)}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    ID: {doc.id}
                  </div>
                  {doc.name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Name: {doc.name}
                    </div>
                  )}
                  {doc.profile_email && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Email: {doc.profile_email}
                    </div>
                  )}
                  {doc.url && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      URL: {doc.url}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Editor */}
          {selectedDoc && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">Edit Document</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {selectedDoc.id}
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={editingDoc}
                  onChange={(e) => setEditingDoc(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                  placeholder="Document JSON data..."
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveDocument}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoc(null);
                      setEditingDoc(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedCollection && documents.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No documents found in the {selectedCollection} collection.
          </p>
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Document</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Custom Document ID (optional)
                  </label>
                  <input
                    type="text"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder="Leave empty for auto-generated ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Document Data (JSON)
                  </label>
                  <textarea
                    value={createData}
                    onChange={(e) => setCreateData(e.target.value)}
                    className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder='{"field1": "value1", "field2": "value2"}'
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleCreateDocument}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create Document
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateData('');
                    setCustomId('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 