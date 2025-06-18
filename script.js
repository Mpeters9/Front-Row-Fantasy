document.addEventListener('DOMContentLoaded', () => {
    // Fantasy Points Ticker
    const tickerContent = document.getElementById('tickerContent');
    const pauseButton = document.getElementById('pauseButton');

    async function fetchFantasyPoints() {
        try {
            const mockData = [
                { position: 'QB', name: 'Josh Allen', team: 'BUF', points: 25.4 },
                { position: 'QB', name: 'Patrick Mahomes', team: 'KC', points: 25.1 },
                { position: 'QB', name: 'Lamar Jackson', team: 'BAL', points: 23.8 },
                { position: 'QB', name: 'Jalen Hurts', team: 'PHI', points: 22.3 },
                { position: 'QB', name: 'Joe Burrow', team: 'CIN', points: 21.6 },
                { position: 'WR', name: 'Davante Adams', team: 'LV', points: 20.9 },
                { position: 'RB', name: 'Christian McCaffrey', team: 'SF', points: 20.5 },
                { position: 'QB', name: 'Kyler Murray', team: 'ARI', points: 20.4 },
                { position: 'QB', name: 'Dak Prescott', team: 'DAL', points: 20.1 },
                { position: 'WR', name: 'Tyreek Hill', team: 'MIA', points: 19.8 },
                { position: 'RB', name: 'Austin Ekeler', team: 'LAC', points: 19.5 },
                { position: 'WR', name: 'Justin Jefferson', team: 'MIN', points: 19.2 },
                { position: 'TE', name: 'Travis Kelce', team: 'KC', points: 18.9 },
                { position: 'RB', name: 'Alvin Kamara', team: 'NO', points: 18.6 },
                { position: 'WR', name: 'Stefon Diggs', team: 'BUF', points: 18.3 },
                { position: 'QB', name: 'Russell Wilson', team: 'DEN', points: 18.0 },
                { position: 'RB', name: 'Nick Chubb', team: 'CLE', points: 17.7 },
                { position: 'WR', name: 'Cooper Kupp', team: 'LA', points: 17.4 },
                { position: 'TE', name: 'George Kittle', team: 'SF', points: 17.1 },
                { position: 'RB', name: 'Saquon Barkley', team: 'NYG', points: 16.8 },
                { position: 'WR', name: 'Ja’Marr Chase', team: 'CIN', points: 16.5 },
                { position: 'QB', name: 'Justin Herbert', team: 'LAC', points: 16.2 },
                { position: 'RB', name: 'Jonathan Taylor', team: 'IND', points: 15.9 },
                { position: 'WR', name: 'Deebo Samuel', team: 'SF', points: 15.6 },
                { position: 'TE', name: 'Dallas Goedert', team: 'PHI', points: 15.3 },
                { position: 'QB', name: 'Trevor Lawrence', team: 'JAX', points: 15.0 },
                { position: 'RB', name: 'Derrick Henry', team: 'TEN', points: 14.7 },
                { position: 'WR', name: 'A.J. Brown', team: 'PHI', points: 14.4 },
                { position: 'TE', name: 'T.J. Hockenson', team: 'MIN', points: 14.1 },
                { position: 'RB', name: 'Joe Mixon', team: 'CIN', points: 13.8 },
                { position: 'WR', name: 'CeeDee Lamb', team: 'DAL', points: 13.5 },
                { position: 'QB', name: 'Deshaun Watson', team: 'CLE', points: 13.2 },
                { position: 'RB', name: 'Aaron Jones', team: 'GB', points: 12.9 },
                { position: 'WR', name: 'Terry McLaurin', team: 'WAS', points: 12.6 },
                { position: 'TE', name: 'Mark Andrews', team: 'BAL', points: 12.3 }
            ];
            tickerContent.innerHTML = mockData.map(player => `<span>${player.position}: ${player.name} (${player.team}) - ${player.points} pts</span>`).join('');
        } catch (error) {
            console.error('Error fetching fantasy points:', error);
            tickerContent.innerHTML = '<span>Failed to load fantasy points data</span>';
        }
    }

    pauseButton.addEventListener('click', () => {
        const isPaused = tickerContent.classList.toggle('paused');
        pauseButton.textContent = isPaused ? 'Play' : 'Pause';
    });

    setInterval(fetchFantasyPoints, 30000);
    fetchFantasyPoints();

    // Trade Analyzer
    const leagueIdInput = document.getElementById('leagueId');
    const syncLeagueBtn = document.getElementById('syncLeague');
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    const analyzeTradeBtn = document.getElementById('analyzeTradeBtn');
    const tradeResult = document.getElementById('tradeResult');
    const recentTrades = document.getElementById('recentTrades');
    const leagueTypeSelect = document.getElementById('leagueType');
    const scoringSelect = document.getElementById('scoring');
    const positionValueSelect = document.getElementById('positionValue');
    const platformSelect = document.getElementById('platform');

    const mockPlayers = [
        { id: '1', name: 'Christian McCaffrey', position: 'RB', redraftValue: 25, dynastyValue: 30 },
        { id: '2', name: 'De’Von Achane', position: 'RB', redraftValue: 18, dynastyValue: 22 },
        { id: '3', name: 'Nico Collins', position: 'WR', redraftValue: 15, dynastyValue: 18 },
        { id: '4', name: 'Ashton Jeanty', position: 'RB', redraftValue: 12, dynastyValue: 20 },
        { id: '5', name: 'Drake London', position: 'WR', redraftValue: 14, dynastyValue: 17 }
    ];

    async function fetchPlayers(platform) {
        if (platform === 'sleeper') {
            try {
                const response = await fetch('https://api.sleeper.app/v1/players/nfl');
                if (!response.ok) throw new Error('Sleeper API request failed');
                const data = await response.json();
                return Object.values(data).filter(player => player.fantasy_positions && player.team).slice(0, 50);
            } catch (error) {
                console.error('Error fetching Sleeper players:', error);
                tradeResult.textContent = 'Failed to fetch players. Using mock data.';
                return mockPlayers;
            }
        } else {
            tradeResult.textContent = `Player data for ${platform} not yet implemented. Using mock data.`;
            return mockPlayers;
        }
    }

    async function fetchADP(leagueType, teams = 12) {
        const apikey = 'FKDTXMJ98XB49TAS6M33';
        const format = leagueType === 'dynasty' ? 'dynasty' : scoringSelect.value || 'standard';
        const url = `https://api.fantasynerds.com/v1/nfl/adp?apikey=${apikey}&teams=${teams}&format=${format}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fantasy Nerds API request failed');
            const data = await response.json();
            return data.players || [];
        } catch (error) {
            console.error('Error fetching ADP:', error);
            tradeResult.textContent = 'Failed to fetch ADP data. Using mock values.';
            return mockPlayers.map(p => ({ name: p.name, redraftValue: p.redraftValue, dynastyValue: p.dynastyValue }));
        }
    }

    async function fetchTransactions(leagueId, platform) {
        if (platform === 'sleeper') {
            try {
                const url = `https://api.sleeper.app/v1/league/${leagueId}/transactions/1`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Sleeper transaction API request failed');
                const data = await response.json();
                return data.filter(tx => tx.type === 'trade').slice(0, 5);
            } catch (error) {
                console.error('Error fetching Sleeper transactions:', error);
                tradeResult.textContent = 'Failed to fetch transactions. Check league ID or API access.';
                return [];
            }
        } else {
            return [];
        }
    }

    async function populatePlayers(platform) {
        const players = await fetchPlayers(platform);
        const adpData = await fetchADP(leagueTypeSelect.value);
        const options = players.map(player => {
            const adp = adpData.find(p => p.name === (player.full_name || player.name)) || { redraftValue: 10, dynastyValue: 10 };
            return `<option value="${player.player_id || player.id}" data-position="${player.fantasy_positions ? player.fantasy_positions[0] : player.position}" data-redraft="${adp.redraftValue || 10}" data-dynasty="${adp.dynastyValue || 10}">${player.full_name || player.name} (${player.fantasy_positions ? player.fantasy_positions[0] : player.position})</option>`;
        }).join('');
        team1Select.innerHTML = '<option value="">Select Player 1</option>' + options;
        team2Select.innerHTML = '<option value="">Select Player 2</option>' + options;
    }

    async function displayRecentTrades(leagueId, platform) {
        const transactions = await fetchTransactions(leagueId, platform);
        recentTrades.innerHTML = transactions.length ? transactions.map(tx => {
            const players = Object.entries(tx.adds || {}).map(([playerId]) => {
                const player = mockPlayers.find(p => p.id === playerId) || { name: 'Unknown Player' };
                return player.name;
            }).join(', ');
            return `<p class="mt-2">Trade: ${players} exchanged between rosters ${tx.roster_ids.join(' and ')}</p>`;
        }).join('') : '<p>No recent trades found.</p>';
    }

    function getPlayerValue(playerId, leagueType, scoring, positionValue) {
        const option = team1Select.querySelector(`option[value="${playerId}"]`) || team2Select.querySelector(`option[value="${playerId}"]`);
        if (!option) return 0;
        let baseValue = leagueType === 'dynasty' ? parseFloat(option.dataset.dynasty) : parseFloat(option.dataset.redraft);
        let scoringModifier = scoring === 'ppr' ? 1.2 : scoring === 'halfppr' ? 1.1 : 1;
        let positionModifier = 1;
        if (positionValue === 'qbBoost' && option.dataset.position === 'QB') positionModifier = 1.3;
        if (positionValue === 'teBoost' && option.dataset.position === 'TE') positionModifier = 1.5;
        return Math.round(baseValue * scoringModifier * positionModifier);
    }

    syncLeagueBtn.addEventListener('click', async () => {
        const leagueId = leagueIdInput.value;
        const platform = platformSelect.value;
        if (platform === 'sleeper' && leagueId) {
            tradeResult.textContent = 'Syncing league...';
            await populatePlayers(platform);
            await displayRecentTrades(leagueId, platform);
            tradeResult.textContent = 'League synced successfully.';
        } else if (platform !== 'sleeper') {
            tradeResult.textContent = 'Only Sleeper platform is supported at this time.';
        } else {
            tradeResult.textContent = 'Please enter a valid League ID.';
        }
    });

    analyzeTradeBtn.addEventListener('click', () => {
        const player1Id = team1Select.value;
        const player2Id = team2Select.value;
        const leagueType = leagueTypeSelect.value;
        const scoring = scoringSelect.value;
        const positionValue = positionValue
