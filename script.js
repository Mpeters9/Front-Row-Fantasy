// --- Global Variables & Data Cache ---
const a = {
    standard: 'Standard ADP.json',
    ppr: 'PPR.json',
    half: 'Half PPR.json'
};
let adpDataCache = {};
let statsDataCache = null;
let isTickerPaused = false;

// --- Data Loading ---
async function loadAdpData(scoring) {
    if (adpDataCache[scoring]) return adpDataCache[scoring];
    try {
        const res = await fetch(a[scoring]);
        const data = await res.json();
        adpDataCache[scoring] = data.map(p => ({
            ...p,
            simplePosition: p.POS.replace(/\d+/, '')
        }));
        return adpDataCache[scoring];
    } catch (e) {
        console.error(`Failed to load ADP data for ${scoring}:`, e);
        return [];
    }
}

async function loadStatsData() {
    if (statsDataCache) return statsDataCache;
    try {
        const res = await fetch('players_2025 Stats.json');
        statsDataCache = await res.json();
        return statsDataCache;
    } catch (e) {
        console.error('Failed to load stats data:', e);
        return [];
    }
}

// --- Universal Ticker ---
async function initTicker() {
    const tickerEl = document.getElementById('tickerContent');
    if (!tickerEl) return;
    const data = await loadStatsData();
    if (!data.length) {
        tickerEl.innerHTML = '<span class="text-red-400 px-4">Could not load player stats for ticker.</span>';
        return;
    }
    const topPlayers = data.sort((x, y) => y.FantasyPoints - x.FantasyPoints).slice(0, 25);
    const pauseBtn = document.getElementById('pauseButton');
    pauseBtn.addEventListener('click', () => {
        isTickerPaused = !isTickerPaused;
        tickerEl.style.animationPlayState = isTickerPaused ? 'paused' : 'running';
        pauseBtn.textContent = isTickerPaused ? 'Resume' : 'Pause';
    });
    updateTickerUI(topPlayers, tickerEl);
}

function updateTickerUI(players, el) {
    const tickerItems = [...players, ...players]; // Duplicate for seamless loop
    el.innerHTML = tickerItems.map(p => `
        <div class="flex items-center mx-4 flex-shrink-0">
            <span class="font-bold text-lg text-white mr-2">${p.Player}</span>
            <span class="player-pos-${p.Pos.toLowerCase()} font-semibold px-2 py-1 rounded-full text-xs">${p.Pos}</span>
            <span class="text-yellow-400 ml-2">FP: ${p.FantasyPoints.toFixed(1)}</span>
        </div>
    `).join('');
    if (!isTickerPaused) {
        el.style.animation = 'none';
        void el.offsetWidth; // Trigger reflow
        el.style.animation = 'marquee 40s linear infinite';
    }
}

