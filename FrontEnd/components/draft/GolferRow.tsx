import { Golfer, DraftStatus } from '@/lib/types';
import DraftTableCell from './DraftTableCell';
import ProfilePicture from '../ui/ProfilePicture';
import DraftSelectButton from './DraftSelectButton';
import { getRowClass } from '@/lib/utils';

interface GolferRowProps {
  golfer: Golfer;
  rank: number;
  odds: string;
  draftStatus: DraftStatus;
  onSelect: () => void;
  index: number;
}

export default function GolferRow({
  golfer,
  rank,
  odds,
  draftStatus,
  onSelect,
  index,
}: GolferRowProps) {
  const rowClass = getRowClass(index);
  const rowType = rowClass === 'alt-row' ? 'alt' : 'standard';

  return (
    <>
      {/* Golfer Column */}
      <DraftTableCell type="data" rowType={rowType} align="left">
        <p
          style={{
            fontFamily: "var(--font-noto-sans), sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            color: '#ffffff',
          }}
        >
          {golfer.name}
        </p>
      </DraftTableCell>

      {/* Rank Column */}
      <DraftTableCell type="data" rowType={rowType}>
        <p
          style={{
            fontFamily: "var(--font-noto-sans), sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          {rank}
        </p>
      </DraftTableCell>

      {/* Odds Column */}
      <DraftTableCell type="data" rowType={rowType}>
        <p
          style={{
            fontFamily: "var(--font-noto-sans), sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          {odds}
        </p>
      </DraftTableCell>

      {/* Draft Column */}
      <DraftTableCell type="data" rowType={rowType}>
        {draftStatus.draftedBy ? (
          <ProfilePicture
            src={draftStatus.draftedByImage || ''}
            alt={draftStatus.draftedBy}
            size={32}
          />
        ) : (
          <DraftSelectButton onClick={onSelect} disabled={!draftStatus.isSelectable} />
        )}
      </DraftTableCell>
    </>
  );
}
