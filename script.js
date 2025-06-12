// Utility to show/hide loader
const showLoader = (id) => document.getElementById(id)?.classList?.remove('hidden');
const hideLoader = (id) => document.getElementById(id)?.classList?.add('hidden');

// Populate player dropdowns
fetch('players_2025.json')
    .then(response => response.json())
    .then(data => {
        const playerSelect1 = document.getElementById('player1');
        const playerSelect2 = document.getElementById('player2');
        data.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = `${player.name} (${player.position} - ${player.team})`;
            playerSelect1.appendChild(option.cloneNode(true));
            playerSelect2.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading players for dropdowns:', error);
    });

// Trade Analyzer logic
document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', async () => {
    try {
        const playerName1 = document.getElementById('player1').value;
        const playerName2 = document.getElementById('player2').value;
        const data = await fetch('players_2025.json').then(res => res.json());
        const player1 = data.find(p => p.name === playerName1);
        const player2 = data.find(p => p.name === playerName2);
        const tradeResultDiv = document.getElementById('tradeResult');
        if (player1 && player2) {
            const pointsDiff = Math.abs(parseFloat(player1.fantasy_points || 0) - parseFloat(player2.fantasy_points || 0));
            tradeResultDiv.innerHTML = pointsDiff < 5 ? `
                <p class="text-green-600 dark:text-green-400">Fair trade: ${player1.name} (${player1.fantasy_points} pts) vs ${player2.name} (${player2.fantasy_points} pts)</p>
            ` : `
                <p class="text-red-600 dark:text-red-400">Unbalanced trade: ${player1.name} (${player1.fantasy_points} pts) vs ${player2.name} (${player2.fantasy_points} pts)</p>
            `;
        } else {
            tradeResultDiv.innerHTML = '<p class="text-red-600 dark:text-red-400">Please select both players for trade analysis.</p>';
        }
    } catch (error) {
        console.error('Error analyzing trade:', error);
        document.getElementById('tradeResult').innerHTML = '<p class="text-red-600 dark:text-red-400">Error analyzing trade data.</p>';
    }
});

// Fantasy Points Ticker
const fantasyTicker = document.getElementById('fantasyTicker');
if (fantasyTicker) {
    showLoader('tickerLoader');
    try {
        const fetchWithTimeout = (url, timeout = 10000) => {
            return Promise.race([
                fetch(url),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
            ]);
        };
        fetchWithTimeout('players_2025.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const topPlayers = data.sort((a, b) => (parseFloat(b.fantasy_points || 0) - parseFloat(a.fantasy_points || 0))).slice(0, 10);
                const tickerContent = topPlayers.concat(topPlayers).map(player => `
                    <span class="inline-block px-4 py-2 mx-4 bg-teal-500 text-white rounded-lg shadow-md whitespace-nowrap">
                        ${player.name} (${player.position} - ${player.team || 'N/A'}) - ${parseFloat(player.fantasy_points || 0).toFixed(1)} pts
                    </span>
                `).join('');
                fantasyTicker.innerHTML = tickerContent;
                fantasyTicker.style.animationDuration = `${topPlayers.length * 4}s`;
                hideLoader('tickerLoader');
            })
            .catch(error => {
                console.error('Error loading fantasy ticker:', error);
                fantasyTicker.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Failed to load fantasy ticker.</p>';
                hideLoader('tickerLoader');
            });
    } catch (error) {
        console.error('Unexpected error:', error);
        fantasyTicker.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Error loading ticker.</p>';
        hideLoader('tickerLoader');
    }
}
