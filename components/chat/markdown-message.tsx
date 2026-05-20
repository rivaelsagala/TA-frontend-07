'use client';

import { cn } from '@/lib/utils';
import { memo, useEffect, useState, useMemo } from 'react';

interface MarkdownMessageProps {
  content: string;
  isUser: boolean;
  skipTyping?: boolean; // Flag untuk skip typing effect (histori)
}

// OPTIMASI: Gunakan React.memo untuk menghindari re-render jika props tidak berubah
export const MarkdownMessage = memo(function MarkdownMessage({ content, isUser, skipTyping = false }: MarkdownMessageProps) {
  const [displayedText, setDisplayedText] = useState(skipTyping ? content : '');
  const [isTyping, setIsTyping] = useState(!isUser && !skipTyping);

  useEffect(() => {
    // Skip typing effect untuk histori atau pesan user
    if (skipTyping || isUser) {
      setDisplayedText(content);
      setIsTyping(false);
      return;
    }

    // Typing effect untuk pesan AI baru
    if (!isUser && content.length > 0) {
      setDisplayedText('');
      setIsTyping(true);
      let index = 0;
      const timer = setInterval(() => {
        if (index < content.length) {
          setDisplayedText(content.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 15);
      return () => clearInterval(timer);
    }
  }, [content, isUser, skipTyping]);

  // Simple markdown rendering
  const renderContent = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        // Code block
        const codeContent = part.replace(/```/g, '').trim();
        return (
          <pre key={idx} className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg my-2 overflow-x-auto text-xs">
            <code>{codeContent}</code>
          </pre>
        );
      }
      
      return (
        <div key={idx}>
          {part.split('\n').map((line, lineIdx) => {
            if (line.startsWith('# ')) {
              return <h1 key={lineIdx} className="text-lg font-bold mt-2 mb-1">{line.substring(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={lineIdx} className="text-base font-bold mt-2 mb-1">{line.substring(3)}</h2>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <ul key={lineIdx} className="list-disc ml-4">
                  <li>{line.substring(2)}</li>
                </ul>
              );
            }
            return (
              <p key={lineIdx} className="mb-1">
                {line || <br />}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className={cn('flex mb-4 gap-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl px-4 py-3 shadow-md max-w-2xl',
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
        )}
      >
        <div className="text-sm leading-relaxed">
          {renderContent(displayedText)}
          {isTyping && !isUser && <span className="inline-block w-2 h-2 bg-current rounded-full ml-1 animate-pulse" />}
        </div>
      </div>
    </div>
  );
});

// Tambahkan displayName untuk debugging yang lebih baik
MarkdownMessage.displayName = 'MarkdownMessage';
