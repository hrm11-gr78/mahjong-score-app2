/**
 * Users UI Module
 */
import { getUsers, addUser, removeUser, getSessions } from '../core/storage.js';
import { navigateTo } from './navigation.js';

export function setupUsers() {
    const addUserBtn = document.getElementById('add-user-btn');
    const newUserNameInput = document.getElementById('new-user-name');
    const backToUsersBtn = document.getElementById('back-to-users');

    renderUserList();

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            const name = newUserNameInput.value.trim();
            if (name) {
                // Check limit
                const currentUsers = getUsers();
                if (currentUsers.length >= 30) {
                    alert('ユーザー登録数の上限(30人)に達しました。');
                    return;
                }

                if (addUser(name)) {
                    newUserNameInput.value = '';
                    renderUserList();
                    alert(`ユーザー "${name}" を追加しました！`);
                } else {
                    alert('そのユーザーは既に存在します！');
                }
            }
        });
    }

    if (backToUsersBtn) {
        backToUsersBtn.addEventListener('click', () => {
            navigateTo('users');
        });
    }
}

export function renderUserList() {
    const userList = document.getElementById('user-list');
    if (!userList) return;

    const users = getUsers();
    userList.innerHTML = '';

    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        li.innerHTML = `
            <span class="user-name">${user}</span>
            <div>
                <button class="btn-secondary btn-sm detail-btn">詳細</button>
                <button class="btn-danger btn-sm delete-btn" data-user="${user}">削除</button>
            </div>
        `;

        li.querySelector('.detail-btn').addEventListener('click', () => {
            openUserDetail(user);
        });

        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            const userName = e.target.dataset.user;
            if (confirm(`ユーザー "${userName}" を削除しますか？`)) {
                removeUser(userName);
                renderUserOptions();
                renderUserList();
            }
        });

        userList.appendChild(li);
    });
}

export function renderUserOptions() {
    const selects = document.querySelectorAll('.user-select');
    const users = getUsers();

    selects.forEach(select => {
        // Keep selected value if possible
        const currentVal = select.value;
        select.innerHTML = '<option value="" disabled selected>選択...</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            select.appendChild(option);
        });
        if (currentVal && users.includes(currentVal)) {
            select.value = currentVal;
        }
    });
}

export function openUserDetail(userName) {
    renderUserDetail(userName);
    navigateTo('user-detail');
}

function renderUserDetail(userName) {
    const userDetailName = document.getElementById('user-detail-name');
    const userTotalScore = document.getElementById('user-total-score');
    const userHistoryList = document.getElementById('user-history-list');

    if (userDetailName) userDetailName.textContent = userName;

    // Calculate stats
    const sessions = getSessions();
    let totalScore = 0;
    let historyHtml = '';

    // Sort sessions by date desc
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSessions.forEach(session => {
        // Find if user played in this session
        // session.players is array of names [p1, p2, p3, p4]
        const pIndex = session.players.indexOf(userName);
        if (pIndex !== -1) {
            // User played
            // Calculate total score for this session
            let sessionScore = 0;
            session.games.forEach(game => {
                const result = game.results.find(r => r.index === pIndex);
                if (result) {
                    sessionScore += result.finalScore;
                }
            });

            totalScore += sessionScore;

            // Add to history
            const scoreClass = sessionScore > 0 ? 'score-positive' : (sessionScore < 0 ? 'score-negative' : '');
            const sign = sessionScore > 0 ? '+' : '';
            historyHtml += `
                <tr>
                    <td>${session.date}</td>
                    <td class="${scoreClass}">${sign}${sessionScore.toFixed(1)}</td>
                </tr>
            `;
        }
    });

    if (userTotalScore) {
        userTotalScore.textContent = (totalScore > 0 ? '+' : '') + totalScore.toFixed(1);
        userTotalScore.className = totalScore > 0 ? 'score-positive' : (totalScore < 0 ? 'score-negative' : '');
    }

    if (userHistoryList) {
        userHistoryList.innerHTML = historyHtml;
    }
}
