# Draft Access Error Fix

## Problem

Users were encountering "Доступ к забегу запрещен" (Access to run forbidden) error when trying to access the draft page in roguelike mode.

### Root Cause

The error occurs when the guest authentication token doesn't match the run's owner. This happens when:

1. Browser localStorage is cleared (token deleted)
2. User switches browsers or devices
3. User uses incognito/private mode
4. Multiple browser tabs regenerate the token

### Technical Details

- Guest tokens are stored in `localStorage` under key `guestToken`
- Each token is tied to a specific player ID
- Runs are owned by the player ID that created them
- Access control is enforced in `DraftService.getRunWithAccessCheck()`

## Solution

### 1. Improved Error Handling (Backend)

**File:** `backend/src/roguelike/draft/draft.service.ts`

Added detailed logging to help diagnose access issues:

```typescript
if (run.playerId !== playerId) {
  this.logger.warn('Access denied - run belongs to different player', {
    runId,
    requestingPlayerId: playerId,
    runOwnerId: run.playerId,
    runCreatedAt: run.createdAt,
  });
  throw new RunAccessDeniedException(runId, playerId);
}
```

**Benefits:**
- Logs show which player is trying to access which run
- Helps identify token mismatch issues
- Provides timestamps for debugging

### 2. Better Error Messages (Frontend)

**File:** `frontend/src/store/draftStore.ts`

Added specific handling for 403 (Forbidden) errors:

```typescript
// 403 means access denied - provide clear message
if (error instanceof ApiError && error.status === 403) {
  set({ 
    error: 'Доступ к забегу запрещен. Этот забег принадлежит другому игроку или ваша сессия истекла.', 
    loading: false,
    isDraftAvailable: false,
  });
  return;
}
```

**Benefits:**
- Clear explanation of what went wrong
- Suggests possible causes (different player, expired session)
- Prevents retry attempts that will fail

### 3. Improved UI Feedback

**File:** `frontend/src/app/run/[id]/draft/page.tsx`

Enhanced error display with context-aware UI:

```typescript
const isAccessDenied = draftError.includes('Доступ') || draftError.includes('запрещен');

return (
  <div className="text-6xl mb-4">{isAccessDenied ? '🔒' : '⚠️'}</div>
  <h1>{isAccessDenied ? 'Доступ к забегу запрещен' : 'Ошибка загрузки драфта'}</h1>
  {!isAccessDenied && <button onClick={retry}>Повторить</button>}
);
```

