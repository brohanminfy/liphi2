import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState, useRef } from "react";
import { useDocuments } from "../context/DocumentContext";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebase";

// Default block structure for new documents
const defaultContent = [
  {
    id: "default-block",
    type: "paragraph",
    content: [],
    props: {}
  }
];

export default function MyEditor() {
  const { currentDocId } = useDocuments();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [key, setKey] = useState(0);
  const [isUpdatingFromExternal, setIsUpdatingFromExternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(new Set());
  const [localStorageKey, setLocalStorageKey] = useState("");

  // Block change tracking
  const changedBlocks = useRef(new Map()); // blockId -> { content, timestamp }
  const syncInterval = useRef(null);
  const lastSavedContent = useRef(null);

  // Create BlockNote editor with current content
  const editor = useCreateBlockNote({
    initialContent: content,
  });

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set localStorage key when document changes
  useEffect(() => {
    if (currentDocId) {
      const key = `doc_${currentDocId}_content`;
      setLocalStorageKey(key);
    }
  }, [currentDocId]);

  // Load content from localStorage on mount
  useEffect(() => {
    if (localStorageKey && localStorage.getItem(localStorageKey)) {
      try {
        const savedContent = JSON.parse(localStorage.getItem(localStorageKey));
        const savedTimestamp = localStorage.getItem(`${localStorageKey}_timestamp`);
        
        if (savedContent && savedTimestamp) {
          console.log("📱 Loaded content from localStorage:", savedContent);
          setIsUpdatingFromExternal(true);
          setContent(savedContent);
          lastSavedContent.current = savedContent;
          setLastSyncedAt(new Date(parseInt(savedTimestamp)));
          // Reset the flag after a short delay to allow editor to update
          setTimeout(() => setIsUpdatingFromExternal(false), 100);
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
    }
  }, [localStorageKey]);

  // Save to localStorage whenever content changes
  useEffect(() => {
    if (localStorageKey && content && !isUpdatingFromExternal) {
      try {
        console.log("💾 Saving to localStorage, content length:", content.length);
        console.log("💾 Content to save:", content);
        localStorage.setItem(localStorageKey, JSON.stringify(content));
        localStorage.setItem(`${localStorageKey}_timestamp`, Date.now().toString());
        console.log("✅ Saved to localStorage successfully");
      } catch (error) {
        console.error("❌ Error saving to localStorage:", error);
      }
    } else {
      console.log("🚫 Not saving to localStorage:", {
        hasLocalStorageKey: !!localStorageKey,
        hasContent: !!content,
        isUpdatingFromExternal
      });
    }
  }, [content, localStorageKey, isUpdatingFromExternal]);

  // Save title to localStorage whenever it changes
  useEffect(() => {
    if (localStorageKey && title) {
      try {
        console.log("💾 Saving title to localStorage:", title);
        localStorage.setItem(`${localStorageKey}_title`, title);
        localStorage.setItem(`${localStorageKey}_title_timestamp`, Date.now().toString());
        console.log("✅ Title saved to localStorage successfully");
      } catch (error) {
        console.error("❌ Error saving title to localStorage:", error);
      }
    }
  }, [title, localStorageKey]);

  // Load title from localStorage on mount
  useEffect(() => {
    if (localStorageKey && localStorage.getItem(`${localStorageKey}_title`)) {
      try {
        const savedTitle = localStorage.getItem(`${localStorageKey}_title`);
        const savedTimestamp = localStorage.getItem(`${localStorageKey}_title_timestamp`);
        
        if (savedTitle && savedTimestamp) {
          console.log("📱 Loaded title from localStorage:", savedTitle);
          setTitle(savedTitle);
        }
      } catch (error) {
        console.error("Error loading title from localStorage:", error);
      }
    }
  }, [localStorageKey]);

  // Handle content changes from BlockNote editor
  useEffect(() => {
    if (!editor) {
      console.log("🚫 No editor available");
      return;
    }

    console.log("🔍 Editor methods available:", Object.getOwnPropertyNames(editor));
    console.log("🔍 Editor prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(editor)));

    const handleChange = () => {
      console.log("🔄 Content change detected, isUpdatingFromExternal:", isUpdatingFromExternal);
      if (!isUpdatingFromExternal) {
        // Get the actual content from the editor (not from callback parameter)
        const newContent = editor.topLevelBlocks;
        console.log("📝 New content from editor:", newContent);
        
        // Initialize lastSavedContent if it doesn't exist
        if (!lastSavedContent.current) {
          lastSavedContent.current = newContent;
          console.log("🔄 Initializing lastSavedContent");
        }
        
        // Track individual block changes
        const newBlocks = new Map(newContent.map(block => [block.id, block]));
        const oldBlocks = new Map(lastSavedContent.current.map(block => [block.id, block]));
        
        // Find changed blocks
        newContent.forEach(block => {
          const oldBlock = oldBlocks.get(block.id);
          if (!oldBlock || JSON.stringify(oldBlock) !== JSON.stringify(block)) {
            changedBlocks.current.set(block.id, {
              content: block,
              timestamp: Date.now()
            });
            setPendingChanges(prev => {
              const newSet = new Set([...prev, block.id]);
              console.log("📝 Updated pendingChanges:", Array.from(newSet));
              return newSet;
            });
            console.log("🔍 Block changed:", block.id);
          }
        });
        
        // Find deleted blocks
        lastSavedContent.current.forEach(block => {
          if (!newBlocks.has(block.id)) {
            changedBlocks.current.set(block.id, {
              content: null, // null indicates deletion
              timestamp: Date.now()
            });
            setPendingChanges(prev => {
              const newSet = new Set([...prev, block.id]);
              console.log("📝 Updated pendingChanges (deleted):", Array.from(newSet));
              return newSet;
            });
            console.log("🗑️ Block deleted:", block.id);
          }
        });
        
        setContent(newContent);
        setIsDirty(true);
        lastSavedContent.current = newContent;
        
        console.log("🎯 Content changed, pending blocks:", Array.from(pendingChanges));
      } else {
        console.log("🚫 Ignoring content change (external update)");
      }
    };

    console.log("🔗 Setting up content change subscription");
    let unsubscribe;
    
    // Try multiple approaches to detect content changes
    if (typeof editor.onEditorContentChange === 'function') {
      console.log("📝 Using onEditorContentChange method");
      unsubscribe = editor.onEditorContentChange(handleChange);
    } else if (typeof editor.onChange === 'function') {
      console.log("📝 Using onChange method");
      unsubscribe = editor.onChange(handleChange);
    } else if (typeof editor.onEditorSelectionChange === 'function') {
      console.log("📝 Using onEditorSelectionChange method");
      unsubscribe = editor.onEditorSelectionChange(handleChange);
    } else {
      console.log("❌ No content change method available, trying alternative approach");
      
      // Alternative: Use a polling approach to detect changes
      const pollInterval = setInterval(() => {
        const currentContent = editor.topLevelBlocks;
        if (lastSavedContent.current && JSON.stringify(currentContent) !== JSON.stringify(lastSavedContent.current)) {
          console.log("🔄 Content change detected via polling");
          handleChange();
        }
      }, 1000);
      
      unsubscribe = () => clearInterval(pollInterval);
    }

    console.log("✅ Content change subscription set up successfully");

    // Add fallback polling to ensure changes are detected
    const fallbackInterval = setInterval(() => {
      if (editor && !isUpdatingFromExternal) {
        const currentContent = editor.topLevelBlocks;
        if (lastSavedContent.current && JSON.stringify(currentContent) !== JSON.stringify(lastSavedContent.current)) {
          console.log("🔄 Content change detected via fallback polling");
          handleChange();
        }
      }
    }, 1000); // Check every 2 seconds as fallback

    return () => {
      console.log("🔌 Cleaning up content change subscription");
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(fallbackInterval);
    };
  }, [editor]); // Remove isUpdatingFromExternal from dependencies

  // Debounced sync to Firebase (only when there are changes)
  useEffect(() => {
    if (!currentDocId) return;

    const syncToFirebase = async () => {
      console.log("🔄 Sync check:", {
        isOnline,
        pendingChangesSize: pendingChanges.size,
        changedBlocksSize: changedBlocks.current.size,
        hasContent: !!content
      });
      
      if (!isOnline) {
        console.log("🚫 Not syncing - offline");
        return;
      }
      
      if (pendingChanges.size === 0) {
        console.log("🚫 Not syncing - no pending changes");
        return;
      }

      try {
        console.log("🔄 Syncing to Firebase, changed blocks:", Array.from(pendingChanges));
        
        const docRef = doc(db, "documents", currentDocId);
        const updateData = {
          updatedAt: new Date(),
          lastSyncedAt: new Date()
        };

        // Handle title changes
        if (pendingChanges.has('title')) {
          updateData.title = title;
          console.log("📝 Syncing title:", title);
        }

        // Handle content block changes
        if (changedBlocks.current.size > 0) {
          const changedBlocksData = {};
          changedBlocks.current.forEach((blockData, blockId) => {
            if (blockId !== 'title') { // Don't include title in changedBlocks
              changedBlocksData[blockId] = blockData;
            }
          });
          
          if (Object.keys(changedBlocksData).length > 0) {
            updateData.changedBlocks = changedBlocksData;
            updateData.content = content; // Full content for backup
            console.log("📝 Syncing content blocks:", Object.keys(changedBlocksData));
          }
        }

        console.log("📤 Sending update to Firebase:", updateData);
        await updateDoc(docRef, updateData);
        
        // Clear pending changes after successful sync
        changedBlocks.current.clear();
        setPendingChanges(new Set());
        setLastSyncedAt(new Date());
        
        console.log("✅ Synced to Firebase successfully");
      } catch (error) {
        console.error("❌ Error syncing to Firebase:", error);
      }
    };

    // Clear any existing sync timeout
    if (syncInterval.current) {
      clearTimeout(syncInterval.current);
    }

    // Only set up sync if there are pending changes
    if (pendingChanges.size > 0 && isOnline) {
      console.log("⏰ Setting up debounced sync in 3 seconds");
      syncInterval.current = setTimeout(syncToFirebase, 2000);
    }

    return () => {
      if (syncInterval.current) {
        clearTimeout(syncInterval.current);
      }
    };
  }, [currentDocId, isOnline, pendingChanges, content, title]);

  // Load content into editor when content changes from external source
  useEffect(() => {
    if (editor && content && !isDirty) {
      try {
        const currentEditorContent = editor.topLevelBlocks;
        const contentIsDifferent = JSON.stringify(currentEditorContent) !== JSON.stringify(content);
        
        if (contentIsDifferent) {
          setIsUpdatingFromExternal(true);
          if (typeof editor.insertBlocks === 'function') {
            editor.removeBlocks(editor.topLevelBlocks);
            editor.insertBlocks(content, editor.topLevelBlocks[0], "before");
          }
          setIsUpdatingFromExternal(false);
          lastSavedContent.current = content;
        }
      } catch (error) {
        console.error("Error updating editor content:", error);
        setIsUpdatingFromExternal(false);
        setKey(prev => prev + 1);
      }
    }
  }, [content, editor, isDirty]);

  // Handle initial content loading when editor is created
  useEffect(() => {
    if (editor && content && editor.topLevelBlocks.length === 1 && 
        editor.topLevelBlocks[0].id === "default-block" && 
        content.length > 0 && 
        content[0].id !== "default-block") {
      try {
        setIsUpdatingFromExternal(true);
        if (typeof editor.insertBlocks === 'function') {
          editor.removeBlocks(editor.topLevelBlocks);
          editor.insertBlocks(content, editor.topLevelBlocks[0], "before");
        }
        setIsUpdatingFromExternal(false);
        lastSavedContent.current = content;
      } catch (error) {
        console.error("Error loading initial content:", error);
        setIsUpdatingFromExternal(false);
      }
    }
  }, [editor, content]);

  // Fetch document content from Firestore
  const fetchDocumentContent = async (docId) => {
    if (!docId) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, "documents", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || "Untitled Document");
        const documentContent = data.content && data.content.length > 0 ? data.content : defaultContent;
        setContent(documentContent);
        lastSavedContent.current = documentContent;
        setIsDirty(false);
        setLastSyncedAt(data.lastSyncedAt?.toDate() || new Date());
      } else {
        setTitle("Untitled Document");
        setContent(defaultContent);
        lastSavedContent.current = defaultContent;
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      setLoading(false);
    }
  };

  // Manual save function
  const saveToFirestore = async () => {
    if (!currentDocId) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, "documents", currentDocId);
      const updateData = {
        content: content,
        title: title,
        updatedAt: new Date(),
        lastSyncedAt: new Date()
      };

      // Include changed blocks if any
      if (changedBlocks.current.size > 0) {
        const changedBlocksData = {};
        changedBlocks.current.forEach((blockData, blockId) => {
          if (blockId !== 'title') { // Don't include title in changedBlocks
            changedBlocksData[blockId] = blockData;
          }
        });
        
        if (Object.keys(changedBlocksData).length > 0) {
          updateData.changedBlocks = changedBlocksData;
        }
      }

      await updateDoc(docRef, updateData);
      
      // Clear all pending changes
      changedBlocks.current.clear();
      setPendingChanges(new Set());
      setIsDirty(false);
      lastSavedContent.current = content;
      
      console.log("✅ Manual save completed");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    } finally {
      setSaving(false);
    }
  };

  // Listen for real-time updates (for collaboration)
  useEffect(() => {
    if (!currentDocId) return;

    const docRef = doc(db, "documents", currentDocId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (JSON.stringify(data.content) !== JSON.stringify(content)) {
          setTitle(data.title || "Untitled Document");
          const documentContent = data.content && data.content.length > 0 ? data.content : defaultContent;
          setContent(documentContent);
          lastSavedContent.current = documentContent;
          setIsDirty(false);
          setLastSyncedAt(data.lastSyncedAt?.toDate() || new Date());
        }
      }
    });

    return () => unsubscribe();
  }, [currentDocId]);

  // Fetch content when document changes
  useEffect(() => {
    if (currentDocId) {
      fetchDocumentContent(currentDocId);
    }
  }, [currentDocId]);

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    console.log("📝 Title changed to:", newTitle);
    setTitle(newTitle);
    setIsDirty(true);
    
    // Add title to pending changes for sync
    setPendingChanges(prev => {
      const newSet = new Set([...prev, 'title']);
      console.log("📝 Updated pendingChanges (title):", Array.from(newSet));
      return newSet;
    });
    changedBlocks.current.set('title', {
      content: newTitle,
      timestamp: Date.now()
    });
    
    console.log("🎯 Title change added to pending changes");
  };

  // Handle manual save
  const handleSave = async () => {
    if (isDirty) {
      await saveToFirestore();
    }
  };

  if (!currentDocId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a document to start editing
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center flex-1 mr-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold focus:outline-none flex-1"
            placeholder="Document Title"
          />
          <div className="ml-4 flex items-center space-x-2">
            {!isOnline && (
              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                🔴 Offline
              </span>
            )}
            {isOnline && pendingChanges.size > 0 && (
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                🔄 Syncing...
              </span>
            )}
            {lastSyncedAt && (
              <span className="text-xs text-gray-500">
                Last synced: {lastSyncedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            isDirty && !saving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <BlockNoteView key={key} editor={editor} />
      </div>
      {isDirty && (
        <div className="text-xs text-orange-500 p-2 bg-orange-50 border-t">
          ⚠️ You have unsaved changes. {!isOnline && "Working offline - changes saved locally."}
        </div>
      )}
    </div>
  );
}
