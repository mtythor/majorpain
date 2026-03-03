import { Player } from '@/lib/types';

interface SeasonStanding {
  player: Player;
  totalPoints: number;
  averagePoints: number;
  tournamentsPlayed: number;
  tournamentScores: Record<string, number>;
}

interface SeasonStandingsProps {
  standings: SeasonStanding[];
}

export default function SeasonStandings({ standings }: SeasonStandingsProps) {
  const sortedStandings = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '1200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #323232',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#151515',
            padding: '16px',
            borderBottom: '1px solid #323232',
          }}
        >
          <div style={{ flex: 1, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
            Player
          </div>
          <div style={{ width: '120px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', textAlign: 'center' }}>
            Total Points
          </div>
          <div style={{ width: '120px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', textAlign: 'center' }}>
            Average
          </div>
          <div style={{ width: '100px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', textAlign: 'center' }}>
            Tournaments
          </div>
        </div>

        {/* Rows */}
        {sortedStandings.map((standing, index) => (
          <div
            key={standing.player.id}
            style={{
              display: 'flex',
              backgroundColor: index % 2 === 0 ? '#262626' : '#1f1f1f',
              padding: '16px',
              borderBottom: '1px solid #323232',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#fdc71c' }}>
                #{index + 1}
              </span>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{standing.player.name}</span>
            </div>
            <div style={{ width: '120px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>
              {standing.totalPoints}
            </div>
            <div style={{ width: '120px', textAlign: 'center', fontSize: '14px', color: '#707070' }}>
              {standing.averagePoints.toFixed(1)}
            </div>
            <div style={{ width: '100px', textAlign: 'center', fontSize: '14px', color: '#707070' }}>
              {standing.tournamentsPlayed}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
