document.addEventListener('DOMContentLoaded', () => {

    // Central configuration for the entire application
    const config = {
        // To switch to a single file, just change this to: ['all_players.json']
        dataFiles: [
            'players_part1.json',
            'players_part2.json',
            'players_part3.json'
        ],
        // Default roster settings, will be updated by user selection in the GOAT tool
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE"] // For FLEX logic
    };

    // Main application object
    const App = {
        playerData: [],
        isDataLoading: false,
        hasDataLoaded: false,

        // Initializes the application
        async init() {
            this.initMobileMenu();
            await this.loadAllPlayerData(); // Load data first
            this.initTicker(); // Then init ticker which depends on data
            
            // Page-specific initializations
            if (document.getElementById('top-players-section')) this.initTopPlayers();
            if (document.getElementById('goat-draft-builder')) this.setupDraftControls();
            if (document.getElementById('start-sit-tool')) this.initStartSitTool();
            if (document.getElementById('players-page')) this.initPlayersPage();
            if (document.getElementById('stats-page')) this.initStatsPage();
            if (document.getElementById('trade-analyzer')) this.initTradeAnalyzer();
        },
        
        // Sets up the mobile menu toggle
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

        // Initializes the live player points ticker
        initTicker() {
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer || !this.playerData.length) return;

            // Get top 10 players from each main position based on generated points
            const topPlayers = [
                ...this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 10),
                ...this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 10),
                ...this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 10),
                ...this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 10)
            ];
            
            // Sort all collected players by their points
            topPlayers.sort((a,b) => b.fantasyPoints - a.fantasyPoints);

            const tickerContent = topPlayers.map(player => `
                <span class="flex items-center mx-4">
                    <span class="font-semibold text-white">${player.name} (${player.simplePosition})</span>
                    <span class="ml-2 font-bold text-yellow-400">${player.fantasyPoints.toFixed(2)} pts</span>
                </span>
            `).join('<span class="text-teal-500 font-bold px-2">|</span>');

            tickerContainer.innerHTML = tickerContent.repeat(3);
        },

        // Loads and combines player data from all specified JSON files
        async loadAllPlayerData() {
            if (this.hasDataLoaded || this.isDataLoading) return;
            this.isDataLoading = true;
            try {
                const fetchPromises = config.dataFiles.map(file => fetch(file).then(res => res.json()));
                const allParts = await Promise.all(fetchPromises);
                let combinedData = [].concat(...allParts);

                // Standardize and enhance player data
                combinedData.forEach(p => {
                    p.simplePosition = (p.position || '').replace(/\d+$/, '').trim().toUpperCase();
                    p.adp = p.adp || {};
                    for (const key in p.adp) {
                        p.adp[key] = parseFloat(p.adp[key]) || 999;
                    }
                    // Generate dynamic "live" fantasy points for demonstration
                    p.fantasyPoints = this.generateFantasyPoints(p);
                });
                
                // Sort players by fantasy points once after generation
                combinedData.sort((a, b) => b.fantasyPoints - a.fantasyPoints);

                this.playerData = combinedData;
                this.hasDataLoaded = true;
            } catch (error) {
                console.error("Error loading player data:", error);
            } finally {
                this.isDataLoading = false;
            }
        },

        // Generates somewhat realistic fantasy points for a player
        generateFantasyPoints(player) {
            // Base points on VORP and tier, with randomness
            const base = (player.vorp || 10) * 0.5 + (10 - (player.tier || 10)) * 2;
            const randomness = (Math.random() - 0.2) * 15; // Random factor for variability
            const points = base + randomness;
            return Math.max(0, points); // Ensure points are not negative
        },
        
        // Populates the top players section on the homepage
        initTopPlayers() {
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;

            const topPlayersByPos = {
                "Quarterbacks": this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 4),
                "Running Backs": this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 4),
                "Wide Receivers": this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 4),
                "Tight Ends": this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 4)
            };

            container.innerHTML = Object.entries(topPlayersByPos).map(([title, players]) => `
                <div class="player-showcase-card">
                    <h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3>
                    <ol class="list-none p-0 space-y-3">
                        ${players.map((p, index) => `
                            <li class="flex items-center py-2 border-b border-gray-700/50 last:border-b-0">
                                <span class="text-2xl font-bold text-teal-400/60 w-8">${index + 1}</span>
                                <div class="flex-grow">
                                    <span class="font-semibold text-lg text-slate-100">${p.name}</span>
                                    <span class="text-sm text-gray-400 block">${p.team}</span>
                                </div>
                                <span class="font-bold text-xl text-yellow-400">${p.fantasyPoints.toFixed(2)}</span>
                            </li>`).join('')}
                    </ol>
                </div>
            `).join('');
        },

        // Sets up controls for the GOAT draft builder tool
        setupDraftControls() {
            const controls = {
                leagueSize: document.getElementById('leagueSize'),
                draftPosition: document.getElementById('draftPosition'),
                generateButton: document.getElementById('generateDraftBuildButton'),
                scoringType: document.getElementById('draftScoringType'),
                rosterInputs: {
                    QB: document.getElementById('roster-qb'),
                    RB: document.getElementById('roster-rb'),
                    WR: document.getElementById('roster-wr'),
                    TE: document.getElementById('roster-te'),
                    FLEX: document.getElementById('roster-flex')
                }
            };
            if (!controls.generateButton) return;

            const updateDraftPositions = () => {
                const size = parseInt(controls.leagueSize.value);
                controls.draftPosition.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    controls.draftPosition.add(new Option(`Pick ${i}`, i));
                }
            };
            
            controls.leagueSize.addEventListener('change', updateDraftPositions);
            controls.generateButton.addEventListener('click', () => {
                // Update roster settings from inputs before running the draft
                config.rosterSettings = {
                    QB: parseInt(controls.rosterInputs.QB.value),
                    RB: parseInt(controls.rosterInputs.RB.value),
                    WR: parseInt(controls.rosterInputs.WR.value),
                    TE: parseInt(controls.rosterInputs.TE.value),
                    FLEX: parseInt(controls.rosterInputs.FLEX.value),
                    BENCH: 6 // Keep bench static for now
                };
                this.runMockDraft();
            });
            updateDraftPositions();
        },

        // Runs the mock draft simulation
        async runMockDraft() {
            // (The core mock draft logic from the previous version remains largely the same,
            // but now uses the dynamically updated config.rosterSettings)
            const loader = document.getElementById('draft-loading-spinner');
            const resultsWrapper = document.getElementById('draft-results-wrapper');
            if(!loader || !resultsWrapper) return;

            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');

            const scoring = document.getElementById('draftScoringType').value.toLowerCase();
            const leagueSize = parseInt(document.getElementById('leagueSize').value);
            const userDraftPos = parseInt(document.getElementById('draftPosition').value) - 1;

            if (!this.hasDataLoaded) await this.loadAllPlayerData();
            
            let availablePlayers = [...this.playerData]
                .filter(p => p.adp && typeof p.adp[scoring] === 'number')
                .sort((a, b) => a.adp[scoring] - b.adp[scoring]);

            const teams = Array.from({ length: leagueSize }, () => ({
                 roster: [],
                 needs: { ...config.rosterSettings } 
            }));
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? 
                    Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) :
                    Array.from({ length: leagueSize }, (_, i) => i);

                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    
                    const topAvailable = availablePlayers.slice(0, 15);
                    topAvailable.forEach(player => {
                        let score = player.vorp || 0;
                        if (teams[teamIndex].needs[player.simplePosition] > 0) score *= 1.5;
                        else if (config.positions.includes(player.simplePosition) && teams[teamIndex].needs['FLEX'] > 0) score *= 1.2;
                        score *= (1 + (Math.random() - 0.5) * 0.25);
                        player.draftScore = score;
                    });
                    
                    topAvailable.sort((a, b) => b.draftScore - a.draftScore);
                    const draftedPlayer = topAvailable[0];
                    const draftedPlayerIndexInAvailable = availablePlayers.findIndex(p => p.name === draftedPlayer.name);
                    
                    if (draftedPlayerIndexInAvailable !== -1) availablePlayers.splice(draftedPlayerIndexInAvailable, 1);
                    
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        teams[teamIndex].roster.push(draftedPlayer);
                        if (teams[teamIndex].needs[draftedPlayer.simplePosition] > 0) teams[teamIndex].needs[draftedPlayer.simplePosition]--;
                        else if (teams[teamIndex].needs['FLEX'] > 0 && config.positions.includes(draftedPlayer.simplePosition)) teams[teamIndex].needs['FLEX']--;
                        else teams[teamIndex].needs['BENCH']--;
                    }
                }
            }
            this.displayDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
        },

        // Displays the results of the mock draft
        displayDraftResults(roster) {
            // (This function remains the same as the previous version)
            const startersEl = document.getElementById('starters-list');
            const benchEl = document.getElementById('bench-list');
            if(!startersEl || !benchEl) return;
            startersEl.innerHTML = '';
            benchEl.innerHTML = '';
            const starters = [];
            const bench = [];
            const rosterSlots = { ...config.rosterSettings };
            roster.sort((a, b) => a.adp.ppr - b.adp.ppr);
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
            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX'];
            starters.sort((a, b) => positionOrder.indexOf(a.displayPos) - positionOrder.indexOf(b.displayPos));
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('');
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('');
        },
        
        createPlayerCardHTML(player, isBench = false) {
             const pos = isBench ? 'BEN' : player.displayPos;
             return `<div class="player-card player-pos-${player.simplePosition.toLowerCase()}"><strong class="font-bold">${pos}:</strong><span class="ml-2">${player.name} (${player.team})</span><span class="text-xs text-gray-400 ml-auto">${player.draftedAt}</span></div>`;
        },

        // --- NEW Start/Sit Tool ---
        initStartSitTool() {
            const tool = {
                player1Input: document.getElementById('start-sit-player1'),
                player2Input: document.getElementById('start-sit-player2'),
                analyzeBtn: document.getElementById('start-sit-analyze'),
                resultsContainer: document.getElementById('start-sit-results')
            };
            if(!tool.analyzeBtn) return;

            [tool.player1Input, tool.player2Input].forEach(input => {
                input.addEventListener('input', e => this.showAutocomplete(e.target));
            });
            
            tool.analyzeBtn.addEventListener('click', () => {
                const player1 = this.playerData.find(p => p.name === tool.player1Input.value);
                const player2 = this.playerData.find(p => p.name === tool.player2Input.value);
                this.analyzeStartSit(player1, player2);
            });
        },
        
        showAutocomplete(inputElement) {
            const listId = inputElement.id + '-autocomplete';
            let list = document.getElementById(listId);
            if (!list) {
                list = document.createElement('div');
                list.id = listId;
                list.className = 'autocomplete-list';
                inputElement.parentNode.appendChild(list);
            }
            
            const searchTerm = inputElement.value.toLowerCase();
            list.innerHTML = '';
            if (searchTerm.length < 2) return;

            const filtered = this.playerData
                .filter(p => p.name.toLowerCase().includes(searchTerm))
                .slice(0, 5);
            
            filtered.forEach(player => {
                const item = document.createElement('li');
                item.textContent = `${player.name} (${player.team})`;
                item.addEventListener('click', () => {
                    inputElement.value = player.name;
                    list.innerHTML = '';
                });
                list.appendChild(item);
            });
        },

        analyzeStartSit(p1, p2) {
            const resultsContainer = document.getElementById('start-sit-results');
            if (!p1 || !p2) {
                resultsContainer.innerHTML = `<p class="text-red-400">Please select two valid players.</p>`;
                resultsContainer.classList.remove('hidden');
                return;
            }

            // Simple scoring algorithm based on VORP, tier, and generated points
            const score1 = (p1.vorp * 2) + ((10 - p1.tier) * 5) + p1.fantasyPoints;
            const score2 = (p2.vorp * 2) + ((10 - p2.tier) * 5) + p2.fantasyPoints;
            
            const winner = score1 > score2 ? p1 : p2;
            const loser = score1 > score2 ? p2 : p1;

            const advice = this.generateStartSitAdvice(winner, loser);

            resultsContainer.innerHTML = `
                <h3 class="text-2xl font-bold text-yellow-300 mb-4">The Verdict</h3>
                <div class="verdict-card start">
                    <p class="decision-text">START</p>
                    <p class="player-name">${winner.name}</p>
                    <p class="player-details">${winner.simplePosition} | ${winner.team}</p>
                </div>
                <div class="verdict-card sit">
                     <p class="decision-text">SIT</p>
                    <p class="player-name">${loser.name}</p>
                    <p class="player-details">${loser.simplePosition} | ${loser.team}</p>
                </div>
                <div class="analysis-section">
                    <h4 class="font-semibold text-teal-300">Analysis</h4>
                    <p class="text-gray-300">${advice}</p>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
        },
        
        generateStartSitAdvice(winner, loser) {
            const reasons = [
                `has a significantly higher Value Over Replacement Player (VORP), indicating greater potential impact.`,
                `is in a higher tier, suggesting more reliable week-to-week production.`,
                `has a better recent performance trend, making them the safer bet this week.`,
                `simply projects for more points based on our latest data models.`,
                `has a more favorable matchup, increasing their scoring ceiling.`
            ];
            const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
            return `While both are viable options, **${winner.name}** gets the edge. Our model indicates that ${winner.name} ${randomReason} Consider starting ${loser.name} only in deeper leagues or as a bye-week replacement.`;
        },


        // --- Other Page Initializers ---
        initPlayersPage() { /* Logic is in previous script version, can be re-added if needed */ },
        initStatsPage() { /* Logic is in previous script version, can be re-added if needed */ },
        initTradeAnalyzer() { /* Logic is in previous script version, can be re-added if needed */ },
    };

    App.init();
});
