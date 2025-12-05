import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 20, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}<span className="animate-pulse">|</span></span>;
};

interface TypingIndicatorProps {
  show: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="flex items-center gap-2 text-white/60 text-sm">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-[#00FFF0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-[#00FFF0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-[#00FFF0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>KroniQ is thinking...</span>
    </div>
  );
};
