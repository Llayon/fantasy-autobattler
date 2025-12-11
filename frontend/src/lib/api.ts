/**
 * API client for Fantasy Autobattler frontend.
 * Provides type-safe HTTP client for all backend endpoints.
 * 
 * @fileoverview Complete API client with error handling and authentication.
 */

import { 
  Player, 
  BattleLog, 
  UnitTemplate, 
  CreateTeamDto, 
  TeamResponse, 
  UnitsListResponse,
  MatchmakingEntry,
  MatchmakingStatus
} from '@/types/game';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_URL = 'http://localhost:3001';

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * API error class with structured error information.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * User-friendly error messages for common HTTP status codes.
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Неверные данные запроса',
  401: 'Требуется авторизация',
  403: 'Доступ запрещен',
  404: 'Ресурс не найден',
  409: 'Конфликт данных',
  422: 'Ошибка валидации данных',
  429: 'Слишком много запросов',
  500: 'Внутренняя ошибка сервера',
  502: 'Сервер недоступен',
  503: 'Сервис временно недоступен',
};

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Get authentication token from localStorage.
 * 
 * @returns Guest token or null if not found
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('guestToken');
}

/**
 * Store authentication token in localStorage.
 * 
 * @param token - Guest authentication token
 */
function setToken(token: string): void {
  localStorage.setItem('guestToken', token);
}

/**
 * Remove authentication token from localStorage.
 */
