import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import botRoutes from './routes/bots.js';
import { setIO } from './utils/logger.js';
import { stopAllBots } from './botManager.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

setIO(io);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch((err) => console.error('Erreur MongoDB', err));

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bots', botRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'CHAPEAU NOIR PANEL API OK' });
});

io.on('connection', (socket) => {
  console.log('Client connecté');

  socket.on('registerUser', (userId) => {
    if (userId) {
      socket.join(String(userId));
      console.log('Socket rejoint room', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT reçu, arrêt des bots...');
  await stopAllBots();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});