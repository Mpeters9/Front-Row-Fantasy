document.addEventListener('DOMContentLoaded', () => {
    // Fantasy Points Ticker
    const tickerContent = document.getElementById('tickerContent');
    const pauseButton = document.getElementById('pauseButton');

    async function fetchFantasyPoints() {
        try {
            const response = await fetch('https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=10');
            const data = await response.json();
            if (data && Array.isArray(data) && data.length) {
                const validItems = data.filter(item => item.position && item.first_name && item.last_name && item.add_count);
                if (validItems.length) {
                    tickerContent.innerHTML = validItems.map(item => `<span>${item.position}: ${item.first_name} ${item.last_name} - ${item.add_count} adds</span>`).join('') || '<span>No valid data</span>';
                } else {
                    tickerContent.innerHTML = '<span>No valid trending data</span>';
                }
            } else {
                tickerContent.innerHTML = '<span>No trending data available</span>';
            }
        } catch (error) {
            console.error('Error fetching fantasy points:', error);
            tickerContent.innerHTML = '<span>Failed to load fantasy points data</span>';
        }
        // Ensure scrolling with fallback content
        if (!tickerContent.innerHTML.includes('adds')) {
            tickerContent.innerHTML += '<span> - Check back later for updates...</span>';
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

    // Mock data for players (fallback)
    const mockPlayers = [
        { id: '1', name: 'Christian McCaffrey', position: 'RB', redraftValue: 25, dynastyValue: 30 },
        { id: '2', name: 'De’Von Achane', position: 'RB', redraftValue: 18, dynastyValue: 22 },
        { id: '3', name: 'Nico Collins', position: 'WR', redraftValue: 15, dynastyValue: 18 },
        { id: '4', name: 'Ashton Jeanty', position: 'RB', redraftValue: 12, dynastyValue: 20 },
        { id: '5', name: 'Drake London', position: 'WR', redraftValue: 14, dynastyValue: 17 }
    ];

    async function fetchPlayers() {
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

    async function fetchTransactions(leagueId) {
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
    }

    async function populatePlayers() {
        const players = await fetchPlayers();
        const adpData = await fetchADP(leagueTypeSelect.value);
        const options = players.map(player => {
            const adp = adpData.find(p => p.name === (player.full_name || player.name)) || { redraftValue: 10, dynastyValue: 10 };
            return `<option value="${player.player_id || player.id}" data-position="${player.fantasy_positions ? player.fantasy_positions[0] : player.position}" data-redraft="${adp.redraftValue || 10}" data-dynasty="${adp.dynastyValue || 10}">${player.full_name || player.name} (${player.fantasy_positions ? player.fantasy_positions[0] : player.position})</option>`;
        }).join('');
        team1Select.innerHTML = '<option value="">Select Player 1</option>' + options;
        team2Select.innerHTML = '<option value="">Select Player 2</option>' + options;
    }

    async function displayRecentTrades(leagueId) {
        const transactions = await fetchTransactions(leagueId);
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
        if (leagueId) {
            tradeResult.textContent = 'Syncing league...';
            await populatePlayers();
            await displayRecentTrades(leagueId);
            tradeResult.textContent = 'League synced successfully.';
        } else {
            tradeResult.textContent = 'Please enter a valid League ID.';
        }
    });

    analyzeTradeBtn.addEventListener('click', () => {
        const player1Id = team1Select.value;
        const player2Id = team2Select.value;
        const leagueType = leagueTypeSelect.value;
        const scoring = scoringSelect.value;
        const positionValue = positionValueSelect.value;

        if (player1Id && player2Id && player1Id !== player2Id) {
            const value1 = getPlayerValue(player1Id, leagueType, scoring, positionValue);
            const value2 = getPlayerValue(player2Id, leagueType, scoring, positionValue);
            const player1Name = team1Select.options[team1Select.selectedIndex].text;
            const player2Name = team2Select.options[team2Select.selectedIndex].text;
            if (value1 > value2) {
                tradeResult.textContent = `${player1Name} is valued higher (${value1} vs ${value2}). Consider this trade if you need ${player2Name}'s position or future potential.`;
            } else if (value2 > value1) {
                tradeResult.textContent = `${player2Name} is valued higher (${value2} vs ${value1}). Consider this trade if you need ${player1Name}'s position or future potential.`;
            } else {
                tradeResult.textContent = 'The trade is balanced in value. Evaluate based on team needs.';
            }
        } else {
            tradeResult.textContent = 'Please select two different players.';
        }
    });

    leagueTypeSelect.addEventListener('change', () => analyzeTradeBtn.click());
    scoringSelect.addEventListener('change', () => analyzeTradeBtn.click());
    positionValueSelect.addEventListener('change', () => analyzeTradeBtn.click());

    // Matchup Predictor (Placeholder)
    const matchupTeam1Select = document.getElementById('matchupTeam1Select');
    const matchupTeam2Select = document.getElementById('matchupTeam2Select');
    const predictMatchupBtn = document.getElementById('predictMatchupBtn');
    const predictionResult = document.getElementById('predictionResult');

    async function fetchMatchupTeams() {
        try {
            const response = await fetch('https://api.sleeper.app/v1/league/1180205990138392576/rosters');
            if (!response.ok) throw new Error('Matchup teams API request failed');
            const data = await response.json();
            if (data && data.length) {
                matchupTeam1Select.innerHTML = '<option value="">Select Team 1</option>' + data.map(team => `<option value="${team.roster_id}">${team.owner_id}</option>`).join('');
                matchupTeam2Select.innerHTML = '<option value="">Select Team 2</option>' + data.map(team => `<option value="${team.roster_id}">${team.owner_id}</option>`).join('');
            }
        } catch (error) {
            console.error('Error fetching matchup teams:', error);
            matchupTeam1Select.innerHTML = '<option value="">Error loading teams</option>';
            matchupTeam2Select.innerHTML = '<option value="">Error loading teams</option>';
        }
    }

    predictMatchupBtn.addEventListener('click', async () => {
        const team1 = matchupTeam1Select.value;
        const team2 = matchupTeam2Select.value;
        if (team1 && team2 && team1 !== team2) {
            predictionResult.textContent = 'Prediction not available (placeholder).';
        } else {
            predictionResult.textContent = 'Please select two different teams.';
        }
    });

    fetchMatchupTeams();

    // Dark mode toggle
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark');
    };
});
