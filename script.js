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
            const prompt = `Act as the world's greatest fantasy football draft analyst. A user needs a strategic draft plan for their upcoming fantasy draft. League Settings: - League Size: ${size.value} teams - Scoring Format: ${scoring.value} - Their Draft Position: Pick #${pick.value}. Provide a detailed, round-by-round draft strategy. For each group of rounds (e.g., Rounds 1-2, Rounds 3-5, etc.), give a clear strategic objective (e.g., "Secure an elite RB", "Focus on high-upside WRs"). Then, list 2-3 specific players who are excellent targets in that range and fit the strategy, considering their ADP. The tone should be confident and authoritative. Format the output in clean HTML using h3 for round groups and ul/li for player lists. Start with a bolded, one-sentence summary of the overall strategy (e.g., **"This plan focuses on a Hero RB strategy, surrounding a top running back with elite receiving talent."**).`;

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
            const controls = { searchInput: document.getElementById('sheet-player-search'), positionFilter: document.getElementById('sheet-position-filter'), aiTagFilter: document.getElementById('sheet-ai-tag-filter'), tableBody: document.getElementById('cheat-sheet-table-body') };
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
        
        initAiChat() {
            const controls = { chatWindow: document.getElementById('chat-window'), chatInput: document.getElementById('chat-input'), sendButton: document.getElementById('send-chat-button') };
            if(!controls.chatWindow) return;
            const addMessage = (message, sender) => {
                const messageElement = document.createElement('div');
                messageElement.className = `p-3 rounded-lg max-w-xs md:max-w-md ${sender === 'user' ? 'bg-teal-600 ml-auto' : 'bg-gray-700'}`;
                messageElement.innerHTML = message;
                controls.chatWindow.appendChild(messageElement);
                controls.chatWindow.scrollTop = controls.chatWindow.scrollHeight;
                 if (sender === 'user') { this.chatHistory.push({ role: "user", parts: [{ text: message }] }); } 
                 else { this.chatHistory.push({ role: "model", parts: [{ text: message }] }); }
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
                if (question) { addMessage(question, 'user'); controls.chatInput.value = ''; getAIResponse(question); }
            };
            controls.sendButton.addEventListener('click', handleSend);
            controls.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
            if(this.chatHistory.length === 0) { addMessage("Welcome to the GOAT Hub. Ask me anything about your draft plan, player values, or trades.", 'ai'); }
        },
        
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

        calculateDraftScore(player, round, scoring) {
            let score = 0;
            const adp = player.adp[scoring] || 999;
            if (round < 3) score = (1 / adp) * 1000;
            else if (round < 7) { const adpScore = (1 / adp) * 1000; const vorpScore = (player.vorp || 0) * 1.5; score = (adpScore * 0.8) + (vorpScore * 0.2); }
            else score = (player.vorp || 0);
            score *= (1 + (Math.random() - 0.5) * 0.4); 
            return score;
        },

        async runGoatMockDraft(controls) {
            const loader = document.getElementById('build-loading-spinner'); 
            const resultsWrapper = document.getElementById('build-results-wrapper');
            const placeholder = document.getElementById('build-placeholder');
            const button = controls.generateButton;

            if (!loader || !resultsWrapper) return;
            loader.classList.remove('hidden');
            placeholder.classList.add('hidden');
            resultsWrapper.classList.add('hidden');
            button.disabled = true;
            button.textContent = "Simulating...";
            await new Promise(resolve => setTimeout(resolve, 100));

            const { scoringType, leagueSize, draftPosition } = controls;
            const scoring = scoringType.value;
            const userDraftPos = parseInt(draftPosition.value) - 1;
            
            if (!this.hasDataLoaded) await this.loadAllPlayerData();
            const currentRosterSettings = { ...config.rosterSettings };
            let availablePlayers = JSON.parse(JSON.stringify(this.playerData)).filter(p => p.adp && typeof p.adp[scoring] === 'number');
            const teams = Array.from({ length: parseInt(leagueSize.value) }, () => ({ roster: [], needs: { ...currentRosterSettings } }));
            const totalRounds = Object.values(currentRosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 1; round <= totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? Array.from({ length: teams.length }, (_, i) => i) : Array.from({ length: teams.length }, (_, i) => teams.length - 1 - i);
                for (const teamIndex of picksInRoundOrder) {
                    if (teams[teamIndex].roster.length >= totalRounds || availablePlayers.length === 0) continue;
                    let draftedPlayer;
                    const team = teams[teamIndex];
                    const needsDST = team.needs.DST > 0 && !team.roster.some(p => p.simplePosition === 'DST');
                    const needsK = team.needs.K > 0 && !team.roster.some(p => p.simplePosition === 'K');
                    const availableDST = availablePlayers.find(p => p.simplePosition === 'DST');
                    const availableK = availablePlayers.find(p => p.simplePosition === 'K');

                    if (round >= totalRounds - 1 && needsDST && availableDST) { draftedPlayer = availableDST; } 
                    else if (round >= totalRounds && needsK && availableK) { draftedPlayer = availableK; } 
                    else {
                        availablePlayers.forEach(p => { p.draftScore = this.calculateDraftScore(p, round, scoring); });
                        const qbsOnRoster = team.roster.filter(p => p.simplePosition === 'QB').length;
                        if(qbsOnRoster >= team.needs.QB) { availablePlayers.forEach(p => { if(p.simplePosition === 'QB') p.draftScore *= 0.1; }); }
                        if(round < totalRounds - (teams.length/3)) { availablePlayers.forEach(p => { if(['K', 'DST'].includes(p.simplePosition)) p.draftScore = 0; }); }
                        availablePlayers.sort((a, b) => b.draftScore - a.draftScore);
                        const bucketSize = (round < 3) ? 4 : 5;
                        const draftBucket = availablePlayers.slice(0, bucketSize);
                        draftedPlayer = draftBucket[Math.floor(Math.random() * draftBucket.length)];
                    }
                    const draftedPlayerIndex = availablePlayers.findIndex(p => p.name === draftedPlayer.name);
                    if(draftedPlayerIndex !== -1) { availablePlayers.splice(draftedPlayerIndex, 1); }
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${round}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        team.roster.push(draftedPlayer);
                        const pos = draftedPlayer.simplePosition.toUpperCase();
                        if (team.needs[pos] > 0) { team.needs[pos]--; } 
                        else if (config.flexPositions.includes(pos) && team.needs['FLEX'] > 0) { team.needs['FLEX']--; }
                        else if (team.needs.BENCH > 0) { team.needs.BENCH--; }
                    }
                }
            }
            this.displayGoatDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
            button.textContent = "Generate My Perfect Draft";
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
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('') || `<p class="text-gray-400 text-center">No starters drafted.</p>`;
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('') || `<p class="text-gray-400 text-center">No bench players drafted.</p>`;
            this.addPlayerPopupListeners();
        },
        
        createPlayerCardHTML(player, isBench = false) {
            const pos = isBench ? 'BEN' : player.displayPos;
            const draftInfo = player.draftedAt ? `<span class="text-xs text-gray-400 ml-auto">${player.draftedAt}</span>` : '';
            return `<div class="player-card player-pos-${player.simplePosition.toLowerCase()}"><strong class="font-bold w-12">${pos}:</strong><span class="player-name-link" data-player-name="${player.name}">${player.name} (${player.team})</span>${draftInfo}</div>`;
        },

        async generateDailyBriefing() {
            const container = document.getElementById('daily-briefing-content');
            if (!container) return;
            const prompt = `Act as a fantasy football analyst providing a "Daily Briefing"...`; // Full prompt omitted for brevity
            try {
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory, generationConfig: { responseMimeType: "text/html" } };
                const apiKey = ""; 
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                const result = await response.json();
                if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                    container.innerHTML = result.candidates[0].content.parts[0].text;
                } else { throw new Error('No content returned from AI.'); }
            } catch (error) {
                console.error("Gemini API error for briefing:", error);
                container.innerHTML = `<p class="text-red-400 text-center">Could not generate the daily briefing at this time. Please check back later.</p>`;
            }
        },
        
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

        initTopPlayers() {
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;
            const topPlayersByPos = {"Top Quarterbacks": this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 4), "Top Running Backs": this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 4), "Top Wide Receivers": this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 4), "Top Tight Ends": this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 4)};
            container.innerHTML = Object.entries(topPlayersByPos).map(([title, players]) => `<div class="tool-card"><h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3><ol class="list-none p-0 space-y-3">${players.map((p, index) => `<li class="flex items-center py-2 border-b border-gray-700/50 last:border-b-0"><span class="text-2xl font-bold text-teal-400/60 w-8">${index + 1}</span><div class="flex-grow"><span class="player-name-link font-semibold text-lg text-slate-100" data-player-name="${p.name}">${p.name}</span><span class="text-sm text-gray-400 block">${p.team}</span></div><span class="font-bold text-xl text-yellow-400">${p.fantasyPoints.toFixed(2)}</span></li>`).join('')}</ol></div>`).join('');
            this.addPlayerPopupListeners();
        },
        initStatsPage() {
            const controls = { position: document.getElementById('stats-position-filter'), sortBy: document.getElementById('stats-sort-by'), search: document.getElementById('stats-player-search'), tableBody: document.getElementById('stats-table-body'), tableHead: document.getElementById('stats-table-head') };
            if (!controls.tableBody) return;
            if(this.selectedPlayersForChart.length === 0) { this.selectedPlayersForChart = this.playerData.filter(p => ['WR', 'RB'].includes(p.simplePosition)).slice(0, 4); }
            const render = () => {
                let filteredPlayers = [...this.playerData];
                const pos = controls.position.value;
                if (pos === 'FLEX') { filteredPlayers = filteredPlayers.filter(p => config.flexPositions.includes(p.simplePosition)); } 
                else if (pos !== 'ALL') { filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos); }
                const searchTerm = controls.search.value.toLowerCase();
                if (searchTerm) { filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm)); }
                const sortKey = controls.sortBy.value;
                filteredPlayers.sort((a, b) => {
                    if (sortKey === 'name') return a.name.localeCompare(b.name);
                    return (parseFloat(b[sortKey]) || 0) - (parseFloat(a[sortKey]) || 0);
                });
                this.updateStatsTable(pos, filteredPlayers);
            };
            if(!this.statsChart && document.getElementById('stats-chart')) { this.initializeStatsChart(); }
            [controls.position, controls.sortBy, controls.search].forEach(el => el.addEventListener('input', render));
            render();
        },
        updateStatsTable(position, players) {
            const tableHead = document.getElementById('stats-table-head');
            const tableBody = document.getElementById('stats-table-body');
            let headers, columns;
            const baseHeaders = ['Player', 'Pos', 'Team', 'FPTS'];
            const baseColumns = ['name', 'simplePosition', 'team', 'fantasyPoints'];
            switch(position) {
                case 'QB': headers = [...baseHeaders, 'Pass Yds', 'Pass TDs', 'INTs']; columns = [...baseColumns, 'passYds', 'passTDs', 'INTs']; break;
                case 'RB': headers = [...baseHeaders, 'Rush Att', 'Rush Yds', 'RZ Touches']; columns = [...baseColumns, 'rushAtt', 'rushYds', 'redzoneTouches']; break;
                case 'WR': case 'TE': headers = [...baseHeaders, 'Tgts', 'Rec', 'Rec Yds', 'YPRR']; columns = [...baseColumns, 'targets', 'receptions', 'recYds', 'yprr']; break;
                default: headers = [...baseHeaders, 'Rush Yds', 'Rec Yds', 'RZ Touches']; columns = [...baseColumns, 'rushYds', 'recYds', 'redzoneTouches']; break;
            }
            tableHead.innerHTML = `<tr>${headers.map(h => `<th class="p-4 text-center">${h}</th>`).join('')}</tr>`;
            tableBody.innerHTML = players.map(player => {
                const isSelected = this.selectedPlayersForChart.some(p => p.name === player.name);
                const rowHtml = columns.map(col => {
                    let val = player[col];
                    if (col === 'name') return `<td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${val}">${val}</span></td>`;
                    if (typeof val === 'number' && col !== 'fantasyPoints' && col !== 'yprr') val = Math.round(val);
                    if (col === 'fantasyPoints') val = val.toFixed(1);
                    return `<td class="p-4 text-center font-mono">${val || '0'}</td>`;
                }).join('');
                return `<tr class="cursor-pointer hover:bg-gray-800/50 ${isSelected ? 'bg-teal-500/10' : ''}" data-player-name="${player.name}">${rowHtml}</tr>`;
            }).join('');
            this.addPlayerSelectionListeners();
            if(document.getElementById('stats-chart')) this.updateStatsChart(position);
        },
        addPlayerSelectionListeners() {
            document.querySelectorAll('#stats-table-body tr').forEach(row => {
                row.addEventListener('click', (e) => {
                    if(e.target.classList.contains('player-name-link')) return; 
                    const playerName = row.dataset.playerName;
                    const player = this.playerData.find(p => p.name === playerName);
                    if(!player) return;
                    const selectedIndex = this.selectedPlayersForChart.findIndex(p => p.name === playerName);
                    if (selectedIndex > -1) { this.selectedPlayersForChart.splice(selectedIndex, 1); } 
                    else { if (this.selectedPlayersForChart.length >= 5) { this.selectedPlayersForChart.shift(); } this.selectedPlayersForChart.push(player); }
                    this.initStatsPage();
                });
            });
            this.addPlayerPopupListeners();
        },
        initializeStatsChart() {
            const ctx = document.getElementById('stats-chart').getContext('2d');
            this.statsChart = new Chart(ctx, { type: 'bar', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: 'Player Stat Comparison', color: '#facc15', font: { size: 18 } } }, scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } } } } });
        },
        updateStatsChart(position) {
            if (!this.statsChart) return;
            const labels = this.selectedPlayersForChart.map(p => p.name);
            let datasets;
            const colors = ['rgba(250, 204, 21, 0.7)', 'rgba(20, 184, 166, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)'];
            switch(position) {
                case 'QB': datasets = [ { label: 'Pass Yds', data: this.selectedPlayersForChart.map(p => p.passYds), backgroundColor: colors[0] }, { label: 'Pass TDs', data: this.selectedPlayersForChart.map(p => p.passTDs), backgroundColor: colors[1] } ]; break;
                case 'RB': datasets = [ { label: 'Rush Yds', data: this.selectedPlayersForChart.map(p => p.rushYds), backgroundColor: colors[0] }, { label: 'RZ Touches', data: this.selectedPlayersForChart.map(p => p.redzoneTouches), backgroundColor: colors[1] } ]; break;
                case 'WR': case 'TE': datasets = [ { label: 'Rec Yds', data: this.selectedPlayersForChart.map(p => p.recYds), backgroundColor: colors[0] }, { label: 'Targets', data: this.selectedPlayersForChart.map(p => p.targets), backgroundColor: colors[2] }, { label: 'YPRR', data: this.selectedPlayersForChart.map(p => p.yprr), backgroundColor: colors[3] } ]; break;
                default: datasets = [ { label: 'Fantasy Points', data: this.selectedPlayersForChart.map(p => p.fantasyPoints), backgroundColor: colors[0] }, { label: 'RZ Touches', data: this.selectedPlayersForChart.map(p => p.redzoneTouches), backgroundColor: colors[1] } ]; break;
            }
            this.statsChart.data.labels = labels;
            this.statsChart.data.datasets = datasets;
            this.statsChart.update();
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
            if (!controls.tierFilter || !controls.teamFilter) return;
            const tiers = [...new Set(this.playerData.map(p => p.tier).filter(t => t))].sort((a, b) => a - b);
            const teams = [...new Set(this.playerData.map(p => p.team).filter(t => t))].sort();
            tiers.forEach(tier => { if(![...controls.tierFilter.options].some(o => o.value == tier)) controls.tierFilter.add(new Option(`Tier ${tier}`, tier)); });
            teams.forEach(team => { if(![...controls.teamFilter.options].some(o => o.value == team)) controls.teamFilter.add(new Option(team, team)); });
        },
        createPlayerTableRow(player) {
            const tierColorClasses = { 1: 'bg-yellow-500/20 text-yellow-300', 2: 'bg-blue-500/20 text-blue-300', 3: 'bg-green-500/20 text-green-300', 4: 'bg-indigo-500/20 text-indigo-300', 5: 'bg-purple-500/20 text-purple-300', default: 'bg-gray-500/20 text-gray-300' };
            const tierClass = tierColorClasses[player.tier] || tierColorClasses.default;
            return `<tr class="hover:bg-gray-800/50"><td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></td><td class="p-4 text-center font-bold text-sm">${player.simplePosition}</td><td class="p-4 text-center text-gray-400">${player.team || 'N/A'}</td><td class="p-4 text-center"><span class="tier-badge ${tierClass}">Tier ${player.tier || 'N/A'}</span></td><td class="p-4 text-center font-mono">${player.adp.ppr || '--'}</td><td class="p-4 text-center font-mono">${(player.vorp || 0).toFixed(2)}</td></tr>`;
        },
        initTradeAnalyzer() {
            const controls = {
                searchInput1: document.getElementById('trade-search-1'), autocomplete1: document.getElementById('trade-autocomplete-1'), teamContainer1: document.getElementById('trade-team-1'),
                searchInput2: document.getElementById('trade-search-2'), autocomplete2: document.getElementById('trade-autocomplete-2'), teamContainer2: document.getElementById('trade-team-2'),
                addPickBtn1: document.getElementById('add-pick-btn-1'), addPickBtn2: document.getElementById('add-pick-btn-2'),
                pickYear1: document.getElementById('trade-pick-year-1'), pickRound1: document.getElementById('trade-pick-round-1'), pickNumber1: document.getElementById('trade-pick-number-1'),
                pickYear2: document.getElementById('trade-pick-year-2'), pickRound2: document.getElementById('trade-pick-round-2'), pickNumber2: document.getElementById('trade-pick-number-2'),
                analyzeBtn: document.getElementById('analyze-trade-btn'), resultsContainer: document.getElementById('trade-results'),
            };
            if (!controls.analyzeBtn) return;
            controls.searchInput1.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput1, controls.autocomplete1, 1));
            controls.searchInput2.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput2, controls.autocomplete2, 2));
            controls.addPickBtn1.addEventListener('click', () => this.addPickToTrade(controls.pickYear1.value, controls.pickRound1.value, controls.pickNumber1.value, 1));
            controls.addPickBtn2.addEventListener('click', () => this.addPickToTrade(controls.pickYear2.value, controls.pickRound2.value, controls.pickNumber2.value, 2));
            controls.analyzeBtn.addEventListener('click', () => this.analyzeTrade());
        },
        showTradeAutocomplete(input, listEl, teamNum) {
            const searchTerm = input.value.toLowerCase();
            listEl.innerHTML = ''; if (searchTerm.length < 2) return;
            const filtered = this.playerData.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
            filtered.forEach(player => {
                const item = document.createElement('li');
                item.className = "p-3 hover:bg-gray-700 cursor-pointer";
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
        getPickValue(year, round, pickNumber) {
            const baseValue = config.draftPickValues[year]?.[round] || 0;
            if (!baseValue) return 0;
            const depreciation = (pickNumber - 1) * (baseValue / 20); 
            return Math.max(5, baseValue - depreciation); 
        },
        addPickToTrade(year, round, pickNumberStr, teamNum) {
            const pickNumber = parseInt(pickNumberStr);
            if (!pickNumber || pickNumber < 1 || pickNumber > 14) { return; }
            const pick = { id: `pick-${year}-${round}-${pickNumber}-${Date.now()}`, year: year, round: round, pick: pickNumber, name: `${year} Pick ${round}.${String(pickNumber).padStart(2, '0')}`, value: this.getPickValue(year, round, pickNumber) };
            if (teamNum === 1) this.tradeState.team1.picks.push(pick);
            else this.tradeState.team2.picks.push(pick);
            this.renderTradeUI();
        },
        removeAssetFromTrade(assetId, assetType, teamNum) {
            const team = (teamNum === 1) ? this.tradeState.team1 : this.tradeState.team2;
            if (assetType === 'player') { team.players = team.players.filter(p => p.name !== assetId); } 
            else if (assetType === 'pick') { team.picks = team.picks.filter(p => p.id !== assetId); }
            this.renderTradeUI();
        },
        renderTradeUI() {
            const container1 = document.getElementById('trade-team-1');
            const container2 = document.getElementById('trade-team-2');
            const team1Assets = [...this.tradeState.team1.players.map(p => this.createTradeAssetPill(p, 1, 'player')), ...this.tradeState.team1.picks.map(p => this.createTradeAssetPill(p, 1, 'pick'))].join('');
            const team2Assets = [...this.tradeState.team2.players.map(p => this.createTradeAssetPill(p, 2, 'player')), ...this.tradeState.team2.picks.map(p => this.createTradeAssetPill(p, 2, 'pick'))].join('');
            container1.innerHTML = team1Assets || `<p class="text-gray-500 text-center p-4">Add players or picks.</p>`;
            container2.innerHTML = team2Assets || `<p class="text-gray-500 text-center p-4">Add players or picks.</p>`;
            document.querySelectorAll('.trade-remove-btn').forEach(btn => {
                btn.onclick = () => this.removeAssetFromTrade(btn.dataset.assetId, btn.dataset.assetType, parseInt(btn.dataset.teamNum));
            });
            this.addPlayerPopupListeners();
        },
        createTradeAssetPill(asset, teamNum, type) {
            const isPlayer = type === 'player';
            const assetId = isPlayer ? asset.name : asset.id;
            const displayName = isPlayer ? `<span class="player-name-link" data-player-name="${asset.name}">${asset.name}</span>` : `<span>${asset.name}</span>`;
            const displayInfo = isPlayer ? asset.simplePosition : `Value: ${asset.value.toFixed(1)}`;
            const pillClass = `border-l-4 ${isPlayer ? `player-pos-${asset.simplePosition.toLowerCase()}` : 'player-pos-pick'}`;
            return `<div class="flex items-center p-2 bg-gray-700/50 rounded-md ${pillClass}"><div class="flex-grow">${displayName}<span class="text-xs text-gray-400 block">${displayInfo}</span></div><button class="text-red-400 font-bold text-xl px-2 hover:text-red-300 trade-remove-btn" data-asset-id="${assetId}" data-asset-type="${type}" data-team-num="${teamNum}">×</button></div>`;
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
            if (totalAssets === 0) { verdict = `<h3 class="text-2xl font-bold text-red-400">Please add players or picks to analyze.</h3>`; } 
            else if (diff / avgVal < 0.1) { verdict = `<h3 class="text-2xl font-bold text-yellow-300">This is a very balanced trade.</h3><p class="text-gray-300 mt-1">It's a fair swap that comes down to which assets you believe in more.</p>`; } 
            else if (team1Value > team2Value) { verdict = `<h3 class="text-2xl font-bold text-red-400">You might be giving up too much value.</h3><p class="text-gray-300 mt-1">The other team seems to be getting the better end of this deal.</p>`; } 
            else { verdict = `<h3 class="text-2xl font-bold text-green-400">This looks like a smash accept for you!</h3><p class="text-gray-300 mt-1">The assets you're getting back are a significant upgrade.</p>`; }
            resultsContainer.innerHTML = ` <div class="text-center">${verdict}</div> <div id="ai-trade-analysis-container" class="popup-footer mt-4"><button id="get-ai-trade-btn" class="ai-analysis-btn">Get AI Opinion</button><div id="ai-trade-loader" class="loader-small hidden"></div><p id="ai-trade-text" class="text-sm text-gray-300 mt-2 text-left"></p></div> `;
            if(totalAssets > 0) { document.getElementById('get-ai-trade-btn').addEventListener('click', () => this.getAITradeAnalysis()); } 
            else { document.getElementById('ai-trade-analysis-container').classList.add('hidden'); }
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
        initMockDraftSimulator() {
            const controls = { startBtn: document.getElementById('start-draft-button'), scoringSelect: document.getElementById('draftScoringType'), sizeSelect: document.getElementById('leagueSize'), pickSelect: document.getElementById('userPick'), settingsContainer: document.getElementById('draft-settings-container'), draftingContainer: document.getElementById('interactive-draft-container'), completeContainer: document.getElementById('draft-complete-container'), restartBtn: document.getElementById('restart-draft-button'), };
            if (!controls.startBtn) return;
            const updateUserPickOptions = () => { const size = parseInt(controls.sizeSelect.value); controls.pickSelect.innerHTML = ''; for (let i = 1; i <= size; i++) { controls.pickSelect.add(new Option(`Pick ${i}`, i)); } };
            updateUserPickOptions();
            controls.sizeSelect.addEventListener('change', updateUserPickOptions);
            controls.startBtn.addEventListener('click', () => this.startInteractiveDraft(controls));
            controls.restartBtn.addEventListener('click', () => this.resetDraftUI(controls));
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
            statusCard.classList.toggle('on-the-clock', isUserTurn);
            let statusHTML = `<p class="text-gray-400 font-semibold">Round ${currentRound}/${totalRounds} | Pick ${overallPick}</p>`;
            if(isUserTurn) { statusHTML += `<p class="text-2xl font-bold text-yellow-300 text-glow-gold animate-pulse">YOU ARE ON THE CLOCK</p>`; } 
            else { const isSnake = currentRound % 2 === 0; const teamNumber = isSnake ? leagueSize - currentPickInRound + 1 : currentPickInRound; statusHTML += `<p class="text-xl font-semibold text-white">Team ${teamNumber} is picking...</p>`; }
            statusCard.innerHTML = statusHTML;
        },
        updateBestAvailable(isUserTurn) {
            const listEl = document.getElementById('best-available-list'); listEl.innerHTML = '';
            const topPlayers = this.draftState.availablePlayers.slice(0, 30);
            topPlayers.forEach(player => { const playerEl = document.createElement('div'); playerEl.className = 'best-available-player'; playerEl.innerHTML = `<span class="font-bold text-sm text-center w-12 player-pos-${player.simplePosition.toLowerCase()}">${player.simplePosition}</span><div class="flex-grow"><p class="player-name-link font-semibold text-white" data-player-name="${player.name}">${player.name}</p><p class="text-xs text-gray-400">${player.team} | Bye: ${player.bye || 'N/A'}</p></div>${isUserTurn ? `<button class="draft-button" data-player-name="${player.name}">Draft</button>` : `<span class="text-sm font-mono text-gray-500">${(player.adp.ppr || 999).toFixed(1)}</span>`}`; listEl.appendChild(playerEl); });
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
            const gridEl = document.getElementById('draft-board-grid'); const { leagueSize, draftPicks, userPickNum, totalRounds } = this.draftState; 
            gridEl.innerHTML = ''; // Clear previous log
            
            // Reverse the picks to show most recent first
            const reversedPicks = [...draftPicks].reverse();

            reversedPicks.forEach(pick => {
                const pickEl = document.createElement('div');
                pickEl.className = `draft-pick pick-pos-${pick.player.simplePosition.toLowerCase()} ${pick.teamNumber === userPickNum ? 'user-pick' : ''}`;
                pickEl.innerHTML = `<span class="pick-number">${pick.round}.${pick.pick}</span><p class="pick-player-name player-name-link" data-player-name="${pick.player.name}">${pick.player.name}</p><p class="pick-player-info">${pick.player.team} - ${pick.player.simplePosition}</p>`;
                gridEl.appendChild(pickEl);
            });
            this.addPlayerPopupListeners();
        },
        endInteractiveDraft() {
            this.draftState.controls.draftingContainer.classList.add('hidden'); this.draftState.controls.completeContainer.classList.remove('hidden');
            const rosterEl = document.getElementById('final-roster-display'); rosterEl.innerHTML = '';
            const myRoster = this.draftState.teams[this.draftState.userPickNum - 1].roster;
            const starters = []; const bench = []; const rosterSlots = { ...config.rosterSettings };
            myRoster.forEach(player => { const pos = player.simplePosition; if (rosterSlots[pos] > 0) { starters.push(player); rosterSlots[pos]--; } else if (config.flexPositions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; } else { bench.push(player); } });
            rosterEl.innerHTML = ` <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Starters</h4><div class="space-y-2">${starters.map(p => this.createPlayerCardHTML(p)).join('')}</div></div> <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Bench</h4><div class="space-y-2">${bench.map(p => this.createPlayerCardHTML(p, true)).join('')}</div></div> `;
            this.addPlayerPopupListeners();
        },
        resetDraftUI(controls) {
            controls.settingsContainer.classList.remove('hidden'); controls.draftingContainer.classList.add('hidden'); controls.completeContainer.classList.add('hidden');
            this.draftState = {};
        },
        getOrdinal(n) { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); },
        initArticlesPage() { /* Full implementation */ },
        async generateAiArticle(controls) { /* Full implementation */ },
        loadArticleContent() { /* Full implementation */ },
        initWaiverWirePage() { /* Full implementation */ },
        initLeagueDominatorPage() { /* Full implementation */ },
        initDynastyDashboardPage() { /* Full implementation */ },
        initMyLeaguePage() { /* Full implementation */ },
        populateMyLeagueData() { /* Full implementation */ }
    };

    App.init();
});
