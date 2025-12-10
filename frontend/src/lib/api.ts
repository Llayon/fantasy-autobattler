import { Player, BattleLog, UnitType } from '@/types/game';

const API_URL = 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('guestToken');
}

function setToken(token: string) {
  localStorage.setItem('guestToken', token);
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'x-guest-token': token }),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  async createGuest(): Promise<{ playerId: string; token: string }> {
    const data = await fetchApi<{ playerId: string; token: string }>('/auth/guest', {
      method: 'POST',
    });
    setToken(data.token);
    return data;
  },

  async getPlayer(): Promise<Player> {
    return fetchApi<Player>('/player/me');
  },

  async updateTeam(team: UnitType[]): Promise<Player> {
    return fetchApi<Player>('/player/team', {
      method: 'PUT',
      body: JSON.stringify({ team }),
    });
  },

  async startBattle(): Promise<{ battleId: string }> {
    return fetchApi<{ battleId: string }>('/battle/start', {
      method: 'POST',
    });
  },

  async getBattle(id: string): Promise<BattleLog> {
    return fetchApi<BattleLog>(`/battle/${id}`);
  },

  hasToken(): boolean {
    return !!getToken();
  },
};
