interface DraftSelectButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

export default function DraftSelectButton({ onClick, disabled = false, isMobile = false }: DraftSelectButtonProps) {
  return (
    <p
      onClick={disabled ? undefined : onClick}
      style={{
        fontFamily: "var(--font-noto-sans), sans-serif",
        fontWeight: 400,
        fontSize: isMobile ? '12px' : '14px',
        lineHeight: 'normal',
        position: 'relative',
        flexShrink: 0,
        textAlign: 'center',
        color: '#3fa2ff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      SELECT
    </p>
  );
}
