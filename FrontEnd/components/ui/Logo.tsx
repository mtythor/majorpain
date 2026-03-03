import Image from 'next/image';

interface LogoProps {
  size?: { width: number; height: number };
  /** When true, logo scales with viewport (min 140px, max 220px width) for responsive layouts */
  responsive?: boolean;
  className?: string;
}

export default function Logo({ size = { width: 232, height: 160 }, responsive = false, className = '' }: LogoProps) {
  const wrapperStyle = responsive
    ? {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        alignItems: 'flex-start' as const,
        position: 'relative' as const,
        flexShrink: 0,
        width: 'min(220px, max(140px, 58vw))',
        aspectRatio: `${232} / ${160}`,
      }
    : {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        alignItems: 'flex-start' as const,
        position: 'relative' as const,
        flexShrink: 0,
      };

  const innerStyle = responsive
    ? {
        height: '100%',
        width: '100%',
        position: 'relative' as const,
        flexShrink: 0,
      }
    : {
        height: `${size.height}px`,
        position: 'relative' as const,
        flexShrink: 0,
        width: `${size.width}px`,
      };

  return (
    <div
      className={className}
      style={wrapperStyle}
    >
      <div style={innerStyle}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <Image
            src="/images/MajorPainLogoTransparent.png"
            alt="Major Pain Logo"
            width={size.width}
            height={size.height}
            unoptimized
            style={{
              position: 'absolute',
              height: '183.18%',
              left: '-15.15%',
              maxWidth: 'none',
              top: '-28.8%',
              width: '126.11%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
