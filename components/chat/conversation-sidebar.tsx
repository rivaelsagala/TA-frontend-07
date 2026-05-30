'use client';

import { Button } from '@/components/ui/button';
import { Conversation } from '@/lib/conversation';
import { MessageCircle, PanelLeftClose, Plus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onMenuClick?: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onMenuClick,
  width = 240,
  onWidthChange,
}: ConversationSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      
      const newWidth = e.clientX;
      // Min width 192px (w-48), Max width 448px (w-112)
      if (newWidth >= 192 && newWidth <= 448) {
        onWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, onWidthChange]);

  // Update width via ref instead of inline style
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${width}px`;
    }
  }, [width]);

  return (
    <div 
      ref={sidebarRef}
      className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative"
    >
      {/* Resize handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute right-0 top-0 h-full w-1 hover:bg-[#007AFF] cursor-col-resize hover:w-1.5 transition-all group"
        title="Drag to resize sidebar"
      />

      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button
            onClick={onNewChat}
            className="flex-1 bg-[#007AFF] hover:bg-[#006FE6] text-white rounded-lg font-medium shadow-md"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            New Chat
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10 shrink-0 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="px-2 py-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`relative group mb-0.5 h-11 px-2 rounded-md cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-[#EAF4FF] dark:bg-[#0A2747] text-[#007AFF] dark:text-[#7AB8FF]'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-start gap-1.5 pr-8">
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs opacity-70 truncate">{formatDate(conv.updatedAt)}</p>
                  </div>
                </div>

                {/* Delete button - Hanya tampil untuk conversation yang aktif/dipilih */}
                {currentConversationId === conv.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="absolute right-2 top-2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-opacity"
                    aria-label="Delete conversation"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}