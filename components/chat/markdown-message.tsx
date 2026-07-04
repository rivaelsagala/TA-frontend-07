'use client';

import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

interface RagasEvaluation {
  faithfulness?: number | null;

  answerRelevance?: number | null;
  answer_relevance?: number | null;

  answerRelevancy?: number | null;
  answer_relevancy?: number | null;

  contextPrecision?: number | null;
  context_precision?: number | null;

  contextRecall?: number | null;
  context_recall?: number | null;

  contextEntitiesRecall?: number | null;
  context_entities_recall?: number | null;

  noiseSensitivity?: number | null;
  noise_sensitivity?: number | null;

  averageScore?: number | null;
  average_score?: number | null;

  status?: string | null;
}

interface MarkdownMessageProps {
  content: string;
  isUser: boolean;
  skipTyping?: boolean;
  ragasEvaluation?: RagasEvaluation | null;
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  isUser,
  skipTyping = false,
  ragasEvaluation = null,
}: MarkdownMessageProps) {
  const [displayedText, setDisplayedText] = useState(skipTyping ? content : '');
  const [isTyping, setIsTyping] = useState(!isUser && !skipTyping);

  useEffect(() => {
    if (skipTyping || isUser) {
      setDisplayedText(content);
      setIsTyping(false);
      return;
    }

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

  const getMetricValue = (...values: Array<number | null | undefined>) => {
    const validValue = values.find(
      (value) => typeof value === 'number' && Number.isFinite(value)
    );

    return validValue ?? null;
  };

  const formatScore = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(3);
  };

  const getFaithfulness = () => {
    if (!ragasEvaluation) return null;

    return getMetricValue(ragasEvaluation.faithfulness);
  };

  const getAnswerRelevance = () => {
    if (!ragasEvaluation) return null;

    return getMetricValue(
      ragasEvaluation.answerRelevance,
      ragasEvaluation.answer_relevance,
      ragasEvaluation.answerRelevancy,
      ragasEvaluation.answer_relevancy
    );
  };

  const getContextPrecision = () => {
    if (!ragasEvaluation) return null;

    return getMetricValue(
      ragasEvaluation.contextPrecision,
      ragasEvaluation.context_precision
    );
  };

  const getContextRecall = () => {
    if (!ragasEvaluation) return null;

    return getMetricValue(
      ragasEvaluation.contextRecall,
      ragasEvaluation.context_recall
    );
  };

  const getNoiseSensitivity = () => {
    if (!ragasEvaluation) return null;

    return getMetricValue(
      ragasEvaluation.noiseSensitivity,
      ragasEvaluation.noise_sensitivity
    );
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const codeContent = part.replace(/```/g, '').trim();

        return (
          <pre
            key={idx}
            className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg my-2 overflow-x-auto text-xs"
          >
            <code>{codeContent}</code>
          </pre>
        );
      }

      return (
        <div key={idx}>
          {part.split('\n').map((line, lineIdx) => {
            if (line.startsWith('# ')) {
              return (
                <h1 key={lineIdx} className="text-lg font-bold mt-2 mb-1">
                  {line.substring(2)}
                </h1>
              );
            }

            if (line.startsWith('## ')) {
              return (
                <h2 key={lineIdx} className="text-base font-bold mt-2 mb-1">
                  {line.substring(3)}
                </h2>
              );
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

  const renderRagasEvaluation = () => {
    if (isUser || !ragasEvaluation || isTyping) return null;

    const faithfulness = getFaithfulness();
    const answerRelevance = getAnswerRelevance();
    const contextPrecision = getContextPrecision();
    const contextRecall = getContextRecall();
    const noiseSensitivity = getNoiseSensitivity();

    return (
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[#007AFF]" />

          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Evaluasi RAGAS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Faithfulness
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatScore(faithfulness)}
            </p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Answer Relevance
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatScore(answerRelevance)}
            </p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Context Precision
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatScore(contextPrecision)}
            </p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Context Recall
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatScore(contextRecall)}
            </p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Noise Sensitivity
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatScore(noiseSensitivity)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex mb-4 gap-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl px-4 py-3 shadow-sm max-w-2xl',
          isUser
            ? 'bg-[#007AFF] text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
        )}
      >
        <div className="text-sm leading-relaxed">
          {renderContent(displayedText)}

          {isTyping && !isUser && (
            <span className="inline-block w-2 h-2 bg-current rounded-full ml-1 animate-pulse" />
          )}

          {renderRagasEvaluation()}
        </div>
      </div>
    </div>
  );
});

MarkdownMessage.displayName = 'MarkdownMessage';