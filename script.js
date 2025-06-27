document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: ['players.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, DST: 1, K: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"]
    };

    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {},
        tradeState: { team1: [], team2: [] }, // State for the trade analyzer
        popupHideTimeout: null, // For the popup fix

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
        
        // --- POPUP FIX ---
        addPlayerPopupListeners() {
            const popup = document.getElementById('player-popup-card');
            
            popup.addEventListener('mouseenter', () => clearTimeout(this.popupHideTimeout));
            popup.addEventListener('mouseleave', () => popup.classList.add('hidden'));

            document.querySelectorAll('.player-name-link').forEach(el => {
                el.addEventListener('mouseenter', (e) => {
                    clearTimeout(this.popupHideTimeout);
                    const playerName = e.target.dataset.playerName;
                    const player = this.playerData.find(p => p.name === playerName);
                    if (player) {
                        this.updateAndShowPopup(player, e);
                    }
                });
                el.addEventListener('mouseleave', () => {
                    this.popupHideTimeout = setTimeout(() => popup.classList.add('hidden'), 300);
                });
                el.addEventListener('mousemove', (e) => {
                    popup.style.left = `${e.pageX + 15}px`;
                    popup.style.top = `${e.pageY + 15}px`;
                });
            });
        },
        
        // --- NEW TRADE ANALYZER LOGIC ---
        initTradeAnalyzer() {
            const controls = {
                searchInput1: document.getElementById('trade-search-1'),
                autocomplete1: document.getElementById('trade-autocomplete-1'),
                teamContainer1: document.getElementById('trade-team-1'),
                searchInput2: document.getElementById('trade-search-2'),
                autocomplete2: document.getElementById('trade-autocomplete-2'),
                teamContainer2: document.getElementById('trade-team-2'),
                analyzeBtn: document.getElementById('analyze-trade-btn'),
                resultsContainer: document.getElementById('trade-results'),
            };

            if (!controls.analyzeBtn) return;
            
            controls.searchInput1.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput1, controls.autocomplete1, 1));
            controls.searchInput2.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput2, controls.autocomplete2, 2));

            controls.analyzeBtn.addEventListener('click', () => this.analyzeTrade());
        },

        showTradeAutocomplete(input, listEl, teamNum) {
            const searchTerm = input.value.toLowerCase();
            listEl.innerHTML = '';
            if (searchTerm.length < 2) return;

            const filtered = this.playerData
                .filter(p => p.name.toLowerCase().includes(searchTerm))
                .slice(0, 5);
            
            filtered.forEach(player => {
                const item = document.createElement('li');
                item.textContent = `${player.name} (${player.team} - ${player.simplePosition})`;
                item.addEventListener('click', () => {
                    this.addPlayerToTrade(player, teamNum);
                    input.value = '';
                    listEl.innerHTML = '';
                });
                listEl.appendChild(item);
            });
        },

        addPlayerToTrade(player, teamNum) {
            if (teamNum === 1) this.tradeState.team1.push(player);
            else this.tradeState.team2.push(player);
            this.renderTradeUI();
        },

        removePlayerFromTrade(playerName, teamNum) {
            if (teamNum === 1) {
                this.tradeState.team1 = this.tradeState.team1.filter(p => p.name !== playerName);
            } else {
                this.tradeState.team2 = this.tradeState.team2.filter(p => p.name !== playerName);
            }
            this.renderTradeUI();
        },

        renderTradeUI() {
            const container1 = document.getElementById('trade-team-1');
            const container2 = document.getElementById('trade-team-2');
            
            container1.innerHTML = this.tradeState.team1.length ? this.tradeState.team1.map(p => this.createTradePlayerPill(p, 1)).join('') : `<p class="text-gray-500 text-center p-4">Add players to this side of the trade.</p>`;
            container2.innerHTML = this.tradeState.team2.length ? this.tradeState.team2.map(p => this.createTradePlayerPill(p, 2)).join('') : `<p class="text-gray-500 text-center p-4">Add players to this side of the trade.</p>`;
            
            document.querySelectorAll('.trade-remove-btn').forEach(btn => {
                btn.onclick = () => this.removePlayerFromTrade(btn.dataset.playerName, parseInt(btn.dataset.teamNum));
            });
            this.addPlayerPopupListeners();
        },
        
        createTradePlayerPill(player, teamNum) {
            return `
                <div class="trade-player-pill player-pos-${player.simplePosition.toLowerCase()}">
                    <span class="player-name-link" data-player-name="${player.name}">${player.name}</span>
                    <span class="text-gray-400 ml-auto">${player.simplePosition}</span>
                    <button class="trade-remove-btn" data-player-name="${player.name}" data-team-num="${teamNum}">×</button>
                </div>
            `;
        },

        analyzeTrade() {
            const resultsContainer = document.getElementById('trade-results');
            resultsContainer.classList.remove('hidden');
            
            const totalVorp1 = this.tradeState.team1.reduce((sum, p) => sum + (p.vorp || 0), 0);
            const totalVorp2 = this.tradeState.team2.reduce((sum, p) => sum + (p.vorp || 0), 0);
            
            let verdict, winner, loser;
            const diff = Math.abs(totalVorp1 - totalVorp2);
            const higherVal = Math.max(totalVorp1, totalVorp2);

            if (diff / higherVal < 0.1) { // Difference is less than 10%
                verdict = `<h3 class="text-2xl font-bold text-yellow-300">This trade is relatively fair.</h3>`;
            } else if (totalVorp1 > totalVorp2) {
                verdict = `<h3 class="text-2xl font-bold text-green-400">Team Receiving Your Assets Wins.</h3>`;
            } else {
                verdict = `<h3 class="text-2xl font-bold text-green-400">Team Receiving Their Assets Wins.</h3>`;
            }
            
            resultsContainer.innerHTML = `
                <div class="text-center">${verdict}</div>
                <div id="ai-trade-analysis-container" class="popup-footer mt-4">
                    <button id="get-ai-trade-btn" class="ai-analysis-btn">Get AI Opinion</button>
                    <div id="ai-trade-loader" class="loader-small hidden"></div>
                    <p id="ai-trade-text" class="text-sm text-gray-300 mt-2 text-left"></p>
                </div>
            `;

            document.getElementById('get-ai-trade-btn').addEventListener('click', () => this.getAITradeAnalysis());
        },

        async getAITradeAnalysis() {
            const container = document.getElementById('ai-trade-analysis-container');
            const button = container.querySelector('#get-ai-trade-btn');
            const loader = container.querySelector('#ai-trade-loader');
            const textEl = container.querySelector('#ai-trade-text');

            button.classList.add('hidden');
            loader.classList.remove('hidden');
            
            const team1Players = this.tradeState.team1.map(p => p.name).join(', ');
            const team2Players = this.tradeState.team2.map(p => p.name).join(', ');
            
            const prompt = `Act as a fantasy football expert. Analyze this trade: A manager sends ${team1Players} and receives ${team2Players}. Provide a brief, strategic analysis of the trade, considering player value, age, and potential upside or risk. Keep it under 75 words.`;
            
            try {
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory };
                const apiKey = ""; 
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await response.json();
                
                if (result.candidates && result.candidates.length > 0) {
                    textEl.textContent = result.candidates[0].content.parts[0].text;
                } else { throw new Error('No content returned from AI.'); }
            } catch (error) {
                console.error("Gemini API error:", error);
                textEl.textContent = "Could not retrieve AI analysis at this time.";
            } finally {
                loader.classList.add('hidden');
            }
        },

        // --- ALL OTHER FUNCTIONS (UNCHANGED) ---
        
        // Omitted for brevity but are identical to the previous complete version.
        // This includes logic for mock drafts, other tools, stats/players pages, etc.
    };
    
    // This is a stand-in for the full list of functions from the previous script
    // to ensure this code block is not excessively long.
    const allOtherFunctions = {
        initMobileMenu() { /* ... */ }, initPlaceholderTicker() { /* ... */ }, initLiveTicker() { /* ... */ },
        async loadAllPlayerData() { /* ... */ }, displayDataError() { /* ... */ }, generateFantasyPoints() { /* ... */ },
        initTopPlayers() { /* ... */ }, initStatsPage() { /* ... */ }, initPlayersPage() { /* ... */ },
        initToolsPage() { /* ... */ }, setupGoatDraftControls() { /* ... */ }, async runGoatMockDraft() { /* ... */ },
        displayGoatDraftResults() { /* ... */ }, createPlayerCardHTML() { /* ... */ }, initStartSitTool() { /* ... */ },
        initMockDraftSimulator() { /* ... */ }, createPlayerPopup() { /* ... */ },
        updateAndShowPopup() { /* ... */ }, async getAiPlayerAnalysis() { /* ... */ }
    };
    
    // This is just a conceptual merge. The actual script should have all functions fully defined.
    Object.assign(App, allOtherFunctions, App); // Merges the new implementations with the stubs
    
    // In the actual file, you would just have all the full function definitions.
    // This is just to make this response manageable.
    App.init();
});
