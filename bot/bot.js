import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

console.log("BOT_TOKEN:", process.env.BOT_TOKEN); // Debugging line


import startHandler from './handlers/start.js';
import helpHandler from './handlers/help.js';
import echoHandler from './handlers/echo.js';
import meetingsHandler from './handlers/meetings.js';

const init = async () => {
  console.log('🚀 Starting bot initialization...');

  const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
  if (!BOT_TOKEN) {
    console.error('❌ No bot token provided');
    process.exit(1);
  }

  // Create bot instance with debug options
  const bot = new Telegraf(BOT_TOKEN, {
    telegram: {
      apiRoot: 'https://api.telegram.org',
      timeout: 30000,
    },
    handlerTimeout: 90000
  });

  console.log('🔧 Configuring bot handlers...');

  // Command handlers
  bot.command('start', startHandler);
  bot.command('help', helpHandler);
  bot.command('meetings', meetingsHandler);
  
  bot.on('text', (ctx) => {
    console.log(`📩 Received message: ${ctx.message.text}`);
    ctx.reply(`You said: ${ctx.message.text}`);
});


  // Debug middleware
  bot.use((ctx, next) => {
    console.log('⚡️ Received update:', ctx.update);
    return next();
  });

  // Error handling
  bot.catch((err, ctx) => {
    console.error('❌ Bot error:', err);
    return ctx.reply('An error occurred')
      .catch(e => console.error('Error sending error message:', e));
  });

  try {
    console.log('📡 Connecting to Telegram...');
    const botInfo = await bot.telegram.getMe();
    console.log('✅ Bot info received:', botInfo);
    bot.context.botInfo = botInfo;

    console.log('🚀 Attempting to launch bot...');
    await bot.telegram.deleteWebhook();
    
    console.log('🟡 Deleting webhook completed, now launching bot...');

    console.log('🟢 bot.launch() started, waiting for completion...');
    await bot.launch({
      dropPendingUpdates: true,
      polling: {
          timeout: 10,  // Reduce timeout to force frequent reconnections
          limit: 100,
          allowedUpdates: [
              'message', 'edited_message', 'callback_query',
              'inline_query', 'chosen_inline_result', 'channel_post',
              'edited_channel_post', 'shipping_query', 'pre_checkout_query',
              'poll', 'poll_answer'
          ]
      }
  }).then(() => {
      console.log('✅ Bot launched successfully and is now polling for updates.');
  }).catch((err) => {
      console.error('🚨 bot.launch() failed:', err);
  });
  
    process.stdin.resume(); // Prevents process from exiting

} catch (error) {
    console.error('❌ Bot launch failed:', error);
    if (error.code === 'ETELEGRAM') {
        console.error('📡 Telegram API error:', error.description);
    }
    process.exit(1);
}


  // Enable graceful stop
  const shutdown = (signal) => {
    console.log(`\n📥 ${signal} received. Starting graceful shutdown...`);
    bot.stop(signal);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

init().catch(error => {
  console.error('❌ Initialization failed:', error);
  process.exit(1);
});