require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const response = await axios.get(`${API_URL}/auth/google/url`, {
            params: { telegram_id: chatId.toString() }
        });

        const keyboard = {
            inline_keyboard: [[
                {
                    text: 'Подключить Google Calendar',
                    url: response.data.url
                }
            ]]
        };

        bot.sendMessage(
            chatId,
            'Привет! Давай подключим твой календарь, чтобы я мог помогать тебе с встречами.',
            { reply_markup: keyboard }
        );
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
    }
});

// Get meetings command
bot.onText(/\/meetings/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const response = await axios.get(`${API_URL}/meetings/today`, {
            params: { telegram_id: chatId.toString() }
        });

        if (!response.data.length) {
            return bot.sendMessage(chatId, 'На сегодня встреч не запланировано!');
        }

        const meetingsText = response.data
            .map((meeting, index) => 
                `${index + 1}. ${meeting.time} - ${meeting.title}`)
            .join('\n');

        bot.sendMessage(chatId, `Твои встречи на сегодня:\n\n${meetingsText}`);
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Не удалось получить список встреч.');
    }
});

// Error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('Bot is running...');