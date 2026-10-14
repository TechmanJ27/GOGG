import type { Client } from 'discord.js';
import { logBan, logUnban } from '../logHelpers.js';

export function registerModerationHandlers(client: Client) {
    client.on('guildBanAdd', (ban) => {
        logBan(ban);
    });

    client.on('guildBanRemove', (ban) => {
        logUnban(ban);

    });
}

