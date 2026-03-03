import Image from 'next/image';
import { CSSProperties, useState, useEffect } from 'react';

interface ProfilePictureProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export default function ProfilePicture({ src, alt, size = 32, className = '' }: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Update imageSrc when src prop changes
  useEffect(() => {
    if (src && src !== imageSrc) {
      console.log('ProfilePicture: Updating imageSrc from', imageSrc, 'to', src);
      setImageSrc(src);
      setImageError(false);
    }
  }, [src, imageSrc]);

  const style: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '40px',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  };

  // If no src or error, show fallback
  if (!imageSrc || imageError || !src || src === '') {
    if (src === '' || !src) {
      console.warn('ProfilePicture: Empty src provided, showing fallback for alt:', alt);
    }
    return (
      <div style={style} className={className}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#323232',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: `${Math.max(12, size * 0.4)}px`,
            fontWeight: 700,
          }}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div style={style} className={className}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Image
          src={imageSrc}
          alt={alt}
          width={size}
          height={size}
          onError={() => {
            console.error('Image failed to load:', imageSrc, 'for alt:', alt);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageSrc);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
