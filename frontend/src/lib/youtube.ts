const VIDEO_ID = /^[\w-]{11}$/

// Mirrors backend/src/lib/youtube.ts so the admin form can check a link before it is saved.
// Accepts a bare video ID or a youtu.be / youtube.com link and returns the 11-character ID, or null.
export function parseYoutubeId(input: string): string | null {
  const text = input.trim()
  if (VIDEO_ID.test(text)) return text

  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.replace(/^(www|m)\./, '')
  let id: string | undefined
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1]
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id =
      url.pathname === '/watch'
        ? (url.searchParams.get('v') ?? undefined)
        : url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})(?:[/?]|$)/)?.[1]
  }
  return id && VIDEO_ID.test(id) ? id : null
}

// The privacy-enhanced player: YouTube sets no tracking cookies until the learner presses play.
export function embedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
