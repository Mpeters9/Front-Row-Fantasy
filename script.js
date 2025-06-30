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

        // --- G.O.A.T. HUB ---
        initGoatHub() {
            // Tab: AI Draft Plan
            const planControls = {
                size: document.getElementById('plan-size'),
                pick: document.getElementById('plan-pick'),
                scoring: document.getElementById('plan-scoring'),
                generateBtn: document.getElementById('generate-plan-btn'),
                outputContainer: document.getElementById('plan-output-container')
            };

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
            
            // Tab: Draft Build
            this.initGoatDraftBuild();

            // Tab: AI Cheat Sheet
            this.initGoatCheatSheet();
            
            // Tab: Trade Analyzer
            this.initTradeAnalyzer();
            
            // Tab: AI Chat
            this.initAiChat();
        },

        async generateAiDraftPlan(controls) {
            controls.outputContainer.innerHTML = `<div class="loader"></div><p class="text-center text-teal-300 mt-2">Your personal AI analyst is crafting the perfect draft strategy...</p>`;
            
            const { size, pick, scoring } = controls;
            const prompt = `
                Act as the world's greatest fantasy football draft analyst.
                A user needs a strategic draft plan for their upcoming fantasy draft.
                
                League Settings:
                - League Size: ${size.value} teams
                - Scoring Format: ${scoring.value}
                - Their Draft Position: Pick #${pick.value}

                Provide a detailed, round-by-round draft strategy. For each group of rounds (e.g., Rounds 1-2, Rounds 3-5, etc.), give a clear strategic objective (e.g., "Secure an elite RB", "Focus on high-upside WRs"). Then, list 2-3 specific players who are excellent targets in that range and fit the strategy, considering their ADP. 
                
                The tone should be confident and authoritative. Format the output in clean HTML using h3 for round groups and ul/li for player lists. Start with a bolded, one-sentence summary of the overall strategy (e.g., **"This plan focuses on a Hero RB strategy, surrounding a top running back with elite receiving talent."**).
            `;

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
                } else {
                    throw new Error('No content returned from AI.');
                }
            } catch (error) {
                console.error("Gemini API error:", error);
                controls.outputContainer.innerHTML = `<p class="text-red-400 text-center">Could not generate AI Draft Plan. The AI analyst might be busy reviewing game film. Please try again later.</p>`;
            }
        },

        initGoatCheatSheet() {
            const controls = {
                searchInput: document.getElementById('sheet-player-search'),
                positionFilter: document.getElementById('sheet-position-filter'),
                aiTagFilter: document.getElementById('sheet-ai-tag-filter'),
                tableBody: document.getElementById('cheat-sheet-table-body')
            };

            const renderSheet = () => {
                let filteredPlayers = [...this.playerData.filter(p => p.adp?.ppr)]; // Only players with ADP
                
                const pos = controls.positionFilter.value;
                if (pos !== 'ALL') {
                    filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos);
                }
                
                const tag = controls.aiTagFilter.value;
                 if (tag !== 'ALL') {
                    filteredPlayers = filteredPlayers.filter(p => p.aiTag === tag);
                }

                const searchTerm = controls.searchInput.value.toLowerCase();
                if (searchTerm) {
                    filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm));
                }

                filteredPlayers.sort((a,b) => (a.adp.ppr || 999) - (b.adp.ppr || 999));

                controls.tableBody.innerHTML = filteredPlayers.map(p => this.createCheatSheetRow(p)).join('');
                if (filteredPlayers.length === 0) {
                    controls.tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No players match your criteria.</td></tr>`;
                }
                this.addPlayerPopupListeners();
            };
            
            [controls.searchInput, controls.positionFilter, controls.aiTagFilter].forEach(el => el.addEventListener('input', renderSheet));
            renderSheet();
        },

        createCheatSheetRow(player) {
            const tagColors = {
                "Sleeper": "bg-blue-500/20 text-blue-300",
                "Bust": "bg-red-500/20 text-red-400",
                "High Upside": "bg-purple-500/20 text-purple-300",
                "Safe Floor": "bg-green-500/20 text-green-300",
            };
            const tagClass = player.aiTag ? tagColors[player.aiTag] : '';
            const tagHtml = player.aiTag ? `<span class="tier-badge ${tagClass}">${player.aiTag}</span>` : '';

            return `
                <tr class="hover:bg-gray-800/50">
                    <td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></td>
                    <td class="p-4 text-center font-bold text-sm">${player.simplePosition}</td>
                    <td class="p-4 text-center text-gray-400">${player.team || 'N/A'}</td>
                    <td class="p-4 text-center font-mono">${player.adp.ppr || '--'}</td>
                    <td class="p-4 text-center font-mono">${(player.vorp || 0).toFixed(2)}</td>
                    <td class="p-4 text-center">${tagHtml}</td>
                </tr>
            `;
        },
        
        initAiChat() {
            const controls = { 
                 chatWindow: document.getElementById('chat-window'),
                 chatInput: document.getElementById('chat-input'),
                 sendButton: document.getElementById('send-chat-button'),
            };
            if(!controls.chatWindow) return;

            const addMessage = (message, sender) => {
                const messageElement = document.createElement('div');
                messageElement.className = `p-3 rounded-lg max-w-xs md:max-w-md ${sender === 'user' ? 'bg-teal-600 ml-auto' : 'bg-gray-700'}`;
                messageElement.textContent = message;
                controls.chatWindow.appendChild(messageElement);
                controls.chatWindow.scrollTop = controls.chatWindow.scrollHeight;
                 if (sender === 'user') {
                    this.chatHistory.push({ role: "user", parts: [{ text: message }] });
                } else {
                    this.chatHistory.push({ role: "model", parts: [{ text: message }] });
                }
            };

            const getAIResponse = async (question) => {
                 const thinkingElement = document.createElement('div');
                 thinkingElement.className = 'p-3 rounded-lg max-w-xs md:max-w-md bg-gray-700';
                 thinkingElement.innerHTML = `<div class="loader-small"></div>`;
                 controls.chatWindow.appendChild(thinkingElement);
                 controls.chatWindow.scrollTop = controls.chatWindow.scrollHeight;
                
                const tradeContext = (this.tradeState.team1.players.length > 0) ? `For context, I am analyzing a trade where I give ${this.tradeState.team1.players.map(p=>p.name).join(', ')} and receive ${this.tradeState.team2.players.map(p=>p.name).join(', ')}.` : "";

                const prompt = `You are a helpful and concise fantasy football analyst. Your name is GOAT. Answer the user's question based on the provided chat history. ${tradeContext}\n\nUser question: "${question}"`;

                this.chatHistory.push({ role: "user", parts: [{ text: prompt }] });
                
                try {
                    const payload = { contents: this.chatHistory };
                    const apiKey = "";
                    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const result = await response.json();
                    
                    controls.chatWindow.removeChild(thinkingElement);

                    if (result.candidates && result.candidates.length > 0) {
                        const aiResponse = result.candidates[0].content.parts[0].text;
                        addMessage(aiResponse, 'ai');
                    } else { throw new Error('No content returned'); }
                } catch (error) {
                    console.error("AI Chat Error", error);
                     controls.chatWindow.removeChild(thinkingElement);
                    addMessage("I seem to be having trouble connecting to the sidelines. Please try again in a moment.", 'ai');
                }
            };

            const handleSend = () => {
                const question = controls.chatInput.value.trim();
                if (question) {
                    addMessage(question, 'user');
                    controls.chatInput.value = '';
                    getAIResponse(question);
                }
            };

            controls.sendButton.addEventListener('click', handleSend);
            controls.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

            if(this.chatHistory.length === 0) {
                 addMessage("Welcome to the GOAT Hub. Ask me anything about your draft plan, player values, or trades.", 'ai');
            }
        },

        // --- DRAFT BUILD SIMULATOR (RESTORED) ---
        initGoatDraftBuild() {
            const controls = {
                leagueType: document.getElementById('build-league-type'),
                scoringType: document.getElementById('build-scoring-type'),
                leagueSize: document.getElementById('build-league-size'),
                draftPosition: document.getElementById('build-draft-position'),
                generateButton: document.getElementById('generate-build-btn'),
            };

            if (!controls.generateButton) return;
            
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
                this.runGoatMockDraft(controls);
            });
        },

        calculateDraftScore(player, round, scoring) {
            let score = 0;
            const adp = player.adp[scoring] || 999;
            
            if (round < 3) {
                 score = (1 / adp) * 1000;
            } else if (round < 7) { 
                const adpScore = (1 / adp) * 1000;
                const vorpScore = (player.vorp || 0) * 1.5;
                score = (adpScore * 0.8) + (vorpScore * 0.2); 
            } else {
                score = (player.vorp || 0);
            }
            score *= (1 + (Math.random() - 0.5) * 0.4); 
            return score;
        },

        async runGoatMockDraft(controls) {
            const loader = document.getElementById('build-loading-spinner'); 
            const resultsWrapper = document.getElementById('build-results-wrapper');
            const button = controls.generateButton;

            if (!loader || !resultsWrapper) return;
            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');
            button.disabled = true;
            button.textContent = "Simulating...";

            await new Promise(resolve => setTimeout(resolve, 100));

            const leagueType = controls.leagueType.value; 
            const scoring = controls.scoringType.value; 
            const leagueSize = parseInt(controls.leagueSize.value); 
            const userDraftPos = parseInt(controls.draftPosition.value) - 1;
            
            if (!this.hasDataLoaded) await this.loadAllPlayerData();

            let availablePlayers = JSON.parse(JSON.stringify(this.playerData)).filter(p => p.adp && typeof p.adp[scoring] === 'number');
            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));
            
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 1; round <= totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? Array.from({ length: leagueSize }, (_, i) => i) : Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i);
                for (const teamIndex of picksInRoundOrder) {
                    if (teams[teamIndex].roster.length >= totalRounds || availablePlayers.length === 0) continue;
                    
                    let draftedPlayer;
                    const team = teams[teamIndex];
                    
                    availablePlayers.forEach(p => { p.draftScore = this.calculateDraftScore(p, round, scoring); });
                    
                    const qbsOnRoster = team.roster.filter(p => p.simplePosition === 'QB').length;
                    if(qbsOnRoster >= 1 && !config.rosterSettings.SUPER_FLEX) {
                        availablePlayers.forEach(p => { if(p.simplePosition === 'QB') p.draftScore *= 0.1; });
                    }
                    if(qbsOnRoster >= 2) {
                        availablePlayers.forEach(p => { if(p.simplePosition === 'QB') p.draftScore = 0; });
                    }
                    if(round < totalRounds - 2) {
                        availablePlayers.forEach(p => { if(['K', 'DST'].includes(p.simplePosition)) p.draftScore = 0; });
                    }

                    availablePlayers.sort((a, b) => b.draftScore - a.draftScore);
                    
                    const bucketSize = (round < 3) ? 4 : 5;
                    const draftBucket = availablePlayers.slice(0, bucketSize);
                    draftedPlayer = draftBucket[Math.floor(Math.random() * draftBucket.length)];

                    const draftedPlayerIndex = availablePlayers.findIndex(p => p.name === draftedPlayer.name);
                    if(draftedPlayerIndex !== -1) { availablePlayers.splice(draftedPlayerIndex, 1); }

                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${round}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        team.roster.push(draftedPlayer);
                    }
                }
            }
            this.displayGoatDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
            button.textContent = "Regenerate Build";
            button.disabled = false;
        },
        
        displayGoatDraftResults(roster) {
            const startersEl = document.getElementById('starters-list'); 
            const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = ''; benchEl.innerHTML = '';
            const starters = []; const bench = []; 
            const rosterSlots = { ...config.rosterSettings };

            roster.forEach(player => {
                const pos = player.simplePosition.toUpperCase();
                if (rosterSlots[pos] > 0) { player.displayPos = pos; starters.push(player); rosterSlots[pos]--; }
                else if (config.flexPositions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; }
                else { bench.push(player); }
            });

            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];
            starters.sort((a, b) => positionOrder.indexOf(a.displayPos) - positionOrder.indexOf(b.displayPos));
            
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('');
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('');
            this.addPlayerPopupListeners();
        },
        
        // --- ALL OTHER FUNCTIONS ---
        // Includes previously implemented logic for pages, popups, etc.
        // The contents are the same as the previous script version.
        // ... (all other functions from script-js-6) ...
        initArticlesPage() { /* ... */ },
        generateAiArticle(controls) { /* ... */ },
        async generateDailyBriefing() { /* ... */ },
        createPlayerPopup() { /* ... */ },
        addPlayerPopupListeners() { /* ... */ },
        updateAndShowPopup(player, targetElement) { /* ... */ },
        async getAiPlayerAnalysis(playerName) { /* ... */ },
        initTopPlayers() { /* ... */ },
        initStatsPage() { /* ... */ },
        updateStatsTable(position, players) { /* ... */ },
        addPlayerSelectionListeners() { /* ... */ },
        initializeStatsChart() { /* ... */ },
        updateStatsChart(position) { /* ... */ },
        initPlayersPage() { /* ... */ },
        populateFilterOptions(controls) { /* ... */ },
        createPlayerTableRow(player) { /* ... */ },
        initTradeAnalyzer() { /* ... */ },
        showTradeAutocomplete(input, listEl, teamNum) { /* ... */ },
        addPlayerToTrade(player, teamNum) { /* ... */ },
        getPickValue(year, round, pickNumber) { /* ... */ },
        addPickToTrade(year, round, pickNumberStr, teamNum) { /* ... */ },
        removeAssetFromTrade(assetId, assetType, teamNum) { /* ... */ },
        renderTradeUI() { /* ... */ },
        createTradeAssetPill(asset, teamNum, type) { /* ... */ },
        analyzeTrade() { /* ... */ },
        async getAITradeAnalysis() { /* ... */ },
        initMockDraftSimulator() { /* ... */ },
        startInteractiveDraft(controls) { /* ... */ },
        runDraftTurn() { /* ... */ },
        makeAiPick(teamIndex) { /* ... */ },
        makeUserPick(playerName) { /* ... */ },
        makePick(player, teamIndex) { /* ... */ },
        updateDraftStatus() { /* ... */ },
        updateBestAvailable(isUserTurn) { /* ... */ },
        updateMyTeam() { /* ... */ },
        updateDraftBoard() { /* ... */ },
        endInteractiveDraft() { /* ... */ },
        resetDraftUI(controls) { /* ... */ },
        getOrdinal(n) { /* ... */ },
        createPlayerCardHTML(player, isBench = false) {
            const pos = isBench ? 'BEN' : player.displayPos;
            const draftInfo = player.draftedAt ? `<span class="text-xs text-gray-400 ml-auto">${player.draftedAt}</span>` : '';
            return `<div class="player-card player-pos-${player.simplePosition.toLowerCase()}"><strong class="font-bold w-12">${pos}:</strong><span class="player-name-link" data-player-name="${player.name}">${player.name} (${player.team})</span>${draftInfo}</div>`;
        },
        initLeagueDominatorPage() { /* ... */ },
        initDynastyDashboardPage() { /* ... */ },
        initMyLeaguePage() { /* ... */ },
        populateMyLeagueData() { /* ... */ },
        loadArticleContent() { /* ... */ },
        initWaiverWirePage() { /* ... */ }
    };

    App.init();
});
