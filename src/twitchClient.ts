import tmi from 'tmi.js';

let client: tmi.Client | null = null;

export function initTwitchClient() {
  const channel = process.env.TWITCH_CHANNEL;
  const username = process.env.TWITCH_USERNAME;
  const token = process.env.TWITCH_OAUTH_TOKEN; // format: oauth:xxxxxxxxxxxx

  if (!channel || !username || !token) {
    console.warn('Twitch client disabled: missing TWITCH_CHANNEL, TWITCH_USERNAME or TWITCH_OAUTH_TOKEN');
    return null;
  }

  client = new tmi.Client({
    options: { debug: false },
    identity: { username, password: token },
    channels: [channel]
  });

  client.on('connected', () => console.log('Twitch client connected to channel:', channel));
  client.on('disconnected', (reason) => console.log('Twitch client disconnected:', reason));

  client.connect().catch((err) => {
    console.error('Failed to connect Twitch client:', err);
  });

  return client;
}

export async function sendChat(message: string) {
  if (!client) return;
  const channel = process.env.TWITCH_CHANNEL as string;
  try {
    await client.say(channel, message);
  } catch (err) {
    console.error('Failed to send chat message:', err);
  }
}
