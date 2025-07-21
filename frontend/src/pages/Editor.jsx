import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { documentApi } from '../services/api.js';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { 
  BlockNoteSchema, 
  defaultInlineContentSpecs,
  filterSuggestionItems 
} from "@blocknote/core";
import { 
  SuggestionMenuController,
  createReactInlineContentSpec
} from "@blocknote/react";
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { ArrowLeft, Share2, CheckCircle, Clock, Loader2, Users } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import ShareModal from '../components/Sharing.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { YDocProvider, useYDoc, useYjsProvider } from "@y-sweet/react";
import {
  DefaultThreadStoreAuth,
  YjsThreadStore,
} from "@blocknote/core/comments";
import { generateUserColor } from "../components/collaboration/utils.js";

// Mention inline content component
const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      user: {
        default: "Unknown",
      },
      userId: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span 
        style={{ 
          backgroundColor: "#3b82f633", 
          color: "#3b82f6",
          padding: "2px 4px",
          borderRadius: "4px",
          fontWeight: "500"
        }}
      >
        @{props.inlineContent.props.user}
      </span>
    ),
  },
);

// Enhanced schema with mentions only
const createEnhancedSchema = () => {
  return BlockNoteSchema.create({
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      mention: Mention,
    },
  });
};

// Custom hook for debouncing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

// Centralized user resolution function using backend API
const resolveUsersFromBackend = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return [];
    
    // Use the backend API to get user details from Firebase Auth
    const users = await documentApi.getUserDetails(userIds);
    return users;
    
  } catch (error) {
    console.error('Error resolving users:', error);
    // Return fallback data
    return userIds.map(userId => ({
      id: userId,
      name: `User ${userId.slice(-4)}`,
      email: '',
      avatarUrl: '',
    }));
  }
};

