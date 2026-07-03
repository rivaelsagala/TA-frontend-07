'use client';

import { AccountSettingsModal } from '@/components/chat/account-settings-modal';
import { ChatWindow } from '@/components/chat/chat-window';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { TopBar } from '@/components/chat/top-bar';
import { Button } from '@/components/ui/button';
import { useBackendChat } from '@/hooks/useBackendChat';
import { Conversation, Message, createMessage } from '@/lib/conversation';
import { ChatSessionData, ChatHistoryData } from '@/types/chat';
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID, getModelNumericId } from '@/lib/models';
import { PanelLeftClose } from 'lucide-react';
import { useEffect, useState } from 'react';

const CURRENT_USER_ID = 1;

interface SendMessageOptions {
  evaluateRagas?: boolean;
}

// Ground truth sementara untuk testing RAGAS.
// Nanti bisa dibuat dinamis dari dataset atau backend.
const DEFAULT_RAGAS_GROUND_TRUTH =
  'Bidan mempunyai tugas: a. Melakukan asuhan kebidanan sesuai standar pelayanan dan kewenangannya. b. Melakukan pemeriksaan pada kehamilan. c. Melakukan pertolongan persalinan. d. Melakukan asuhan kebidanan paska persalinan pada ibu nifas dan bayi baru lahir. e. Melakukan perawatan pada bayi baru lahir.';

const getNumberOrNull = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const calculateAverageScore = (values: Array<number | null>): number | null => {
  const validValues = values.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value)
  );

  if (validValues.length === 0) return null;

  const total = validValues.reduce((sum, value) => sum + value, 0);
  return total / validValues.length;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const normalizeRagasEvaluation = (raw: unknown) => {
  const data = toRecord(raw);

  if (!data) return null;

  const faithfulness = getNumberOrNull(data.faithfulness);

  const answerRelevance = getNumberOrNull(
    data.answer_relevance ??
      data.answer_relevancy ??
      data.answerRelevance ??
      data.answerRelevancy
  );

  const contextPrecision = getNumberOrNull(
    data.context_precision ?? data.contextPrecision
  );

  const contextRecall = getNumberOrNull(
    data.context_recall ?? data.contextRecall
  );

  const noiseSensitivity = getNumberOrNull(
    data.noise_sensitivity ?? data.noiseSensitivity
  );

  const averageScore =
    getNumberOrNull(data.average_score ?? data.averageScore) ??
    calculateAverageScore([
      faithfulness,
      answerRelevance,
      contextPrecision,
      contextRecall,
      noiseSensitivity,
    ]);

  const hasAnyMetric = [
    faithfulness,
    answerRelevance,
    contextPrecision,
    contextRecall,
    noiseSensitivity,
    averageScore,
  ].some((value) => value !== null);

  if (!hasAnyMetric) return null;

  return {
    faithfulness,

    answer_relevance: answerRelevance,
    answer_relevancy: answerRelevance,
    answerRelevance,
    answerRelevancy: answerRelevance,

    context_precision: contextPrecision,
    contextPrecision,

    context_recall: contextRecall,
    contextRecall,

    noise_sensitivity: noiseSensitivity,
    noiseSensitivity,

    average_score: averageScore,
    averageScore,
  };
};

const getSavedModelForSession = (sessionId: string) => {
  if (typeof window === 'undefined') return DEFAULT_MODEL_ID;
  return localStorage.getItem(`conversation-model-${sessionId}`) || DEFAULT_MODEL_ID;
};

