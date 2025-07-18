import { useDocuments } from '../context/DocumentContext';

const CreateDoc = () => {
  const { createDocument } = useDocuments();

  const handleCreate = async () => {
    try {
      const newDoc = {
        title: 'Untitled Document',
        content: [], // you can make this [] or an empty BlockNote doc
        createdAt: new Date().toISOString(),
      };

      const created = await createDocument(newDoc);
      console.log('Document created:', created);
      // Optionally: navigate to the new document
    } catch (err) {
      console.error('Error creating doc:', err.message);
    }
  };

  return <button onClick={handleCreate}>+ New Doc</button>;
};

export default CreateDoc;