// Fantasy Points Ticker
const tickerContent = document.getElementById('tickerContent');
const pauseButton = document.getElementById('pauseButton');

async function fetchFantasyPoints() {
    try {
        // Placeholder for API call - replace with actual API endpoint
        const response = await fetch('https://api.example.com/fantasy-points'); // Example API
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

// Mock data for teams (replace with API data)
const mockTeams = [
    { id: '1', name: 'Team A' },
    { id: '2', name: 'Team B' },
    { id: '3', name: 'Team C' },
    { id: '4', name: 'Team D' },
    { id: '5', name: 'Team E' }
];

function populateTeams() {
    team1Select.innerHTML = '<option value="">Select Team 1</option>' + mockTeams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
    team2Select.innerHTML = '<option value="">Select Team 2</option>' + mockTeams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
}

async function fetchTradeAnalysis(team1Id, team2Id) {
    try {
        // Placeholder for API call - replace with actual API endpoint
        // const response = await fetch(`https://api.example.com/trade-analyze?team1=${team1Id}&team2=${team2Id}`);
        // const data = await response.json();
        // return data.analysis || 'Trade analysis not available';

        // Mock trade analysis (replace with real API logic)
        const team1 = mockTeams.find(team => team.id === team1Id);
        const team2 = mockTeams.find(team => team.id === team2Id);
        if (team1 && team2) {
            return `Trade analysis: ${team1.name} gains an edge with better overall stats compared to ${team2.name}.`;
        }
        return 'No analysis available';
    } catch (error) {
        console.error('Error fetching trade analysis:', error);
        return 'Failed to analyze trade';
    }
}

analyzeTradeBtn.addEventListener('click', async () => {
    const team1 = team1Select.value;
    const team2 = team2Select.value;
    if (team1 && team2 && team1 !== team2) {
        const analysis = await fetchTradeAnalysis(team1, team2);
        tradeResult.textContent = analysis;
    } else {
        tradeResult.textContent = 'Please select two different teams.';
    }
});

populateTeams();

// Matchup Predictor
const matchupTeam1Select = document.getElementById('matchupTeam1Select');
const matchupTeam2Select = document.getElementById('matchupTeam2Select');
const predictMatchupBtn = document.getElementById('predictMatchupBtn');
const predictionResult = document.getElementById('predictionResult');

async function fetchMatchupTeams() {
    try {
        const response = await fetch('https://api.example.com/teams'); // Reuse teams API
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

// Dark mode toggle (optional, can be triggered by a button if added)
const toggleDarkMode = () => {
    document.body.classList.toggle('dark');
};
