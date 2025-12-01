/**
 * Chart UI Module
 */

let scoreChart = null;

export function renderScoreChart(session) {
    const ctx = document.getElementById('score-chart').getContext('2d');

    // Prepare data
    const labels = ['Start', ...session.games.map((_, i) => `Game ${i + 1}`)];
    const datasets = session.players.map((player, pIndex) => {
        const data = [0]; // Start at 0 relative to start? Or raw score?
        // Usually cumulative score relative to 0 (since we track +/-)
        // Let's check how the original app did it.
        // Original app:
        // let currentScore = 0;
        // const data = [0];
        // session.games.forEach(game => {
        //     const result = game.results.find(r => r.index === pIndex);
        //     currentScore += result.finalScore;
        //     data.push(currentScore);
        // });

        let currentScore = 0;
        session.games.forEach(game => {
            // game.results is array of { index, rawScore, rank, finalScore, ... }
            // We need to match player index (pIndex is 0-3 based on session.players array)
            // But wait, session.players is just names.
            // In game.results, 'index' refers to the index in that specific game's player list?
            // No, in createSession, players is array of names.
            // In calculateResult, it returns players with 'index' which is index in the input scores array.
            // In finalizeGame, we save results.

            // Actually, let's look at how the original code did it to be safe.
            // Original code:
            // session.games.forEach(game => {
            //    const result = game.results.find(r => r.index === pIndex);
            //    if (result) { ... }
            // });
            // This implies game.results[].index corresponds to session.players[pIndex].

            const result = game.results.find(r => r.index === pIndex);
            if (result) {
                currentScore += result.finalScore;
                data.push(currentScore);
            }
        });

        // Colors
        const colors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
        ];

        return {
            label: player,
            data: data,
            borderColor: colors[pIndex],
            backgroundColor: colors[pIndex],
            fill: false,
            tension: 0.1
        };
    });

    if (scoreChart) {
        scoreChart.destroy();
    }

    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}
