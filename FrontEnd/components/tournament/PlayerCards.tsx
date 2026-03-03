'use client';

import Image from 'next/image';
import styles from './PlayerCards.module.css';

interface Golfer {
  rank: number;
  name: string;
  status?: 'out' | 'alt' | 'cut' | 'wd';
}

interface PlayerCardData {
  id: string;
  name: string;
  imageUrl: string;
  avgPos: number;
  points: number;
  bonus: number;
  total: number;
  color: string;
  golfers: Golfer[];
  hasResults?: boolean;
}

interface PlayerCardsProps {
  players: PlayerCardData[];
  position?: 'absolute' | 'relative';
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : fullName;
}

function ScoreBarDivider() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: '1px',
        alignSelf: 'stretch',
        height: '64px',
      }}
    >
      <div style={{ height: '48px', width: '1px', backgroundColor: '#707070' }} />
    </div>
  );
}

export default function PlayerCards({ players, position = 'absolute' }: PlayerCardsProps) {
  return (
    <div
      className={`${styles.root} ${position === 'relative' ? styles.positionRelative : styles.positionAbsolute}`}
    >
      {/* Header Row - structure must match player score bar for column alignment */}
      <div className={styles.headerRow}>
        <div className={`${styles.headerCell} ${styles.headerCellPlayer}`}>
          <p className={styles.headerText}>PLAYER</p>
        </div>
        <div className={styles.headerSpacer} />
        <div className={`${styles.headerCell} ${styles.headerCellData}`}>
          <p className={styles.headerText}>AVG POS</p>
        </div>
        <div className={styles.headerSpacer} />
        <div className={`${styles.headerCell} ${styles.headerCellData}`}>
          <p className={styles.headerText}>POINTS</p>
        </div>
        <div className={styles.headerSpacer} />
        <div className={`${styles.headerCell} ${styles.headerCellData}`}>
          <p className={styles.headerText}>BONUS</p>
        </div>
        <div className={styles.headerSpacer} />
        <div className={`${styles.headerCell} ${styles.headerCellData}`}>
          <p className={styles.headerText}>TOTAL</p>
        </div>
      </div>

      {/* Player Cards */}
      {players.map((player) => (
        <div key={player.id} data-player-card-id={player.id} className={styles.card}>
          {/* Player Score Bar */}
          <div className={styles.scoreBar}>
            {/* Player Tag */}
            <div className={styles.playerTag}>
              <div className={styles.avatar}>
                <Image
                  src={player.imageUrl}
                  alt="Player Avatar"
                  fill
                  data-player-image
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <p data-player-name className={styles.playerName}>
                {player.name}
              </p>
            </div>

            <ScoreBarDivider />
            <div className={styles.dataCell}>
              <p data-player-avg-pos className={styles.dataValue}>
                {player.hasResults === false && player.avgPos === 0 ? '--' : player.avgPos}
              </p>
            </div>
            <ScoreBarDivider />
            <div className={styles.dataCell}>
              <p data-player-points className={styles.dataValue}>
                {player.hasResults === false && player.points === 0 ? '--' : player.points}
              </p>
            </div>
            <ScoreBarDivider />
            <div className={styles.dataCell}>
              <p data-player-bonus className={styles.dataValue}>
                {player.hasResults === false && player.bonus === 0 ? '--' : player.bonus}
              </p>
            </div>
            <ScoreBarDivider />
            <div className={styles.dataCell}>
              <p data-player-total className={`${styles.dataValue} ${styles.dataValueTotal}`}>
                {player.hasResults === false && player.total === 0 ? '--' : player.total}
              </p>
            </div>
          </div>

          <div className={styles.colorDivider} style={{ backgroundColor: player.color }} />

          <div className={styles.golferBar}>
            {player.golfers.flatMap((golfer, index) => [
              <div key={`golfer-${index}`} data-golfer-tag-index={index} className={styles.golferSlot}>
                <div
                  className={styles.golferText}
                  style={{
                    color:
                      golfer.status === 'out'
                        ? '#707070'
                        : golfer.status === 'alt'
                        ? '#ae9661'
                        : golfer.status === 'cut' || golfer.status === 'wd'
                        ? '#ae6161'
                        : '#ffffff',
                  }}
                >
                  <p data-golfer-position-name style={{ lineHeight: 'normal', margin: 0 }}>
                    <span className={styles.golferNameShort}>
                      {player.hasResults === false
                        ? getLastName(golfer.name)
                        : (golfer.status === 'cut' ? 'CUT: ' : golfer.status === 'wd' ? 'WD: ' : `${golfer.rank}: `) + getLastName(golfer.name)}
                    </span>
                    <span className={styles.golferNameFull}>
                      {player.hasResults === false
                        ? golfer.name
                        : (golfer.status === 'cut' ? 'CUT: ' : golfer.status === 'wd' ? 'WD: ' : `${golfer.rank}: `) + golfer.name}
                    </span>
                  </p>
                </div>
              </div>,
              index < player.golfers.length - 1 && (
                <div
                  key={`divider-${index}`}
                  style={{
                    display: 'flex',
                    height: '100%',
                    alignItems: 'center',
                    padding: '4px 0',
                    flexShrink: 0,
                    width: '1px',
                  }}
                >
                  <div style={{ height: '100%', width: '1px', backgroundColor: '#707070' }} />
                </div>
              ),
            ])}
          </div>
        </div>
      ))}
    </div>
  );
}
