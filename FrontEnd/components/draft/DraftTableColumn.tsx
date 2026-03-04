import { ReactNode } from 'react';

interface DraftTableColumnProps {
  type: 'golfer' | 'rank' | 'odds' | 'draft';
  children: ReactNode;
  className?: string;
  isMobile?: boolean;
}

export default function DraftTableColumn({
  type,
  children,
  className = '',
  isMobile = false,
}: DraftTableColumnProps) {
  const isGolferColumn = type === 'golfer';
  const width = type === 'golfer' ? undefined
    : isMobile ? (type === 'draft' ? '80px' : '56px')
    : '108px';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginRight: '-1px',
        paddingBottom: '1px',
        position: 'relative',
        flexShrink: 0,
        flex: isGolferColumn ? '1 0 0' : undefined,
        width: width,
        minWidth: isGolferColumn ? 0 : width,
        minHeight: isGolferColumn ? 0 : undefined,
      }}
    >
      {children}
    </div>
  );
}
