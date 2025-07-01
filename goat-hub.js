document.addEventListener('DOMContentLoaded', () => {
    // This script assumes that main.js has already loaded the App object and player data.
    // It only contains the logic specific to the GOAT Hub page.

    const App = window.App || {}; // Use the global App object from main.js

    // --- GOAT HUB SPECIFIC FUNCTIONS ---

    function initGoatHub() {
        const planControls = {
            size: document.getElementById('plan-size'),
            pick: document.getElementById('plan-pick'),
            scoring: document.getElementById('plan-scoring'),
            style: document.getElementById('plan-style'),
            notes: document.getElementById('plan-notes'),
            generateBtn: document.getElementById('generate-plan-btn'),
            outputContainer: document.getElementById('plan-output-container')
        };

        if (planControls.size && planControls.pick) {
            const updatePlanPickOptions = () => {
                const size = parseInt(planControls.size.value);
                planControls.pick.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    planControls.pick.add(new Option(`Pick ${i}`, i));
                }
            };
            updatePlanPickOptions();
            planControls.size.addEventListener('change', updatePlanPickOptions);
            planControls.generateBtn.addEventListener('click', () => generateAiDraftPlan(planControls));
        }

        initGoatDraftBuild();
        initGoatCheatSheet();
        initTradeAnalyzer();
        initAiChat();
    }

    async function generateAiDraftPlan(controls) {
        controls.outputContainer.innerHTML = `<div class="loader"></div><p class="text-center text-teal-300 mt-2">Your personal AI analyst is crafting the perfect draft strategy...</p>`;
        const { size, pick, scoring, style, notes } = controls;
        
        const prompt = `
            Act as the world's greatest fantasy football draft analyst. A user needs a strategic draft plan for their upcoming fantasy draft.
            
            League Settings:
            - League Size: ${size.value} teams
            - Scoring Format: ${scoring.value}
            - Their Draft Position: Pick #${pick.value}
            - Desired Draft Style: ${style.value}
            
            User's Custom Notes: "${notes.value || 'None'}"

            Provide a detailed, round-by-round draft strategy based on these settings and notes. 
            
            **IMPORTANT FORMATTING RULES:**
            - The entire output must be a single block of clean, valid HTML.
            - Start with a single, bolded \`<strong>\` tag summarizing the overall strategy in one sentence.
            - Use \`<h3>\` tags for the round groupings (e.g., "Rounds 1-2", "Rounds 3-5", etc.).
            - Under each \`<h3>\`, write a short paragraph explaining the strategy for those rounds.
            - After the paragraph, use an unordered list (\`<ul>\`) with list items (\`<li>\`) to list 2-3 specific player targets for that range. Make sure to bold the player names with \`<strong>\`.
        `;
        
        const aiResponse = await window.callApi(prompt); // Use the global callApi function
        controls.outputContainer.innerHTML = aiResponse;
    }

    function initGoatDraftBuild() {
        // ... (All the code for the "Perfect Draft" simulator)
    }

    function initGoatCheatSheet() {
        // ... (All the code for the "AI Cheat Sheet")
    }

    function initTradeAnalyzer() {
        // ... (All the code for the "Trade Analyzer")
    }

    function initAiChat() {
        const controls = { chatWindow: document.getElementById('chat-window'), chatInput: document.getElementById('chat-input'), sendButton: document.getElementById('send-chat-button') };
        if(!controls.chatWindow) return;
        const addMessage = (message, sender) => {
            const messageElement = document.createElement('div');
            messageElement.className = `p-3 rounded-lg max-w-xs md:max-w-md ${sender === 'user' ? 'bg-teal-600 ml-auto' : 'bg-gray-700'}`;
            messageElement.innerHTML = message;
            controls.chatWindow.appendChild(messageElement);
            controls.chatWindow.scrollTop = controls.chatWindow.scrollHeight;
             if (sender === 'user') { App.chatHistory.push({ role: "user", parts: [{ text: message }] }); } 
             else { App.chatHistory.push({ role: "model", parts: [{ text: message }] }); }
        };
        const getAIResponse = async (question) => {
             const thinkingElement = document.createElement('div');
             thinkingElement.className = 'p-3 rounded-lg max-w-xs md:max-w-md bg-gray-700';
             thinkingElement.innerHTML = `<div class="loader-small"></div>`;
             controls.chatWindow.appendChild(thinkingElement);
             controls.chatWindow.scrollTop = controls.chatWindow.scrollHeight;
            const tradeContext = (App.tradeState.team1.players.length > 0) ? `For context, I am analyzing a trade where I give ${App.tradeState.team1.players.map(p=>p.name).join(', ')} and receive ${App.tradeState.team2.players.map(p=>p.name).join(', ')}.` : "";
            const prompt = `You are a helpful and concise fantasy football analyst. Your name is GOAT. Answer the user's question based on the provided chat history. ${tradeContext}\n\nUser question: "${question}"`;
            const aiResponse = await window.callApi(prompt);
            controls.chatWindow.removeChild(thinkingElement);
            addMessage(aiResponse, 'ai');
        };
        const handleSend = () => {
            const question = controls.chatInput.value.trim();
            if (question) { addMessage(question, 'user'); controls.chatInput.value = ''; getAIResponse(question); }
        };
        controls.sendButton.addEventListener('click', handleSend);
        controls.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
        if(App.chatHistory.length === 0) { addMessage("Welcome to the GOAT Hub. Ask me anything about your draft plan, player values, or trades.", 'ai'); }
    }

    // Initialize GOAT Hub features if on the correct page
    if (document.getElementById('goat-hub-page')) {
        // Ensure player data is loaded before initializing
        if (App.hasDataLoaded) {
            initGoatHub();
        } else {
            // If data isn't loaded yet, wait for a custom event
            document.addEventListener('playerDataLoaded', initGoatHub);
        }
    }
});