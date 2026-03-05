import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const PLAYER_NAMES: Record<number, string> = {
  1: 'MtyThor',
  2: 'Atticus',
  3: 'KristaKay',
  4: 'MrHattyhat',
};

function getPlayerName(playerId: number): string {
  return PLAYER_NAMES[playerId] ?? `Player ${playerId}`;
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    playerId: user.playerId,
    playerName: getPlayerName(user.playerId),
    username: user.username,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
    forcePasswordChange: user.forcePasswordChange ?? false,
  });
}
