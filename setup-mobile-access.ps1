# Setup Mobile Access - Windows Firewall Configuration
# Run this script as Administrator

Write-Host "=== Fantasy Autobattler - Mobile Access Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Detecting your local IP address..." -ForegroundColor Green

# Get local IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*VPN*" -and $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "Found IP address: $ipAddress" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Could not auto-detect IP address" -ForegroundColor Yellow
    Write-Host "Please run 'ipconfig' manually to find your IP" -ForegroundColor Yellow
    $ipAddress = "192.168.x.x"
}

Write-Host ""
Write-Host "Step 2: Configuring Windows Firewall..." -ForegroundColor Green

# Remove existing rules if they exist
try {
    Remove-NetFirewallRule -DisplayName "Next.js Dev Server" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "NestJS Backend" -ErrorAction SilentlyContinue
} catch {
    # Ignore errors
}

# Add firewall rules
try {
    New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Private,Domain | Out-Null
    Write-Host "Added firewall rule for port 3000 (Frontend)" -ForegroundColor Green
    
    New-NetFirewallRule -DisplayName "NestJS Backend" -Direction Inbound -LocalPort 3004 -Protocol TCP -Action Allow -Profile Private,Domain | Out-Null
    Write-Host "Added firewall rule for port 3004 (Backend)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to add firewall rules" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating .env.local file..." -ForegroundColor Green

$envContent = "# API Configuration for Mobile Access`nNEXT_PUBLIC_API_URL=http://$ipAddress:3004"
$envPath = "frontend\.env.local"

if (Test-Path $envPath) {
    Write-Host "WARNING: .env.local already exists" -ForegroundColor Yellow
    Write-Host "Please update it manually with: NEXT_PUBLIC_API_URL=http://$ipAddress:3004" -ForegroundColor Yellow
} else {
    Set-Content -Path $envPath -Value $envContent
    Write-Host "Created $envPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend:  cd backend && npm run start:dev" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. On your phone, connect to the same Wi-Fi network" -ForegroundColor White
Write-Host "4. Open browser on phone and go to: http://$ipAddress:3000" -ForegroundColor White
Write-Host ""
