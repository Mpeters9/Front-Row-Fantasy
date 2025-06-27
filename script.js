document.addEventListener('DOMContentLoaded', () => {

    // Central configuration for the entire application
    const config = {
        dataFiles: ['players_part1.json', 'players_part2.json', 'players_part3.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE"]
    };

    // Main application object
    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {}, // For interactive mock draft

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
            if (document.getElementById('goat-draft-builder')) this.setupGoatDraftControls(); // Corrected function call
            if (document.getElementById('start-sit-tool')) this.initStartSitTool();
            if (document.getElementById('mock-draft-simulator')) this.initMockDraftSimulator();
            // Other page initializations can go here
        },
        
        initMobileMenu() { /* Unchanged */ 
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

        initPlaceholderTicker() { /* Unchanged */ 
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer) return;
            const newsItems = ["Ja'Marr Chase expected to sign record-breaking extension.", "Saquon Barkley feels 'explosive' in new Eagles offense.", "Rookie Marvin Harrison Jr. already turning heads in Arizona."];
            const tickerContent = newsItems.map(item => `<span class="px-4">${item}</span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            tickerContainer.innerHTML = tickerContent.repeat(5);
        },

        initLiveTicker() { /* Unchanged */ 
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer || !this.playerData.length) return;
            const topPlayers = [...this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 10)];
            topPlayers.sort((a,b) => b.fantasyPoints - a.fantasyPoints);
            const tickerContent = topPlayers.map(player => `<span class="flex items-center mx-4"><span class="font-semibold text-white">${player.name} (${player.simplePosition})</span><span class="ml-2 font-bold text-yellow-400">${player.fantasyPoints.toFixed(2)} pts</span></span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            tickerContainer.style.opacity = 0;
            setTimeout(() => { tickerContainer.innerHTML = tickerContent.repeat(3); tickerContainer.style.opacity = 1; }, 500);
        },

        async loadAllPlayerData() { /* Unchanged */ 
            if (this.hasDataLoaded) return;
            this.hasDataLoaded = true;
            try {
                const fetchPromises = config.dataFiles.map(file => fetch(file).then(res => res.json()));
                const allParts = await Promise.all(fetchPromises);
                let combinedData = [].concat(...allParts);
                combinedData.forEach(p => {
                    p.simplePosition = (p.position || '').replace(/\d+$/, '').trim().toUpperCase();
                    p.adp = p.adp || {};
                    for (const key in p.adp) p.adp[key] = parseFloat(p.adp[key]) || 999;
                    p.fantasyPoints = this.generateFantasyPoints(p);
                });
                combinedData.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
                this.playerData = combinedData;
            } catch (error) { console.error("Error loading player data:", error); }
        },
        
        generateFantasyPoints(player) { /* Unchanged */ 
            const base = (player.vorp || 10) * 0.5 + (10 - (player.tier || 10)) * 2;
            const randomness = (Math.random() - 0.2) * 15;
            return Math.max(0, base + randomness);
        },

        initTopPlayers() { /* Unchanged but including for completeness */ 
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;
            const topPlayersByPos = {"Quarterbacks": this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 4), "Running Backs": this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 4), "Wide Receivers": this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 4), "Tight Ends": this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 4)};
            container.innerHTML = Object.entries(topPlayersByPos).map(([title, players]) => `<div class="player-showcase-card"><h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3><ol class="list-none p-0 space-y-3">${players.map((p, index) => `<li class="flex items-center py-2 border-b border-gray-700/50 last:border-b-0"><span class="text-2xl font-bold text-teal-400/60 w-8">${index + 1}</span><div class="flex-grow"><span class="player-name-link font-semibold text-lg text-slate-100" data-player-name="${p.name}">${p.name}</span><span class="text-sm text-gray-400 block">${p.team}</span></div><span class="font-bold text-xl text-yellow-400">${p.fantasyPoints.toFixed(2)}</span></li>`).join('')}</ol></div>`).join('');
            this.addPlayerPopupListeners();
        },

        // --- GOAT DRAFT BUILD TOOL ---
        setupGoatDraftControls() {
            const controls = {
                leagueSize: document.getElementById('goat-league-size'),
                draftPosition: document.getElementById('goat-draft-position'),
                generateButton: document.getElementById('generateDraftBuildButton'),
                scoringType: document.getElementById('goat-draft-scoring'),
                rosterInputs: {
                    QB: document.getElementById('roster-qb'), RB: document.getElementById('roster-rb'),
                    WR: document.getElementById('roster-wr'), TE: document.getElementById('roster-te'),
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
                    QB: parseInt(controls.rosterInputs.QB.value), RB: parseInt(controls.rosterInputs.RB.value),
                    WR: parseInt(controls.rosterInputs.WR.value), TE: parseInt(controls.rosterInputs.TE.value),
                    FLEX: parseInt(controls.rosterInputs.FLEX.value), BENCH: 6
                };
                this.runGoatMockDraft(controls);
            });
            updateDraftPositions(); // Initial population of dropdown
        },

        async runGoatMockDraft(controls) {
            const loader = document.getElementById('draft-loading-spinner');
            const resultsWrapper = document.getElementById('draft-results-wrapper');
            if(!loader || !resultsWrapper) return;

            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');

            const scoring = controls.scoringType.value.toLowerCase();
            const leagueSize = parseInt(controls.leagueSize.value);
            const userDraftPos = parseInt(controls.draftPosition.value) - 1;

            if (!this.hasDataLoaded) await this.loadAllPlayerData();
            
            let availablePlayers = [...this.playerData].filter(p => p.adp && typeof p.adp[scoring] === 'number').sort((a, b) => a.adp[scoring] - b.adp[scoring]);

            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) : Array.from({ length: leagueSize }, (_, i) => i);
                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    const topAvailable = availablePlayers.slice(0, 15);
                    topAvailable.forEach(p => {
                        let score = p.vorp || 0;
                        if (teams[teamIndex].needs[p.simplePosition] > 0) score *= 1.5;
                        else if (config.positions.includes(p.simplePosition) && teams[teamIndex].needs['FLEX'] > 0) score *= 1.2;
                        score *= (1 + (Math.random() - 0.5) * 0.25);
                        p.draftScore = score;
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
                        else if (teams[teamIndex].needs.BENCH > 0) teams[teamIndex].needs.BENCH--;
                    }
                }
            }
            this.displayGoatDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
        },

        displayGoatDraftResults(roster) {
            const startersEl = document.getElementById('starters-list');
            const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = ''; benchEl.innerHTML = '';
            const starters = []; const bench = [];
            const rosterSlots = { ...config.rosterSettings };
            roster.sort((a, b) => a.adp.ppr - b.adp.ppr);
            roster.forEach(player => {
                const pos = player.simplePosition;
                if (rosterSlots[pos] > 0) { player.displayPos = pos; starters.push(player); rosterSlots[pos]--; } 
                else if (config.positions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; } 
                else { bench.push(player); }
            });
            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX'];
            starters.sort((a, b) => positionOrder.indexOf(a.displayPos) - positionOrder.indexOf(b.displayPos));
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('');
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('');
            this.addPlayerPopupListeners();
        },
        
        createPlayerCardHTML(player, isBench = false) {
             const pos = isBench ? 'BEN' : player.displayPos;
             return `<div class="player-card player-pos-${player.simplePosition.toLowerCase()}"><strong class="font-bold w-12">${pos}:</strong><span class="player-name-link" data-player-name="${player.name}">${player.name} (${player.team})</span><span class="text-xs text-gray-400 ml-auto">${player.draftedAt || ''}</span></div>`;
        },

        // --- All other functions (Interactive Draft, Popups, etc.) remain the same ---
        // I have omitted them here to avoid a giant wall of text, but they are still
        // part of the complete script.
    };

    App.init();
});
