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
            { position: 'Wide Receiver', name: 'JaMarr Chase', team: 'CIN', points: 16.5 },
            { position: 'Wide Receiver', name: 'Deebo Samuel', team: 'SF', points: 15.6 },
            { position: 'Tight End', name: 'Travis Kelce', team: 'KC', points: 18.9 },
            { position: 'Tight End', name: 'George Kittle', team: 'SF', points: 17.1 },
            { position: 'Tight End', name: 'Dallas Goedert', team: 'PHI', points: 15.3 },
            { position: 'Kicker', name: 'Justin Tucker', team: 'BAL', points: 14.5 },
            { position: 'Kicker', name: 'Harrison Butker', team: 'KC', points: 13.8 },
            { position: 'Kicker', name: 'Evan McPherson', team: 'CIN', points: 13.2 }
        ];

        const sortedData = mockData.sort((a, b) => {
            const positionOrder = { "Quarterback": 1, "Running Back": 2, "Wide Receiver": 3, "Tight End": 4, "Kicker": 5 };
            if (positionOrder[a.position] !== positionOrder[b.position]) {
                return positionOrder[a.position] - positionOrder[b.position];
            }
            return b.points - a.points;
        });

        let content = '';
        let currentPosition = null;
        sortedData.forEach((player, index) => {
            if (player.position !== currentPosition) {
                if (currentPosition !== null) content += ' | ';
                content += `<b>${player.position}:</b> `;
                currentPosition = player.position;
            } else {
                content += ' | ';
            }
            content += `${player.name} (${player.team}) - ${player.points} pts`;
        });

        tickerContent.innerHTML = content + ' | ' + content; // Duplicate for seamless loop
        tickerContent.classList.remove('loading');
    }

    pauseButton.addEventListener('click', () => {
        const isPaused = tickerContent.classList.toggle('paused');
        pauseButton.textContent = isPaused ? 'Play' : 'Pause';
    });

    setInterval(populateTicker, 30000);
    populateTicker();

    // Trade Analyzer
    const team1Selects = ['team1-1', 'team1-2', 'team1-3', 'team1-4'].map(id => document.getElementById(id));
    const team2Selects = ['team2-1', 'team2-2', 'team2-3', 'team2-4'].map(id => document.getElementById(id));
    const analyzeTradeBtn = document.getElementById('analyzeTradeBtn');
    const tradeResult = document.getElementById('tradeResult');
    const recentTrades = document.getElementById('recentTrades');
    const leagueTypeSelect = document.getElementById('leagueType');
    const rosterTypeSelect = document.getElementById('rosterType');
    const platformSelect = document.getElementById('platform');
    const leagueIdInput = document.getElementById('leagueId');
    const syncLeagueBtn = document.getElementById('syncLeague');
    const playerInputs = [
        ...['player1-1', 'player1-2', 'player1-3', 'player1-4'].map(id => document.getElementById(id)),
        ...['player2-1', 'player2-2', 'player2-3', 'player2-4'].map(id => document.getElementById(id))
    ];

    let allPlayers = [
        { id: '1', name: 'Josh Allen', position: 'Quarterback', adp: 5.2 },
        { id: '2', name: 'Patrick Mahomes', position: 'Quarterback', adp: 6.1 },
        { id: '3', name: 'Lamar Jackson', position: 'Quarterback', adp: 7.8 },
        { id: '4', name: 'Christian McCaffrey', position: 'Running Back', adp: 1.5 },
        { id: '5', name: 'Austin Ekeler', position: 'Running Back', adp: 12.3 },
        { id: '6', name: 'Alvin Kamara', position: 'Running Back', adp: 15.6 },
        { id: '7', name: 'Tyreek Hill', position: 'Wide Receiver', adp: 3.4 },
        { id: '8', name: 'Davante Adams', position: 'Wide Receiver', adp: 8.9 },
        { id: '9', name: 'Justin Jefferson', position: 'Wide Receiver', adp: 2.7 },
        { id: '10', name: 'Travis Kelce', position: 'Tight End', adp: 10.2 },
        { id: '11', name: 'George Kittle', position: 'Tight End', adp: 18.5 },
        { id: '12', name: 'Darren Waller', position: 'Tight End', adp: 22.1 },
        { id: '13', name: 'Justin Tucker', position: 'Kicker', adp: 50.3 },
        { id: '14', name: 'Harrison Butker', position: 'Kicker', adp: 55.7 },
        { id: '15', name: 'Evan McPherson', position: 'Kicker', adp: 60.4 }
    ];

    function setupAutocomplete() {
        const debouncedFilter = debounce((input, dropdownId, select) => filterPlayers(input.value, dropdownId, input, select), 300);

        playerInputs.forEach(input => {
            const dropdownId = `dropdown-${input.id}`;
            const selectId = input.id.replace('player', 'team');
            const select = document.getElementById(selectId);
            if (!select) {
                console.error(`Select element with ID ${selectId} not found for input ${input.id}`);
                return;
            }
            const wrapper = input.parentElement;
            const dropdownList = document.createElement('ul');
            dropdownList.id = dropdownId;
            dropdownList.className = 'absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-teal-300 bg-teal-800 text-white';
            wrapper.appendChild(dropdownList);

            input.addEventListener('input', () => debouncedFilter(input, dropdownId, select));
            input.addEventListener('focus', () => {
                if (input.value) filterPlayers(input.value, dropdownId, input, select);
            });
            input.addEventListener('blur', () => {
                setTimeout(() => document.getElementById(dropdownId).innerHTML = '', 200);
            });
            dropdownList.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (li) {
                    const playerId = li.dataset.id;
                    const player = allPlayers.find(p => p.id === playerId);
                    if (player) {
                        input.value = `${player.name} (${player.position})`;
                        select.value = playerId;
                        document.getElementById(dropdownId).innerHTML = '';
                        analyzeTrade(analyzeTradeBtn);
                    }
                }
            });
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function filterPlayers(searchTerm, dropdownId, input, select) {
        const dropdownList = document.getElementById(dropdownId);
        if (!searchTerm) {
            dropdownList.innerHTML = '';
            return;
        }

        const filteredPlayers = allPlayers.filter(player =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            const aRelevance = a.name.toLowerCase().indexOf(searchTerm.toLowerCase());
            const bRelevance = b.name.toLowerCase().indexOf(searchTerm.toLowerCase());
            return aRelevance - bRelevance || a.adp - b.adp;
        });

        let options = '';
        filteredPlayers.forEach(player => {
            const adpText = player.adp ? player.adp.toFixed(1) : 'N/A';
            options += `<li class="p-2 hover:bg-teal-600 cursor-pointer" data-id="${player.id}">${player.name} (${player.position}) - ADP: ${adpText}</li>`;
        });

        dropdownList.innerHTML = options || '<li class="p-2 text-gray-400">No players found</li>';
        dropdownList.style.top = `${input.offsetHeight + 2}px`;
        dropdownList.style.left = '0';
    }

    function getPlayerValue(playerId, leagueType, rosterType) {
        const player = allPlayers.find(p => p.id === playerId);
        if (!player) return 0;
        let baseValue = player.adp ? 100 / player.adp : 10;
        let positionModifier = 1;
        if (rosterType === 'superflex' && player.position === 'Quarterback') positionModifier = 1.3;
        return Math.round(baseValue * positionModifier);
    }

    function analyzeTrade(button) {
        const team1Ids = team1Selects.map(select => select.value).filter(id => id);
        const team2Ids = team2Selects.map(select => select.value).filter(id => id);
        const leagueType = leagueTypeSelect.value;
        const rosterType = rosterTypeSelect.value;

        if (team1Ids.length > 0 && team2Ids.length > 0) {
            const value1 = team1Ids.reduce((sum, id) => sum + getPlayerValue(id, leagueType, rosterType), 0);
            const value2 = team2Ids.reduce((sum, id) => sum + getPlayerValue(id, leagueType, rosterType), 0);
            const team1Names = team1Ids.map(id => allPlayers.find(p => p.id === id).name).join(', ');
            const team2Names = team2Ids.map(id => allPlayers.find(p => p.id === id).name).join(', ');
            if (value1 > value2) {
                tradeResult.textContent = `${team1Names} is valued higher (${value1} vs ${value2}). Consider this trade if you need ${team2Names}'s positions or future potential.`;
            } else if (value2 > value1) {
                tradeResult.textContent = `${team2Names} is valued higher (${value2} vs ${value1}). Consider this trade if you need ${team1Names}'s positions or future potential.`;
            } else {
                tradeResult.textContent = 'The trade is balanced in value. Evaluate based on team needs.';
            }
        } else {
            tradeResult.textContent = 'Please select at least one player for each team.';
        }
    }

    syncLeagueBtn.addEventListener('click', async () => {
        const leagueId = leagueIdInput.value;
        const platform = platformSelect.value;
        if (platform === 'sleeper' && leagueId) {
            tradeResult.textContent = 'Syncing league...';
            setupAutocomplete();
            tradeResult.textContent = 'League synced successfully.';
        } else if (platform !== 'sleeper') {
            tradeResult.textContent = 'Only Sleeper platform is supported at this time.';
        } else {
            tradeResult.textContent = 'Please enter a valid League ID.';
        }
    });

    analyzeTradeBtn.addEventListener('click', () => analyzeTrade(analyzeTradeBtn));
    leagueTypeSelect.addEventListener('change', () => analyzeTrade(analyzeTradeBtn));
    rosterTypeSelect.addEventListener('change', () => analyzeTrade(analyzeTradeBtn));

    setupAutocomplete();

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
});
