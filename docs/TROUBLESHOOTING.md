# Troubleshooting Guide

## Common Issues and Solutions

### "Доступ к забегу запрещен" (Access to Run Forbidden)

**Symptoms:**
- Error message: "Доступ к забегу запрещен" or "Access denied"
- Occurs when trying to access a roguelike run or draft
- Shows lock icon (🔒) on error screen

**Cause:**
This error occurs when the guest authentication token doesn't match the run's owner. Common scenarios:

1. **Browser localStorage cleared** - Guest token was deleted
2. **Different browser/device** - Trying to access run from another device
3. **Incognito/Private mode** - Token not persisted between sessions
4. **Multiple browser tabs** - Token regenerated in one tab

**Solution:**

For Users:
- Use the same browser and device where you created the run
- Don't clear browser data (localStorage) during active runs
- Avoid incognito/private browsing mode for roguelike runs
- Complete runs before switching browsers

For Developers:
- Guest tokens are stored in `localStorage` under key `guestToken`
- Each guest token is tied to a specific player ID
- Runs are owned by the player ID that created them
- Access control is enforced at the service layer

**Prevention:**
```typescript
// Check if user has valid token before creating run
if (!api.hasToken()) {
  await api.createGuest();
}

// Always use the same token for the entire run lifecycle
const run = await api.createRoguelikeRun(faction, leaderId);
```

### Draft Not Available

**Symptoms:**
- Error message: "Драфт недоступен" (Draft not available)
- Redirects to battle page
- No draft options shown

**Cause:**
Draft is only available at specific times:

1. **Initial Draft** - Only at run start (hand AND field empty)
2. **Post-Battle Draft** - Only after completing a battle
3. **Deck Empty** - No more cards to draft

**Solution:**
- Initial draft: Available immediately after creating run
- Post-battle draft: Complete a battle first
- If deck is empty: All 12 cards are already in your hand/field

**Check Draft Status:**
```typescript
const status = await api.getRoguelikeDraftStatus(runId);
if (status.available) {
  // Draft is available
  const draft = await api.getRoguelikeDraft(runId);
} else {
  // Draft not available - proceed to battle
  router.push(`/run/${runId}/battle`);
}
```

### Network Errors

**Symptoms:**
- Error message: "Ошибка сети" (Network error)
- Cannot connect to backend
- Timeout errors

**Cause:**
- Backend server not running
- Wrong API URL configuration
- Network connectivity issues
- CORS configuration issues

**Solution:**

1. **Check Backend Status:**
```bash
# Backend should be running on port 3004
curl http://localhost:3004/health
```

2. **Check API URL Configuration:**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3004
```

3. **For Mobile Access:**
```bash
# Use your computer's IP address
NEXT_PUBLIC_API_URL=http://192.168.1.100:3004
```

4. **Check CORS Settings:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'http://192.168.1.100:3000'],
  credentials: true,
});
```

### Run Not Found

**Symptoms:**
- Error message: "Забег не найден" (Run not found)
- 404 status code
- Question mark icon (❓) on error screen

**Cause:**
- Invalid run ID in URL
- Run was deleted/abandoned
- Database was reset

**Solution:**
- Create a new run from the main menu
- Check that the run ID in the URL is correct
- Verify database contains the run

### Insufficient Gold

**Symptoms:**
- Error message: "Недостаточно золота" (Insufficient gold)
- Cannot place units or upgrade

**Cause:**
- Trying to place unit without enough gold
- Trying to upgrade without enough gold

**Solution:**
- Unit placement costs: 3-8 gold (depends on unit)
- Upgrade costs: T1→T2 = 3g, T2→T3 = 5g
- Remove units from field to refund gold
- Win battles to earn more gold

**Gold Economy:**
- Starting gold: 10g
- Win reward: 5g + 2g per consecutive win
- Loss reward: 3g
- Max consecutive win bonus: 10g (5 wins)

## Debugging Tips

### Enable Debug Logging

**Backend:**
```typescript
// Set LOG_LEVEL in .env
LOG_LEVEL=debug
```

**Frontend:**
```typescript
// Check browser console for API errors
// Look for red error messages
// Check Network tab for failed requests
```

### Check Authentication

```typescript
// In browser console
localStorage.getItem('guestToken')
// Should return a UUID string

// If null, create new guest
await api.createGuest()
```

### Inspect Run State

```typescript
// In browser console
const run = await api.getRoguelikeRun('run-id');
console.log({
  playerId: run.playerId,
  hand: run.hand.length,
  field: run.field.length,
  remainingDeck: run.remainingDeck.length,
  gold: run.gold,
  wins: run.wins,
  losses: run.losses,
  status: run.status,
});
```

### Check Draft Availability

```typescript
// In browser console
const status = await api.getRoguelikeDraftStatus('run-id');
console.log(status);
// { available: true/false, isInitial: true/false, reason?: string }
```

## Getting Help

If you encounter an issue not covered here:

1. **Check Browser Console** - Look for error messages
2. **Check Backend Logs** - Look for error/warn messages
3. **Check Network Tab** - Look for failed API requests
4. **Verify Configuration** - Check .env files
5. **Create GitHub Issue** - Include error messages and steps to reproduce

### Information to Include in Bug Reports

- Error message (exact text)
- Steps to reproduce
- Browser and version
- Backend logs (if available)
- Network request details (status code, response)
- Run ID (if applicable)
- Player ID (if applicable)

## Related Documentation

- [Game Design Document](./GAME_DESIGN_DOCUMENT.md) - Game mechanics
- [Roguelike Design](./ROGUELIKE_DESIGN.md) - Roguelike mode details
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Engineering Guide](./ENGINEERING_GUIDE.md) - Development standards
