export default function VideoPlayer({ src, poster }) {
  if (!src) return (
    <div className="w-full rounded-xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center text-zinc-600">
      Видео недоступно
    </div>
  )

  // Google Drive
  const gdriveMatch = src.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gdriveMatch) {
    return (
      <div className="w-full rounded-xl overflow-hidden aspect-video">
        <iframe
          src={`https://drive.google.com/file/d/${gdriveMatch[1]}/preview`}
          title="Google Drive видео"
          className="w-full h-full"
          allow="autoplay"
          allowFullScreen
        />
      </div>
    )
  }

  // YouTube
  const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return (
      <div className="w-full rounded-xl overflow-hidden aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0&origin=${window.location.origin}`}
          title="YouTube видео"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Vimeo
  const vimeoMatch = src.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return (
      <div className="w-full rounded-xl overflow-hidden aspect-video">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          title="Vimeo видео"
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Прямой mp4 / любой другой URL
  return (
    <div className="w-full rounded-xl overflow-hidden bg-black aspect-video">
      <video src={src} poster={poster} controls className="w-full h-full">
        Ваш браузер не поддерживает воспроизведение видео.
      </video>
    </div>
  )
}