function clearToken(): void {
  localStorage.removeItem('guestToken');
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

/**
 * Generic HTTP client with authentication and error handling.
 * 
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws ApiError with user-friendly messages
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'x-guest-token': token }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { 
      ...options, 
      headers 
    });
    
    if (!res.ok) {
      let errorMessage = ERROR_MESSAGES[res.status] || `HTTP Error: ${res.status}`;
      let errorDetails: unknown;

      // Try to parse error response for additional details
      try {
        const errorData = await res.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        errorDetails = errorData;
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      throw new ApiError(res.status, res.statusText, errorMessage, errorDetails);
    }
    
    // Handle 204 No Content responses
    if (res.status === 204) {
      return undefined as T;
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(0, 'Network Error', 'Ошибка сети. Проверьте подключение к интернету.');
  }
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Complete API client for Fantasy Autobattler.
 * Provides type-safe methods for all backend endpoints.
 */
export const api = {
  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  /**
   * Create new guest account and store authentication token.
   * 
   * @returns Player ID and authentication token
   * @throws ApiError if guest creation fails
   * @example
   * const { playerId, token } = await api.createGuest();
   */
  async createGuest(): Promise<{ playerId: string; token: string }> {
    const data = await fetchApi<{ playerId: string; token: string }>('/auth/guest', {
      method: 'POST',
    });
    setToken(data.token);
    return data;
  },

  /**
   * Get current player profile information.
   * 
   * @returns Player profile with stats and team info
   * @throws ApiError if player not found or unauthorized
   * @example
   * const player = await api.getPlayer();
   */
  async getPlayer(): Promise<Player> {
    return fetchApi<Player>('/player/me');
  },

  /**
   * Check if user has valid authentication token.
   * 
   * @returns True if token exists in localStorage
   */
  hasToken(): boolean {
    return !!getToken();
  },

  /**
   * Clear authentication token (logout).
   */
  logout(): void {
    clearToken();
  },

  // ===========================================================================
  // UNITS
  // ===========================================================================

  /**
   * Get all available units with role grouping.
   * 
   * @returns Complete units database with 15 units
   * @throws ApiError if units cannot be retrieved
   * @example
   * const { units, byRole } = await api.getUnits();
   */
  async getUnits(): Promise<UnitsListResponse> {
    return fetchApi<UnitsListResponse>('/units');
  },

  /**
   * Get specific unit by ID.
   * 
   * @param unitId - Unit identifier
   * @returns Unit template with complete stats
   * @throws ApiError if unit not found
   * @example
   * const knight = await api.getUnit('knight');
   */
  async getUnit(unitId: string): Promise<UnitTemplate> {
    return fetchApi<UnitTemplate>(`/units/${unitId}`);
  },

  /**
   * Get units filtered by role.
   * 
   * @param role - Unit role to filter by
   * @returns Units with specified role
   * @throws ApiError if role is invalid
   * @example
   * const tanks = await api.getUnitsByRole('tank');
   */
  async getUnitsByRole(role: string): Promise<{ role: string; units: UnitTemplate[]; count: number }> {
    return fetchApi<{ role: string; units: UnitTemplate[]; count: number }>(`/units/roles/${role}`);
  },

  // ===========================================================================
  // TEAMS
  // ===========================================================================

  /**
   * Create new team with unit composition and positions.
   * 
   * @param team - Team configuration data
   * @returns Created team with enriched unit information
   * @throws ApiError if team data is invalid or budget exceeded
   * @example
   * const team = await api.createTeam({
   *   name: 'My Team',
   *   units: [{ unitId: 'knight', position: { x: 0, y: 0 } }]
   * });
   */
  async createTeam(team: CreateTeamDto): Promise<TeamResponse> {
    return fetchApi<TeamResponse>('/team', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  },

  /**
   * Get all teams for the current player.
   * 
   * @returns Array of player's teams
   * @throws ApiError if unauthorized
   * @example
   * const { teams } = await api.getTeams();
   */
  async getTeams(): Promise<{ teams: TeamResponse[]; total: number }> {
    return fetchApi<{ teams: TeamResponse[]; total: number }>('/team');
  },

  /**
   * Get specific team by ID.
   * 
   * @param id - Team identifier
   * @returns Team with enriched unit information
   * @throws ApiError if team not found or not owned by player
   * @example
   * const team = await api.getTeam('team-123');
   */
  async getTeam(id: string): Promise<TeamResponse> {
    return fetchApi<TeamResponse>(`/team/${id}`);
  },

  /**
   * Update existing team configuration.
   * 
   * @param id - Team identifier
   * @param team - Updated team data
   * @returns Updated team with enriched information
   * @throws ApiError if team not found, not owned, or invalid data
   * @example
   * const updatedTeam = await api.updateTeam('team-123', {
   *   name: 'Updated Name',
   *   units: [{ unitId: 'mage', position: { x: 1, y: 0 } }]
   * });
   */
  async updateTeam(id: string, team: Partial<CreateTeamDto>): Promise<TeamResponse> {
    return fetchApi<TeamResponse>(`/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    });
  },

  /**
   * Delete team by ID.
   * 
   * @param id - Team identifier
   * @throws ApiError if team not found, not owned, or is active
   * @example
   * await api.deleteTeam('team-123');
   */
  async deleteTeam(id: string): Promise<void> {
    return fetchApi<void>(`/team/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Activate team for matchmaking.
   * 
   * @param id - Team identifier
   * @returns Activated team
   * @throws ApiError if team not found or not owned
   * @example
   * const activeTeam = await api.activateTeam('team-123');
   */
  async activateTeam(id: string): Promise<TeamResponse> {
    return fetchApi<TeamResponse>(`/team/${id}/activate`, {
      method: 'POST',
    });
  },

  // ===========================================================================
  // MATCHMAKING
  // ===========================================================================

  /**
   * Join matchmaking queue with selected team.
   * 
   * @param teamId - Team identifier for matchmaking
   * @returns Queue entry information
   * @throws ApiError if team invalid or player already in queue
   * @example
   * const queueEntry = await api.joinMatchmaking('team-123');
   */
  async joinMatchmaking(teamId: string): Promise<MatchmakingEntry> {
    return fetchApi<MatchmakingEntry>('/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  },

  /**
   * Leave matchmaking queue.
   * 
   * @returns Success confirmation
   * @throws ApiError if player not in queue
   * @example
   * await api.leaveMatchmaking();
   */
  async leaveMatchmaking(): Promise<void> {
    await fetchApi<{ success: boolean }>('/matchmaking/leave', {
      method: 'POST',
    });
  },

  /**
   * Get current matchmaking status.
   * 
   * @returns Current status (queued, matched, or not_in_queue)
   * @throws ApiError if unauthorized
   * @example
   * const status = await api.getMatchmakingStatus();
   * if (status.status === 'matched') {
   *   // Handle match found
   * }
   */
  async getMatchmakingStatus(): Promise<{
    status: MatchmakingStatus;
    queueEntry?: {
      id: string;
      teamId: string;
      rating: number;
      waitTime: number;
      joinedAt: Date;
    };
    match?: {
      battleId: string;
      opponentId: string;
      ratingDifference: number;
    };
  }> {
    return fetchApi<{
      status: MatchmakingStatus;
      queueEntry?: {
        id: string;
        teamId: string;
        rating: number;
        waitTime: number;
        joinedAt: Date;
      };
      match?: {
        battleId: string;
        opponentId: string;
        ratingDifference: number;
      };
    }>('/matchmaking/status');
  },

  /**
   * Find match for current player (polling endpoint).
   * 
   * @returns Match information if opponent found
   * @throws ApiError if player not in queue
   * @example
   * const result = await api.findMatch();
   * if (result.found) {
   *   // Navigate to battle
   * }
   */
  async findMatch(): Promise<{
    found: boolean;
    match?: {
      battleId: string;
      opponentId: string;
      ratingDifference: number;
    };
  }> {
    return fetchApi<{
      found: boolean;
      match?: {
        battleId: string;
        opponentId: string;
        ratingDifference: number;
      };
    }>('/matchmaking/find', {
      method: 'POST',
    });
  },

  // ===========================================================================
  // BATTLES
  // ===========================================================================

  /**
   * Start new battle against bot opponent.
   * 
   * @param difficulty - Battle difficulty (optional)
   * @param teamId - Team to use (optional, uses active team)
   * @returns Battle result with events and winner
   * @throws ApiError if no active team or invalid parameters
   * @example
   * const battle = await api.startBattle('medium', 'team-123');
   */
  async startBattle(difficulty?: string, teamId?: string): Promise<{
    id: string;
    winner: string;
    rounds: number;
    events: object[];
    playerTeam: string[];
    botTeam: string[];
    createdAt: string;
  }> {
    const body: { difficulty?: string; teamId?: string } = {};
    if (difficulty) body.difficulty = difficulty;
    if (teamId) body.teamId = teamId;

    return fetchApi<{
      id: string;
      winner: string;
      rounds: number;
      events: object[];
      playerTeam: string[];
      botTeam: string[];
      createdAt: string;
    }>('/battle/start', {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * Get battle details by ID.
   * 
   * @param id - Battle identifier
   * @returns Complete battle log with events for replay
   * @throws ApiError if battle not found
   * @example
   * const battle = await api.getBattle('battle-123');
   */
  async getBattle(id: string): Promise<BattleLog> {
    return fetchApi<BattleLog>(`/battle/${id}`);
  },

  /**
   * Get all battles for current player.
   * 
   * @returns Array of player's battle history
   * @throws ApiError if unauthorized
   * @example
   * const { battles } = await api.getBattles();
   */
  async getBattles(): Promise<{ battles: BattleLog[]; total: number }> {
    return fetchApi<{ battles: BattleLog[]; total: number }>('/battle');
  },

  // ===========================================================================
  // LEGACY COMPATIBILITY
  // ===========================================================================

  /**
   * Legacy method for updating player team (deprecated).
   * @deprecated Use createTeam() or updateTeam() instead
   */
  async updatePlayerTeam(team: string[]): Promise<Player> {
    return fetchApi<Player>('/player/team', {
      method: 'PUT',
      body: JSON.stringify({ team }),
    });
  },
};
