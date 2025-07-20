import { useDocuments } from '../context/DocumentContext';

const CreateDoc = () => {
  const { createDocument } = useDocuments();

  const handleCreate = async () => {
    try {
      console.log('Creating new document...');
      const newDoc = {
        title: ' ',
        content: [], // you can make this [] or an empty BlockNote doc
        createdAt: new Date().toISOString(),
      };

      const created = await createDocument(newDoc);
      console.log('Document created:', created);
      console.log('Response data:', created);
      // The document will be automatically selected and shown in the editor
    } catch (err) {
      console.error('Error creating doc:', err.message);
    }
  };

  return (
    <button 
      onClick={handleCreate}
      className="text-sm flex items-center text-blue-600 hover:text-blue-800 transition"
    >
      <span className="mr-1">+</span> New
    </button>
  );
};

export default CreateDoc;