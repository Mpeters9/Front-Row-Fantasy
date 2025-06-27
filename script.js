document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: {
            standard: 'Standard ADP.json',
            ppr: 'PPR.json',
            half: 'Half PPR.json'
        },
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 6 }
    };

    const App = {
        playerData: {},
        
        async init() {
            this.initMobileMenu();
            
            if (document.getElementById('top-players-section')) {
                await this.loadDataForHomepage();
                this.initTicker();
                this.initTopPlayers();
            }
            
            if (document.getElementById('goat-draft-builder')) {
                this.setupDraftControls();
            }
        },
        
        initMobileMenu() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mainNav = document.querySelector('header nav.hidden');
            const mobileNav = document.getElementById('mobile-menu');

            if (mobileMenuButton && mainNav && mobileNav) {
                // To prevent re-adding event listeners if this script is loaded multiple times
                if (mobileNav.innerHTML === '') {
                    mobileNav.innerHTML = mainNav.innerHTML;
                }
                
                mobileMenuButton.addEventListener('click', () => {
                    mobileNav.classList.toggle('hidden');
                }, { once: false }); // Ensure the listener can be re-added if needed
            }
        },

        async loadData(scoring = 'ppr') {
            if (this.playerData[scoring]) {
                return this.playerData[scoring];
            }
            try {
                const response = await fetch(config.dataFiles[scoring]);
                if (!response.ok) throw new Error(`Failed to load ${config.dataFiles[scoring]}`);
                let players = await response.json();
                
                players.forEach(p => {
                    p.simplePosition = (p.POS || '').replace(/\d+$/, '');
                    if (p.Rank <= 12) p.tier = 1;
                    else if (p.Rank <= 36) p.tier = 2;
                    else p.tier = 3;
                    p.vorp = 1000 / Math.sqrt(p.Rank || 300);
                });
                
                this.playerData[scoring] = players;
                return players;
            } catch (error) {
                console.error("Error loading data:", error);
                return [];
            }
        },
        
        async loadDataForHomepage() {
            // For homepage, we just need one set of rankings, PPR is a good default
            await this.loadData('ppr');
        },

        initTicker() {
            const tickerEl = document.getElementById('news-ticker');
            if (!tickerEl) return;
            const newsItems = [
                "Ja'Marr Chase expected to sign record-breaking extension.",
                "Saquon Barkley feels 'explosive' in new Eagles offense.",
                "Rookie Marvin Harrison Jr. already turning heads in Arizona.",
                "Christian McCaffrey remains the focal point of the 49ers attack.",
                "Amon-Ra St. Brown and Jahmyr Gibbs form a lethal duo in Detroit."
            ];
            const tickerContent = newsItems.map(item => `<span>${item}</span>`).join('<span class="mx-4 text-teal-500">|</span>');
            tickerEl.innerHTML = tickerContent.repeat(5); // Repeat for a long, continuous scroll
        },
        
        initTopPlayers() {
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.ppr) return;
            
            const topPlayers = {
                "Quarterbacks": this.playerData.ppr.filter(p => p.simplePosition === 'QB').slice(0, 5),
                "Running Backs": this.playerData.ppr.filter(p => p.simplePosition === 'RB').slice(0, 5),
                "Wide Receivers": this.playerData.ppr.filter(p => p.simplePosition === 'WR').slice(0, 5)
            };

            container.innerHTML = Object.entries(topPlayers).map(([title, players]) => `
                <div class="player-showcase-card">
                    <h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3>
                    <ol>
                        ${players.map(p => `<li><span class="player-name">${p.Player}</span><span class="player-points">${p.Team}</span></li>`).join('')}
                    </ol>
                </div>
            `).join('');
        },

        setupDraftControls() {
            const leagueSizeSelect = document.getElementById('leagueSize');
            const draftPositionSelect = document.getElementById('draftPosition');
            const generateButton = document.getElementById('generateDraftBuildButton');

            const updateDraftPositions = () => {
                const size = parseInt(leagueSizeSelect.value);
                draftPositionSelect.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    draftPositionSelect.add(new Option(i, i));
                }
            }
            
            leagueSizeSelect.addEventListener('change', updateDraftPositions);
            generateButton.addEventListener('click', () => this.runMockDraft());
            updateDraftPositions();
        },

        async runMockDraft() {
            const loader = document.getElementById('draft-loading-spinner');
            const resultsWrapper = document.getElementById('draft-results-wrapper');
            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');

            const scoring = document.getElementById('draftScoringType').value;
            const leagueSize = 12;
            const userDraftPos = parseInt(document.getElementById('draftPosition').value) - 1;

            const allPlayers = await this.loadData(scoring);
            let availablePlayers = [...allPlayers];
            
            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? 
                    Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) :
                    Array.from({ length: leagueSize }, (_, i) => i);

                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    
                    const pickIndex = Math.floor(Math.random() * Math.min(5, availablePlayers.length));
                    const draftedPlayer = availablePlayers.splice(pickIndex, 1)[0];
                    
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        teams[teamIndex].roster.push(draftedPlayer);
                    }
                }
            }
            this.displayDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
        },

        displayDraftResults(roster) {
            const startersEl = document.getElementById('starters-list');
            const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = '';
            benchEl.innerHTML = '';

            const starters = [];
            const bench = [];
            const rosterSlots = { ...config.rosterSettings };

            roster.sort((a,b) => a.Rank - b.Rank);

            roster.forEach(player => {
                if (rosterSlots[player.simplePosition] > 0) {
                    starters.push(player);
                    rosterSlots[player.simplePosition]--;
                } else if (player.simplePosition.match(/RB|WR|TE/) && rosterSlots['FLEX'] > 0) {
                    player.displayPos = 'FLEX';
                    starters.push(player);
                    rosterSlots['FLEX']--;
                } else {
                    bench.push(player);
                }
            });
            
            starters.sort((a,b) => a.Rank - b.Rank);

            startersEl.innerHTML = starters.map(p => `
                <div class="player-card player-pos-${p.simplePosition.toLowerCase()}">
                    <strong>${p.displayPos || p.simplePosition}:</strong> ${p.Player} <span class="text-gray-400">${p.draftedAt}</span>
                </div>`).join('');
                
            benchEl.innerHTML = bench.map(p => `
                 <div class="player-card player-pos-${p.simplePosition.toLowerCase()}">
                    <strong>BEN:</strong> ${p.Player} <span class="text-gray-400">${p.draftedAt}</span>
                </div>`).join('');
        }
    };

    App.init();
});
