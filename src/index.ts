import express from 'express';
import strains from './strains'
import { initTwitchClient, sendChat, sendChatTo, getAllowedChannels } from './twitchClient'

// Load .env locally (Heroku provides env vars in production)
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_SECONDS = 30; // safety cap to avoid spam/rate-limits

// Initialize optional Twitch chat client (requires env vars set)
initTwitchClient();

app.get('/strain', (_req, res) => {  
  const random = strains[Math.floor(Math.random() * strains.length)];
  console.log('Strain requested: ', random)
  console.log("--------------------------------")
  res.send(random);
});

app.get('/count', (req, res) => {
  // Accepts: GET /count?duration=$(1) from StreamElements
  // duration examples: 10, 30s, 2m, 1h

  const q = req.query.duration;
  const raw = Array.isArray(q) ? q[0] : q;
  const value = typeof raw === 'string' ? raw.trim() : '';

  // Helper: parse "10", "30s", "2m", "1h" to seconds
  const parseDurationToSeconds = (input: string): number | null => {
    if (!input) return null;
    const match = input.toLowerCase().match(/^\s*(\d+)\s*([smh])?\s*$/);
    if (!match) return null;
    const n = parseInt(match[1], 10);
    if (Number.isNaN(n)) return null;
    const unit = match[2] as 's' | 'm' | 'h' | undefined;
    switch (unit) {
      case 'm':
        return n * 60;
      case 'h':
        return n * 60 * 60;
      case 's':
      default:
        return n;
    }
  };

  if (!value) {
    res.status(400).type('text/plain').send('Missing duration. Try /count?duration=10 or /count?duration=2m');
    return;
  }

  const seconds = parseDurationToSeconds(value);
  if (seconds === null) {
    res.status(400).type('text/plain').send('Invalid duration. Use a number optionally with s/m/h, e.g., 10, 30s, 2m, 1h');
    return;
  }

  const capped = Math.max(1, Math.min(seconds, MAX_SECONDS));
  console.log('Countdown requested with duration:', value, '| seconds:', seconds, '| capped:', capped);
  console.log('--------------------------------');

  // Kick off async chat countdown (if Twitch client configured)
  if ((process.env.TWITCH_CHANNELS || process.env.TWITCH_CHANNEL) && process.env.TWITCH_USERNAME && process.env.TWITCH_OAUTH_TOKEN) {
    // Fire and forget; do not block the HTTP response
    (async () => {
      const target = (typeof req.query.channel === 'string' && req.query.channel) || getAllowedChannels()[0];
      // optional: initial message in target channel
      // await sendChatTo(target, `Starting ${capped}s countdown...`);
      for (let i = capped; i >= 1; i--) {
        await sendChatTo(target, String(i));
        await new Promise((r) => setTimeout(r, 1000));
      }
      await sendChatTo(target, 'Go!');
    })();
  } else {
    console.log('Twitch env not configured; countdown will not post to chat.');
  }

  // Respond with plain text so StreamElements can post it in chat
  res.type('text/plain').send(`Countdown started for ${capped} seconds`);
})

app.listen(PORT, () => {
  console.log(`Strain API listening on port ${PORT}`);
});
