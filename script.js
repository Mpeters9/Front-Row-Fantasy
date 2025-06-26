document.addEventListener('DOMContentLoaded', () => {
    // --- App State & Config ---
    const state = { adp: {}, stats: [], isTickerPaused: false };
    const scoringFiles = { standard: 'Standard ADP.json', ppr: 'PPR.json', half: 'Half PPR.json' };

    // --- Data Loading ---
    const loadAdpData = async (scoring = 'ppr') => {
        if (state.adp[scoring]?.length > 0) return state.adp[scoring];
        try {
            const res = await fetch(scoringFiles[scoring]);
            if (!res.ok) throw new Error('ADP data not found');
            const data = await res.json();
            state.adp[scoring] = data.map(p => ({ ...p, simplePosition: p.POS.replace(/\d+/, '') }));
            return state.adp[scoring];
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
        // Mobile Menu
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            const nav = document.querySelector('header nav');
            const mobileNav = document.getElementById('mobile-menu');
            mobileNav.innerHTML = nav.innerHTML; // Sync nav links
            mobileMenuButton.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
        }
        // Footer
        const footer = document.querySelector('footer');
        if(footer && !footer.innerHTML){
             footer.innerHTML = `<div class="mb-2 flex flex-wrap justify-center gap-4"><a href="index.html" class="hover:text-yellow">Home</a><a href="tools.html" class="hover:text-yellow">Expert Tools</a><a href="goat.html" class="hover:text-yellow">GOAT</a><a href="guides.html" class="hover:text-yellow">Guides</a><a href="community.html" class="hover:text-yellow">Community</a><a href="players.html" class="hover:text-yellow">Players</a><a href="stats.html" class="hover:text-yellow">Stats</a></div><div class="text-center text-sm">© 2025 Front Row Fantasy. All rights reserved.</div>`;
        }
        initTicker();
    };

    const initTicker = async () => {
        const tickerEl = document.getElementById('tickerContent');
        if (!tickerEl) return;
        const pauseBtn = document.getElementById('pauseButton');
        try {
            const stats = await loadStatsData();
            if (!stats.length) throw new Error('No stats for ticker');
            let tickerData = [];
            ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
                tickerData.push(...stats.filter(p => p.Pos === pos).sort((a,b) => b.FantasyPoints-a.FantasyPoints).slice(0, 10));
            });
            updateTickerUI(tickerData, tickerEl);
            pauseBtn.addEventListener('click', () => {
                state.isTickerPaused = !state.isTickerPaused;
                tickerEl.style.animationPlayState = state.isTickerPaused ? 'paused' : 'running';
                pauseBtn.textContent = state.isTickerPaused ? 'Resume' : 'Pause';
            });
        } catch (e) { tickerEl.innerHTML = `<span class="text-red-400 px-4">Could not load ticker data.</span>`; }
    };

    const updateTickerUI = (players, el) => {
        if (!players.length) return;
        const items = [...players, ...players];
        el.innerHTML = items.map(p => `
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

    // --- Page Specific Initializers ---
    const initHomePage = async () => {
        const stats = await loadStatsData();
        if (!stats.length) return;
        const populate = (pos, listId) => {
            const el = document.getElementById(listId);
            if (!el) return;
            const top5 = stats.filter(p => p.Pos === pos).sort((a,b) => b.FantasyPoints-a.FantasyPoints).slice(0, 5);
            el.innerHTML = top5.map((p, i) => `<li><span class="player-name">${i + 1}. ${p.Player}</span><span class="player-points">${p.FantasyPoints.toFixed(1)} pts</span></li>`).join('');
        };
        populate('QB', 'top-qb-list');
        populate('RB', 'top-rb-list');
        populate('WR', 'top-wr-list');
    };

    const initStatsPage = async () => {
        const filters = ['positionFilter', 'statSort', 'playerSearch', 'advancedStatsCheckbox'];
        filters.forEach(id => document.getElementById(id)?.addEventListener('input', renderStatsTable));
        renderStatsTable();
    };
    
    const initToolsPage = async () => {
        const stats = await loadStatsData();
        const teams = [...new Set(stats.map(p => p.Tm))].sort();
        const t1Select = document.getElementById('matchupTeam1Select');
        const t2Select = document.getElementById('matchupTeam2Select');
        teams.forEach(t => { t1Select.add(new Option(t, t)); t2Select.add(new Option(t, t)); });
        document.getElementById('predictMatchupBtn').addEventListener('click', () => predictMatchup(stats));
        initTradeAnalyzer(stats);
    };
    
    const initPlayersPage = async () => {
        const players = await loadAdpData('ppr');
        const container = document.getElementById('player-list-container');
        const searchInput = document.getElementById('player-search-input');
        
        const render = (pList) => {
            container.innerHTML = pList.map(p => `<div class="tool-card">${p.Player} (${p.POS}, ${p.Team}) - ADP: ${p.AVG.toFixed(1)}</div>`).join('');
        };
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            render(players.filter(p => p.Player.toLowerCase().includes(query)));
        });
        
        render(players);
    };
    
    const initGoatPage = () => { /* Logic for GOAT page exists in the global scope */ };

    // --- Main Logic for Pages ---
    
    // Stats Page
    const renderStatsTable = async () => {
        const data = await loadStatsData();
        const pos = document.getElementById('positionFilter').value;
        const sort = document.getElementById('statSort').value;
        const search = document.getElementById('playerSearch').value.toLowerCase();
        const advanced = document.getElementById('advancedStatsCheckbox').checked;

        let filtered = data.filter(p => (pos === 'ALL' || p.Pos === pos || (pos === 'FLEX' && ['RB','WR','TE'].includes(p.Pos))) && p.Player.toLowerCase().includes(search));
        filtered.sort((a, b) => (b[sort] || 0) - (a[sort] || 0));

        const table = document.getElementById('statsTable');
        let headers = ['Player', 'Pos', 'Team', 'Games', 'FP/GM', 'FantasyPoints'];
        if (advanced) headers.push('Pass Yds', 'Pass TD', 'Rush Yds', 'Rush TD', 'Rec', 'Rec Yds', 'Rec TD');
        table.querySelector('thead').innerHTML = `<tr>${headers.map(h => `<th class="p-3">${h}</th>`).join('')}</tr>`;
        table.querySelector('tbody').innerHTML = filtered.map(p => `
            <tr class="hover:bg-gray-800">
                <td class="p-3 font-semibold text-white">${p.Player}</td><td>${p.Pos}</td><td>${p.Tm}</td><td>${p.G}</td><td>${p['FantasyPoints/GM'].toFixed(1)}</td><td class="text-yellow-400 font-bold">${p.FantasyPoints.toFixed(1)}</td>
                ${advanced ? `<td>${p['Pass Yds']}</td><td>${p['Pass TD']}</td><td>${p['Rush Yds']}</td><td>${p['Rush TD']}</td><td>${p.Rec}</td><td>${p['Rec Yds']}</td><td>${p['Rec TD']}</td>` : ''}
            </tr>`).join('');
    };

    // Tools Page
    const predictMatchup = (stats) => {
        const t1 = document.getElementById('matchupTeam1Select').value, t2 = document.getElementById('matchupTeam2Select').value;
        const resultEl = document.getElementById('predictionResult');
        if (!t1 || !t2 || t1 === t2) { resultEl.textContent = 'Please select two different teams.'; resultEl.classList.remove('hidden'); return; }
        const score1 = stats.filter(p => p.Tm === t1).reduce((sum, p) => sum + (p['FantasyPoints/GM'] || 0), 0);
        const score2 = stats.filter(p => p.Tm === t2).reduce((sum, p) => sum + (p['FantasyPoints/GM'] || 0), 0);
        resultEl.innerHTML = `<span class="font-bold text-white">${t1}:</span> <span class="text-yellow-300">${score1.toFixed(1)} pts</span><br><span class="font-bold text-white">${t2}:</span> <span class="text-yellow-300">${score2.toFixed(1)} pts</span>`;
        resultEl.classList.remove('hidden');
    };

    const initTradeAnalyzer = (stats) => {
        let team1 = [], team2 = [];
        const setup = (inputId, listId, team) => {
            const input = document.getElementById(inputId), list = document.getElementById(listId);
            input.addEventListener('input', () => {
                const q = input.value.toLowerCase();
                if (q.length < 2) { list.innerHTML = ''; return; }
                list.innerHTML = stats.filter(p => p.Player.toLowerCase().includes(q)).slice(0,5).map(p => `<li data-player='${JSON.stringify(p)}'>${p.Player}</li>`).join('');
            });
            list.addEventListener('click', e => {
                if (e.target.tagName !== 'LI') return;
                team.push(JSON.parse(e.target.dataset.player));
                input.value = ''; list.innerHTML = '';
                renderTrade();
            });
        };
        const renderTrade = () => {
            const t1Div = document.getElementById('team1-players'), t2Div = document.getElementById('team2-players');
            t1Div.innerHTML = team1.map((p,i) => `<div class="trade-player" data-idx="${i}" data-team="1">${p.Player}<button class="remove-btn">x</button></div>`).join('');
            t2Div.innerHTML = team2.map((p,i) => `<div class="trade-player" data-idx="${i}" data-team="2">${p.Player}<button class="remove-btn">x</button></div>`).join('');
        };
        document.getElementById('trade-analyzer').addEventListener('click', e => {
            if (!e.target.classList.contains('remove-btn')) return;
            const p = e.target.parentElement;
            (p.dataset.team === '1' ? team1 : team2).splice(parseInt(p.dataset.idx), 1);
            renderTrade();
        });
        document.getElementById('analyzeTradeBtn').addEventListener('click', () => {
            const v1 = team1.reduce((s,p)=>s+p.FantasyPoints,0), v2 = team2.reduce((s,p)=>s+p.FantasyPoints,0);
            const verdict = document.getElementById('trade-verdict');
            document.getElementById('trade-results').classList.remove('hidden');
            verdict.textContent = Math.abs(v1-v2)<5 ? 'This trade is fair.' : (v1>v2 ? 'Side 1 wins.' : 'Side 2 wins.');
        });
        setup('player1-search', 'player1-autocomplete', team1);
        setup('player2-search', 'player2-autocomplete', team2);
    };

    // --- App Initialization ---
    initUniversal();
    if (document.getElementById('top-players-section')) initHomePage();
    if (document.getElementById('goat-draft-builder')) initGoatPage();
    if (document.getElementById('tools-page')) initToolsPage();
    if (document.getElementById('stats-page')) initStatsPage();
    if (document.getElementById('players-page')) initPlayersPage();
});
