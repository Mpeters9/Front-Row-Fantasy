const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};

const fallbackPlayers = [
    { name: "Josh Allen", position: "QB", team: "BUF", projectedPoints: 25.4, adp: 1 },
    { name: "Patrick Mahomes", position: "QB", team: "KC", projectedPoints: 24.8, adp: 2 },
    { name: "Christian McCaffrey", position: "RB", team: "SF", projectedPoints: 20.5, adp: 3 },
    { name: "Tyreek Hill", position: "WR", team: "MIA", projectedPoints: 19.8, adp: 4 },
    { name: "Justin Jefferson", position: "WR", team: "MIN", projectedPoints: 19.2, adp: 5 },
    { name: "Travis Kelce", position: "TE", team: "KC", projectedPoints: 18.9, adp: 6 },
    { name: "Bijan Robinson", position: "RB", team: "ATL", projectedPoints: 18.5, adp: 7 },
    { name: "CeeDee Lamb", position: "WR", team: "DAL", projectedPoints: 18.3, adp: 8 },
    { name: "Jalen Hurts", position: "QB", team: "PHI", projectedPoints: 23.5, adp: 9 },
    { name: "Saquon Barkley", position: "RB", team: "NYG", projectedPoints: 17.8, adp: 10 },
    { name: "Davante Adams", position: "WR", team: "LV", projectedPoints: 17.5, adp: 11 },
    { name: "Mark Andrews", position: "TE", team: "BAL", projectedPoints: 15.2, adp: 12 },
    { name: "Buffalo Bills", position: "DST", team: "BUF", projectedPoints: 10.5, adp: 50 },
    { name: "Justin Tucker", position: "K", team: "BAL", projectedPoints: 9.8, adp: 60 }
];

let playersData = [];
let isPaused = false;

