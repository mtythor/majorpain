'use client';

import { useState } from 'react';
import Image from 'next/image';
import SubstitutionModal from '@/components/modal/SubstitutionModal';

interface GolferTableData {
  position: number | string; // Can be number, "T1", "T2", "CUT", "WD", "--", etc.
  name: string;
  strokes: number; // Total to par
  rounds: number[]; // Round scores (strokes per round)
  points: number;
  bonus: number;
  total: number;
  /** cut = missed cut, wd = withdrawn, alt = alternate, out = voluntarily subbed out */
  status?: 'cut' | 'wd' | 'alt' | 'out';
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
  isMobile?: boolean;
  currentUserId?: string;
  voluntarySubEligiblePlayerIds?: string[];
  onSubstitutionConfirm?: (playerId: string, replacedGolferName: string) => void;
}

function formatStrokes(val: number, hasResults: boolean | undefined): string {
  if (hasResults === false && val === 0) return '--';
  if (val === 0) return 'E';
  return (val > 0 ? '+' : '') + val;
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : fullName;
}

function getGolferTextColor(status?: 'cut' | 'wd' | 'alt' | 'out'): string {
  if (status === 'cut' || status === 'wd') return '#ae6161';
  if (status === 'alt') return '#ae9661';
  if (status === 'out') return '#707070';
  return '#ffffff';
}

