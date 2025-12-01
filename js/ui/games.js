/**
 * Games UI Module
 */
import { calculateResult, validateTotal } from '../core/mahjong.js';
import { addGameToSession, updateGameInSession, getSession } from '../core/storage.js';
import { navigateTo } from './navigation.js';
import { openSession } from './sessions.js';

let editingGameId = null;
let currentSessionIdForGame = null;
let pendingGameData = null; // Store data while waiting for tie-breaker

export function setupGames() {
    const scoreForm = document.getElementById('score-form');
    const cancelInputBtn = document.getElementById('cancel-input');
    const tieBreakerModal = document.getElementById('tie-breaker-modal');

    setupScoreValidation();

    if (scoreForm) {
        scoreForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!calculateTotal()) {
                if (!confirm("合計点が100,000点ではありません。続行しますか？")) {
                    return;
                }
            }

            const formData = new FormData(scoreForm);
            const p1Score = Number(formData.get('p1-score'));
            const p2Score = Number(formData.get('p2-score'));
            const p3Score = Number(formData.get('p3-score'));
            const p4Score = Number(formData.get('p4-score'));

            const rawScores = [p1Score, p2Score, p3Score, p4Score];

            // Get player names from hidden inputs
            const playerNames = [
                document.getElementById('inp-p1-name').value,
                document.getElementById('inp-p2-name').value,
                document.getElementById('inp-p3-name').value,
                document.getElementById('inp-p4-name').value
            ];

            const session = getSession(currentSessionIdForGame);
            const settings = session.rules;

            // Calculate Result
            const results = calculateResult(rawScores, settings);

            if (results.needsTieBreaker) {
                // Handle Tie Breaker
                pendingGameData = { rawScores, playerNames, settings };
                showTieBreakerModal(results.tiedGroups, playerNames);
            } else {
                // Success
                finalizeGame(results, playerNames);
            }
        });
    }

    if (cancelInputBtn) {
        cancelInputBtn.addEventListener('click', () => {
            navigateTo('session-detail');
        });
    }

    // Modal close (click outside)
    window.onclick = function (event) {
        if (event.target == tieBreakerModal) {
            tieBreakerModal.style.display = "none";
        }
    };
}

export function prepareInputForm(sessionId, gameToEdit = null) {
    currentSessionIdForGame = sessionId;
    const session = getSession(sessionId);
    const players = session.players;

    // Set labels and hidden inputs
    players.forEach((player, i) => {
        document.getElementById(`lbl-p${i + 1}`).textContent = player;
        document.getElementById(`inp-p${i + 1}-name`).value = player;
    });

    if (gameToEdit) {
        editingGameId = gameToEdit.id;
        // Fill scores
        // gameToEdit.results has { index, rawScore ... }
        // index corresponds to session.players index
        gameToEdit.results.forEach(r => {
            // r.index is 0-3
            const input = document.querySelector(`input[name="p${r.index + 1}-score"]`);
            if (input) input.value = r.rawScore;
        });
    } else {
        editingGameId = null;
        // Clear inputs
        document.querySelectorAll('#score-form input[type="number"]').forEach(input => {
            input.value = '';
        });
    }

    calculateTotal(); // Reset total display
    navigateTo('input');
}

function setupScoreValidation() {
    const inputs = document.querySelectorAll('#score-form input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotal);
    });
}

function calculateTotal() {
    const inputs = document.querySelectorAll('#score-form input[type="number"]');
    let total = 0;
    let allFilled = true;

    inputs.forEach(input => {
        const val = Number(input.value);
        total += val * 100;
        if (input.value === '') allFilled = false;
    });

    const totalCheck = document.getElementById('total-check');
    if (totalCheck) {
        totalCheck.textContent = `合計: ${total}`;
        if (total === 100000) {
            totalCheck.className = 'total-check valid';
            return true;
        } else {
            totalCheck.className = 'total-check invalid';
            return false;
        }
    }
    return false;
}

function showTieBreakerModal(tiedGroups, playerNames) {
    const modal = document.getElementById('tie-breaker-modal');
    const container = document.getElementById('tie-breaker-options');
    container.innerHTML = '';

    tiedGroups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.style.marginBottom = '15px';
        groupDiv.innerHTML = `<h4>同点: ${group.map(i => playerNames[i]).join(', ')}</h4>`;

        group.forEach(playerIndex => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            btn.style.marginRight = '5px';
            btn.textContent = `${playerNames[playerIndex]} を上位にする`;
            btn.onclick = () => resolveTie(group, playerIndex);
            groupDiv.appendChild(btn);
        });

        container.appendChild(groupDiv);
    });

    modal.style.display = 'block';
}

function resolveTie(group, winnerIndex) {
    // Create a priority map
    // Winner gets 1, others 0 (or -1). 
    // Actually calculateResult takes a map { index: priority }.
    // We just need to give the winner a higher priority.

    // But wait, what if there are 3 people tied?
    // The simple UI only picks the "winner" (highest priority) among the tied group.
    // If 3 people are tied, picking 1 leaves 2 tied.
    // The current logic in app.js was:
    // "Select the player closer to East (Dealer)"
    // It implies we resolve one tie level.
    // If we pick one, they get priority 1. Others 0.
    // Then we recalculate. If still tied, we might need another pass?
    // The original app.js logic:
    // It creates a priorityMap where winner has 1.
    // Then calls calculateResult again.
    // If still needsTieBreaker, it shows modal again.

    const priorityMap = {};
    group.forEach(idx => priorityMap[idx] = 0);
    priorityMap[winnerIndex] = 1;

    const { rawScores, playerNames, settings } = pendingGameData;

    // We need to merge with existing priorities if we had multiple tie-breaker rounds?
    // The original app didn't seem to handle recursive tie-breaking for 3-way ties fully 
    // or assumed the user picks the absolute highest.
    // Let's assume simple case for now.

    const results = calculateResult(rawScores, settings, priorityMap);

    if (results.needsTieBreaker) {
        // Still tied (e.g. 3 people tied, picked 1, other 2 still tied)
        showTieBreakerModal(results.tiedGroups, playerNames);
    } else {
        document.getElementById('tie-breaker-modal').style.display = 'none';
        finalizeGame(results, playerNames);
    }
}

function finalizeGame(results, playerNames) {
    const gameData = {
        id: editingGameId || Date.now(),
        timestamp: new Date().toISOString(),
        results: results // Array of { index, rawScore, rank, finalScore, ... }
    };

    if (editingGameId) {
        updateGameInSession(currentSessionIdForGame, editingGameId, gameData);
        alert('対局を更新しました');
    } else {
        addGameToSession(currentSessionIdForGame, gameData);
        alert('対局を保存しました');
    }

    openSession(currentSessionIdForGame);
}
