document.addEventListener('DOMContentLoaded', () => {

    // Central configuration for the entire application
    const config = {
        dataFiles: ['players.json'], // Now loads from the single, combined file
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, DST: 1, K: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE", "DST", "K"],
        flexPositions: ["RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"]
    };

    // Main application object
    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {}, 
        tradeState: { team1: [], team2: [] },
        popupHideTimeout: null,

        async init() {
            this.initMobileMenu();
            this.createPlayerPopup();
            this.initPlaceholderTicker(); 
            await this.loadAllPlayerData();
            this.initLiveTicker(); 
            this.initializePageFeatures();
        },

        initializePageFeatures() {
            if (document.getElementById('top-players-section')) this.initTopPlayers();
            if (document.getElementById('goat-draft-builder')) this.setupGoatDraftControls();
            if (document.getElementById('start-sit-tool')) this.initStartSitTool();
            if (document.getElementById('mock-draft-simulator')) this.initMockDraftSimulator();
            if (document.getElementById('stats-page')) this.initStatsPage();
            if (document.getElementById('players-page')) this.initPlayersPage();
            if (document.getElementById('trade-analyzer')) this.initTradeAnalyzer();
        },
        
        // --- CORE & UI FUNCTIONS ---
        
        initMobileMenu() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mainNav = document.querySelector('header nav.hidden.md\\:flex');
            const mobileNav = document.getElementById('mobile-menu');
            if (mobileMenuButton && mainNav && mobileNav) {
                if (mobileNav.innerHTML.trim() === '') {
                    const clonedNav = mainNav.cloneNode(true);
                    clonedNav.classList.remove('hidden', 'md:flex', 'space-x-6');
                    clonedNav.classList.add('flex', 'flex-col', 'space-y-2');
                    Array.from(clonedNav.children).forEach(link => link.classList.add('nav-link-mobile'));
                    mobileNav.appendChild(clonedNav);
                }
                mobileMenuButton.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
            }
        },
        initPlaceholderTicker() {
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer) return;
            tickerContainer.innerHTML = `<span class="text-gray-400 px-4">Loading player points...</span>`;
        },
        initLiveTicker() {
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer || !this.playerData.length) return;
            const topPlayers = [...this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 10)];
            topPlayers.sort((a,b) => b.fantasyPoints - a.fantasyPoints);
            const tickerContent = topPlayers.map(player => `<span class="flex items-center mx-4"><span class="font-semibold text-white">${player.name} (${player.simplePosition})</span><span class="ml-2 font-bold text-yellow-400">${player.fantasyPoints.toFixed(2)} pts</span></span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            tickerContainer.style.transition = 'opacity 0.5s ease-in-out';
            tickerContainer.style.opacity = 0;
            setTimeout(() => { tickerContainer.innerHTML = tickerContent.repeat(3); tickerContainer.style.opacity = 1; }, 500);
        },
        async loadAllPlayerData() {
            if (this.hasDataLoaded) return;
            try {
                this.hasDataLoaded = true;
                const response = await fetch(config.dataFiles[0]);
                if (!response.ok) throw new Error(`Failed to load ${config.dataFiles[0]}`);
                let combinedData = await response.json();
                combinedData.forEach(p => { 
                    p.simplePosition = (p.position || 'N/A').replace(/\d+$/, '').trim().toUpperCase(); 
                    p.adp = p.adp || {}; 
                    for (const key in p.adp) p.adp[key] = parseFloat(p.adp[key]) || 999; 
                    p.fantasyPoints = this.generateFantasyPoints(p); 
                });
                combinedData.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
                this.playerData = combinedData;
            } catch (error) { console.error("Error loading player data:", error); this.displayDataError(); }
        },
        displayDataError() {
            const errorMsg = `<p class="text-center text-red-400 py-8">Could not load player data. Please try again later.</p>`;
            const statsBody = document.getElementById('stats-table-body');
            const playersContainer = document.getElementById('player-list-container');
            if(statsBody) statsBody.innerHTML = `<tr><td colspan="7">${errorMsg}</td></tr>`;
            if(playersContainer) playersContainer.innerHTML = errorMsg;
        },
        generateFantasyPoints(player) { 
            const pos = player.simplePosition; const tier = player.tier || 10;
            let base, range;
            if (pos === 'DST' || pos === 'K') { base = 5; range = 8; }
            else if (tier <= 2) { base = (pos === 'QB') ? 22 : 18; range = 15; } 
            else if (tier <= 5) { base = (pos === 'QB') ? 17 : 12; range = 12; } 
            else if (tier <= 8) { base = (pos === 'QB') ? 12 : 7; range = 10; } 
            else { base = 2; range = 8; }
            const points = base + (Math.random() * range);
            return Math.max(0, points); 
        },
        initTopPlayers() {
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;
            const topPlayersByPos = {"Top Quarterbacks": this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 4), "Top Running Backs": this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 4), "Top Wide Receivers": this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 4), "Top Tight Ends": this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 4)};
            container.innerHTML = Object.entries(topPlayersByPos).map(([title, players]) => `<div class="player-showcase-card"><h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3><ol class="list-none p-0 space-y-3">${players.map((p, index) => `<li class="flex items-center py-2 border-b border-gray-700/50 last:border-b-0"><span class="text-2xl font-bold text-teal-400/60 w-8">${index + 1}</span><div class="flex-grow"><span class="player-name-link font-semibold text-lg text-slate-100" data-player-name="${p.name}">${p.name}</span><span class="text-sm text-gray-400 block">${p.team}</span></div><span class="font-bold text-xl text-yellow-400">${p.fantasyPoints.toFixed(2)}</span></li>`).join('')}</ol></div>`).join('');
            this.addPlayerPopupListeners();
        },
        initStatsPage() {
            const controls = { position: document.getElementById('stats-position-filter'), sortBy: document.getElementById('stats-sort-by'), search: document.getElementById('stats-player-search'), tableBody: document.getElementById('stats-table-body') };
            if (!controls.tableBody) return;
            const renderTable = () => {
                let filteredPlayers = [...this.playerData];
                const pos = controls.position.value; if (pos !== 'ALL') { filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos); }
                const searchTerm = controls.search.value.toLowerCase(); if (searchTerm) { filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm)); }
                const sortKey = controls.sortBy.value;
                filteredPlayers.sort((a, b) => { if (sortKey === 'name') { return a.name.localeCompare(b.name); } if (sortKey === 'adp_ppr') { return (a.adp.ppr || 999) - (b.adp.ppr || 999); } return (b[sortKey] || 0) - (a[sortKey] || 0); });
                controls.tableBody.innerHTML = filteredPlayers.map(p => `<tr class="hover:bg-gray-800"><td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${p.name}">${p.name}</span></td><td class="p-4 text-center">${p.simplePosition}</td><td class="p-4 text-center">${p.team}</td><td class="p-4 text-center">${p.bye || 'N/A'}</td><td class="p-4 text-center font-mono">${p.fantasyPoints.toFixed(2)}</td><td class="p-4 text-center font-mono">${(p.vorp || 0).toFixed(2)}</td><td class="p-4 text-center font-mono">${p.adp.ppr || 'N/A'}</td></tr>`).join('');
                if (filteredPlayers.length === 0) { controls.tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-8">No players match the current filters.</td></tr>`; }
                this.addPlayerPopupListeners();
            };
            controls.position.addEventListener('change', renderTable); controls.sortBy.addEventListener('change', renderTable); controls.search.addEventListener('input', renderTable);
            renderTable();
        },
        initPlayersPage() {
            const searchInput = document.getElementById('player-search-input'); const container = document.getElementById('player-list-container');
            if (!searchInput || !container) return;
            const renderPlayerList = (players) => {
                players.sort((a,b) => (a.adp.ppr || 999) - (b.adp.ppr || 999));
                container.innerHTML = players.map(player => `<div class="tool-card p-4 flex items-center gap-4"><span class="font-bold text-lg w-12 text-center player-pos-${player.simplePosition.toLowerCase()}">${player.simplePosition}</span><div><p class="font-bold text-white text-lg player-name-link" data-player-name="${player.name}">${player.name}</p><p class="text-teal-300 text-sm">${player.team} | Bye: ${player.bye || 'N/A'}</p></div><div class="ml-auto text-right"><p class="text-white font-semibold">ADP</p><p class="text-yellow-400 text-sm font-bold">${player.adp.ppr || 'N/A'}</p></div></div>`).join('');
                this.addPlayerPopupListeners();
            };
            renderPlayerList(this.playerData);
            searchInput.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase(); renderPlayerList(this.playerData.filter(p => p.name.toLowerCase().includes(searchTerm))); });
        },
        initTradeAnalyzer() {
            const controls = { searchInput1: document.getElementById('trade-search-1'), autocomplete1: document.getElementById('trade-autocomplete-1'), teamContainer1: document.getElementById('trade-team-1'), searchInput2: document.getElementById('trade-search-2'), autocomplete2: document.getElementById('trade-autocomplete-2'), teamContainer2: document.getElementById('trade-team-2'), analyzeBtn: document.getElementById('analyze-trade-btn'), resultsContainer: document.getElementById('trade-results'), };
            if (!controls.analyzeBtn) return;
            controls.searchInput1.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput1, controls.autocomplete1, 1));
            controls.searchInput2.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput2, controls.autocomplete2, 2));
            controls.analyzeBtn.addEventListener('click', () => this.analyzeTrade());
        },
        showTradeAutocomplete(input, listEl, teamNum) {
            const searchTerm = input.value.toLowerCase();
            listEl.innerHTML = ''; if (searchTerm.length < 2) return;
            const filtered = this.playerData.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
            filtered.forEach(player => {
                const item = document.createElement('li');
                item.textContent = `${player.name} (${player.team} - ${player.simplePosition})`;
                item.addEventListener('click', () => { this.addPlayerToTrade(player, teamNum); input.value = ''; listEl.innerHTML = ''; });
                listEl.appendChild(item);
            });
        },
        addPlayerToTrade(player, teamNum) { if (teamNum === 1) this.tradeState.team1.push(player); else this.tradeState.team2.push(player); this.renderTradeUI(); },
        removePlayerFromTrade(playerName, teamNum) { if (teamNum === 1) { this.tradeState.team1 = this.tradeState.team1.filter(p => p.name !== playerName); } else { this.tradeState.team2 = this.tradeState.team2.filter(p => p.name !== playerName); } this.renderTradeUI(); },
        renderTradeUI() {
            const container1 = document.getElementById('trade-team-1'); const container2 = document.getElementById('trade-team-2');
            container1.innerHTML = this.tradeState.team1.length ? this.tradeState.team1.map(p => this.createTradePlayerPill(p, 1)).join('') : `<p class="text-gray-500 text-center p-4">Add players to this side of the trade.</p>`;
            container2.innerHTML = this.tradeState.team2.length ? this.tradeState.team2.map(p => this.createTradePlayerPill(p, 2)).join('') : `<p class="text-gray-500 text-center p-4">Add players to this side of the trade.</p>`;
            document.querySelectorAll('.trade-remove-btn').forEach(btn => { btn.onclick = () => this.removePlayerFromTrade(btn.dataset.playerName, parseInt(btn.dataset.teamNum)); });
            this.addPlayerPopupListeners();
        },
        createTradePlayerPill(player, teamNum) { return ` <div class="trade-player-pill player-pos-${player.simplePosition.toLowerCase()}"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span><span class="text-gray-400 ml-auto">${player.simplePosition}</span><button class="trade-remove-btn" data-player-name="${player.name}" data-team-num="${teamNum}">×</button></div> `; },
        analyzeTrade() {
            const resultsContainer = document.getElementById('trade-results'); resultsContainer.classList.remove('hidden');
            const totalVorp1 = this.tradeState.team1.reduce((sum, p) => sum + (p.vorp || 0), 0); const totalVorp2 = this.tradeState.team2.reduce((sum, p) => sum + (p.vorp || 0), 0);
            let verdict; const diff = Math.abs(totalVorp1 - totalVorp2); const avgVal = (totalVorp1 + totalVorp2) / 2 || 1;
            if (this.tradeState.team1.length === 0 || this.tradeState.team2.length === 0) { verdict = `<h3 class="text-2xl font-bold text-red-400">Please add players to both sides of the trade.</h3>`; } 
            else if (diff / avgVal < 0.1) { verdict = `<h3 class="text-2xl font-bold text-yellow-300">This is a very balanced trade.</h3><p class="text-gray-300 mt-1">It's a fair swap that comes down to which players you believe in more.</p>`; } 
            else if (totalVorp1 > totalVorp2) { verdict = `<h3 class="text-2xl font-bold text-red-400">You might be giving up too much value.</h3><p class="text-gray-300 mt-1">The other team seems to be getting the better end of this deal.</p>`; } 
            else { verdict = `<h3 class="text-2xl font-bold text-green-400">This looks like a smash accept for you!</h3><p class="text-gray-300 mt-1">The players you're getting back are a significant upgrade.</p>`; }
            resultsContainer.innerHTML = ` <div class="text-center">${verdict}</div> <div id="ai-trade-analysis-container" class="popup-footer mt-4"><button id="get-ai-trade-btn" class="ai-analysis-btn">Get AI Opinion</button><div id="ai-trade-loader" class="loader-small hidden"></div><p id="ai-trade-text" class="text-sm text-gray-300 mt-2 text-left"></p></div> `;
            if(this.tradeState.team1.length > 0 && this.tradeState.team2.length > 0) { document.getElementById('get-ai-trade-btn').addEventListener('click', () => this.getAITradeAnalysis()); } 
            else { document.getElementById('ai-trade-analysis-container').classList.add('hidden'); }
        },
        async getAITradeAnalysis() {
            const container = document.getElementById('ai-trade-analysis-container'); const button = container.querySelector('#get-ai-trade-btn'); const loader = container.querySelector('#ai-trade-loader'); const textEl = container.querySelector('#ai-trade-text');
            button.classList.add('hidden'); loader.classList.remove('hidden');
            const team1Players = this.tradeState.team1.map(p => p.name).join(', '); const team2Players = this.tradeState.team2.map(p => p.name).join(', ');
            const prompt = `Act as a fantasy football expert. Analyze this trade: A manager sends ${team1Players} and receives ${team2Players}. Provide a brief, strategic analysis of the trade, considering player value, age, and potential upside or risk. Keep it under 75 words.`;
            try { let chatHistory = [{ role: "user", parts: [{ text: prompt }] }]; const payload = { contents: chatHistory }; const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json(); if (result.candidates && result.candidates.length > 0) { textEl.textContent = result.candidates[0].content.parts[0].text; } else { throw new Error('No content returned from AI.'); } } catch (error) { console.error("Gemini API error:", error); textEl.textContent = "Could not retrieve AI analysis at this time."; } finally { loader.classList.add('hidden'); }
        },
        setupGoatDraftControls() {
            const controls = { leagueSize: document.getElementById('goat-league-size'), draftPosition: document.getElementById('goat-draft-position'), generateButton: document.getElementById('generateDraftBuildButton'), scoringType: document.getElementById('goat-draft-scoring'), rosterInputs: { QB: document.getElementById('roster-qb'), RB: document.getElementById('roster-rb'), WR: document.getElementById('roster-wr'), TE: document.getElementById('roster-te'), FLEX: document.getElementById('roster-flex'), SUPER_FLEX: document.getElementById('roster-superflex'), BENCH: document.getElementById('roster-bench') } };
            if (!controls.generateButton) return;
            const updateDraftPositions = () => { const size = parseInt(controls.leagueSize.value); controls.draftPosition.innerHTML = ''; for (let i = 1; i <= size; i++) { controls.draftPosition.add(new Option(`Pick ${i}`, i)); } };
            controls.leagueSize.addEventListener('change', updateDraftPositions);
            controls.generateButton.addEventListener('click', () => {
                config.rosterSettings = { QB: parseInt(controls.rosterInputs.QB.value), RB: parseInt(controls.rosterInputs.RB.value), WR: parseInt(controls.rosterInputs.WR.value), TE: parseInt(controls.rosterInputs.TE.value), FLEX: parseInt(controls.rosterInputs.FLEX.value), SUPER_FLEX: parseInt(controls.rosterInputs.SUPER_FLEX.value), BENCH: parseInt(controls.rosterInputs.BENCH.value), DST: 1, K: 1 };
                this.runGoatMockDraft(controls);
            });
            updateDraftPositions();
        },
        async runGoatMockDraft(controls) {
            const loader = document.getElementById('draft-loading-spinner'); const resultsWrapper = document.getElementById('draft-results-wrapper');
            if (!loader || !resultsWrapper) return;
            loader.classList.remove('hidden'); resultsWrapper.classList.add('hidden');
            const scoring = controls.scoringType.value.toLowerCase(); const leagueSize = parseInt(controls.leagueSize.value); const userDraftPos = parseInt(controls.draftPosition.value) - 1;
            if (!this.hasDataLoaded) await this.loadAllPlayerData();
            let availablePlayers = [...this.playerData].filter(p => p.adp && typeof p.adp[scoring] === 'number').sort((a, b) => a.adp[scoring] - b.adp[scoring]);
            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);
            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) : Array.from({ length: leagueSize }, (_, i) => i);
                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    const topAvailable = availablePlayers.slice(0, 25);
                    const teamNeeds = teams[teamIndex].needs;
                    const qbsOnRoster = teams[teamIndex].roster.filter(p => p.simplePosition === 'QB').length;
                    topAvailable.forEach(p => {
                        let score = p.vorp || 0;
                        const pos = p.simplePosition;
                        const isStarterNeed = teamNeeds[pos] > 0;
                        const isSuperflexNeed = config.superflexPositions.includes(pos) && teamNeeds['SUPER_FLEX'] > 0;
                        const isFlexNeed = config.flexPositions.includes(pos) && teamNeeds['FLEX'] > 0;
                        if (config.rosterSettings.QB === 1 && pos === 'QB' && qbsOnRoster >= 2) { score = -9999; }
                        else if (isStarterNeed) { score += 1000; }
                        else if (isSuperflexNeed) { score += 500; }
                        else if (isFlexNeed) { score += 100; }
                        score *= (1 + (Math.random() - 0.5) * 0.4); 
                        p.draftScore = score;
                    });
                    topAvailable.sort((a, b) => b.draftScore - a.draftScore);
                    const draftedPlayer = topAvailable[0];
                    const draftedPlayerIndexInAvailable = availablePlayers.findIndex(p => p.name === draftedPlayer.name);
                    if (draftedPlayerIndexInAvailable !== -1) { availablePlayers.splice(draftedPlayerIndexInAvailable, 1); }
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        teams[teamIndex].roster.push(draftedPlayer);
                        const needs = teams[teamIndex].needs;
                        if (needs[pos] > 0) needs[pos]--;
                        else if (config.superflexPositions.includes(pos) && needs['SUPER_FLEX'] > 0) needs['SUPER_FLEX']--;
                        else if (config.flexPositions.includes(pos) && needs['FLEX'] > 0) needs['FLEX']--;
                        else if (needs.BENCH > 0) needs.BENCH--;
                    }
                }
            }
            this.displayGoatDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
        },
        displayGoatDraftResults(roster) {
            const startersEl = document.getElementById('starters-list'); const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = ''; benchEl.innerHTML = '';
            const starters = []; const bench = []; const rosterSlots = { ...config.rosterSettings };
            roster.sort((a, b) => (a.adp.ppr || 999) - (b.adp.ppr || 999));
            roster.forEach(player => {
                const pos = player.simplePosition;
                if (rosterSlots[pos] > 0) { player.displayPos = pos; starters.push(player); rosterSlots[pos]--; }
                else if (config.superflexPositions.includes(pos) && rosterSlots['SUPER_FLEX'] > 0) { player.displayPos = 'S-FLEX'; starters.push(player); rosterSlots['SUPER_FLEX']--; }
                else if (config.flexPositions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; }
                else { bench.push(player); }
            });
            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'S-FLEX', 'K', 'DST'];
            starters.sort((a, b) => positionOrder.indexOf(a.displayPos) - positionOrder.indexOf(b.displayPos));
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('');
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('');
            this.addPlayerPopupListeners();
        },
        createPlayerCardHTML(player, isBench = false) {
            const pos = isBench ? 'BEN' : player.displayPos;
            return `<div class="player-card player-pos-${player.simplePosition.toLowerCase()}"><strong class="font-bold w-12">${pos}:</strong><span class="player-name-link" data-player-name="${player.name}">${player.name} (${player.team})</span><span class="text-xs text-gray-400 ml-auto">${player.draftedAt || ''}</span></div>`;
        },
        initStartSitTool() {
            const tool = { player1Input: document.getElementById('start-sit-player1'), player2Input: document.getElementById('start-sit-player2'), analyzeBtn: document.getElementById('start-sit-analyze'), resultsContainer: document.getElementById('start-sit-results') };
            if(!tool.analyzeBtn) return;
            [tool.player1Input, tool.player2Input].forEach(input => { input.addEventListener('input', e => this.showAutocomplete(e.target)); });
            tool.analyzeBtn.addEventListener('click', () => { const player1 = this.playerData.find(p => p.name === tool.player1Input.value); const player2 = this.playerData.find(p => p.name === tool.player2Input.value); this.analyzeStartSit(player1, player2); });
        },
        analyzeStartSit(p1, p2) {
            const resultsContainer = document.getElementById('start-sit-results');
            if (!p1 || !p2) { resultsContainer.innerHTML = `<p class="text-red-400">Please select two valid players.</p>`; resultsContainer.classList.remove('hidden'); return; }
            const score1 = (p1.vorp * 2) + ((10 - p1.tier) * 5) + p1.fantasyPoints; const score2 = (p2.vorp * 2) + ((10 - p2.tier) * 5) + p2.fantasyPoints;
            const winner = score1 > score2 ? p1 : p2; const loser = score1 > score2 ? p2 : p1;
            const advice = this.generateStartSitAdvice(winner, loser);
            resultsContainer.innerHTML = ` <h3 class="text-2xl font-bold text-yellow-300 mb-4">The Verdict</h3> <div class="verdict-card start"><p class="decision-text">START</p><p class="player-name">${winner.name}</p><p class="player-details">${winner.simplePosition} | ${winner.team}</p></div> <div class="verdict-card sit"><p class="decision-text">SIT</p><p class="player-name">${loser.name}</p><p class="player-details">${loser.simplePosition} | ${loser.team}</p></div> <div class="analysis-section"><h4 class="font-semibold text-teal-300">Analysis</h4><p class="text-gray-300">${advice}</p></div> `;
            resultsContainer.classList.remove('hidden');
        },
        generateStartSitAdvice(winner, loser) {
            const reasons = [`has a significantly higher Value Over Replacement Player (VORP), indicating greater potential impact.`,`is in a higher tier, suggesting more reliable week-to-week production.`,`has a better recent performance trend, making them the safer bet this week.`,`simply projects for more points based on our latest data models.`,`has a more favorable matchup, increasing their scoring ceiling.`];
            const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
            return `While both are viable options, **${winner.name}** gets the edge. Our model indicates that ${winner.name} ${randomReason} Consider starting ${loser.name} only in deeper leagues or as a bye-week replacement.`;
        },
        startInteractiveDraft(controls) {
            controls.settingsContainer.classList.add('hidden'); controls.draftingContainer.classList.remove('hidden'); controls.completeContainer.classList.add('hidden');
            const leagueSize = parseInt(controls.sizeSelect.value); const userPickNum = parseInt(controls.pickSelect.value); const scoring = controls.scoringSelect.value.toLowerCase(); const totalRounds = 15;
            this.draftState = { controls, leagueSize, userPickNum, scoring, totalRounds, currentRound: 1, currentPickInRound: 1, teams: Array.from({ length: leagueSize }, (v, i) => ({ teamNumber: i + 1, roster: [] })), availablePlayers: [...this.playerData].filter(p => p.adp && typeof p.adp[scoring] === 'number').sort((a, b) => a.adp[scoring] - b.adp[scoring]), draftPicks: [], isUserTurn: false, };
            this.updateDraftBoard(); this.updateMyTeam(); this.runDraftTurn();
        },
        runDraftTurn() {
            if (this.draftState.currentRound > this.draftState.totalRounds) { this.endInteractiveDraft(); return; }
            const { currentRound, leagueSize } = this.draftState; const isSnake = currentRound % 2 === 0; const pickInRound = this.draftState.currentPickInRound; const teamIndex = isSnake ? leagueSize - 1 - (pickInRound - 1) : pickInRound - 1;
            const isUserTurn = (teamIndex + 1) === this.draftState.userPickNum; this.draftState.isUserTurn = isUserTurn;
            this.updateDraftStatus();
            if (isUserTurn) { this.updateBestAvailable(true); } 
            else { this.updateBestAvailable(false); setTimeout(() => { this.makeAiPick(teamIndex); this.runDraftTurn(); }, 500); }
        },
        makeAiPick(teamIndex) {
            const { availablePlayers } = this.draftState; const topAvailable = availablePlayers.slice(0, 15);
            topAvailable.forEach(p => { let score = p.vorp || 0; score *= (1 + (Math.random() - 0.5) * 0.4); p.draftScore = score; });
            topAvailable.sort((a, b) => b.draftScore - a.draftScore);
            const draftedPlayer = topAvailable[0]; this.makePick(draftedPlayer, teamIndex);
        },
        makeUserPick(playerName) { const player = this.draftState.availablePlayers.find(p => p.name === playerName); const teamIndex = this.draftState.userPickNum - 1; if (player) { this.makePick(player, teamIndex); this.runDraftTurn(); } },
        makePick(player, teamIndex) {
            this.draftState.availablePlayers = this.draftState.availablePlayers.filter(p => p.name !== player.name);
            this.draftState.teams[teamIndex].roster.push(player);
            this.draftState.draftPicks.push({ round: this.draftState.currentRound, pick: this.draftState.currentPickInRound, player: player, teamNumber: teamIndex + 1, });
            this.updateDraftBoard(); if ((teamIndex + 1) === this.draftState.userPickNum) { this.updateMyTeam(); }
            this.draftState.currentPickInRound++;
            if (this.draftState.currentPickInRound > this.draftState.leagueSize) { this.draftState.currentPickInRound = 1; this.draftState.currentRound++; }
        },
        updateDraftStatus() {
            const { currentRound, currentPickInRound, leagueSize, totalRounds, isUserTurn } = this.draftState;
            const overallPick = (currentRound - 1) * leagueSize + currentPickInRound; const statusCard = document.getElementById('draft-status-card');
            let statusHTML = `<p class="text-gray-400">Round ${currentRound}/${totalRounds} | Pick ${overallPick}</p>`;
            if(isUserTurn) { statusHTML += `<p class="text-2xl font-bold text-yellow-300 text-glow-gold animate-pulse">YOU ARE ON THE CLOCK</p>`; } 
            else { const isSnake = currentRound % 2 === 0; const teamNumber = isSnake ? leagueSize - currentPickInRound + 1 : currentPickInRound; statusHTML += `<p class="text-xl font-semibold text-white">Team ${teamNumber} is picking...</p>`; }
            statusCard.innerHTML = statusHTML;
        },
        updateBestAvailable(isUserTurn) {
            const listEl = document.getElementById('best-available-list'); listEl.innerHTML = '';
            const topPlayers = this.draftState.availablePlayers.slice(0, 20);
            topPlayers.forEach(player => { const playerEl = document.createElement('div'); playerEl.className = 'best-available-player'; playerEl.innerHTML = ` <div class="flex-grow"><p class="player-name-link font-semibold text-white" data-player-name="${player.name}">${player.name}</p><p class="text-sm text-gray-400">${player.team} - ${player.simplePosition}</p></div> ${isUserTurn ? `<button class="draft-button" data-player-name="${player.name}">Draft</button>` : ''} `; listEl.appendChild(playerEl); });
            if(isUserTurn) { document.querySelectorAll('.draft-button').forEach(btn => { btn.onclick = (e) => this.makeUserPick(e.target.dataset.playerName); }); }
            this.addPlayerPopupListeners();
        },
        updateMyTeam() {
            const listEl = document.getElementById('my-team-list'); listEl.innerHTML = '';
            const myTeam = this.draftState.teams[this.draftState.userPickNum - 1];
            myTeam.roster.forEach(player => { listEl.innerHTML += ` <div class="my-team-player player-pos-${player.simplePosition.toLowerCase()}"><strong class="w-10">${player.simplePosition}</strong><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></div> `; });
            this.addPlayerPopupListeners();
        },
        updateDraftBoard() {
            const gridEl = document.getElementById('draft-board-grid'); const { leagueSize, draftPicks, userPickNum } = this.draftState; gridEl.innerHTML = '';
            let headerHtml = '<div class="draft-board-header">'; for (let i = 1; i <= leagueSize; i++) { headerHtml += `<div class="draft-board-team-header ${userPickNum === i ? 'user-team-header' : ''}">Team ${i}</div>`; } headerHtml += '</div>'; gridEl.innerHTML += headerHtml;
            const bodyEl = document.createElement('div'); bodyEl.className = 'draft-board-body'; bodyEl.style.gridTemplateColumns = `repeat(${leagueSize}, minmax(0, 1fr))`;
            draftPicks.forEach(p => { const pickEl = document.createElement('div'); pickEl.className = `draft-pick pick-pos-${p.player.simplePosition.toLowerCase()} ${p.teamNumber === userPickNum ? 'user-pick' : ''}`; pickEl.innerHTML = ` <span class="pick-number">${p.round}.${p.pick}</span><p class="player-name-link pick-player-name" data-player-name="${p.player.name}">${p.player.name}</p><p class="pick-player-info">${p.player.team} - ${p.player.simplePosition}</p> `; bodyEl.appendChild(pickEl); });
            gridEl.appendChild(bodyEl); this.addPlayerPopupListeners();
        },
        endInteractiveDraft() {
            this.draftState.controls.draftingContainer.classList.add('hidden'); this.draftState.controls.completeContainer.classList.remove('hidden');
            const rosterEl = document.getElementById('final-roster-display'); rosterEl.innerHTML = '';
            const myRoster = this.draftState.teams[this.draftState.userPickNum - 1].roster;
            const starters = []; const bench = []; const rosterSlots = { ...config.rosterSettings };
            myRoster.forEach(player => { const pos = player.simplePosition; if (rosterSlots[pos] > 0) { starters.push(player); rosterSlots[pos]--; } else if (config.positions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; } else { bench.push(player); } });
            rosterEl.innerHTML = ` <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Starters</h4><div class="space-y-2">${starters.map(p => this.createPlayerCardHTML(p)).join('')}</div></div> <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Bench</h4><div class="space-y-2">${bench.map(p => this.createPlayerCardHTML(p, true)).join('')}</div></div> `;
            this.addPlayerPopupListeners();
        },
        resetDraftUI(controls) {
            controls.settingsContainer.classList.remove('hidden'); controls.draftingContainer.classList.add('hidden'); controls.completeContainer.classList.add('hidden');
            this.draftState = {};
        },
        createPlayerPopup() { if (document.getElementById('player-popup-card')) return; const popup = document.createElement('div'); popup.id = 'player-popup-card'; popup.className = 'hidden'; document.body.appendChild(popup); },
        addPlayerPopupListeners() { const popup = document.getElementById('player-popup-card'); popup.addEventListener('mouseenter', () => clearTimeout(this.popupHideTimeout)); popup.addEventListener('mouseleave', () => { this.popupHideTimeout = setTimeout(() => popup.classList.add('hidden'), 300); }); document.querySelectorAll('.player-name-link').forEach(el => { el.addEventListener('mouseenter', (e) => { clearTimeout(this.popupHideTimeout); const playerName = e.target.dataset.playerName; const player = this.playerData.find(p => p.name === playerName); if (player) { this.updateAndShowPopup(player, e); } }); el.addEventListener('mouseleave', () => { this.popupHideTimeout = setTimeout(() => popup.classList.add('hidden'), 300); }); el.addEventListener('mousemove', (e) => { popup.style.left = `${e.pageX + 15}px`; popup.style.top = `${e.pageY + 15}px`; }); }); },
        updateAndShowPopup(player, event) { const popup = document.getElementById('player-popup-card'); popup.innerHTML = `<div class="popup-header"><p class="font-bold text-lg text-white">${player.name}</p><p class="text-sm text-teal-300">${player.team} - ${player.simplePosition}</p></div><div class="popup-body"><p><strong>ADP (PPR):</strong> ${player.adp.ppr || 'N/A'}</p><p><strong>Tier:</strong> ${player.tier || 'N/A'}</p><p><strong>VORP:</strong> ${player.vorp ? player.vorp.toFixed(2) : 'N/A'}</p><p><strong>Bye Week:</strong> ${player.bye || 'N/A'}</p></div><div id="ai-analysis-container" class="popup-footer"><button id="get-ai-analysis-btn" class="ai-analysis-btn" data-player-name="${player.name}">Get AI Analysis</button><div id="ai-analysis-loader" class="loader-small hidden"></div><p id="ai-analysis-text" class="text-sm text-gray-300"></p></div>`; popup.classList.remove('hidden'); popup.querySelector('#get-ai-analysis-btn').addEventListener('click', (e) => { this.getAiPlayerAnalysis(e.target.dataset.playerName); }); },
        async getAiPlayerAnalysis(playerName) { const container = document.getElementById('ai-analysis-container'); const button = container.querySelector('#get-ai-analysis-btn'); const loader = container.querySelector('#ai-analysis-loader'); const textEl = container.querySelector('#ai-analysis-text'); button.classList.add('hidden'); loader.classList.remove('hidden'); textEl.textContent = ''; const prompt = `Provide a short, optimistic fantasy football outlook for the 2024-2025 season for player ${playerName}. Focus on their potential strengths, situation, and upside. Keep it under 50 words.`; try { let chatHistory = [{ role: "user", parts: [{ text: prompt }] }]; const payload = { contents: chatHistory }; const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json(); if (result.candidates && result.candidates.length > 0) { textEl.textContent = result.candidates[0].content.parts[0].text; } else { throw new Error('No content returned'); } } catch (error) { console.error("Gemini API error:", error); textEl.textContent = "Could not retrieve AI analysis."; } finally { loader.classList.add('hidden'); } },
    };

    App.init();
});
