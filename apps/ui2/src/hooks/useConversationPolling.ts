import { useState, useEffect, useCallback, useRef } from 'react';
import { pollMessages } from '@/api/conversationApi';
import { ConversationItem, ConversationStatus } from '@/types/conversation';

interface UseConversationPollingOptions {
  conversationId: string | null;
  enabled: boolean;
  interval?: number; // ms, default 1000
  onNewMessages?: (messages: ConversationItem[]) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface UseConversationPollingResult {
  isPolling: boolean;
  status: ConversationStatus | null;
  error: string | null;
  startPolling: (since: Date) => void;
  stopPolling: () => void;
}

export const useConversationPolling = ({
  conversationId,
  enabled,
  interval = 1000,
  onNewMessages,
  onComplete,
  onError,
}: UseConversationPollingOptions): UseConversationPollingResult => {
  const [isPolling, setIsPolling] = useState(false);
  const [status, setStatus] = useState<ConversationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sinceRef = useRef<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const conversationIdRef = useRef(conversationId);

  // Keep refs up to date with latest callback values to avoid stale closures
  const callbacksRef = useRef({ onNewMessages, onComplete, onError });
  callbacksRef.current = { onNewMessages, onComplete, onError };

  // Keep conversationId ref up to date
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    const currentConversationId = conversationIdRef.current;
    if (!currentConversationId || !isPollingRef.current) {
      return;
    }

    try {
      const response = await pollMessages(currentConversationId, sinceRef.current);

      setStatus(response.status);

      if (response.messages.length > 0) {
        // Update since to latest message timestamp
        const latestMessage = response.messages[response.messages.length - 1];
        sinceRef.current = new Date(latestMessage.createdAt);

        callbacksRef.current.onNewMessages?.(response.messages);
      }

      if (response.isComplete) {
        stopPolling();

        if (response.status === ConversationStatus.ERROR) {
          setError(response.errorMessage);
          callbacksRef.current.onError?.(response.errorMessage || 'Unknown error');
        } else {
          callbacksRef.current.onComplete?.();
        }
      }
    } catch (err) {
      console.error('[Polling] Error:', err);
      // Don't stop polling on network errors, just log
    }
  }, [stopPolling]);

  const startPolling = useCallback(
    (since: Date) => {
      // Note: We don't check `enabled` here because React state updates are batched.
      // The caller sets enabled=true and calls startPolling in the same event,
      // but enabled hasn't updated yet. We rely on the useEffect to stop polling
      // if enabled becomes false.
      if (!conversationIdRef.current) {
        return;
      }

      sinceRef.current = since;
      setError(null);
      setIsPolling(true);
      isPollingRef.current = true;

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Initial poll immediately
      poll();

      // Then poll at interval
      intervalRef.current = setInterval(poll, interval);
    },
    [interval, poll]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Stop polling when disabled or conversation changes
  useEffect(() => {
    if (!enabled) {
      stopPolling();
    }
  }, [enabled, stopPolling]);

  return {
    isPolling,
    status,
    error,
    startPolling,
    stopPolling,
  };
};
