import React, { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Edit, User, Eye, AlertTriangle, LogOut, Crown } from 'lucide-react';
import { documentApi } from '../services/api';
import { auth } from '../config/firebase';
import { DocumentEditor } from './MyEditor';
import { YDocProvider } from '@y-sweet/react';
import ThemeToggle from '../components/Theme';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const subscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
        loadDocuments();
      } else {
        setLoading(false);
        setError("Please log in to view your documents.");
      }
    });
    return () => subscribe();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const docs = await documentApi.getAll();
      setDocuments(docs);
    } catch (error) {
      setError(error.message || 'Failed to load documents');
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const newDoc = await documentApi.create({ title: 'Untitled Document' });
      setDocuments(prev => [...prev, newDoc]);
      setSelectedDocId(newDoc.id);
    } catch (error) {
      setError(error.message || 'Failed to create document');
      console.error('Error creating document:', error);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await documentApi.delete(docToDelete.id);
      setDocuments(documents.filter(doc => doc.id !== docToDelete.id));
      if (selectedDocId === docToDelete.id) setSelectedDocId(null);
      setDocToDelete(null);
    } catch (error) {
      setError(error.message || 'Failed to delete document');
      console.error('Error deleting document:', error);
    }
  };

  // Add this function to update document title in state
  const handleDocumentTitleUpdate = (id, newTitle) => {
    setDocuments(prevDocs => prevDocs.map(doc =>
      doc.id === id ? { ...doc, title: newTitle } : doc
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return {
          text: 'Admin',
          icon: <Crown className="h-3 w-3" />, 
          color: 'bg-yellow-400/10 text-yellow-700 border border-yellow-200'
        };
      case 'editor':
        return {
          text: 'Editor',
          icon: <Edit className="h-3 w-3" />, 
          color: 'bg-blue-500/10 text-blue-700 border border-blue-200'
        };
      case 'viewer':
        return {
          text: 'View Only',
          icon: <Eye className="h-3 w-3" />, 
          color: 'bg-gray-500/10 text-gray-700 border border-gray-200'
        };
      default:
        return {
          text: 'Unknown',
          icon: <User className="h-3 w-3" />, 
          color: 'bg-gray-100 text-gray-800 border border-gray-200'
        };
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-neutral-200 h-full flex-shrink-0 overflow-y-auto flex flex-col shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            liphi
          </h2>
          <button
            onClick={handleCreateDocument}
            className="text-sm flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            <Plus className="w-4 h-4 mr-1" /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No documents yet</div>
          ) : (
            <ul className="space-y-1">
              {documents.map((doc) => {
                const userRole = currentUser ? doc.roles?.[currentUser.uid] : null;
                const roleInfo = getRoleInfo(userRole);
                return (
                  <li
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition group ${selectedDocId === doc.id ? 'bg-neutral-200' : 'hover:bg-neutral-100'}`}
                    title={doc.title || 'Untitled'}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate font-medium text-gray-800">{doc.title || 'Untitled'}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${roleInfo.color} flex items-center gap-1`}>{roleInfo.icon}{roleInfo.text}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDocToDelete(doc); }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* User info, theme toggle, and logout at the bottom */}
        <div className="mt-auto border-t border-neutral-200 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4" />
            <span>{user?.displayName || user?.email || 'User'}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-50">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 m-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {docToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Document</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete "<strong>{docToDelete.title}</strong>"? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button onClick={handleDeleteDocument} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">
                  Delete
                </button>
                <button onClick={() => setDocToDelete(null)} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-0 sm:p-4 overflow-y-auto relative min-w-0">
          {selectedDocId ? (
            <YDocProvider docId={selectedDocId} authEndpoint="https://demos.y-sweet.dev/api/auth" showDebuggerLink={false}>
              <DocumentEditor documentId={selectedDocId} onTitleUpdate={handleDocumentTitleUpdate} />
            </YDocProvider>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-lg">
              Select or create a document to start editing ✍️
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
