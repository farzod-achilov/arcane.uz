'use client';

import { useEffect, RefObject } from 'react';

function cleanSrc(url: string): string {
  // Remove "|thumb" suffix, then strip "video:" scheme prefix used in DB storage
  return url.split('|')[0].replace(/^video:/, '');
}

export function isHlsUrl(url: string) {
  return cleanSrc(url).includes('.m3u8');
}

export function useHls(videoRef: RefObject<HTMLVideoElement>, src: string) {
  const rawSrc = cleanSrc(src);

  useEffect(() => {
    if (!rawSrc || !videoRef.current) return;
    if (!isHlsUrl(rawSrc)) return;

    let hls: import('hls.js').default | null = null;

    import('hls.js').then(({ default: Hls }) => {
      if (!videoRef.current) return;

      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false });
        hls.loadSource(rawSrc);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari natively supports HLS
        videoRef.current.src = rawSrc;
      }
    });

    return () => {
      hls?.destroy();
    };
  }, [rawSrc, videoRef]);
}
