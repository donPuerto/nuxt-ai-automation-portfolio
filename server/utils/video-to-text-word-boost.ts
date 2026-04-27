const FILE_NAME_STOP_WORDS = new Set([
  'official',
  'music',
  'video',
  'audio',
  'lyrics',
  'lyric',
  'version',
  'full',
  'hd',
  'hq',
  'live',
  'remaster',
  'remastered',
  'edit',
  'clean',
  'explicit',
  'track',
  'song',
])

const normalizeToken = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')
    .trim()
}

export const buildWordBoostFromFileName = (fileName: string, maxItems = 12) => {
  const baseName = fileName
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!baseName) {
    return [] as string[]
  }

  const tokens = baseName
    .split(/\s+/)
    .map(normalizeToken)
    .filter(token => token.length >= 3 && !FILE_NAME_STOP_WORDS.has(token))

  const phrases: string[] = []
  const pushGram = (start: number, size: number) => {
    const gram = tokens.slice(start, start + size).join(' ').trim()
    if (gram.length >= 7) {
      phrases.push(gram)
    }
  }

  for (let index = 0; index < tokens.length; index += 1) {
    if (index + 1 < tokens.length) {
      pushGram(index, 2)
    }

    if (index + 2 < tokens.length) {
      pushGram(index, 3)
    }

    if (index + 3 < tokens.length) {
      pushGram(index, 4)
    }
  }

  const merged = [...tokens, ...phrases]
  const deduped: string[] = []

  for (const item of merged) {
    if (!item || deduped.includes(item)) {
      continue
    }

    deduped.push(item)

    if (deduped.length >= maxItems) {
      break
    }
  }

  return deduped
}
