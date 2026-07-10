import { useCallback, useEffect, useState } from 'react';
import {
  fetchTechnologyTopics,
  startTechnologySession,
  sendTechnologyMessage,
  completeTechnologySession,
  TechnologyTopic,
  TechnologySession,
} from '../../api/practice';

import {AIReply, GrammarError} from "../../api/practice";

export interface TechnologyTurn {
  role: 'assistant' | 'user';
  content: string;
  grammarErrors?: GrammarError[];
  pronunciationScore?: number | null;
  nativeSpeakerVersion?: string | null;
  audioUrl?: string;
}

export function useTechnologyLearner() {
  const [topics, setTopics] = useState<TechnologyTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [session, setSession] = useState<TechnologySession | null>(null);
  const [chat, setChat] = useState<TechnologyTurn[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setError(null);
    try {
      const data = await fetchTechnologyTopics();
      setTopics(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load topics');
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const beginSession = useCallback(
    async (topicId: string, language?: string) => {
      setIsStarting(true);
      setError(null);
      try {
        const started = await startTechnologySession(topicId, language);
        setSession(started);
        setChat([{ role: 'assistant', content: started.intro }]);
      } catch (err: any) {
        setError(err?.message || 'Unable to start session');
      } finally {
        setIsStarting(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (message: string, language?: string, audio?: string, localAudioUrl?: string) => {
      if (!session) return;
      setIsSending(true);
      setError(null);
      try {
        const tempTurn: TechnologyTurn = { 
          role: 'user', 
          content: message,
          audioUrl: localAudioUrl
        };
        setChat((prev) => [...prev, tempTurn]);

        const result: AIReply = await sendTechnologyMessage(session.sessionId, message, language, audio);
        
        // Update the last user turn if it was audio
        if (audio && result.transcribedText) {
          setChat(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'user') {
              last.content = result.transcribedText!;
              last.grammarErrors = result.grammarErrors;
              last.pronunciationScore = result.pronunciationScore;
            }
            return next;
          });
        } else {
          setChat(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'user') {
              last.grammarErrors = result.grammarErrors;
            }
            return next;
          });
        }

        setChat((prev) => [
          ...prev, 
          { 
            role: 'assistant', 
            content: result.reply,
            nativeSpeakerVersion: result.nativeSpeakerVersion 
          }
        ]);
      } catch (err: any) {
        setError(err?.message || 'Unable to send message');
      } finally {
        setIsSending(false);
      }
    },
    [session],
  );

  const finishSession = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const result = await completeTechnologySession(session.sessionId);
      setFeedback(result.feedback);
      setSession(null);
      setChat([]);
    } catch (err: any) {
      setError(err?.message || 'Unable to complete session');
    }
  }, [session]);

  const resetSession = useCallback(() => {
    setSession(null);
    setChat([]);
    setFeedback(null);
    setError(null);
  }, []);

  return {
    topics,
    isLoadingTopics,
    session,
    chat,
    isStarting,
    isSending,
    feedback,
    error,
    loadTopics,
    beginSession,
    sendMessage,
    finishSession,
    resetSession,
  };
}
