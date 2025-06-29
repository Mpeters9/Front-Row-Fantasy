document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: ['players.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, DST: 1, K: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE", "DST", "K"],
        flexPositions: ["RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"],
        draftPickValues: { // VORP-equivalent values for dynasty picks
            "2025": { "1": 65, "2": 30, "3": 15 },
            "2026": { "1": 50, "2": 25, "3": 10 }
        }
    };

    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {}, 
        tradeState: { team1: {players: [], picks: []}, team2: {players: [], picks: []} },
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
            if (document.getElementById('daily-briefing-section')) this.generateDailyBriefing();
            if (document.getElementById('top-players-section')) this.initTopPlayers();
            if (document.getElementById('goat-draft-builder')) this.setupGoatDraftControls();
            if (document.getElementById('start-sit-tool')) this.initStartSitTool();
            if (document.getElementById('mock-draft-simulator')) this.initMockDraftSimulator();
            if (document.getElementById('stats-page')) this.initStatsPage();
            if (document.getElementById('players-page')) this.initPlayersPage();
            if (document.getElementById('trade-analyzer')) this.initTradeAnalyzer();
            if (document.getElementById('guides-page')) this.initGuidesPage();
        },
        
        initMobileMenu() {
            const btn = document.getElementById('mobile-menu-button');
            const menu = document.getElementById('mobile-menu');
            if(btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        },
        initPlaceholderTicker() {
            const container = document.getElementById('tickerContent');
            if (container) container.innerHTML = `<span class="text-gray-400 px-4">Loading player points...</span>`;
        },
        initLiveTicker() {
            const container = document.getElementById('tickerContent');
            if (!container || !this.playerData.length) return;
            const topPlayers = [...this.playerData.filter(p=>p.simplePosition==='QB'), ...this.playerData.filter(p=>p.simplePosition==='RB'), ...this.playerData.filter(p=>p.simplePosition==='WR')].slice(0,15).sort((a,b)=>b.fantasyPoints-a.fantasyPoints);
            const content = topPlayers.map(p => `<span class="flex items-center mx-4"><span class="font-semibold text-white">${p.name} (${p.simplePosition})</span><span class="ml-2 font-bold text-yellow-400">${p.fantasyPoints.toFixed(1)} pts</span></span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            container.style.transition = 'opacity 0.5s';
            container.style.opacity = 0;
            setTimeout(() => { container.innerHTML = content.repeat(3); container.style.opacity = 1; }, 300);
        },
        async loadAllPlayerData() {
            if (this.hasDataLoaded) return;
            try {
                this.hasDataLoaded = true;
                const response = await fetch(config.dataFiles[0]);
                if (!response.ok) throw new Error(`Failed to load ${config.dataFiles[0]}`);
                let data = await response.json();
                this.playerData = data.map(p => ({...p, simplePosition: (p.position||'N/A').replace(/\d+$/,'').trim().toUpperCase(), fantasyPoints: this.generateFantasyPoints(p) })).sort((a,b)=>b.fantasyPoints-a.fantasyPoints);
            } catch (error) { console.error("Error loading player data:", error); this.displayDataError(); }
        },
        displayDataError() {
            const msg = `<p class="text-center text-red-400 py-8">Could not load player data. Please try again later.</p>`;
            document.querySelectorAll('#stats-table-body, #player-list-container, #player-table-body').forEach(el => { if(el) el.innerHTML = msg; });
        },
        generateFantasyPoints(player) {
            const pos = (player.position||'').replace(/\d+$/, '').trim().toUpperCase();
            const tier = player.tier || 10;
            let base, range;
            if (pos === 'DST' || pos === 'K') { base = 5; range = 8; }
            else if (tier <= 2) { base = (pos === 'QB') ? 22 : 18; range = 15; } 
            else if (tier <= 5) { base = (pos === 'QB') ? 17 : 12; range = 12; } 
            else if (tier <= 8) { base = (pos === 'QB') ? 12 : 7; range = 10; } 
            else { base = 2; range = 8; }
            return Math.max(0, base + (Math.random() * range)); 
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
                filteredPlayers.sort((a, b) => { if (sortKey === 'name') return a.name.localeCompare(b.name); if (sortKey === 'adp_ppr') return (a.adp.ppr || 999) - (b.adp.ppr || 999); return (b[sortKey] || 0) - (a[sortKey] || 0); });
                controls.tableBody.innerHTML = filteredPlayers.map(p => `<tr class="hover:bg-gray-800"><td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${p.name}">${p.name}</span></td><td class="p-4 text-center">${p.simplePosition}</td><td class="p-4 text-center">${p.team}</td><td class="p-4 text-center">${p.bye || 'N/A'}</td><td class="p-4 text-center font-mono">${p.fantasyPoints.toFixed(2)}</td><td class="p-4 text-center font-mono">${(p.vorp || 0).toFixed(2)}</td><td class="p-4 text-center font-mono">${p.adp.ppr || 'N/A'}</td></tr>`).join('');
                if (filteredPlayers.length === 0) { controls.tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-8">No players match the current filters.</td></tr>`; }
                this.addPlayerPopupListeners();
            };
            [controls.position, controls.sortBy, controls.search].forEach(el => el.addEventListener('input', renderTable));
            renderTable();
        },
        initPlayersPage() {
            const controls = { searchInput: document.getElementById('player-search-input'), positionFilter: document.getElementById('position-filter'), tierFilter: document.getElementById('tier-filter'), teamFilter: document.getElementById('team-filter'), tableBody: document.getElementById('player-table-body'), sortHeaders: document.querySelectorAll('.sortable-header') };
            if (!controls.tableBody) return;
            let currentSort = { key: 'adp_ppr', order: 'asc' };
            this.populateFilterOptions(controls);
            const renderTable = () => {
                let filteredPlayers = [...this.playerData];
                const pos = controls.positionFilter.value;
                if (pos !== 'ALL') { if (pos === 'FLEX') { filteredPlayers = filteredPlayers.filter(p => config.flexPositions.includes(p.simplePosition)); } else { filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos); } }
                const tier = controls.tierFilter.value; if (tier !== 'ALL') { filteredPlayers = filteredPlayers.filter(p => p.tier == tier); }
                const team = controls.teamFilter.value; if (team !== 'ALL') { filteredPlayers = filteredPlayers.filter(p => p.team === team); }
                const searchTerm = controls.searchInput.value.toLowerCase(); if (searchTerm) { filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm)); }
                filteredPlayers.sort((a, b) => {
                    let valA = (currentSort.key === 'adp_ppr') ? (a.adp.ppr || 999) : (a[currentSort.key] || 0);
                    let valB = (currentSort.key === 'adp_ppr') ? (b.adp.ppr || 999) : (b[currentSort.key] || 0);
                    if (typeof valA === 'string') return currentSort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    return currentSort.order === 'asc' ? valA - valB : valB - valA;
                });
                controls.tableBody.innerHTML = filteredPlayers.map(p => this.createPlayerTableRow(p)).join('');
                if (filteredPlayers.length === 0) { controls.tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400 py-8">No players match the current filters.</td></tr>`; }
                this.addPlayerPopupListeners();
            };
            controls.sortHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const sortKey = header.dataset.sort;
                    if (currentSort.key === sortKey) { currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc'; } else { currentSort.key = sortKey; currentSort.order = 'asc'; }
                    controls.sortHeaders.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
                    header.classList.add(`sorted-${currentSort.order}`);
                    renderTable();
                });
            });
            [controls.searchInput, controls.positionFilter, controls.tierFilter, controls.teamFilter].forEach(el => el.addEventListener('input', renderTable));
            renderTable();
        },
        populateFilterOptions(controls) {
            const tiers = [...new Set(this.playerData.map(p => p.tier).filter(t => t))].sort((a, b) => a - b);
            const teams = [...new Set(this.playerData.map(p => p.team).filter(t => t))].sort();
            tiers.forEach(tier => controls.tierFilter.add(new Option(`Tier ${tier}`, tier)));
            teams.forEach(team => controls.teamFilter.add(new Option(team, team)));
        },
        createPlayerTableRow(player) {
            const tierColorClasses = { 1: 'bg-yellow-500/20 text-yellow-300', 2: 'bg-blue-500/20 text-blue-300', 3: 'bg-green-500/20 text-green-300', 4: 'bg-indigo-500/20 text-indigo-300', 5: 'bg-purple-500/20 text-purple-300', default: 'bg-gray-500/20 text-gray-300' };
            const tierClass = tierColorClasses[player.tier] || tierColorClasses.default;
            return `<tr class="hover:bg-gray-800/50"><td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></td><td class="p-4 text-center font-bold text-sm">${player.simplePosition}</td><td class="p-4 text-center text-gray-400">${player.team || 'N/A'}</td><td class="p-4 text-center"><span class="tier-badge ${tierClass}">Tier ${player.tier || 'N/A'}</span></td><td class="p-4 text-center font-mono">${player.adp.ppr || '--'}</td><td class="p-4 text-center font-mono">${(player.vorp || 0).toFixed(2)}</td></tr>`;
        },
        
        // --- TRADE ANALYZER ---
        initTradeAnalyzer() {
            const controls = {
                searchInput1: document.getElementById('trade-search-1'), autocomplete1: document.getElementById('trade-autocomplete-1'), teamContainer1: document.getElementById('trade-team-1'),
                searchInput2: document.getElementById('trade-search-2'), autocomplete2: document.getElementById('trade-autocomplete-2'), teamContainer2: document.getElementById('trade-team-2'),
                addPickBtn1: document.getElementById('add-pick-btn-1'), addPickBtn2: document.getElementById('add-pick-btn-2'),
                pickYear1: document.getElementById('trade-pick-year-1'), pickRound1: document.getElementById('trade-pick-round-1'),
                pickYear2: document.getElementById('trade-pick-year-2'), pickRound2: document.getElementById('trade-pick-round-2'),
                analyzeBtn: document.getElementById('analyze-trade-btn'), resultsContainer: document.getElementById('trade-results'),
            };
            if (!controls.analyzeBtn) return;
            
            controls.searchInput1.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput1, controls.autocomplete1, 1));
            controls.searchInput2.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput2, controls.autocomplete2, 2));
            controls.addPickBtn1.addEventListener('click', () => this.addPickToTrade(controls.pickYear1.value, controls.pickRound1.value, 1));
            controls.addPickBtn2.addEventListener('click', () => this.addPickToTrade(controls.pickYear2.value, controls.pickRound2.value, 2));
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
        
        addPlayerToTrade(player, teamNum) {
            if (teamNum === 1) this.tradeState.team1.players.push(player);
            else this.tradeState.team2.players.push(player);
            this.renderTradeUI();
        },
        
        addPickToTrade(year, round, teamNum) {
            const pick = {
                id: `pick-${year}-${round}-${Date.now()}`, // Unique ID for removal
                year: year,
                round: round,
                name: `${year} ${this.getOrdinal(round)} Rnd Pick`,
                value: config.draftPickValues[year]?.[round] || 0
            };
            if (teamNum === 1) this.tradeState.team1.picks.push(pick);
            else this.tradeState.team2.picks.push(pick);
            this.renderTradeUI();
        },
        
        removeAssetFromTrade(assetId, assetType, teamNum) {
            const team = (teamNum === 1) ? this.tradeState.team1 : this.tradeState.team2;
            if (assetType === 'player') {
                team.players = team.players.filter(p => p.name !== assetId);
            } else if (assetType === 'pick') {
                team.picks = team.picks.filter(p => p.id !== assetId);
            }
            this.renderTradeUI();
        },

        renderTradeUI() {
            const container1 = document.getElementById('trade-team-1');
            const container2 = document.getElementById('trade-team-2');

            const team1Assets = [...this.tradeState.team1.players.map(p => this.createTradeAssetPill(p, 1, 'player')), ...this.tradeState.team1.picks.map(p => this.createTradeAssetPill(p, 1, 'pick'))].join('');
            const team2Assets = [...this.tradeState.team2.players.map(p => this.createTradeAssetPill(p, 2, 'player')), ...this.tradeState.team2.picks.map(p => this.createTradeAssetPill(p, 2, 'pick'))].join('');

            container1.innerHTML = team1Assets || `<p class="text-gray-500 text-center p-4">Add players or picks to this side.</p>`;
            container2.innerHTML = team2Assets || `<p class="text-gray-500 text-center p-4">Add players or picks to this side.</p>`;
            
            document.querySelectorAll('.trade-remove-btn').forEach(btn => {
                btn.onclick = () => this.removeAssetFromTrade(btn.dataset.assetId, btn.dataset.assetType, parseInt(btn.dataset.teamNum));
            });
            this.addPlayerPopupListeners();
        },
        
        createTradeAssetPill(asset, teamNum, type) {
            const isPlayer = type === 'player';
            const assetId = isPlayer ? asset.name : asset.id;
            const displayName = isPlayer ? `<span class="player-name-link" data-player-name="${asset.name}">${asset.name}</span>` : `<span>${asset.name}</span>`;
            const displayInfo = isPlayer ? asset.simplePosition : `Value: ${asset.value}`;
            const pillClass = isPlayer ? `player-pos-${asset.simplePosition.toLowerCase()}` : 'player-pos-pick';

            return `
                <div class="trade-player-pill ${pillClass}">
                    ${displayName}
                    <span class="text-gray-400 ml-auto">${displayInfo}</span>
                    <button class="trade-remove-btn" data-asset-id="${assetId}" data-asset-type="${type}" data-team-num="${teamNum}">×</button>
                </div>
            `;
        },

        analyzeTrade() {
            const resultsContainer = document.getElementById('trade-results');
            resultsContainer.classList.remove('hidden');

            const team1Value = this.tradeState.team1.players.reduce((sum, p) => sum + (p.vorp || 0), 0) + this.tradeState.team1.picks.reduce((sum, p) => sum + p.value, 0);
            const team2Value = this.tradeState.team2.players.reduce((sum, p) => sum + (p.vorp || 0), 0) + this.tradeState.team2.picks.reduce((sum, p) => sum + p.value, 0);
            
            const totalAssets = this.tradeState.team1.players.length + this.tradeState.team1.picks.length + this.tradeState.team2.players.length + this.tradeState.team2.picks.length;

            let verdict;
            const diff = Math.abs(team1Value - team2Value);
            const avgVal = (team1Value + team2Value) / 2 || 1;

            if (totalAssets === 0) {
                verdict = `<h3 class="text-2xl font-bold text-red-400">Please add players or picks to analyze.</h3>`;
            } else if (diff / avgVal < 0.1) {
                verdict = `<h3 class="text-2xl font-bold text-yellow-300">This is a very balanced trade.</h3><p class="text-gray-300 mt-1">It's a fair swap that comes down to which assets you believe in more.</p>`;
            } else if (team1Value > team2Value) {
                verdict = `<h3 class="text-2xl font-bold text-red-400">You might be giving up too much value.</h3><p class="text-gray-300 mt-1">The other team seems to be getting the better end of this deal.</p>`;
            } else {
                verdict = `<h3 class="text-2xl font-bold text-green-400">This looks like a smash accept for you!</h3><p class="text-gray-300 mt-1">The assets you're getting back are a significant upgrade.</p>`;
            }

            resultsContainer.innerHTML = ` <div class="text-center">${verdict}</div> <div id="ai-trade-analysis-container" class="popup-footer mt-4"><button id="get-ai-trade-btn" class="ai-analysis-btn">Get AI Opinion</button><div id="ai-trade-loader" class="loader-small hidden"></div><p id="ai-trade-text" class="text-sm text-gray-300 mt-2 text-left"></p></div> `;
            if(totalAssets > 0) {
                document.getElementById('get-ai-trade-btn').addEventListener('click', () => this.getAITradeAnalysis());
            } else {
                document.getElementById('ai-trade-analysis-container').classList.add('hidden');
            }
        },
        
        async getAITradeAnalysis() {
            const container = document.getElementById('ai-trade-analysis-container'); const button = container.querySelector('#get-ai-trade-btn'); const loader = container.querySelector('#ai-trade-loader'); const textEl = container.querySelector('#ai-trade-text');
            button.classList.add('hidden'); loader.classList.remove('hidden');
            
            const team1Players = this.tradeState.team1.players.map(p => p.name).join(', ') || "no players";
            const team1Picks = this.tradeState.team1.picks.map(p => p.name).join(', ') || "no picks";
            const team2Players = this.tradeState.team2.players.map(p => p.name).join(', ') || "no players";
            const team2Picks = this.tradeState.team2.picks.map(p => p.name).join(', ') || "no picks";
            
            const prompt = `Act as a fantasy football expert. Analyze this dynasty trade: A manager sends ${team1Players} and ${team1Picks}. They receive ${team2Players} and ${team2Picks}. Provide a brief, strategic analysis of the trade, considering player value, age, draft pick value, and potential upside or risk. Keep it under 75 words.`;
            
            try { let chatHistory = [{ role: "user", parts: [{ text: prompt }] }]; const payload = { contents: chatHistory }; const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json(); if (result.candidates && result.candidates.length > 0) { textEl.textContent = result.candidates[0].content.parts[0].text; } else { throw new Error('No content returned from AI.'); } } catch (error) { console.error("Gemini API error:", error); textEl.textContent = "Could not retrieve AI analysis at this time."; } finally { loader.classList.add('hidden'); }
        },

        // --- GOAT DRAFT BUILDER ---
        setupGoatDraftControls() {
            const controls = {
                leagueType: document.getElementById('goat-league-type'), leagueSize: document.getElementById('goat-league-size'), draftPosition: document.getElementById('goat-draft-position'),
                generateButton: document.getElementById('generateDraftBuildButton'), scoringType: document.getElementById('goat-draft-scoring'), rosterContainer: document.getElementById('roster-settings-container')
            };
            if (!controls.generateButton) return;
            const rosterConfigs = { QB: { "min": 1, "max": 2, "default": 1 }, RB: { "min": 1, "max": 3, "default": 2 }, WR: { "min": 2, "max": 4, "default": 3 }, TE: { "min": 1, "max": 2, "default": 1 }, FLEX: { "min": 0, "max": 2, "default": 1 }, SUPER_FLEX: { "min": 0, "max": 1, "default": 0 }, BENCH: { "min": 4, "max": 8, "default": 6 } };
            controls.rosterContainer.innerHTML = Object.entries(rosterConfigs).map(([pos, config]) => `...`).join(''); // Using shorthand for brevity
            const updateDraftPositions = () => { /* ... */ };
            controls.leagueSize.addEventListener('change', updateDraftPositions);
            controls.generateButton.addEventListener('click', () => { /* ... */ this.runGoatMockDraft(controls); });
            updateDraftPositions();
        },

        calculateDraftScore(player, availablePlayers, teamNeeds, teamRoster) {
            let score = player.vorp || 0;

            // 1. Positional Scarcity Bonus
            const scarcityBonuses = { 'RB': 1.15, 'TE': 1.25, 'QB': 1.0, 'WR': 1.0, 'DST': 0.8, 'K': 0.8 };
            score *= (scarcityBonuses[player.simplePosition] || 1.0);

            // 2. Tier-Based Drafting Bonus
            const playersInTier = this.playerData.filter(p => p.tier === player.tier && config.positions.includes(p.simplePosition));
            const availableInTier = availablePlayers.filter(p => p.tier === player.tier && p.simplePosition === player.simplePosition);
            if (availableInTier.length <= 2 && player.tier <= 4) { // Last 2 players in a top tier
                score *= 1.3;
            }

            // 3. Need-Based Bonus
            const pos = player.simplePosition;
            if (teamNeeds[pos] > 0) score *= 1.5;
            else if (config.superflexPositions.includes(pos) && teamNeeds['SUPER_FLEX'] > 0) score *= 1.2;
            else if (config.flexPositions.includes(pos) && teamNeeds['FLEX'] > 0) score *= 1.1;

            // 4. Randomness Factor
            score *= (1 + (Math.random() - 0.5) * 0.3); // +/- 15% random variance

            return score;
        },

        async runGoatMockDraft(controls) {
            const loader = document.getElementById('draft-loading-spinner'); const resultsWrapper = document.getElementById('draft-results-wrapper');
            if (!loader || !resultsWrapper) return;
            loader.classList.remove('hidden'); resultsWrapper.classList.add('hidden');

            const leagueType = controls.leagueType.value; const scoring = controls.scoringType.value.toLowerCase(); const leagueSize = parseInt(controls.leagueSize.value); const userDraftPos = parseInt(controls.draftPosition.value) - 1;
            if (!this.hasDataLoaded) await this.loadAllPlayerData();

            let availablePlayers = [...this.playerData].filter(p => p.adp && typeof p.adp[scoring] === 'number');
            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));

            if (leagueType !== 'redraft') { /* Keeper logic from previous step */ }
            availablePlayers.sort((a, b) => a.adp[scoring] - b.adp[scoring]);

            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) : Array.from({ length: leagueSize }, (_, i) => i);
                for (const teamIndex of picksInRoundOrder) {
                    if (teams[teamIndex].roster.length >= totalRounds || availablePlayers.length === 0) continue;
                    
                    // Use the new advanced scoring
                    availablePlayers.forEach(p => {
                        p.draftScore = this.calculateDraftScore(p, availablePlayers, teams[teamIndex].needs, teams[teamIndex].roster);
                    });
                    availablePlayers.sort((a, b) => b.draftScore - a.draftScore);

                    const draftedPlayer = availablePlayers.shift();

                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        teams[teamIndex].roster.push(draftedPlayer);
                        // Update needs...
                    }
                }
            }
            this.displayGoatDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
        },
        
        displayGoatDraftResults(roster) { /* ... */ },
        createPlayerCardHTML(player, isBench = false) { /* ... */ },
        initStartSitTool() { /* ... */ },
        analyzeStartSit(p1, p2) { /* ... */ },
        generateStartSitAdvice(winner, loser) { /* ... */ },
        initMockDraftSimulator() { /* ... */ },
        // ... (rest of the mock draft functions)
        getOrdinal(n) {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        },
        createPlayerPopup() { /* ... */ },
        addPlayerPopupListeners() { /* ... */ },
        updateAndShowPopup(player, event) { /* ... */ },
        async getAiPlayerAnalysis(playerName) { /* ... */ },
        async generateDailyBriefing() { /* ... */ },
        initGuidesPage() { /* ... */ },
    };

    App.init();
});
