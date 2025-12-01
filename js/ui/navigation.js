/**
 * Navigation UI Module
 */

export function setupNavigation() {
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            navigateTo(targetId);
        });
    });
}

export function navigateTo(targetId) {
    // Update Nav
    document.querySelectorAll('nav button').forEach(btn => {
        if (btn.dataset.target === targetId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Sections
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Scroll to top
    window.scrollTo(0, 0);
}
