"use client";

import { useState } from "react";
import {
  adminGetDocumentIds,
  adminGetDocument,
  adminUpdateDocument,
  adminDeleteDocument
} from "../lib/firebase";

export default function AdminDatabaseEditor() {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [documentIds, setDocumentIds] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const handleSearch = async () => {
    if (!selectedCollection || !searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const results = await adminGetDocumentIds(selectedCollection, searchTerm.trim());
      setDocumentIds(results);
      
      // If we found exactly one result, select it automatically
      if (results.length === 1) {
        const docId = results[0].id;
        setSelectedDocId(docId);
        await handleDocumentSelect(docId);
      } else {
        setSelectedDocId('');
        setSelectedDoc(null);
        setEditingDoc(null);
      }
    } catch (error) {
      console.error(`Error searching:`, error);
      alert('Error searching: ' + error.message);
    }
    setLoading(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCollectionChange = (collectionName) => {
    setSelectedCollection(collectionName);
    setSelectedDocId('');
    setSelectedDoc(null);
    setEditingDoc(null);
    setSearchTerm('');
    setDocumentIds([]);
  };

  const handleDocumentSelect = async (docId) => {
    if (!docId) {
      setSelectedDoc(null);
      setEditingDoc(null);
      return;
    }
    
    setLoading(true);
    try {
      const doc = await adminGetDocument(selectedCollection, docId);
      setSelectedDoc(doc);
      setEditingDoc(JSON.stringify(doc, null, 2));
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Error loading document: ' + error.message);
    }
    setLoading(false);
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc || !editingDoc) return;
    
    try {
      const updatedData = JSON.parse(editingDoc);
      // Remove the id from the data to update
      const { id, ...dataToUpdate } = updatedData;
      
      await adminUpdateDocument(selectedCollection, selectedDoc.id, dataToUpdate);
      
      // Refresh the document
      handleDocumentSelect(selectedDoc.id);
      
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
      
      // Clear selection and search results
      setSelectedDoc(null);
      setEditingDoc(null);
      setSelectedDocId('');
      setDocumentIds([]);
      setSearchTerm('');
      
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Collection Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Database Collection Manager</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select a collection and search for a document to manage. Use with extreme caution.
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
        </div>

        {/* Document Search */}
        {selectedCollection && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search by ID, email, name, or URL..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Search
                </button>
              </div>
              
              {documentIds.length > 0 && (
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    handleDocumentSelect(e.target.value);
                  }}
                  className="w-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a document</option>
                  {documentIds.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.id} {doc.name ? `(${doc.name})` : ''} {doc.email ? `(${doc.email})` : ''} {doc.url ? `(${doc.url})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
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
                onClick={() => handleDeleteDocument(selectedDoc.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Document
              </button>
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  setEditingDoc(null);
                  setSelectedDocId('');
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
  );
} 