function MobilePlayerTableCard({ player, showSubBanner, onSubClick }: { player: PlayerTableData; showSubBanner?: boolean; onSubClick?: () => void }) {
  const textStyle = { fontFamily: "'Open Sans', sans-serif" as const, color: '#ffffff', margin: 0 };
  const borderColor = '#323232';
  const dividerColor = '#707070';
  const nameColWidth = 92;
  const dataColStyle = {
    flex: 1,
    minWidth: 40,
    padding: '8px 4px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#262626',
        overflow: 'hidden',
      }}
      data-player-table-id={player.id}
    >
      {/* Colored bar at top */}
      <div style={{ height: 2, backgroundColor: player.color, width: '100%' }} />
      {/* Single header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          backgroundColor: '#151515',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div style={{ width: nameColWidth, flexShrink: 0, padding: '8px 6px 8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', textAlign: 'center' }}>PLAYER</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>POS</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>PTS</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>BNS</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>TOT</p>
        </div>
      </div>
      {/* Player row: avatar+name | avg | pts | bns | tot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          backgroundColor: '#000000',
        }}
      >
        <div
          style={{
            width: nameColWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px 8px 8px',
            gap: 4,
          }}
        >
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, borderRadius: '4px', overflow: 'hidden' }}>
            <Image src={player.imageUrl} alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <p style={{ ...textStyle, fontWeight: 800, fontSize: '11px', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{player.name}</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '16px' }}>{player.hasResults === false && player.avgPos === 0 ? '--' : player.avgPos}</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '16px' }}>{player.hasResults === false && player.points === 0 ? '--' : player.points}</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '16px' }}>{player.hasResults === false && player.bonus === 0 ? '--' : player.bonus}</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
        <div style={{ ...dataColStyle }}>
          <p style={{ ...textStyle, fontWeight: 700, fontSize: '18px' }}>{player.hasResults === false && player.total === 0 ? '--' : player.total}</p>
        </div>
      </div>
      {/* Divider between player row and first golfer */}
      <div style={{ height: 2, backgroundColor: '#121212', width: '100%' }} />
      {/* Golfer rows - one header removed, each golfer: main row + detail row with same column alignment */}
      {player.golfers.map((golfer, index) => {
        const golferColor = getGolferTextColor(golfer.status);
        return (
          <div key={index} data-golfer-row={index} style={{ borderBottom: index < player.golfers.length - 1 ? '2px solid #121212' : 'none' }}>
            {/* Golfer main row: Name | POS | PTS | BNS | TOT */}
            <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: index % 2 === 0 ? '#262626' : '#1f1f1f' }}>
              <div style={{ width: nameColWidth, flexShrink: 0, padding: '8px 6px 8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <p style={{ ...textStyle, color: golferColor, fontWeight: 700, fontSize: '13px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getLastName(golfer.name)}</p>
              </div>
              <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
              <div style={{ ...dataColStyle }}>
                <p style={{ ...textStyle, color: golferColor, fontWeight: 700, fontSize: '14px' }}>
                  {player.hasResults === false && (golfer.position === 0 || golfer.position === '--') && golfer.rounds.length === 0 ? '--' : typeof golfer.position === 'number' && golfer.position === 0 && golfer.rounds.length > 0 ? '--' : golfer.position}
                </p>
              </div>
              <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
              <div style={{ ...dataColStyle }}>
                <p style={{ ...textStyle, color: golferColor, fontWeight: 700, fontSize: '14px' }}>{player.hasResults === false && golfer.points === 0 ? '--' : golfer.points}</p>
              </div>
              <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
              <div style={{ ...dataColStyle }}>
                <p style={{ ...textStyle, color: golferColor, fontWeight: 700, fontSize: '14px' }}>{player.hasResults === false && golfer.bonus === 0 ? '--' : golfer.bonus}</p>
              </div>
              <div style={{ width: 1, flexShrink: 0, backgroundColor: dividerColor }} />
              <div style={{ ...dataColStyle }}>
                <p style={{ ...textStyle, color: golferColor, fontWeight: 700, fontSize: '14px' }}>{player.hasResults === false && golfer.total === 0 ? '--' : golfer.total}</p>
              </div>
            </div>
            {/* Detail row: rounds and strokes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#1a1a1a', padding: '6px 12px' }}>
              <span style={{ ...textStyle, color: golfer.status ? golferColor : '#b0b0b0', fontWeight: 400, fontSize: '12px' }}>
                {golfer.rounds.length > 0 ? [1, 2, 3, 4].map((i) => golfer.rounds[i - 1] ?? '–').join(' / ') : '--'}
              </span>
              <div style={{ width: 1, height: 14, backgroundColor: '#505050', flexShrink: 0 }} />
              <span style={{ ...textStyle, color: golfer.status ? golferColor : '#b0b0b0', fontWeight: 400, fontSize: '12px' }}>{player.hasResults === false && golfer.rounds.length === 0 ? '--' : formatStrokes(golfer.strokes, player.hasResults)}</span>
            </div>
          </div>
        );
      })}
      {showSubBanner && (
        <button
          onClick={onSubClick}
          style={{ width: '100%', backgroundColor: 'rgba(255, 226, 60, 0.2)', color: '#FFFFFF', border: '1px solid #F2AE00', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', cursor: 'pointer', padding: '10px 0', fontFamily: 'var(--font-noto-sans), sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 226, 60, 0.3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 226, 60, 0.2)'; }}
        >
          MAKE A SUBSTITUTION
        </button>
      )}
      {/* Colored bar at bottom */}
      <div style={{ height: 2, backgroundColor: player.color, width: '100%', marginTop: showSubBanner ? '2px' : undefined }} />
    </div>
  );
}

export default function PlayerTables({ players, position = 'absolute', isMobile = false, currentUserId, voluntarySubEligiblePlayerIds = [], onSubstitutionConfirm }: PlayerTablesProps) {
  const [subModalPlayerId, setSubModalPlayerId] = useState<string | null>(null);
  const modalPlayer = subModalPlayerId ? players.find((p) => p.id === subModalPlayerId) : null;
  const modalAlternate = modalPlayer?.golfers.find((g) => g.status === 'alt');
  const modalActives = modalPlayer?.golfers.filter((g) => g.status !== 'alt') ?? [];
  if (isMobile) {
    return (
      <div
        className="player-tables-container player-tables-mobile"
        style={{
          position: position === 'relative' ? 'relative' : 'absolute',
          ...(position === 'absolute' && { left: '50%', top: '252px', transform: 'translateX(-50%)' }),
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          zIndex: 5,
        }}
      >
        {players.map((player) => (
          <MobilePlayerTableCard
            key={player.id}
            player={player}
            showSubBanner={player.id === currentUserId && voluntarySubEligiblePlayerIds.includes(player.id)}
            onSubClick={() => setSubModalPlayerId(player.id)}
          />
        ))}
        {modalPlayer && modalAlternate && modalActives.length >= 3 && (
          <SubstitutionModal
            isOpen={true}
            alternateGolferName={modalAlternate.name}
            activeGolferNames={[modalActives[0].name, modalActives[1].name, modalActives[2].name]}
            onConfirm={(replacedGolferName) => { onSubstitutionConfirm?.(subModalPlayerId!, replacedGolferName); setSubModalPlayerId(null); }}
            onCancel={() => setSubModalPlayerId(null)}
          />
        )}
      </div>
    );
  }

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
                      color: getGolferTextColor(golfer.status),
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
                      color: getGolferTextColor(golfer.status),
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
                      color: getGolferTextColor(golfer.status),
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
                          color: getGolferTextColor(golfer.status),
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
                      color: getGolferTextColor(golfer.status),
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
                      color: getGolferTextColor(golfer.status),
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
                      color: getGolferTextColor(golfer.status),
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
          {player.id === currentUserId && voluntarySubEligiblePlayerIds.includes(player.id) && (
            <button
              onClick={() => setSubModalPlayerId(player.id)}
              style={{ width: '1057px', minWidth: '1057px', backgroundColor: 'rgba(255, 226, 60, 0.2)', color: '#FFFFFF', border: '1px solid #F2AE00', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', cursor: 'pointer', padding: '10px 0', fontFamily: 'var(--font-noto-sans), sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 226, 60, 0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 226, 60, 0.2)'; }}
            >
              MAKE A SUBSTITUTION
            </button>
          )}
        </div>
      ))}
      {modalPlayer && modalAlternate && modalActives.length >= 3 && (
        <SubstitutionModal
          isOpen={true}
          alternateGolferName={modalAlternate.name}
          activeGolferNames={[modalActives[0].name, modalActives[1].name, modalActives[2].name]}
          onConfirm={(replacedGolferName) => { onSubstitutionConfirm?.(subModalPlayerId!, replacedGolferName); setSubModalPlayerId(null); }}
          onCancel={() => setSubModalPlayerId(null)}
        />
      )}
    </div>
  );
}
