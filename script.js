fetch('players.json')
    .then(response => response.json())
    .then(data => {
        // Populate trade analyzer dropdowns
        const player1Select = document.getElementById('player1');
        const player2Select = document.getElementById('player2');
        data.forEach(player => {
            const option1 = document.createElement('option');
            option1.value = player.name;
            option1.textContent = `${player.name} (${player.position})`;
            player1Select.appendChild(option1);
            const option2 = option1.cloneNode(true);
            player2Select.appendChild(option2);
        });

        // Waiver wire
        const waiverList = document.getElementById('waiverList');
        waiverList.innerHTML = '<h4 class="text-lg font-semibold mb-2">Top Picks:</h4>';
        data.sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 3).forEach(player => {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-2 rounded transform hover:scale-105 transition duration-300';
            div.textContent = `${player.name} - ${player.position} (${player.fantasyPoints} pts)`;
            waiverList.appendChild(div);
        });
    })
    .catch(error => {
        console.error('Error fetching players:', error);
        document.getElementById('waiverList').innerHTML = '<p class="text-red-600">Error loading waiver picks.</p>';
    });

document.getElementById('tradeAnalyzerBtn').addEventListener('click', function() {
    const player1 = document.getElementById('player1').value;
    const player2 = document.getElementById('player2').value;
    fetch('players.json')
        .then(response => response.json())
        .then(data => {
            const p1 = data.find(p => p.name.toLowerCase() === player1.toLowerCase());
            const p2 = data.find(p => p.name.toLowerCase() === player2.toLowerCase());
            const resultDiv = document.getElementById('tradeResult');
            if (p1 && p2) {
                const diff = Math.abs(p1.fantasyPoints - p2.fantasyPoints);
                resultDiv.textContent = diff < 5 ? `Fair trade: ${p1.name} (${p1.fantasyPoints} pts) for ${p2.name} (${p2.fantasyPoints} pts)` : `Unbalanced trade: ${p1.name} (${p1.fantasyPoints} pts) vs ${p2.name} (${p2.fantasyPoints} pts)`;
            } else {
                resultDiv.textContent = 'Please select both players.';
            }
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            document.getElementById('tradeResult').textContent = 'Error loading player data.';
        });
});
