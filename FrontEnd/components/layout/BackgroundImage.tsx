'use client';

import { useState } from 'react';
import Image from 'next/image';

const DEFAULT_BACKGROUND = '/images/Masters.jpg';

interface BackgroundImageProps {
  imageSrc: string;
  alt: string;
}

export default function BackgroundImage({ imageSrc, alt }: BackgroundImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const src = (imageSrc && !useFallback) ? imageSrc : DEFAULT_BACKGROUND;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        zIndex: 0,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        onError={() => {
          if (src !== DEFAULT_BACKGROUND) setUseFallback(true);
        }}
        style={{
          objectFit: 'cover',
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
