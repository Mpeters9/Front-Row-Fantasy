// Ticker functionality
const tickerContent = document.getElementById('tickerContent');
const pauseButton = document.getElementById('pauseButton');

// Sample ticker data (replace with real API data if available)
const sampleData = ['QB: Mahomes - 25 pts', 'RB: McCaffrey - 18 pts', 'WR: Jefferson - 22 pts', 'TE: Kelce - 15 pts'];
tickerContent.innerHTML = sampleData.map(item => `<span>${item}</span>`).join('');

pauseButton.addEventListener('click', () => {
    const isPaused = tickerContent.classList.toggle('paused');
    pauseButton.textContent = isPaused ? 'Play' : 'Pause';
});

// Trade Analyzer functionality
const tradeAnalyzerSelects = document.querySelectorAll('.trade-analyzer select');
const analyzeTradeButton = document.querySelector('.trade-analyzer button');

let teamOptions = ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5']; // Sample teams (replace with real data)

tradeAnalyzerSelects.forEach(select => {
    teamOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.toLowerCase().replace(' ', '-');
        opt.textContent = option;
        select.appendChild(opt);
    });
});

analyzeTradeButton.addEventListener('click', () => {
    const team1 = tradeAnalyzerSelects[0].value;
    const team2 = tradeAnalyzerSelects[1].value;
    if (team1 && team2 && team1 !== team2) {
        alert(`Analyzing trade between ${team1} and ${team2}. (Placeholder: Add your trade logic here)`);
    } else {
        alert('Please select two different teams.');
    }
});

// Matchup Predictor (placeholder functionality)
const matchupPredictor = document.querySelector('.matchup-predictor');
matchupPredictor.innerHTML = '<p>Select teams to predict matchup. (Placeholder: Add your predictor logic here)</p>';

// Dark mode toggle (optional, can be triggered by a button if added)
const toggleDarkMode = () => {
    document.body.classList.toggle('dark');
};

// Example: Add event listener for a dark mode button if you include one
// document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
