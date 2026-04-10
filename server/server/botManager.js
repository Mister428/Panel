import TelegramBot from 'node-telegram-bot-api';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { logToUser, logSystem } from './utils/logger.js';

const botRegistry = {
  telegram: new Map(),
  whatsapp: new Map()
};

export async function startTelegramBot(botDoc) {
  if (!botDoc.telegramToken) throw new Error('Token Telegram manquant');

  const botId = botDoc._id.toString();
  if (botRegistry.telegram.has(botId)) return;

  const bot = new TelegramBot(botDoc.telegramToken, { polling: true });
  botRegistry.telegram.set(botId, bot);

  const ownerId = botDoc.owner.toString();

  bot.on('message', async (msg) => {
    const text = msg.text || '';
    logToUser(ownerId, `[TG:${botDoc.name}] Message reçu: ${text}`);

    try {
      await bot.sendMessage(msg.chat.id, 'Bot actif ⚡ — CHAPEAU NOIR PANEL');
    } catch (err) {
      logToUser(ownerId, `[TG:${botDoc.name}] Erreur envoi message: ${err.message}`);
    }
  });

  bot.on('polling_error', (err) => {
    logToUser(ownerId, `[TG:${botDoc.name}] Erreur polling: ${err.message}`);
  });

  botDoc.status = 'online';
  botDoc.lastError = null;
  await botDoc.save();

  logToUser(ownerId, `[TG:${botDoc.name}] Bot démarré`);
}

export async function stopTelegramBot(botDoc) {
  const id = botDoc._id.toString();
  const instance = botRegistry.telegram.get(id);

  if (instance) {
    try {
      await instance.stopPolling();
    } catch {}
    botRegistry.telegram.delete(id);
    botDoc.status = 'offline';
    await botDoc.save();
    logToUser(botDoc.owner.toString(), `[TG:${botDoc.name}] Bot arrêté`);
  }
}

export async function startWhatsAppBot(botDoc) {
  const botId = botDoc._id.toString();
  if (botRegistry.whatsapp.has(botId)) return;

  const ownerId = botDoc.owner.toString();
  const authFolder = `.auth/wa-${botId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      logToUser(ownerId, `[WA:${botDoc.name}] QR généré`);
    }

    if (connection === 'open') {
      botDoc.status = 'online';
      botDoc.lastError = null;
      botDoc.save();
      logToUser(ownerId, `[WA:${botDoc.name}] Connecté`);
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      logToUser(ownerId, `[WA:${botDoc.name}] Déconnecté (${reason || 'inconnu'})`);

      if (reason !== DisconnectReason.loggedOut) {
        startWhatsAppBot(botDoc).catch((err) => {
          logToUser(ownerId, `[WA:${botDoc.name}] Reconnexion impossible: ${err.message}`);
        });
      } else {
        botDoc.status = 'offline';
        botDoc.save();
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    logToUser(ownerId, `[WA:${botDoc.name}] Message reçu de ${from}`);

    try {
      await sock.sendMessage(from, { text: 'Bot actif ⚡ — CHAPEAU NOIR PANEL' });
    } catch (err) {
      logToUser(ownerId, `[WA:${botDoc.name}] Erreur envoi message: ${err.message}`);
    }
  });

  botRegistry.whatsapp.set(botId, {
    sock,
    stop: async () => {
      logToUser(ownerId, `[WA:${botDoc.name}] Arrêt demandé`);
      try {
        sock.end?.();
        sock.ws?.close?.();
      } catch {}
      botRegistry.whatsapp.delete(botId);
      botDoc.status = 'offline';
      await botDoc.save();
    }
  });

  logToUser(ownerId, `[WA:${botDoc.name}] Session démarrée`);
}

export async function stopWhatsAppBot(botDoc) {
  const botId = botDoc._id.toString();
  const entry = botRegistry.whatsapp.get(botId);
  if (entry) {
    await entry.stop();
  }
}

export async function stopAllBots() {
  logSystem('Arrêt de tous les bots');

  for (const bot of botRegistry.telegram.values()) {
    try {
      await bot.stopPolling();
    } catch {}
  }
  botRegistry.telegram.clear();

  for (const entry of botRegistry.whatsapp.values()) {
    try {
      await entry.stop();
    } catch {}
  }
  botRegistry.whatsapp.clear();
}