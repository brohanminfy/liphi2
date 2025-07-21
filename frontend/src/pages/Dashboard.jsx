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
      <aside className="w-72 bg-white border-r border-neutral-200 h-full flex-shrink-0 flex flex-col shadow-sm">
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
        <div className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No documents yet</div>
          ) : (
            <>
              {/* Admin Section */}
              <SectionedDocs
                title="Admin"
                docs={documents.filter(doc => currentUser && doc.roles?.[currentUser.uid] === 'admin')}
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                setDocToDelete={setDocToDelete}
                getRoleInfo={getRoleInfo}
              />
              {/* Editor Section */}
              <SectionedDocs
                title="Editor"
                docs={documents.filter(doc => currentUser && doc.roles?.[currentUser.uid] === 'editor')}
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                setDocToDelete={setDocToDelete}
                getRoleInfo={getRoleInfo}
              />
              {/* Viewer Section */}
              <SectionedDocs
                title="Viewer"
                docs={documents.filter(doc => currentUser && doc.roles?.[currentUser.uid] === 'viewer')}
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                setDocToDelete={setDocToDelete}
                getRoleInfo={getRoleInfo}
              />
            </>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-fadeIn">
            <div className="relative bg-white rounded-xl shadow-lg w-full max-w-xs border border-neutral-200 animate-scaleIn p-0">
              <div className="flex flex-col items-center px-5 py-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 mb-2 border border-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center">Delete Document?</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Delete <span className="font-medium text-red-600">"{docToDelete.title}"</span>?<br/>
                  <span className="text-xs text-gray-400">This cannot be undone.</span>
                </p>
                <div className="flex w-full gap-2 mt-1">
                  <button
                    onClick={handleDeleteDocument}
                    type="button"
                    className="flex-1 py-1.5 rounded-md bg-red-500 text-white text-sm font-medium shadow-sm hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDocToDelete(null)}
                    type="button"
                    className="flex-1 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            {/* Animations */}
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes scaleIn { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              .animate-fadeIn { animation: fadeIn 0.18s ease; }
              .animate-scaleIn { animation: scaleIn 0.18s cubic-bezier(0.4,0,0.2,1); }
            `}</style>
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

function SectionedDocs({ title, docs, selectedDocId, setSelectedDocId, setDocToDelete, getRoleInfo }) {
  if (!docs.length) return null;
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1 tracking-wider">{title}</div>
      <ul className="space-y-1">
        {docs.map((doc) => (
          <li
            key={doc.id}
            onClick={() => setSelectedDocId(doc.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition group ${selectedDocId === doc.id ? 'bg-neutral-200' : 'hover:bg-neutral-100'}`}
            title={doc.title || 'Untitled'}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="truncate font-medium text-gray-800">{doc.title || 'Untitled'}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setDocToDelete(doc); }}
              className="text-gray-400 hover:text-red-600 p-1 rounded"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
