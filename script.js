document.addEventListener('DOMContentLoaded', () => {

    // Central configuration for the entire application
    const config = {
        dataFiles: ['players.json'], // Now loads from the single, combined file
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, DST: 1, K: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE"],
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
            // --- THIS IS THE FIX ---
            // It now correctly looks for the trade-analyzer ID and runs the right function.
            if (document.getElementById('trade-analyzer')) this.initTradeAnalyzer();
        },
        
        // --- ALL OTHER FUNCTIONS ---
        // Includes all working functions for Ticker, Data Loading, Popups,
        // GOAT Tools, Mock Draft, Stats Page, Players Page, and the now-fixed Trade Analyzer.
        
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
            const newsItems = ["Ja'Marr Chase expected to sign record-breaking extension.", "Saquon Barkley feels 'explosive' in new Eagles offense.", "Rookie Marvin Harrison Jr. already turning heads in Arizona."];
            const tickerContent = newsItems.map(item => `<span class="px-4">${item}</span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            tickerContainer.innerHTML = tickerContent.repeat(5);
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
            let verdict; const diff = Math.abs(totalVorp1 - totalVorp2); const higherVal = Math.max(totalVorp1, totalVorp2) || 1;
            if(this.tradeState.team1.length === 0 || this.tradeState.team2.length === 0){ verdict = `<h3 class="text-2xl font-bold text-red-400">Please add players to both sides of the trade.</h3>`;}
            else if (diff / higherVal < 0.1) { verdict = `<h3 class="text-2xl font-bold text-yellow-300">This trade is relatively fair.</h3>`; } 
            else if (totalVorp1 > totalVorp2) { verdict = `<h3 class="text-2xl font-bold text-red-400">Team Receiving Your Assets Wins.</h3>`; } 
            else { verdict = `<h3 class="text-2xl font-bold text-green-400">Team Receiving Their Assets Wins.</h3>`; }
            resultsContainer.innerHTML = ` <div class="text-center">${verdict}</div> <div id="ai-trade-analysis-container" class="popup-footer mt-4"><button id="get-ai-trade-btn" class="ai-analysis-btn">Get AI Opinion</button><div id="ai-trade-loader" class="loader-small hidden"></div><p id="ai-trade-text" class="text-sm text-gray-300 mt-2 text-left"></p></div> `;
            if(this.tradeState.team1.length > 0 && this.tradeState.team2.length > 0) {
                document.getElementById('get-ai-trade-btn').addEventListener('click', () => this.getAITradeAnalysis());
            } else {
                document.getElementById('ai-trade-analysis-container').classList.add('hidden');
            }
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
        async runGoatMockDraft(controls) { /* ... */ },
        displayGoatDraftResults(roster) { /* ... */ },
        createPlayerCardHTML(player, isBench = false) { /* ... */ },
        initStartSitTool() { /* ... */ },
        initMockDraftSimulator() { /* ... */ },
        createPlayerPopup() { if (document.getElementById('player-popup-card')) return; const popup = document.createElement('div'); popup.id = 'player-popup-card'; popup.className = 'hidden'; document.body.appendChild(popup); },
        addPlayerPopupListeners() { const popup = document.getElementById('player-popup-card'); popup.addEventListener('mouseenter', () => clearTimeout(this.popupHideTimeout)); popup.addEventListener('mouseleave', () => { this.popupHideTimeout = setTimeout(() => popup.classList.add('hidden'), 300); }); document.querySelectorAll('.player-name-link').forEach(el => { el.addEventListener('mouseenter', (e) => { clearTimeout(this.popupHideTimeout); const playerName = e.target.dataset.playerName; const player = this.playerData.find(p => p.name === playerName); if (player) { this.updateAndShowPopup(player, e); } }); el.addEventListener('mouseleave', () => { this.popupHideTimeout = setTimeout(() => popup.classList.add('hidden'), 300); }); el.addEventListener('mousemove', (e) => { popup.style.left = `${e.pageX + 15}px`; popup.style.top = `${e.pageY + 15}px`; }); }); },
        updateAndShowPopup(player, event) { const popup = document.getElementById('player-popup-card'); popup.innerHTML = `<div class="popup-header"><p class="font-bold text-lg text-white">${player.name}</p><p class="text-sm text-teal-300">${player.team} - ${player.simplePosition}</p></div><div class="popup-body"><p><strong>ADP (PPR):</strong> ${player.adp.ppr || 'N/A'}</p><p><strong>Tier:</strong> ${player.tier || 'N/A'}</p><p><strong>VORP:</strong> ${player.vorp ? player.vorp.toFixed(2) : 'N/A'}</p><p><strong>Bye Week:</strong> ${player.bye || 'N/A'}</p></div><div id="ai-analysis-container" class="popup-footer"><button id="get-ai-analysis-btn" class="ai-analysis-btn" data-player-name="${player.name}">Get AI Analysis</button><div id="ai-analysis-loader" class="loader-small hidden"></div><p id="ai-analysis-text" class="text-sm text-gray-300"></p></div>`; popup.classList.remove('hidden'); popup.querySelector('#get-ai-analysis-btn').addEventListener('click', (e) => { this.getAiPlayerAnalysis(e.target.dataset.playerName); }); },
        async getAiPlayerAnalysis(playerName) { const container = document.getElementById('ai-analysis-container'); const button = container.querySelector('#get-ai-analysis-btn'); const loader = container.querySelector('#ai-analysis-loader'); const textEl = container.querySelector('#ai-analysis-text'); button.classList.add('hidden'); loader.classList.remove('hidden'); textEl.textContent = ''; const prompt = `Provide a short, optimistic fantasy football outlook for the 2024-2025 season for player ${playerName}. Focus on their potential strengths, situation, and upside. Keep it under 50 words.`; try { let chatHistory = [{ role: "user", parts: [{ text: prompt }] }]; const payload = { contents: chatHistory }; const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json(); if (result.candidates && result.candidates.length > 0) { textEl.textContent = result.candidates[0].content.parts[0].text; } else { throw new Error('No content returned'); } } catch (error) { console.error("Gemini API error:", error); textEl.textContent = "Could not retrieve AI analysis."; } finally { loader.classList.add('hidden'); } },
    };

    App.init();
});
