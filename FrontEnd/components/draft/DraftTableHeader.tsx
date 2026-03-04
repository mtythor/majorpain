import { SortDirection } from '@/lib/types';

interface DraftTableHeaderProps {
  label: string;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}

export default function DraftTableHeader({
  label,
  sortable = false,
  sortDirection = null,
  onSort,
}: DraftTableHeaderProps) {
  return (
    <div
      onClick={sortable && onSort ? onSort : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        cursor: sortable ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-noto-sans), sans-serif",
          fontWeight: 700,
          fontSize: '12px',
          lineHeight: 'normal',
          position: 'relative',
          textAlign: 'center',
          color: '#ffffff',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      {sortable && sortDirection && (
        <div
          style={{
            height: '10px',
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            flexShrink: 0,
            width: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <i
            className={`fa-solid fa-caret-${sortDirection === 'asc' ? 'up' : 'down'}`}
            style={{
              fontSize: '8px',
              color: '#ffffff',
            }}
          />
        </div>
      )}
    </div>
  );
}
