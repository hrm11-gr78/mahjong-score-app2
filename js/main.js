/**
 * Main Entry Point
 */
import { setupNavigation } from './ui/navigation.js';
import { setupUsers } from './ui/users.js';
import { setupSessions } from './ui/sessions.js';
import { setupGames } from './ui/games.js';
import { setupSettings } from './ui/settings.js';

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupUsers();
    setupSessions();
    setupGames();
    setupSettings();

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, (err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    }
});
