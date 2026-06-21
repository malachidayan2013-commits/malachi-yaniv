import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { registerGameSockets } from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

registerGameSockets(io);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'yaniv-game-server' });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Yaniv server is running. Build the client to serve the full site.');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Yaniv server listening on port ${PORT}`);
});
