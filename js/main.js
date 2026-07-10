/* ============================================================
   桂落春山 — 主交互逻辑 v2.0
   加载 photos.json · 编号标签 · 分类筛选 · 灯箱
   ============================================================ */

(function () {
    'use strict';

    // ==========================================================
    //  配置
    // ==========================================================
    const CONFIG = {
        /** R2 图床域名 — 请替换为你的自定义域名 */
        R2_DOMAIN: 'https://pub-35907bd241b3427e9a8302fe37d12c06.r2.dev',

        /** 分类中文名映射 */
        CATEGORY_LABELS: {
            'landscape':   '风光',
            'portrait':    '人像',
            'street':      '街拍',
            'architecture':'建筑',
            'nature':      '自然',
            'travel':      '旅行'
        },

        /** 作品数据 — 由 photos.json 加载 */
        WORKS: [],

        /** 当前筛选的分类 */
        activeCategory: 'all'
    };

    // ==========================================================
    //  工具函数
    // ==========================================================

    function getCategoryLabel(cat) {
        return CONFIG.CATEGORY_LABELS[cat] || cat;
    }

    function getImageUrl(work) {
        return `${CONFIG.R2_DOMAIN}/${work.filename}`;
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
            // 降级：使用空数据
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

        categories.forEach(cat => {
            if (cat.id === 'all') return; // "全部" 按钮已存在
            const btn = el('button', 'filter-btn', getCategoryLabel(cat.id));
            btn.dataset.category = cat.id;
            bar.appendChild(btn);
        });
    }

    // ==========================================================
    //  渲染作品卡片
    // ==========================================================

    function renderGallery(filterCategory) {
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = '';

        const filtered = filterCategory === 'all'
            ? CONFIG.WORKS
            : CONFIG.WORKS.filter(w => w.category === filterCategory);

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:#999;padding:60px 0;">暂无作品</p>';
            return;
        }

        filtered.forEach((work, index) => {
            const card = createCard(work, index);
            grid.appendChild(card);
        });

        // 初始化懒加载
        initLazyLoad();
    }

    function createCard(work, index) {
        const card = el('div', 'card');
        card.dataset.id = work.id;
        card.dataset.category = work.category;

        // 图片容器
        const imgWrap = el('div', 'card-image-wrap');

        // 骨架屏占位
        const skeleton = el('div', 'skeleton');
        const heightPx = Math.round(300 * (work.aspectRatio || 0.75));
        skeleton.style.height = heightPx + 'px';
        skeleton.style.aspectRatio = work.aspectRatio || '0.75';
        imgWrap.appendChild(skeleton);

        // 编号标签
        const badge = el('span', 'card-id-badge', padId(work.id));
        imgWrap.appendChild(badge);

        // 图片
        const img = el('img');
        img.src = getImageUrl(work);
        img.alt = work.title;
        img.loading = 'lazy';
        img.style.aspectRatio = work.aspectRatio || '0.75';
        img.style.objectFit = 'cover';
        img.style.width = '100%';

        // 图片加载完成后移除骨架屏
        img.addEventListener('load', () => {
            if (skeleton.parentNode) {
                skeleton.parentNode.removeChild(skeleton);
            }
            card.style.transitionDelay = (index % 3) * 80 + 'ms';
        });

        // 图片加载失败
        img.addEventListener('error', () => {
            if (skeleton.parentNode) {
                skeleton.parentNode.removeChild(skeleton);
            }
            img.style.display = 'none';
            const fallback = el('div', 'card-fallback', '');
            fallback.style.cssText = 'height:' + heightPx + 'px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;';
            fallback.textContent = '图片加载失败';
            imgWrap.appendChild(fallback);
        });

        imgWrap.appendChild(img);
        card.appendChild(imgWrap);

        // 文字信息
        const info = el('div', 'card-info');
        info.innerHTML = `
            <p class="card-title">${work.title}</p>
            <span class="card-category">${getCategoryLabel(work.category)}</span>
        `;
        card.appendChild(info);

        // 点击打开灯箱
        card.addEventListener('click', () => {
            const idx = CONFIG.WORKS.findIndex(w => w.id === work.id);
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
        const buttons = document.querySelectorAll('.filter-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.dataset.category;
                CONFIG.activeCategory = category;
                animateGalleryTransition(category);
            });
        });
    }

    function animateGalleryTransition(category) {
        const grid = document.getElementById('galleryGrid');
        const cards = grid.querySelectorAll('.card');

        cards.forEach(c => {
            c.style.opacity = '0';
            c.style.transform = 'translateY(10px)';
        });

        setTimeout(() => {
            renderGallery(category);
        }, 250);
    }

    // ==========================================================
   懒加载
    // ==========================================================

    function initLazyLoad() {
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.card-image-wrap img').forEach(img => {
                if (img.dataset.lazySrc) {
                    img.src = img.dataset.lazySrc;
                }
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.lazySrc) {
                        img.src = img.dataset.lazySrc;
                        delete img.dataset.lazySrc;
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '300px 0px'
        });

        document.querySelectorAll('.card-image-wrap img[data-lazy-src]').forEach(img => {
            observer.observe(img);
        });
    }

    // ==========================================================
    //  灯箱
    // ==========================================================

    let currentLightboxIndex = -1;
    let visibleWorks = [];

    function getVisibleWorks() {
        const activeBtn = document.querySelector('.filter-btn.active');
        const category = activeBtn ? activeBtn.dataset.category : 'all';
        return category === 'all'
            ? [...CONFIG.WORKS]
            : CONFIG.WORKS.filter(w => w.category === category);
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
        const work = visibleWorks[currentLightboxIndex];
        if (!work) return;

        const img = document.getElementById('lightboxImg');
        const title = document.getElementById('lightboxTitle');
        const category = document.getElementById('lightboxCategory');
        const date = document.getElementById('lightboxDate');
        const desc = document.getElementById('lightboxDesc');
        const idSpan = document.getElementById('lightboxId');

        // 查找或创建编号标签
        let idBadge = document.querySelector('.lightbox-id-badge');
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
        const lightbox = document.getElementById('lightbox');
        const mask = document.getElementById('lightboxMask');
        const closeBtn = document.getElementById('lightboxClose');
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');
        const lbImg = document.getElementById('lightboxImg');

        closeBtn.addEventListener('click', closeLightbox);
        mask.addEventListener('click', closeLightbox);

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxPrev();
        });
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxNext();
        });

        // 键盘操作
        document.addEventListener('keydown', (e) => {
            if (currentLightboxIndex === -1) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lightboxPrev();
            if (e.key === 'ArrowRight') lightboxNext();
        });

        // 移动端触摸滑动
        let touchStartX = 0;
        let touchEndX = 0;

        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) lightboxNext();
                else lightboxPrev();
            }
        }, { passive: true });

        // 双击缩放
        let lastTap = 0;
        lbImg.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                const currentScale = parseFloat(lbImg.style.transform.replace('scale(', '')) || 1;
                const newScale = currentScale >= 2 ? 1 : 2.5;
                lbImg.style.transform = `scale(${newScale})`;
                e.preventDefault();
            }
            lastTap = now;
        });
    }

    // ==========================================================
    //  导航栏
    // ==========================================================

    function initNavbar() {
        const navbar = document.getElementById('navbar');
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('navLinks');

        // 滚动变色
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
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

        // 汉堡菜单
        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('open');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
        });

        // 点击链接关闭菜单
        links.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('open');
                toggle.classList.remove('active');
            });
        });

        // 点击外部关闭抽屉
        document.addEventListener('click', (e) => {
            if (links.classList.contains('open') &&
                !links.contains(e.target) &&
                !toggle.contains(e.target)) {
                links.classList.remove('open');
                toggle.classList.remove('active');
            }
        });
    }

    // ==========================================================
    //  初始化
    // ==========================================================

    async function init() {
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
