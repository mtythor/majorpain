export default function PreDraftBanner({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        borderBottom: '1px solid #ffffff',
        borderTop: '1px solid #ffffff',
        display: 'flex',
        height: '192px',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '4px',
        paddingBottom: '4px',
        position: 'relative',
        width: '100%',
      }}
      data-name="Blank Slate"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
        data-name="Draft Text"
      >
        <p
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 400,
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            fontSize: '32px',
            color: '#ffffff',
            margin: 0,
          }}
        >
          The draft for this event has not yet started
        </p>
      </div>
    </div>
  );
}
