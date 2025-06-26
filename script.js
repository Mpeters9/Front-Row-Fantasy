// --- Global Variables & Constants ---
const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};

let adpPlayersData = []; // For ADP data (ticker, goat builder)
let isPaused = false;


// --- Data Loading Functions ---

/**
 * Loads player ADP data for the ticker and GOAT builder.
 * @param {string} scoringType - 'standard', 'ppr', or 'half'.
 */
async function loadAdpPlayers(scoringType) {
    try {
        const filePath = scoringFiles[scoringType];
        if (!filePath) throw new Error(`Invalid scoring type: ${scoringType}`);
        
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        adpPlayersData = data.map(player => ({
            name: player.Player,
            position: player.POS,
            team: player.Team,
            bye: player.Bye,
            adp: player.AVG,
            rank: player.Rank,
            simplePosition: player.POS ? player.POS.replace(/\d+/, '') : ''
        })).sort((a, b) => a.adp - b.adp);

    } catch (error) {
        console.error('Error loading ADP player data:', error);
        adpPlayersData = []; // Clear data on error
    }
}


// --- UI Update Functions ---

/**
 * Updates the live fantasy ticker.
 * @param {Array<Object>} players - Array of player objects to display.
 */
function updateTicker(players) {
    const tickerContent = document.getElementById('tickerContent');
    if (!tickerContent) return;

    if (!players || players.length === 0) {
        tickerContent.innerHTML = '<span class="text-red-400 px-4">No player data available.</span>';
        return;
    }

    let tickerHtml = '';
    const displayPlayers = players.slice(0, 20);
    const tickerItems = [...displayPlayers, ...displayPlayers]; // Duplicate for seamless loop

    tickerItems.forEach(player => {
        const posClass = player.simplePosition ? `player-pos-${player.simplePosition.toLowerCase()}` : '';
        tickerHtml += `
            <div class="flex items-center mx-4 flex-shrink-0">
                <span class="font-bold text-lg text-white mr-2">${player.name}</span>
                <span class="text-sm ${posClass} font-semibold px-2 py-1 rounded-full">${player.simplePosition || player.position}</span>
                <span class="text-teal-400 ml-2">ADP: ${player.adp ? player.adp.toFixed(1) : 'N/A'}</span>
                <span class="text-gray-400 ml-2">(${player.team})</span>
            </div>
        `;
    });
    tickerContent.innerHTML = tickerHtml;
}


// --- GOAT PAGE SPECIFIC FUNCTIONS ---

/**
 * Generates an optimal team build based on user-selected roster counts and ADP.
 * This function is only used by the GOAT page.
 * @param {Object} rosterCounts - An object with keys for each position and values for the number of players.
 * @returns {Object} An object containing arrays of player objects for each position.
 */
function generatePlayerBuild(rosterCounts) {
    if (!adpPlayersData || adpPlayersData.length === 0) {
        console.error("ADP Player data is not loaded.");
        return null;
    }

    const build = {};
    const pickedPlayers = new Set();
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

    // Select players for standard positions based on ADP
    positions.forEach(pos => {
        build[pos] = [];
        const playersForPos = adpPlayersData.filter(p => p.simplePosition === pos && !pickedPlayers.has(p.name));
        const numToPick = rosterCounts[pos] || 0;
        
        for (let i = 0; i < numToPick && i < playersForPos.length; i++) {
            const player = playersForPos[i];
            build[pos].push(player);
            pickedPlayers.add(player.name);
        }
    });

    // Select FLEX players from the remaining pool of WR, RB, and TE
    build['FLEX'] = [];
    const flexCandidates = adpPlayersData.filter(p => 
        ['WR', 'RB', 'TE'].includes(p.simplePosition) && !pickedPlayers.has(p.name)
    );
    // The list is already sorted by ADP, so we take the top available players
    const numFlexToPick = rosterCounts['FLEX'] || 0;
    for (let i = 0; i < numFlexToPick && i < flexCandidates.length; i++) {
        const player = flexCandidates[i];
        build['FLEX'].push(player);
        pickedPlayers.add(player.name);
    }
    
    return build;
}

/**
 * Displays the generated team build in the UI on the GOAT page.
 * @param {Object} build - The generated team build object.
 */
