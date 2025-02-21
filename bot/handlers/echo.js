export default async (ctx) => {
	console.log('Message received:', ctx.message.text);
	await ctx.reply(`You said: ${ctx.message.text}`);
};