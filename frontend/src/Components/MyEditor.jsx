import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
 
export default function MyEditor({ documentId }) {
  const editor = useCreateBlockNote();
 
  return <BlockNoteView editor={editor} />;
}
