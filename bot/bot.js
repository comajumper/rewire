require("dotenv").config();
const { Telegraf } = require("telegraf");
const { Client } = require("pg");

// Load environment variables
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// PostgreSQL database connection
const db = new Client({
  connectionString: process.env.DATABASE_URL,
});
db.connect();

// Handle /start command
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const username = ctx.from.username || "Unknown";

  try {
    // Insert user into database if not exists
    await db.query(
      "INSERT INTO users (telegram_id, name) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING",
      [telegramId, username]
    );

    ctx.reply(`👋 Welcome, ${username}! You are now registered.`);
  } catch (err) {
    console.error("Database Error:", err);
    ctx.reply("⚠️ Error registering you. Please try again later.");
  }
});

// Start the bot
bot.launch();
console.log("🚀 Telegram bot is running...");