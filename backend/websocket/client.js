import { WebSocketServer } from 'ws';

let wss = null;
let clients = new Set();

// Store recent broadcasts with timestamps
const messageQueue = new Map();
const MAX_QUEUE_SIZE = 100; // Store last 100 messages
const MESSAGE_TTL = 5 * 60 * 1000; // 5 minutes

export const initializeWebSocket = (httpServer) => {
  if (!wss) {
    wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws',
      perMessageDeflate: {
        threshold: 2048 // Only compress data above this size
      }
    });

    // Function to add message to queue
    const addToQueue = (type, data) => {
      const timestamp = Date.now();
      const message = { type, data, timestamp };
      console.log('Adding message to queue:', { type, timestamp });
      
      // Add to queue
      messageQueue.set(timestamp, message);
      
      // Remove old messages
      if (messageQueue.size > MAX_QUEUE_SIZE) {
        const oldestKey = messageQueue.keys().next().value;
        messageQueue.delete(oldestKey);
        console.log('Removed oldest message from queue');
      }
      
      // Remove expired messages
      for (const [key, msg] of messageQueue.entries()) {
        if (Date.now() - msg.timestamp > MESSAGE_TTL) {
          messageQueue.delete(key);
          console.log('Removed expired message from queue:', key);
        }
      }
    };

    // Function to get recent messages
    const getRecentMessages = (lastSeenTimestamp = 0) => {
      const recentMessages = [];
      for (const [timestamp, message] of messageQueue.entries()) {
        if (timestamp > lastSeenTimestamp) {
          recentMessages.push(message);
        }
      }
      console.log('Retrieved recent messages:', { count: recentMessages.length, lastSeenTimestamp });
      return recentMessages;
    };

    // Function to broadcast to all clients
    const broadcast = (type, data) => {
      const message = JSON.stringify({ type, data, timestamp: Date.now() });
      console.log('Broadcasting message:', { type, clientCount: clients.size });
      
      // Store in queue for new connections
      addToQueue(type, data);
      
      // Send to all connected clients
      clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          try {
            client.send(message);
            console.log('Message sent to client');
          } catch (error) {
            console.error('Error sending message to client:', error);
            clients.delete(client);
          }
        } else {
          console.log('Removing disconnected client');
          clients.delete(client);
        }
      });
    };

    wss.on('connection', (ws, request) => {
      console.log('WebSocket client connected from:', request.socket.remoteAddress);
      clients.add(ws);
      
      // Send welcome message
      const welcomeMessage = JSON.stringify({ 
        type: 'welcome', 
        data: { message: 'Connected to server' },
        timestamp: Date.now()
      });
      ws.send(welcomeMessage);
      console.log('Welcome message sent');

      // Send recent messages to newly connected client
      const recentMessages = getRecentMessages();
      if (recentMessages.length > 0) {
        // Filter for new_post messages only
        const newPostMessages = recentMessages.filter(msg => msg.type === 'new_post');
        const recentMessageStr = JSON.stringify({ 
          type: 'recent_messages', 
          data: newPostMessages,
          timestamp: Date.now()
        });
        ws.send(recentMessageStr);
        console.log('Recent messages sent:', newPostMessages.length);
      }

      // Set up heartbeat
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          const heartbeatMessage = JSON.stringify({ 
            type: 'heartbeat',
            timestamp: Date.now()
          });
          ws.send(heartbeatMessage);
          console.log('Heartbeat sent');
        } else {
          console.log('Client disconnected, clearing heartbeat');
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received message:', message);
          
          if (message.type === 'ping') {
            const pongMessage = JSON.stringify({ 
              type: 'pong',
              timestamp: Date.now()
            });
            ws.send(pongMessage);
            console.log('Pong sent');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', (code, reason) => {
        console.log('WebSocket client disconnected:', { code, reason: reason.toString(), clientCount: clients.size });
        clients.delete(ws);
        clearInterval(heartbeatInterval);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
      });
    });

    // Handle server-wide errors
    wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    // Expose broadcast function
    wss.broadcast = broadcast;

    console.log('WebSocket server initialized');
  }
  return wss;
};

export const getWebSocket = () => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return null;
  }
  return wss;
};