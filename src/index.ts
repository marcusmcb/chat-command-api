import express from 'express'
import strains from './strains'
import {
	initTwitchClient,
	sendChat,
	sendChatTo,
	getAllowedChannels,
} from './twitchClient'
import { urbanLookup } from './urban'
import { getChatGPTResponse } from './askgpt'

// Load .env locally (Heroku provides env vars in production)
if (process.env.NODE_ENV !== 'production') {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('dotenv').config()
}

const app = express()
const PORT = process.env.PORT || 3000
const MAX_SECONDS = 30 // safety cap to avoid spam/rate-limits

// Initialize optional Twitch chat client (requires env vars set)
initTwitchClient()

app.get('/strain', (_req, res) => {
	const random = strains[Math.floor(Math.random() * strains.length)]
	console.log('Strain requested: ', random)
	console.log('--------------------------------')
	res.send(random)
})

app.get('/askgpt', async (req, res) => {
	console.log('--------------------------------')
	console.log('AskGPT request received:')
	console.log(req.query)
	console.log('--------------------------------')

	const q = req.query.prompt ?? req.query.q
	const raw = Array.isArray(q) ? q[0] : q
	const prompt = typeof raw === 'string' ? raw.trim() : ''

	const looksLikeUnexpandedTemplate =
		prompt === '$(querystring)' ||
		prompt === '${querystring}' ||
		prompt === '$(query)' ||
		prompt === '${query}' ||
		prompt === '$(1+)' ||
		prompt === '${1+}' ||
		prompt === '$(1)' ||
		prompt === '${1}' ||
		prompt === '$(query)' ||
		prompt === '${query}'

	// Fallbacks if you choose a different param name in StreamElements
	const q2 = req.query.query ?? req.query.text
	const raw2 = Array.isArray(q2) ? q2[0] : q2
	const prompt2 = typeof raw2 === 'string' ? raw2.trim() : ''
	const finalPrompt = prompt || prompt2

	// StreamElements may not post output on non-200, so keep this 200.
	if (!finalPrompt || looksLikeUnexpandedTemplate) {
		res
			.type('text/plain')
			.send(
				looksLikeUnexpandedTemplate
					? 'StreamElements is passing a literal template (not your chat text). Use StreamElements argument variables like ${query} or ${1+} inside ${urlfetch ...}.'
					: 'Please provide a prompt for me to respond to!',
			)
		return
	}

	const result = await getChatGPTResponse(finalPrompt)
	res.type('text/plain').send(result.message)
})

app.get('/urban', (req, res) => {
	console.log('--------------------------------')
	console.log('Urban Dictionary request received: ')
	console.log(req.query)
	console.log('--------------------------------')
	const q = req.query.term
	const raw = Array.isArray(q) ? q[0] : q
	const term = typeof raw === 'string' ? raw.trim() : ''

	console.log('Urban Dictionary request received')
	console.log('term:', term || '(missing)')

	if (!term) {
		// StreamElements often won’t post urlfetch output on non-200 responses.
		// Return 200 with a helpful message so chat always gets feedback.
		res
			.type('text/plain')
			.send(
				'Try the urban command again, but enter a term or phrase to search for when you do!',
			)
		return
	}

	;(async () => {
		const result = await urbanLookup(term)
		res.type('text/plain').send(result.message)
	})()
})

app.listen(PORT, () => {
	console.log('--------------------------------')
	console.log(`Twitch Chat Command API listening on port ${PORT}`)
	console.log('--------------------------------')
})
