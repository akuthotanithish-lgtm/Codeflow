import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-xs text-slate-300">
        <span className="font-medium">{language || 'text'}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          background: '#1e293b'
        }}
        showLineNumbers={true}
        wrapLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          
          if (!inline && language) {
            return (
              <CodeBlock 
                language={language} 
                value={String(children).replace(/\n$/, '')} 
              />
            );
          }

          return (
            <code 
              className="bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-200 border border-slate-600"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Headers
        h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 mt-6 pb-2 border-b border-slate-700">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3 mt-5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
        h4: ({ children }) => <h4 className="text-base font-semibold text-white mb-2 mt-3">{children}</h4>,
        
        // Text
        p: ({ children }) => <p className="text-slate-200 mb-4 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
        
        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside text-slate-200 mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside text-slate-200 mb-4 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-slate-200 ml-4">{children}</li>,
        
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-purple-500 pl-4 italic text-slate-300 my-4 bg-slate-800/50 py-2 rounded-r">
            {children}
          </blockquote>
        ),
        
        // Table
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-800">{children}</thead>,
        tbody: ({ children }) => <tbody className="divide-y divide-slate-700">{children}</tbody>,
        tr: ({ children }) => <tr className="hover:bg-slate-800/50">{children}</tr>,
        th: ({ children }) => (
          <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-sm text-slate-300">
            {children}
          </td>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a 
            href={href} 
            className="text-purple-400 hover:text-purple-300 underline transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        
        // Horizontal Rule
        hr: () => <hr className="my-6 border-slate-700" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;