'use client';

import { ChatInput } from '@/components/chat/chat-input';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { Message } from '@/lib/conversation';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  isEmpty?: boolean;
  error?: string | null;
}

export function ChatWindow({ messages, isLoading, onSendMessage, isEmpty, error }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-12 h-12 text-purple-300 dark:text-purple-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start a conversation</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">
              Ask me anything. I'm here to help with questions, creative writing, coding, and more.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MarkdownMessage
                key={message.id}
                content={message.content}
                isUser={message.role === 'user'}
              />
            ))}
            {error && (
              <div className="flex justify-start gap-3">
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gray-100 dark:bg-gray-800">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
}
