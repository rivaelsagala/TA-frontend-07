'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isLoading?: boolean;
}

export function ChatMessage({ message, isUser, isLoading }: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(!isUser && isLoading);

  useEffect(() => {
    if (!isUser && !isTyping) {
      setDisplayedText('');
      let index = 0;
      const timer = setInterval(() => {
        if (index < message.length) {
          setDisplayedText(message.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 30);
      return () => clearInterval(timer);
    } else {
      setDisplayedText(message);
    }
  }, [message, isUser, isTyping]);

  if (isLoading && isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs lg:max-w-md bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-xs lg:max-w-md rounded-2xl px-4 py-3 shadow-md',
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
        )}
      >
        <p className="text-sm leading-relaxed">{displayedText}</p>
        {isTyping && <span className="inline-block w-2 h-2 bg-current rounded-full ml-1 animate-pulse" />}
      </div>
    </div>
  );
}
