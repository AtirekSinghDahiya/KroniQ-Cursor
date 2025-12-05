import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parseMarkdown = (text: string) => {
    const elements: JSX.Element[] = [];
    const lines = text.split('\n');
    let currentList: string[] = [];
    let currentTable: string[][] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-3 ml-6 space-y-1.5">
            {currentList.map((item, i) => (
              <li key={i} className="text-white/80 flex items-start">
                <span className="text-[#00FFF0] mr-2">•</span>
                <span dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
            <table className="min-w-full border border-[#00FFF0]/20 rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-[#00FFF0]/10 to-[#8A2BE2]/10">
                <tr>
                  {currentTable[0].map((cell, i) => (
                    <th key={i} className="px-4 py-2 text-left text-white/90 font-semibold border-b border-[#00FFF0]/20">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTable.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 text-white/70">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = [];
      }
    };

    const parseInline = (text: string): string => {
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-[#00FFF0]/10 text-[#00FFF0] rounded text-sm font-mono">$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#00FFF0] hover:text-[#00FFF0]/80 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${elements.length}`} className="my-4 rounded-lg overflow-hidden border border-[#00FFF0]/20">
              <div className="bg-gradient-to-r from-[#00FFF0]/10 to-[#8A2BE2]/10 px-4 py-2 text-[#00FFF0] text-xs font-semibold uppercase">
                {codeLanguage || 'Code'}
              </div>
              <pre className="bg-black/40 p-4 overflow-x-auto">
                <code className="text-sm text-white/80 font-mono">{codeContent}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeContent = '';
          codeLanguage = '';
        } else {
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      if (line.match(/^\|(.+)\|$/)) {
        flushList();
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        if (!line.includes('---')) {
          currentTable.push(cells);
        }
        continue;
      } else {
        flushTable();
      }

      if (line.match(/^-\s+/) || line.match(/^\*\s+/) || line.match(/^\d+\.\s+/)) {
        const content = line.replace(/^[-*\d+\.]\s+/, '');
        currentList.push(content);
        continue;
      } else {
        flushList();
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-3xl font-bold text-white mt-6 mb-4 leading-tight font-['Inter',sans-serif]">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-2xl font-semibold text-white mt-5 mb-3 leading-snug font-['Inter',sans-serif]">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-xl font-medium text-white/90 mt-4 mb-2 leading-snug font-['Inter',sans-serif]">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${elements.length}`} className="my-3 pl-4 border-l-4 border-[#00FFF0]/50 italic text-white/70">
            {line.slice(2)}
          </blockquote>
        );
      } else if (line.trim()) {
        elements.push(
          <p
            key={`p-${elements.length}`}
            className="text-white/80 leading-relaxed my-2"
            dangerouslySetInnerHTML={{ __html: parseInline(line) }}
          />
        );
      } else {
        elements.push(<div key={`space-${elements.length}`} className="h-2" />);
      }
    }

    flushList();
    flushTable();

    return elements;
  };

  return <div className="markdown-content">{parseMarkdown(content)}</div>;
};
