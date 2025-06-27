document.addEventListener('DOMContentLoaded', () => {

    // Central configuration for the entire application
    const config = {
        dataFiles: [
            'players_part1.json',
            'players_part2.json',
            'players_part3.json'
        ],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, BENCH: 6 },
        // POSITIONS ARE CASE-SENSITIVE AND SHOULD MATCH THE 'position' PROPERTY IN THE JSON DATA
        positions: ["QB", "RB", "WR", "TE"]
    };

    // Main application object
    const App = {
        playerData: [], // Unified player data array
        isDataLoading: false,
        hasDataLoaded: false,

        // Initializes the application
        async init() {
            this.initMobileMenu();
            this.initTicker();
            
            // Page-specific initializations
            if (document.getElementById('top-players-section')) {
                await this.loadAllPlayerData();
                this.initTopPlayers();
            }
            if (document.getElementById('goat-draft-builder')) {
                await this.loadAllPlayerData();
                this.setupDraftControls();
            }
            if (document.getElementById('players-page')) {
                await this.loadAllPlayerData();
                this.initPlayersPage();
            }
             if (document.getElementById('stats-page')) {
                await this.loadAllPlayerData();
                this.initStatsPage();
            }
            if (document.getElementById('trade-analyzer')) {
                await this.loadAllPlayerData();
                this.initTradeAnalyzer();
            }
        },
        
        // Sets up the mobile menu toggle
        initMobileMenu() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mainNav = document.querySelector('header nav.hidden.md\\:flex');
            const mobileNav = document.getElementById('mobile-menu');

            if (mobileMenuButton && mainNav && mobileNav) {
                // Clone the main navigation into the mobile menu if it's empty
                if (mobileNav.innerHTML.trim() === '') {
                    const clonedNav = mainNav.cloneNode(true);
                    clonedNav.classList.remove('hidden', 'md:flex', 'space-x-6');
                    clonedNav.classList.add('flex', 'flex-col', 'space-y-2');
                    Array.from(clonedNav.children).forEach(link => {
                        link.classList.add('nav-link-mobile');
                    });
                    mobileNav.appendChild(clonedNav);
                }
                
                // Add click event listener to toggle mobile menu visibility
                mobileMenuButton.addEventListener('click', () => {
                    mobileNav.classList.toggle('hidden');
                });
            }
        },

        // Initializes the news ticker
        initTicker() {
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer) return;
            const newsItems = [
                "Ja'Marr Chase expected to sign record-breaking extension.",
                "Saquon Barkley feels 'explosive' in new Eagles offense.",
                "Rookie Marvin Harrison Jr. already turning heads in Arizona.",
                "Christian McCaffrey remains the focal point of the 49ers attack.",
                "Amon-Ra St. Brown and Jahmyr Gibbs form a lethal duo in Detroit."
            ];
            const tickerContent = newsItems.map(item => `<span class="px-4">${item}</span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            tickerContainer.innerHTML = tickerContent.repeat(5); // Repeat for a smooth, continuous scroll
        },

        // Loads and combines player data from all specified JSON files
        async loadAllPlayerData() {
            if (this.hasDataLoaded || this.isDataLoading) {
                return;
            }
            this.isDataLoading = true;
            try {
                const fetchPromises = config.dataFiles.map(file => fetch(file).then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${file}: ${res.statusText}`);
                    return res.json();
                }));
                const allParts = await Promise.all(fetchPromises);
                let combinedData = [].concat(...allParts);

                // Standardize and enhance player data
                combinedData.forEach(p => {
                    // Sanitize position to a simple format (e.g., "WR15" becomes "WR")
                    p.simplePosition = (p.position || '').replace(/\d+$/, '').trim().toUpperCase();
                    // Ensure ADP values are numbers, defaulting to a high number if null or invalid
                    p.adp = p.adp || {};
                    for (const key in p.adp) {
                        p.adp[key] = parseFloat(p.adp[key]) || 999;
                    }
                });

                this.playerData = combinedData;
                this.hasDataLoaded = true;
            } catch (error) {
                console.error("Error loading player data:", error);
                this.playerData = []; // Ensure playerData is an array even on failure
            } finally {
                this.isDataLoading = false;
            }
        },
        
        // Populates the top players section on the homepage
        initTopPlayers() {
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;
            
            const pprPlayers = [...this.playerData].sort((a, b) => (a.adp.ppr || 999) - (b.adp.ppr || 999));

            const topPlayers = {
                "Top Quarterbacks": pprPlayers.filter(p => p.simplePosition === 'QB').slice(0, 5),
                "Top Running Backs": pprPlayers.filter(p => p.simplePosition === 'RB').slice(0, 5),
                "Top Wide Receivers": pprPlayers.filter(p => p.simplePosition === 'WR').slice(0, 5)
            };

            container.innerHTML = Object.entries(topPlayers).map(([title, players]) => `
                <div class="player-showcase-card">
                    <h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3>
                    <ol class="list-none p-0">
                        ${players.map(p => `
                            <li class="flex justify-between items-center py-3 border-b border-gray-700 last:border-b-0">
                                <span class="font-semibold text-lg text-slate-100">${p.name}</span>
                                <span class="font-bold text-teal-400">${p.team}</span>
                            </li>`).join('')}
                    </ol>
                </div>
            `).join('');
        },

        // Sets up controls for the GOAT draft builder tool
        setupDraftControls() {
            const leagueSizeSelect = document.getElementById('leagueSize');
            const draftPositionSelect = document.getElementById('draftPosition');
            const generateButton = document.getElementById('generateDraftBuildButton');
            const scoringTypeSelect = document.getElementById('draftScoringType');

            if(!leagueSizeSelect || !draftPositionSelect || !generateButton || !scoringTypeSelect) return;

            // Populates draft position options based on league size
            const updateDraftPositions = () => {
                const size = parseInt(leagueSizeSelect.value);
                draftPositionSelect.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    draftPositionSelect.add(new Option(`Pick ${i}`, i));
                }
            };
            
            leagueSizeSelect.addEventListener('change', updateDraftPositions);
            generateButton.addEventListener('click', () => this.runMockDraft());
            updateDraftPositions(); // Initial population
        },

        // Runs the mock draft simulation
        async runMockDraft() {
            const loader = document.getElementById('draft-loading-spinner');
            const resultsWrapper = document.getElementById('draft-results-wrapper');
            if(!loader || !resultsWrapper) return;

            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');

            const scoring = document.getElementById('draftScoringType').value.toLowerCase();
            const leagueSize = parseInt(document.getElementById('leagueSize').value);
            const userDraftPos = parseInt(document.getElementById('draftPosition').value) - 1;

            if (!this.hasDataLoaded) await this.loadAllPlayerData();
            
            // Filter and sort players based on selected scoring and valid ADP
            let availablePlayers = [...this.playerData]
                .filter(p => p.adp && typeof p.adp[scoring] === 'number')
                .sort((a, b) => a.adp[scoring] - b.adp[scoring]);

            const teams = Array.from({ length: leagueSize }, () => ({
                 roster: [],
                 needs: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, BENCH: 6 } 
            }));
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 0; round < totalRounds; round++) {
                // Determine pick order for the current round (snake draft)
                const picksInRoundOrder = (round % 2 !== 0) ? 
                    Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) :
                    Array.from({ length: leagueSize }, (_, i) => i);

                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    
                    // --- Advanced Draft Logic ---
                    // 1. Get the top ~15 available players
                    const topAvailable = availablePlayers.slice(0, 15);
                    
                    // 2. Score them based on VORP and team need
                    topAvailable.forEach(player => {
                        let score = player.vorp || 0;
                        // Boost score if the position is a need
                        if (teams[teamIndex].needs[player.simplePosition] > 0) {
                            score *= 1.5; // High need
                        } else if (config.positions.includes(player.simplePosition) && teams[teamIndex].needs['FLEX'] > 0) {
                            score *= 1.2; // Flex need
                        }
                        // Add randomness to simulate real draft unpredictability
                        score *= (1 + (Math.random() - 0.5) * 0.25); // +/- 12.5% variance
                        player.draftScore = score;
                    });
                    
                    // 3. Sort by the calculated draft score
                    topAvailable.sort((a, b) => b.draftScore - a.draftScore);
                    
                    // 4. Draft the best player
                    const draftedPlayer = topAvailable[0];
                    const draftedPlayerIndexInAvailable = availablePlayers.findIndex(p => p.name === draftedPlayer.name);
                    
                    if (draftedPlayerIndexInAvailable !== -1) {
                        availablePlayers.splice(draftedPlayerIndexInAvailable, 1);
                    }
                    
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        teams[teamIndex].roster.push(draftedPlayer);
                        // Update team needs
                        if (teams[teamIndex].needs[draftedPlayer.simplePosition] > 0) {
                            teams[teamIndex].needs[draftedPlayer.simplePosition]--;
                        } else if (teams[teamIndex].needs['FLEX'] > 0 && config.positions.includes(draftedPlayer.simplePosition)) {
                            teams[teamIndex].needs['FLEX']--;
                        } else {
                            teams[teamIndex].needs['BENCH']--;
                        }
                    }
                }
            }
            this.displayDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
        },

        // Displays the results of the mock draft
        displayDraftResults(roster) {
            const startersEl = document.getElementById('starters-list');
            const benchEl = document.getElementById('bench-list');
            if(!startersEl || !benchEl) return;

            startersEl.innerHTML = '';
            benchEl.innerHTML = '';

            const starters = [];
            const bench = [];
            const rosterSlots = { ...config.rosterSettings };

            // Sort roster by ADP to prioritize early picks for starting roles
            roster.sort((a, b) => a.adp.ppr - b.adp.ppr);

            // Fill starting positions
            roster.forEach(player => {
                const pos = player.simplePosition;
                if (rosterSlots[pos] > 0) {
                    player.displayPos = pos;
                    starters.push(player);
                    rosterSlots[pos]--;
                } else if (config.positions.includes(pos) && rosterSlots['FLEX'] > 0) {
                    player.displayPos = 'FLEX';
                    starters.push(player);
                    rosterSlots['FLEX']--;
                } else {
                    bench.push(player);
                }
            });

            // Re-sort starters by position for display
            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX'];
            starters.sort((a, b) => positionOrder.indexOf(a.displayPos) - positionOrder.indexOf(b.displayPos));
            
            // Generate HTML for starters and bench
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('');
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('');
        },
        
        // Creates HTML for a single player card
        createPlayerCardHTML(player, isBench = false) {
             const pos = isBench ? 'BEN' : player.displayPos;
             return `
                <div class="player-card player-pos-${player.simplePosition.toLowerCase()}">
                    <strong class="font-bold">${pos}:</strong> 
                    <span class="ml-2">${player.name} (${player.team})</span>
                    <span class="text-xs text-gray-400 ml-auto">${player.draftedAt}</span>
                </div>`;
        },

        // Initializes functionality for the players page
        initPlayersPage() {
            const searchInput = document.getElementById('player-search-input');
            if (!searchInput) return;

            this.renderPlayerList(this.playerData);

            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredPlayers = this.playerData.filter(p => p.name.toLowerCase().includes(searchTerm));
                this.renderPlayerList(filteredPlayers);
            });
        },

        // Renders the list of players on the players page
        renderPlayerList(players) {
            const container = document.getElementById('player-list-container');
            if (!container) return;
            
            players.sort((a,b) => (a.adp.ppr || 999) - (b.adp.ppr || 999));

            container.innerHTML = players.map(player => `
                <div class="tool-card p-4 flex items-center gap-4">
                     <span class="font-bold text-lg w-12 text-center player-pos-${player.simplePosition.toLowerCase()}">${player.simplePosition}</span>
                     <div>
                        <p class="font-bold text-white text-lg">${player.name}</p>
                        <p class="text-teal-300 text-sm">${player.team} | Bye: ${player.bye || 'N/A'}</p>
                     </div>
                     <div class="ml-auto text-right">
                         <p class="text-white font-semibold">ADP</p>
                         <p class="text-yellow-400 text-sm font-bold">${player.adp.ppr || 'N/A'}</p>
                     </div>
                </div>
            `).join('');
        },
        
        // Initializes the stats page
        initStatsPage() {
            // Placeholder for future stats functionality
            const tableBody = document.querySelector('#statsTable tbody');
            if(tableBody) {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">Player statistics loading is not yet implemented.</td></tr>`;
            }
        },

        // Initializes the trade analyzer tool
        initTradeAnalyzer() {
            // Placeholder for future trade analyzer functionality
            const analyzeBtn = document.getElementById('analyzeTradeBtn');
            const resultsEl = document.getElementById('trade-results');
            if(analyzeBtn && resultsEl) {
                 analyzeBtn.addEventListener('click', () => {
                     resultsEl.classList.remove('hidden');
                     document.getElementById('trade-verdict').textContent = 'Trade analysis is not yet implemented.';
                 });
            }
        }
    };

    // Start the application
    App.init();
});
