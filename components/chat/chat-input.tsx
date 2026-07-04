'use client';

import { Button } from '@/components/ui/button';
import { BarChart3, Send } from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  ragasEnabled?: boolean;
  onToggleRagas?: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  ragasEnabled = false,
  onToggleRagas,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // =========================
  // TEXTAREA RESIZE
  // =========================
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '40px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const resetTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '40px';
  };

  // =========================
  // SEND MESSAGE (VALIDATED)
  // =========================
  const handleSend = () => {
    const message = input.trim();

    // ❌ VALIDASI UTAMA
    if (!message) {
      setError('Pesan tidak boleh kosong');
      return;
    }

    if (isLoading) return;

    // reset error jika valid
    setError('');

    onSend(message);
    setInput('');
    resetTextareaHeight();
  };

  // =========================
  // KEYBOARD HANDLER
  // =========================
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // =========================
  // INPUT HANDLER
  // =========================
  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // ❌ HAPUS ERROR SAAT USER MENGETIK LAGI
    if (error) setError('');

    requestAnimationFrame(() => {
      resizeTextarea();
    });
  };

  // =========================
  // UI STATE
  // =========================
  const isDisabled = isLoading || input.trim() === '';

  return (
    <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 focus-within:ring-2 focus-within:ring-[#007AFF] focus-within:border-[#007AFF] transition">
            {/* TEXTAREA */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan Anda di sini..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none min-h-10 px-1 py-2 text-sm sm:text-base overflow-hidden leading-6 disabled:opacity-70"
            />

            {/* RAGAS TOGGLE (DESKTOP) */}
            <button
              type="button"
              onClick={onToggleRagas}
              disabled={isLoading}
              title="Aktifkan atau nonaktifkan evaluasi RAGAS"
              className={`mb-0.5 hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${
                ragasEnabled
                  ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>RAGAS</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  ragasEnabled
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {ragasEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* RAGAS TOGGLE (MOBILE) */}
            <button
              type="button"
              onClick={onToggleRagas}
              disabled={isLoading}
              title="Evaluasi RAGAS"
              className={`mb-0.5 flex sm:hidden items-center justify-center rounded-full border h-9 w-9 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                ragasEnabled
                  ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <p className="text-xs text-red-500 ml-1">
              {error}
            </p>
          )}
        </div>

        {/* SEND BUTTON */}
        <Button
          onClick={handleSend}
          disabled={isDisabled}
          size="icon"
          className="bg-[#007AFF] hover:bg-[#006FE6] text-white rounded-xl h-12 w-12 shadow-sm disabled:bg-[#007AFF]/50 disabled:text-white disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}