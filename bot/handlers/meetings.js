// handlers/meetings.js
import { getTodayMeetings, getAuthUrl } from '../services/api.js';

export default async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const meetings = await getTodayMeetings(telegramId);

    if (meetings.length === 0) {
      return await ctx.reply('No meetings scheduled for today! 🎉')
        .catch(e => console.error('Error sending no meetings message:', e));
    }

    const meetingsText = meetings
      .map(m => `${m.time} - ${m.title}${
        m.attendees.length ? `\nWith: ${m.attendees.join(', ')}` : ''
      }`)
      .join('\n\n');

    await ctx.reply(`Your meetings today:\n\n${meetingsText}`)
      .catch(e => console.error('Error sending meetings message:', e));

  } catch (error) {
    console.error('Error in meetings handler:', error);

    if (error.response?.status === 401) {
      try {
        const authUrl = await getAuthUrl(ctx.from.id.toString());
        return await ctx.reply(
          'Please connect your Google Calendar first:',
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '🔗 Connect Calendar',
                  url: authUrl
                }
              ]]
            }
          }
        );
      } catch (e) {
        console.error('Error sending auth message:', e);
        await ctx.reply('Sorry, there was an error. Please try again in a few moments.')
          .catch(e => console.error('Error sending error message:', e));
      }
    } else {
      await ctx.reply('Sorry, there was an error getting your meetings. Please try again in a few moments.')
        .catch(e => console.error('Error sending error message:', e));
    }
  }
};