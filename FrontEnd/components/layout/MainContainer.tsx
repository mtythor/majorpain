'use client';

import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface MainContainerProps {
  children: ReactNode;
  className?: string;
  top?: string;
  noPadding?: boolean;
}

export default function MainContainer({ children, className = '', top = '147px', noPadding = false }: MainContainerProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-start',
        left: '50%',
        top: isMobile ? '169px' : top,
        transform: 'translateX(-50%)',
        zIndex: 5,
        width: isMobile ? '100%' : 'var(--max-content-width)',
        maxWidth: '100%',
        padding: noPadding ? '0' : isMobile ? '0 8px' : '0 16px',
      }}
    >
      {children}
    </div>
  );
}