const saveModelForSession = (sessionId: string, modelId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`conversation-model-${sessionId}`, modelId);
};

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDisplayingHistory, setIsDisplayingHistory] = useState(false);
  const [historyCache, setHistoryCache] = useState<Record<string, Message[]>>({});

  const { sendMessage, isLoading, error } = useBackendChat();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentConversationId');
    loadSessions(savedSessionId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          messages: [],
          model: getSavedModelForSession(s.id.toString()),
        }));

        setConversations(mappedConvs);

        if (autoSelectId && mappedConvs.some((c) => c.id === autoSelectId)) {
          setCurrentConversationId(autoSelectId);
        } else if (!currentConversationId && mappedConvs.length > 0) {
          setCurrentConversationId(mappedConvs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
  };

  useEffect(() => {
    if (currentConversationId) {
      if (historyCache[currentConversationId]) {
        setIsDisplayingHistory(true);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversationId
              ? { ...c, messages: historyCache[currentConversationId] }
              : c
          )
        );
      } else {
        loadHistory(currentConversationId);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId]);

  const loadHistory = async (sessionId: string) => {
    setIsLoadingHistory(true);
    setIsDisplayingHistory(true);

    try {
      const res = await fetch(`/api/chat-history/${sessionId}`);
      const json = await res.json();

      const historyData: ChatHistoryData[] = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : [];

      if (historyData.length > 0) {
        const historyMessages = historyData.flatMap((msg: ChatHistoryData) => {
          const userMsg = createMessage('user', msg.user_query);

          const metadata = toRecord(msg.metadata);

          const ragasEvaluation =
            normalizeRagasEvaluation(metadata?.evaluation) ??
            normalizeRagasEvaluation(metadata?.ragasEvaluation) ??
            normalizeRagasEvaluation(msg);

          const aiMessage = createMessage('assistant', msg.llm_response, {
            sources: metadata?.sources,
            ragasEvaluation,
          });

          return [userMsg, aiMessage];
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.id === sessionId ? { ...c, messages: historyMessages } : c
          )
        );

        setHistoryCache((prev) => ({
          ...prev,
          [sessionId]: historyMessages,
        }));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = async (modelId: string = DEFAULT_MODEL_ID) => {
    try {
      const res = await fetch(`/api/chat-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID,
          session_name: `New Chat - ${
            AVAILABLE_MODELS.find((m) => m.id === modelId)?.name || 'Chat'
          }`,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('Failed to create session', res.status, json);
        return;
      }

      if (json.status === 'success') {
        const newSessionId = json.data.id.toString();

        saveModelForSession(newSessionId, modelId);

        const newConversation: Conversation = {
          id: newSessionId,
          title: json.data.session_name || 'New Chat',
          createdAt: new Date(json.data.created_at || Date.now()),
          updatedAt: new Date(json.data.updated_at || Date.now()),
          messages: [],
          model: modelId,
        };

        setConversations((prev) => [newConversation, ...prev]);
        setCurrentConversationId(newSessionId);

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

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${id}`, {
        method: 'DELETE',
      });

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

  const handleModelChange = (modelId: string) => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversationId ? { ...c, model: modelId } : c
      )
    );

    saveModelForSession(currentConversationId, modelId);
  };

  const handleMenuClick = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSendMessage = async (
    messageText: string,
    options?: SendMessageOptions
  ) => {
    let activeId: string | null = currentConversationId;
    const evaluateRagas = options?.evaluateRagas ?? false;

    if (!activeId) {
      const res = await fetch(`/api/chat-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID,
          session_name: messageText.substring(0, 30),
        }),
      });

      const json = await res.json();

      if (json.status !== 'success') {
        return;
      }

      const newSessionId = json.data.id.toString();
      const modelId = DEFAULT_MODEL_ID;

      activeId = newSessionId;

      saveModelForSession(newSessionId, modelId);

      const newConversation: Conversation = {
        id: newSessionId,
        title: json.data.session_name || messageText.substring(0, 30),
        createdAt: new Date(json.data.created_at || Date.now()),
        updatedAt: new Date(json.data.updated_at || Date.now()),
        messages: [],
        model: modelId,
      };

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newSessionId);
    }

    const sessionId = activeId;

    if (!sessionId) {
      return;
    }

    const currentConv = conversations.find((c) => c.id === sessionId);
    const sessionModel = currentConv?.model || getSavedModelForSession(sessionId);
    const isFirstMessage = currentConv ? currentConv.messages.length === 0 : true;

    setIsDisplayingHistory(false);

    const userMessage = createMessage('user', messageText);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === sessionId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              updatedAt: new Date(),
            }
          : c
      )
    );

    setHistoryCache((prev) => {
      const newCache = { ...prev };
      delete newCache[sessionId];
      return newCache;
    });

    const response = await sendMessage(
      messageText,
      Number(sessionId),
      CURRENT_USER_ID,
      getModelNumericId(sessionModel || DEFAULT_MODEL_ID),
      {
        evaluate: evaluateRagas,
        ground_truth: evaluateRagas ? DEFAULT_RAGAS_GROUND_TRUTH : undefined,
      }
    );

    if (response && response.status === 'success') {
      const ragasEvaluation = evaluateRagas
        ? normalizeRagasEvaluation(response.evaluation) ??
          normalizeRagasEvaluation(response)
        : null;

      const assistantMessage = createMessage('assistant', response.answer, {
        sources: response.sources,
        ragasEvaluation,
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === sessionId
            ? {
                ...c,
                messages: [...c.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : c
        )
      );
    } else if (error) {
      const errorMessage = createMessage('assistant', `Error: ${error}`);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === sessionId
            ? {
                ...c,
                messages: [...c.messages, errorMessage],
                updatedAt: new Date(),
              }
            : c
        )
      );
    }

    if (isFirstMessage) {
      const sessionName = messageText.substring(0, 30);

      try {
        await fetch(`/api/chat-sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_name: sessionName }),
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.id === sessionId ? { ...c, title: sessionName } : c
          )
        );
      } catch (e) {
        console.error('Failed to update session name:', e);
      }
    }
  };

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
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

      {isSidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={handleMenuClick}
          />

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

      <div className="flex-1 flex flex-col relative">
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
          selectedModel={currentConversation?.model || DEFAULT_MODEL_ID}
          onModelChange={handleModelChange}
          onSettingsClick={() => setIsSettingsOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No conversation selected
              </p>

              <button
                onClick={() => handleNewChat()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Start a new chat
              </button>
            </div>
          </div>
        )}
      </div>

      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}