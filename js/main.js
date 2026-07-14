    // ==========================================================
    //  阅读进度条
    // ==========================================================

    function initProgressBar() {
        const bar = document.getElementById('progressBar');
        if (!bar) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    bar.style.width = scrolled + '%';
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ==========================================================
    
    // ==========================================================
    //  阅读进度条
    // ==========================================================

    function initProgressBar() {
        const bar = document.getElementById('progressBar');
        if (!bar) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    bar.style.width = scrolled + '%';
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ==========================================================

    async function init() {
        initProgressBar();
        initNavbar();
        initLightbox();

        const categories = await loadWorks();
        renderFilterButtons(categories);
        renderGallery('all');
        initFilter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();