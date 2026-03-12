'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './PlayerCards.module.css';
import SubstitutionModal from '@/components/modal/SubstitutionModal';

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
  currentUserId?: string;
  voluntarySubEligiblePlayerIds?: string[];
  onSubstitutionConfirm?: (playerId: string, replacedGolferName: string) => void;
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

export default function PlayerCards({
  players,
  position = 'absolute',
  currentUserId,
  voluntarySubEligiblePlayerIds = [],
  onSubstitutionConfirm,
}: PlayerCardsProps) {
  const [subModalPlayerId, setSubModalPlayerId] = useState<string | null>(null);

  const modalPlayer = subModalPlayerId ? players.find((p) => p.id === subModalPlayerId) : null;
  const modalAlternate = modalPlayer?.golfers.find((g) => g.status === 'alt');
  const modalActives = modalPlayer?.golfers.filter((g) => g.status !== 'alt') ?? [];

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

      {modalPlayer && modalAlternate && modalActives.length >= 3 && (
        <SubstitutionModal
          isOpen={true}
          alternateGolferName={modalAlternate.name}
          activeGolferNames={[modalActives[0].name, modalActives[1].name, modalActives[2].name]}
          onConfirm={(replacedGolferName) => {
            onSubstitutionConfirm?.(subModalPlayerId!, replacedGolferName);
            setSubModalPlayerId(null);
          }}
          onCancel={() => setSubModalPlayerId(null)}
        />
      )}

      {/* Player Cards */}
      {players.map((player) => {
        const hasSubBanner = player.id === currentUserId && voluntarySubEligiblePlayerIds.includes(player.id);
        return (
        <div key={player.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div
          data-player-card-id={player.id}
          className={styles.card}
          style={hasSubBanner ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined}
        >
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
                  <p
                    data-golfer-position-name
                    className={styles.golferNameLine}
                    style={{ lineHeight: 'normal', margin: 0 }}
                  >
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
        {hasSubBanner && (
          <button
            onClick={() => setSubModalPlayerId(player.id)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 226, 60, 0.2)',
              border: '1px solid #F2AE00',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px',
              padding: '10px',
              cursor: 'pointer',
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 800,
              fontSize: '13px',
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 226, 60, 0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 226, 60, 0.2)';
            }}
          >
            MAKE A SUBSTITUTION
          </button>
        )}
        </div>
        );
      })}
    </div>
  );
}
