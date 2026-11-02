import { embedUrl, watchUrl } from '../lib/youtube'

interface VideoPlayerProps {
  videoId: string | null
  title: string
}

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-pale text-ink-soft">
        The video for this lesson isn't available yet.
      </div>
    )
  }

  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-2xl bg-navy">
        <iframe
          key={videoId}
          className="h-full w-full"
          src={embedUrl(videoId)}
          title={title}
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Video not playing?{' '}
        <a href={watchUrl(videoId)} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-text underline">
          Watch it on YouTube
        </a>
        .
      </p>
    </div>
  )
}
