'use client';

import { useEffect } from 'react';
import { TeamBuilder } from '@/components/TeamBuilder';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const { initPlayer, loading, error } = useGameStore();

  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  if (loading && !useGameStore.getState().player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-yellow-400">⏳ Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-400 mb-4">❌ {error}</div>
          <p className="text-gray-400">Make sure the backend is running on localhost:3001</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <TeamBuilder />
    </main>
  );
}
