import { ReactNode } from 'react';

interface DraftTableCellProps {
  type: 'header' | 'data';
  rowType?: 'standard' | 'alt';
  align?: 'left' | 'center';
  children: ReactNode;
  className?: string;
}

export default function DraftTableCell({
  type,
  rowType = 'standard',
  align = 'center',
  children,
  className = '',
}: DraftTableCellProps) {
  const isHeader = type === 'header';
  const backgroundColor = isHeader
    ? '#151515'
    : rowType === 'alt'
      ? '#1f1f1f'
      : '#262626';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        height: isHeader ? '32px' : '48px',
        alignItems: 'center',
        marginBottom: '-1px',
        overflow: 'hidden',
        paddingLeft: '16px',
        paddingRight: '16px',
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
