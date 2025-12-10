'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BattleReplay } from '@/components/BattleReplay';
import { BattleLog } from '@/types/game';
import { api } from '@/lib/api';

export default function BattlePage() {
  const params = useParams();
  const [battle, setBattle] = useState<BattleLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBattle() {
      try {
        const id = params.id as string;
        const data = await api.getBattle(id);
        setBattle(data);
      } catch {
        setError('Battle not found');
      } finally {
        setLoading(false);
      }
    }
    loadBattle();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-yellow-400">⏳ Loading battle...</div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-400 mb-4">❌ {error || 'Battle not found'}</div>
          <a href="/" className="text-yellow-400 hover:text-yellow-300">
            ← Back to Team Builder
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <BattleReplay battle={battle} />
    </main>
  );
}
