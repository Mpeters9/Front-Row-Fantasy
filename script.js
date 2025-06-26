// --- Global Variables & Constants ---
const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};

let adpDataCache = {}; // Cache for ADP data (ppr, half, standard)
let statsPlayersData = []; // Cache for stats data
let isTickerPaused = false;

// --- Data Loading Functions ---

/**
 * Loads and caches ADP data from JSON files. Defaults to 'ppr'.
 * @param {string} scoring - 'ppr', 'half', or 'standard'.
 */
async function loadAdpData(scoring = 'ppr') {
    if (adpDataCache[scoring]) return adpDataCache[scoring]; // Use cache if available
    try {
        const response = await fetch(scoringFiles[scoring]);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedData = data.map(player => ({
            ...player,
            simplePosition: player.POS ? player.POS.replace(/\d+/, '') : ''
        })).sort((a, b) => a.AVG - b.AVG);
        
        adpDataCache[scoring] = formattedData; // Cache the data
        return formattedData;
    } catch (error) {
        console.error(`Error loading ADP data for ${scoring}:`, error);
        return []; // Return empty array on error
    }
}

/**
 * Loads and caches player statistics data.
 */
async function loadStatsPlayers() {
    if (statsPlayersData.length > 0) return statsPlayersData;
    try {
        const response = await fetch('players_2025 Stats.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        statsPlayersData = await response.json();
        return statsPlayersData;
    } catch (error) {
        console.error('Error loading stats player data:', error);
        return [];
    }
}


// --- Universal Ticker ---

async function initTicker() {
    const tickerContent = document.getElementById('tickerContent');
    if (!tickerContent) return;
    const pauseButton = document.getElementById('pauseButton');

    try {
        const pprData = await loadAdpData('ppr');
        const tickerData = generateTickerData(pprData);
        updateTickerUI(tickerData, tickerContent);
        
        pauseButton.addEventListener('click', () => {
            isTickerPaused = !isTickerPaused;
            pauseButton.textContent = isTickerPaused ? 'Resume' : 'Pause';
            tickerContent.style.animationPlayState = isTickerPaused ? 'paused' : 'running';
        });
    } catch (error) {
        tickerContent.innerHTML = `<span class="text-red-400 px-4">Could not load ticker data.</span>`;
    }
}

function generateTickerData(players) {
    const playersWithPoints = players.map(p => {
        let maxPoints = 10;
        const pos = p.POS.replace(/\d+/, '');
        if (pos === 'QB') maxPoints = 35;
        else if (pos === 'RB' || pos === 'WR') maxPoints = 28;
        else if (pos === 'TE') maxPoints = 20;
        return { ...p, fantasyPoints: Math.random() * maxPoints };
    });

    let topPlayers = [];
    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
        const playersInPos = playersWithPoints
            .filter(p => p.POS.replace(/\d+/, '') === pos)
            .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
            .slice(0, 10);
        topPlayers.push(...playersInPos);
    });
    return topPlayers.sort(() => Math.random() - 0.5);
}

function updateTickerUI(players, el) {
    if (!players || players.length === 0) {
        el.innerHTML = '<span class="text-red-400 px-4">No player data to display.</span>';
        return;
    }
    const tickerItems = [...players, ...players];
    el.innerHTML = tickerItems.map(player => `
        <div class="flex items-center mx-4 flex-shrink-0">
            <span class="font-bold text-lg text-white mr-2">${player.Player}</span>
            <span class="player-pos-${player.POS.replace(/\d+/,'').toLowerCase()} font-semibold px-2 py-1 rounded-full text-xs">${player.POS.replace(/\d+/,'')}</span>
            <span class="text-yellow-400 ml-2">FP: ${player.fantasyPoints.toFixed(1)}</span>
        </div>
    `).join('');
    if (!isTickerPaused) {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'marquee 40s linear infinite';
    }
}


// --- Home Page Specific ---

