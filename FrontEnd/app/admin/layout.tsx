'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getCurrentUser } from '@/lib/data';
import { useAllTournamentData } from '@/lib/use-api-data';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading } = useAllTournamentData();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!currentUser?.isAdmin) {
      router.replace('/season');
    }
  }, [loading, currentUser, router]);

  return (
    <ProtectedRoute>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        <BackgroundImage imageSrc="/images/Masters.jpg" alt="Background" />
        <Header
          currentView="admin"
          userProfile={getCurrentUser()}
          onViewChange={(view) => {
            if (view === 'tournament') router.push('/tournament/1/list');
            else if (view === 'season') router.push('/season');
          }}
        />
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: '180px',
              minHeight: '50vh',
              color: '#ffffff',
            }}
          >
            Loading...
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              paddingTop: '180px',
              paddingBottom: '40px',
              zIndex: 5,
            }}
          >
            {children}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
