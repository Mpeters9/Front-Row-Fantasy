// --- Global Variables & Constants ---
const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};

let adpPlayersData = []; // For ADP data (ticker, goat builder)
let statsPlayersData = []; // For stats page data
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

/**
 * Loads player statistics data for the stats page.
 */
async function loadStatsPlayers() {
    const loader = document.getElementById('statsLoader');
    if(loader) loader.classList.remove('hidden');
    
    try {
        const response = await fetch('players_2025 Stats.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        statsPlayersData = await response.json();

    } catch (error) {
        console.error('Error loading stats player data:', error);
        statsPlayersData = [];
    } finally {
        if(loader) loader.classList.add('hidden');
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

/**
 * Renders the stats table on the stats page.
 */
function renderStatsTable() {
    const table = document.getElementById('statsTable');
    const tableHead = table.querySelector('thead');
    const tableBody = table.querySelector('tbody');
    if (!table || !tableHead || !tableBody) return;

    // Get filter values
    const posFilter = document.getElementById('positionSelect').value;
    const searchFilter = document.getElementById('playerSearchStats').value.toLowerCase();
    const showAdvanced = document.getElementById('advancedStatsCheckbox').checked;

    // Filter data
    let filteredData = statsPlayersData.filter(p => {
        const nameMatch = p.Player.toLowerCase().includes(searchFilter);
        let posMatch = true;
        if (posFilter !== 'ALL') {
             if (posFilter === 'FLEX') {
                posMatch = ['RB', 'WR', 'TE'].includes(p.Pos);
            } else {
                posMatch = p.Pos === posFilter;
            }
        }
        return nameMatch && posMatch;
    });

    // Clear table
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Define table headers
    let headers = ['Player', 'Pos', 'Team', 'Games', 'Fantasy Points', 'FP/GM'];
    if (showAdvanced) {
        headers.push('Pass Yds', 'Pass TD', 'Rush Yds', 'Rush TD', 'Rec', 'Rec Yds', 'Rec TD');
    }

    // Populate headers
    let headerHtml = '<tr>';
    headers.forEach(h => headerHtml += `<th class="p-3">${h}</th>`);
    headerHtml += '</tr>';
    tableHead.innerHTML = headerHtml;

    // Populate body
    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center p-4">No players match the current filters.</td></tr>`;
        return;
    }

    let bodyHtml = '';
    filteredData.forEach(p => {
        bodyHtml += `<tr class="hover:bg-gray-800">
            <td class="p-3 font-semibold text-white">${p.Player}</td>
            <td class="p-3">${p.Pos}</td>
            <td class="p-3">${p.Tm}</td>
            <td class="p-3">${p.G}</td>
            <td class="p-3 text-yellow-400 font-bold">${p.FantasyPoints.toFixed(1)}</td>
            <td class="p-3">${p['FantasyPoints/GM'].toFixed(1)}</td>
        `;
        if (showAdvanced) {
            bodyHtml += `
            <td class="p-3">${p['Pass Yds']}</td>
            <td class="p-3">${p['Pass TD']}</td>
            <td class="p-3">${p['Rush Yds']}</td>
            <td class="p-3">${p['Rush TD']}</td>
            <td class="p-3">${p.Rec}</td>
            <td class="p-3">${p['Rec Yds']}</td>
            <td class="p-3">${p['Rec TD']}</td>`;
        }
        bodyHtml += '</tr>';
    });
    tableBody.innerHTML = bodyHtml;
}


// --- Page-Specific Initializers ---

/**
 * Initializes functionality for the home page (index.html).
 */
async function initHomePage() {
    const scoringTypeSelect = document.getElementById('scoringType');
    const pauseButton = document.getElementById('pauseButton');
    const tickerContent = document.getElementById('tickerContent');
    
    if (scoringTypeSelect && tickerContent) {
        const initialScoringType = scoringTypeSelect.value;
        await loadAdpPlayers(initialScoringType);
        updateTicker(adpPlayersData);

        scoringTypeSelect.addEventListener('change', async () => {
            const selectedScoringType = scoringTypeSelect.value;
            await loadAdpPlayers(selectedScoringType);
            updateTicker(adpPlayersData);
        });

        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                isPaused = !isPaused;
                pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
                tickerContent.style.animationPlayState = isPaused ? 'paused' : 'running';
            });
        }
    }
}

