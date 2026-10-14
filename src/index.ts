import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import 'dotenv/config';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(import.meta.dirname, 'commands');
if (fs.existsSync(foldersPath)) {
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		if (!fs.statSync(commandsPath).isDirectory()) continue;

		const commandFiles = fs.readdirSync(commandsPath).filter((file) =>
			(file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')
		);

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const commandModule = await import(pathToFileURL(filePath).href);
			const command = commandModule.default ?? commandModule;

			if (command && 'data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
}

const eventsPath = path.join(import.meta.dirname, 'events');
if (fs.existsSync(eventsPath)) {
	const eventFiles = fs.readdirSync(eventsPath).filter((file) =>
		(file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')
	);

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const eventModule = await import(pathToFileURL(filePath).href);
		const event = eventModule.default ?? eventModule;

		if (event.once) {
			client.once(event.name, (...args: any[]) => event.execute(...args, client));
		} else {
			client.on(event.name, (...args: any[]) => event.execute(...args, client));
		}
	}
}

import { registerChannelHandlers } from './events/channelHandler.js';
registerChannelHandlers(client);
import { registerGuildHandlers } from './events/guildHandler.js';
registerGuildHandlers(client);
import { registerMessageHandlers } from './events/messageHandler.js';
registerMessageHandlers(client);
import { registerModerationHandlers } from './events/moderationHandler.js';
registerModerationHandlers(client);
import { registerUserHandlers } from './events/userHandler.js';
registerUserHandlers(client);

await client.login(process.env.TOKEN);