**Benefits:**
- Lock icon (🔒) for access denied errors
- No retry button for access errors (they won't succeed)
- Clear visual distinction between error types

### 4. API Helper Functions

**File:** `frontend/src/lib/api.ts`

Added utility functions for error type checking:

```typescript
export function isAccessDeniedError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 403;
  }
  return false;
}

export function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404;
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401;
  }
  return false;
}
```

**Benefits:**
- Type-safe error checking
- Reusable across the application
- Consistent error handling patterns

### 5. Troubleshooting Documentation

**File:** `docs/TROUBLESHOOTING.md`

Created comprehensive troubleshooting guide covering:

- Common error scenarios
- Root causes and solutions
- Prevention strategies
- Debugging tips
- Information to include in bug reports

**Benefits:**
- Self-service support for users
- Reduces support burden
- Helps developers debug issues
- Documents known issues and workarounds

## Testing

### Manual Testing Steps

1. **Normal Flow:**
   ```bash
   # Create run
   POST /runs { faction: 'humans', leaderId: 'commander-aldric' }
   
   # Access draft (should work)
   GET /runs/:id/draft
   ```

2. **Access Denied Scenario:**
   ```bash
   # Create run with token A
   POST /runs { faction: 'humans', leaderId: 'commander-aldric' }
   
   # Try to access with token B (should fail with 403)
   GET /runs/:id/draft
   ```

3. **UI Testing:**
   - Create a run
   - Clear localStorage
   - Refresh page (new token generated)
   - Try to access draft
   - Should see lock icon and clear error message
   - Should NOT see retry button

### Expected Behavior

**Before Fix:**
- Generic error message
- Retry button (doesn't help)
- No clear indication of the problem
- No logging to help debug

**After Fix:**
- Clear error message explaining the issue
- Lock icon for visual clarity
- No retry button (won't work anyway)
- Detailed backend logs for debugging
- Troubleshooting guide for users

## Prevention

### For Users

1. **Use the same browser/device** for the entire run
2. **Don't clear browser data** during active runs
3. **Avoid incognito mode** for roguelike runs
4. **Complete runs** before switching browsers

### For Developers

1. **Check token before creating run:**
   ```typescript
   if (!api.hasToken()) {
     await api.createGuest();
   }
   ```

2. **Handle 403 errors gracefully:**
   ```typescript
   try {
     const draft = await api.getRoguelikeDraft(runId);
   } catch (error) {
     if (isAccessDeniedError(error)) {
       // Show access denied UI
       // Don't allow retry
     }
   }
   ```

3. **Log access control events:**
   ```typescript
   this.logger.warn('Access denied', {
     runId,
     requestingPlayerId,
     runOwnerId,
   });
   ```

## Future Improvements

### Potential Enhancements

1. **Token Persistence:**
   - Store token in httpOnly cookie (more secure)
   - Implement token refresh mechanism
   - Add token expiration handling

2. **Run Transfer:**
   - Allow transferring run to new token
   - Implement "claim run" feature
   - Add run recovery mechanism

3. **Better Session Management:**
   - Detect token changes
   - Warn user before token expires
   - Auto-save run state

4. **Multi-Device Support:**
   - Implement proper authentication
   - Allow same user on multiple devices
   - Sync run state across devices

## Related Files

### Modified Files
- `backend/src/roguelike/draft/draft.service.ts` - Added logging
- `frontend/src/store/draftStore.ts` - Improved error handling
- `frontend/src/app/run/[id]/draft/page.tsx` - Enhanced UI
- `frontend/src/lib/api.ts` - Added helper functions

### New Files
- `docs/TROUBLESHOOTING.md` - User troubleshooting guide
- `DRAFT_ACCESS_FIX.md` - This document

### Related Documentation
- `docs/GAME_DESIGN_DOCUMENT.md` - Game mechanics
- `docs/ROGUELIKE_DESIGN.md` - Roguelike mode details
- `docs/ARCHITECTURE.md` - System architecture
- `docs/ENGINEERING_GUIDE.md` - Development standards

## Rollout Plan

### Phase 1: Deploy Fix (Immediate)
- ✅ Backend logging improvements
- ✅ Frontend error handling
- ✅ UI enhancements
- ✅ Documentation

### Phase 2: Monitor (1 week)
- Check backend logs for access denied errors
- Monitor user feedback
- Track error rates
- Identify edge cases

### Phase 3: Iterate (2 weeks)
- Implement additional improvements based on feedback
- Consider token persistence enhancements
- Evaluate multi-device support needs

## Success Metrics

### Key Performance Indicators

1. **Error Rate:**
   - Baseline: Unknown (not tracked before)
   - Target: < 1% of draft requests

2. **User Feedback:**
   - Baseline: Confusion about error
   - Target: Clear understanding of issue

3. **Support Tickets:**
   - Baseline: Multiple tickets per week
   - Target: < 1 ticket per week

4. **Resolution Time:**
   - Baseline: Manual investigation required
   - Target: Self-service via troubleshooting guide

## Conclusion

This fix addresses the "Access to run forbidden" error by:

1. **Improving error messages** - Users understand what went wrong
2. **Adding detailed logging** - Developers can debug issues
3. **Enhancing UI feedback** - Clear visual indicators
4. **Providing documentation** - Self-service troubleshooting

The fix is backward compatible and doesn't require database migrations or breaking changes.