async function loadPlayers(scoringType) {
    const cacheKey = `players_${scoringType}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        playersData = JSON.parse(cachedData);
        return;
    }

    try {
        const response = await fetch(scoringFiles[scoringType]);
        if (!response.ok) throw new Error('Failed to load player data');
        playersData = await response.json();
        // Validate and filter players
        playersData = playersData.filter(player => 
            player && 
            typeof player.name === 'string' && 
            typeof player.position === 'string' && 
            typeof player.team === 'string' && 
            typeof player.projectedPoints === 'number'
        );
        localStorage.setItem(cacheKey, JSON.stringify(playersData));
    } catch (error) {
        console.error('Error loading players:', error);
        playersData = fallbackPlayers;
        localStorage.setItem(cacheKey, JSON.stringify(playersData));
        alert('Failed to load player data. Using fallback data.');
    }
}

function calculateVORP(players, leagueSize) {
    const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];
    const replacementRanks = {
        QB: leagueSize + 1, // 13th QB for 12-team league
        RB: leagueSize * 2 + 1, // 25th RB
        WR: leagueSize * 2 + 1, // 25th WR
        TE: leagueSize + 1, // 13th TE
        DST: leagueSize + 1, // 13th DST
        K: leagueSize + 1 // 13th K
    };

    const replacementPoints = {};
    positions.forEach(pos => {
        const posPlayers = players.filter(p => p.position === pos).sort((a, b) => b.projectedPoints - a.projectedPoints);
        const replacementPlayer = posPlayers[replacementRanks[pos] - 1] || posPlayers[posPlayers.length - 1];
        replacementPoints[pos] = replacementPlayer ? replacementPlayer.projectedPoints : 0;
    });

    return players.map(player => ({
        ...player,
        vorp: player.projectedPoints - (replacementPoints[player.position] || 0)
    }));
}

function weightedRandomChoice(players, topN = 5) {
    const topPlayers = players.slice(0, Math.min(topN, players.length));
    const weights = topPlayers.map((_, i) => 1 / (i + 1)); // Higher weight for higher-ranked players
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    let r = Math.random();
    for (let i = 0; i < topPlayers.length; i++) {
        r -= normalizedWeights[i];
        if (r <= 0) return topPlayers[i];
    }
    return topPlayers[topPlayers.length - 1];
}

function simulateSnakeDraft(players, leagueSize, draftPick, positionsNeeded, totalPicks) {
    const draftOrder = [];
    const availablePlayers = [...players];
    const rounds = totalPicks;

    for (let round = 1; round <= rounds; round++) {
        const pickNumber = round % 2 === 1
            ? draftPick
            : leagueSize + 1 - draftPick;
        const overallPick = (round - 1) * leagueSize + pickNumber;

        const playersWithVORP = calculateVORP(availablePlayers, leagueSize);
        const eligiblePlayers = playersWithVORP.filter(p => {
            if (positionsNeeded[p.position] && positionsNeeded[p.position] > 0) return true;
            if (p.position === 'QB' && positionsNeeded['SF'] && positionsNeeded['SF'] > 0) return true;
            if (['RB', 'WR', 'TE'].includes(p.position) && positionsNeeded['FLEX'] && positionsNeeded['FLEX'] > 0) return true;
            return false;
        }).sort((a, b) => b.vorp - a.vorp);

        if (eligiblePlayers.length === 0) break;

        const selectedPlayer = weightedRandomChoice(eligiblePlayers);
        draftOrder.push({
            round,
            pick: overallPick,
            name: selectedPlayer.name,
            position: selectedPlayer.position,
            team: selectedPlayer.team,
            projectedPoints: selectedPlayer.projectedPoints,
            vorp: selectedPlayer.vorp
        });

        if (positionsNeeded[selectedPlayer.position] && positionsNeeded[selectedPlayer.position] > 0) {
            positionsNeeded[selectedPlayer.position]--;
        } else if (selectedPlayer.position === 'QB' && positionsNeeded['SF'] && positionsNeeded['SF'] > 0) {
            positionsNeeded['SF']--;
        } else if (['RB', 'WR', 'TE'].includes(selectedPlayer.position) && positionsNeeded['FLEX'] && positionsNeeded['FLEX'] > 0) {
            positionsNeeded['FLEX']--;
        }

        availablePlayers.splice(availablePlayers.findIndex(p => p.name === selectedPlayer.name), 1);
    }

    return draftOrder;
}

async function generateDraftBuild() {
    const leagueSize = parseInt(document.getElementById('leagueSize').value);
    const draftPick = parseInt(document.getElementById('draftPick').value);
    const scoringType = document.getElementById('scoringType').value;
    const benchSize = parseInt(document.getElementById('benchSize').value);
    const preset = document.getElementById('draftLineupPreset').value;

    const positionsNeeded = preset === 'custom' ? {
        QB: parseInt(document.getElementById('draftQbCount').value),
        SF: parseInt(document.getElementById('draftSfCount').value),
        RB: parseInt(document.getElementById('draftRbCount').value),
        WR: parseInt(document.getElementById('draftWrCount').value),
        TE: parseInt(document.getElementById('draftTeCount').value),
        FLEX: parseInt(document.getElementById('draftFlexCount').value),
        DST: parseInt(document.getElementById('draftDstCount').value),
        K: parseInt(document.getElementById('draftKCount').value)
    } : {
        std: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        ppr: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        superflex_redraft: { QB: 1, SF: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        superflex_dynasty: { QB: 1, SF: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DST: 1, K: 1 },
        half: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 2, DST: 1, K: 1 },
        '2qb': { QB: 2, SF: 0, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
        '3wr': { QB: 1, SF: 0, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
        '2te': { QB: 1, SF: 0, RB: 2, WR: 2, TE: 2, FLEX: 1, DST: 1, K: 1 },
        deepflex: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 3, DST: 1, K: 1 }
    }[preset];

    const totalPicks = Object.values(positionsNeeded).reduce((sum, count) => sum + count, 0) + benchSize;

    document.getElementById('loading-spinner').classList.remove('hidden');
    await loadPlayers(scoringType);
    const draftOrder = simulateSnakeDraft(playersData, leagueSize, draftPick, positionsNeeded, totalPicks);
    document.getElementById('loading-spinner').classList.add('hidden');

    const resultDiv = document.getElementById('build-result');
    resultDiv.innerHTML = '<h3 class="text-lg font-semibold text-yellow">Your Draft Build</h3><ul class="list-disc pl-6 mt-2"></ul>';
    const ul = resultDiv.querySelector('ul');
    draftOrder.forEach(player => {
        ul.innerHTML += `<li class="player-pos-${player.position}">${player.round}. ${player.name} (${player.position}, ${player.team}) - ${player.projectedPoints.toFixed(1)} pts (VORP: ${player.vorp.toFixed(1)})</li>`;
    });
}

function updatePlayerTable(players) {
    const tbody = document.getElementById('player-table-body');
    if (!tbody) return; // Skip if table doesn't exist (e.g., on index.html)
    tbody.innerHTML = '';
    const validPlayers = players.filter(player => 
        player && 
        typeof player.name === 'string' && 
        typeof player.position === 'string' && 
        typeof player.team === 'string' && 
        typeof player.projectedPoints === 'number'
    ).slice(0, 10);
    
    validPlayers.forEach(player => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-2">${player.name}</td>
            <td class="p-2 player-pos-${player.position}">${player.position}</td>
            <td class="p-2">${player.projectedPoints.toFixed(1)}</td>
        `;
        tr.addEventListener('click', () => showPlayerPopup(player));
        tbody.appendChild(tr);
    });
}

