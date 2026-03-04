'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

/**
 * Base tournament route - redirects to list view which handles draft redirect.
 * Keeps /tournament/[id] canonical by forwarding to /tournament/[id]/list.
 */
export default function TournamentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/tournament/${params.id}/list`);
  }, [router, params.id]);
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#fff' }}>
        Loading...
      </div>
    </ProtectedRoute>
  );
}
