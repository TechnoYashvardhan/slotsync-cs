import React from 'react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  // Parse markdown into HTML string
  const rawHtml = React.useMemo(() => {
    try {
      const html = marked.parse(content || '');
      return typeof html === 'string' ? html : '';
    } catch (e) {
      console.error('Markdown parse error:', e);
      return content || '';
    }
  }, [content]);

  return (
    <div
      className={`markdown-content text-xs leading-relaxed space-y-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: rawHtml }}
    />
  );
};
