document.addEventListener('DOMContentLoaded', () => {

    // This script will now make requests to your local server, which will then use the API key.
    
    const config = {
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 7 },
        positions: ["QB", "RB", "WR", "TE", "DST", "K"],
        flexPositions: ["RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"],
        draftPickValues: {
            "2025": { "1": 70, "2": 35, "3": 18 },
            "2026": { "1": 55, "2": 28, "3": 12 }
        }
    };

    async function callApi(prompt) {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Server error: ${errorBody.error}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected AI response structure:", result);
                throw new Error('No content returned from AI.');
            }
        } catch (error) {
            console.error("API call error:", error);
            return `<p class="text-red-400 text-center">Could not get a response from the AI. Please check the server console for details.</p>`;
        }
    }

    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {},
        tradeState: {
            team1: {players: [], picks: []},
            team2: {players: [], picks: []},
            tradeType: 'Redraft'
        },
        statsChart: null,
        selectedPlayersForChart: [],
        popupHideTimeout: null,
        chatHistory: [],

        async init() {
            this.createHeader();
            this.createPlayerTicker();
            this.createFooter();
            this.initMobileMenu();
            this.createPlayerPopup();
            this.initPlaceholderTicker();
            await this.loadAllPlayerData();
            this.initLiveTicker();
            this.initializePageFeatures();
        },

        createHeader() {
            const header = document.querySelector('header');
            if (header) {
                header.innerHTML = `
                    <div class="max-w-7xl mx-auto px-4 flex justify-between items-center py-3">
                        <a href="index.html" class="text-xl md:text-2xl font-bold text-yellow-400 text-glow">Front Row Fantasy</a>
                        <nav class="hidden md:flex space-x-6 text-teal-200">
                            <a href="index.html" class="hover:text-yellow-400 transition-colors">Home</a>
                            <a href="goat.html" class="hover:text-yellow-400 transition-colors">GOAT</a>
                            <a href="mock-draft.html" class="hover:text-yellow-400 transition-colors">Mock Draft</a>
                            <a href="articles.html" class="hover:text-yellow-400 transition-colors">Articles</a>
                            <a href="players.html" class="hover:text-yellow-400 transition-colors">Players</a>
                            <a href="stats.html" class="hover:text-yellow-400 transition-colors">The Lab</a>
                            <a href="waiver-wire.html" class="hover:text-yellow-400 transition-colors">Waiver Wire</a>
                            <a href="league-dominator.html" class="hover:text-yellow-400 transition-colors">League Dominator</a>
                            <a href="dynasty-dashboard.html" class="hover:text-yellow-400 transition-colors">Dynasty</a>
                            <a href="my-league.html" class="hover:text-yellow-400 transition-colors">My League</a>
                        </nav>
                        <div class="md:hidden">
                            <button id="mobile-menu-button" class="text-teal-400 hover:text-yellow-400 focus:outline-none">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                            </button>
                        </div>
                    </div>
                    <nav id="mobile-menu" class="md:hidden hidden px-4 pb-3 space-y-2"></nav>
                `;
            }
        },
        
        createPlayerTicker() {
            const header = document.querySelector('header');
            if (header) {
                const tickerSection = document.createElement('section');
                tickerSection.className = 'bg-gray-800 bg-opacity-80 p-3 shadow-lg w-full border-y border-teal-800';
                tickerSection.innerHTML = `
                    <div class="overflow-hidden relative h-8 bg-gray-900 rounded-lg">
                        <div id="tickerContent" class="whitespace-nowrap absolute top-0 left-0 h-full flex items-center ticker-animation text-gray-300">
                        </div>
                    </div>
                `;
                header.insertAdjacentElement('afterend', tickerSection);
            }
        },

        createFooter() {
            const footer = document.querySelector('footer');
            if (footer) {
                footer.innerHTML = `
                    <div class="mb-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-teal-200">
                       <a href="index.html" class="hover:text-yellow-400 transition-colors">Home</a>
                       <a href="goat.html" class="hover:text-yellow-400 transition-colors">GOAT</a>
                       <a href="mock-draft.html" class="hover:text-yellow-400 transition-colors">Mock Draft</a>
                       <a href="articles.html" class="hover:text-yellow-400 transition-colors">Articles</a>
                       <a href="players.html" class="hover:text-yellow-400 transition-colors">Players</a>
                       <a href="stats.html" class="hover:text-yellow-400 transition-colors">The Lab</a>
                       <a href="waiver-wire.html" class="hover:text-yellow-400 transition-colors">Waiver Wire</a>
                       <a href="league-dominator.html" class="hover:text-yellow-400 transition-colors">League Dominator</a>
                       <a href="dynasty-dashboard.html" class="hover:text-yellow-400 transition-colors">Dynasty</a>
                       <a href="my-league.html" class="hover:text-yellow-400 transition-colors">My League</a>
                    </div>
                    <div class="text-center text-sm">© 2025 Front Row Fantasy. All rights reserved.</div>
                `;
            }
        },

        initializePageFeatures() {
            if (document.getElementById('daily-briefing-section') || document.getElementById('waiver-wire-personalized')) this.initPersonalizedHomepage();
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
        
        initPersonalizedHomepage() {
            this.generateDailyBriefing();
            
            const waiverContainer = document.getElementById('waiver-wire-personalized');
            if (waiverContainer) {
                const waiverTargets = this.playerData.filter(p => p.vorp > 10 && p.adp_ppr > 120).slice(0, 3);
                waiverContainer.innerHTML = waiverTargets.map(player => `
                    <div class="my-team-player player-pos-${player.simplePosition.toLowerCase()}">
                        <strong class="w-10">${player.simplePosition}</strong>
                        <span class="player-name-link" data-player-name="${player.name}">${player.name}</span>
                    </div>
                `).join('');
                this.addPlayerPopupListeners();
            }

            const watchlistContainer = document.getElementById('watchlist-personalized');
            if (watchlistContainer) {
                const watchlistPlayers = this.playerData.filter(p => p.tier === 3).slice(0, 3);
                watchlistContainer.innerHTML = watchlistPlayers.map(player => `
                    <div class="my-team-player player-pos-${player.simplePosition.toLowerCase()}">
                        <strong class="w-10">${player.simplePosition}</strong>
                        <span class="player-name-link" data-player-name="${player.name}">${player.name}</span>
                    </div>
                `).join('');
                this.addPlayerPopupListeners();
            }

            const reportCardContainer = document.getElementById('weekly-report-card');
            if (reportCardContainer) {
                reportCardContainer.innerHTML = `
                    <div class="text-center">
                        <p class="text-4xl font-bold text-green-400">A-</p>
                        <p class="text-sm text-gray-400 mt-1">Your team performed well above expectations this week.</p>
                    </div>
                `;
            }

            const opponentWeaknessContainer = document.getElementById('opponent-weakness');
            if (opponentWeaknessContainer) {
                opponentWeaknessContainer.innerHTML = `
                    <div class="text-center">
                        <p class="text-xl font-bold text-red-400">Weak at WR</p>
                        <p class="text-sm text-gray-400 mt-1">Your opponent is projected to be weak at the WR position this week.</p>
                    </div>
                `;
            }
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
                const response = await fetch('/api/players');
                if (!response.ok) throw new Error('Failed to load player data from server');
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
                        aiTag: aiTag,
                        adp: { ppr: p.adp_ppr, hppr: p.adp_hppr, standard: p.adp_standard }
                    }
                }).sort((a,b)=>b.fantasyPoints - a.fantasyPoints);
            } catch (error) { console.error("Error loading player data:", error); this.displayDataError(); }
        },
        displayDataError() {
            const msg = `<p class="text-center text-red-400 py-8">Could not load player data. Please try again later.</p>`;
            document.querySelectorAll('#stats-table-body, #player-list-container, #player-table-body, #cheat-sheet-table-body').forEach(el => { if(el) el.innerHTML = msg; });
        },
        generateFantasyPoints(player) {
            const pos = (player.position||'').replace(/\d+$/,'').trim().toUpperCase();
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
            const pos = (player.position||'').replace(/\d+$/,'').trim().toUpperCase();
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
            const adp = player.adp_ppr || 200;
            const vorp = player.vorp || 0;

            if (vorp > 80 && adp > 60) return "Sleeper";
            if (vorp > 100 && adp < 150) return "High Upside";
            if (vorp < 50 && adp < 50) return "Bust";
            if (vorp > 50 && player.tier < 4) return "Safe Floor";
            return "";
        },
        
        // ... (The rest of the functions from the last complete script would go here)
        // e.g., initGoatHub, generateAiDraftPlan, initMockDraftSimulator, etc.
    };
    
    window.App = App;
    window.callApi = callApi;

    App.init();
});