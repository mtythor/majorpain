import { ReactNode } from 'react';

interface DraftTableCellProps {
  type: 'header' | 'data';
  rowType?: 'standard' | 'alt';
  align?: 'left' | 'center';
  children: ReactNode;
  className?: string;
  isMobile?: boolean;
}

export default function DraftTableCell({
  type,
  rowType = 'standard',
  align = 'center',
  children,
  className = '',
  isMobile = false,
}: DraftTableCellProps) {
  const isHeader = type === 'header';
  const backgroundColor = isHeader
    ? '#151515'
    : rowType === 'alt'
      ? '#1f1f1f'
      : '#262626';
  const rowHeight = isMobile ? (isHeader ? '28px' : '44px') : (isHeader ? '32px' : '48px');
  const padding = isMobile ? '8px' : '16px';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        height: rowHeight,
        alignItems: 'center',
        marginBottom: '-1px',
        overflow: 'hidden',
        paddingLeft: padding,
        paddingRight: padding,
        position: 'relative',
        flexShrink: 0,
        width: '100%',
        border: '1px solid #323232',
        backgroundColor,
        justifyContent: align === 'left' ? 'flex-start' : 'center',
      }}
    >
      {children}
    </div>
  );
}