function showPlayerPopup(player) {
    const popup = document.getElementById('player-popup');
    if (!popup) return; // Skip if popup doesn't exist
    popup.innerHTML = `
        <span class="close-btn">×</span>
        <h3 class="text-lg font-bold">${player.name}</h3>
        <p>Position: <span class="player-pos-${player.position}">${player.position}</span></p>
        <p>Team: ${player.team}</p>
        <p>Projected Points: ${player.projectedPoints.toFixed(1)}</p>
    `;
    popup.classList.remove('hidden');
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.querySelector('.close-btn').addEventListener('click', () => popup.classList.add('hidden'));
}

function updateTicker(players) {
    const tickerContent = document.getElementById('tickerContent');
    if (!tickerContent) return; // Skip if ticker doesn't exist
    tickerContent.innerHTML = '';
    const validPlayers = players.filter(player => 
        player && 
        typeof player.name === 'string' && 
        typeof player.position === 'string' && 
        typeof player.team === 'string' && 
        typeof player.projectedPoints === 'number'
    ).slice(0, 10);
    
    validPlayers.forEach(player => {
        const span = document.createElement('span');
        span.className = `ticker-player player-pos-${player.position}`;
        span.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-team">(${player.team})</span>
            <span class="player-pts">${player.projectedPoints.toFixed(1)} pts</span>
        `;
        tickerContent.appendChild(span);
    });
    tickerContent.style.animation = isPaused ? 'none' : 'marquee 20s linear infinite';
}

document.getElementById('pauseButton')?.addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pauseButton').textContent = isPaused ? 'Resume' : 'Pause';
    document.getElementById('tickerContent').style.animation = isPaused ? 'none' : 'marquee 20s linear infinite';
});

document.getElementById('scoringType')?.addEventListener('change', async () => {
    const scoringType = document.getElementById('scoringType').value;
    document.getElementById('loading-spinner')?.classList.remove('hidden');
    await loadPlayers(scoringType);
    updatePlayerTable(playersData);
    updateTicker(playersData.slice(0, 10));
    document.getElementById('loading-spinner')?.classList.add('hidden');
});

document.getElementById('generateLineup')?.addEventListener('click', generateDraftBuild);

document.getElementById('generateLineupBuild')?.addEventListener('click', () => {
    const preset = document.getElementById('lineupPreset').value;
    const positions = preset === 'custom' ? {
        QB: parseInt(document.getElementById('qbCount').value),
        SF: parseInt(document.getElementById('sfCount').value),
        RB: parseInt(document.getElementById('rbCount').value),
        WR: parseInt(document.getElementById('wrCount').value),
        TE: parseInt(document.getElementById('teCount').value),
        FLEX: parseInt(document.getElementById('flexCount').value),
        DST: parseInt(document.getElementById('dstCount').value),
        K: parseInt(document.getElementById('kCount').value)
    } : {
        std: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        ppr: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        superflex_redraft: { QB: 1, SF: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        superflex_dynasty: { QB: 1, SF: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DST: 1, K: 1 },
        half: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 2, DST: 1, K: 1 },
        '2qb': { QB: 2, SF: 0, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
        '3wr': { QB: 1, SF: 0, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
        '2te': { QB: 1, SF: 0, RB: 2, WR: 2, TE: 2, FLEX: 1, DST: 1, K: 1 },
        deepflex: { QB: 1, SF: 0, RB: 2, WR: 2, TE: 1, FLEX: 3, DST: 1, K: 1 }
    }[preset];

    const resultDiv = document.getElementById('lineup-result');
    const playersCopy = [...playersData];
    const lineup = [];
    
    Object.entries(positions).forEach(([pos, count]) => {
        if (count === 0) return;
        let eligiblePlayers = pos === 'FLEX' 
            ? playersCopy.filter(p => ['RB', 'WR', 'TE'].includes(p.position))
            : pos === 'SF' 
            ? playersCopy.filter(p => p.position === 'QB')
            : playersCopy.filter(p => p.position === pos);
        
        eligiblePlayers = eligiblePlayers.sort((a, b) => b.projectedPoints - a.projectedPoints);
        
        for (let i = 0; i < count && eligiblePlayers.length > 0; i++) {
            const player = eligiblePlayers[0];
            lineup.push(player);
            playersCopy.splice(playersCopy.findIndex(p => p.name === player.name), 1);
            eligiblePlayers = eligiblePlayers.slice(1);
        }
    });

    resultDiv.innerHTML = '<h3 class="text-lg font-semibold text-yellow">Your Lineup Build</h3><ul class="list-disc pl-6 mt-2"></ul>';
    const ul = resultDiv.querySelector('ul');
    lineup.forEach(player => {
        ul.innerHTML += `<li class="player-pos-${player.position}">${player.name} (${player.position}, ${player.team}) - ${player.projectedPoints.toFixed(1)} pts</li>`;
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadPlayers('ppr');
    updatePlayerTable(playersData);
    updateTicker(playersData.slice(0, 10));
});
