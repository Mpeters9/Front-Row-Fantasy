// --- Global Variables & Constants ---
const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};

let adpPlayersData = []; // For ADP data (goat builder)
let statsPlayersData = []; // For stats page and lineup builder
let isTickerPaused = false;


// --- Data Loading Functions ---

/**
 * Loads player ADP data from JSON files for the Draft Builder.
 * @param {string} scoringType - 'standard', 'ppr', or 'half'.
 */
async function loadAdpPlayers(scoringType) {
    if (adpPlayersData.length > 0 && adpPlayersData.scoringType === scoringType) return;
    try {
        const response = await fetch(scoringFiles[scoringType]);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        adpPlayersData = data.map(player => ({
            name: player.Player,
            position: player.POS,
            team: player.Team,
            adp: player.AVG,
            simplePosition: player.POS ? player.POS.replace(/\d+/, '') : ''
        })).sort((a, b) => a.adp - b.adp);
        adpPlayersData.scoringType = scoringType;
    } catch (error) {
        console.error('Error loading ADP player data:', error);
        adpPlayersData = [];
    }
}

/**
 * Loads player statistics data (including fantasy points) for the Lineup Builder.
 */
async function loadStatsPlayers() {
    if (statsPlayersData.length > 0) return;
    try {
        const response = await fetch('players_2025 Stats.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        statsPlayersData = await response.json();
    } catch (error) {
        console.error('Error loading stats player data:', error);
        statsPlayersData = [];
    }
}


// --- UNIVERSAL FANTASY POINTS TICKER ---

/**
 * Initializes the universal ticker. It now pulls from the PPR file
 * and generates filler fantasy points.
 */
async function initTicker() {
    const tickerContent = document.getElementById('tickerContent');
    if (!tickerContent) return; // Exit if no ticker on this page

    const pauseButton = document.getElementById('pauseButton');
    
    // Fetch base player data from the PPR file to generate fake points from
    try {
        const response = await fetch('PPR.json');
        if (!response.ok) throw new Error('Could not load ticker data.');
        let basePlayers = await response.json();

        // Generate "filler" fantasy points and get top 10 from each position
        const tickerData = generateTickerData(basePlayers);
        
        updateTickerUI(tickerData); // Initial display

        // Event listener for pause button
        pauseButton.addEventListener('click', () => {
            isTickerPaused = !isTickerPaused;
            pauseButton.textContent = isTickerPaused ? 'Resume' : 'Pause';
            tickerContent.style.animationPlayState = isTickerPaused ? 'paused' : 'running';
        });

    } catch (error) {
        console.error("Ticker Error:", error);
        tickerContent.innerHTML = '<span class="text-red-400 px-4">Could not load ticker data.</span>';
    }
}

/**
 * Generates filler fantasy points and gets top 10 players per position.
 * @param {Array<Object>} players - Player data from a JSON file.
 * @returns {Array<Object>} - A combined list of top players for the ticker.
 */
function generateTickerData(players) {
    // Add a random "fantasyPoints" property to each player
    const playersWithPoints = players.map(p => {
        let maxPoints = 10;
        const pos = p.POS.replace(/\d+/,'');
        if (pos === 'QB') maxPoints = 35;
        else if (pos === 'RB' || pos === 'WR') maxPoints = 28;
        else if (pos === 'TE') maxPoints = 20;

        return {
            ...p,
            fantasyPoints: Math.random() * maxPoints
        };
    });
    
    let topPlayers = [];
    const positions = ['QB', 'RB', 'WR', 'TE'];
    
    positions.forEach(pos => {
        const playersInPos = playersWithPoints
            .filter(p => p.POS.replace(/\d+/,'') === pos)
            .sort((a,b) => b.fantasyPoints - a.fantasyPoints)
            .slice(0, 10); // Get top 10 for this position
        topPlayers.push(...playersInPos);
    });

    // Shuffle the final list for variety
    return topPlayers.sort(() => Math.random() - 0.5);
}

/**
 * Updates the ticker's HTML to show fantasy points.
 * @param {Array<Object>} players - The player data to display.
 */
function updateTickerUI(players) {
    const tickerContent = document.getElementById('tickerContent');
    if (!tickerContent) return;

    if (!players || players.length === 0) {
        tickerContent.innerHTML = '<span class="text-red-400 px-4">No player data to display.</span>';
        return;
    }

    const tickerItems = [...players, ...players]; // Create a seamless loop

    tickerContent.innerHTML = tickerItems.map(player => `
        <div class="flex items-center mx-4 flex-shrink-0">
            <span class="font-bold text-lg text-white mr-2">${player.Player}</span>
            <span class="player-pos-${player.POS.replace(/\d+/,'').toLowerCase()} font-semibold px-2 py-1 rounded-full text-xs">${player.POS.replace(/\d+/,'')}</span>
            <span class="text-yellow-400 ml-2">FP: ${player.fantasyPoints.toFixed(1)}</span>
        </div>
    `).join('');
    
    // Reset animation if it wasn't paused
    if (!isTickerPaused) {
        tickerContent.style.animation = 'none';
        void tickerContent.offsetWidth; // Force a browser reflow
        tickerContent.style.animation = 'marquee 40s linear infinite';
    }
}


// --- GOAT PAGE SPECIFIC FUNCTIONS ---

/**
 * Initializes all interactive tools on the GOAT page.
 */
function initGoatPage() {
    const draftBuilder = document.getElementById('goat-draft-builder');
    if (draftBuilder) {
        const positionCounts = {
            qbCount: { default: 1, max: 4 }, rbCount: { default: 2, max: 8 },
            wrCount: { default: 3, max: 8 }, teCount: { default: 1, max: 4 },
            flexCount: { default: 1, max: 4 }, kCount: { default: 1, max: 2 },
            dstCount: { default: 1, max: 2 }
        };
        for (const [id, values] of Object.entries(positionCounts)) {
            const select = document.getElementById(id);
            if (select) {
                for (let i = 0; i <= values.max; i++) select.add(new Option(i, i));
                select.value = values.default;
            }
        }
        document.getElementById('generateBuildButton').addEventListener('click', generateGoatBuild);
    }

    const lineupBuilder = document.getElementById('lineup-builder');
    if (lineupBuilder) {
        document.getElementById('findLineupButton').addEventListener('click', findBestLineup);
    }
}

async function generateGoatBuild() {
    const button = document.getElementById('generateBuildButton');
    const loadingSpinner = document.getElementById('draft-loading-spinner');
    const teamWrapper = document.getElementById('generatedTeamWrapper');
    const teamDiv = document.getElementById('generatedTeam');
    const scoringType = document.getElementById('draftScoringType').value;
    
    button.disabled = true;
    loadingSpinner.classList.remove('hidden');
    teamWrapper.classList.add('hidden');
    teamDiv.innerHTML = '';

    await loadAdpPlayers(scoringType);
    
    if (adpPlayersData.length === 0) {
        teamDiv.innerHTML = `<p class="text-red-500 text-center col-span-full">Error: Could not load player ADP data.</p>`;
    } else {
        const rosterCounts = {
            QB: parseInt(document.getElementById('qbCount').value), RB: parseInt(document.getElementById('rbCount').value),
            WR: parseInt(document.getElementById('wrCount').value), TE: parseInt(document.getElementById('teCount').value),
            FLEX: parseInt(document.getElementById('flexCount').value), K: parseInt(document.getElementById('kCount').value),
            DST: parseInt(document.getElementById('dstCount').value)
        };
        const build = createTeamBuild(rosterCounts);
        displayTeamBuild(build, teamDiv);
    }

    button.disabled = false;
    loadingSpinner.classList.add('hidden');
    teamWrapper.classList.remove('hidden');
}

function createTeamBuild(roster) {
    let pickedNames = new Set();
    let team = [];
    let pool = [...adpPlayersData];

    const pick = (pos, count) => {
        let pickedCount = 0;
        for (let i = 0; i < pool.length && pickedCount < count; i++) {
            const player = pool[i];
            if (player.simplePosition.toUpperCase() === pos && !pickedNames.has(player.name)) {
                team.push({ ...player, draftedAs: pos });
                pickedNames.add(player.name);
                pickedCount++;
            }
        }
    };

    pick('QB', roster.QB);
    pick('RB', roster.RB);
    pick('WR', roster.WR);
    pick('TE', roster.TE);
    
    let flexCount = 0;
    for (let i = 0; i < pool.length && flexCount < roster.FLEX; i++) {
        const player = pool[i];
        if (['RB', 'WR', 'TE'].includes(player.simplePosition.toUpperCase()) && !pickedNames.has(player.name)) {
            team.push({ ...player, draftedAs: 'FLEX' });
            pickedNames.add(player.name);
            flexCount++;
        }
    }
    
    pick('K', roster.K);
    pick('DST', roster.DST);
    
    return team.sort((a,b) => a.adp - b.adp);
}

function displayTeamBuild(team, container) {
    if (!team || team.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center col-span-full">Could not generate a team with these settings.</p>';
        return;
    }
    container.innerHTML = team.map(player => `
        <div class="player-card p-3 bg-gray-900 rounded-lg shadow-md flex items-center space-x-3 border border-gray-700">
            <div>
                <div class="text-lg font-semibold text-white">${player.name}</div>
                <div class="text-sm flex items-center gap-2 mt-1">
                    <span class="player-pos-${player.simplePosition.toLowerCase()} font-semibold px-2 py-0.5 rounded text-xs">${player.draftedAs} (${player.simplePosition.toUpperCase()})</span>
                    <span class="text-teal-300">${player.team}</span>
                </div>
                <div class="text-yellow-400 font-bold text-base mt-2">ADP: ${player.adp.toFixed(1)}</div>
            </div>
        </div>
    `).join('');
}

async function findBestLineup() {
    const button = document.getElementById('findLineupButton');
    const loadingSpinner = document.getElementById('lineup-loading-spinner');
    const lineupDiv = document.getElementById('bestLineup');
    
    button.disabled = true;
    loadingSpinner.classList.remove('hidden');
    lineupDiv.innerHTML = '';
    
    await loadStatsPlayers();
    
    if (statsPlayersData.length === 0) {
        lineupDiv.innerHTML = `<p class="text-red-500">Error: Could not load player stats for optimization.</p>`;
    } else {
        const playerInput = document.getElementById('playerList').value.split('\n').map(p => p.trim().toLowerCase()).filter(p => p);
        let userPlayers = statsPlayersData.filter(p => playerInput.includes(p.Player.toLowerCase()));
        
        const lineup = { QB: [], RB: [], WR: [], TE: [], FLEX: [] };
        const fillPosition = (pos, count) => {
            const topPlayers = userPlayers.filter(p => p.Pos === pos).sort((a, b) => b.FantasyPoints - a.FantasyPoints).slice(0, count);
            lineup[pos] = topPlayers;
            userPlayers = userPlayers.filter(p => !topPlayers.find(tp => tp.Player === p.Player));
        };

        fillPosition('QB', 1);
        fillPosition('RB', 2);
        fillPosition('WR', 2);
        fillPosition('TE', 1);

        const flexPlayer = userPlayers.filter(p => ['RB', 'WR', 'TE'].includes(p.Pos)).sort((a, b) => b.FantasyPoints - a.FantasyPoints)[0];
        if (flexPlayer) lineup.FLEX.push(flexPlayer);
        
        let totalPoints = 0;
        Object.keys(lineup).forEach(pos => {
            lineup[pos].forEach(player => {
                totalPoints += player.FantasyPoints;
                lineupDiv.innerHTML += `<div class="flex justify-between items-center bg-gray-900 p-2 rounded"><span class="font-bold text-white">${pos}: ${player.Player}</span><span class="text-yellow-400">${player.FantasyPoints.toFixed(1)} Pts</span></div>`;
            });
        });
        lineupDiv.innerHTML += `<div class="text-center font-bold text-xl mt-4 text-teal-300">Total Projected Points: ${totalPoints.toFixed(1)}</div>`;
    }

    button.disabled = false;
    loadingSpinner.classList.add('hidden');
}


// --- Main Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    // Universal initializations
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }

    initTicker(); // Initialize the universal ticker

    // Page-specific initializations
    if (document.getElementById('goat-draft-builder')) {
        initGoatPage();
    }
});

// --- Dynamic Styles ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
    .ticker-animation { animation: marquee 40s linear infinite; }
    @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
    .form-select, .form-input { width: 100%; padding: 0.5rem; background-color: #1f2937; color: white; border: 1px solid #0d9488; border-radius: 0.375rem; }
    .form-select {
        appearance: none;
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="%236ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l4 4 4-4"/></svg>');
        background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1.5em 1.5em;
    }
    .loader { border-top-color: #facc15; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .player-pos-qb { background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #60a5fa; }
    .player-pos-rb { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e;}
    .player-pos-wr { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444;}
    .player-pos-te { background-color: rgba(249, 115, 22, 0.2); color: #f97316; border: 1px solid #f97316;}
    .player-pos-k, .player-pos-dst { background-color: rgba(107, 114, 128, 0.2); color: #9ca3af; border: 1px solid #9ca3af;}
`;
document.head.appendChild(styleSheet);
