import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[100px] border rounded-md bg-gray-50">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="min-h-[100px] border rounded-md overflow-hidden">
      <CKEditor
        editor={ClassicEditor}
        data={value}
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