/**
 * Front Row Fantasy - Main Application Script
 * Version: 4.4 - Mobile Navigation Fix & Firebase Integration
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


// --- CORE UI & FIREBASE MODULE ---

const AppCore = {
    async init() {
        this.initMobileMenu();
        
        // Only run Firebase logic on the main app page
        if(document.getElementById('app-status')) {
            await this.initFirebase();
            await this.checkAndFetchData();
            if (state.isDataUploaded) {
                ToolsModule.init(state.allPlayers);
            }
        }
    },

    initMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileNav = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileNav) {
            mobileMenuButton.addEventListener('click', () => {
                mobileNav.classList.toggle('hidden');
            });
        }
    },

    async initFirebase() {
        const { initializeApp, getFirestore, getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } = window.firebase;
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        if (Object.keys(firebaseConfig).length === 0) {
            document.getElementById('status-text').textContent = "Firebase config not found. App cannot run.";
            return;
        }

        const app = initializeApp(firebaseConfig);
        state.db = getFirestore(app);
        state.auth = getAuth(app);
        
        await new Promise(resolve => {
            onAuthStateChanged(state.auth, async (user) => {
                if (user) {
                    resolve();
                } else {
                    try {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                           await signInWithCustomToken(state.auth, __initial_auth_token);
                        } else {
                           await signInAnonymously(state.auth);
                        }
                    } catch (error) {
                        console.error("Auth Error:", error);
                        document.getElementById('status-text').textContent = "Authentication failed.";
                    }
                }
            });
        });
    },

    async checkAndFetchData() {
        const { collection, getDocs } = window.firebase;
        const statusText = document.getElementById('status-text');
        const uploaderBtn = document.getElementById('upload-data-btn');
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        const playersColRef = collection(state.db, `artifacts/${appId}/public/data/players`);
        const snapshot = await getDocs(playersColRef);

        if (snapshot.empty) {
            statusText.textContent = "Database is empty. Please use the button below for a one-time setup.";
            uploaderBtn.classList.remove('hidden');
            state.isDataUploaded = false;
        } else {
            statusText.textContent = `Player data loaded (${snapshot.size} players). Tools are ready.`;
            state.allPlayers = snapshot.docs.map(doc => doc.data());
            state.isDataUploaded = true;
            this.enableTools();
        }
    },

    async uploadData() {
        const { writeBatch, doc, collection } = window.firebase;
        const uploaderBtn = document.getElementById('upload-data-btn');
        const uploadStatus = document.getElementById('upload-status');
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        
        uploaderBtn.disabled = true;
        uploadStatus.textContent = "Reading local players.json...";
        
        try {
            const response = await fetch('players.json');
            if (!response.ok) throw new Error('players.json file not found. Make sure it is in the same directory as your HTML files.');
            const players = await response.json();
            uploadStatus.textContent = `Uploading ${players.length} players... This may take a moment.`;

            const batch = writeBatch(state.db);
            const playersColRef = collection(state.db, `artifacts/${appId}/public/data/players`);

            players.forEach(player => {
                const docId = player.name.replace(/[^a-zA-Z0-9]/g, "") || player.name;
                if (docId) {
                    batch.set(doc(playersColRef, docId), player);
                }
            });

            await batch.commit();

            uploadStatus.textContent = "Upload complete! Reloading from database...";
            uploaderBtn.classList.add('hidden');
            await this.checkAndFetchData();

        } catch (error) {
            uploadStatus.textContent = `Upload failed: ${error.message}`;
            console.error("Upload Error:", error);
            uploaderBtn.disabled = false;
        }
    },

    enableTools() {
        const draftBuilder = document.getElementById('goat-draft-builder');
        const lineupTools = document.getElementById('lineup-tools');
        if (draftBuilder) draftBuilder.classList.remove('opacity-50', 'pointer-events-none');
        if (lineupTools) lineupTools.classList.remove('opacity-50', 'pointer-events-none');
    }
};

// --- TOOLS MODULE ---
const ToolsModule = {
    init(players) {
        state.allPlayers = players;
        this.injectHTML();
        this.setupAll();
    },
    
    injectHTML() {
        // Inject HTML for both tools
    },

    setupAll() {
        // Setup event listeners for both tools
    },
    
    // ... all intelligent tool logic (runMockDraft, etc.)
};

// --- APP INITIALIZER ---
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('upload-data-btn')?.addEventListener('click', () => AppCore.uploadData());
    AppCore.init();
});


