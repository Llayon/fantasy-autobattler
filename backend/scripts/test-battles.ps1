$token = "dc6a7f65-ecea-4806-9707-8228077e4944"
$headers = @{"x-guest-token"=$token}

for ($i = 1; $i -le 10; $i++) {
    $result = Invoke-RestMethod -Uri "http://localhost:3004/battle/start" -Method Post -Headers $headers
    $battleId = $result.battleId
    $battle = Invoke-RestMethod -Uri "http://localhost:3004/battle/$battleId" -Method Get -Headers $headers
    
    $dead = @{}
    $bugs = 0
    
    foreach ($e in $battle.events) {
        if ($e.type -eq "death" -and $e.killedUnits) {
            foreach ($u in $e.killedUnits) {
                if (-not $dead.ContainsKey($u)) {
                    $dead[$u] = $e.round
                }
            }
        }
        if (($e.type -eq "attack" -or $e.type -eq "damage" -or $e.type -eq "ability") -and $e.targetId -and $dead.ContainsKey($e.targetId)) {
            $bugs++
            Write-Host "  BUG: Round $($e.round) - $($e.actorId) $($e.type) on dead $($e.targetId)"
        }
    }
    
    Write-Host "Battle $i : $($battle.rounds) rounds, winner=$($battle.winner), bugs=$bugs"
}
