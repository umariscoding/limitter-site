"use client";

import { useState } from "react";
import {
  adminGetDocumentIds,
  adminGetDocument,
  adminUpdateDocument,
  adminDeleteDocument,
  formatActivityTimestamp,
  db
} from "../lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, getDoc, doc } from "firebase/firestore";

export default function AdminDatabaseEditor() {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [documentIds, setDocumentIds] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const collections = [
    'admin_audit',
    'admin_audit_log',
    'subscriptions',
    'transactions',
    'user_overrides'
  ];

  const getSearchPlaceholder = (collection) => {
    switch (collection) {
      case 'admin_audit':
        return 'Search by target user ID...';
      case 'admin_audit_log':
        return 'Search by user ID...';
      case 'subscriptions':
        return 'Search by user ID...';
      case 'transactions':
        return 'Search by transaction ID or user ID...';
      case 'user_overrides':
        return 'Search by user ID...';
      default:
        return 'Search...';
    }
  };

  const handleSearch = async () => {
    if (!selectedCollection || !searchTerm.trim()) return;
    
    setLoading(true);
    try {
      let results = [];
      const searchValue = searchTerm.trim();

      switch (selectedCollection) {
        case 'admin_audit':
          // Get all audit entries for target user
          const auditQuery = query(
            collection(db, 'admin_audit'),
            where('target_user_id', '==', searchValue)
          );
          const auditSnapshot = await getDocs(auditQuery);
          results = auditSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: `${data.action} at ${formatActivityTimestamp(data.timestamp)}`,
              description: data.description || ''
            };
          });
          break;

        case 'admin_audit_log':
          // Get all audit logs where site_data.user_id matches
          const auditLogQuery = query(
            collection(db, 'admin_audit_log'),
            where('site_data.user_id', '==', searchValue)
          );
          const auditLogSnapshot = await getDocs(auditLogQuery);
          results = auditLogSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: `${data.action} - Site: ${data.site_id || 'N/A'}`,
              date: formatActivityTimestamp(data.timestamp || data.deleted_at),
              description: `User: ${data.site_data?.user_id || 'N/A'}`
            };
          });
          break;

        case 'subscriptions':
          // Get single subscription by user ID
          const subsQuery = query(
            collection(db, 'subscriptions'),
            where('user_id', '==', searchValue),
            limit(1)
          );
          const subsSnapshot = await getDocs(subsQuery);
          results = subsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: `Subscription for ${doc.data().user_id}`,
            plan: doc.data().plan
          }));
          break;

        case 'transactions':
          // First try to get the exact transaction by ID
          try {
            const transDoc = await getDoc(doc(db, 'transactions', searchValue));
            if (transDoc.exists()) {
              const data = transDoc.data();
              results = [{
                id: transDoc.id,
                name: `${data.type} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}`,
                date: formatActivityTimestamp(data.created_at),
                description: `User: ${data.user_id}`
              }];
              break;
            }
          } catch (error) {
            console.log("Not a valid transaction ID, trying user ID search...");
          }

          // If not found by ID, search by user ID
          const transQuery = query(
            collection(db, 'transactions'),
            where('user_id', '==', searchValue),
            orderBy('created_at', 'desc'),
            limit(10)
          );
          const transSnapshot = await getDocs(transQuery);
          if (!transSnapshot.empty) {
            results = transSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: `${data.type} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}`,
                date: formatActivityTimestamp(data.created_at),
                description: `User: ${data.user_id}`
              };
            });
          }
          break;

        case 'user_overrides':
          // Get overrides by user ID
          const overridesQuery = query(
            collection(db, 'user_overrides'),
            where('user_id', '==', searchValue)
          );
          const overridesSnapshot = await getDocs(overridesQuery);
          results = overridesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: `Override for ${doc.data().user_id}`,
            type: doc.data().type
          }));
          break;
      }

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

  return (
    <div className="space-y-6">
      {/* Collection Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Database Collection Manager</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Search and manage specific collections. Use with caution.
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
                  placeholder={getSearchPlaceholder(selectedCollection)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
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
                      {doc.id} {doc.name ? ` - ${doc.name}` : ''} {doc.date ? ` (${doc.date})` : ''}
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