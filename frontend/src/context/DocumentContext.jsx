// DocumentContext.js
import { createContext, useContext, useState } from 'react';import axios from 'axios'
const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null); // NEW STATE

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const res = await axios.get('http://localhost:5000/api/documents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setDocuments(res.data.documents || []);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

    const createDocument = async (newDoc) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token found");

        const res = await axios.post('http://localhost:5000/api/documents/create', newDoc, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log(res.data)
        return res.data;
      } catch (err) {
        console.error('Failed to create document:', err);
        throw err;
      }
    };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        error,
        fetchDocuments,
        createDocument,
        currentDocId,
        setCurrentDocId
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
