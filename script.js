document.addEventListener('DOMContentLoaded', () => {
    // --- App State & Config ---
    const state = {
        adp: { ppr: [], half: [], standard: [] },
        stats: [],
        isTickerPaused: false,
    };
    const scoringFiles = {
        standard: 'Standard ADP.json',
        ppr: 'PPR.json',
        half: 'Half PPR.json'
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
            topPlayers.push(...playersWithPoints.filter(p => p.POS.replace(/\d+/,'') === pos).sort((a,b) => b.fantasyPoints - a.fantasyPoints).slice(0, 10));
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
        const stats = await loadStatsData();
        if (!stats.length) return;
        const populateTop5 = (pos, listId) => {
            const contentDiv = document.getElementById(listId)?.closest('.player-card-content');
            if (!contentDiv) return;
            const top5 = stats.filter(p => p.Pos === pos).sort((a,b) => b.FantasyPoints - a.FantasyPoints).slice(0, 5);
            contentDiv.innerHTML = `<ol class="space-y-3">${top5.map((p, i) => `<li><span class="player-name">${i + 1}. ${p.Player}</span><span class="player-points">${p.FantasyPoints.toFixed(1)} pts</span></li>`).join('')}</ol>`;
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
                qbCount: { def: 1, max: 2, label: 'QB' }, rbCount: { def: 2, max: 5, label: 'RB' },
                wrCount: { def: 2, max: 5, label: 'WR' }, teCount: { def: 1, max: 2, label: 'TE' },
                flexCount: { def: 1, max: 2, label: 'FLEX' }, benchCount: { def: 6, max: 10, label: 'BENCH' }
            };
            for (const [id, vals] of Object.entries(posOptions)) {
                const select = document.getElementById(id);
                if(select) { for (let i = 0; i <= vals.max; i++) select.add(new Option(i, i)); select.value = vals.def; }
            }
            const draftPosSelect = document.getElementById('draftPosition');
            if (draftPosSelect) { for (let i = 1; i <= 12; i++) draftPosSelect.add(new Option(i, i)); }
            document.getElementById('generateBuildButton').addEventListener('click', generateGoatBuild);
        }
    };

    const generateGoatBuild = async () => {
        const btn = document.getElementById('generateBuildButton'), spinner = document.getElementById('draft-loading-spinner'), wrapper = document.getElementById('generatedTeamWrapper'), teamDiv = document.getElementById('generatedTeam'), scoring = document.getElementById('draftScoringType').value;
        btn.disabled = true;
        spinner.classList.remove('hidden');
        wrapper.classList.add('hidden');
        
        const [adp, stats] = await Promise.all([loadAdpData(scoring), loadStatsData()]);
        if (!adp.length || !stats.length) { /* Handle error */ return; }

        const rosterSettings = {
            QB: parseInt(document.getElementById('qbCount').value), RB: parseInt(document.getElementById('rbCount').value),
            WR: parseInt(document.getElementById('wrCount').value), TE: parseInt(document.getElementById('teCount').value),
            FLEX: parseInt(document.getElementById('flexCount').value), BENCH: parseInt(document.getElementById('benchCount').value)
        };
        const startersCount = rosterSettings.QB + rosterSettings.RB + rosterSettings.WR + rosterSettings.TE + rosterSettings.FLEX;
        const rosterSize = startersCount + rosterSettings.BENCH;
        const userDraftPos = parseInt(document.getElementById('draftPosition').value);

        const replacementPoints = {
            QB: stats.filter(p=>p.Pos === 'QB').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[12]?.FantasyPoints || 0,
            RB: stats.filter(p=>p.Pos === 'RB').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[30]?.FantasyPoints || 0,
            WR: stats.filter(p=>p.Pos === 'WR').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[36]?.FantasyPoints || 0,
            TE: stats.filter(p=>p.Pos === 'TE').sort((a,b)=>b.FantasyPoints-a.FantasyPoints)[12]?.FantasyPoints || 0,
        };
        
        const draftPool = adp.map(p => {
            const pStats = stats.find(s => s.Player === p.Player);
            const vorp = pStats ? pStats.FantasyPoints - (replacementPoints[p.simplePosition] || -5) : -99;
            return {...p, vorp};
        }).sort((a, b) => b.vorp - a.vorp);

        let teams = Array(12).fill(0).map(() => []);
        let available = [...draftPool];
        
        for (let round = 0; round < rosterSize; round++) {
            const picks = (round % 2 === 0) ? [...Array(12).keys()] : [...Array(12).keys()].reverse(); // Snake draft
            for (const pickNum of picks) {
                if (available.length === 0) break;
                let choice = available[0]; // AI defaults to best VORP
                if (pickNum !== (userDraftPos - 1)) {
                    const rand = Math.random();
                    if(rand > 0.9) choice = available.sort((a,b)=>a.AVG-b.AVG)[0]; // 10% chance AI picks by ADP
                }
                teams[pickNum].push(choice);
                available = available.filter(p => p.Player !== choice.Player);
            }
        }
        
        const userTeam = teams[userDraftPos - 1];
        const starters = userTeam.slice(0, startersCount);
        const bench = userTeam.slice(startersCount);

        document.getElementById('starters-list').innerHTML = starters.map(p => playerCardHTML(p, round + 1)).join('');
        document.getElementById('bench-list').innerHTML = bench.map(p => playerCardHTML(p, round + 1)).join('');

        spinner.classList.add('hidden');
        wrapper.classList.remove('hidden');
        btn.disabled = false;
    };
    
    const playerCardHTML = (p) => `
        <div class="player-card p-3 bg-gray-900 rounded-lg shadow-md flex justify-between items-center">
            <div>
                <div class="text-lg font-semibold text-white">${p.Player}</div>
                <div class="text-sm text-gray-400">${p.Team} - ${p.POS}</div>
            </div>
            <div class="text-right">
                <div class="text-sm text-yellow-400 font-bold">VORP: ${p.vorp ? p.vorp.toFixed(2): 'N/A'}</div>
                <div class="text-xs text-gray-500">ADP: ${p.AVG.toFixed(1)}</div>
            </div>
        </div>`;
    
    // --- Main Initializer ---
    initUniversal();
    if (document.getElementById('top-players-section')) initHomePage();
    if (document.getElementById('goat-draft-builder')) initGoatPage();
});
