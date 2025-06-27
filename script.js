document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: [
            'players_part1.json',
            'players_part2.json',
            'players_part3.json'
        ],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 6 }
    };

    const App = {
        allPlayers: [],
        
        async init() {
            this.initMobileMenu();
            if (document.getElementById('goat-draft-builder')) {
                await this.loadAllData();
                this.setupDraftControls();
            }
        },
        
        initMobileMenu() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mainNav = document.querySelector('header nav.hidden');
            const mobileNav = document.getElementById('mobile-menu');

            if (mobileMenuButton && mainNav && mobileNav) {
                mobileNav.innerHTML = mainNav.innerHTML;
                mobileMenuButton.addEventListener('click', () => {
                    mobileNav.classList.toggle('hidden');
                });
            }
        },

        async loadAllData() {
            try {
                const fetchPromises = config.dataFiles.map(file => fetch(file).then(res => res.json()));
                const allParts = await Promise.all(fetchPromises);
                this.allPlayers = allParts.flat(); // Combine all parts into a single array
                
                this.allPlayers.forEach(p => {
                    p.simplePosition = p.position.replace(/\d+$/, '');
                    p.vorp = 1000 / Math.sqrt(p.adp.standard || 300); // Value Over Replacement Player
                });
            } catch (error) {
                console.error("Error loading player data:", error);
            }
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

        runMockDraft() {
            const loader = document.getElementById('draft-loading-spinner');
            const resultsWrapper = document.getElementById('draft-results-wrapper');
            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');

            const leagueSize = 12;
            const userDraftPos = parseInt(document.getElementById('draftPosition').value) - 1;
            let availablePlayers = [...this.allPlayers];
            
            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? 
                    Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i) :
                    Array.from({ length: leagueSize }, (_, i) => i);

                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    
                    const team = teams[teamIndex];
                    
                    const pickOptions = availablePlayers.slice(0, 20).map(player => {
                        let score = player.vorp;
                        if (team.needs[player.simplePosition] > 0) {
                            score *= 1.25; 
                        } else if (player.simplePosition.match(/RB|WR|TE/) && team.needs['FLEX'] > 0) {
                             score *= 1.1;
                        }
                        const playersLeftInTier = availablePlayers.filter(p => p.position === player.position && p.tier === player.tier).length;
                        if (playersLeftInTier <= 2) {
                            score *= 1.15;
                        }
                        score *= (1 + (Math.random() - 0.5) * 0.1); 
                        return { player, score };
                    }).sort((a, b) => b.score - a.score);

                    const draftedPlayer = pickOptions.length > 0 ? pickOptions[0].player : availablePlayers[0];
                    
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        team.roster.push(draftedPlayer);

                        if(team.needs[draftedPlayer.simplePosition] > 0) {
                            team.needs[draftedPlayer.simplePosition]--;
                        } else if (draftedPlayer.simplePosition.match(/RB|WR|TE/) && team.needs['FLEX'] > 0) {
                            team.needs['FLEX']--;
                        }
                        
                        availablePlayers = availablePlayers.filter(p => p.name !== draftedPlayer.name);
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

            roster.sort((a,b) => a.adp.standard - b.adp.standard);

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
            
            starters.sort((a,b) => a.adp.standard - b.adp.standard);

            startersEl.innerHTML = starters.map(p => `
                <div class="player-card player-pos-${p.simplePosition.toLowerCase()}">
                    <strong>${p.displayPos || p.simplePosition}:</strong> ${p.name} <span class="text-gray-400">${p.draftedAt}</span>
                </div>`).join('');
                
            benchEl.innerHTML = bench.map(p => `
                 <div class="player-card player-pos-${p.simplePosition.toLowerCase()}">
                    <strong>BEN:</strong> ${p.name} <span class="text-gray-400">${p.draftedAt}</span>
                </div>`).join('');
        }
    };

    App.init();
});
