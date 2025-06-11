import { API_URL } from '../config/api';
import type { Post } from '../types/post';

export type MessageType = 
  | 'new_post'
  | 'post_updated'
  | 'post_deleted'
  | 'welcome'
  | 'heartbeat'
  | 'pong'
  | 'recent_messages'
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'reconnect_attempt'
  | 'reconnect_failed';

export interface Message {
  type: MessageType;
  data?: Post | Post[] | { message: string } | null;
  timestamp: number;
}

type EventListener<T = Message['data']> = (data: T) => void;

let ws: WebSocket | null = null;
let lastMessageTimestamp = 0;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
let reconnectTimeout: NodeJS.Timeout | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

const eventListeners = new Map<MessageType, Set<EventListener>>();

export const initializeWebSocket = () => {
  if (!API_URL) {
    console.error('API_URL is not defined');
    return;
  }

  if (ws?.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return;
  }

  // must: convert HTTP/HTTPS URL to WS/WSS
  const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws';
  
  try {
    ws = new WebSocket(wsUrl);
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    reconnectAttempts = 0;
    lastMessageTimestamp = Date.now();
    
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    // Set up heartbeat
    setupHeartbeat();
    
    // Emit connect event
    emitEvent('connect', null);
  };

  ws.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    cleanup();
    
    // Emit disconnect event
    emitEvent('disconnect', { message: event.reason || 'Connection closed' });
    
    // Attempt to reconnect unless it was a clean close
    if (event.code !== 1000) {
      scheduleReconnect();
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    
    // Emit connect_error event
    emitEvent('connect_error', { message: 'WebSocket connection error' });
    
    // Attempt to reconnect
    scheduleReconnect();
  };

  ws.onmessage = (event) => {
    try {
      const message: Message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'welcome':
          console.log('Welcome message:', message.data);
          emitEvent('welcome', message.data);
          break;
          
        case 'heartbeat':
          // Respond to server heartbeat
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'pong',
              timestamp: Date.now()
            }));
          }
          break;
          
        case 'pong':
          console.log('Received pong from server');
          emitEvent('pong', null);
          break;
          
        case 'recent_messages':
          console.log('Received recent messages:', message.data);
          // Sort messages by timestamp
          const messages = message.data as Post[];
          messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          // Emit each message as if it was just received
          messages.forEach((msg) => {
            emitEvent('new_post', msg);
            lastMessageTimestamp = Math.max(lastMessageTimestamp, new Date(msg.createdAt).getTime());
          });
          emitEvent('recent_messages', messages);
          break;
          
        case 'new_post':
          console.log('New post:', message.data);
          lastMessageTimestamp = Math.max(lastMessageTimestamp, new Date((message.data as Post).createdAt).getTime());
          emitEvent('new_post', message.data);
          break;
          
        case 'post_updated':
          console.log('Post updated:', message.data);
          lastMessageTimestamp = Math.max(lastMessageTimestamp, new Date((message.data as Post).createdAt).getTime());
          emitEvent('post_updated', message.data);
          break;
          
        case 'post_deleted':
          console.log('Post deleted:', message.data);
          lastMessageTimestamp = Math.max(lastMessageTimestamp, new Date((message.data as Post).createdAt).getTime());
          emitEvent('post_deleted', message.data);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  // Clean up on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      disconnect();
    });
  }

  return ws;
};

const setupHeartbeat = () => {
  // Clear existing heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Send ping every 30 seconds
  heartbeatInterval = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'ping',
        timestamp: Date.now()
      }));
    }
  }, 30000);
};

const cleanup = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

const scheduleReconnect = () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.log('Max reconnection attempts reached');
    emitEvent('reconnect_failed', null);
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
  reconnectAttempts++;

  console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
  emitEvent('reconnect_attempt', { message: `Attempt ${reconnectAttempts}` });

  reconnectTimeout = setTimeout(() => {
    console.log(`Reconnection attempt ${reconnectAttempts}`);
    initializeWebSocket();
  }, delay);
};

// Event system functions
const emitEvent = (eventName: MessageType, data: Message['data']) => {
  const listeners = eventListeners.get(eventName);
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }
};

export const on = <T = Message['data']>(eventName: MessageType, listener: EventListener<T>) => {
  if (!eventListeners.has(eventName)) {
    eventListeners.set(eventName, new Set());
  }
  eventListeners.get(eventName)!.add(listener as EventListener);
};

export const off = <T = Message['data']>(eventName: MessageType, listener: EventListener<T>) => {
  const listeners = eventListeners.get(eventName);
  if (listeners) {
    listeners.delete(listener as EventListener);
  }
};

export const emit = (eventName: MessageType, data?: Message['data']) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: eventName,
      data,
      timestamp: Date.now()
    }));
  }
};

export const disconnect = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  cleanup();
  
  if (ws) {
    ws.close(1000, 'Client disconnect');
    ws = null;
  }
};

export const getSocket = () => {
  return {
    connected: ws?.readyState === WebSocket.OPEN,
    on,
    off,
    emit,
    disconnect
  };
};