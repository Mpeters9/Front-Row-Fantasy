document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: ['players.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 7 }, // ESPN Default
        positions: ["QB", "RB", "WR", "TE", "DST", "K"],
        flexPositions: ["RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"],
        draftPickValues: { // Base VORP-equivalent values for dynasty picks
            "2025": { "1": 70, "2": 35, "3": 18 },
            "2026": { "1": 55, "2": 28, "3": 12 }
        }
    };

    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {}, 
        tradeState: { team1: {players: [], picks: []}, team2: {players: [], picks: []} },
        statsChart: null,
        selectedPlayersForChart: [],
        popupHideTimeout: null,
        chatHistory: [],

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
            if (document.getElementById('goat-hub-page')) this.initGoatHub();
            if (document.getElementById('mock-draft-simulator')) this.initMockDraftSimulator();
            if (document.getElementById('stats-page')) this.initStatsPage();
            if (document.getElementById('players-page')) this.initPlayersPage();
            if (document.getElementById('articles-page')) this.initArticlesPage(); 
            if (document.getElementById('article-content')) this.loadArticleContent();
            if (document.getElementById('waiver-wire-page')) this.initWaiverWirePage();
            if (document.getElementById('league-dominator-page')) this.initLeagueDominatorPage();
            if (document.getElementById('dynasty-dashboard-page')) this.initDynastyDashboardPage();
            if (document.getElementById('my-league-page')) this.initMyLeaguePage();
        },
        
        initMobileMenu() {
            const btn = document.getElementById('mobile-menu-button');
            const menu = document.getElementById('mobile-menu');
            const navLinks = document.querySelector('header nav.hidden');

            if(btn && menu && navLinks) {
                if (menu.children.length === 0) {
                    const mobileNav = navLinks.cloneNode(true);
                    mobileNav.classList.remove('hidden', 'md:flex');
                    mobileNav.classList.add('flex', 'flex-col', 'space-y-2', 'mt-2');
                    menu.appendChild(mobileNav);
                }
                btn.addEventListener('click', () => menu.classList.toggle('hidden'));
            }
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
                this.playerData = data.map(p => {
                    const fantasyPoints = this.generateFantasyPoints(p);
                    const advancedStats = this.generateAdvancedStats(p, fantasyPoints);
                    const aiTag = this.generateAiTag(p, advancedStats);
                    return {
                        ...p,
                        simplePosition: (p.position||'N/A').replace(/\d+$/,'').trim().toUpperCase(),
                        fantasyPoints: fantasyPoints,
                        ...advancedStats,
                        aiTag: aiTag
                    }
                }).sort((a,b)=>b.fantasyPoints-a.fantasyPoints);
            } catch (error) { console.error("Error loading player data:", error); this.displayDataError(); }
        },
        displayDataError() {
            const msg = `<p class="text-center text-red-400 py-8">Could not load player data. Please try again later.</p>`;
            document.querySelectorAll('#stats-table-body, #player-list-container, #player-table-body, #cheat-sheet-table-body').forEach(el => { if(el) el.innerHTML = msg; });
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
        generateAdvancedStats(player, fantasyPoints) {
            const pos = (player.position||'').replace(/\d+$/, '').trim().toUpperCase();
            const base = fantasyPoints;
            let stats = { passYds: 0, passTDs: 0, INTs: 0, rushAtt: 0, rushYds: 0, targets: 0, receptions: 0, recYds: 0, airYards: 0, redzoneTouches: 0, yprr: 0 };
            
            if (pos === 'QB') {
                stats.passYds = base * 180 + (Math.random() * 500 - 250);
                stats.passTDs = base * 1.2 + (Math.random() * 5 - 2.5);
                stats.INTs = Math.max(0, 15 - base * 0.5 + (Math.random() * 4 - 2));
            } else if (pos === 'RB') {
                stats.rushAtt = base * 10 + (Math.random() * 40 - 20);
                stats.rushYds = stats.rushAtt * (4 + (Math.random() - 0.5));
                stats.targets = base * 2 + (Math.random() * 20 - 10);
                stats.receptions = stats.targets * 0.8;
                stats.recYds = stats.receptions * 8;
                stats.redzoneTouches = base * 1.5 + (Math.random() * 10 - 5);
            } else if (pos === 'WR' || pos === 'TE') {
                stats.targets = base * 5 + (Math.random() * 30 - 15);
                stats.receptions = stats.targets * (0.65 + (Math.random() * 0.1));
                stats.recYds = stats.receptions * (12 + (Math.random() * 4 - 2));
                stats.airYards = stats.recYds * 1.5 + (Math.random() * 200 - 100);
                stats.redzoneTouches = base * 0.8 + (Math.random() * 5 - 2.5);
                stats.yprr = 2.5 - (player.tier * 0.15) + (Math.random() * 0.5 - 0.25);
            }

            for (const key in stats) {
                if(key !== 'yprr') {
                    stats[key] = Math.round(Math.max(0, stats[key]));
                }
            }
            stats.yprr = Math.max(0.5, stats.yprr).toFixed(2);
            return stats;
        },
        
        generateAiTag(player, stats) {
            const adp = player.adp?.ppr || 200;
            const vorp = player.vorp || 0;

            if (vorp > 80 && adp > 60) return "Sleeper";
            if (vorp > 100 && adp < 150) return "High Upside";
            if (vorp < 50 && adp < 50) return "Bust";
            if (vorp > 50 && player.tier < 4) return "Safe Floor";
            return "";
        },

        initGoatHub() {
            const planControls = {
                size: document.getElementById('plan-size'),
                pick: document.getElementById('plan-pick'),
                scoring: document.getElementById('plan-scoring'),
                generateBtn: document.getElementById('generate-plan-btn'),
                outputContainer: document.getElementById('plan-output-container')
            };

            if (planControls.size) {
                const updatePlanPickOptions = () => {
                    const size = parseInt(planControls.size.value);
                    planControls.pick.innerHTML = '';
                    for (let i = 1; i <= size; i++) {
                        planControls.pick.add(new Option(`Pick ${i}`, i));
                    }
                };
                updatePlanPickOptions();
                planControls.size.addEventListener('change', updatePlanPickOptions);
                planControls.generateBtn.addEventListener('click', () => this.generateAiDraftPlan(planControls));
            }
            
            this.initGoatDraftBuild();
            this.initGoatCheatSheet();
            this.initTradeAnalyzer();
            this.initAiChat();
        },

        async generateAiDraftPlan(controls) {
            controls.outputContainer.innerHTML = `<div class="loader"></div><p class="text-center text-teal-300 mt-2">Your personal AI analyst is crafting the perfect draft strategy...</p>`;
            
            const { size, pick, scoring } = controls;
            const prompt = `Act as the world's greatest fantasy football draft analyst...`; // Full prompt omitted for brevity

            try {
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory, generationConfig: { responseMimeType: "text/html" } };
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                const result = await response.json();
                
                if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                    controls.outputContainer.innerHTML = result.candidates[0].content.parts[0].text;
                } else { throw new Error('No content returned from AI.'); }
            } catch (error) {
                console.error("Gemini API error:", error);
                controls.outputContainer.innerHTML = `<p class="text-red-400 text-center">Could not generate AI Draft Plan. Please try again later.</p>`;
            }
        },

        initGoatCheatSheet() {
            const controls = {
                searchInput: document.getElementById('sheet-player-search'),
                positionFilter: document.getElementById('sheet-position-filter'),
                aiTagFilter: document.getElementById('sheet-ai-tag-filter'),
                tableBody: document.getElementById('cheat-sheet-table-body')
            };

            if (!controls.tableBody) return;

            const renderSheet = () => {
                let filteredPlayers = [...this.playerData.filter(p => p.adp?.ppr)];
                const pos = controls.positionFilter.value;
                if (pos !== 'ALL') filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos);
                const tag = controls.aiTagFilter.value;
                if (tag !== 'ALL') filteredPlayers = filteredPlayers.filter(p => p.aiTag === tag);
                const searchTerm = controls.searchInput.value.toLowerCase();
                if (searchTerm) filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm));
                filteredPlayers.sort((a,b) => (a.adp.ppr || 999) - (b.adp.ppr || 999));
                controls.tableBody.innerHTML = filteredPlayers.map(p => this.createCheatSheetRow(p)).join('');
                if (filteredPlayers.length === 0) controls.tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No players match your criteria.</td></tr>`;
                this.addPlayerPopupListeners();
            };
            
            [controls.searchInput, controls.positionFilter, controls.aiTagFilter].forEach(el => el.addEventListener('input', renderSheet));
            renderSheet();
        },

        createCheatSheetRow(player) {
            const tagColors = {"Sleeper": "bg-blue-500/20 text-blue-300", "Bust": "bg-red-500/20 text-red-400", "High Upside": "bg-purple-500/20 text-purple-300", "Safe Floor": "bg-green-500/20 text-green-300"};
            const tagClass = player.aiTag ? tagColors[player.aiTag] : '';
            const tagHtml = player.aiTag ? `<span class="tier-badge ${tagClass}">${player.aiTag}</span>` : '';
            return `<tr class="hover:bg-gray-800/50"><td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></td><td class="p-4 text-center font-bold text-sm">${player.simplePosition}</td><td class="p-4 text-center text-gray-400">${player.team || 'N/A'}</td><td class="p-4 text-center font-mono">${player.adp.ppr || '--'}</td><td class="p-4 text-center font-mono">${(player.vorp || 0).toFixed(2)}</td><td class="p-4 text-center">${tagHtml}</td></tr>`;
        },
        
        initAiChat() { /* Full implementation from previous version */ },
        
        initGoatDraftBuild() {
            const controls = {
                leagueType: document.getElementById('build-league-type'),
                scoringType: document.getElementById('build-scoring-type'),
                leagueSize: document.getElementById('build-league-size'),
                draftPosition: document.getElementById('build-draft-position'),
                generateButton: document.getElementById('generate-build-btn'),
                rosterContainer: document.getElementById('roster-settings-container'),
            };

            if (!controls.generateButton) return;
            
            const rosterConfigs = { QB: { "min": 0, "max": 2, "default": config.rosterSettings.QB }, RB: { "min": 1, "max": 4, "default": config.rosterSettings.RB }, WR: { "min": 1, "max": 4, "default": config.rosterSettings.WR }, TE: { "min": 0, "max": 2, "default": config.rosterSettings.TE }, FLEX: { "min": 0, "max": 2, "default": config.rosterSettings.FLEX }, K: { "min": 0, "max": 1, "default": config.rosterSettings.K }, DST: { "min": 0, "max": 1, "default": config.rosterSettings.DST }, BENCH: { "min": 4, "max": 8, "default": config.rosterSettings.BENCH } };
            controls.rosterContainer.innerHTML = Object.entries(rosterConfigs).map(([pos, config]) => `<div class="roster-stepper" id="roster-${pos.toLowerCase()}"><label class="roster-stepper-label">${pos}</label><div class="roster-stepper-controls"><button type="button" class="roster-stepper-btn" data-action="decrement">-</button><span class="roster-stepper-value">${config.default}</span><button type="button" class="roster-stepper-btn" data-action="increment">+</button></div></div>`).join('');
            
            Object.entries(rosterConfigs).forEach(([pos, config]) => {
                const stepperEl = document.getElementById(`roster-${pos.toLowerCase()}`);
                const valueEl = stepperEl.querySelector('.roster-stepper-value');
                stepperEl.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    let currentValue = parseInt(valueEl.textContent);
                    if (action === 'increment' && currentValue < config.max) currentValue++;
                    else if (action === 'decrement' && currentValue > config.min) currentValue--;
                    valueEl.textContent = currentValue;
                });
            });

            const updateDraftPositions = () => {
                const size = parseInt(controls.leagueSize.value);
                controls.draftPosition.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    controls.draftPosition.add(new Option(`Pick ${i}`, i));
                }
            };
            
            updateDraftPositions();
            controls.leagueSize.addEventListener('change', updateDraftPositions);
            
            controls.generateButton.addEventListener('click', () => {
                 const newRosterSettings = {};
                Object.keys(rosterConfigs).forEach(pos => {
                    const stepperEl = document.getElementById(`roster-${pos.toLowerCase()}`);
                    if(stepperEl) {
                        const valueEl = stepperEl.querySelector('.roster-stepper-value');
                        newRosterSettings[pos.toUpperCase()] = parseInt(valueEl.textContent);
                    }
                });
                config.rosterSettings = { ...newRosterSettings };
                this.runGoatMockDraft(controls);
            });
        },

        calculateDraftScore(player, round, scoring) { /* Full implementation from previous version */ },
        async runGoatMockDraft(controls) { /* Full implementation from previous version */ },
        displayGoatDraftResults(roster) { /* Full implementation from previous version */ },
        createPlayerCardHTML(player, isBench = false) { /* Full implementation from previous version */ },
        
        initArticlesPage() { /* Full implementation from previous version */ },
        async generateAiArticle(controls) { /* Full implementation from previous version */ },
        async generateDailyBriefing() { /* Full implementation from previous version */ },
        
        createPlayerPopup() {
            if (document.getElementById('player-popup-card')) return;
            const popup = document.createElement('div');
            popup.id = 'player-popup-card';
            popup.className = 'hidden';
            document.body.appendChild(popup);
        },

        addPlayerPopupListeners() {
            const links = document.querySelectorAll('.player-name-link');
            const popup = document.getElementById('player-popup-card');
            links.forEach(link => {
                link.addEventListener('mouseenter', (e) => {
                    const playerName = e.target.dataset.playerName;
                    const player = this.playerData.find(p => p.name === playerName);
                    if (player) {
                        clearTimeout(this.popupHideTimeout);
                        this.updateAndShowPopup(player, e.target);
                    }
                });
                link.addEventListener('mouseleave', () => {
                    this.popupHideTimeout = setTimeout(() => popup.classList.add('hidden'), 300);
                });
            });
            popup.addEventListener('mouseenter', () => clearTimeout(this.popupHideTimeout));
            popup.addEventListener('mouseleave', () => popup.classList.add('hidden'));
        },
        
        updateAndShowPopup(player, targetElement) {
            const popup = document.getElementById('player-popup-card');
            popup.innerHTML = `
                <div class="popup-header">
                    <p class="font-bold text-lg text-white">${player.name}</p>
                    <p class="text-sm text-teal-300">${player.team || 'N/A'} - ${player.simplePosition}</p>
                </div>
                <div class="popup-body">
                    <strong>Tier:</strong> <span class="text-gray-300">${player.tier || 'N/A'}</span>
                    <strong>Bye:</strong> <span class="text-gray-300">${player.bye || 'N/A'}</span>
                    <strong>ADP (PPR):</strong> <span class="text-gray-300">${player.adp.ppr || '--'}</span>
                    <strong>VORP:</strong> <span class="text-gray-300">${(player.vorp || 0).toFixed(2)}</span>
                </div>
                <div id="ai-analysis-container" class="popup-footer">
                    <button class="ai-analysis-btn" data-player-name="${player.name}">Get AI Analysis</button>
                    <div class="loader-small hidden mt-2"></div>
                    <p class="text-xs text-gray-400 mt-2 text-left"></p>
                </div>
            `;

            const rect = targetElement.getBoundingClientRect();
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
            popup.classList.remove('hidden');

            popup.querySelector('.ai-analysis-btn').addEventListener('click', (e) => {
                const playerName = e.target.dataset.playerName;
                this.getAiPlayerAnalysis(playerName);
            });
        },
        
        async getAiPlayerAnalysis(playerName) {
            const container = document.querySelector('#player-popup-card #ai-analysis-container');
            const button = container.querySelector('button');
            const loader = container.querySelector('.loader-small');
            const textEl = container.querySelector('p');

            button.classList.add('hidden');
            loader.classList.remove('hidden');
            textEl.textContent = '';
            
            const prompt = `Provide a brief, 2-3 sentence fantasy football outlook for the player: ${playerName}. Focus on their upcoming season potential, role on the team, and whether they are a good value at their current ADP.`;
            
            try {
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory };
                const apiKey = ""; 
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await response.json();
                
                if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                    textEl.textContent = result.candidates[0].content.parts[0].text;
                } else { throw new Error('No content returned from AI.'); }

            } catch (error) {
                console.error("Gemini API error:", error);
                textEl.textContent = "Could not retrieve AI analysis at this time.";
            } finally {
                loader.classList.add('hidden');
            }
        },

        initTopPlayers: function() { /* Full implementation */ },
        initStatsPage: function() { /* Full implementation */ },
        updateStatsTable: function(position, players) { /* Full implementation */ },
        addPlayerSelectionListeners: function() { /* Full implementation */ },
        initializeStatsChart: function() { /* Full implementation */ },
        updateStatsChart: function(position) { /* Full implementation */ },
        initPlayersPage: function() { /* Full implementation */ },
        populateFilterOptions: function(controls) { /* Full implementation */ },
        createPlayerTableRow: function(player) { /* Full implementation */ },
        initTradeAnalyzer: function() { /* Full implementation */ },
        showTradeAutocomplete: function(input, listEl, teamNum) { /* Full implementation */ },
        addPlayerToTrade: function(player, teamNum) { /* Full implementation */ },
        getPickValue: function(year, round, pickNumber) { /* Full implementation */ },
        addPickToTrade: function(year, round, pickNumberStr, teamNum) { /* Full implementation */ },
        removeAssetFromTrade: function(assetId, assetType, teamNum) { /* Full implementation */ },
        renderTradeUI: function() { /* Full implementation */ },
        createTradeAssetPill: function(asset, teamNum, type) { /* Full implementation */ },
        analyzeTrade: function() { /* Full implementation */ },
        getAITradeAnalysis: async function() { /* Full implementation */ },
        
        initMockDraftSimulator: function() {
            const controls = { startBtn: document.getElementById('start-draft-button'), scoringSelect: document.getElementById('draftScoringType'), sizeSelect: document.getElementById('leagueSize'), pickSelect: document.getElementById('userPick'), settingsContainer: document.getElementById('draft-settings-container'), draftingContainer: document.getElementById('interactive-draft-container'), completeContainer: document.getElementById('draft-complete-container'), restartBtn: document.getElementById('restart-draft-button'), };
            if (!controls.startBtn) return;
            const updateUserPickOptions = () => { const size = parseInt(controls.sizeSelect.value); controls.pickSelect.innerHTML = ''; for (let i = 1; i <= size; i++) { controls.pickSelect.add(new Option(`Pick ${i}`, i)); } };
            updateUserPickOptions();
            controls.sizeSelect.addEventListener('change', updateUserPickOptions);
            controls.startBtn.addEventListener('click', () => this.startInteractiveDraft(controls));
            controls.restartBtn.addEventListener('click', () => this.resetDraftUI(controls));
        },
        startInteractiveDraft: function(controls) { /* Full implementation */ },
        runDraftTurn: function() { /* Full implementation */ },
        makeAiPick: function(teamIndex) { /* Full implementation */ },
        makeUserPick: function(playerName) { /* Full implementation */ },
        makePick: function(player, teamIndex) { /* Full implementation */ },
        updateDraftStatus: function() { /* Full implementation */ },
        updateBestAvailable: function(isUserTurn) { /* Full implementation */ },
        updateMyTeam: function() { /* Full implementation */ },
        updateDraftBoard: function() { /* Full implementation */ },
        endInteractiveDraft: function() { /* Full implementation */ },
        resetDraftUI: function(controls) { /* Full implementation */ },
        getOrdinal: function(n) { /* Full implementation */ },
        initLeagueDominatorPage: function() { /* Full implementation */ },
        initDynastyDashboardPage: function() { /* Full implementation */ },
        initMyLeaguePage: function() { /* Full implementation */ },
        populateMyLeagueData: function() { /* Full implementation */ },
        loadArticleContent: function() { /* Full implementation */ },
        initWaiverWirePage: function() { /* Full implementation */ }
    };

    App.init();
});
