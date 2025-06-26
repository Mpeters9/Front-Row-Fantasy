document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    const state = {
        adp: { ppr: [], half: [], standard: [] },
        stats: [],
        isTickerPaused: false,
        lineupBuilder: { roster: [], available: [] }
    };

    // --- Data Loading ---
    const loadAdpData = async (scoring = 'ppr') => {
        if (state.adp[scoring].length > 0) return state.adp[scoring];
        try {
            const res = await fetch(scoringFiles[scoring]);
            if (!res.ok) throw new Error('ADP data not found');
            const data = await res.json();
            const formatted = data.map(p => ({ ...p, simplePosition: p.POS.replace(/\d+/, '') }))
                                  .sort((a, b) => a.AVG - b.AVG);
            state.adp[scoring] = formatted;
            return formatted;
        } catch (e) { console.error(`Failed to load ${scoring} ADP data:`, e); return []; }
    };

    const loadStatsData = async () => {
        if (state.stats.length > 0) return state.stats;
        try {
            const res = await fetch('players_2025 Stats.json');
            if (!res.ok) throw new Error('Stats data not found');
            const data = await res.json();
            // Calculate Fantasy Points for VORP and other tools
            data.forEach(p => {
                p.FantasyPoints = (p['Pass Yds'] * 0.04) + (p['Pass TD'] * 4) - (p['Int'] * 2) +
                                  (p['Rush Yds'] * 0.1) + (p['Rush TD'] * 6) + (p.Rec * 1) + // PPR
                                  (p['Rec Yds'] * 0.1) + (p['Rec TD'] * 6);
            });
            state.stats = data;
            return data;
        } catch (e) { console.error('Failed to load stats data:', e); return []; }
    };

    // --- Universal Components ---
    const initUniversal = () => {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => {
                document.getElementById('mobile-menu').classList.toggle('hidden');
            });
        }
        initTicker();
    };

    const initTicker = async () => {
        const tickerContent = document.getElementById('tickerContent');
        if (!tickerContent) return;
        const pauseButton = document.getElementById('pauseButton');
        try {
            const stats = await loadStatsData();
            const tickerData = stats.sort((a, b) => b.FantasyPoints - a.FantasyPoints);
            
            // Reorder to show top players by position sequentially
            let orderedTickerData = [];
            ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
                const topByPos = tickerData.filter(p => p.Pos === pos).slice(0, 10);
                orderedTickerData.push(...topByPos);
            });
            
            updateTickerUI(orderedTickerData, tickerContent);
            pauseButton.addEventListener('click', () => {
                state.isTickerPaused = !state.isTickerPaused;
                pauseButton.textContent = state.isTickerPaused ? 'Resume' : 'Pause';
                tickerContent.style.animationPlayState = state.isTickerPaused ? 'paused' : 'running';
            });
        } catch (e) { tickerContent.innerHTML = `<span class="text-red-400 px-4">Could not load ticker data.</span>`; }
    };

    const updateTickerUI = (players, el) => {
        if (!players.length) return;
        const tickerItems = [...players, ...players];
        el.innerHTML = tickerItems.map(p => `
            <div class="flex items-center mx-4 flex-shrink-0">
                <span class="font-bold text-lg text-white mr-2">${p.Player}</span>
                <span class="player-pos-${p.Pos.toLowerCase()} font-semibold px-2 py-1 rounded-full text-xs">${p.Pos}</span>
                <span class="text-yellow-400 ml-2">FP: ${p.FantasyPoints.toFixed(1)}</span>
            </div>
        `).join('');
        if (!state.isTickerPaused) {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = 'marquee 60s linear infinite';
        }
    };

    // --- Page-Specific Initializers ---
    const initHomePage = async () => {
        const topPlayersSection = document.getElementById('top-players-section');
        if (!topPlayersSection) return;
        const stats = await loadStatsData();
        if (!stats.length) return;
        
        const populateTop5 = (pos, listId) => {
            const listEl = document.getElementById(listId);
            const contentDiv = listEl.closest('.player-card-content');
            const top5 = stats.filter(p => p.Pos === pos).sort((a,b) => b.FantasyPoints - a.FantasyPoints).slice(0, 5);
            contentDiv.innerHTML = '';
            listEl.innerHTML = top5.map((p, i) => `<li><span class="player-name">${i + 1}. ${p.Player}</span><span class="player-points">${p.FantasyPoints.toFixed(1)} pts</span></li>`).join('');
            contentDiv.appendChild(listEl);
        };
        populateTop5('QB', 'top-qb-list');
        populateTop5('RB', 'top-rb-list');
        populateTop5('WR', 'top-wr-list');
    };

    const initGoatPage = () => {
        // Draft Builder Setup
        const benchSelect = document.getElementById('benchCount');
        if (benchSelect) {
            for (let i = 0; i <= 10; i++) benchSelect.add(new Option(i, i));
            benchSelect.value = 6;
            document.getElementById('generateBuildButton').addEventListener('click', generateGoatBuild);
        }

        // Lineup Builder Setup
        const lineupBuilder = document.getElementById('lineup-builder');
        if(lineupBuilder) {
            const searchInput = document.getElementById('roster-search');
            const addButton = document.getElementById('addPlayerButton');
            const autocompleteEl = document.getElementById('roster-autocomplete');
            
            searchInput.addEventListener('input', async () => {
                const stats = await loadStatsData();
                const query = searchInput.value.toLowerCase();
                if (query.length < 2) { autocompleteEl.innerHTML = ''; return; }
                const results = stats.filter(p => p.Player.toLowerCase().includes(query) && !state.lineupBuilder.roster.some(r => r.Player === p.Player)).slice(0, 5);
                autocompleteEl.innerHTML = results.map(p => `<li data-player='${JSON.stringify(p)}'>${p.Player} (${p.Pos}, ${p.Tm})</li>`).join('');
            });

            autocompleteEl.addEventListener('click', (e) => {
                if (e.target.tagName !== 'LI') return;
                const playerData = JSON.parse(e.target.dataset.player);
                addPlayerToRoster(playerData);
                searchInput.value = '';
                autocompleteEl.innerHTML = '';
            });
            
            addButton.addEventListener('click', () => {
                // Future: add logic to handle adding if not found via autocomplete
            });
            
            document.getElementById('findLineupButton').addEventListener('click', optimizeLineup);
        }
    };

    const generateGoatBuild = async () => {
        const btn = document.getElementById('generateBuildButton'), spinner = document.getElementById('draft-loading-spinner'), wrapper = document.getElementById('generatedTeamWrapper'), teamDiv = document.getElementById('generatedTeam'), scoring = document.getElementById('draftScoringType').value, benchCount = parseInt(document.getElementById('benchCount').value);
        
        btn.disabled = true;
        spinner.classList.remove('hidden');
        wrapper.classList.add('hidden');
        
        const [adp, stats] = await Promise.all([loadAdpData(scoring), loadStatsData()]);
        if (!adp.length || !stats.length) { teamDiv.innerHTML = '<p>Error loading data.</p>'; /* Handle error */ return; }

        const starterCount = 7; // 1QB, 2RB, 2WR, 1TE, 1FLEX
        const rosterSize = starterCount + benchCount;

        // Calculate VORP
        const replacementPoints = {
            QB: stats.filter(p=>p.Pos === 'QB').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[12]?.FantasyPoints || 0,
            RB: stats.filter(p=>p.Pos === 'RB').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[24]?.FantasyPoints || 0,
            WR: stats.filter(p=>p.Pos === 'WR').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[36]?.FantasyPoints || 0,
            TE: stats.filter(p=>p.Pos === 'TE').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[12]?.FantasyPoints || 0,
        };
        
        const draftPool = adp.map(p => {
            const pStats = stats.find(s => s.Player === p.Player);
            const vorp = pStats ? pStats.FantasyPoints - (replacementPoints[p.simplePosition] || 0) : -99;
            return {...p, ...pStats, vorp};
        }).sort((a, b) => b.vorp - a.vorp);

        // Simulate Draft
        let teams = Array(12).fill(0).map(() => []);
        let available = [...draftPool];
        
        for (let round = 0; round < rosterSize; round++) {
            for (let pick = 0; pick < 12; pick++) {
                if (available.length === 0) break;
                let draftedPlayer;
                if(pick === 0) { // User's pick is always the best available VORP
                    draftedPlayer = available[0];
                } else { // AI picks with some randomness
                    const rand = Math.random();
                    if(rand < 0.8) draftedPlayer = available[0]; // 80% chance pick best VORP
                    else if (rand < 0.95) draftedPlayer = available.sort((a,b) => a.AVG - b.AVG)[0]; // 15% chance pick best ADP
                    else draftedPlayer = available[Math.floor(Math.random() * 20)]; // 5% chance reach
                    available = available.sort((a, b) => b.vorp - a.vorp); // Resort for next pick
                }
                teams[pick].push(draftedPlayer);
                available = available.filter(p => p.Player !== draftedPlayer.Player);
            }
        }
        
        // Display User's Team
        const userTeam = teams[0];
        teamDiv.innerHTML = `
            <div class="col-span-full"><h4 class="text-xl font-bold text-teal-300 border-b border-teal-700 pb-1">Starters</h4></div>
            ${userTeam.slice(0, starterCount).map(p => playerCardHTML(p)).join('')}
            <div class="col-span-full mt-4"><h4 class="text-xl font-bold text-teal-300 border-b border-teal-700 pb-1">Bench</h4></div>
            ${userTeam.slice(starterCount).map(p => playerCardHTML(p)).join('')}
        `;

        spinner.classList.add('hidden');
        wrapper.classList.remove('hidden');
        btn.disabled = false;
    };
    
    const playerCardHTML = (p) => `
        <div class="player-card p-3 bg-gray-900 rounded-lg shadow-md">
            <div class="text-lg font-semibold text-white">${p.Player}</div>
            <div class="text-sm text-gray-400">${p.Team} - ${p.POS}</div>
            <div class="text-sm text-yellow-400">VORP: ${p.vorp.toFixed(2)}</div>
        </div>`;
    
    const addPlayerToRoster = (player) => {
        if (!state.lineupBuilder.roster.some(r => r.Player === player.Player)) {
            state.lineupBuilder.roster.push(player);
            renderRoster();
        }
    };
    
    const renderRoster = () => {
        const rosterList = document.getElementById('roster-list');
        const filters = document.getElementById('roster-filters');
        const findButton = document.getElementById('findLineupButton');
        
        rosterList.innerHTML = state.lineupBuilder.roster.map(p => `
            <div class="trade-player" data-player-name="${p.Player}">${p.Player} (${p.Pos}, ${p.Tm}) <button class="remove-btn">x</button></div>
        `).join('');

        findButton.disabled = state.lineupBuilder.roster.length === 0;
    };
    
    const optimizeLineup = () => {
        const lineupDiv = document.getElementById('bestLineup');
        const benchDiv = document.getElementById('bench');
        const { roster } = state.lineupBuilder;
        
        let pool = [...roster];
        let starters = { QB:[], RB:[], WR:[], TE:[], FLEX:[] };
        
        const fill = (pos, count) => {
            const players = pool.filter(p => p.Pos === pos).sort((a,b)=>b.FantasyPoints-a.FantasyPoints).slice(0, count);
            starters[pos] = players;
            pool = pool.filter(p => !players.some(s => s.Player === p.Player));
        };
        
        fill('QB', 1); fill('RB', 2); fill('WR', 2); fill('TE', 1);
        const flex = pool.filter(p => ['RB','WR','TE'].includes(p.Pos)).sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[0];
        if (flex) {
            starters.FLEX = [flex];
            pool = pool.filter(p => p.Player !== flex.Player);
        }
        
        lineupDiv.innerHTML = Object.entries(starters).flatMap(([pos, players]) => 
            players.map(p => `<div class="trade-player">${pos}: ${p.Player} - ${p.FantasyPoints.toFixed(1)} pts</div>`)
        ).join('');
        
        benchDiv.innerHTML = pool.sort((a,b)=>b.FantasyPoints-a.FantasyPoints).map(p => `<div class="trade-player">${p.Player} - ${p.FantasyPoints.toFixed(1)} pts</div>`).join('');
    };

    // --- App Initialization ---
    initUniversal();
    if (document.getElementById('top-players-section')) initHomePage();
    if (document.getElementById('goat-draft-builder')) initGoatPage();
    // if (document.getElementById('trade-analyzer')) initToolsPage();
    // if (document.getElementById('stats-page')) initStatsPage();
});
