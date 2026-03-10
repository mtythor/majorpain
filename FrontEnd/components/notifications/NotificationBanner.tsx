'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNotificationSubscription } from '@/hooks/useNotificationSubscription';
import { isDevNotificationsTest } from '@/lib/notifications-dev';

/** Wider than layout mobile - catches phones in landscape and small tablets. */
const BANNER_MEDIA_QUERY = '(max-width: 1023px)';

export default function NotificationBanner() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const showBannerZone = useMediaQuery(BANNER_MEDIA_QUERY);
  const devTest = isDevNotificationsTest();
  const { optedIn, hasOneSignal } = useNotificationSubscription(!!showBannerZone || devTest);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname === '/login' || (!showBannerZone && !devTest) || !hasOneSignal || optedIn === true) return null;

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
