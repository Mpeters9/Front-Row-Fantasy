// Utility to show/hide loader
const showLoader = (id) => document.getElementById(id)?.classList?.remove('hidden');
const hideLoader = (id) => document.getElementById(id)?.classList?.add('hidden');

// Populate player dropdowns for trade analyzer
fetch('players_2025.json')
    .then(response => response.json())
    .then(data => {
        const players1Select = document.getElementById('players1');
        const players2Select = document.getElementById('players2');
        data.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = `${player.name} (${player.position} - ${player.team})`;
            players1Select.appendChild(option.cloneNode(true));
            players2Select.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading players for dropdowns:', error);
    });

// Trade Analyzer logic with multiple players
document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', async () => {
    try {
        const players1 = Array.from(document.getElementById('players1').selectedOptions).map(option => option.value);
        const players2 = Array.from(document.getElementById('players2').selectedOptions).map(option => option.value);
        const data = await fetch('players_2025.json').then(res => res.json());
        
        const totalPoints1 = players1.reduce((sum, name) => sum + (data.find(p => p.name === name)?.fantasy_points || 0), 0);
        const totalPoints2 = players2.reduce((sum, name) => sum + (data.find(p => p.name === name)?.fantasy_points || 0), 0);
        
        const tradeResultDiv = document.getElementById('tradeResult');
        if (players1.length > 0 && players2.length > 0) {
            const pointsDiff = Math.abs(totalPoints1 - totalPoints2);
            tradeResultDiv.innerHTML = pointsDiff < 10 ? `
                <p class="text-green-600 dark:text-green-400">Fair trade: Team 1 (${totalPoints1.toFixed(2)} pts) vs Team 2 (${totalPoints2.toFixed(2)} pts)</p>
            ` : `
                <p class="text-red-600 dark:text-red-400">Unbalanced trade: Team 1 (${totalPoints1.toFixed(2)} pts) vs Team 2 (${totalPoints2.toFixed(2)} pts)</p>
            `;
        } else {
            tradeResultDiv.innerHTML = '<p class="text-red-600 dark:text-red-400">Please select players for both teams.</p>';
        }
    } catch (error) {
        console.error('Error analyzing trade:', error);
        document.getElementById('tradeResult').innerHTML = '<p class="text-red-600 dark:text-red-400">Error analyzing trade data.</p>';
    }
});

// Fantasy Points Ticker with Images
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
                    <span class="inline-block px-4 py-2 mx-4 bg-teal-500 text-white rounded-lg shadow-md whitespace-nowrap flex items-center">
                        <img src="${player.image || 'https://via.placeholder.com/40'}" alt="${player.name}" class="w-10 h-10 rounded-full mr-2" loading="lazy" onerror="this.src='https://via.placeholder.com/40';">
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
