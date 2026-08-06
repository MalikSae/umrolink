'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from './utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'h-8 w-8 flex items-center justify-center rounded text-sm transition-colors',
        active
          ? 'bg-primary text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-32 focus:outline-none p-3 text-neutral-900 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // Emit empty string if only empty paragraph
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  if (!editor) return null;

  return (
    <div className={cn('border border-neutral-200 rounded-md bg-surface overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-neutral-200 bg-neutral-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="h-5 w-px bg-neutral-200 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        placeholder={placeholder}
        className="min-h-32"
      />
    </div>
  );
}
