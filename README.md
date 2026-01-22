# chat-command-api
A public API for Twitch chat commands returned as text

Marcus McBride, 2025

## StreamElements usage

Command message:

$(urlfetch https://chat-command-api-f314fc32259e.herokuapp.com/count?duration=$(1))

AskGPT command message:

$(urlfetch https://chat-command-api-f314fc32259e.herokuapp.com/askgpt?prompt=$(querystring))

Urban Dictionary command message:

$(urlfetch https://chat-command-api-f314fc32259e.herokuapp.com/urban?term=$(querystring))

Examples:
- !count 10 -> “Countdown started for 10 seconds” (bot posts 10..1..Go!)
- !count 2m -> “Countdown started for 120 seconds” (capped at 30s if over limit)

## Twitch bot (optional)

Set these environment variables to enable chat posting via tmi.js:
 TWITCH_CHANNELS (comma-separated) or TWITCH_CHANNEL

Without these, the API will still respond but won’t post messages in chat.

## Urban Dictionary (RapidAPI)

Set these environment variables to enable `/urban` lookups:
- URBAN_DICTIONARY_API_KEY
- URBAN_DICTIONARY_API_HOST

## OpenAI (AskGPT)

Set these environment variables to enable `/askgpt`:
- OPENAI_API_KEY

Optional tuning:
- OPENAI_MODEL (default: gpt-4o-mini)
- OPENAI_MAX_TOKENS (default: 120)

## Bot-side `!urban` handler (recommended)

StreamElements sometimes won’t execute `$(urlfetch ...)` when no args are provided, which means `!urban` (with no term) may not hit the API at all.

To ensure chat always responds (including the “missing term” message), enable the bot-side handler:

- TWITCH_ENABLE_URBAN_BOT_COMMAND=true

If you enable this, disable your StreamElements `!urban` command to avoid double responses.

## Deploy on Heroku
 - Override target channel (must be configured): /count?duration=10&channel=otherchannel
Configure env vars in Heroku config vars (Settings -> Config Vars) for the Twitch bot.
