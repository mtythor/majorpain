'use client';

import Image from 'next/image';

interface GolferTableData {
  position: number | string; // Can be number, "T1", "T2", "--", etc.
  name: string;
  strokes: number; // Total to par
  rounds: number[]; // Round scores (strokes per round)
  points: number;
  bonus: number;
  total: number;
}

interface PlayerTableData {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  avgPos: number;
  strokesTotal: number; // Total strokes to par
  points: number;
  bonus: number;
  total: number;
  golfers: GolferTableData[];
  hasResults?: boolean; // Whether results exist (if false, show empty cells instead of 0)
}

interface PlayerTablesProps {
  players: PlayerTableData[];
  position?: 'absolute' | 'relative';
}

export default function PlayerTables({ players, position = 'absolute' }: PlayerTablesProps) {
  const tableWidth = 'min(1057px, 100%)';
  const baseStyle = position === 'relative'
    ? {
        position: 'relative' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        alignItems: 'flex-start' as const,
        zIndex: 5,
        overflowX: 'auto' as const,
        width: tableWidth,
        minWidth: 0,
      }
    : {
        position: 'absolute' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        alignItems: 'flex-start' as const,
        left: '50%',
        top: '252px',
        transform: 'translateX(-50%)',
        zIndex: 5,
        maxHeight: 'calc(100vh - 228px - 50px)',
        overflowY: 'auto' as const,
        overflowX: 'auto' as const,
        width: tableWidth,
        minWidth: 0,
      };

  return (
    <div
      className="player-tables-container"
        style={baseStyle}
      >
      {players.map((player) => (
        <div
          key={player.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            position: 'relative',
            width: '1057px',
            minWidth: '1057px',
          }}
          data-player-table-id={player.id}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              width: '1057px',
              minWidth: '1057px',
            }}
          >
            {/* POS Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginRight: '-1px',
                paddingBottom: '1px',
                width: '92px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  display: 'flex',
                  height: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 'normal',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  POS
                </p>
              </div>
              <div
                style={{
                  backgroundColor: player.color,
                  height: '2px',
                  width: '100%',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              <div
                style={{
                  border: '1px solid #323232',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                  backgroundColor: '#000000',
                  height: '64px',
                  paddingTop: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: 1,
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 400,
                    fontSize: '12px',
                    margin: 0,
                  }}
                >
                  AVG
                </p>
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: 1,
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '24px',
                    margin: '4px 0 0 0',
                  }}
                  data-player-avg-pos
                >
                  {player.hasResults === false && player.avgPos === 0 ? '--' : player.avgPos}
                </p>
              </div>
              {player.golfers.map((golfer, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                    height: '48px',
                  }}
                  data-golfer-row={index}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-golfer-position
                  >
                    {player.hasResults === false && (golfer.position === 0 || golfer.position === '--') && golfer.rounds.length === 0 ? '--' : 
                     (typeof golfer.position === 'number' && golfer.position === 0 && golfer.rounds.length > 0) ? '--' : 
                     golfer.position}
                  </p>
                </div>
              ))}
            </div>

            {/* PLAYER Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginRight: '-1px',
                paddingBottom: '1px',
                width: '238px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  display: 'flex',
                  height: '32px',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 'normal',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  PLAYER
                </p>
              </div>
              <div
                style={{
                  backgroundColor: player.color,
                  height: '2px',
                  width: '100%',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              <div
                style={{
                  border: '1px solid #323232',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                  padding: 0,
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                  backgroundColor: '#000000',
                  height: '64px',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    width: '60px',
                    height: '60px',
                    overflow: 'hidden',
                    margin: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      margin: 0,
                    }}
                  >
                    <Image
                      src={player.imageUrl}
                      alt="Player Avatar"
                      width={60}
                      height={60}
                      className="profile-pic-image"
                      style={{
                        position: 'absolute',
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        top: 0,
                        left: 0,
                      }}
                      data-player-image
                    />
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: 'normal',
                    textAlign: 'left',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '24px',
                    margin: 0,
                  }}
                  data-player-name
                >
                  {player.name}
                </p>
              </div>
              {player.golfers.map((golfer, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                    height: '48px',
                  }}
                  data-golfer-row={index}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'left',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-golfer-name
                  >
                    {golfer.name}
                  </p>
                </div>
              ))}
            </div>

            {/* STROKES Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginRight: '-1px',
                paddingBottom: '1px',
                width: '92px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  display: 'flex',
                  height: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 'normal',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  STROKES
                </p>
              </div>
              <div
                style={{
                  backgroundColor: player.color,
                  height: '2px',
                  width: '100%',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              <div
                style={{
                  border: '1px solid #323232',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                  backgroundColor: '#000000',
                  height: '64px',
                  paddingTop: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: 'normal',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '16px',
                    margin: 0,
                  }}
                  data-player-strokes-total
                >
                  {player.hasResults === false && player.strokesTotal === 0 ? '--' : (
                    player.strokesTotal === 0 ? 'E' : (
                      <>
                        {player.strokesTotal > 0 ? '+' : ''}
                        {player.strokesTotal}
                      </>
                    )
                  )}
                </p>
              </div>
              {player.golfers.map((golfer, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                    height: '48px',
                  }}
                  data-golfer-row={index}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-golfer-strokes
                  >
                    {player.hasResults === false && golfer.rounds.length === 0 ? '--' : (
                      golfer.strokes === 0 ? 'E' : (
                        <>
                          {golfer.strokes > 0 ? '+' : ''}
                          {golfer.strokes}
                        </>
                      )
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* ROUND Columns (1-4) */}
            {[1, 2, 3, 4].map((roundNum) => (
              <div
                key={roundNum}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  position: 'relative',
                  marginRight: '-1px',
                  paddingBottom: '1px',
                  width: '92px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#151515',
                    border: '1px solid #323232',
                    display: 'flex',
                    height: '32px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: '12px',
                      lineHeight: 'normal',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    ROUND {roundNum}
                  </p>
                </div>
                <div
                  style={{
                    backgroundColor: player.color,
                    height: '2px',
                    width: '100%',
                    flexShrink: 0,
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: '#000000',
                    height: '64px',
                    paddingTop: 0,
                  }}
                />
                {player.golfers.map((golfer, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #323232',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '0 16px',
                      position: 'relative',
                      width: '100%',
                      marginBottom: '-1px',
                      backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                      height: '48px',
                    }}
                    data-golfer-row={index}
                  >
                    {golfer.rounds[roundNum - 1] !== undefined ? (
                      <p
                        style={{
                          fontFamily: "'Open Sans', sans-serif",
                          lineHeight: 'normal',
                          textAlign: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '16px',
                          margin: 0,
                        }}
                        data-golfer-round={roundNum}
                      >
                        {golfer.rounds[roundNum - 1]}
                      </p>
                    ) : (
                      <p
                        style={{
                          fontFamily: "'Open Sans', sans-serif",
                          lineHeight: 'normal',
                          textAlign: 'center',
                          color: '#707070',
                          fontWeight: 700,
                          fontSize: '16px',
                          margin: 0,
                        }}
                      >
                        
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* POINTS Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginRight: '-1px',
                paddingBottom: '1px',
                width: '92px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  display: 'flex',
                  height: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 'normal',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  Points
                </p>
              </div>
              <div
                style={{
                  backgroundColor: player.color,
                  height: '2px',
                  width: '100%',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              <div
                style={{
                  border: '1px solid #323232',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                  backgroundColor: '#000000',
                  height: '64px',
                  paddingTop: 0,
                }}
              >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-player-points
                  >
                    {player.hasResults === false && player.points === 0 ? '--' : player.points}
                  </p>
              </div>
              {player.golfers.map((golfer, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                    height: '48px',
                  }}
                  data-golfer-row={index}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-golfer-points
                  >
                    {player.hasResults === false && golfer.points === 0 ? '--' : golfer.points}
                  </p>
                </div>
              ))}
            </div>

            {/* BONUS Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginRight: '-1px',
                paddingBottom: '1px',
                width: '92px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  display: 'flex',
                  height: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 'normal',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  bonus
                </p>
              </div>
              <div
                style={{
                  backgroundColor: player.color,
                  height: '2px',
                  width: '100%',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              <div
                style={{
                  border: '1px solid #323232',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                  backgroundColor: '#000000',
                  height: '64px',
                  paddingTop: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: 'normal',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '16px',
                    margin: 0,
                  }}
                  data-player-bonus
                >
                  {player.hasResults === false && player.bonus === 0 ? '--' : player.bonus}
                </p>
              </div>
              {player.golfers.map((golfer, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                    height: '48px',
                  }}
                  data-golfer-row={index}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-golfer-bonus
                  >
                    {player.hasResults === false && golfer.bonus === 0 ? '--' : golfer.bonus}
                  </p>
                </div>
              ))}
            </div>

            {/* TOTAL Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginRight: '-1px',
                paddingBottom: '1px',
                width: '92px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  display: 'flex',
                  height: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    lineHeight: 'normal',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  Total
                </p>
              </div>
              <div
                style={{
                  backgroundColor: player.color,
                  height: '2px',
                  width: '100%',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              <div
                style={{
                  border: '1px solid #323232',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  width: '100%',
                  marginBottom: '-1px',
                  backgroundColor: '#000000',
                  height: '64px',
                  paddingTop: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: 'normal',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '24px',
                    margin: 0,
                  }}
                  data-player-total
                >
                  {player.hasResults === false && player.total === 0 ? '--' : player.total}
                </p>
              </div>
              {player.golfers.map((golfer, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #323232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 16px',
                    position: 'relative',
                    width: '100%',
                    marginBottom: '-1px',
                    backgroundColor: index === 3 ? '#1a1a1a' : '#262626',
                    height: '48px',
                  }}
                  data-golfer-row={index}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      lineHeight: 'normal',
                      textAlign: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: 0,
                    }}
                    data-golfer-total
                  >
                    {player.hasResults === false && golfer.total === 0 ? '--' : golfer.total}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
