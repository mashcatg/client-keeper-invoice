import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor = ({ value, onChange, placeholder, disabled }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-white p-2 border-b">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ml-2 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Italic
        </button>
      </div>
      <EditorContent 
        editor={editor} 
        className="prose max-w-none p-2"
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;