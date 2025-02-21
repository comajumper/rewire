import { getAuthUrl } from '../services/api.js';

export default async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const authUrl = await getAuthUrl(telegramId);
    
    await ctx.reply(
      'Welcome to Rewire! To get started, please connect your Google Calendar:',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🔗 Connect Google Calendar',
              url: authUrl
            }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in start handler:', error);
    await ctx.reply('Sorry, there was an error. Please try again later.');
  }
};