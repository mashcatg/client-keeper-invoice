import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useEffect, useState, useRef } from "react";

interface CKEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CKEditorWrapper = ({
  value,
  onChange,
  placeholder,
  disabled,
}: CKEditorWrapperProps) => {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy?.()
          .catch((error: any) => console.error('Editor cleanup failed:', error));
      }
      setMounted(false);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[100px] border rounded-md bg-gray-50 p-4">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="min-h-[100px] border rounded-md overflow-hidden bg-white">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onReady={(editor) => {
          editorRef.current = editor;
          // Set initial disabled state
          if (disabled) {
            editor.enableReadOnlyMode('disabled');
          } else {
            editor.disableReadOnlyMode('disabled');
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        disabled={disabled}
        config={{
          placeholder: placeholder,
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            '|',
            'bulletedList',
            'numberedList',
            '|',
            'outdent',
            'indent',
            '|',
            'link',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
            '|',
            'undo',
            'redo'
          ],
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
          },
        }}
      />
    </div>
  );
};

export default CKEditorWrapper;