import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import { handleWSConnection } from './src/server/ws-handler';
import { createServer as createViteServer } from 'vite';
import { dbService } from './src/server/db';
import { generateIcebreaker } from './src/server/gemini';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Support safe Cross-Origin requests for separate frontend setups like Vercel
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // JSON parsing and static routes
  app.use(express.json());

  // API Health test route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Load private DM message logs
  app.get('/api/messages/:roomId', (req, res) => {
    try {
      const { roomId } = req.params;
      const history = dbService.getMessagesForRoom(roomId);
      res.json(history);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch room messages logs.' });
    }
  });

  // Trigger server-side AI Icebreaker using Gemini
  app.post('/api/icebreaker', async (req, res) => {
    try {
      const { userId, opponentId } = req.body;
      const user = dbService.getUser(userId);
      const opponent = dbService.getUser(opponentId);

      if (!user || !opponent) {
        return res.status(404).json({ error: 'Users not found.' });
      }

      const greeting = await generateIcebreaker(opponent, user);
      res.json({ text: greeting });
    } catch (e) {
      res.status(500).json({ error: 'Could not generate icebreaker.' });
    }
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    handleWSConnection(ws);
  });

  console.log('WebSocket Server attached to HTTP server.');

  // Config Vite Middleware for Development vs Production Static Assets
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`VibeChat fullstack server starts safely on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VibeChat server:', err);
});
