document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    const state = {
        adp: { ppr: [], half: [], standard: [] },
        stats: [],
        isTickerPaused: false,
    };

    // --- Configuration ---
    const scoringFiles = {
        standard: 'Standard ADP.json',
        ppr: 'PPR.json',
        half: 'Half PPR.json'
    };

    // --- Data Loading ---
    const loadAdpData = async (scoring = 'ppr') => {
        if (state.adp[scoring] && state.adp[scoring].length > 0) return state.adp[scoring];
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
            data.forEach(p => {
                p.FantasyPoints = (p['Pass Yds'] * 0.04) + (p['Pass TD'] * 4) - (p['Int'] * 2) +
                                  (p['Rush Yds'] * 0.1) + (p['Rush TD'] * 6) + (p.Rec * 1) + 
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
            const pprData = await loadAdpData('ppr');
            const tickerData = generateTickerData(pprData);
            updateTickerUI(tickerData, tickerContent);
            pauseButton.addEventListener('click', () => {
                state.isTickerPaused = !state.isTickerPaused;
                pauseButton.textContent = state.isTickerPaused ? 'Resume' : 'Pause';
                tickerContent.style.animationPlayState = state.isTickerPaused ? 'paused' : 'running';
            });
        } catch (e) { tickerContent.innerHTML = `<span class="text-red-400 px-4">Could not load ticker data.</span>`; }
    };

    const generateTickerData = (players) => {
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
            const playersInPos = playersWithPoints.filter(p => p.POS.replace(/\d+/,'') === pos)
                .sort((a,b) => b.fantasyPoints - a.fantasyPoints).slice(0, 10);
            topPlayers.push(...playersInPos);
        });
        return topPlayers;
    };

    const updateTickerUI = (players, el) => {
        if (!players.length) return;
        const tickerItems = [...players, ...players];
        el.innerHTML = tickerItems.map(p => `
            <div class="flex items-center mx-4 flex-shrink-0">
                <span class="font-bold text-lg text-white mr-2">${p.Player}</span>
                <span class="player-pos-${p.POS.replace(/\d+/,'').toLowerCase()} font-semibold px-2 py-1 rounded-full text-xs">${p.POS.replace(/\d+/,'')}</span>
                <span class="text-yellow-400 ml-2">FP: ${p.fantasyPoints.toFixed(1)}</span>
            </div>
        `).join('');
        if (!state.isTickerPaused) {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = 'marquee 60s linear infinite';
        }
    };

    // --- Home Page ---
    const initHomePage = async () => {
        const topPlayersSection = document.getElementById('top-players-section');
        if (!topPlayersSection) return;
        const stats = await loadStatsData();
        if (!stats.length) return;

        const populateTop5 = (pos, listId) => {
            const listEl = document.getElementById(listId);
            const contentDiv = listEl ? listEl.closest('.player-card-content') : null;
            if (!contentDiv) return;
            const top5 = stats.filter(p => p.Pos === pos).sort((a, b) => b.FantasyPoints - a.FantasyPoints).slice(0, 5);
            contentDiv.innerHTML = `<ol id="${listId}" class="space-y-3"></ol>`; // Recreate list
            const newListEl = document.getElementById(listId);
            newListEl.innerHTML = top5.map((p, i) => `<li><span class="player-name">${i + 1}. ${p.Player}</span><span class="player-points">${p.FantasyPoints.toFixed(1)} pts</span></li>`).join('');
        };
        populateTop5('QB', 'top-qb-list');
        populateTop5('RB', 'top-rb-list');
        populateTop5('WR', 'top-wr-list');
    };

    // --- GOAT Page ---
    const initGoatPage = () => {
        const draftBuilder = document.getElementById('goat-draft-builder');
        if (draftBuilder) {
            const posOptions = {
                qbCount: { def: 1, max: 2 }, rbCount: { def: 2, max: 4 }, wrCount: { def: 3, max: 5 },
                teCount: { def: 1, max: 2 }, flexCount: { def: 1, max: 2 }, benchCount: { def: 6, max: 10 }
            };
            for (const [id, vals] of Object.entries(posOptions)) {
                const select = document.getElementById(id);
                if(select) {
                    for (let i = 0; i <= vals.max; i++) select.add(new Option(i, i));
                    select.value = vals.def;
                }
            }
            const draftPosSelect = document.getElementById('draftPosition');
            if (draftPosSelect) {
                 for (let i = 1; i <= 12; i++) draftPosSelect.add(new Option(i, i));
            }
            document.getElementById('generateBuildButton').addEventListener('click', generateGoatBuild);
        }
    };

    const generateGoatBuild = async () => {
        const btn = document.getElementById('generateBuildButton'), spinner = document.getElementById('draft-loading-spinner'), wrapper = document.getElementById('generatedTeamWrapper'), teamDiv = document.getElementById('generatedTeam'), scoring = document.getElementById('draftScoringType').value;
        
        btn.disabled = true;
        spinner.classList.remove('hidden');
        wrapper.classList.add('hidden');
        
        const [adp, stats] = await Promise.all([loadAdpData(scoring), loadStatsData()]);
        if (!adp.length || !stats.length) { 
            teamDiv.innerHTML = '<p class="text-red-500 col-span-full text-center">Error loading data. Please refresh and try again.</p>';
            spinner.classList.add('hidden');
            wrapper.classList.remove('hidden');
            btn.disabled = false;
            return; 
        }

        const roster = {
            QB: parseInt(document.getElementById('qbCount').value), RB: parseInt(document.getElementById('rbCount').value),
            WR: parseInt(document.getElementById('wrCount').value), TE: parseInt(document.getElementById('teCount').value),
            FLEX: parseInt(document.getElementById('flexCount').value), BENCH: parseInt(document.getElementById('benchCount').value)
        };
        const draftPosition = parseInt(document.getElementById('draftPosition').value);
        const rosterSize = roster.QB + roster.RB + roster.WR + roster.TE + roster.FLEX + roster.BENCH;
        
        const replacementPoints = {
            QB: stats.filter(p=>p.Pos === 'QB').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[12]?.FantasyPoints || 0,
            RB: stats.filter(p=>p.Pos === 'RB').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[30]?.FantasyPoints || 0,
            WR: stats.filter(p=>p.Pos === 'WR').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[30]?.FantasyPoints || 0,
            TE: stats.filter(p=>p.Pos === 'TE').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[12]?.FantasyPoints || 0,
        };
        
        const draftPool = adp.map(p => {
            const pStats = stats.find(s => s.Player === p.Player);
            const vorp = pStats ? pStats.FantasyPoints - (replacementPoints[p.simplePosition] || -5) : -99;
            return {...p, ...pStats, vorp};
        }).sort((a, b) => b.vorp - a.vorp);

        let teams = Array(12).fill(0).map(() => ({ QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, players: [] }));
        let available = [...draftPool];
        
        for (let round = 0; round < rosterSize; round++) {
            for (let i = 0; i < 12; i++) {
                const currentPick = (round % 2 === 0) ? i : (11 - i); // Snake draft
                const team = teams[currentPick];
                if (available.length === 0) break;
                
                // Simplified AI needs logic: find best VORP player that fits a need
                let pick;
                if(team.QB < roster.QB) pick = available.find(p => p.simplePosition === 'QB');
                else if(team.RB < roster.RB) pick = available.find(p => p.simplePosition === 'RB');
                else if(team.WR < roster.WR) pick = available.find(p => p.simplePosition === 'WR');
                else if(team.TE < roster.TE) pick = available.find(p => p.simplePosition === 'TE');
                else if(team.FLEX < roster.FLEX) pick = available.find(p => ['RB','WR','TE'].includes(p.simplePosition));
                else pick = available[0]; // Best player available for bench

                if (pick) {
                    team.players.push(pick);
                    const pos = pick.simplePosition.toUpperCase();
                    if(team[pos] < roster[pos]) team[pos]++;
                    else team.FLEX++;
                    available = available.filter(p => p.Player !== pick.Player);
                }
            }
        }
        
        const userTeam = teams[draftPosition - 1].players;
        teamDiv.innerHTML = `
            <div class="col-span-full"><h4 class="text-xl font-bold text-teal-300 border-b border-teal-700 pb-1">Your Team (Drafted from #${draftPosition})</h4></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">${userTeam.map(p => playerCardHTML(p)).join('')}</div>
        `;

        spinner.classList.add('hidden');
        wrapper.classList.remove('hidden');
        btn.disabled = false;
    };
    
    const playerCardHTML = (p) => `
        <div class="player-card p-3 bg-gray-900 rounded-lg shadow-md">
            <div class="text-lg font-semibold text-white">${p.Player}</div>
            <div class="text-sm text-gray-400">${p.Team} - ${p.POS}</div>
            <div class="text-sm text-yellow-400">VORP: ${p.vorp ? p.vorp.toFixed(2): 'N/A'} (ADP: ${p.AVG.toFixed(1)})</div>
        </div>`;

    // --- Main Initializer ---
    initUniversal();
    if (document.getElementById('top-players-section')) initHomePage();
    if (document.getElementById('goat-draft-builder')) initGoatPage();
});
