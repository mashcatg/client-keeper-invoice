import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor = ({ value, onChange, placeholder, disabled }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Superscript,
      Subscript,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-white p-2 border-b flex flex-wrap gap-1">
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
          className={`p-1 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Underline
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
          className={`p-1 rounded ${editor?.isActive('superscript') ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Superscript
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleSubscript().run()}
          className={`p-1 rounded ${editor?.isActive('subscript') ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Subscript
        </button>
        <button
          type="button"
          onClick={addTable}
          className="p-1 rounded"
          disabled={disabled}
        >
          Insert Table
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          className={`p-1 rounded ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          className={`p-1 rounded ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Center
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          className={`p-1 rounded ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
          disabled={disabled}
        >
          Right
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