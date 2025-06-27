document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: ['players.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, DST: 1, K: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE", "DST", "K"],
        flexPositions: ["RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"]
    };

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
        
        // --- NEW: Player Rankings Page Logic ---
        initPlayersPage() {
            const controls = {
                searchInput: document.getElementById('player-search-input'),
                positionFilter: document.getElementById('position-filter'),
                tierFilter: document.getElementById('tier-filter'),
                teamFilter: document.getElementById('team-filter'),
                tableBody: document.getElementById('player-table-body'),
                sortHeaders: document.querySelectorAll('.sortable-header')
            };

            if (!controls.tableBody) return;

            let currentSort = { key: 'adp_ppr', order: 'asc' };

            // Populate dynamic filters
            this.populateFilterOptions(controls);

            const renderTable = () => {
                let filteredPlayers = [...this.playerData];

                // Apply filters
                const pos = controls.positionFilter.value;
                if (pos !== 'ALL') {
                    if (pos === 'FLEX') {
                        filteredPlayers = filteredPlayers.filter(p => config.flexPositions.includes(p.simplePosition));
                    } else {
                        filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos);
                    }
                }
                const tier = controls.tierFilter.value;
                if (tier !== 'ALL') {
                    filteredPlayers = filteredPlayers.filter(p => p.tier == tier);
                }
                const team = controls.teamFilter.value;
                if (team !== 'ALL') {
                    filteredPlayers = filteredPlayers.filter(p => p.team === team);
                }
                const searchTerm = controls.searchInput.value.toLowerCase();
                if (searchTerm) {
                    filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm));
                }

                // Apply sorting
                filteredPlayers.sort((a, b) => {
                    let valA, valB;
                    if (currentSort.key === 'adp_ppr') {
                        valA = a.adp.ppr || 999;
                        valB = b.adp.ppr || 999;
                    } else {
                        valA = a[currentSort.key] || 0;
                        valB = b[currentSort.key] || 0;
                    }

                    if (typeof valA === 'string') {
                        return currentSort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    }
                    return currentSort.order === 'asc' ? valA - valB : valB - valA;
                });

                // Render table rows
                controls.tableBody.innerHTML = filteredPlayers.map(p => this.createPlayerTableRow(p)).join('');
                if (filteredPlayers.length === 0) {
                    controls.tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400 py-8">No players match the current filters.</td></tr>`;
                }

                this.addPlayerPopupListeners();
            };

            controls.sortHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const sortKey = header.dataset.sort;
                    if (currentSort.key === sortKey) {
                        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                    } else {
                        currentSort.key = sortKey;
                        currentSort.order = 'asc';
                    }
                    renderTable();
                });
            });

            [controls.searchInput, controls.positionFilter, controls.tierFilter, controls.teamFilter].forEach(el => {
                el.addEventListener('input', renderTable);
            });

            renderTable();
        },

        populateFilterOptions(controls) {
            const tiers = [...new Set(this.playerData.map(p => p.tier).filter(t => t))].sort((a, b) => a - b);
            const teams = [...new Set(this.playerData.map(p => p.team).filter(t => t))].sort();

            tiers.forEach(tier => {
                controls.tierFilter.add(new Option(`Tier ${tier}`, tier));
            });
            teams.forEach(team => {
                controls.teamFilter.add(new Option(team, team));
            });
        },

        createPlayerTableRow(player) {
            const tierColorClasses = {
                1: 'bg-yellow-500/20 text-yellow-300', 2: 'bg-blue-500/20 text-blue-300',
                3: 'bg-green-500/20 text-green-300', 4: 'bg-indigo-500/20 text-indigo-300',
                5: 'bg-purple-500/20 text-purple-300', default: 'bg-gray-500/20 text-gray-300'
            };
            const tierClass = tierColorClasses[player.tier] || tierColorClasses.default;

            return `
                <tr class="hover:bg-gray-800/50">
                    <td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></td>
                    <td class="p-4 text-center font-bold text-sm">${player.simplePosition}</td>
                    <td class="p-4 text-center text-gray-400">${player.team || 'N/A'}</td>
                    <td class="p-4 text-center"><span class="tier-badge ${tierClass}">Tier ${player.tier || 'N/A'}</span></td>
                    <td class="p-4 text-center font-mono">${player.adp.ppr || '--'}</td>
                    <td class="p-4 text-center font-mono">${(player.vorp || 0).toFixed(2)}</td>
                </tr>
            `;
        },

        // --- ALL OTHER FUNCTIONS (UNCHANGED) ---
        // Includes logic for mobile menu, ticker, data loading, popups, other tools, etc.
        // ... (all other functions from the previous complete script are included here)
    };

    // This is a stand-in for the full list of functions from the previous script
    // to ensure this code block is not excessively long.
    const allOtherFunctions = {
        initMobileMenu() { /* ... */ }, initPlaceholderTicker() { /* ... */ }, initLiveTicker() { /* ... */ },
        async loadAllPlayerData() { /* ... */ }, displayDataError() { /* ... */ }, generateFantasyPoints() { /* ... */ },
        initTopPlayers() { /* ... */ }, initStatsPage() { /* ... */ }, initTradeAnalyzer() { /* ... */ }, showTradeAutocomplete() { /* ... */ },
        addPlayerToTrade() { /* ... */ }, removePlayerFromTrade() { /* ... */ }, renderTradeUI() { /* ... */ }, createTradePlayerPill() { /* ... */ },
        analyzeTrade() { /* ... */ }, async getAITradeAnalysis() { /* ... */ }, setupGoatDraftControls() { /* ... */ },
        async runGoatMockDraft() { /* ... */ }, displayGoatDraftResults() { /* ... */ }, createPlayerCardHTML() { /* ... */ },
        initStartSitTool() { /* ... */ }, analyzeStartSit() { /* ... */ }, generateStartSitAdvice() { /* ... */ },
        initMockDraftSimulator() { /* ... */ }, startInteractiveDraft() { /* ... */ }, runDraftTurn() { /* ... */ },
        makeAiPick() { /* ... */ }, makeUserPick() { /* ... */ }, makePick() { /* ... */ }, updateDraftStatus() { /* ... */ },
        updateBestAvailable() { /* ... */ }, updateMyTeam() { /* ... */ }, updateDraftBoard() { /* ... */ }, endInteractiveDraft() { /* ... */ },
        resetDraftUI() { /* ... */ }, createPlayerPopup() { /* ... */ }, addPlayerPopupListeners() { /* ... */ },
        updateAndShowPopup() { /* ... */ }, async getAiPlayerAnalysis() { /* ... */ }
    };
    
    // The actual script would have all functions fully defined.
    Object.assign(App, allOtherFunctions, App); 
    
    App.init();
});
