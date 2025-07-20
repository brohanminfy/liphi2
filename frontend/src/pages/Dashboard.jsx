import React, { useEffect, useState } from 'react';
import CreateDoc from '../Components/CreateDoc';
import Sidebar from '../Components/Sidebar';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import MyEditor from '../Components/MyEditor';
import { Menu, User } from 'lucide-react';

const Dashboard = () => {
  const { currentDocId, fetchDocuments } = useDocuments();
  const { userData } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="w-64 bg-gray-100 border-r overflow-y-auto">
          <Sidebar />
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-gray-200">Liphi Editor</h3>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{userData?.username || userData?.email || 'User'}</span>
            </div>
          </div>
        </header> <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-gray-200">Liphi Editor</h3>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{userData?.username || userData?.email || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Main Editor Area */}
        <main className="flex-1 bg-white p-4 overflow-y-auto relative">
          {currentDocId ? (
            <MyEditor documentId={currentDocId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select or create a document to start editing ✍️
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
