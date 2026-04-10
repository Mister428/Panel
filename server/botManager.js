const TelegramBot = require('node-telegram-bot-api');
const { WAConnection, MessageType } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('./logger');


let telegramBot;
let whatsappBot;

// Start the Telegram bot function
const startTelegramBot = () => {
    try {
        telegramBot = new TelegramBot('YOUR_TELEGRAM_BOT_TOKEN', { polling: true });
        telegramBot.on('message', (msg) => {
            logger.info('Telegram Bot: Received message:', msg.text);
        });
        logger.info('Telegram Bot started successfully.');
    } catch (error) {
        logger.error('Error starting Telegram Bot:', error.message);
    }
};

// Stop the Telegram bot function
const stopTelegramBot = () => {
    try {
        if (telegramBot) {
            telegramBot.stopPolling();
            logger.info('Telegram Bot stopped successfully.');
        } else {
            logger.warn('Telegram Bot is not running.');
        }
    } catch (error) {
        logger.error('Error stopping Telegram Bot:', error.message);
    }
};

// Start the WhatsApp bot function
const startWhatsAppBot = async () => {
    try {
        whatsappBot = new WAConnection();
        whatsappBot.on('qr', qr => {
            qrcode.generate(qr, {small: true});
            logger.info('WhatsApp Bot QR Code generated.');
        });
        await whatsappBot.connect();
        logger.info('WhatsApp Bot started successfully.');
    } catch (error) {
        logger.error('Error starting WhatsApp Bot:', error.message);
    }
};

// Stop the WhatsApp bot function
const stopWhatsAppBot = () => {
    try {
        if (whatsappBot) {
            whatsappBot.close();
            logger.info('WhatsApp Bot stopped successfully.');
        } else {
            logger.warn('WhatsApp Bot is not running.');
        }
    } catch (error) {
        logger.error('Error stopping WhatsApp Bot:', error.message);
    }
};

// Stop all bots function
const stopAllBots = () => {
    try {
        stopTelegramBot();
        stopWhatsAppBot();
        logger.info('All bots stopped successfully.');
    } catch (error) {
        logger.error('Error stopping all bots:', error.message);
    }
};

module.exports = { startTelegramBot, stopTelegramBot, startWhatsAppBot, stopWhatsAppBot, stopAllBots };