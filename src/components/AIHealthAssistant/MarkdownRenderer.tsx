import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-slate prose-sm max-w-none text-slate-600 ${className}`}>
      <ReactMarkdown
        components={{
          // Map standard markdown to styled HTML tags matching the site's aesthetic
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-emerald-700" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
