import { ViewMode } from '@/lib/types';

interface NavButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function NavButton({ label, isSelected, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        position: 'relative',
        borderRadius: '4px',
        flexShrink: 0,
        width: '104px',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: isSelected ? '#262626' : 'transparent',
      }}
    >
      <p
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: '12px',
          lineHeight: 'normal',
          fontStyle: 'normal',
          position: 'relative',
          flexShrink: 0,
          textAlign: 'center',
          width: '100%',
          color: isSelected ? '#fdc71c' : '#ffffff',
        }}
      >
        {label}
      </p>
    </button>
  );
}
