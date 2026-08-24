import React from 'react';
import DOMPurify from 'dompurify';
import './RichTextEditor.css';

export default function RichTextViewer({ content, className = '' }) {
  if (!content) return null;

  // Check if content contains HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    const cleanHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'b', 'i', 'em', 'strong', 'a', 'h2', 'h3', 'h4',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 's', 'strike',
        'br', 'span', 'hr'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    });

    return (
      <div
        className={`rich-text-view ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Fallback for plain text: preserve line breaks
  return (
    <div className={`rich-text-view ${className}`} style={{ whiteSpace: 'pre-line' }}>
      {content}
    </div>
  );
}
