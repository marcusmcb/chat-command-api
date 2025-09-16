# chat-command-api
A public API for Twitch chat commands returned as text

Marcus McBride, 2025

## StreamElements usage

Command message:

$(urlfetch https://chat-command-api-f314fc32259e.herokuapp.com/count?duration=$(1))

Examples:
- !count 10 -> “Countdown started for 10 seconds” (bot posts 10..1..Go!)
- !count 2m -> “Countdown started for 120 seconds” (capped at 30s if over limit)

## Twitch bot (optional)

Set these environment variables to enable chat posting via tmi.js:
 TWITCH_CHANNELS (comma-separated) or TWITCH_CHANNEL

Without these, the API will still respond but won’t post messages in chat.

## Deploy on Heroku
 - Override target channel (must be configured): /count?duration=10&channel=otherchannel
Configure env vars in Heroku config vars (Settings -> Config Vars) for the Twitch bot.
