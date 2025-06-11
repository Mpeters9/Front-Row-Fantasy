document.getElementById('tradeAnalyzerBtn').addEventListener('click', function() {
    let player1 = document.getElementById('player1').value;
    let player2 = document.getElementById('player2').value;
    fetch('players.json')
        .then(response => response.json())
        .then(data => {
            let p1 = data.find(p => p.name.toLowerCase() === player1.toLowerCase());
            let p2 = data.find(p => p.name.toLowerCase() === player2.toLowerCase());
            let resultDiv = document.getElementById('tradeResult');
            if (p1 && p2) {
                let diff = Math.abs(p1.fantasyPoints - p2.fantasyPoints);
                resultDiv.textContent = diff < 5 ? `Fair trade: ${p1.name} (${p1.fantasyPoints} pts) for ${p2.name} (${p2.fantasyPoints} pts)` : `Unbalanced trade: ${p1.name} (${p1.fantasyPoints} pts) vs ${p2.name} (${p2.fantasyPoints} pts)`;
            } else {
                resultDiv.textContent = 'Player not found.';
            }
        });
});

fetch('players.json')
    .then(response => response.json())
    .then(data => {
        let waiverList = document.getElementById('waiverList');
        waiverList.innerHTML = '<h4 class="text-lg font-semibold mb-2">Top Picks:</h4>';
        data.sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 3).forEach(player => {
            let div = document.createElement('div');
            div.className = 'bg-gray-50 p-2 rounded';
            div.textContent = `${player.name} (${player.fantasyPoints} pts)`;
            waiverList.appendChild(div);
        });
    })
    .catch(error => console.error('Error fetching waiver picks:', error));