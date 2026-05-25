/** Splits an encoded media URL "src|thumb" into parts. */
export function parseMedia(url: string): { src: string; thumb: string | null } {
  const pipe = url.indexOf('|');
  if (pipe === -1) return { src: url, thumb: null };
  return { src: url.slice(0, pipe), thumb: url.slice(pipe + 1) || null };
}

export function isVideoMedia(url: string): boolean {
  const { src } = parseMedia(url);
  return /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(src)
    || src.includes('video.cloudflare.steamstatic.com')
    || src.includes('video.akamai.steamstatic.com');
}

export function isYouTubeMedia(url: string): boolean {
  return parseMedia(url).src.includes('youtube.com/embed');
}

export function isAnyVideo(url: string): boolean {
  return isVideoMedia(url) || isYouTubeMedia(url);
}
