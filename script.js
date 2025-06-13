// Assume existing variables and functions like showLoader, hideLoader are defined
let players2025 = [];

fetch('players_2025.json')
    .then(response => {
        if (!response.ok) throw new Error('Failed to load players_2025.json');
        return response.json();
    })
    .then(data => {
        players2025 = data;
        loadFantasyTicker();
    })
    .catch(error => {
        console.error('Error:', error);
        loadFantasyTicker(true); // Use fallback on error
    });

const fantasyTicker = document.getElementById('fantasyTicker');
function loadFantasyTicker(fallback = false) {
    if (!fantasyTicker) return;
    showLoader('tickerLoader');
    if (fallback || players2025.length === 0) {
        fantasyTicker.innerHTML = '<p class="text-red-400 text-center text-xs">Failed to load fantasy ticker. Using fallback.</p>';
        fantasyTicker.innerHTML += '<span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">Patrick Mahomes (QB - KC) - 25.1 pts</span>';
        hideLoader('tickerLoader');
        return;
    }
    const tickerContent = players2025.concat(players2025).map(player => {
        return `
            <span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">
                ${player.name} (${player.position} - ${player.team}) - ${player.fantasy_points.toFixed(1)} pts
            </span>
        `;
    }).join('');
    fantasyTicker.innerHTML = tickerContent;
    hideLoader('tickerLoader');
}
