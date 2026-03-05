'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getLandingPath } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push(getLandingPath());
    }
  }, [isAuthenticated, loading, router]);

  return null;
}
