import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MessageSearchBarProps {
  messages: Message[];
  onSearchResults: (results: number[], currentIndex: number) => void;
  onClose: () => void;
}

export const MessageSearchBar: React.FC<MessageSearchBarProps> = ({
  messages,
  onSearchResults,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setCurrentIndex(0);
      onSearchResults([], 0);
      return;
    }

    const matchingIndices: number[] = [];
    const normalizedQuery = isCaseSensitive ? searchQuery : searchQuery.toLowerCase();

    messages.forEach((message, index) => {
      const content = isCaseSensitive ? message.content : message.content.toLowerCase();
      if (content.includes(normalizedQuery)) {
        matchingIndices.push(index);
      }
    });

    setResults(matchingIndices);
    setCurrentIndex(matchingIndices.length > 0 ? 0 : -1);
    onSearchResults(matchingIndices, matchingIndices.length > 0 ? 0 : -1);
  }, [messages, isCaseSensitive, onSearchResults]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, performSearch]);

  const handlePrevious = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    setCurrentIndex(newIndex);
    onSearchResults(results, newIndex);
  };

  const handleNext = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onSearchResults(results, newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
      {/* Search Icon */}
      <Search className="w-4 h-4 text-white/40 flex-shrink-0" />

      {/* Search Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search messages... (Enter: next, Shift+Enter: prev, Esc: close)"
        className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
        autoFocus
      />

      {/* Results Counter */}
      {query && (
        <span className="text-xs text-white/40 whitespace-nowrap">
          {results.length > 0 ? `${currentIndex + 1} / ${results.length}` : 'No results'}
        </span>
      )}

      {/* Case Sensitive Toggle */}
      <button
        onClick={() => setIsCaseSensitive(!isCaseSensitive)}
        className={`px-2 py-1 rounded text-xs transition-colors ${
          isCaseSensitive
            ? 'bg-[#00FFF0]/20 text-[#00FFF0] border border-[#00FFF0]/50'
            : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
        }`}
        title="Case sensitive search"
      >
        Aa
      </button>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          disabled={results.length === 0}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Previous (Shift+Enter)"
        >
          <ChevronUp className="w-4 h-4 text-white/60" />
        </button>
        <button
          onClick={handleNext}
          disabled={results.length === 0}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Next (Enter)"
        >
          <ChevronDown className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
        title="Close (Esc)"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>
    </div>
  );
};
