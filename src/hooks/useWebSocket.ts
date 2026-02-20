import { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "@/lib/auth";

interface AttachmentScanningEvent {
  attachmentId: string;
  taskId: string;
  fileName: string;
}

interface AttachmentSavingEvent {
  attachmentId: string;
  taskId: string;
  fileName: string;
}

interface AttachmentCompletedEvent {
  attachmentId: string;
  taskId: string;
  fileName: string;
  status: string;
  attachmentCount: number;
}

interface ConnectedEvent {
  userId: string;
}

interface WebSocketMessage {
  event: string;
  data: AttachmentScanningEvent | AttachmentSavingEvent | AttachmentCompletedEvent | ConnectedEvent | Record<string, unknown>;
}

type WebSocketEventHandler = (data: AttachmentScanningEvent | AttachmentSavingEvent | AttachmentCompletedEvent | ConnectedEvent | Record<string, unknown>) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<WebSocketEventHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const session = await auth.getSession();
      if (!session.data?.session) {
        return;
      }

      const wsUrl = import.meta.env.VITE_API_URL?.replace("http", "ws") || "ws://localhost:3333";
      const ws = new WebSocket(`${wsUrl}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const handlers = handlersRef.current.get(message.event);
          if (handlers) {
            handlers.forEach((handler) => handler(message.data));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error connecting WebSocket:", error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const on = useCallback((event: string, handler: WebSocketEventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    return () => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(event);
        }
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    on,
    connect,
    disconnect,
  };
}
