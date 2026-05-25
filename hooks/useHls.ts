'use client';

import { useEffect, RefObject } from 'react';

export function isHlsUrl(url: string) {
  // Strip optional "|thumb" suffix before checking
  return url.split('|')[0].includes('.m3u8');
}

export function useHls(videoRef: RefObject<HTMLVideoElement>, src: string) {
  // Use only the src part (before optional "|thumb")
  const rawSrc = src.split('|')[0];

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
