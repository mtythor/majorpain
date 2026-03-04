'use client';

import type React from 'react';
import Image from 'next/image';
import styles from './SeasonTable.module.css';

interface TournamentScore {
  score: number | null;
  hasTrophy?: boolean;
}

interface PlayerSeasonData {
  playerId: string;
  playerName: string;
  playerImage: string;
  playerColor: string;
  tournamentScores: TournamentScore[];
  seasonAverage: number;
  seasonPoints: number;
}

interface SeasonTableProps {
  players: PlayerSeasonData[];
  tournamentNames: string[];
}

function ScoreBarDivider() {
  return (
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
  );
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
    <div className={styles.twoPanelWrapper}>
      {/* Left panel - fixed */}
      <div className={styles.leftPanel}>
        <div className={styles.leftHeader}>
          <p className={styles.headerText}>PLAYER</p>
        </div>
        {players.map((player, playerIndex) => (
          <div
            key={player.playerId}
            className={styles.leftCell}
            style={{ marginBottom: playerIndex < players.length - 1 ? '24px' : 0 }}
          >
            <div className={styles.leftScoreRow}>
              <div className={styles.playerTag}>
                <div className={styles.avatar}>
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
                <p className={styles.playerName}>{player.playerName}</p>
              </div>
            </div>
            <div
              className={styles.leftDivider}
              style={{ backgroundColor: dividerColors[player.playerColor] || '#707070' }}
            />
          </div>
        ))}
      </div>

      {/* Right panel - scrollable */}
      <div className={styles.rightPanel}>
        <div className={styles.headerRow}>
          <ScoreBarDivider />
          <div className={`${styles.headerCell} ${styles.headerCellData}`}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p className={styles.headerText} style={{ margin: 0 }}>SEASON</p>
              <p className={styles.headerText} style={{ margin: 0 }}>POINTS</p>
            </div>
          </div>
          <ScoreBarDivider />
          <div className={`${styles.headerCell} ${styles.headerCellData}`}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p className={styles.headerText} style={{ margin: 0 }}>SEASON</p>
              <p className={styles.headerText} style={{ margin: 0 }}>AVERAGE</p>
            </div>
          </div>
          {tournamentNames.flatMap((name, index) => {
            let lines: string[];
            if (name === 'FEDEX ST. JUDE') {
              lines = ['FEDEX', 'ST. JUDE'];
            } else {
              lines = name.split(' ');
            }
            return [
              <ScoreBarDivider key={`div-${index}`} />,
              <div
                key={index}
                className={`${styles.headerCell} ${styles.headerCellData}`}
                style={{
                  flexDirection: 'column',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {lines.map((line, i) => (
                  <p
                    key={i}
                    className={styles.headerText}
                    style={{ margin: 0, whiteSpace: 'nowrap' }}
                  >
                    {line}
                  </p>
                ))}
              </div>,
            ];
          })}
        </div>

        {players.map((player, playerIndex) => {
          const playerColor = dividerColors[player.playerColor] || '#707070';

          return (
            <div
              key={player.playerId}
              className={styles.card}
              style={{ marginBottom: playerIndex < players.length - 1 ? '24px' : 0 }}
            >
              <div className={styles.scoreRow}>
                <ScoreBarDivider />

                <div className={styles.dataCell}>
                  <p className={`${styles.dataValue} ${styles.dataValueLarge}`}>
                    {player.seasonPoints.toLocaleString()}
                  </p>
                </div>

                <ScoreBarDivider />

                <div className={styles.dataCell}>
                  <p className={`${styles.dataValue} ${styles.dataValueLarge}`}>
                    {player.seasonAverage}
                  </p>
                </div>

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

                {player.tournamentScores.flatMap((tournament, index) => {
                  const isLastTournament = index === player.tournamentScores.length - 1;
                  const elements: React.ReactNode[] = [
                    <div
                      key={`score-${index}`}
                      className={styles.dataCell}
                      style={{ gap: tournament.hasTrophy ? '8px' : 0 }}
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
                      <p className={styles.dataValue}>
                        {tournament.score === null ? '' : tournament.score}
                      </p>
                    </div>,
                  ];
                  if (!isLastTournament) {
                    elements.push(<ScoreBarDivider key={`divider-${index}`} />);
                  }
                  return elements;
                })}
              </div>

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
    </div>
  );
}
