interface DividerProps {
  className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        height: '40px',
        alignItems: 'center',
        padding: '8px',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          backgroundColor: '#707070',
          height: '100%',
          flexShrink: 0,
          width: '1px',
        }}
      />
    </div>
  );
}
