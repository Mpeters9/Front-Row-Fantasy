document.addEventListener('DOMContentLoaded', () => {
    // Fantasy Points Ticker
    const tickerContent = document.getElementById('tickerContent');
    const pauseButton = document.getElementById('pauseButton');

    function populateTicker() {
        const mockData = [
            { position: 'Quarterback', name: 'Josh Allen', team: 'BUF', points: 25.4 },
            { position: 'Quarterback', name: 'Patrick Mahomes', team: 'KC', points: 25.1 },
            { position: 'Quarterback', name: 'Lamar Jackson', team: 'BAL', points: 23.8 },
            { position: 'Quarterback', name: 'Jalen Hurts', team: 'PHI', points: 22.3 },
            { position: 'Quarterback', name: 'Joe Burrow', team: 'CIN', points: 21.6 },
            { position: 'Running Back', name: 'Christian McCaffrey', team: 'SF', points: 20.5 },
            { position: 'Running Back', name: 'Austin Ekeler', team: 'LAC', points: 19.5 },
            { position: 'Running Back', name: 'Alvin Kamara', team: 'NO', points: 18.6 },
            { position: 'Running Back', name: 'Nick Chubb', team: 'CLE', points: 17.7 },
            { position: 'Running Back', name: 'Saquon Barkley', team: 'NYG', points: 16.8 },
            { position: 'Wide Receiver', name: 'Davante Adams', team: 'LV', points: 20.9 },
            { position: 'Wide Receiver', name: 'Tyreek Hill', team: 'MIA', points: 19.8 },
            { position: 'Wide Receiver', name: 'Justin Jefferson', team: 'MIN', points: 19.2 },
            { position: 'Wide Receiver', name: 'Stefon Diggs', team: 'BUF', points: 18.3 },
            { position: 'Wide Receiver', name: 'Cooper Kupp', team: 'LA', points: 17.4 },
            { position: 'Wide Receiver', name: 'Ja’Marr Chase', team: 'CIN', points: 16.5 },
            { position: 'Wide Receiver', name: 'Deebo Samuel', team: 'SF', points: 15.6 },
            { position: 'Tight End', name: 'Travis Kelce', team: 'KC', points: 18.9 },
            { position: 'Tight End', name: 'George Kittle', team: 'SF', points: 17.1 },
            { position: 'Tight End', name: 'Dallas Goedert', team: 'PHI', points: 15.3 }
        ];

        // Sort by position and then by points descending
        const sortedData = mockData.sort((a, b) => {
            const positionOrder = { Quarterback: 1, 'Running Back': 2, 'Wide Receiver': 3, 'Tight End': 4 };
            if (positionOrder[a.position] !== positionOrder[b.position]) {
                return positionOrder[a.position] - positionOrder[b.position];
            }
            return b.points - a.points;
        });

        // Group by position and format as a single continuous line with bolded positions
        let content = '';
        let currentPosition = null;
        sortedData.forEach((player, index) => {
            if (player.position !== currentPosition) {
                if (currentPosition !== null) content += ' ';
                content += `<b>${player.position}:</b> `;
                currentPosition = player.position;
            } else {
                content += ' ';
            }
            content += `${player.name} (${player.team}) - ${player.points} pts`;
        });

        tickerContent.innerHTML = content;
        if (getComputedStyle(tickerContent).animationPlayState === 'paused') {
            console.log('Ticker animation is paused or not applied');
        }
    }

    pauseButton.addEventListener('click', () => {
        const isPaused = tickerContent.classList.toggle('paused');
        pauseButton.textContent = isPaused ? 'Play' : 'Pause';
    });

    setInterval(populateTicker, 30000);
    populateTicker();

    // Trade Analyzer
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    const analyzeTradeBtn = document.getElementById('analyzeTradeBtn');
    const tradeResult = document.getElementById('tradeResult');
    const recentTrades = document.getElementById('recentTrades');
    const leagueTypeSelect = document.getElementById('leagueType');
    const scoringSelect = document.getElementById('scoring');
    const positionValueSelect = document.getElementById('positionValue');
    const platformSelect = document.getElementById('platform');

    async function fetchPlayers() {
        try {
            const response = await fetch('https://api.sleeper.app/v1/players/nfl');
            if (!response.ok) throw new Error('Sleeper API request failed');
            const data = await response.json();
            // Filter for active offensive players and kickers, exclude Defense/ST
            return Object.values(data)
                .filter(player => player.active && player.fantasy_positions && 
                    ['QB', 'RB', 'WR', 'TE', 'K'].includes(player.fantasy_positions[0]))
                .map(player => ({
                    id: player.player_id,
                    name: player.full_name || player.name,
                    position: player.fantasy_positions[0] === 'QB' ? 'Quarterback' :
                            player.fantasy_positions[0] === 'RB' ? 'Running Back' :
                            player.fantasy_positions[0] === 'WR' ? 'Wide Receiver' :
                            player.fantasy_positions[0] === 'TE' ? 'Tight End' : 'Kicker'
                }));
        } catch (error) {
            console.error('Error fetching players:', error);
            tradeResult.textContent = 'Failed to fetch players. Using mock data.';
            return [
                { id: '1', name: 'Josh Allen', position: 'Quarterback' },
                { id: '2', name: 'Christian McCaffrey', position: 'Running Back' },
                { id: '3', name: 'Tyreek Hill', position: 'Wide Receiver' },
                { id: '4', name: 'Travis Kelce', position: 'Tight End' },
                { id: '5', name: 'Justin Tucker', position: 'Kicker' }
            ];
        }
    }

    async function fetchADP() {
        const apikey = 'FKDTXMJ98XB49TAS6M33';
        const url = `https://api.fantasynerds.com/v1/nfl/adp?apikey=${apikey}&teams=12&format=standard`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fantasy Nerds API request failed');
            const data = await response.json();
            return data.players || [];
        } catch (error) {
            console.error('Error fetching ADP:', error);
            tradeResult.textContent = 'Failed to fetch ADP data. Using default order.';
            return [];
        }
    }

    async function populatePlayers() {
        const players = await fetchPlayers();
        const adpData = await fetchADP();
        // Sort players by ADP within position groups
        const positionGroups = {
            'Quarterback': [], 'Running Back': [], 'Wide Receiver': [], 'Tight End': [], 'Kicker': []
        };
        players.forEach(player => {
            const adp = adpData.find(p => p.name === player.name);
            positionGroups[player.position].push({ ...player, adpRank: adp ? adp.adp : Infinity });
        });
        // Sort each group by ADP (lower is better)
        Object.keys(positionGroups).forEach(position => {
            positionGroups[position].sort((a, b) => a.adpRank - b.adpRank);
        });

        let options = '';
        Object.keys(positionGroups).forEach(position => {
            if (positionGroups[position].length) {
                options += `<optgroup label="${position}">`;
                positionGroups[position].forEach(player => {
                    options += `<option value="${player.id}" data-position="${player.position}">${player.name}</option>`;
                });
                options += '</optgroup>';
            }
        });
        team1Select.innerHTML = '<option value="">Select Player 1</option>' + options;
        team2Select.innerHTML = '<option value="">Select Player 2</option>' + options;
    }

    function getPlayerValue(playerId, leagueType, scoring, positionValue) {
        const option = team1Select.querySelector(`option[value="${playerId}"]`) || team2Select.querySelector(`option[value="${playerId}"]`);
        if (!option) return 0;
        let baseValue = 10; // Default value since ADP data might not provide exact values
        let scoringModifier = scoring === 'ppr' ? 1.2 : scoring === 'halfppr' ? 1.1 : 1;
        let positionModifier = 1;
        if (positionValue === 'qbBoost' && option.dataset.position === 'Quarterback') positionModifier = 1.3;
        if (positionValue === 'teBoost' && option.dataset.position === 'Tight End') positionModifier = 1.5;
        return Math.round(baseValue * scoringModifier * positionModifier);
    }

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

    // Remove syncLeagueBtn and leagueIdInput related logic
    document.getElementById('syncLeague').remove();
    document.getElementById('leagueId').remove();

    populatePlayers();

    // Matchup Predictor
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
