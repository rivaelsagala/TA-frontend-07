'use client';

import { ChatInput } from '@/components/chat/chat-input';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { Message } from '@/lib/conversation';
import { MessageCircle } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  isEmpty?: boolean;
  error?: string | null;
  isHistoryLoading?: boolean; // Flag untuk menandai loading histori
}

// OPTIMASI: Gunakan React.memo untuk menghindari re-render berlebihan
export const ChatWindow = memo(function ChatWindow({
  messages,
  isLoading,
  onSendMessage,
  isEmpty,
  error,
  isHistoryLoading = false,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    // Auto-scroll to bottom hanya untuk pesan baru, tidak untuk histori
    if (messages.length > prevMessagesLengthRef.current || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-gray-950">
      {/* Messages Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-purple-300 dark:text-purple-800 mb-3 sm:mb-4" />

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Mulai Sebuah Percakapan
            </h2>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xs sm:max-w-sm">
              Tanyakan saya apa aja. Saya disini membantu menjawab pertanyaan mengenai peraturan Desa.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MarkdownMessage
                key={message.id}
                content={message.content}
                isUser={message.role === 'user'}
                skipTyping={isHistoryLoading || index < messages.length - 1}
              />
            ))}

            {error && (
              <div className="flex justify-start gap-3">
                <div className="rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2.5 sm:py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 max-w-[90%] sm:max-w-md md:max-w-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />

                    <span className="text-red-700 dark:text-red-300 text-xs sm:text-sm">
                      {error}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" />
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
});

ChatWindow.displayName = 'ChatWindow';