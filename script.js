document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: ['players_part1.json', 'players_part2.json', 'players_part3.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, BENCH: 6 },
        positions: ["QB", "RB", "WR", "TE"]
    };

    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {}, // New object to hold the entire draft's state

        async init() {
            this.initMobileMenu();
            this.createPlayerPopup();
            await this.loadAllPlayerData();
            this.initTicker();
            
            if (document.getElementById('top-players-section')) this.initTopPlayers();
            if (document.getElementById('goat-draft-builder')) this.setupDraftControls();
            if (document.getElementById('start-sit-tool')) this.initStartSitTool();
            if (document.getElementById('mock-draft-simulator')) this.initMockDraftSimulator();
        },
        
        initMobileMenu() { /* Unchanged from previous version */ 
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

        initTicker() { /* Unchanged from previous version */ 
            const tickerContainer = document.getElementById('tickerContent');
            if (!tickerContainer || !this.playerData.length) return;
            const topPlayers = [...this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 10), ...this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 10)];
            topPlayers.sort((a,b) => b.fantasyPoints - a.fantasyPoints);
            const tickerContent = topPlayers.map(player => `<span class="flex items-center mx-4"><span class="font-semibold text-white">${player.name} (${player.simplePosition})</span><span class="ml-2 font-bold text-yellow-400">${player.fantasyPoints.toFixed(2)} pts</span></span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            tickerContainer.innerHTML = tickerContent.repeat(3);
        },

        async loadAllPlayerData() { /* Unchanged from previous version */ 
            if (this.hasDataLoaded) return;
            this.hasDataLoaded = true; // Prevent re-loading
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

        generateFantasyPoints(player) { /* Unchanged from previous version */ 
            const base = (player.vorp || 10) * 0.5 + (10 - (player.tier || 10)) * 2;
            const randomness = (Math.random() - 0.2) * 15;
            return Math.max(0, base + randomness);
        },
        
        initTopPlayers() { /* Unchanged from previous version, but remember to add player popup listeners */ 
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;
            const topPlayersByPos = {"Quarterbacks": this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 4), "Running Backs": this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 4), "Wide Receivers": this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 4), "Tight Ends": this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 4)};
            container.innerHTML = Object.entries(topPlayersByPos).map(([title, players]) => `<div class="player-showcase-card"><h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3><ol class="list-none p-0 space-y-3">${players.map((p, index) => `<li class="flex items-center py-2 border-b border-gray-700/50 last:border-b-0"><span class="text-2xl font-bold text-teal-400/60 w-8">${index + 1}</span><div class="flex-grow"><span class="player-name-link font-semibold text-lg text-slate-100" data-player-name="${p.name}">${p.name}</span><span class="text-sm text-gray-400 block">${p.team}</span></div><span class="font-bold text-xl text-yellow-400">${p.fantasyPoints.toFixed(2)}</span></li>`).join('')}</ol></div>`).join('');
            this.addPlayerPopupListeners();
        },
        
        setupDraftControls() { /* This can be removed or repurposed if the GOAT tool changes */ },
        initStartSitTool() { /* This can be removed or repurposed if the GOAT tool changes */ },

        // --- NEW INTERACTIVE MOCK DRAFT ---
        initMockDraftSimulator() {
            const controls = {
                startBtn: document.getElementById('start-draft-button'),
                scoringSelect: document.getElementById('draftScoringType'),
                sizeSelect: document.getElementById('leagueSize'),
                pickSelect: document.getElementById('userPick'),
                settingsContainer: document.getElementById('draft-settings-container'),
                draftingContainer: document.getElementById('interactive-draft-container'),
                completeContainer: document.getElementById('draft-complete-container'),
                restartBtn: document.getElementById('restart-draft-button'),
            };

            if (!controls.startBtn) return;
            
            const updateUserPickOptions = () => {
                const size = parseInt(controls.sizeSelect.value);
                controls.pickSelect.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    controls.pickSelect.add(new Option(`Pick ${i}`, i));
                }
            };

            controls.sizeSelect.addEventListener('change', updateUserPickOptions);
            controls.startBtn.addEventListener('click', () => this.startInteractiveDraft(controls));
            controls.restartBtn.addEventListener('click', () => this.resetDraftUI(controls));
            updateUserPickOptions();
        },

        startInteractiveDraft(controls) {
            controls.settingsContainer.classList.add('hidden');
            controls.draftingContainer.classList.remove('hidden');
            controls.completeContainer.classList.add('hidden');

            const leagueSize = parseInt(controls.sizeSelect.value);
            const userPickNum = parseInt(controls.pickSelect.value);
            const scoring = controls.scoringSelect.value.toLowerCase();
            const totalRounds = 15;

            this.draftState = {
                controls,
                leagueSize,
                userPickNum,
                scoring,
                totalRounds,
                currentRound: 1,
                currentPickInRound: 1,
                teams: Array.from({ length: leagueSize }, (v, i) => ({ teamNumber: i + 1, roster: [] })),
                availablePlayers: [...this.playerData].filter(p => p.adp && typeof p.adp[scoring] === 'number').sort((a, b) => a.adp[scoring] - b.adp[scoring]),
                draftPicks: [],
                isUserTurn: false,
            };

            this.updateDraftBoard();
            this.updateMyTeam();
            this.runDraftTurn();
        },
        
        runDraftTurn() {
            if (this.draftState.currentRound > this.draftState.totalRounds) {
                this.endInteractiveDraft();
                return;
            }

            const { currentRound, leagueSize } = this.draftState;
            const isSnake = currentRound % 2 === 0;
            const pickInRound = this.draftState.currentPickInRound;
            const overallPick = (currentRound - 1) * leagueSize + pickInRound;
            const teamIndex = isSnake ? leagueSize - pickInRound : pickInRound - 1;
            
            const isUserTurn = (teamIndex + 1) === this.draftState.userPickNum;
            this.draftState.isUserTurn = isUserTurn;

            this.updateDraftStatus();

            if (isUserTurn) {
                this.updateBestAvailable(true); // Enable draft buttons for user
            } else {
                this.updateBestAvailable(false); // Disable draft buttons
                // AI makes a pick after a short delay to simulate thinking
                setTimeout(() => {
                    this.makeAiPick(teamIndex);
                    this.runDraftTurn(); // Proceed to next turn
                }, 500);
            }
        },

        makeAiPick(teamIndex) {
            const { availablePlayers, teams } = this.draftState;
            const topAvailable = availablePlayers.slice(0, 15);
            topAvailable.forEach(p => {
                let score = p.vorp || 0;
                // Simplified AI logic for speed
                score *= (1 + (Math.random() - 0.5) * 0.4);
                p.draftScore = score;
            });
            
            topAvailable.sort((a, b) => b.draftScore - a.draftScore);
            const draftedPlayer = topAvailable[0];
            
            this.makePick(draftedPlayer, teamIndex);
        },

        makeUserPick(playerName) {
            const player = this.draftState.availablePlayers.find(p => p.name === playerName);
            const teamIndex = this.draftState.userPickNum - 1;
            if (player) {
                this.makePick(player, teamIndex);
                this.runDraftTurn(); // User has picked, proceed to next turn
            }
        },

        makePick(player, teamIndex) {
            // Remove player from available list
            this.draftState.availablePlayers = this.draftState.availablePlayers.filter(p => p.name !== player.name);

            // Add player to team roster
            this.draftState.teams[teamIndex].roster.push(player);
            
            // Log the pick
            this.draftState.draftPicks.push({
                round: this.draftState.currentRound,
                pick: this.draftState.currentPickInRound,
                player: player,
                teamNumber: teamIndex + 1,
            });

            // Update board and my team (if it was my pick)
            this.updateDraftBoard();
            if ((teamIndex + 1) === this.draftState.userPickNum) {
                this.updateMyTeam();
            }
            
            // Advance to the next pick
            this.draftState.currentPickInRound++;
            if (this.draftState.currentPickInRound > this.draftState.leagueSize) {
                this.draftState.currentPickInRound = 1;
                this.draftState.currentRound++;
            }
        },

        updateDraftStatus() {
            const { currentRound, currentPickInRound, leagueSize, totalRounds, isUserTurn } = this.draftState;
            const overallPick = (currentRound - 1) * leagueSize + currentPickInRound;
            const statusCard = document.getElementById('draft-status-card');

            let statusHTML = `
                <p class="text-gray-400">Round ${currentRound}/${totalRounds} | Pick ${overallPick}</p>
            `;

            if(isUserTurn) {
                statusHTML += `<p class="text-2xl font-bold text-yellow-300 text-glow-gold animate-pulse">YOU ARE ON THE CLOCK</p>`;
            } else {
                 const isSnake = currentRound % 2 === 0;
                 const teamNumber = isSnake ? leagueSize - currentPickInRound + 1 : currentPickInRound;
                 statusHTML += `<p class="text-xl font-semibold text-white">Team ${teamNumber} is picking...</p>`;
            }
            statusCard.innerHTML = statusHTML;
        },

        updateBestAvailable(isUserTurn) {
            const listEl = document.getElementById('best-available-list');
            listEl.innerHTML = ''; // Clear list
            const topPlayers = this.draftState.availablePlayers.slice(0, 20);
            
            topPlayers.forEach(player => {
                const playerEl = document.createElement('div');
                playerEl.className = 'best-available-player';
                playerEl.innerHTML = `
                    <div class="flex-grow">
                        <p class="player-name-link font-semibold text-white" data-player-name="${player.name}">${player.name}</p>
                        <p class="text-sm text-gray-400">${player.team} - ${player.simplePosition}</p>
                    </div>
                    ${isUserTurn ? `<button class="draft-button" data-player-name="${player.name}">Draft</button>` : ''}
                `;
                listEl.appendChild(playerEl);
            });
            
            // Add listeners for draft buttons if it's the user's turn
            if(isUserTurn) {
                document.querySelectorAll('.draft-button').forEach(btn => {
                    btn.onclick = (e) => this.makeUserPick(e.target.dataset.playerName);
                });
            }
            this.addPlayerPopupListeners();
        },

        updateMyTeam() {
            const listEl = document.getElementById('my-team-list');
            listEl.innerHTML = '';
            const myTeam = this.draftState.teams[this.draftState.userPickNum - 1];
            
            myTeam.roster.forEach(player => {
                listEl.innerHTML += `
                    <div class="my-team-player player-pos-${player.simplePosition.toLowerCase()}">
                        <strong class="w-10">${player.simplePosition}</strong>
                        <span class="player-name-link" data-player-name="${player.name}">${player.name}</span>
                    </div>
                `;
            });
            this.addPlayerPopupListeners();
        },
        
        updateDraftBoard() {
            const gridEl = document.getElementById('draft-board-grid');
            const { leagueSize, draftPicks, userPickNum } = this.draftState;
            gridEl.innerHTML = '';

            // Create Header
            let headerHtml = '<div class="draft-board-header">';
            for (let i = 1; i <= leagueSize; i++) {
                headerHtml += `<div class="draft-board-team-header ${userPickNum === i ? 'user-team-header' : ''}">Team ${i}</div>`;
            }
            headerHtml += '</div>';
            gridEl.innerHTML += headerHtml;
            
            // Create Body
            const bodyEl = document.createElement('div');
            bodyEl.className = 'draft-board-body';
            bodyEl.style.gridTemplateColumns = `repeat(${leagueSize}, minmax(0, 1fr))`;
            
            draftPicks.forEach(pick => {
                const pickEl = document.createElement('div');
                pickEl.className = `draft-pick ${pick.teamNumber === userPickNum ? 'user-pick' : ''}`;
                pickEl.innerHTML = `
                    <span class="pick-number">${pick.round}.${pick.pick}</span>
                    <p class="player-name-link pick-player-name" data-player-name="${pick.player.name}">${pick.player.name}</p>
                    <p class="pick-player-info">${pick.player.team} - ${pick.player.simplePosition}</p>
                `;
                bodyEl.appendChild(pickEl);
            });
            
            gridEl.appendChild(bodyEl);
            this.addPlayerPopupListeners();
        },

        endInteractiveDraft() {
            this.draftState.controls.draftingContainer.classList.add('hidden');
            this.draftState.controls.completeContainer.classList.remove('hidden');

            const rosterEl = document.getElementById('final-roster-display');
            rosterEl.innerHTML = ''; // Clear
            const myRoster = this.draftState.teams[this.draftState.userPickNum - 1].roster;
            
            const starters = [];
            const bench = [];
            const rosterSlots = { ...config.rosterSettings };

            myRoster.forEach(player => {
                const pos = player.simplePosition;
                if (rosterSlots[pos] > 0) { starters.push(player); rosterSlots[pos]--; }
                else if (config.positions.includes(pos) && rosterSlots['FLEX'] > 0) { starters.push(player); rosterSlots['FLEX']--; }
                else { bench.push(player); }
            });
            
            rosterEl.innerHTML = `
                <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Starters</h4><div class="space-y-2">${starters.map(p => this.createPlayerCardHTML(p)).join('')}</div></div>
                <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Bench</h4><div class="space-y-2">${bench.map(p => this.createPlayerCardHTML(p, true)).join('')}</div></div>
            `;
            this.addPlayerPopupListeners();
        },
        
        resetDraftUI(controls) {
            controls.settingsContainer.classList.remove('hidden');
            controls.draftingContainer.classList.add('hidden');
            controls.completeContainer.classList.add('hidden');
            this.draftState = {};
        },

        // --- PLAYER POPUP LOGIC ---
        createPlayerPopup() { /* Unchanged from previous version */ 
             if (document.getElementById('player-popup-card')) return;
            const popup = document.createElement('div');
            popup.id = 'player-popup-card';
            popup.className = 'hidden';
            document.body.appendChild(popup);
        },
        addPlayerPopupListeners() { /* Unchanged from previous version */
            const popup = document.getElementById('player-popup-card');
            document.querySelectorAll('.player-name-link').forEach(el => {
                el.addEventListener('mouseenter', (e) => {
                    const playerName = e.target.dataset.playerName;
                    const player = this.playerData.find(p => p.name === playerName);
                    if (player) {
                        this.updateAndShowPopup(player, e);
                    }
                });
                el.addEventListener('mouseleave', () => { popup.classList.add('hidden'); });
                el.addEventListener('mousemove', (e) => {
                    popup.style.left = `${e.pageX + 15}px`;
                    popup.style.top = `${e.pageY + 15}px`;
                });
            });
        },
        updateAndShowPopup(player, event) { /* Unchanged from previous version */
            const popup = document.getElementById('player-popup-card');
            popup.innerHTML = `<div class="popup-header"><p class="font-bold text-lg text-white">${player.name}</p><p class="text-sm text-teal-300">${player.team} - ${player.simplePosition}</p></div><div class="popup-body"><p><strong>ADP (PPR):</strong> ${player.adp.ppr || 'N/A'}</p><p><strong>Tier:</strong> ${player.tier || 'N/A'}</p><p><strong>VORP:</strong> ${player.vorp ? player.vorp.toFixed(2) : 'N/A'}</p><p><strong>Bye Week:</strong> ${player.bye || 'N/A'}</p></div><div id="ai-analysis-container" class="popup-footer"><button id="get-ai-analysis-btn" class="ai-analysis-btn" data-player-name="${player.name}">Get AI Analysis</button><div id="ai-analysis-loader" class="loader-small hidden"></div><p id="ai-analysis-text" class="text-sm text-gray-300"></p></div>`;
            popup.classList.remove('hidden');
            popup.querySelector('#get-ai-analysis-btn').addEventListener('click', (e) => { this.getAiPlayerAnalysis(e.target.dataset.playerName); });
        },
        async getAiPlayerAnalysis(playerName) { /* Unchanged from previous version */ 
            const container = document.getElementById('ai-analysis-container');
            const button = container.querySelector('#get-ai-analysis-btn');
            const loader = container.querySelector('#ai-analysis-loader');
            const textEl = container.querySelector('#ai-analysis-text');

            button.classList.add('hidden');
            loader.classList.remove('hidden');
            textEl.textContent = '';
            
            const prompt = `Provide a short, optimistic fantasy football outlook for the 2024-2025 season for player ${playerName}. Focus on their potential strengths, situation, and upside. Keep it under 50 words.`;
            
            try {
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory };
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await response.json();
                
                if (result.candidates && result.candidates.length > 0) {
                    textEl.textContent = result.candidates[0].content.parts[0].text;
                } else { throw new Error('No content returned'); }
            } catch (error) {
                console.error("Gemini API error:", error);
                textEl.textContent = "Could not retrieve AI analysis.";
            } finally {
                loader.classList.add('hidden');
            }
        },
    };

    App.init();
});