async function initHomePage() {
    const topPlayersSection = document.getElementById('top-players-section');
    if (!topPlayersSection) return;

    const pprData = await loadAdpData('ppr'); // Default to PPR
    if (!pprData.length) return;

    const topQB = pprData.find(p => p.simplePosition === 'QB');
    const topRB = pprData.find(p => p.simplePosition === 'RB');
    const topWR = pprData.find(p => p.simplePosition === 'WR');

    populatePlayerCard('top-qb-card', topQB);
    populatePlayerCard('top-rb-card', topRB);
    populatePlayerCard('top-wr-card', topWR);
}

function populatePlayerCard(cardId, player) {
    const card = document.getElementById(cardId);
    const contentDiv = card.querySelector('.player-card-content');
    if (!player) {
        contentDiv.innerHTML = 'Player data not found.';
        return;
    }
    contentDiv.innerHTML = `
        <p class="text-xl font-semibold text-white">${player.Player}</p>
        <p class="text-md text-teal-400">${player.Team} - ${player.POS}</p>
        <p class="text-md text-gray-300 mt-2">ADP: <span class="font-bold text-yellow-400">${player.AVG.toFixed(1)}</span></p>
    `;
}


// --- GOAT Page Specific ---

function initGoatPage() {
    const draftBuilder = document.getElementById('goat-draft-builder');
    if (draftBuilder) {
        const posOptions = {
            qbCount: { def: 1, max: 4 }, rbCount: { def: 2, max: 8 },
            wrCount: { def: 3, max: 8 }, teCount: { def: 1, max: 4 },
            flexCount: { def: 1, max: 4 }, kCount: { def: 1, max: 2 },
            dstCount: { def: 1, max: 2 }
        };
        for (const [id, vals] of Object.entries(posOptions)) {
            const select = document.getElementById(id);
            if (select) {
                for (let i = 0; i <= vals.max; i++) select.add(new Option(i, i));
                select.value = vals.def;
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
    const btn = document.getElementById('generateBuildButton');
    const spinner = document.getElementById('draft-loading-spinner');
    const wrapper = document.getElementById('generatedTeamWrapper');
    const teamDiv = document.getElementById('generatedTeam');
    const scoring = document.getElementById('draftScoringType').value;

    btn.disabled = true;
    spinner.classList.remove('hidden');
    wrapper.classList.add('hidden');
    teamDiv.innerHTML = '';

    const adp = await loadAdpData(scoring);
    if (!adp.length) {
        teamDiv.innerHTML = '<p class="text-red-500 text-center col-span-full">Error: Could not load ADP data.</p>';
    } else {
        const roster = {
            QB: parseInt(document.getElementById('qbCount').value), RB: parseInt(document.getElementById('rbCount').value),
            WR: parseInt(document.getElementById('wrCount').value), TE: parseInt(document.getElementById('teCount').value),
            FLEX: parseInt(document.getElementById('flexCount').value), K: parseInt(document.getElementById('kCount').value),
            DST: parseInt(document.getElementById('dstCount').value)
        };
        const build = createTeamBuild(roster, adp);
        displayTeamBuild(build, teamDiv);
    }
    btn.disabled = false;
    spinner.classList.add('hidden');
    wrapper.classList.remove('hidden');
}

function createTeamBuild(roster, adp) {
    let picked = new Set();
    let team = [];
    let pool = [...adp];
    
    const pick = (pos, count, draftedAs) => {
        let pickedCount = 0;
        const positions = Array.isArray(pos) ? pos : [pos];
        for (let i = 0; i < pool.length && pickedCount < count; i++) {
            const p = pool[i];
            if (positions.includes(p.simplePosition.toUpperCase()) && !picked.has(p.Player)) {
                team.push({ ...p, draftedAs });
                picked.add(p.Player);
                pickedCount++;
            }
        }
    };
    
    pick('QB', roster.QB, 'QB');
    pick('RB', roster.RB, 'RB');
    pick('WR', roster.WR, 'WR');
    pick('TE', roster.TE, 'TE');
    pick(['RB', 'WR', 'TE'], roster.FLEX, 'FLEX');
    pick('K', roster.K, 'K');
    pick('DST', roster.DST, 'DST');
    
    // Sort final team by ADP
    return team.sort((x, y) => x.AVG - y.AVG);
}

function displayTeamBuild(team, el) {
    if (!team.length) {
        el.innerHTML = '<p class="text-gray-400 text-center col-span-full">Could not generate a team with these settings.</p>';
        return;
    }
    el.innerHTML = team.map(p => `
        <div class="player-card p-3 bg-gray-900 rounded-lg shadow-md flex items-center space-x-3 border border-gray-700">
            <div>
                <div class="text-lg font-semibold text-white">${p.Player}</div>
                <div class="text-sm flex items-center gap-2 mt-1">
                    <span class="player-pos-${p.simplePosition.toLowerCase()} font-semibold px-2 py-0.5 rounded text-xs">${p.draftedAs} (${p.simplePosition.toUpperCase()})</span>
                    <span class="text-teal-300">${p.Team}</span>
                </div>
                <div class="text-yellow-400 font-bold text-base mt-2">ADP: ${p.AVG.toFixed(1)}</div>
            </div>
        </div>
    `).join('');
}

async function findBestLineup() {
    const btn = document.getElementById('findLineupButton');
    const spinner = document.getElementById('lineup-loading-spinner');
    const lineupDiv = document.getElementById('bestLineup');

    btn.disabled = true;
    spinner.classList.remove('hidden');
    lineupDiv.innerHTML = '';
    
    const stats = await loadStatsPlayers();
    if (!stats.length) {
        lineupDiv.innerHTML = `<p class="text-red-500">Error: Could not load player stats.</p>`;
    } else {
        const playerNames = document.getElementById('playerList').value.split('\n').map(p => p.trim().toLowerCase()).filter(Boolean);
        let userPlayers = stats.filter(p => playerNames.includes(p.Player.toLowerCase()));
        
        const lineup = { QB: [], RB: [], WR: [], TE: [], FLEX: [] };
        const fillPos = (pos, count) => {
            const playersForPos = userPlayers.filter(p => p.Pos === pos).sort((x, y) => y.FantasyPoints - x.FantasyPoints).slice(0, count);
            lineup[pos] = playersForPos;
            userPlayers = userPlayers.filter(p => !playersForPos.some(s => s.Player === p.Player));
        };
        
        fillPos('QB', 1);
        fillPos('RB', 2);
        fillPos('WR', 2);
        fillPos('TE', 1);

        const flexPlayer = userPlayers.filter(p => ['RB', 'WR', 'TE'].includes(p.Pos)).sort((x, y) => y.FantasyPoints - x.FantasyPoints)[0];
        if (flexPlayer) lineup.FLEX.push(flexPlayer);
        
        let totalPoints = 0;
        let html = '';
        Object.keys(lineup).forEach(pos => {
            lineup[pos].forEach(p => {
                totalPoints += p.FantasyPoints;
                html += `<div class="flex justify-between items-center bg-gray-900 p-2 rounded"><span class="font-bold text-white">${pos}: ${p.Player}</span><span class="text-yellow-400">${p.FantasyPoints.toFixed(1)} Pts</span></div>`;
            });
        });
        html += `<div class="text-center font-bold text-xl mt-4 text-teal-300">Total Projected Points: ${totalPoints.toFixed(1)}</div>`;
        lineupDiv.innerHTML = html;
    }
    btn.disabled = false;
    spinner.classList.add('hidden');
}


// --- Main Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    // Universal
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }
    initTicker();

    // Page Specific Initializers
    if (document.getElementById('top-players-section')) {
        initHomePage();
    }
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
    .form-select, .form-input, .cta-btn, .cta-btn-secondary { transition: all 0.2s ease-in-out; }
    .cta-btn:disabled { background: #4b5563; cursor: not-allowed; }
    .feature-card { background: rgba(17,24,39,0.85); border-radius: 1.25rem; box-shadow: 0 2px 16px rgba(20,184,166,0.10), 0 1.5px 8px #0004; padding: 2rem 1.5rem; border: 1.5px solid rgba(20,184,166,0.08); }
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