// --- GOAT Page ---
function initGoatPage() {
    const posOptions = {
        qbCount: { def: 1, max: 4 }, rbCount: { def: 2, max: 8 },
        wrCount: { def: 3, max: 8 }, teCount: { def: 1, max: 4 },
        flexCount: { def: 1, max: 4 }, kCount: { def: 1, max: 2 },
        dstCount: { def: 1, max: 2 }
    };
    for (const [id, vals] of Object.entries(posOptions)) {
        const select = document.getElementById(id);
        for (let i = 0; i <= vals.max; i++) select.add(new Option(i, i));
        select.value = vals.def;
    }
    document.getElementById('generateBuildButton').addEventListener('click', generateGoatBuild);
    document.getElementById('findLineupButton').addEventListener('click', findBestLineup);
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
        for (let i = 0; i < pool.length && pickedCount < count; i++) {
            const p = pool[i];
            const pPos = Array.isArray(pos) ? pos : [pos];
            if (pPos.includes(p.simplePosition.toUpperCase()) && !picked.has(p.Player)) {
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
    return team.sort((x, y) => x.adp - y.adp);
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
    
    const stats = await loadStatsData();
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

// --- Tools Page ---
function initToolsPage() {
    let team1 = [], team2 = [];
    const search1 = document.getElementById('player1-search');
    const search2 = document.getElementById('player2-search');

    const setupAutocomplete = (inputEl, listEl, teamArr) => {
        inputEl.addEventListener('input', async () => {
            const stats = await loadStatsData();
            const query = inputEl.value.toLowerCase();
            if (query.length < 2) {
                listEl.innerHTML = '';
                return;
            }
            const results = stats.filter(p => p.Player.toLowerCase().includes(query)).slice(0, 5);
            listEl.innerHTML = results.map(p => `<li data-player='${JSON.stringify(p)}'>${p.Player} (${p.Pos}, ${p.Tm})</li>`).join('');
        });
        listEl.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const playerData = JSON.parse(e.target.dataset.player);
                teamArr.push(playerData);
                inputEl.value = '';
                listEl.innerHTML = '';
                renderTradeTeams();
            }
        });
    };
    
    const renderTradeTeams = () => {
        const team1Div = document.getElementById('team1-players');
        const team2Div = document.getElementById('team2-players');
        team1Div.innerHTML = team1.map((p, i) => `<div class="trade-player" data-team="1" data-index="${i}">${p.Player} <button class="remove-btn">x</button></div>`).join('');
        team2Div.innerHTML = team2.map((p, i) => `<div class="trade-player" data-team="2" data-index="${i}">${p.Player} <button class="remove-btn">x</button></div>`).join('');
    };

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const card = e.target.parentElement;
            const teamNum = card.dataset.team;
            const index = parseInt(card.dataset.index);
            if (teamNum === '1') team1.splice(index, 1);
            else team2.splice(index, 1);
            renderTradeTeams();
        }
    });

    setupAutocomplete(search1, document.getElementById('player1-autocomplete'), team1);
    setupAutocomplete(search2, document.getElementById('player2-autocomplete'), team2);
    
    document.getElementById('analyzeTradeBtn').addEventListener('click', () => {
        const val1 = team1.reduce((sum, p) => sum + p.FantasyPoints, 0);
        const val2 = team2.reduce((sum, p) => sum + p.FantasyPoints, 0);
        const resultsDiv = document.getElementById('trade-results');
        const verdictEl = document.getElementById('trade-verdict');
        resultsDiv.classList.remove('hidden');
        if (Math.abs(val1 - val2) < 5) {
            verdictEl.textContent = 'This trade is fair.';
            verdictEl.className = 'text-xl font-semibold mt-2 text-green-400';
        } else if (val1 > val2) {
            verdictEl.textContent = `Side 1 (Your Assets) wins this trade. (Value: ${val1.toFixed(1)} vs ${val2.toFixed(1)})`;
            verdictEl.className = 'text-xl font-semibold mt-2 text-yellow-400';
        } else {
            verdictEl.textContent = `Side 2 (Their Assets) wins this trade. (Value: ${val2.toFixed(1)} vs ${val1.toFixed(1)})`;
            verdictEl.className = 'text-xl font-semibold mt-2 text-red-400';
        }
    });

    const matchupTeam1 = document.getElementById('matchupTeam1Select');
    const matchupTeam2 = document.getElementById('matchupTeam2Select');
    loadStatsData().then(stats => {
        const teams = [...new Set(stats.map(p => p.Tm))].sort();
        teams.forEach(t => {
            matchupTeam1.add(new Option(t, t));
            matchupTeam2.add(new Option(t, t));
        });
    });

    document.getElementById('predictMatchupBtn').addEventListener('click', async () => {
        const t1 = matchupTeam1.value;
        const t2 = matchupTeam2.value;
        const resultEl = document.getElementById('predictionResult');
        if (!t1 || !t2 || t1 === t2) {
            resultEl.textContent = 'Please select two different teams.';
            resultEl.classList.remove('hidden');
            return;
        }
        const stats = await loadStatsData();
        const score1 = stats.filter(p => p.Tm === t1).reduce((sum, p) => sum + (p['FantasyPoints/GM'] || 0), 0);
        const score2 = stats.filter(p => p.Tm === t2).reduce((sum, p) => sum + (p['FantasyPoints/GM'] || 0), 0);
        resultEl.innerHTML = `<span class="font-bold text-white">${t1}:</span> <span class="text-yellow-300">${score1.toFixed(1)} pts</span><br><span class="font-bold text-white">${t2}:</span> <span class="text-yellow-300">${score2.toFixed(1)} pts</span>`;
        resultEl.classList.remove('hidden');
    });
}

