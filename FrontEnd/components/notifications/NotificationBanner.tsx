'use client';

import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNotificationSubscription } from '@/hooks/useNotificationSubscription';

export default function NotificationBanner() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { optedIn, hasOneSignal } = useNotificationSubscription(!!isMobile);

  if (!isMobile || !hasOneSignal || optedIn === true) return null;

  return (
    <button
      onClick={() => router.push('/notifications')}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: '10px 16px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderLeft: 'none',
        borderRight: 'none',
        color: '#fdc71c',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Bell size={18} />
      ENABLE MAJOR PAIN NOTIFICATIONS
    </button>
  );
}
