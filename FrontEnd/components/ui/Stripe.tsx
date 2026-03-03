interface StripeProps {
  width?: string;
  className?: string;
  /** Compact variant for mobile - matches Figma 15.75px height */
  compact?: boolean;
}

export default function Stripe({ width = '100%', className = '', compact = false }: StripeProps) {
  const height = compact ? '15.75px' : '24px';
  const styles = compact
    ? {
        yellowThick: { height: '6.563px' as const, top: '9.19px' as const },
        yellowThin: { height: '2.625px' as const, top: 0 as const },
        green: { height: '1.313px' as const, top: '5.25px' as const },
      }
    : {
        yellowThick: { height: '10px' as const, top: '14px' as const },
        yellowThin: { height: '4px' as const, top: 0 as const },
        green: { height: '2px' as const, top: '8px' as const },
      };

  return (
    <div
      className={className}
      style={{
        height,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        width,
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#fdc71c',
          ...styles.yellowThick,
          left: 0,
          width: '100%',
          right: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#fdc71c',
          ...styles.yellowThin,
          left: 0,
          width: '100%',
          right: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#00a900',
          ...styles.green,
          left: 0,
          width: '100%',
          right: 0,
        }}
      />
    </div>
  );
}
