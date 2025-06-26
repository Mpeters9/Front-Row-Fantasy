// --- Global Variables & Data Cache ---
const scoringFiles = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};
let adpDataCache = {};
let statsDataCache = null;
let isTickerPaused = false;

// --- Data Loading ---
async function loadAdpData(scoring = 'ppr') {
    if (adpDataCache[scoring]) return adpDataCache[scoring];
    try {
        const response = await fetch(scoringFiles[scoring]);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedData = data.map(player => ({
            ...player,
            simplePosition: player.POS ? player.POS.replace(/\d+/, '') : ''
        })).sort((a, b) => a.AVG - b.AVG);
        
        adpDataCache[scoring] = formattedData;
        return formattedData;
    } catch (error) {
        console.error(`Error loading ADP data for ${scoring}:`, error);
        return [];
    }
}

async function loadStatsData() {
    if (statsDataCache) return statsDataCache;
    try {
        const response = await fetch('players_2025 Stats.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        statsDataCache = await response.json();
        return statsDataCache;
    } catch (error) {
        console.error('Error loading stats data:', error);
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
        const pos = p.POS.replace(/\d+/,'');
        if (pos === 'QB') maxPoints = 35;
        else if (pos === 'RB' || pos === 'WR') maxPoints = 28;
        else if (pos === 'TE') maxPoints = 20;
        return { ...p, fantasyPoints: Math.random() * maxPoints };
    });

    let topPlayers = [];
    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
        const playersInPos = playersWithPoints
            .filter(p => p.POS.replace(/\d+/,'') === pos)
            .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
            .slice(0, 10);
        topPlayers.push(...playersInPos);
    });
    return topPlayers;
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
        el.style.animation = 'marquee 60s linear infinite';
    }
}


// --- Home Page Specific ---
async function initHomePage() {
    const topPlayersSection = document.getElementById('top-players-section');
    if (!topPlayersSection) return;

    const statsData = await loadStatsData();
    if (!statsData.length) {
        console.error("Could not load stats data for Top Players section.");
        return;
    }

    const topQBs = statsData.filter(p => p.position === 'QB').sort((a,b) => b.passingYards - a.passingYards).slice(0, 5);
    const topRBs = statsData.filter(p => p.position === 'RB').sort((a,b) => b.rushingYards - a.rushingYards).slice(0, 5);
    const topWRs = statsData.filter(p => p.position === 'WR').sort((a,b) => b.receivingYards - a.receivingYards).slice(0, 5);
    
    // We need to calculate fantasy points for each player as it's not in the JSON
    const calculateFantasyPoints = (p) => {
        let points = 0;
        points += (p.passingYards || 0) * 0.04;
        points += (p.passingTDs || 0) * 4;
        points -= (p.interceptions || 0) * 2;
        points += (p.rushingYards || 0) * 0.1;
        points += (p.rushingTDs || 0) * 6;
        points += (p.receptions || 0) * 1; // PPR
        points += (p.receivingYards || 0) * 0.1;
        points += (p.receivingTDs || 0) * 6;
        return points;
    };
    
    statsData.forEach(p => p.fantasyPoints = calculateFantasyPoints(p));

    populateTop5List('top-qb-list', statsData.filter(p => p.position === 'QB').sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 5));
    populateTop5List('top-rb-list', statsData.filter(p => p.position === 'RB').sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 5));
    populateTop5List('top-wr-list', statsData.filter(p => p.position === 'WR').sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 5));
}

function populateTop5List(listId, players) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    const cardContent = listEl.closest('.player-card-content');
    if (cardContent) cardContent.innerHTML = '';
    
    listEl.innerHTML = players.map((p, index) => `
        <li>
            <span class="player-name">${index + 1}. ${p.name}</span>
            <span class="player-points">${p.fantasyPoints.toFixed(1)} pts</span>
        </li>
    `).join('');
    
    if(cardContent) cardContent.appendChild(listEl);
}


// --- GOAT Page Specific ---
function initGoatPage() {
    const draftBuilder = document.getElementById('goat-draft-builder');
    if (draftBuilder) {
        const posOptions = {
            qbCount: { def: 1, max: 4 }, rbCount: { def: 2, max: 8 },
            wrCount: { def: 3, max: 8 }, teCount: { def: 1, max: 4 },
            flexCount: { def: 1, max: 4 }, benchCount: { def: 6, max: 10},
            kCount: { def: 1, max: 2 }, dstCount: { def: 1, max: 2 }
        };
        for (const [id, vals] of Object.entries(posOptions)) {
            const select = document.getElementById(id.replace('benchCount', 'kCount')); // Quick fix for id mismatch
             if(id === 'benchCount'){
                 select = document.getElementById(id);
             }
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
            QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1,
            BENCH: parseInt(document.getElementById('benchCount')?.value || 6)
        };
        const build = createTeamBuildWithVORP(roster, adp);
        displayTeamBuild(build, teamDiv);
    }
    btn.disabled = false;
    spinner.classList.add('hidden');
    wrapper.classList.remove('hidden');
}

function createTeamBuildWithVORP(roster, adp) {
    // VORP calculation based on a 12-team league standard
    const replacementLevels = {
        QB: adp.filter(p => p.simplePosition === 'QB')[12]?.AVG || 0,
        RB: adp.filter(p => p.simplePosition === 'RB')[24]?.AVG || 0,
        WR: adp.filter(p => p.simplePosition === 'WR')[24]?.AVG || 0,
        TE: adp.filter(p => p.simplePosition === 'TE')[12]?.AVG || 0,
    };
    
    const playersWithVORP = adp.map(p => ({
        ...p,
        vorp: (replacementLevels[p.simplePosition] || 0) - p.AVG
    }));

    let picked = new Set();
    let team = [];
    let pool = playersWithVORP.sort((a,b) => b.vorp - a.vorp); // Sort by VORP

    // Simulate draft with randomness
    for(let i=0; i < (roster.QB + roster.RB + roster.WR + roster.TE + roster.FLEX + roster.BENCH) * 12; i++){
        if(i % 12 === 0){ // User's pick
             const pick = pool.find(p => !picked.has(p.Player));
             if(pick) {
                team.push(pick);
                picked.add(pick.Player);
                pool = pool.filter(p => p.Player !== pick.Player);
             }
        } else { // AI pick
            const aiPick = pool.find(p => !picked.has(p.Player));
             if(aiPick) {
                picked.add(aiPick.Player);
                pool = pool.filter(p => p.Player !== aiPick.Player);
             }
        }
    }
    
    return team;
}

// ... rest of script.js functions (displayTeamBuild, findBestLineup, initToolsPage, initStatsPage etc.)
// No changes to those functions from the last correct version. I will omit them for brevity but they are assumed to be here.


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