function displayBuild(build) {
    const container = document.getElementById('generatedTeam');
    if (!container) return;

    container.innerHTML = '';
    if (!build) {
        container.innerHTML = `<p class="text-red-400 text-center col-span-full">Could not generate a build. Player data might be missing.</p>`;
        return;
    }

    const positionsToDisplay = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];
    
    positionsToDisplay.forEach(pos => {
        if (build[pos] && build[pos].length > 0) {
            build[pos].forEach(player => {
                const card = document.createElement('div');
                card.className = 'player-card p-3 bg-gray-900 rounded-lg shadow-md flex items-center space-x-3 border border-gray-700';
                const posClass = `player-pos-${player.simplePosition.toLowerCase()}`;

                card.innerHTML = `
                    <div>
                        <div class="text-lg font-semibold text-white">${player.name}</div>
                        <div class="text-sm flex items-center gap-2 mt-1">
                            <span class="${posClass} font-semibold px-2 py-0.5 rounded">${pos === 'FLEX' ? `FLEX (${player.simplePosition})` : player.simplePosition}</span>
                            <span class="text-teal-300">${player.team}</span>
                        </div>
                        <div class="text-yellow-400 font-bold text-base mt-2">ADP: ${player.adp.toFixed(1)} (Rank: ${player.rank})</div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    });
}


// --- Main DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle (runs on all pages)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- HOME PAGE LOGIC (Ticker) ---
    // This code only runs if it finds the ticker element, which is on the home page.
    const tickerContent = document.getElementById('tickerContent');
    if (tickerContent) {
        const scoringTypeSelect = document.getElementById('scoringType');
        const pauseButton = document.getElementById('pauseButton');

        if (scoringTypeSelect) {
            // Load initial data and set up listener for changes
            (async () => {
                await loadAdpPlayers(scoringTypeSelect.value);
                updateTicker(adpPlayersData);
            })();

            scoringTypeSelect.addEventListener('change', async () => {
                await loadAdpPlayers(scoringTypeSelect.value);
                updateTicker(adpPlayersData);
            });
        }

        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                isPaused = !isPaused;
                pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
                tickerContent.style.animationPlayState = isPaused ? 'paused' : 'running';
            });
        }
    }

    // --- GOAT PAGE LOGIC (Build Generator) ---
    // This code only runs on goat.html because it looks for the 'goat-builder' ID.
    const goatBuilder = document.getElementById('goat-builder');
    if (goatBuilder) {
        const positionSelectors = {
            QB: document.getElementById('qbSelect'), RB: document.getElementById('rbSelect'),
            WR: document.getElementById('wrSelect'), TE: document.getElementById('teSelect'),
            FLEX: document.getElementById('flexSelect'), K: document.getElementById('kSelect'),
            DST: document.getElementById('dstSelect')
        };
        const defaultRoster = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 };
        
        // A necessary step: Populate dropdowns so the user can make selections.
        for (const pos in positionSelectors) {
            const select = positionSelectors[pos];
            if (select) {
                for (let i = 0; i <= 8; i++) {
                    select.add(new Option(i, i));
                }
                select.value = defaultRoster[pos] || 0; // Set a default value
            }
        }
        
        const generateButton = document.getElementById('generateBuildButton');
        const scoringTypeGoat = document.getElementById('scoringTypeGoat');
        
        generateButton.addEventListener('click', async () => {
            const teamSection = document.getElementById('generated-team-section');
            const loadingSpinner = document.getElementById('build-loading-spinner');
            const teamDiv = document.getElementById('generatedTeam');

            teamSection.classList.remove('hidden');
            loadingSpinner.classList.remove('hidden');
            teamDiv.innerHTML = '';

            // Load player data based on selected scoring
            await loadAdpPlayers(scoringTypeGoat.value);
            
            // Get roster counts from selectors
            const rosterCounts = {};
            for (const pos in positionSelectors) {
                rosterCounts[pos] = parseInt(positionSelectors[pos].value, 10);
            }

            // Generate and display the build
            const build = generatePlayerBuild(rosterCounts);
            loadingSpinner.classList.add('hidden');
            displayBuild(build);
        });
    }
});


// Add global CSS styles dynamically
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
    @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
    }
    .ticker-animation {
        animation: marquee 40s linear infinite;
    }
    .loader {
        border-top-color: #facc15;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .form-select {
        width: 100%;
        padding: 0.5rem;
        background-color: #1f2937;
        color: white;
        border: 1px solid #0d9488;
        border-radius: 0.375rem;
        appearance: none;
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="%236ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l4 4 4-4"/></svg>');
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 1.5em 1.5em;
    }
    .player-pos-qb { background-color: rgba(239, 68, 68, 0.2); color: #f87171; }
    .player-pos-rb { background-color: rgba(16, 185, 129, 0.2); color: #34d399; }
    .player-pos-wr { background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .player-pos-te { background-color: rgba(139, 92, 246, 0.2); color: #a78bfa; }
    .player-pos-k { background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .player-pos-dst { background-color: rgba(107, 114, 128, 0.2); color: #9ca3af; }
`;
document.head.appendChild(styleSheet);
