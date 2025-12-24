# Mobile Access Guide

> Access the development server from mobile devices on your local network.

## Quick Start

### 1. Configure Firewall (Required)

Open PowerShell as Administrator and run:

```powershell
# Allow port 3000 (Frontend)
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow port 3004 (Backend)
New-NetFirewallRule -DisplayName "NestJS Backend" -Direction Inbound -LocalPort 3004 -Protocol TCP -Action Allow
```

### 2. Find Your IP Address

```bash
ipconfig
```

Look for `IPv4 Address` under your Wi-Fi adapter (e.g., `192.168.68.107`).

### 3. Configure Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://YOUR_IP:3004
```

Replace `YOUR_IP` with your actual IP address.

### 4. Start Servers

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Connect from Phone

1. Connect phone to the same Wi-Fi network
2. Open browser on phone
3. Navigate to: `http://YOUR_IP:3000`

---

## Verification

### Check servers are listening:
```bash
netstat -an | findstr "3000 3004"
```

Expected output:
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING
TCP    0.0.0.0:3004    0.0.0.0:0    LISTENING
```

### Test from phone:
- API Docs: `http://YOUR_IP:3004/api/docs`
- Game: `http://YOUR_IP:3000`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect | Check both devices on same Wi-Fi |
| API unavailable | Verify `.env.local` IP matches yours |
| CORS error | Restart backend server |
| Blocked by antivirus | Add exceptions for ports 3000, 3004 |

---

## Revert to Localhost

To work locally only:

```bash
# Edit frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:3004
```

Or delete `frontend/.env.local` entirely.

---

## Technical Details

### Changes Made

| File | Change |
|------|--------|
| `frontend/package.json` | Added `-H 0.0.0.0` flag |
| `backend/src/main.ts` | Listen on `0.0.0.0:3004` |
| `backend/src/main.ts` | CORS `origin: true` |
| `frontend/src/lib/api.ts` | Support `NEXT_PUBLIC_API_URL` |

### Security Warning

⚠️ These settings are for **development only**:
- Don't use `origin: true` in production
- Don't expose ports on public networks
- Use only on trusted Wi-Fi networks

---

## Automation Script

Run `setup-mobile-access.ps1` to automate firewall configuration:

```powershell
.\setup-mobile-access.ps1
```

---

*For detailed setup, see the original files in `docs/archive/` (if needed).*
