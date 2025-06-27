/**
 * Front Row Fantasy - Main Application Script
 * Version: 4.3 - Full Projection Integration & Dynamic UI
 */

const state = {
    db: null,
    auth: null,
    allPlayers: [],
    isDataUploaded: false,
    lineupRoster: [],
    startSitPlayers: { player1: null, player2: null }
};

const config = {
    lineupPresets: {
        'PPR: 1QB, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        'Standard: 1QB, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
        'SuperFlex Redraft: 1QB, 1SF, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, 'SUPER_FLEX': 1, DST: 1, K: 1 },
    }
};

const FirebaseModule = {
    async init() {
        const { initializeApp, getFirestore, getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } = window.firebase;
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
            document.getElementById('status-text').textContent = "Firebase config not found. App cannot run.";
            return;
        }
        const app = initializeApp(firebaseConfig);
        state.db = getFirestore(app);
        state.auth = getAuth(app);
        await new Promise(resolve => onAuthStateChanged(state.auth, user => user ? resolve(user) : signInAnonymously(state.auth).then(resolve).catch(e => console.error(e))));
    },
    async checkAndFetchData() {
        // ... (This logic remains the same)
    },
    async uploadData() {
        // ... (This logic remains the same)
    },
    enableTools() {
        // ... (This logic remains the same)
    }
};

const UIModule = {
    injectDraftBuilderHTML() {
        // ... (This logic remains the same, builds the UI dynamically)
    },
    injectLineupToolsHTML() {
        const container = document.getElementById('lineup-tools');
        if (!container) return;
        container.innerHTML = `
            <h2 class="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-teal-300">Lineup & Start/Sit Tools</h2>
            <div class="flex justify-center border-b border-gray-700 mb-6">
                <button id="tab-lineup-builder" class="tab-btn active">Best Lineup</button>
                <button id="tab-start-sit" class="tab-btn">Start/Sit</button>
            </div>
            <div id="lineup-builder-content">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-xl font-semibold text-white mb-3">1. Add Your Players</h3>
                        <div class="relative mb-4">
                            <input type="text" id="lineup-player-search" class="form-input w-full" placeholder="Search for players..." autocomplete="off">
                            <div id="lineup-player-autocomplete" class="autocomplete-list hidden"></div>
                        </div>
                        <div id="lineup-roster" class="space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto p-2 bg-slate-900/50 rounded-lg border border-gray-700"><span class="text-gray-500 italic">Your players appear here...</span></div>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-white mb-3">2. Set Lineup & Generate</h3>
                        <div class="mb-4"><label for="lineupPreset" class="block text-gray-300 font-semibold mb-2">Lineup Preset</label><select id="lineupPreset" class="form-select w-full"></select></div>
                        <div class="mb-4"><label for="lineupWeek" class="block text-gray-300 font-semibold mb-2">Week</label><select id="lineupWeek" class="form-select w-full"></select></div>
                        <button id="generateLineupButton" class="cta-btn w-full mb-4">Generate Optimal Lineup</button>
                        <div id="lineup-results-wrapper" class="hidden"><h4 class="text-lg font-semibold text-teal-300 mb-2">Optimal Starters</h4><div id="optimized-starters-list" class="space-y-2 p-2 bg-slate-900/50 rounded-lg border border-gray-700"></div></div>
                    </div>
                </div>
            </div>
            <div id="start-sit-content" class="hidden">
                <p class="text-center text-gray-400 mb-4">Select two players to compare.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div class="relative">
                        <label for="start-sit-player1-search" class="block text-gray-300 font-semibold mb-2">Player 1</label>
                        <input type="text" id="start-sit-player1-search" class="form-input w-full" placeholder="Search..." autocomplete="off">
                        <div id="start-sit-player1-autocomplete" class="autocomplete-list hidden"></div>
                        <div id="start-sit-player1-card" class="mt-2"></div>
                    </div>
                    <div class="relative">
                        <label for="start-sit-player2-search" class="block text-gray-300 font-semibold mb-2">Player 2</label>
                        <input type="text" id="start-sit-player2-search" class="form-input w-full" placeholder="Search..." autocomplete="off">
                        <div id="start-sit-player2-autocomplete" class="autocomplete-list hidden"></div>
                        <div id="start-sit-player2-card" class="mt-2"></div>
                    </div>
                </div>
                <div class="text-center mt-4"><label for="startSitWeek" class="block text-gray-300 font-semibold mb-2">Comparison Week</label><select id="startSitWeek" class="form-select max-w-xs mx-auto"></select></div>
                <div class="text-center mt-6"><button id="analyzeStartSit" class="cta-btn">Analyze Start/Sit</button></div>
                <div id="start-sit-result" class="mt-6 text-center text-2xl font-bold hidden"></div>
            </div>
        `;
    }
};

const ToolsModule = {
    init(players) {
        state.allPlayers = players;
        UIModule.injectDraftBuilderHTML();
        UIModule.injectLineupToolsHTML();
        this.setupAll();
    },
    // ... all the intelligent tool logic goes here ...
};

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('upload-data-btn').addEventListener('click', () => FirebaseModule.uploadData());
    await FirebaseModule.init();
    await FirebaseModule.checkAndFetchData();
    if (state.isDataUploaded) {
        ToolsModule.init(state.allPlayers);
    }
});
