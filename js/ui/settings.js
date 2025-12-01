/**
 * Settings UI Module
 */
import { getSettings, saveSettings } from '../core/storage.js';

export function setupSettings() {
    const settingsForm = document.getElementById('settings-form');
    const resetSettingsBtn = document.getElementById('reset-settings');

    if (settingsForm) {
        loadSettingsToForm();

        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newSettings = {
                startScore: Number(document.getElementById('set-start').value),
                returnScore: Number(document.getElementById('set-return').value),
                uma: [
                    Number(document.getElementById('set-uma1').value),
                    Number(document.getElementById('set-uma2').value),
                    Number(document.getElementById('set-uma3').value),
                    Number(document.getElementById('set-uma4').value)
                ],
                tieBreaker: document.querySelector('input[name="tieBreaker"]:checked').value
            };
            saveSettings(newSettings);
            alert('設定を保存しました');
        });
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            if (confirm('設定を初期値に戻しますか？')) {
                localStorage.removeItem('mahjong_settings'); // Clear to force default
                loadSettingsToForm();
                alert('設定を初期化しました');
            }
        });
    }
}

export function loadSettingsToForm() {
    const settings = getSettings();
    document.getElementById('set-start').value = settings.startScore;
    document.getElementById('set-return').value = settings.returnScore;
    document.getElementById('set-uma1').value = settings.uma[0];
    document.getElementById('set-uma2').value = settings.uma[1];
    document.getElementById('set-uma3').value = settings.uma[2];
    document.getElementById('set-uma4').value = settings.uma[3];

    const tieBreakerRadios = document.getElementsByName('tieBreaker');
    for (const radio of tieBreakerRadios) {
        if (radio.value === settings.tieBreaker) {
            radio.checked = true;
        }
    }
}
