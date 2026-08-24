import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Escribe aquí la solución técnica detallada...',
  minHeight = '150px',
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        // If editor is empty, send empty string instead of '<p></p>'
        onChange(editor.isEmpty ? '' : html);
      }
    },
  });

  // Sync external value changes if needed
  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (!value && editor.isEmpty) return;
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-editor-container">
      {/* Toolbar */}
      <div className="rich-editor-toolbar">
        {/* Formatos básicos de texto */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rich-editor-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Negrita (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rich-editor-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Cursiva (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rich-editor-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          title="Tachado"
        >
          <s>S</s>
        </button>

        <div className="rich-editor-divider" />

        {/* Encabezados */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rich-editor-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          title="Título Principal (H2)"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rich-editor-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
          title="Subtítulo (H3)"
        >
          H3
        </button>

        <div className="rich-editor-divider" />

        {/* Listas */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rich-editor-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Lista Numerada de Pasos (1, 2, 3...)"
        >
          1. 2. 3.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rich-editor-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Lista con Viñetas"
        >
          • Lista
        </button>

        <div className="rich-editor-divider" />

        {/* Cita y Bloque de Código */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rich-editor-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          title="Bloque de Código / Comando"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rich-editor-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          title="Cita / Nota destacada"
        >
          ❝
        </button>

        <div className="rich-editor-divider" />

        {/* Deshacer / Rehacer */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rich-editor-btn"
          title="Deshacer (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rich-editor-btn"
          title="Rehacer (Ctrl+Y)"
        >
          ↪
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="rich-editor-content"
        style={{ minHeight }}
      />
    </div>
  );
}
