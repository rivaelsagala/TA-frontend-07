'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showScrollbar, setShowScrollbar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
      setShowScrollbar(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';

      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 120);

      textareaRef.current.style.height = newHeight + 'px';
      setShowScrollbar(scrollHeight > 120);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan Anda di sini..."
          className={`flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] resize-none min-h-10 max-h-32 ${
            showScrollbar ? 'overflow-y-auto' : 'overflow-y-hidden'
          }`}
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="bg-[#007AFF] hover:bg-[#006FE6] text-white rounded-xl h-10 w-10 shadow-sm disabled:bg-[#007AFF]/50 disabled:text-white disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}