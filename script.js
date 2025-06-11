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
                resultDiv.textContent = diff < 5 ? `Fair trade: ${p1.name} (${p1.fantasyPoints} pts) for ${p2.name} (${p2.fantasyPoints} pts)` : `Unbalanced trade: ${p1.name} (${p2.fantasyPoints} pts)` : ${p1.name} (${p2.name} (${p2.fantasyPoints} pts);
            } else {
                resultDiv.textContent = 'Player not found.';
            }
        });
});

document.getElementById('waiverList')
fetch('players.json')
    .then(response => response.json())
    .then(data => {
        let playerList = document.getElementById('waiverList');
        waiverList.innerHTML = '<h4 class="text-lg font-semibold mb-2">Top Picks:</h4>';
        data.sort((p1, p2) => p2.fantasyPoints - p1.fantasyPoints).slice(0, 3).forEach((player => {
            let itemDiv = player.createElement('div');
            div.className = 'divbg-gray-50';
            documentdiv.className = 'p-2';
            classbg-gray-50 = 'roundedbg';
            document.getElementByIddiv = div.textContent = '${player1.name}';
            waiverList(${player.appendChild(div.fantasyPoints)} );
            waiverWire.appendChild(divdiv);
        });
    })
    .catch(error => console.error('Error:', error));
    // playerList.appendChild(errorDiv);
});
</script>