// --- Stats Page ---
function initStatsPage() {
    const filters = ['positionFilter', 'statSort', 'playerSearch', 'advancedStatsCheckbox'];
    filters.forEach(id => document.getElementById(id).addEventListener('change', renderStatsTable));
    document.getElementById('playerSearch').addEventListener('input', renderStatsTable);
    renderStatsTable();
}

async function renderStatsTable() {
    const spinner = document.getElementById('statsLoader');
    spinner.classList.remove('hidden');

    const data = await loadStatsData();
    
    const pos = document.getElementById('positionFilter').value;
    const sort = document.getElementById('statSort').value;
    const search = document.getElementById('playerSearch').value.toLowerCase();
    const advanced = document.getElementById('advancedStatsCheckbox').checked;

    let filtered = data;
    if (pos !== 'ALL') {
        if (pos === 'FLEX') filtered = data.filter(p => ['RB', 'WR', 'TE'].includes(p.Pos));
        else filtered = data.filter(p => p.Pos === pos);
    }
    if (search) {
        filtered = filtered.filter(p => p.Player.toLowerCase().includes(search));
    }
    filtered.sort((x, y) => (y[sort] || 0) - (x[sort] || 0));

    const table = document.getElementById('statsTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    let headers = ['Player', 'Pos', 'Team', 'Games', 'FP/GM', 'FantasyPoints'];
    if (advanced) headers.push('Pass Yds', 'Pass TD', 'Rush Yds', 'Rush TD', 'Rec', 'Rec Yds', 'Rec TD');
    thead.innerHTML = `<tr>${headers.map(h => `<th class="p-3">${h}</th>`).join('')}</tr>`;

    tbody.innerHTML = filtered.map(p => `
        <tr class="hover:bg-gray-800">
            <td class="p-3 font-semibold text-white">${p.Player}</td>
            <td class="p-3">${p.Pos}</td>
            <td class="p-3">${p.Tm}</td>
            <td class="p-3">${p.G}</td>
            <td class="p-3">${p['FantasyPoints/GM'].toFixed(1)}</td>
            <td class="p-3 text-yellow-400 font-bold">${p.FantasyPoints.toFixed(1)}</td>
            ${advanced ? `
            <td class="p-3">${p['Pass Yds']}</td>
            <td class="p-3">${p['Pass TD']}</td>
            <td class="p-3">${p['Rush Yds']}</td>
            <td class="p-3">${p['Rush TD']}</td>
            <td class="p-3">${p.Rec}</td>
            <td class="p-3">${p['Rec Yds']}</td>
            <td class="p-3">${p['Rec TD']}</td>
            ` : ''}
        </tr>
    `).join('');
    
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

    // Page Specific
    if (document.getElementById('goat-draft-builder')) initGoatPage();
    if (document.getElementById('trade-analyzer')) initToolsPage();
    if (document.getElementById('stats-page')) initStatsPage();
});

// --- Dynamic Styles ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
    .ticker-animation { animation: marquee 40s linear infinite; }
    @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
    .form-select, .form-input, .cta-btn { transition: all 0.2s ease-in-out; }
    .cta-btn:disabled { background: #4b5563; cursor: not-allowed; }
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
    .autocomplete-list { position: absolute; background: #1f2937; border: 1px solid #0d9488; border-top: none; z-index: 10; width: calc(50% - 2rem); max-height: 200px; overflow-y: auto;}
    .autocomplete-list li { padding: 0.5rem; cursor: pointer; }
    .autocomplete-list li:hover { background: #374151; }
    .trade-player { background-color: #374151; padding: 0.5rem; border-radius: 0.25rem; display: flex; justify-content: space-between; align-items: center; }
    .remove-btn { background-color: #ef4444; color: white; border: none; border-radius: 50%; width: 1.25rem; height: 1.25rem; cursor: pointer; line-height: 1.25rem; text-align: center;}
`;
document.head.appendChild(styleSheet);
