'use client';

import type React from 'react';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
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

function ScoreBarDivider({ invisible }: { invisible?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '8px',
        paddingBottom: '8px',
        position: 'relative',
        alignSelf: 'stretch',
        flexShrink: 0,
        width: '1px',
      }}
    >
      <div
        style={{
          backgroundColor: invisible ? 'transparent' : '#707070',
          height: '100%',
          flexShrink: 0,
          width: '1px',
        }}
      />
    </div>
  );
}

function HeaderThickDividerSpacer() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingTop: '8px',
        paddingBottom: '8px',
        alignSelf: 'stretch',
        flexShrink: 0,
        width: '2px',
      }}
    />
  );
}

function HeaderPlayerSpacer() {
  return (
    <div
      style={{
        flexShrink: 0,
        width: '70px',
        minWidth: '70px',
      }}
    />
  );
}

/** Desktop: single table, no fixed column. Mobile: two-panel with fixed player column. */
export default function SeasonTable({ players, tournamentNames }: SeasonTableProps) {
  const isMobile = useIsMobile();
  const dividerColors: Record<string, string> = {
    mtythor: '#74a553',
    kristakay: '#e12c55',
    mrhattyhat: '#ff7340',
    atticus: '#3ca1ff',
    fatrando: '#88584d',
  };

  const renderTournamentScores = (player: PlayerSeasonData) =>
    player.tournamentScores.flatMap((tournament, index) => {
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
              <Trophy size={14} color="#fdc71c" />
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
    });

  const thickDivider = (playerColor: string) => (
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
  );

  /** Mobile (right panel): season points | season average | tournaments (player is in fixed left panel) */
  const renderMobileScoreRow = (player: PlayerSeasonData) => {
    const playerColor = dividerColors[player.playerColor] || '#707070';
    return (
      <>
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
        {thickDivider(playerColor)}
        {renderTournamentScores(player)}
      </>
    );
  };

  /** Desktop: player | tournaments | season average | season points */
  const renderDesktopScoreRow = (player: PlayerSeasonData) => {
    const playerColor = dividerColors[player.playerColor] || '#707070';
    return (
      <>
        <div className={styles.playerTag}>
          <div className={styles.avatar}>
            <Image
              src={player.playerImage}
              alt={player.playerName}
              width={60}
              height={60}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <p className={styles.playerName}>{player.playerName}</p>
        </div>
        <ScoreBarDivider />
        {renderTournamentScores(player)}
        {thickDivider(playerColor)}
        <div className={styles.dataCell}>
          <p className={`${styles.dataValue} ${styles.dataValueLarge}`}>
            {player.seasonAverage}
          </p>
        </div>
        <ScoreBarDivider />
        <div className={styles.dataCell}>
          <p className={`${styles.dataValue} ${styles.dataValueLarge}`}>
            {player.seasonPoints.toLocaleString()}
          </p>
        </div>
      </>
    );
  };

  if (isMobile) {
    return (
      <div className={styles.twoPanelWrapper}>
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

        <div className={styles.rightPanel}>
          <div className={styles.headerRow}>
            <div className={`${styles.headerCell} ${styles.headerCellData}`}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p className={styles.headerText} style={{ margin: 0 }}>SEASON</p>
                <p className={styles.headerText} style={{ margin: 0 }}>POINTS</p>
              </div>
            </div>
            <ScoreBarDivider invisible />
            <div className={`${styles.headerCell} ${styles.headerCellData}`}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p className={styles.headerText} style={{ margin: 0 }}>SEASON</p>
                <p className={styles.headerText} style={{ margin: 0 }}>AVERAGE</p>
              </div>
            </div>
            <HeaderThickDividerSpacer />
            {tournamentNames.flatMap((name, index) => {
              const lines = name === 'FEDEX ST. JUDE' ? ['FEDEX', 'ST. JUDE'] : name.split(' ');
              const cell = (
                <div key={index} className={`${styles.headerCell} ${styles.headerCellData}`} style={{ flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {lines.map((line, i) => <p key={i} className={styles.headerText} style={{ margin: 0, whiteSpace: 'nowrap' }}>{line}</p>)}
                </div>
              );
              const isLast = index === tournamentNames.length - 1;
              return isLast ? [cell] : [cell, <ScoreBarDivider key={`div-${index}`} invisible />];
            })}
          </div>

          {players.map((player, playerIndex) => (
            <div key={player.playerId} className={styles.card} style={{ marginBottom: playerIndex < players.length - 1 ? '24px' : 0 }}>
              <div className={styles.scoreRow}>{renderMobileScoreRow(player)}</div>
              <div style={{ backgroundColor: dividerColors[player.playerColor] || '#707070', height: '1px', flexShrink: 0, width: '100%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Desktop: single table, no fixed column */
  return (
    <div className={styles.desktopTable}>
      <div className={styles.desktopHeaderRow}>
        <div className={`${styles.headerCell} ${styles.headerCellPlayer}`}>
          <p className={styles.headerText}>PLAYER</p>
        </div>
        <ScoreBarDivider invisible />
        {tournamentNames.flatMap((name, index) => {
          const lines = name === 'FEDEX ST. JUDE' ? ['FEDEX', 'ST. JUDE'] : name.split(' ');
          const cell = (
            <div key={index} className={`${styles.headerCell} ${styles.headerCellData}`} style={{ flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {lines.map((line, i) => <p key={i} className={styles.headerText} style={{ margin: 0, whiteSpace: 'nowrap' }}>{line}</p>)}
            </div>
          );
          const isLast = index === tournamentNames.length - 1;
          return isLast ? [cell] : [cell, <ScoreBarDivider key={`div-${index}`} invisible />];
        })}
        <HeaderThickDividerSpacer />
        <div className={`${styles.headerCell} ${styles.headerCellData}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p className={styles.headerText} style={{ margin: 0 }}>SEASON</p>
            <p className={styles.headerText} style={{ margin: 0 }}>AVERAGE</p>
          </div>
        </div>
        <ScoreBarDivider invisible />
        <div className={`${styles.headerCell} ${styles.headerCellData}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p className={styles.headerText} style={{ margin: 0 }}>SEASON</p>
            <p className={styles.headerText} style={{ margin: 0 }}>POINTS</p>
          </div>
        </div>
      </div>

      {players.map((player, playerIndex) => (
        <div key={player.playerId} className={styles.desktopCard} style={{ marginBottom: playerIndex < players.length - 1 ? '24px' : 0 }}>
          <div className={styles.scoreRow}>{renderDesktopScoreRow(player)}</div>
          <div style={{ backgroundColor: dividerColors[player.playerColor] || '#707070', height: '1px', flexShrink: 0, width: '100%' }} />
        </div>
      ))}
    </div>
  );
}