/**
 * Initializes functionality for the GOAT builder page (goat.html).
 */
function initGoatPage() {
    const positionSelectors = {
        QB: document.getElementById('qbSelect'), RB: document.getElementById('rbSelect'),
        WR: document.getElementById('wrSelect'), TE: document.getElementById('teSelect'),
        FLEX: document.getElementById('flexSelect'), K: document.getElementById('kSelect'),
        DST: document.getElementById('dstSelect')
    };
    const defaultRoster = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 };
    
    // Populate dropdowns with numbers
    for (const pos in positionSelectors) {
        const select = positionSelectors[pos];
        if (select) {
            for (let i = 0; i <= 8; i++) select.add(new Option(i, i));
            select.value = defaultRoster[pos] || 0;
        }
    }
    
    document.getElementById('generateBuildButton').addEventListener('click', async () => {
        const teamSection = document.getElementById('generated-team-section');
        const loadingSpinner = document.getElementById('build-loading-spinner');
        const teamDiv = document.getElementById('generatedTeam');
        const scoringType = document.getElementById('scoringTypeGoat').value;

        teamSection.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        teamDiv.innerHTML = '';

        await loadAdpPlayers(scoringType);
        
        const rosterCounts = {};
        for (const pos in positionSelectors) {
            rosterCounts[pos] = parseInt(positionSelectors[pos].value, 10);
        }

        const build = generatePlayerBuild(rosterCounts);
        
        loadingSpinner.classList.add('hidden');
        displayBuild(build);
    });
}

function generatePlayerBuild(rosterCounts) {
    if (!adpPlayersData || adpPlayersData.length === 0) return null;

    const build = {};
    const pickedPlayers = new Set();
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

    positions.forEach(pos => {
        build[pos] = [];
        const playersForPos = adpPlayersData.filter(p => p.simplePosition === pos && !pickedPlayers.has(p.name));
        for (let i = 0; i < rosterCounts[pos] && i < playersForPos.length; i++) {
            const player = playersForPos[i];
            build[pos].push(player);
            pickedPlayers.add(player.name);
        }
    });

    build['FLEX'] = [];
    const flexCandidates = adpPlayersData.filter(p => 
        ['WR', 'RB', 'TE'].includes(p.simplePosition) && !pickedPlayers.has(p.name)
    );
    for (let i = 0; i < rosterCounts['FLEX'] && i < flexCandidates.length; i++) {
        const player = flexCandidates[i];
        build['FLEX'].push(player);
        pickedPlayers.add(player.name);
    }
    return build;
}

function displayBuild(build) {
    const container = document.getElementById('generatedTeam');
    if (!container) return;

    container.innerHTML = '';
    if (!build) {
        container.innerHTML = `<p class="text-red-400 text-center col-span-full">Could not generate a build.</p>`;
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
                    </div>`;
                container.appendChild(card);
            });
        }
    });
}

/**
 * Initializes functionality for the stats page (stats.html).
 */
async function initStatsPage() {
    await loadStatsPlayers();
    renderStatsTable();

    document.getElementById('positionSelect').addEventListener('change', renderStatsTable);
    document.getElementById('playerSearchStats').addEventListener('input', renderStatsTable);
    document.getElementById('advancedStatsCheckbox').addEventListener('change', renderStatsTable);
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

    // Page-specific initializations
    if (document.getElementById('tickerContent')) {
        initHomePage();
    }
    if (document.getElementById('goat-builder')) {
        initGoatPage();
    }
    if (document.getElementById('statsTable')) {
        initStatsPage();
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
