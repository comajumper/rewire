import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('text', (ctx) => {
    console.log(`📩 Received message: ${ctx.message.text}`);
    ctx.reply('Test bot is working!');
});

bot.launch({
    polling: {
        timeout: 10
    }
}).then(() => console.log('✅ Polling started in test script'))
.catch(err => console.error('🚨 Polling failed:', err));
