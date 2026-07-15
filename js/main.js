/* ============================================================
   桂落春山 — 主交互逻辑 v2.1
   加载 data/photos.json · R2 图床 · 编号标签 · 分类筛选 · 灯箱 · 进度条
   ============================================================ */

(function () {
    'use strict';

    // ==========================================================
    //  配置
    // ==========================================================
    const CONFIG = {
        R2_DOMAIN: 'https://pub-35907bd241b3427e9a8302fe37d12c06.r2.dev',
        CATEGORY_LABELS: {
            'landscape':   '风光',
            'portrait':    '人像',
            'street':      '街拍',
            'architecture':'建筑',
            'nature':      '自然',
            'travel':      '旅行'
        },
        WORKS: [],
        activeCategory: 'all'
    };

    // ==========================================================
    //  工具函数
    // ==========================================================

    function getCategoryLabel(cat) {
        return CONFIG.CATEGORY_LABELS[cat] || cat;
    }

    function getImageUrl(work) {
        return CONFIG.R2_DOMAIN + '/' + work.filename;
    }

    function padId(num) {
        return '#' + String(num).padStart(3, '0');
    }

    function el(tag, className, html) {
        const elem = document.createElement(tag);
        if (className) elem.className = className;
        if (html) elem.innerHTML = html;
        return elem;
    }

    // ==========================================================
    //  加载作品数据
    // ==========================================================

    async function loadWorks() {
        try {
            const resp = await fetch('data/photos.json');
            if (!resp.ok) throw new Error('Failed to load photos.json');
            const data = await resp.json();
            CONFIG.WORKS = data.works || [];
            return data.categories || [];
        } catch (err) {
            console.error('Error loading photos:', err);
            CONFIG.WORKS = [];
            return [];
        }
    }

    // ==========================================================
    //  渲染分类筛选按钮
    // ==========================================================

    function renderFilterButtons(categories) {
        const bar = document.querySelector('.filter-bar-inner');
        if (!categories || categories.length === 0) return;

        categories.forEach(function(cat) {
            if (cat.id === 'all') return;
            var btn = el('button', 'filter-btn', getCategoryLabel(cat.id));
            btn.dataset.category = cat.id;
            bar.appendChild(btn);
        });
    }

    // ==========================================================
    //  渲染作品卡片
    // ==========================================================

    function renderGallery(filterCategory) {
        var grid = document.getElementById('galleryGrid');
        grid.innerHTML = '';

        var filtered = filterCategory === 'all'
            ? CONFIG.WORKS
            : CONFIG.WORKS.filter(function(w) { return w.category === filterCategory; });

        if (filtered.length === 0) {
            grid.innerHTML = '<p style=\"text-align:center;color:#999;padding:60px 0;\">暂无作品</p>';
            return;
        }

        filtered.forEach(function(work, index) {
            var card = createCard(work, index);
            grid.appendChild(card);
        });

        initLazyLoad();
    }

    function createCard(work, index) {
        var card = el('div', 'card');
        card.dataset.id = work.id;
        card.dataset.category = work.category;

        var imgWrap = el('div', 'card-image-wrap');

        var skeleton = el('div', 'skeleton');
        var baseH = window.innerWidth <= 767 ? 180 : (window.innerWidth <= 1199 ? 220 : 300);
        var heightPx = Math.round(baseH * (work.aspectRatio || 0.75));
        skeleton.style.height = heightPx + 'px';
        skeleton.style.aspectRatio = work.aspectRatio || '0.75';
        imgWrap.appendChild(skeleton);

        var badge = el('span', 'card-id-badge', padId(work.id));
        imgWrap.appendChild(badge);

        var img = el('img');
        img.src = getImageUrl(work);
        img.alt = work.title;
        img.loading = 'lazy';
        img.style.aspectRatio = work.aspectRatio || '0.75';
        img.style.objectFit = 'cover';
        img.style.width = '100%';

        img.addEventListener('load', function() {
            if (skeleton.parentNode) {
                skeleton.parentNode.removeChild(skeleton);
            }
            card.style.transitionDelay = ((index % 3) * 80) + 'ms';
        });

        img.addEventListener('error', function() {
            if (skeleton.parentNode) {
                skeleton.parentNode.removeChild(skeleton);
            }
            img.style.display = 'none';
            var fallback = el('div', 'card-fallback', '');
            fallback.style.cssText = 'height:'+baseH+'px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;';
            fallback.textContent = '图片加载失败';
            imgWrap.appendChild(fallback);
        });

        imgWrap.appendChild(img);
        card.appendChild(imgWrap);

        var info = el('div', 'card-info');
        info.innerHTML =
            '<p class=\"card-title\">' + work.title + '</p>' +
            '<span class=\"card-category\">' + getCategoryLabel(work.category) + '</span>';
        card.appendChild(info);

        card.addEventListener('click', function() {
            var idx = CONFIG.WORKS.findIndex(function(w) { return w.id === work.id; });
            if (idx !== -1) {
                openLightbox(idx);
            }
        });

        return card;
    }

    // ==========================================================
    //  分类筛选
    // ==========================================================

    function initFilter() {
        var buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                buttons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                CONFIG.activeCategory = btn.dataset.category;
                animateGalleryTransition(CONFIG.activeCategory);
            });
        });
    }

    function animateGalleryTransition(category) {
        var grid = document.getElementById('galleryGrid');
        var cards = grid.querySelectorAll('.card');
        cards.forEach(function(c) {
            c.style.opacity = '0';
            c.style.transform = 'translateY(10px)';
        });
        setTimeout(function() {
            renderGallery(category);
        }, 250);
    }

    // ==========================================================
    //  懒加载
    // ==========================================================

    function initLazyLoad() {
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.card-image-wrap img').forEach(function(img) {
                if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;
            });
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    if (img.dataset.lazySrc) {
                        img.src = img.dataset.lazySrc;
                        delete img.dataset.lazySrc;
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '300px 0px' });

        document.querySelectorAll('.card-image-wrap img[data-lazy-src]').forEach(function(img) {
            observer.observe(img);
        });
    }

    // ==========================================================
    //  灯箱
    // ==========================================================

    var currentLightboxIndex = -1;
    var visibleWorks = [];

    function getVisibleWorks() {
        var activeBtn = document.querySelector('.filter-btn.active');
        var category = activeBtn ? activeBtn.dataset.category : 'all';
        return category === 'all'
            ? CONFIG.WORKS.slice()
            : CONFIG.WORKS.filter(function(w) { return w.category === category; });
    }

    function openLightbox(workIndex) {
        visibleWorks = getVisibleWorks();
        currentLightboxIndex = workIndex;
        updateLightboxContent();
        document.getElementById('lightbox').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        document.getElementById('lightbox').classList.remove('open');
        document.body.style.overflow = '';
        currentLightboxIndex = -1;
    }

    function updateLightboxContent() {
        var work = visibleWorks[currentLightboxIndex];
        if (!work) return;

        var img = document.getElementById('lightboxImg');
        var title = document.getElementById('lightboxTitle');
        var category = document.getElementById('lightboxCategory');
        var date = document.getElementById('lightboxDate');
        var desc = document.getElementById('lightboxDesc');
        var idSpan = document.getElementById('lightboxId');

        var idBadge = document.querySelector('.lightbox-id-badge');
        if (!idBadge) {
            idBadge = el('span', 'lightbox-id-badge');
            document.querySelector('.lightbox-image-wrap').appendChild(idBadge);
        }

        img.src = getImageUrl(work);
        img.alt = work.title;
        title.textContent = work.title;
        category.textContent = getCategoryLabel(work.category);
        date.textContent = work.date || '';
        desc.textContent = work.camera || '';
        idSpan.textContent = padId(work.id);
        idBadge.textContent = padId(work.id);
        img.style.transform = 'scale(1)';
    }

    function lightboxPrev() {
        if (visibleWorks.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + visibleWorks.length) % visibleWorks.length;
        updateLightboxContent();
    }

    function lightboxNext() {
        if (visibleWorks.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % visibleWorks.length;
        updateLightboxContent();
    }

    function initLightbox() {
        var lightbox = document.getElementById('lightbox');
        var mask = document.getElementById('lightboxMask');
        var closeBtn = document.getElementById('lightboxClose');
        var prevBtn = document.getElementById('lightboxPrev');
        var nextBtn = document.getElementById('lightboxNext');
        var lbImg = document.getElementById('lightboxImg');

        closeBtn.addEventListener('click', closeLightbox);
        mask.addEventListener('click', closeLightbox);

        prevBtn.addEventListener('click', function(e) { e.stopPropagation(); lightboxPrev(); });
        nextBtn.addEventListener('click', function(e) { e.stopPropagation(); lightboxNext(); });

        document.addEventListener('keydown', function(e) {
            if (currentLightboxIndex === -1) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lightboxPrev();
            if (e.key === 'ArrowRight') lightboxNext();
        });

        var touchStartX = 0;
        var touchEndX = 0;

        lightbox.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            var diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) lightboxNext();
                else lightboxPrev();
            }
        }, { passive: true });

        var lastTap = 0;
        lbImg.addEventListener('touchend', function(e) {
            var now = Date.now();
            if (now - lastTap < 300) {
                var currentScale = parseFloat(lbImg.style.transform.replace('scale(', '')) || 1;
                var newScale = currentScale >= 2 ? 1 : 2.5;
                lbImg.style.transform = 'scale(' + newScale + ')';
                e.preventDefault();
            }
            lastTap = now;
        });
    }

    // ==========================================================
    //  导航栏
    // ==========================================================

    function initNavbar() {
        var navbar = document.getElementById('navbar');
        var toggle = document.getElementById('navToggle');
        var links = document.getElementById('navLinks');

        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    if (window.scrollY > 50) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        toggle.addEventListener('click', function() {
            var isOpen = links.classList.toggle('open');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
        });

        links.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                links.classList.remove('open');
                toggle.classList.remove('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (links.classList.contains('open') &&
                !links.contains(e.target) &&
                !toggle.contains(e.target)) {
                links.classList.remove('open');
                toggle.classList.remove('active');
            }
        });
    }

    // ==========================================================
    //  阅读进度条
    // ==========================================================

    function initProgressBar() {
        var bar = document.getElementById('progressBar');
        if (!bar) return;

        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    var scrollTop = window.scrollY;
                    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    var scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    bar.style.width = scrolled + '%';
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ==========================================================
    //  初始化
    // ==========================================================

    async function init() {
        initProgressBar();
        initNavbar();
        initLightbox();

        var categories = await loadWorks();
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