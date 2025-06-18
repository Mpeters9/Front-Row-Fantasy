// Fantasy Points Ticker
const tickerContent = document.getElementById('tickerContent');
const pauseButton = document.getElementById('pauseButton');

async function fetchFantasyPoints() {
    try {
        const response = await fetch('https://api.example.com/fantasy-points');
        const data = await response.json();
        if (data && data.points) {
            tickerContent.innerHTML = data.points.map(item => `<span>${item.position}: ${item.player} - ${item.points} pts</span>`).join('');
        } else {
            tickerContent.innerHTML = '<span>No data available</span>';
        }
    } catch (error) {
        console.error('Error fetching fantasy points:', error);
        tickerContent.innerHTML = '<span>Failed to load data</span>';
    }
}

pauseButton.addEventListener('click', () => {
    const isPaused = tickerContent.classList.toggle('paused');
    pauseButton.textContent = isPaused ? 'Play' : 'Pause';
});

setInterval(fetchFantasyPoints, 30000);
fetchFantasyPoints(); // Initial fetch

// Trade Analyzer
const team1Select = document.getElementById('team1Select');
const team2Select = document.getElementById('team2Select');
const analyzeTradeBtn = document.getElementById('analyzeTradeBtn');
const tradeResult = document.getElementById('tradeResult');
const leagueTypeSelect = document.getElementById('leagueType');
const scoringSelect = document.getElementById('scoring');
const positionValueSelect = document.getElementById('positionValue');

// Mock data for players (replace with API data)
const mockPlayers = [
    { id: '1', name: 'Christian McCaffrey', position: 'RB', redraftValue: 25, dynastyValue: 30 },
    { id: '2', name: 'De’Von Achane', position: 'RB', redraftValue: 18, dynastyValue: 22 },
    { id: '3', name: 'Nico Collins', position: 'WR', redraftValue: 15, dynastyValue: 18 },
    { id: '4', name: 'Ashton Jeanty', position: 'RB', redraftValue: 12, dynastyValue: 20 },
    { id: '5', name: 'Drake London', position: 'WR', redraftValue: 14, dynastyValue: 17 }
];

function populatePlayers() {
    const options = mockPlayers.map(player => `<option value="${player.id}">${player.name} (${player.position})</option>`).join('');
    team1Select.innerHTML = '<option value="">Select Player 1</option>' + options;
    team2Select.innerHTML = '<option value="">Select Player 2</option>' + options;
}

function getPlayerValue(playerId, leagueType, scoringModifier = 1, positionModifier = 1) {
    const player = mockPlayers.find(p => p.id === playerId);
    if (!player) return 0;
    let baseValue = leagueType === 'dynasty' ? player.dynastyValue : player.redraftValue;
    return Math.round(baseValue * scoringModifier * positionModifier);
}

async function analyzeTrade() {
    const player1Id = team1Select.value;
    const player2Id = team2Select.value;
    const leagueType = leagueTypeSelect.value;
    const scoring = scoringSelect.value;
    const positionValue = positionValueSelect.value;

    if (player1Id && player2Id && player1Id !== player2Id) {
        let scoringModifier = 1;
        if (scoring === 'ppr') scoringModifier = 1.2;
        else if (scoring === 'halfppr') scoringModifier = 1.1;

        let positionModifier = 1;
        if (positionValue === 'rbBoost') positionModifier = 1.3; // Boost for RBs
        else if (positionValue === 'wrBoost') positionModifier = 1.2; // Boost for WRs

        const value1 = getPlayerValue(player1Id, leagueType, scoringModifier, positionModifier);
        const value2 = getPlayerValue(player2Id, leagueType, scoringModifier, positionModifier);

        if (value1 > value2) {
            tradeResult.textContent = `${mockPlayers.find(p => p.id === player1Id).name} is valued higher (${value1} vs ${value2}). Consider this trade if you need ${mockPlayers.find(p => p.id === player2Id).name}'s position or future potential.`;
        } else if (value2 > value1) {
            tradeResult.textContent = `${mockPlayers.find(p => p.id === player2Id).name} is valued higher (${value2} vs ${value1}). Consider this trade if you need ${mockPlayers.find(p => p.id === player1Id).name}'s position or future potential.`;
        } else {
            tradeResult.textContent = 'The trade is balanced in value. Evaluate based on team needs.';
        }
    } else {
        tradeResult.textContent = 'Please select two different players.';
    }
}

analyzeTradeBtn.addEventListener('click', analyzeTrade);

populatePlayers();

// Add filters to index.html (to be implemented in next step)
leagueTypeSelect.addEventListener('change', analyzeTrade);
scoringSelect.addEventListener('change', analyzeTrade);
positionValueSelect.addEventListener('change', analyzeTrade);

// Matchup Predictor
const matchupTeam1Select = document.getElementById('matchupTeam1Select');
const matchupTeam2Select = document.getElementById('matchupTeam2Select');
const predictMatchupBtn = document.getElementById('predictMatchupBtn');
const predictionResult = document.getElementById('predictionResult');

async function fetchMatchupTeams() {
    try {
        const response = await fetch('https://api.example.com/teams');
        const data = await response.json();
        if (data && data.teams) {
            matchupTeam1Select.innerHTML = '<option value="">Select Team 1</option>' + data.teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
            matchupTeam2Select.innerHTML = '<option value="">Select Team 2</option>' + data.teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
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
        try {
            const response = await fetch(`https://api.example.com/matchup-predict?team1=${team1}&team2=${team2}`);
            const data = await response.json();
            predictionResult.textContent = data.prediction || 'Prediction not available';
        } catch (error) {
            console.error('Error predicting matchup:', error);
            predictionResult.textContent = 'Failed to predict matchup';
        }
    } else {
        predictionResult.textContent = 'Please select two different teams.';
    }
});

fetchMatchupTeams();

// Dark mode toggle
const toggleDarkMode = () => {
    document.body.classList.toggle('dark');
};
