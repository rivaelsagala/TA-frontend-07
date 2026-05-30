'use client';

import { AccountSettingsModal } from '@/components/chat/account-settings-modal';
import { ChatWindow } from '@/components/chat/chat-window';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { TopBar } from '@/components/chat/top-bar';
import { Button } from '@/components/ui/button';
import { useBackendChat } from '@/hooks/useBackendChat';
import { Conversation, Message, createMessage } from '@/lib/conversation';
import { ChatSessionData, ChatHistoryData } from '@/types/chat';
import { PanelLeftClose } from 'lucide-react';
import { useEffect, useState } from 'react';

// const FLASK_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CURRENT_USER_ID = 1; 

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default false, akan di-set di useEffect
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); 
  
  // State untuk melacak sesi mana yang sedang loading history-nya
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Flag untuk menandai bahwa pesan saat ini adalah dari history load (bukan pesan baru)
  const [isDisplayingHistory, setIsDisplayingHistory] = useState(false);
  
  // Cache untuk histori yang sudah di-load (untuk performa)
  const [historyCache, setHistoryCache] = useState<Record<string, Message[]>>({});

  const { sendMessage, isLoading, error } = useBackendChat();

  // Set sidebar open/close based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      // md breakpoint in Tailwind is 768px
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add listener for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Load Sessions (Sidebar) on Mount + Restore selected session dari localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentConversationId');
    loadSessions(savedSessionId || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Persist currentConversationId ke localStorage setiap kali berubah
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('currentConversationId', currentConversationId);
    }
  }, [currentConversationId]);

  const loadSessions = async (autoSelectId?: string) => {
    try {
      const res = await fetch(`/api/chat-sessions?user_id=${CURRENT_USER_ID}`);
      const json = await res.json();
      if (json.status === 'success') {
        const mappedConvs: Conversation[] = json.data.map((s: ChatSessionData) => ({
          id: s.id.toString(),
          title: s.session_name || 'New Chat',
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
          messages: [], // Message akan di-load saat sesi diklik
          model: 'llama-3'
        }));
        
        setConversations(mappedConvs);

        // Priority: autoSelectId > savedSessionId > first session
        if (autoSelectId && mappedConvs.some(c => c.id === autoSelectId)) {
          setCurrentConversationId(autoSelectId);
        } else if (!currentConversationId && mappedConvs.length > 0) {
          setCurrentConversationId(mappedConvs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
  };

  // 3. Load History saat Sesi dipilih - dengan caching
  useEffect(() => {
    if (currentConversationId) {
      // Cek apakah histori sudah ada di cache
      if (historyCache[currentConversationId]) {
        // Langsung pakai dari cache (instant!)
        setIsDisplayingHistory(true); // Tandai sebagai history load
        setConversations((prev) => 
          prev.map((c) => c.id === currentConversationId 
            ? { ...c, messages: historyCache[currentConversationId] } 
            : c)
        );
      } else {
        // Load dari server jika belum ada di cache
        loadHistory(currentConversationId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId]);

  const loadHistory = async (sessionId: string) => {
    setIsLoadingHistory(true);
    setIsDisplayingHistory(true); // Tandai sebagai history load
    try {
      const res = await fetch(`/api/chat-history/${sessionId}`);
      const json = await res.json();
      
      if (json.status === 'success') {
        // OPTIMASI: Gunakan map + flat untuk performa lebih baik daripada forEach + push
        const historyMessages = json.data.flatMap((msg: ChatHistoryData) => {
          const userMsg = createMessage('user', msg.user_query);
          const aiMessage = createMessage('assistant', msg.llm_response);
          
          // Tambahkan RAG metadata jika ada
          if (msg.metadata?.sources) {
            aiMessage.sources = msg.metadata.sources;
          }
          
          return [userMsg, aiMessage];
        });

        // Update state sekali saja (batch update)
        setConversations((prev) => 
          prev.map((c) => c.id === sessionId ? { ...c, messages: historyMessages } : c)
        );
        
        // Simpan ke cache untuk load cepat berikutnya
        setHistoryCache((prev) => ({ ...prev, [sessionId]: historyMessages }));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = async () => {
    // Panggil API untuk membuat sesi baru di Database
    try {
      // const res = await fetch(`${FLASK_BASE_URL}/api/chat-sessions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     user_id: CURRENT_USER_ID,
      //     session_name: 'New Chat'
      //   })
      const res = await fetch(`/api/chat-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID,
          session_name: 'New Chat'
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        // Refresh sidebar dan pilih chat yang baru dibuat
        await loadSessions(json.data.id.toString());
        // Close sidebar di mobile setelah membuat chat baru
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  const handleSelectConversation = (id: string) => {
    if (currentConversationId !== id) {
      setCurrentConversationId(id);
    }
    // Close sidebar di mobile setelah memilih conversation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (currentConversationId === id) {
        setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const handleMenuClick = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSendMessage = async (messageText: string) => {
    let activeId = currentConversationId;

    // Jika belum ada chat yang aktif, paksa buat sesi baru dulu
    if (!activeId) {
      const res = await fetch(`/api/chat-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: CURRENT_USER_ID, session_name: messageText.substring(0, 30) })
      });
      const json = await res.json();
      if (json.status === 'success') {
        activeId = json.data.id.toString();
        await loadSessions(activeId ?? undefined); // Reload sidebar
      } else {
        return; // Berhenti jika gagal buat sesi
      }
    }

    // Cek apakah ini pesan pertama di percakapan ini (untuk update session_name nanti)
    const currentConv = conversations.find((c) => c.id === activeId);
    const isFirstMessage = currentConv ? currentConv.messages.length === 0 : true;

    // PERBAIKAN: Set isDisplayingHistory ke false karena ini pesan baru (bukan history)
    setIsDisplayingHistory(false);

    // 1. Optimistic Update (Tampilkan pesan user di layar)
    const userMessage = createMessage('user', messageText);
    setConversations((prev) => prev.map((c) =>
      c.id === activeId ? { ...c, messages: [...c.messages, userMessage] } : c
    ));
    
    // PERBAIKAN: Invalidate cache untuk session ini karena ada pesan baru
    setHistoryCache((prev) => {
      const newCache = { ...prev };
      delete newCache[activeId!];
      return newCache;
    });

    // 2. Kirim pesan ke Backend AI
    const response = await sendMessage(messageText, Number(activeId), CURRENT_USER_ID);
    
    // 3. Tampilkan balasan AI
    if (response && response.status === 'success') {
      const assistantMessage = createMessage('assistant', response.answer);
      assistantMessage.sources = response.sources; // RAG Metadata
      
      setConversations((prev) => prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, assistantMessage] } : c
      ));
    } else if (error) {
      const errorMessage = createMessage('assistant', `Error: ${error}`);
      setConversations((prev) => prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, errorMessage] } : c
      ));
    }

    // 4. Update session_name jika ini pesan pertama
    if (isFirstMessage && activeId) {
      const sessionName = messageText.substring(0, 30);
      try {
        await fetch(`/api/chat-sessions/${activeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_name: sessionName })
        });
        // Update title di sidebar secara lokal
        setConversations((prev) => prev.map((c) =>
          c.id === activeId ? { ...c, title: sessionName } : c
        ));
      } catch (e) {
        console.error('Failed to update session name:', e);
      }
    }
  };


  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* Sidebar - Desktop */}
      {isSidebarOpen && (
        <div className="hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800">
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onMenuClick={handleMenuClick}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
          />
        </div>
      )}

      {/* Sidebar - Mobile (Overlay) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={handleMenuClick}
          />
          {/* Sidebar Drawer */}
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-950 z-50 shadow-xl">
            <ConversationSidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onMenuClick={handleMenuClick}
              width={256}
              onWidthChange={setSidebarWidth}
            />
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Toggle Sidebar Button - Muncul ketika sidebar ditutup di desktop, atau selalu di mobile */}
        {!isSidebarOpen && (
          <div className="absolute top-3.5 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMenuClick}
              className="h-9 w-9 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        <TopBar
          selectedModel={currentConversation?.model || 'llama-3'}
          onModelChange={() => {}}
          onSettingsClick={() => setIsSettingsOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Loading Spinner Untuk Transisi Antar Sesi */}
        {isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentConversation ? (
          <ChatWindow
            messages={currentConversation.messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            isEmpty={currentConversation.messages.length === 0}
            error={error}
            isHistoryLoading={isDisplayingHistory}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No conversation selected</p>
              <button
                onClick={handleNewChat}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Start a new chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AccountSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

// 'use client';

// import { AccountSettingsModal } from '@/components/chat/account-settings-modal';
// import { ChatWindow } from '@/components/chat/chat-window';
// import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
// import { TopBar } from '@/components/chat/top-bar';
// import { useBackendChat } from '@/hooks/useBackendChat';
// import { Conversation, createConversation, createMessage, generateConversationTitle } from '@/lib/conversation';
// import { useEffect, useState } from 'react';

// export default function Home() {
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64
//   const [sessionId, setSessionId] = useState<string | null>(null);

//   const { sendMessage, isLoading, error, clearError } = useBackendChat();

//   // Load conversations from localStorage on mount
//   useEffect(() => {
//     const saved = localStorage.getItem('conversations');
//     const savedSessionId = localStorage.getItem('sessionId');
    
//     if (saved) {
//       try {
//         const parsed = JSON.parse(saved);
//         setConversations(parsed);
//         if (parsed.length > 0) {
//           setCurrentConversationId(parsed[0].id);
//         }
//       } catch (e) {
//         console.error('Failed to load conversations:', e);
//       }
//     }

//     // Load or generate session ID
//     if (savedSessionId) {
//       setSessionId(savedSessionId);
//     } else {
//       const newSessionId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//       setSessionId(newSessionId);
//       localStorage.setItem('sessionId', newSessionId);
//     }
//   }, []);

//   // Save conversations to localStorage whenever they change
//   useEffect(() => {
//     localStorage.setItem('conversations', JSON.stringify(conversations));
//   }, [conversations]);

//   // Clear error when conversation changes
//   useEffect(() => {
//     if (error) {
//       clearError();
//     }
//   }, [currentConversationId, error, clearError]);

//   const currentConversation = conversations.find((c) => c.id === currentConversationId);

//   const handleNewChat = () => {
//     const newConv = createConversation('llama-3');
//     setConversations((prev) => [newConv, ...prev]);
//     setCurrentConversationId(newConv.id);
//   };

//   const handleSelectConversation = (id: string) => {
//     setCurrentConversationId(id);
//   };

//   const handleDeleteConversation = (id: string) => {
//     setConversations((prev) => prev.filter((c) => c.id !== id));
//     if (currentConversationId === id) {
//       const remaining = conversations.filter((c) => c.id !== id);
//       setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
//     }
//   };

//   const handleModelChange = (modelId: string) => {
//     if (currentConversation) {
//       setConversations((prev) =>
//         prev.map((c) =>
//           c.id === currentConversationId
//             ? { ...c, model: modelId, updatedAt: new Date() }
//             : c
//         )
//       );
//     }
//   };

//   const handleSendMessage = async (messageText: string) => {
//     if (!currentConversation) return;

//     // Add user message
//     const userMessage = createMessage('user', messageText);
//     setConversations((prev) =>
//       prev.map((c) =>
//         c.id === currentConversationId
//           ? {
//               ...c,
//               messages: [...c.messages, userMessage],
//               updatedAt: new Date(),
//             }
//           : c
//       )
//     );

//     // Update title if it's the first message
//     if (currentConversation.messages.length === 0) {
//       setConversations((prev) =>
//         prev.map((c) =>
//           c.id === currentConversationId
//             ? { ...c, title: generateConversationTitle(messageText) }
//             : c
//         )
//       );
//     }

//     // Send message to backend
//     const response = await sendMessage(messageText);
    
//     if (response && response.status === 'success') {
//       // Add assistant response with sources
//       const assistantMessage = createMessage('assistant', response.answer);
//       // Store sources in the message metadata if needed
//       (assistantMessage as any).sources = response.sources;
      
//       setConversations((prev) =>
//         prev.map((c) =>
//           c.id === currentConversationId
//             ? {
//                 ...c,
//                 messages: [...c.messages, assistantMessage],
//                 updatedAt: new Date(),
//               }
//             : c
//         )
//       );
//     } else if (error) {
//       // Add error message
//       const errorMessage = createMessage('assistant', `Sorry, I encountered an error: ${error}`);
//       setConversations((prev) =>
//         prev.map((c) =>
//           c.id === currentConversationId
//             ? {
//                 ...c,
//                 messages: [...c.messages, errorMessage],
//                 updatedAt: new Date(),
//               }
//             : c
//         )
//       );
//     }
//   };

//   return (
//     <div className="flex h-screen bg-white dark:bg-gray-950">
//       {/* Sidebar */}
//       {isSidebarOpen && (
//         <div className="hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800">
//           <ConversationSidebar
//             conversations={conversations}
//             currentConversationId={currentConversationId}
//             onNewChat={handleNewChat}
//             onSelectConversation={handleSelectConversation}
//             onDeleteConversation={handleDeleteConversation}
//             width={sidebarWidth}
//             onWidthChange={setSidebarWidth}
//           />
//         </div>
//       )}

//       {/* Main Chat Area */}
//       <div className="flex-1 flex flex-col">
//         {/* Top Bar */}
//         <TopBar
//           selectedModel={currentConversation?.model || 'llama-3'}
//           onModelChange={handleModelChange}
//           onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
//           onSettingsClick={() => setIsSettingsOpen(true)}
//         />

//         {/* Chat Window */}
//         {currentConversation ? (
//           <ChatWindow
//             messages={currentConversation.messages}
//             isLoading={isLoading}
//             onSendMessage={handleSendMessage}
//             isEmpty={currentConversation.messages.length === 0}
//             error={error}
//           />
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-center">
//               <p className="text-gray-500 dark:text-gray-400 mb-4">No conversation selected</p>
//               <button
//                 onClick={handleNewChat}
//                 className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
//               >
//                 Start a new chat
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Settings Modal */}
//       <AccountSettingsModal 
//         isOpen={isSettingsOpen} 
//         onClose={() => setIsSettingsOpen(false)}
//       />
//     </div>
//   );
// }
