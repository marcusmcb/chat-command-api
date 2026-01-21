type UrbanEntry = {
  definition: string;
  thumbs_up: number;
};

type UrbanResponse = {
  list: UrbanEntry[];
};

const cleanForChat = (text: string, maxLen: number) => {
  const singleLine = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Urban Dictionary often includes [bracket] markup
  const deBracketed = singleLine.replace(/\[([^\]]+)]/g, '$1');

  if (deBracketed.length <= maxLen) return deBracketed;
  return `${deBracketed.slice(0, Math.max(0, maxLen - 3)).trim()}...`;
};

const getMostThumbsUp = (entries: UrbanEntry[]) => {
  return entries.reduce((best, current) =>
    current.thumbs_up > best.thumbs_up ? current : best
  );
};

export async function urbanLookup(term: string) {
  const apiKey = process.env.URBAN_DICTIONARY_API_KEY;
  const apiHost = process.env.URBAN_DICTIONARY_API_HOST;

  if (!apiKey || !apiHost) {
    return {
      ok: false as const,
      message:
        'Urban Dictionary is not configured (missing URBAN_DICTIONARY_API_KEY / URBAN_DICTIONARY_API_HOST).'
    };
  }

  const url = new URL('https://mashape-community-urban-dictionary.p.rapidapi.com/define');
  url.searchParams.set('term', term);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost
      }
    });

    if (!resp.ok) {
      return {
        ok: false as const,
        message: 'Looks like Urban Dictionary is having trouble with that one right now.'
      };
    }

    const data = (await resp.json()) as UrbanResponse;
    const list = Array.isArray(data.list) ? data.list : [];

    if (list.length === 0) {
      return {
        ok: true as const,
        message: `Hmmm... looks like Urban Dictionary couldn't find "${term}"`
      };
    }

    const best = getMostThumbsUp(list);
    const definition = cleanForChat(best.definition, 350);

    return {
      ok: true as const,
      message: `Urban Dictionary result for "${term}": ${definition}`
    };
  } catch (err) {
    console.error('Urban lookup error:', err);
    return {
      ok: false as const,
      message: 'Looks like Urban Dictionary is having trouble with that one right now.'
    };
  }
}
