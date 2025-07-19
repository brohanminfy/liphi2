import React from 'react';
import { useDocuments } from '../context/DocumentContext';
import { FileText, Edit, Eye, Plus } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const Sidebar = () => {
  const { documents, createDocument, setCurrentDocId } = useDocuments();

  const token = localStorage.getItem('token');
  let userId = '';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userId = decoded.uid || decoded.email; // adjust based on your token
    } catch (err) {
      console.error('Invalid token', err);
    }
  }

  const adminDocs = documents.filter(doc =>
    doc.roles?.admins?.includes(userId)
  );

  const editableDocs = documents.filter(doc =>
    doc.roles?.editors?.includes(userId) && doc.createdBy !== userId
  );

  const viewOnlyDocs = documents.filter(doc =>
    doc.roles?.viewers?.includes(userId) && doc.createdBy !== userId
  );

  const handleCreate = async () => {
    try {
      const newDoc = {
        title: 'Untitled Document',
        content: [],
        createdAt: new Date().toISOString(),
      };
      const created = await createDocument(newDoc);
      console.log(created)
      if (created?.id) {
        console.log(created?._id)
        setCurrentDocId(created.id); // ✅ open after creation
      }
      
    } catch (err) {
      console.error('Error creating doc:', err.message);
    }
  };

  const renderDocs = (docs) =>
    docs.map((doc) => (
      <li
        key={doc.id}
        onClick={() => setCurrentDocId(doc.id)}
        className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 transition cursor-pointer truncate"
        title={doc.title || 'Untitled'}
      >
        📄 {doc.title || 'Untitled'}
      </li>
    ));

  return (
    <aside className="w-full h-full overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-md p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          My Docs
        </h2>
        <button
          onClick={handleCreate}
          className="text-sm flex items-center text-blue-600 hover:text-blue-800 transition"
        >
          <Plus className="w-4 h-4 mr-1" /> New
        </button>
      </div>

      <div>
        <h3 className="flex items-center text-gray-500 uppercase text-xs font-bold mb-1">
          <FileText className="w-4 h-4 mr-1" />
          Owned by Me
        </h3>
        <ul className="space-y-1">{renderDocs(adminDocs)}</ul>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="flex items-center text-gray-500 uppercase text-xs font-bold mb-1">
          <Edit className="w-4 h-4 mr-1" />
          Editable
        </h3>
        <ul className="space-y-1">{renderDocs(editableDocs)}</ul>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="flex items-center text-gray-500 uppercase text-xs font-bold mb-1">
          <Eye className="w-4 h-4 mr-1" />
          View Only
        </h3>
        <ul className="space-y-1">{renderDocs(viewOnlyDocs)}</ul>
      </div>
    </aside>
  );
};

export default Sidebar;
