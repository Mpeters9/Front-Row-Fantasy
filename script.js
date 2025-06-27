<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Front Row Fantasy - GOAT Tools</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen flex flex-col font-poppins bg-gradient-to-br from-[#0f2027] to-[#2c5364]">
    <header class="sticky top-0 z-50 bg-opacity-98 bg-gray-900 shadow-lg border-b-2 border-teal-500">
        <div class="max-w-7xl mx-auto px-4 flex justify-between items-center py-3">
            <a href="index.html" class="text-2xl font-bold text-yellow-400 text-glow">Front Row Fantasy</a>
            <nav class="hidden md:flex space-x-6 text-teal-200">
                <a href="index.html" class="hover:text-yellow-400 transition-colors">Home</a>
                <a href="tools.html" class="hover:text-yellow-400 transition-colors">Expert Tools</a>
                <a href="goat.html" class="text-yellow-400 font-bold" aria-current="page">GOAT</a>
                <a href="mock-draft.html" class="hover:text-yellow-400 transition-colors">Mock Draft</a>
                <a href="guides.html" class="hover:text-yellow-400 transition-colors">Guides</a>
                <a href="players.html" class="hover:text-yellow-400 transition-colors">Players</a>
                <a href="stats.html" class="hover:text-yellow-400 transition-colors">Stats</a>
            </nav>
            <div class="md:hidden">
                <button id="mobile-menu-button" class="text-teal-400 hover:text-yellow-400 focus:outline-none">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </div>
        </div>
        <nav id="mobile-menu" class="md:hidden hidden px-4 pb-3 space-y-2"></nav>
    </header>

    <!-- Ticker Section -->
    <section class="bg-gray-800 bg-opacity-80 p-3 shadow-lg w-full border-y border-teal-800">
        <div class="overflow-hidden relative h-8 bg-gray-900 rounded-lg">
            <div id="tickerContent" class="whitespace-nowrap absolute top-0 left-0 h-full flex items-center ticker-animation text-gray-300">
                <span class="text-gray-500 px-4">Loading player points...</span>
            </div>
        </div>
    </section>

    <main class="flex-grow max-w-7xl mx-auto py-8 px-4 w-full">
        <section class="text-center mb-12">
            <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-teal-300 mb-4 text-glow-gold">GOAT-Tier Tools</h1>
        </section>

        <div class="space-y-12">
            <!-- Start/Sit Tool -->
            <section id="start-sit-tool" class="tool-card">
                <h2 class="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-teal-300">Start/Sit Analyzer</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div class="relative">
                        <label for="start-sit-player1" class="block text-gray-300 font-semibold mb-2">Player 1</label>
                        <input type="text" id="start-sit-player1" class="form-input" placeholder="Search for Player 1..." autocomplete="off">
                    </div>
                    <div class="relative">
                        <label for="start-sit-player2" class="block text-gray-300 font-semibold mb-2">Player 2</label>
                        <input type="text" id="start-sit-player2" class="form-input" placeholder="Search for Player 2..." autocomplete="off">
                    </div>
                </div>
                <button id="start-sit-analyze" class="cta-btn w-full mt-6">Get Advice</button>
                <div id="start-sit-results" class="mt-6 text-center hidden">
                    <!-- Results will be injected by script.js -->
                </div>
            </section>

            <!-- Draft Build Tool -->
            <section id="goat-draft-builder" class="tool-card">
                <h2 class="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-teal-300">Best Draft Builds</h2>
                
                <!-- Draft Settings -->
                <div class="border-b border-teal-700/50 pb-6 mb-6">
                    <h3 class="text-xl font-semibold text-center text-teal-300 mb-4">Draft Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div>
                            <label for="goat-draft-scoring" class="block text-gray-300 font-semibold mb-2">Scoring</label>
                            <select id="goat-draft-scoring" class="form-select w-full"><option value="ppr" selected>PPR</option><option value="hppr">Half-PPR</option><option value="standard">Standard</option></select>
                        </div>
                        <div>
                            <label for="goat-league-size" class="block text-gray-300 font-semibold mb-2">League Size</label>
                            <select id="goat-league-size" class="form-select w-full"><option value="12" selected>12 Teams</option><option value="10">10 Teams</option><option value="14">14 Teams</option></select>
                        </div>
                        <div>
                            <label for="goat-draft-position" class="block text-gray-300 font-semibold mb-2">Your Draft Pick</label>
                            <select id="goat-draft-position" class="form-select w-full"></select>
                        </div>
                    </div>
                </div>

                <!-- Roster Settings -->
                <div>
                    <h3 class="text-xl font-semibold text-center text-teal-300 mb-4">Lineup Settings</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div><label for="roster-qb" class="block text-center text-gray-300 font-semibold mb-1">QB</label><select id="roster-qb" class="form-select text-center"><option>1</option><option>2</option></select></div>
                        <div><label for="roster-rb" class="block text-center text-gray-300 font-semibold mb-1">RB</label><select id="roster-rb" class="form-select text-center"><option>1</option><option selected>2</option><option>3</option></select></div>
                        <div><label for="roster-wr" class="block text-center text-gray-300 font-semibold mb-1">WR</label><select id="roster-wr" class="form-select text-center"><option>2</option><option selected>3</option></select></div>
                        <div><label for="roster-te" class="block text-center text-gray-300 font-semibold mb-1">TE</label><select id="roster-te" class="form-select text-center"><option selected>1</option><option>2</option></select></div>
                        <div><label for="roster-flex" class="block text-center text-gray-300 font-semibold mb-1">Flex</label><select id="roster-flex" class="form-select text-center"><option>0</option><option selected>1</option><option>2</option></select></div>
                        <div><label for="roster-superflex" class="block text-center text-gray-300 font-semibold mb-1">Superflex</label><select id="roster-superflex" class="form-select text-center"><option selected>0</option><option>1</option></select></div>
                        <div><label for="roster-bench" class="block text-center text-gray-300 font-semibold mb-1">Bench</label><select id="roster-bench" class="form-select text-center"><option>4</option><option>5</option><option selected>6</option><option>7</option><option>8</option></select></div>
                    </div>
                </div>

                <button id="generateDraftBuildButton" class="cta-btn w-full mt-8">Generate My Draft Build</button>
                <div id="draft-loading-spinner" class="mt-6 text-center hidden"><div class="loader"></div><p class="text-teal-300 mt-2">Simulating draft...</p></div>
                <div id="draft-results-wrapper" class="mt-8 hidden">
                    <h3 class="text-2xl font-bold text-yellow-300 mb-4 text-center">Your AI-Generated Roster</h3>
                    <div id="draft-results" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Starters</h4><div id="starters-list" class="space-y-2"></div></div>
                        <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Bench</h4><div id="bench-list" class="space-y-2"></div></div>
                    </div>
                </div>
            </section>
        </div>
    </main>
    
    <!-- This is the hidden popup card for player info -->
    <div id="player-popup-card" class="hidden"></div>

    <footer class="bg-gray-900 text-teal-400 py-6 border-t-2 border-teal-500 mt-12">
        <div class="mb-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-teal-200">
           <a href="index.html" class="hover:text-yellow-400 transition-colors">Home</a>
           <a href="tools.html" class="hover:text-yellow-400 transition-colors">Expert Tools</a>
           <a href="goat.html" class="text-yellow-400 font-bold" aria-current="page">GOAT</a>
           <a href="mock-draft.html" class="hover:text-yellow-400 transition-colors">Mock Draft</a>
           <a href="guides.html" class="hover:text-yellow-400 transition-colors">Guides</a>
           <a href="players.html" class="hover:text-yellow-400 transition-colors">Players</a>
           <a href="stats.html" class="hover:text-yellow-400 transition-colors">Stats</a>
        </div>
        <div class="text-center text-sm">© 2025 Front Row Fantasy. All rights reserved.</div>
    </footer>
    <script src="script.js"></script>
</body>
</html>
