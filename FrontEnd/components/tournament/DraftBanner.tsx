import ProfilePicture from '../ui/ProfilePicture';

interface DraftBannerProps {
  playerName: string;
  playerImage: string;
  /** 1–3 for active picks, 4 for alternate */
  pickNumber?: number;
  /** Possessive pronoun: "his" or "her" */
  possessivePronoun?: 'his' | 'her';
}

function getPickMessage(pickNumber: number, possessive: 'his' | 'her'): string {
  if (pickNumber === 4) return `is picking ${possessive} alternate...`;
  const ordinals = ['first', 'second', 'third'] as const;
  const ordinal = ordinals[pickNumber - 1] ?? 'next';
  return `is making ${possessive} ${ordinal} pick...`;
}

export default function DraftBanner({
  playerName,
  playerImage,
  pickNumber = 1,
  possessivePronoun = 'his',
}: DraftBannerProps) {
  const message = getPickMessage(pickNumber, possessivePronoun);
  return (
    <div
      style={{
        backgroundColor: 'rgba(60, 161, 255, 0.2)',
        border: '1px solid #3ca1ff',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 8px',
        position: 'relative',
        borderRadius: '4px',
        flexShrink: 0,
        width: '1006px',
      }}
    >
      <ProfilePicture src={playerImage} alt={playerName} size={24} />
      <p
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: '12px',
          lineHeight: 'normal',
          fontStyle: 'normal',
          position: 'relative',
          flexShrink: 0,
          color: '#ffffff',
        }}
      >
        <span style={{ fontWeight: 800 }}>{playerName}</span>{' '}
        <span style={{ fontWeight: 400 }}>{message}</span>
      </p>
    </div>
  );
}
