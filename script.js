const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};

// Global variable to store player data, accessible across modules
let playersData = [];
let isPaused = false;
let tickerInterval; // To store the interval ID for clearing

// --- Utility Functions ---

/**
 * Fetches player data based on the specified scoring type.
 * @param {string} scoringType - 'standard', 'ppr', or 'half'.
 * @returns {Promise<void>}
 */
async function loadPlayers(scoringType) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }

    try {
        const filePath = scoringFiles[scoringType];
        if (!filePath) {
            console.error('Invalid scoring type:', scoringType);
            playersData = [];
            return;
        }
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        playersData = data.map(player => ({
            name: player.Player,
            position: player.POS, // Assuming POS includes the position like 'QB1', 'WR2'
            team: player.Team,
            bye: player.Bye,
            adp: player.AVG,
            rank: player.Rank,
            // Add a simplified position for styling if POS is too detailed (e.g., 'QB', 'RB', 'WR', 'TE', 'K', 'DST')
            simplePosition: player.POS ? player.POS.replace(/\d+/, '') : ''
        }));
        // Sort by ADP for ticker display
        playersData.sort((a, b) => a.adp - b.adp);

    } catch (error) {
        console.error('Error loading player data:', error);
        playersData = []; // Clear data on error
    } finally {
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
    }
}


/**
 * Updates the live fantasy ticker with the top N players.
 * @param {Array<Object>} players - Array of player objects to display in the ticker.
 */
function updateTicker(players) {
    const tickerContent = document.getElementById('tickerContent');
    if (!tickerContent) return;

    if (!players || players.length === 0) {
        tickerContent.innerHTML = '<span class="text-red-400 px-4">No player data available.</span>';
        tickerContent.style.animation = 'none'; // Stop animation if no data
        return;
    }

    let tickerHtml = '';
    // Duplicate content to create a seamless loop
    const displayPlayers = players.slice(0, 15); // Show top 15 for the ticker
    const totalPlayersForTicker = 30; // To make the animation smooth, duplicate enough times
    for (let i = 0; i < totalPlayersForTicker; i++) {
        const player = displayPlayers[i % displayPlayers.length]; // Cycle through the top 15
        if (player) {
            // Use simplePosition for class names if available, fallback to full position
            const posClass = player.simplePosition ? `player-pos-${player.simplePosition.toLowerCase()}` : '';
            tickerHtml += `
                <div class="flex items-center mx-4 flex-shrink-0">
                    <span class="font-bold text-lg text-white mr-2">${player.name}</span>
                    <span class="text-sm ${posClass} font-semibold px-2 py-1 rounded-full">${player.simplePosition || player.position}</span>
                    <span class="text-teal-400 ml-2">ADP: ${player.adp ? player.adp.toFixed(1) : 'N/A'}</span>
                    <span class="text-gray-400 ml-2">(${player.team})</span>
                </div>
            `;
        }
    }
    tickerContent.innerHTML = tickerHtml;

    // Restart animation if it was paused and content updated
    if (!isPaused) {
        tickerContent.style.animation = 'none'; // Reset animation
        // Force reflow to restart animation
        void tickerContent.offsetWidth;
        tickerContent.style.animation = 'marquee 30s linear infinite';
    }
}


/**
 * Populates the player table on the players.html page.
 * @param {Array<Object>} players - The array of player data.
 */
function updatePlayerTable(players) {
    const allPlayersDiv = document.getElementById('allPlayers');
    if (!allPlayersDiv) return; // Only run if on players.html

    allPlayersDiv.innerHTML = ''; // Clear existing players

    if (!players || players.length === 0) {
        allPlayersDiv.innerHTML = '<p class="text-red-400 text-center text-xs">No player data available.</p>';
        return;
    }

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-card p-3 bg-gray-800 rounded-lg shadow-md flex items-center space-x-3 transition duration-200 ease-in-out transform hover:scale-105';
        const posClass = player.simplePosition ? `player-pos-${player.simplePosition.toLowerCase()}` : `player-pos-${player.position ? player.position.replace(/\d+/, '').toLowerCase() : 'unknown'}`;

        div.innerHTML = `
            <img src="https://via.placeholder.com/40" alt="${player.name}" class="w-10 h-10 rounded-full object-cover border-2 border-teal-500">
            <div>
                <div class="text-lg font-semibold text-white">${player.name}</div>
                <div class="text-sm">
                    <span class="${posClass} font-semibold px-2 py-0.5 rounded">${player.position}</span>
                    <span class="text-teal-300 ml-1">${player.team}</span>
                </div>
                <div class="text-yellow-400 font-bold text-base">ADP: ${player.adp ? player.adp.toFixed(1) : 'N/A'}</div>
            </div>
            <button class="ml-auto text-gray-400 hover:text-white" aria-label="View player details">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        allPlayersDiv.appendChild(div);
    });
}


// --- Event Listeners and Initial Load ---

document.addEventListener('DOMContentLoaded', async () => {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Initialize ticker and scoring type selector only if elements exist on the page
    const scoringTypeSelect = document.getElementById('scoringType');
    const pauseButton = document.getElementById('pauseButton');
    const tickerContent = document.getElementById('tickerContent');

    if (scoringTypeSelect && tickerContent) {
        // Load players based on default selected scoring type (PPR from HTML)
        const initialScoringType = scoringTypeSelect.value;
        await loadPlayers(initialScoringType);
        updateTicker(playersData); // Update ticker after data is loaded

        // Update ticker and player table on scoring type change
        scoringTypeSelect.addEventListener('change', async () => {
            const selectedScoringType = scoringTypeSelect.value;
            await loadPlayers(selectedScoringType);
            updateTicker(playersData);
            // If on players.html, update the table too
            if (document.getElementById('allPlayers')) {
                updatePlayerTable(playersData);
            }
        });
    }

    if (pauseButton && tickerContent) {
        // Pause/resume ticker
        pauseButton.addEventListener('click', () => {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
            if (isPaused) {
                tickerContent.style.animationPlayState = 'paused';
            } else {
                tickerContent.style.animationPlayState = 'running';
            }
        });
    }

    // Player search on players.html
    const playerSearch = document.getElementById('playerSearch');
    const allPlayersDiv = document.getElementById('allPlayers');
    if (playerSearch && allPlayersDiv) {
        // Initial load for players.html
        await loadPlayers('ppr'); // Default for players page can be PPR or standard
        updatePlayerTable(playersData);

        playerSearch.addEventListener('input', () => {
            const searchTerm = playerSearch.value.toLowerCase();
            const playerElements = allPlayersDiv.getElementsByClassName('player-card');
            Array.from(playerElements).forEach(element => {
                const name = element.querySelector('.text-lg').textContent.toLowerCase();
                element.style.display = name.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    }

    // Ensure the player data is loaded for any page that might need it (e.g., stats.html)
    // If stats.html needs specific data, its own script block should call `loadPlayers`
    // However, for generic player data, we can try to pre-load here
    if (document.getElementById('stats-page-content')) { // Example ID for stats page
        if (playersData.length === 0) { // Only load if not already loaded by ticker
            await loadPlayers('standard'); // Default for stats page
        }
        // Additional stats page specific logic can go here.
    }
});

// Add CSS for ticker animation
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
    @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); } /* Translate by half the width of duplicated content */
    }
    .ticker-animation {
        animation: marquee 30s linear infinite;
    }
`;
document.head.appendChild(styleSheet);
