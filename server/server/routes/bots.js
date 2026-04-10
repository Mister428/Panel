import express from 'express';
import Bot from '../models/Bot.js';
import { authRequired, requireApproved } from '../middleware/auth.js';
import {
  startTelegramBot,
  stopTelegramBot,
  startWhatsAppBot,
  stopWhatsAppBot
} from '../botManager.js';

const router = express.Router();

router.use(authRequired, requireApproved);

router.get('/', async (req, res) => {
  const bots = await Bot.find({ owner: req.user.id }).sort({ createdAt: -1 });
  res.json(bots);
});

router.post('/', async (req, res) => {
  try {
    const { type, name, telegramToken } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'type et name requis' });
    }

    if (type === 'telegram' && !telegramToken) {
      return res.status(400).json({ error: 'Token Telegram requis' });
    }

    const bot = await Bot.create({
      owner: req.user.id,
      type,
      name,
      telegramToken: type === 'telegram' ? telegramToken : undefined,
      status: 'offline'
    });

    res.json(bot);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bot) return res.status(404).json({ error: 'Bot introuvable' });

    if (bot.type === 'telegram') {
      await startTelegramBot(bot);
    } else if (bot.type === 'whatsapp') {
      await startWhatsAppBot(bot);
    }

    res.json({ message: 'Bot démarré' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors du démarrage du bot' });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bot) return res.status(404).json({ error: 'Bot introuvable' });

    if (bot.type === 'telegram') {
      await stopTelegramBot(bot);
    } else if (bot.type === 'whatsapp') {
      await stopWhatsAppBot(bot);
    }

    res.json({ message: 'Bot arrêté' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de l’arrêt du bot' });
  }
});

router.put('/:id', async (req, res) => {
  const bot = await Bot.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true }
  );

  if (!bot) return res.status(404).json({ error: 'Bot introuvable' });
  res.json(bot);
});

router.delete('/:id', async (req, res) => {
  await Bot.deleteOne({ _id: req.params.id, owner: req.user.id });
  res.json({ message: 'Bot supprimé' });
});

export default router;