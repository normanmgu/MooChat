import { Hono } from 'hono';
import { serve } from 'bun';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();
const PORT = process.env.PORT || 3000;

// A simple in-memory set to track connected WebSocket clients
const clients = new Set<WebSocket>();

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }));

// Serve static files from the public directory
app.use('/*', serveStatic({ root: './public' }));

const server = serve({
  fetch: app.fetch,
  port: PORT,
  websocket: {
    open(ws) {
      console.log('Client connected');
      clients.add(ws);
    },
    message(ws, message) {
      console.log('Received:', message);
      // Broadcast to all clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          clients.delete(client);
        }
      });
    },
    close(ws) {
      console.log('Client disconnected');
      clients.delete(ws);
    },
  },
});

app.get('/ws', (c) => {
  const upgrade = c.req.raw.headers.get('upgrade')?.toLowerCase();
  if (upgrade !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 400);
  }

  const success = server.upgrade(c.req.raw);
  if (success) {
    // Upgrade successful, don't send a response
    return new Response(null, { status: 101 });
  }

  return c.text('Upgrade failed', 400);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing all WebSocket connections...');
  clients.forEach((client) => client.close());
  clients.clear();
  server.stop();
});

console.log(`WebSocket server running on port ${PORT}`);
