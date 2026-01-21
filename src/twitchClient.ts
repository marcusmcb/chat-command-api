import tmi from 'tmi.js';
import { urbanLookup } from './urban';

let client: tmi.Client | null = null;
let allowedChannels: string[] = [];

const normalize = (name: string) => name.replace(/^#/,'').trim().toLowerCase();
const toSayTarget = (name: string) => (name.startsWith('#') ? name : `#${name}`);

export function initTwitchClient() {
  const username = process.env.TWITCH_USERNAME;
  const token = process.env.TWITCH_OAUTH_TOKEN; // format: oauth:xxxxxxxxxxxx
  const channelsEnv = process.env.TWITCH_CHANNELS || process.env.TWITCH_CHANNEL || '';

  const list = channelsEnv
    .split(',')
    .map((c) => normalize(c))
    .filter(Boolean);

  allowedChannels = Array.from(new Set(list));

  if (!allowedChannels.length || !username || !token) {
    console.warn('Twitch client disabled: missing channels, TWITCH_USERNAME or TWITCH_OAUTH_TOKEN');
    return null;
  }

  client = new tmi.Client({
    options: { debug: false },
    identity: { username, password: token },
    channels: allowedChannels
  });

  client.on('connected', () => console.log('Twitch client connected to channels:', allowedChannels.join(', ')));
  client.on('disconnected', (reason) => console.log('Twitch client disconnected:', reason));

  // Optional: handle !urban directly in chat.
  // This is useful because StreamElements may not call urlfetch when no args are provided.
  if (process.env.TWITCH_ENABLE_URBAN_BOT_COMMAND === 'true') {
    const lastHandledAtByChannel = new Map<string, number>();

    client.on('message', async (channel, _tags, message, self) => {
      if (self) return;
      const text = message.trim();
      if (!text.toLowerCase().startsWith('!urban')) return;

      // Simple per-channel cooldown to prevent spam
      const now = Date.now();
      const key = channel.toLowerCase();
      const last = lastHandledAtByChannel.get(key) ?? 0;
      if (now - last < 1500) return;
      lastHandledAtByChannel.set(key, now);

      const args = text.split(/\s+/).slice(1).join(' ').trim();
      if (!args) {
        await client?.say(channel, 'Try the urban command again, but enter a term or phrase to search for when you do!');
        return;
      }

      const result = await urbanLookup(args);
      await client?.say(channel, result.message);
    });
  }

  client.connect().catch((err) => {
    console.error('Failed to connect Twitch client:', err);
  });

  return client;
}

export function getAllowedChannels() {
  return allowedChannels.slice();
}

export async function sendChat(message: string) {
  if (!client || !allowedChannels.length) return;
  const target = toSayTarget(allowedChannels[0]);
  try {
    await client.say(target, message);
  } catch (err) {
    console.error('Failed to send chat message:', err);
  }
}

export async function sendChatTo(channel: string, message: string) {
  if (!client) return;
  const targetNorm = normalize(channel);
  if (!allowedChannels.includes(targetNorm)) {
    console.warn(`Channel not allowed or not configured: ${targetNorm}`);
    return;
  }
  try {
    await client.say(toSayTarget(targetNorm), message);
  } catch (err) {
    console.error('Failed to send chat message to', targetNorm, err);
  }
}
