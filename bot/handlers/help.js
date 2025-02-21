export default async (ctx) => {
  console.log('Help command received');
  await ctx.reply('Yo! This is the help message for the Rewire bot.');
};