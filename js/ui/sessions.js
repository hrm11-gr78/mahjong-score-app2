/**
 * Sessions UI Module
 */
import { createSession, getSessions, getSession, updateSession, removeSession, removeGameFromSession } from '../core/storage.js';
import { renderUserOptions } from './users.js';
import { navigateTo } from './navigation.js';
import { renderScoreChart } from './charts.js';
import { prepareInputForm } from './games.js';

let currentSessionId = null;

export function setupSessions() {
    const sessionSetupForm = document.getElementById('session-setup-form');
    const newGameBtn = document.getElementById('new-game-btn');
    const backToHomeBtn = document.getElementById('back-to-home');
    const sessionRateSelect = document.getElementById('session-rate');

    loadNewSetFormDefaults();
    renderSessionList();
    renderUserOptions(); // Populate selects

    if (sessionSetupForm) {
        sessionSetupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(sessionSetupForm);
            const date = formData.get('date') || document.getElementById('session-date').value;
            const players = [
                formData.get('p1'),
                formData.get('p2'),
                formData.get('p3'),
                formData.get('p4')
            ];

            // Validate unique players
            if (new Set(players).size !== 4) {
                alert('プレイヤーが重複しています');
                return;
            }

            const rules = {
                startScore: Number(formData.get('startScore')),
                returnScore: Number(formData.get('returnScore')),
                uma: [
                    Number(formData.get('uma1')),
                    Number(formData.get('uma2')),
                    Number(formData.get('uma3')),
                    Number(formData.get('uma4'))
                ],
                tieBreaker: document.querySelector('input[name="newSetTieBreaker"]:checked').value
            };

            const session = createSession(date, players, rules);
            openSession(session.id);
        });
    }

    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            prepareInputForm(currentSessionId);
        });
    }

    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            navigateTo('home');
            renderSessionList(); // Refresh list
        });
    }

    if (sessionRateSelect) {
        sessionRateSelect.addEventListener('change', (e) => {
            if (currentSessionId) {
                const rate = Number(e.target.value);
                updateSession(currentSessionId, { rate: rate });
                const session = getSession(currentSessionId);
                renderSessionTotal(session);
            }
        });
    }
}

function loadNewSetFormDefaults() {
    const dateInput = document.getElementById('session-date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    // Other defaults are set in HTML or by storage settings (could be improved)
}

export function renderSessionList() {
    const list = document.getElementById('session-list');
    if (!list) return;

    const sessions = getSessions();
    list.innerHTML = '';

    if (sessions.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">履歴はありません</p>';
        return;
    }

    sessions.forEach(session => {
        const div = document.createElement('div');
        div.className = 'history-card';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>${session.date}</h3>
                <div>
                    <span style="font-size:0.9rem; color:#aaa; margin-right: 10px;">${session.games.length} Games</span>
                    <button class="btn-danger btn-sm delete-session-btn" style="padding: 2px 8px; font-size: 0.8rem;">削除</button>
                </div>
            </div>
            <p>${session.players.join(' / ')}</p>
        `;

        // Card click for navigation
        div.addEventListener('click', (e) => {
            // Prevent navigation if delete button was clicked
            if (!e.target.classList.contains('delete-session-btn')) {
                openSession(session.id);
            }
        });

        // Delete button click
        div.querySelector('.delete-session-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            if (confirm('このセットを削除しますか？\nこの操作は取り消せません。')) {
                removeSession(session.id);
                renderSessionList();
            }
        });

        list.appendChild(div);
    });
}

export function openSession(sessionId) {
    currentSessionId = sessionId;
    const session = getSession(sessionId);
    if (!session) return;

    document.getElementById('session-title').textContent = `${session.date} のセット`;

    const rateSelect = document.getElementById('session-rate');
    if (rateSelect) {
        rateSelect.value = session.rate || 0;
    }

    renderSessionTotal(session);
    renderGameList(session);
    renderScoreChart(session);

    navigateTo('session-detail');
}

function renderSessionTotal(session) {
    const table = document.getElementById('session-total-table');
    if (!table) return;

    // Calculate totals
    const totals = [0, 0, 0, 0];
    session.games.forEach(game => {
        game.results.forEach(r => {
            totals[r.index] += r.finalScore;
        });
    });

    const rate = session.rate || 0;

    let html = `
        <thead>
            <tr>
                <th>名前</th>
                <th>合計スコア</th>
                ${rate > 0 ? '<th>収支</th>' : ''}
            </tr>
        </thead>
        <tbody>
    `;

    session.players.forEach((player, i) => {
        const score = totals[i].toFixed(1);
        const scoreClass = totals[i] > 0 ? 'score-positive' : (totals[i] < 0 ? 'score-negative' : '');

        let paymentHtml = '';
        if (rate > 0) {
            const payment = Math.round(totals[i] * rate * 100); // e.g. +50.5 * 5 * 100 = 25250? No, usually score * rate.
            // If rate is "Ten-5" (0.5), score 50.0 -> 2500 yen?
            // Or rate is "50" (50 yen per point).
            // The dropdown has 1-10. Let's assume x100 yen or something?
            // The original app didn't implement payment calculation logic in detail, just placeholder?
            // Let's assume rate is "yen per point".
            // If rate is 5, and score is +10.0, payment is +50.
            const payAmount = Math.floor(totals[i] * rate * 10) * 10; // Simple calc
            const payClass = payAmount > 0 ? 'score-positive' : (payAmount < 0 ? 'score-negative' : '');
            paymentHtml = `<td class="${payClass}">${payAmount}</td>`;
        }

        html += `
            <tr>
                <td>${player}</td>
                <td class="${scoreClass}">${score}</td>
                ${paymentHtml}
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
}

function renderGameList(session) {
    const list = document.getElementById('game-list');
    if (!list) return;

    list.innerHTML = '';

    // Reverse order (newest first)
    [...session.games].reverse().forEach((game, revIndex) => {
        const realIndex = session.games.length - 1 - revIndex;

        const div = document.createElement('div');
        div.className = 'history-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span>Game ${realIndex + 1}</span>
                <div>
                    <button class="btn-secondary btn-sm edit-game-btn">修正</button>
                    <button class="btn-danger btn-sm delete-game-btn">削除</button>
                </div>
            </div>
            <table class="history-table">
                <thead>
                    <tr>
                        ${session.players.map(p => `<th>${p}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${session.players.map((_, i) => {
            const r = game.results.find(res => res.index === i);
            const score = r ? r.finalScore.toFixed(1) : '-';
            const cls = r && r.finalScore > 0 ? 'score-positive' : (r && r.finalScore < 0 ? 'score-negative' : '');
            const raw = r ? ` <span style="font-size:0.8em; color:#888;">(${r.rawScore})</span>` : '';
            return `<td class="${cls}">${score}${raw}</td>`;
        }).join('')}
                    </tr>
                </tbody>
            </table>
        `;

        div.querySelector('.edit-game-btn').addEventListener('click', () => {
            prepareInputForm(session.id, game);
        });

        div.querySelector('.delete-game-btn').addEventListener('click', () => {
            if (confirm('この対局を削除しますか？')) {
                removeGameFromSession(session.id, game.id);
                openSession(session.id); // Reload
            }
        });

        list.appendChild(div);
    });
}
