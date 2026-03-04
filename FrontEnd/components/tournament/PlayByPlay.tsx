import { DraftEvent } from '@/lib/types';

interface PlayByPlayProps {
  events: DraftEvent[];
  isMobile?: boolean;
}

export default function PlayByPlay({ events, isMobile }: PlayByPlayProps) {
  return (
    <div
      style={{
        backgroundColor: '#070707',
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'min(400px, 50vh)' : '925px',
        minHeight: isMobile ? 200 : undefined,
        alignItems: 'flex-start',
        overflow: 'hidden',
        padding: '8px',
        position: 'relative',
        flexShrink: 0,
        width: isMobile ? '100%' : '290px',
      }}
    >
      <div
        style={{
          fontFamily: "'Consolas', monospace",
          fontStyle: 'normal',
          position: 'relative',
          flexShrink: 0,
          fontSize: '12px',
          color: '#ffffff',
          width: '100%',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        {events.map((event, index) => {
          const isLastSteal = event.type === 'steal' && 
            (index === events.length - 1 || events[index + 1]?.type === 'select');
          const showSeparator = isLastSteal && events.some(e => e.type === 'select');
          
          if (event.type === 'steal') {
            return (
              <div key={index}>
                <p
                  style={{
                    lineHeight: '18px',
                    marginBottom: 0,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{event.playerName}</span> steals #{event.golferRank}{' '}
                  {event.golferName}
                </p>
                {showSeparator && (
                  <p
                    style={{
                      lineHeight: '18px',
                      marginBottom: 0,
                    }}
                  >
                    {'---------------------------------'}
                  </p>
                )}
              </div>
            );
          } else {
            return (
              <p
                key={index}
                style={{
                  lineHeight: '18px',
                  marginBottom: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{event.playerName}</span> selects #{event.golferRank}{' '}
                {event.golferName}
              </p>
            );
          }
        })}
      </div>
    </div>
  );
}