// Extracted DocumentEditor component
export function DocumentEditor({ documentId, onTitleUpdate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Core State
  const [document, setDocument] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]); 
  const [activeUser, setActiveUser] = useState(null);
  const [title, setTitle] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [documentUsers, setDocumentUsers] = useState([]);
  const [userCache, setUserCache] = useState(new Map()); // Cache for resolved users

  // UI & Save State
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState('');
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [editorContent, setEditorContent] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Yjs providers
  const provider = useYjsProvider();
  const ydoc = useYDoc();

  // Store initial data for comparison
  const [initialData, setInitialData] = useState({
    title: '',
    content: [{ type: "paragraph", content: [{ type: "text", text: "Start writing..." }] }]
  });

  // Debounce title to trigger auto-save
  const debouncedTitle = useDebounce(title, 1500);
  const debouncedContent = useDebounce(editorContent, 2000);

  // Enhanced schema
  const schema = useMemo(() => createEnhancedSchema(), []);

  // Enhanced resolveUsers function that uses cache
  const resolveUsersWithCache = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) return [];
    
    const uncachedIds = userIds.filter(id => !userCache.has(id));
    
    if (uncachedIds.length > 0) {
      const newUsers = await resolveUsersFromBackend(uncachedIds);
      const newCache = new Map(userCache);
      newUsers.forEach(userData => {
        newCache.set(userData.id, userData);
      });
      setUserCache(newCache);
    }
    
    return userIds.map(id => userCache.get(id) || {
      id,
      name: `User ${id.slice(-4)}`,
      email: '',
      avatarUrl: '',
    });
  }, [userCache]);

  // Function to get mention menu items
  const getMentionMenuItems = useCallback((editor) => {    
    return documentUsers
      .filter(docUser => docUser && docUser.id && docUser.name)
      .map((docUser) => ({
        title: docUser.name,
        subtext: docUser.email || '',
        onItemClick: () => {
          // Insert the mention inline content
          editor.insertInlineContent([
            {
              type: "mention",
              props: {
                user: docUser.name,
                userId: docUser.id,
              },
            },
            " ", // add a space after the mention
          ]);
        },
      }));
  }, [documentUsers]);

  // Track active users using Y-Sweet's awareness
  useEffect(() => {
    if (!provider || !user) return;

    const awareness = provider.awareness;
    
    // Set current user's awareness state
    awareness.setLocalStateField('user', {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || `User ${user.uid.slice(-4)}`,
      email: user.email,
      avatarUrl: user.photoURL || '',
      color: generateUserColor(user.uid)
    });

    // Listen for awareness changes
    const handleAwarenessChange = () => {
      const states = Array.from(awareness.getStates().values());
      setActiveUsers(states);
    };

    awareness.on('change', handleAwarenessChange);
    
    // Initial call
    handleAwarenessChange();

    return () => {
      awareness.off('change', handleAwarenessChange);
    };
  }, [provider, user]);

  // Load document and users
  useEffect(() => {
    const fetchDocumentAndUsers = async () => {
      if (user && documentId) {
        try {
          setLoading(true);
          
          // Load document from API to get permissions and metadata
          const doc = await documentApi.getById(documentId);
          const userRole = doc.roles?.[user.uid] || null;
          const canEdit = userRole === 'admin' || userRole === 'editor';
          
          setIsEditable(canEdit);
          setTitle(doc.title);
          setDocument({ ...doc, role: userRole });
          setLastSaved(doc.updatedAt ? new Date(doc.updatedAt) : null);
          setInitialData({ title: doc.title });

          // Load users for collaboration and mentions
          const userIds = doc.members || [];
          
          if (userIds.length > 0) {
            // Use the centralized resolveUsersFromBackend function
            const resolvedUsers = await resolveUsersFromBackend(userIds);
            
            // Update cache
            const newCache = new Map();
            resolvedUsers.forEach(userData => {
              newCache.set(userData.id, userData);
            });
            setUserCache(newCache);
            
            // Set document users for mentions
            setDocumentUsers(resolvedUsers);
            
            // Set active user
            const currentUserData = resolvedUsers.find(u => u.id === user.uid) || {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || `User ${user.uid.slice(-4)}`,
              email: user.email || '',
              avatarUrl: user.photoURL || '',
            };
            
            setActiveUser({ ...currentUserData, role: userRole || 'viewer' });
          } else {
            // Handle case where no members are found
            const currentUserData = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || `User ${user.uid.slice(-4)}`,
              email: user.email || '',
              avatarUrl: user.photoURL || '',
            };
            
            setDocumentUsers([currentUserData]);
            setActiveUser({ ...currentUserData, role: userRole || 'viewer' });
          }
          
        } catch (error) {
          console.error('Load document error:', error);
          setError('Failed to load document.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchDocumentAndUsers();
  }, [documentId, user]);

  // Auto-save title changes
  useEffect(() => {
    if (!isEditable || !document || loading || !activeUser) return;

    const hasTitleChanged = debouncedTitle !== initialData.title;
    if (hasTitleChanged && debouncedTitle.trim()) {
      handleSave({ title: debouncedTitle });
    }
  }, [debouncedTitle, initialData.title, isEditable, document, loading, activeUser]);

  // Auto-save content changes
  useEffect(() => {
    if (!isEditable || !document || loading || !activeUser || !debouncedContent) return;

    if (hasUnsavedChanges) {
      handleSave({ content: debouncedContent });
    }
  }, [debouncedContent, isEditable, document, loading, activeUser, hasUnsavedChanges]);
  // Thread store for comments
  const threadStore = useMemo(() => {
    if (!activeUser || !ydoc) return null;
    return new YjsThreadStore(
      activeUser.id,
      ydoc.getMap("threads"),
      new DefaultThreadStoreAuth(activeUser.id, activeUser.role === 'viewer' ? 'comment' : 'editor'),
    );
  }, [ydoc, activeUser]);

  // BlockNote editor with collaboration and enhanced features
  const editor = useCreateBlockNote(
    {
      schema,
      resolveUsers: resolveUsersWithCache,
      comments: threadStore ? { threadStore } : undefined,
      collaboration: provider && activeUser ? {
        provider,
        fragment: ydoc.getXmlFragment("blocknote"),
        user: { 
          color: generateUserColor(activeUser.id), 
          name: activeUser.name 
        },
        showCursorLabels: "activity",
        // Add error handling for Yjs conflicts
        onError: (error) => {
          console.warn('Collaboration error:', error);
          // Don't throw the error, just log it
        }
      } : undefined
    },
    [activeUser, threadStore, provider, ydoc, schema, resolveUsersWithCache],
  );

  // Handle editor content changes for auto-save
  useEffect(() => {
    if (!editor || !isEditable) return;

    const handleChange = () => {
      try {
        const content = editor.document;
        setEditorContent(content);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.warn('Error getting editor content:', error);
      }
    };

    // Listen for document changes
    editor.onChange(handleChange);

    return () => {
      // Cleanup if needed
    };
  }, [editor, isEditable]);
  // Save function for title updates
  const handleSave = async (data = {}) => {
    if (status === 'saving' || !isEditable || !document) return;

    try {
      setStatus('saving');
      const updateData = {};
      let didUpdateTitle = false;
      if (data.title !== undefined) {
        updateData.title = data.title;
        setInitialData(prev => ({ ...prev, title: data.title }));
        didUpdateTitle = true;
      }
      if (data.content !== undefined) {
        updateData.content = data.content;
        setHasUnsavedChanges(false);
      }
      if (Object.keys(updateData).length > 0) {
        await documentApi.update(documentId, updateData);
        // If title was updated, call the callback
        if (didUpdateTitle && typeof onTitleUpdate === 'function') {
          onTitleUpdate(documentId, data.title);
        }
      }
      setLastSaved(new Date());
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save document');
      setStatus('idle');
    }
  };

  // Status indicator
  const getStatusIndicator = () => {
    if (!isEditable) {
      return lastSaved ? (
        <span className="text-sm text-secondary-500 dark:text-primary-300 flex items-center">
          <Clock className="h-4 w-4 mr-1.5" />
          Last saved: {lastSaved.toLocaleTimeString()}
        </span>
      ) : null;
    }

    if (status === 'saving') {
      return (
        <span className="text-sm text-secondary-500 dark:text-primary-300 flex items-center">
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          Saving...
        </span>
      );
    }

    if (status === 'saved' || status === 'idle') {
      return (
        <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Saved
        </span>
      );
    }

    return <div className="h-5 w-20" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!activeUser || !document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="w-full max-w-screen-lg mx-auto py-4 h-full">
            {/* Header */}
            <div className="flex items-center justify-end mb-6 h-10">
              <div className="flex items-center space-x-4">
                {/* Active Users Display */}
                {activeUsers.length > 0 && (
                  <div className="flex items-center space-x-2 bg-white dark:bg-secondary-800 rounded-lg px-3 py-2 shadow-sm border border-primary-200 dark:border-secondary-700">
                    <Users className="h-4 w-4 text-secondary-600 dark:text-primary-300" />
                    <span className="text-sm text-secondary-600 dark:text-primary-300">
                      {activeUsers.length} active
                    </span>
                    <div className="flex -space-x-2">
                      {activeUsers.slice(0, 3).map((activeUser, index) => {
                        const user = activeUser.user || {};
                        const name = user.name || 'User';
                        const color = user.color || '#888';
                        const id = user.id || index;

                        return (
                          <div
                            key={id}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-secondary-800 flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: color }}
                            title={name}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })}
                      {activeUsers.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-secondary-800 bg-secondary-400 flex items-center justify-center text-xs font-medium text-white">
                          +{activeUsers.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {getStatusIndicator()}

                {/* Share Button */}
                {(document?.role === 'admin' || document?.role === 'editor') && (
                  <button 
                    onClick={() => setShareModalOpen(true)} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                )}
              </div>
            </div>

            {/* Document Editor */}
            <div className="bg-white rounded-lg shadow border border-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-200 p-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title..."
                  className="text-3xl font-bold text-neutral-900 placeholder-neutral-400 bg-transparent border-none outline-none flex-1"
                  disabled={!isEditable}
                />
              </div>
              <div className="flex-1 min-h-0 p-6 bg-white">
                <BlockNoteView
                  className="min-h-[500px] bg-white"
                  editor={editor}
                  editable={isEditable}
                  theme="light"
                  onError={(error) => {
                    console.warn('BlockNote error:', error);
                  }}
                >
                  <SuggestionMenuController
                    triggerCharacter={"@"}
                    getItems={async (query) =>
                      filterSuggestionItems(getMentionMenuItems(editor), query)
                    }
                  />
                </BlockNoteView>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {document && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setShareModalOpen(false)} 
          document={document} 
        />
      )}
    </div>
  );
}

// Add Editor wrapper for default export
function Editor() {
  // This is a placeholder. You can customize or remove if not needed.
  return <div style={{textAlign: 'center', marginTop: '2rem'}}>Open a document from the dashboard to start editing.</div>;
}

export default Editor;