// DocumentContext.js
import { createContext, useContext, useState } from 'react';
import axios from 'axios';
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
        console.log('DocumentContext: Creating document with data:', newDoc);
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token found");

        console.log('DocumentContext: Sending request with token:', token ? 'Token exists' : 'No token');
        const res = await axios.post('http://localhost:5000/api/documents/create', newDoc, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('DocumentContext: Backend response:', res.data);
        
        // Add the new document to the local state
        if (res.data) {
          // Handle both response formats: {document: {...}} and direct document object
          const documentData = res.data.document || res.data;
          console.log('DocumentContext: Adding new document to state:', documentData);
          
          // Ensure the document has _id property
          const documentWithId = {
            ...documentData,
            _id: documentData._id || documentData.id
          };
          
          setDocuments(prevDocuments => {
            console.log('DocumentContext: Previous documents:', prevDocuments);
            const newDocuments = [...prevDocuments, documentWithId];
            console.log('DocumentContext: Updated documents array:', newDocuments);
            return newDocuments;
          });
          // Set the new document as the current document
          console.log('DocumentContext: Setting current doc ID to:', documentWithId._id);
          setCurrentDocId(documentWithId._id);
        } else {
          console.log('DocumentContext: No document in response or invalid response structure');
        }
        
        return res.data;
      } catch (err) {
        console.error('DocumentContext: Failed to create document:', err);
        throw err;
      }
    };

    const updateDocumentTitle = async (docId, newTitle) => {
      try {
        // Immediately update the local state for instant UI feedback
        setDocuments(prevDocuments => 
          prevDocuments.map(doc => 
            doc._id === docId || doc.id === docId 
              ? { ...doc, title: newTitle }
              : doc
          )
        );

        // Then update the backend
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token found");

        const res = await axios.put(`http://localhost:5000/api/documents/${docId}`, {
          title: newTitle
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        return res.data;
      } catch (err) {
        console.error('DocumentContext: Failed to update document title:', err);
        // Revert the local state change if backend update fails
        setDocuments(prevDocuments => 
          prevDocuments.map(doc => 
            doc._id === docId || doc.id === docId 
              ? { ...doc, title: doc.title || 'Untitled' }
              : doc
          )
        );
        throw err;
      }
    };

    // Direct state update function for immediate UI updates
    const updateDocumentInState = (docId, updates) => {
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc._id === docId || doc.id === docId 
            ? { ...doc, ...updates }
            : doc
        )
      );
    };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        error,
        fetchDocuments,
        createDocument,
        updateDocumentTitle,
        updateDocumentInState,
        currentDocId,
        setCurrentDocId
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
