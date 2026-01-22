type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const cleanForChat = (text: string, maxLen: number) => {
  const singleLine = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, Math.max(0, maxLen - 3)).trim()}...`;
};

export async function getChatGPTResponse(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      message: 'OpenAI is not configured (missing OPENAI_API_KEY).'
    };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '120', 10);

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Number.isFinite(maxTokens) ? maxTokens : 120
      })
    });

    const data = (await resp.json()) as ChatCompletionResponse;

    if (!resp.ok) {
      const msg = data?.error?.message || 'OpenAI request failed.';
      return {
        ok: false as const,
        message: `AskGPT error: ${cleanForChat(msg, 300)}`
      };
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        ok: false as const,
        message: 'AskGPT error: empty response from OpenAI.'
      };
    }

    return {
      ok: true as const,
      message: cleanForChat(content, 430)
    };
  } catch (err) {
    console.error('OpenAI request error:', err);
    return {
      ok: false as const,
      message: 'AskGPT error: OpenAI is having trouble right now.'
    };
  }
}
