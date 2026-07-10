import { useCallback, useEffect, useState } from 'react';
import {
  fetchRoleplayScenarios,
  startRoleplaySession,
  sendRoleplayMessage,
  completeRoleplaySession,
  RoleplayScenario,
} from '../../api/practice';

import {AIReply, GrammarError} from "../../api/practice";

export interface ConversationTurn {
  role: 'assistant' | 'user';
  content: string;
  grammarErrors?: GrammarError[];
  pronunciationScore?: number | null;
  nativeSpeakerVersion?: string | null;
  audioUrl?: string;
}

export function useRoleplay() {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [grammarHint, setGrammarHint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScenarios = useCallback(async () => {
    setIsLoadingScenarios(true);
    setError(null);
    try {
      const data = await fetchRoleplayScenarios();
      setScenarios(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load roleplay scenarios');
    } finally {
      setIsLoadingScenarios(false);
    }
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const startSession = useCallback(
    async (scenarioId: string, language?: string) => {
      setIsStarting(true);
      setError(null);
      setFeedback(null);
      try {
        const result = await startRoleplaySession(scenarioId, language);
        setSessionId(result.sessionId);
        setScenario(result.scenario);
        setConversation([{ role: 'assistant', content: result.greeting }]);
      } catch (err: any) {
        setError(err?.message || 'Unable to start roleplay session');
      } finally {
        setIsStarting(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (message: string, language?: string, audio?: string, localAudioUrl?: string) => {
      if (!sessionId) return;
      setIsSending(true);
      setError(null);
      try {
        const tempTurn: ConversationTurn = { 
          role: 'user', 
          content: message,
          audioUrl: localAudioUrl 
        };
        setConversation((prev) => [...prev, tempTurn]);

        const result: AIReply = await sendRoleplayMessage(sessionId, message, language, audio);
        
        // Update the last user turn if it was audio (it might have been transcribed)
        if (audio && result.transcribedText) {
          setConversation(prev => {
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
          // Normal text message - add errors to the turn we just added
          setConversation(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'user') {
              last.grammarErrors = result.grammarErrors;
            }
            return next;
          });
        }

        setConversation((prev) => [
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
    [sessionId],
  );

  const finishSession = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    try {
      const result = await completeRoleplaySession(sessionId);
      setFeedback(result.feedback);
      setSessionId(null);
      setConversation([]);
    } catch (err: any) {
      setError(err?.message || 'Unable to complete session');
    }
  }, [sessionId]);

  return {
    scenarios,
    isLoadingScenarios,
    isStarting,
    sessionId,
    scenario,
    conversation,
    grammarHint,
    feedback,
    isSending,
    error,
    loadScenarios,
    startSession,
    sendMessage,
    finishSession,
  };
}
