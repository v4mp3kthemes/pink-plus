require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ===== LOAD COMMANDS =====
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.name, command);
}

// ===== READY =====
client.once("ready", () => {
  console.log(`🤖 Bot online jako ${client.user.tag}`);
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("❌ Wystąpił błąd");
    } else {
      await interaction.reply({ content: "❌ Wystąpił błąd", ephemeral: true });
    }
  }
});

console.log("TOKEN:", process.env.DISCORD_TOKEN?.slice(0, 10));
console.log("CLIENT_ID:", process.env.CLIENT_ID);

client.login(process.env.DISCORD_TOKEN);
