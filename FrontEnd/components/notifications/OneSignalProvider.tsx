'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { onesignalInit } from '@/lib/onesignal-init';

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
    const safariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID?.trim();

    if (!appId) {
      onesignalInit.setUnavailable();
      return;
    }

    const initOptions: Parameters<typeof OneSignal.init>[0] = {
      appId,
      serviceWorkerPath: 'push/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/push/' },
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
      welcomeNotification: {
        message: "You're all set! You'll get notified when it's your turn to draft and when results are in.",
        title: 'Major Pain Notifications',
      },
    };

    if (safariWebId) {
      initOptions.safari_web_id = safariWebId;
    }

    OneSignal.init(initOptions)
      .then(() => onesignalInit.setReady())
      .catch((err) => onesignalInit.setFailed(err));
  }, []);

  return <>{children}</>;
}
