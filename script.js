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
            { position: 'Tight End', name: 'Dallas Goedert', team: 'PHI', points: 15.3 }
        ];

        const sortedData = mockData.sort((a, b) => {
            const positionOrder = { "Quarterback": 1, "Running Back": 2, "Wide Receiver": 3, "Tight End": 4 };
            if (positionOrder[a.position] !== positionOrder[b.position]) {
                return positionOrder[a.position] - positionOrder[b.position];
            }
            return b.points - a.points;
        });

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
        tickerContent.classList.remove('loading');
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
    const leagueIdInput = document.getElementById('leagueId');
    const syncLeagueBtn = document.getElementById('syncLeague');

    let allPlayers = [
        { id: '1', name: 'Josh Allen', position: 'Quarterback' },
        { id: '2', name: 'Patrick Mahomes', position: 'Quarterback' },
        { id: '3', name: 'Lamar Jackson', position: 'Quarterback' },
        { id: '4', name: 'Christian McCaffrey', position: 'Running Back' },
        { id: '5', name: 'Austin Ekeler', position: 'Running Back' },
        { id: '6', name: 'Alvin Kamara', position: 'Running Back' },
        { id: '7', name: 'Tyreek Hill', position: 'Wide Receiver' },
        { id: '8', name: 'Davante Adams', position: 'Wide Receiver' },
        { id: '9', name: 'Justin Jefferson', position: 'Wide Receiver' },
        { id: '10', name: 'Travis Kelce', position: 'Tight End' },
        { id: '11', name: 'George Kittle', position: 'Tight End' },
        { id: '12', name: 'Darren Waller', position: 'Tight End' }
    ];

    function setupAutocomplete() {
        const debouncedFilter = debounce((input, dropdown) => filterPlayers(input.value, dropdown), 300);

        [team1Select, team2Select].forEach(select => {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-2 border rounded mb-2 bg-gray-700 text-white';
            input.placeholder = `Search ${select.id === 'team1Select' ? 'Player 1' : 'Player 2'}...`;
            const dropdownList = document.createElement('ul');
            dropdownList.className = 'absolute top-100% left-0 w-full bg-gray-800 text-white border rounded mt-1 max-h-48 overflow-y-auto z-10';
            wrapper.appendChild(input);
            wrapper.appendChild(dropdownList);
            select.parentNode.insertBefore(wrapper, select);
            select.style.display = 'none';

            input.addEventListener('input', () => debouncedFilter(input, dropdownList));
            input.addEventListener('focus', () => {
                if (input.value) filterPlayers(input.value, dropdownList);
            });
            input.addEventListener('blur', () => {
                setTimeout(() => dropdownList.innerHTML = '', 200);
            });
            dropdownList.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    input.value = e.target.textContent;
                    select.value = e.target.dataset.id;
                    dropdownList.innerHTML = '';
                    analyzeTradeBtn.click();
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

    function filterPlayers(searchTerm, dropdownList) {
        if (!searchTerm) {
            dropdownList.innerHTML = '';
            return;
        }

        const filteredPlayers = allPlayers.filter(player =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            const aRelevance = a.name.toLowerCase().indexOf(searchTerm.toLowerCase());
            const bRelevance = b.name.toLowerCase().indexOf(searchTerm.toLowerCase());
            return aRelevance - bRelevance;
        });

        let options = '';
        filteredPlayers.forEach(player => {
            options += `<li class="p-2 hover:bg-gray-700 cursor-pointer" data-id="${player.id}">${player.name} (${player.position})</li>`;
        });

        dropdownList.innerHTML = options;
    }

    function getPlayerValue(playerId, leagueType, scoring, positionValue) {
        const option = team1Select.querySelector(`option[value="${playerId}"]`) || team2Select.querySelector(`option[value="${playerId}"]`);
        if (!option) return 0;
        let baseValue = 10;
        let scoringModifier = scoring === 'ppr' ? 1.2 : scoring === 'halfppr' ? 1.1 : 1;
        let positionModifier = 1;
        if (positionValue === 'qbBoost' && option.dataset.position === 'Quarterback') positionModifier = 1.3;
        if (positionValue === 'teBoost' && option.dataset.position === 'Tight End') positionModifier = 1.5;
        return Math.round(baseValue * scoringModifier * positionModifier);
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

    analyzeTradeBtn.addEventListener('click', () => {
        const player1Id = team1Select.value;
        const player2Id = team2Select.value;
        const leagueType = leagueTypeSelect.value;
        const scoring = scoringSelect.value;
        const positionValue = positionValueSelect.value;

        if (player1Id && player2Id && player1Id !== player2Id) {
            const value1 = getPlayerValue(player1Id, leagueType, scoring, positionValue);
            const value2 = getPlayerValue(player2Id, leagueType, scoring, positionValue);
            const player1Name = allPlayers.find(p => p.id === player1Id).name;
            const player2Name = allPlayers.find(p => p.id === player2Id).name;
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

    // Dark mode toggle
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark');
    };
});
