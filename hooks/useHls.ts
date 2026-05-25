'use client';

import { useEffect, RefObject } from 'react';

export function isHlsUrl(url: string) {
  return url.includes('.m3u8');
}

export function useHls(videoRef: RefObject<HTMLVideoElement>, src: string) {
  useEffect(() => {
    if (!src || !videoRef.current) return;
    if (!isHlsUrl(src)) return;

    let hls: import('hls.js').default | null = null;

    import('hls.js').then(({ default: Hls }) => {
      if (!videoRef.current) return;

      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false });
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari natively supports HLS
        videoRef.current.src = src;
      }
    });

    return () => {
      hls?.destroy();
    };
  }, [src, videoRef]);
}
