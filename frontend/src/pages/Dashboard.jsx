import React, { useEffect, useState } from 'react';
import CreateDoc from '../Components/CreateDoc';
import Sidebar from '../Components/SideBar';
import { useDocuments } from '../context/DocumentContext';
import MyEditor from '../Components/MyEditor';

const Dashboard = () => {
  const { currentDocId, fetchDocuments } = useDocuments();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="w-64 bg-gray-100 border-r  overflow-y-auto">
          <Sidebar />
        </aside>
      )}

      {/* Main Editor Area */}
      <main className="flex-1 bg-white p-4 overflow-y-auto relative">
        {!isSidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            ☰
          </button>
        )}
        {currentDocId ? (
          <MyEditor documentId={currentDocId} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select or create a document to start editing ✍️
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
