import Image from 'next/image';

interface TournamentScore {
  score: number | null;
  hasTrophy?: boolean;
}

interface PlayerSeasonData {
  playerId: string;
  playerName: string;
  playerImage: string;
  playerColor: string; // For divider colors (mtythor, kristakay, etc.)
  tournamentScores: TournamentScore[];
  seasonAverage: number;
  seasonPoints: number;
}

interface SeasonTableProps {
  players: PlayerSeasonData[];
  tournamentNames: string[];
}

export default function SeasonTable({ players, tournamentNames }: SeasonTableProps) {
  const dividerColors: Record<string, string> = {
    mtythor: '#74a553',
    kristakay: '#e12c55',
    mrhattyhat: '#ff7340',
    atticus: '#3ca1ff',
    fatrando: '#88584d',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Table Header */}
      <div
        style={{
          display: 'flex',
          gap: '17px',
          alignItems: 'flex-start',
          padding: '8px',
          position: 'relative',
          borderRadius: '20px 20px 0 0',
          flexShrink: 0,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '32px',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            width: '206px',
            paddingLeft: '16px',
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 700,
              lineHeight: 'normal',
              position: 'relative',
              flexShrink: 0,
              fontSize: '12px',
              textAlign: 'left',
              color: '#ffffff',
              margin: 0,
            }}
          >
            PLAYER
          </p>
        </div>
        {tournamentNames.map((name, index) => {
          // Handle special cases for proper line breaks
          let lines: string[];
          if (name === 'FEDEX ST. JUDE') {
            lines = ['FEDEX', 'ST. JUDE'];
          } else {
            lines = name.split(' ');
          }
          
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                height: '32px',
                alignItems: 'center',
                overflow: 'visible',
                position: 'relative',
                flexShrink: 0,
                width: '77px',
                justifyContent: 'center',
                paddingLeft: '1px',
                paddingRight: '1px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {lines.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: "var(--font-noto-sans), sans-serif",
                      fontWeight: 700,
                      lineHeight: 'normal',
                      position: 'relative',
                      flexShrink: 0,
                      fontSize: '10px',
                      textAlign: 'center',
                      color: '#ffffff',
                      marginBottom: 0,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
        <div
          style={{
            display: 'flex',
            height: '32px',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            width: '77px',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 700,
              lineHeight: 'normal',
              position: 'relative',
              flexShrink: 0,
              fontSize: '10px',
              textAlign: 'center',
              color: '#ffffff',
              margin: 0,
            }}
          >
            SEASON<br />AVERAGE
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            height: '32px',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            width: '77px',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-noto-sans), sans-serif",
                fontWeight: 700,
                lineHeight: 'normal',
                position: 'relative',
                flexShrink: 0,
                fontSize: '10px',
                textAlign: 'center',
                color: '#ffffff',
                marginBottom: 0,
                margin: 0,
              }}
            >
              SEASON
            </p>
            <p
              style={{
                fontFamily: "var(--font-noto-sans), sans-serif",
                fontWeight: 700,
                lineHeight: 'normal',
                position: 'relative',
                flexShrink: 0,
                fontSize: '10px',
                textAlign: 'center',
                color: '#ffffff',
                marginBottom: 0,
                margin: 0,
              }}
            >
              POINTS
            </p>
          </div>
        </div>
      </div>

      {/* Player Rows */}
      {players.map((player, playerIndex) => {
        const playerColor = dividerColors[player.playerColor] || '#707070';

        return (
          <div
            key={player.playerId}
            style={{
              backgroundColor: '#262626',
              border: '1px solid #323232',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '8px',
              position: 'relative',
              borderRadius: '8px',
              flexShrink: 0,
              marginBottom: playerIndex < players.length - 1 ? '24px' : 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                position: 'relative',
                borderRadius: '20px 20px 0 0',
                flexShrink: 0,
                width: '100%',
              }}
            >
              {/* Player Info */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  height: '64px',
                  alignItems: 'center',
                  overflow: 'hidden',
                  paddingLeft: '10px',
                  position: 'relative',
                  flexShrink: 0,
                  width: '206px',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    width: '60px',
                    height: '60px',
                    overflow: 'hidden',
                    borderRadius: '40px',
                  }}
                >
                  <Image
                    src={player.playerImage}
                    alt={player.playerName}
                    width={60}
                    height={60}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-noto-sans), sans-serif",
                    fontWeight: 800,
                    lineHeight: 'normal',
                    position: 'relative',
                    flexShrink: 0,
                    fontSize: '18px',
                    textAlign: 'center',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  {player.playerName}
                </p>
              </div>

              {/* Divider after player */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  position: 'relative',
                  alignSelf: 'stretch',
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

              {/* Tournament Scores - each score followed by a divider (except the last one) */}
              {player.tournamentScores.flatMap((tournament, index) => {
                const isLastTournament = index === player.tournamentScores.length - 1;
                return [
                  <div
                    key={`score-${index}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '64px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      position: 'relative',
                      flexShrink: 0,
                      width: '77px',
                      gap: tournament.hasTrophy ? '8px' : 0,
                      lineHeight: 'normal',
                    }}
                  >
                    {tournament.hasTrophy && (
                      <p
                        style={{
                          position: 'absolute',
                          fontFamily: "'Font Awesome 7 Pro', sans-serif",
                          fontWeight: 900,
                          left: 0,
                          fontStyle: 'normal',
                          fontSize: '14px',
                          top: '8px',
                          color: '#fdc71c',
                          margin: 0,
                        }}
                      >
                        <i className="fa-solid fa-trophy" />
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-noto-sans), sans-serif",
                        fontWeight: 700,
                        lineHeight: 'normal',
                        position: 'relative',
                        flexShrink: 0,
                        fontSize: '16px',
                        textAlign: 'center',
                        color: '#ffffff',
                        margin: 0,
                      }}
                    >
                      {tournament.score === null ? '' : tournament.score}
                    </p>
                  </div>,
                  // Only add divider if not the last tournament
                  !isLastTournament && (
                    <div
                      key={`divider-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        position: 'relative',
                        alignSelf: 'stretch',
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
                  ),
                ].filter(Boolean);
              })}

              {/* Thick Divider before Season Avg */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  position: 'relative',
                  alignSelf: 'stretch',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    backgroundColor: playerColor,
                    height: '100%',
                    flexShrink: 0,
                    width: '2px',
                  }}
                />
              </div>

              {/* Season Average */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '64px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  position: 'relative',
                  flexShrink: 0,
                  width: '77px',
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-noto-sans), sans-serif",
                    fontWeight: 700,
                    lineHeight: 'normal',
                    position: 'relative',
                    flexShrink: 0,
                    fontSize: '24px',
                    textAlign: 'center',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  {player.seasonAverage}
                </p>
              </div>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  position: 'relative',
                  alignSelf: 'stretch',
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

              {/* Season Points */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '64px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  position: 'relative',
                  flexShrink: 0,
                  width: '77px',
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-noto-sans), sans-serif",
                    fontWeight: 700,
                    lineHeight: 'normal',
                    position: 'relative',
                    flexShrink: 0,
                    fontSize: '24px',
                    textAlign: 'center',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  {player.seasonPoints.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Bottom Divider */}
            <div
              style={{
                backgroundColor: playerColor,
                height: '1px',
                flexShrink: 0,
                width: '100%',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
