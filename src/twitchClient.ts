import tmi from 'tmi.js';

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
