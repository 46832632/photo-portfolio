/* ============================================================
   桂落春山 — 主交互逻辑 v3.0
   数据: data/photos.json | R2图床 | 分类筛选 | 灯箱 | 统计 | 进度条
   ============================================================ */
(function () {
    "use strict";

    /* ---- 配置 ---- */
    var CONFIG = {
        R2_DOMAIN: "https://pub-35907bd241b3427e9a8302fe37d12c06.r2.dev",
        CATEGORY_LABELS: {
            landscape: "\u98ce\u5149", portrait: "\u4eba\u50cf",
            street: "\u8857\u62cd", architecture: "\u5efa\u7b51",
            nature: "\u81ea\u7136", travel: "\u65c5\u884c"
        },
        WORKS: [],
        activeCategory: "all"
    };

    /* ---- 工具函数 ---- */
    function getLabel(cat) { return CONFIG.CATEGORY_LABELS[cat] || cat; }
    function getImageUrl(work) { return CONFIG.R2_DOMAIN + "/" + work.filename; }
    function padId(n) { return "#" + String(n).padStart(3, "0"); }

    function el(tag, className, html) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    /* ---- 加载作品数据 ---- */
    async function loadWorks() {
        try {
            var resp = await fetch("data/photos.json");
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            var data = await resp.json();
            CONFIG.WORKS = data.works || [];
            return data.categories || [];
        } catch (err) {
            console.error("Failed to load photos:", err);
            return [];
        }
    }

    /* ---- 渲染分类筛选按钮 ---- */
    function renderFilterButtons(categories) {
        var bar = document.getElementById("filterBar");
        if (!bar || !categories.length) return;

        categories.forEach(function(c) {
            if (c.id === "all") return;
            var btn = el("button", "filter-btn", getLabel(c.id));
            btn.dataset.category = c.id;
            bar.appendChild(btn);
        });
    }

    /* ---- 渲染统计概览 ---- */
    function renderStats() {
        var grid = document.getElementById("statsGrid");
        if (!grid) return;

        var total = CONFIG.WORKS.length;
        var cats = {};
        var years = new Set();

        CONFIG.WORKS.forEach(function(w) {
            cats[w.category] = (cats[w.category] || 0) + 1;
            if (w.year) years.add(w.year);
        });

        var topCat = Object.keys(cats).sort(function(a, b) { return cats[b] - cats[a]; })[0];
        var minYear = Math.min.apply(null, [...years]);
        var maxYear = Math.max.apply(null, [...years]);

        var items = [
            { num: total, label: "作品总数" },
            { num: cats[topCat], label: topCat ? getLabel(topCat) : "— 最多分类" },
            { num: years.size, label: "年份跨度 (" + minYear + "-" + maxYear + ")" },
            { num: Object.keys(cats).length, label: "分类数量" }
        ];

        items.forEach(function(item) {
            var div = el("div", "stat-item");
            div.innerHTML = "<div class='stat-number'>" + item.num + "</div><div class='stat-label'>" + item.label + "</div>";
            grid.appendChild(div);
        });
    }

    /* ---- 渲染画廊卡片 ---- */
    function renderGallery(category) {
        var grid = document.getElementById("galleryGrid");
        if (!grid) return;
        grid.innerHTML = "";

        var filtered = category === "all"
            ? CONFIG.WORKS.slice()
            : CONFIG.WORKS.filter(function(w) { return w.category === category; });

        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state"><p>暂无作品</p></div>';
            return;
        }

        var frag = document.createDocumentFragment();
        filtered.forEach(function(work, i) {
            frag.appendChild(createCard(work, i));
        });
        grid.appendChild(frag);

        observeCards();
    }

    function createCard(work, index) {
        var card = el("div", "photo-card");
        card.dataset.id = work.id;
        card.dataset.category = work.category;

        var wrap = el("div", "card-image-wrap");

        // Skeleton placeholder
        var skeleton = el("div", "card-skeleton");
        var h = Math.round((work.aspectRatio || 0.75) * 260);
        skeleton.style.height = h + "px";
        skeleton.style.aspectRatio = work.aspectRatio || "0.75";
        wrap.appendChild(skeleton);

        // ID badge
        var badge = el("span", "card-badge", padId(work.id));
        wrap.appendChild(badge);

        // Image
        var img = el("img");
        img.src = getImageUrl(work);
        img.alt = work.title;
        img.loading = "lazy";
        img.style.aspectRatio = work.aspectRatio || "0.75";
        img.style.objectFit = "cover";

        img.onload = function() {
            if (skeleton.parentNode) skeleton.remove();
            img.classList.add("loaded");
            card.classList.add("loaded");
            card.style.transitionDelay = ((index % 3) * 60) + "ms";
        };
        img.onerror = function() {
            if (skeleton.parentNode) skeleton.remove();
            img.style.display = "none";
        };
        wrap.appendChild(img);

        // Info
        var info = el("div", "card-info");
        info.innerHTML =
            "<p class='card-title'>" + work.title + "</p>" +
            "<span class='card-category'>" + getLabel(work.category) + "</span>";

        card.appendChild(wrap);
        card.appendChild(info);

        card.addEventListener("click", function() { openLightbox(work.id); });
        return card;
    }

    /* ---- Intersection Observer 入场动画 ---- */
    function observeCards() {
        if (!window.IntersectionObserver) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("loaded");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: "60px" });

        document.querySelectorAll(".photo-card:not(.loaded)").forEach(function(c) {
            observer.observe(c);
        });
    }

    /* ---- 分类筛选事件 ---- */
    function initFilter() {
        var btns = document.querySelectorAll(".filter-btn");
        btns.forEach(function(btn) {
            btn.addEventListener("click", function() {
                btns.forEach(function(b) { b.classList.remove("active"); });
                btn.classList.add("active");
                CONFIG.activeCategory = btn.dataset.category;
                renderGallery(CONFIG.activeCategory);
            });
        });
    }

    /* ---- 灯箱 ---- */
    var lightboxIndex = -1;
    var visibleWorks = [];

    function getFilteredWorks() {
        var activeBtn = document.querySelector(".filter-btn.active");
        var cat = activeBtn ? activeBtn.dataset.category : "all";
        return cat === "all"
            ? CONFIG.WORKS.slice()
            : CONFIG.WORKS.filter(function(w) { return w.category === cat; });
    }

    function openLightbox(workId) {
        visibleWorks = getFilteredWorks();
        lightboxIndex = visibleWorks.findIndex(function(w) { return w.id === workId; });
        if (lightboxIndex < 0) lightboxIndex = 0;
        updateLightbox();
        document.getElementById("lightbox").classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        document.getElementById("lightbox").classList.remove("active");
        document.body.style.overflow = "";
        lightboxIndex = -1;
    }

    function updateLightbox() {
        var work = visibleWorks[lightboxIndex];
        if (!work) return;

        document.getElementById("lbImg").src = getImageUrl(work);
        document.getElementById("lbImg").alt = work.title;
        document.getElementById("lbTitle").textContent = work.title;
        document.getElementById("lbId").textContent = padId(work.id);
        document.getElementById("lbCat").textContent = getLabel(work.category);
        document.getElementById("lbDate").textContent = work.date || "";
        document.getElementById("lbDesc").textContent = work.camera || "未知设备";
        document.getElementById("lbEquip").textContent = work.width
            ? (work.width + " × " + work.height)
            : "";
    }

    function prevWork() {
        if (!visibleWorks.length) return;
        lightboxIndex = (lightboxIndex - 1 + visibleWorks.length) % visibleWorks.length;
        updateLightbox();
    }

    function nextWork() {
        if (!visibleWorks.length) return;
        lightboxIndex = (lightboxIndex + 1) % visibleWorks.length;
        updateLightbox();
    }

    function initLightbox() {
        var lb = document.getElementById("lightbox");
        document.getElementById("lbMask").addEventListener("click", closeLightbox);
        document.getElementById("lbClose").addEventListener("click", closeLightbox);
        document.getElementById("lbPrev").addEventListener("click", function(e) { e.stopPropagation(); prevWork(); });
        document.getElementById("lbNext").addEventListener("click", function(e) { e.stopPropagation(); nextWork(); });

        document.addEventListener("keydown", function(e) {
            if (lightboxIndex < 0) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") prevWork();
            if (e.key === "ArrowRight") nextWork();
        });

        var touchStartX = 0;
        lb.addEventListener("touchstart", function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        lb.addEventListener("touchend", function(e) {
            var diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) diff > 0 ? nextWork() : prevWork();
        }, { passive: true });

        var lastTap = 0;
        var lbImg = document.getElementById("lbImg");
        lbImg.addEventListener("touchend", function(e) {
            var now = Date.now();
            if (now - lastTap < 300) {
                var cur = parseFloat(lbImg.style.transform.replace("scale(", "") || 1);
                lbImg.style.transform = "scale(" + (cur >= 2 ? 1 : 2.5) + ")";
                e.preventDefault();
            }
            lastTap = now;
        });
    }

    /* ---- 导航栏 ---- */
    function initNavbar() {
        var nav = document.getElementById("navbar");
        var toggle = document.getElementById("menuToggle");
        var links = document.getElementById("navLinks");

        window.addEventListener("scroll", function() {
            nav.classList.toggle("scrolled", window.scrollY > 50);
        }, { passive: true });

        toggle.addEventListener("click", function() {
            var isOpen = links.classList.toggle("open");
            toggle.classList.toggle("active");
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        links.querySelectorAll("a").forEach(function(link) {
            link.addEventListener("click", function() {
                links.classList.remove("open");
                toggle.classList.remove("active");
                toggle.setAttribute("aria-expanded", "false");
            });
        });

        document.addEventListener("click", function(e) {
            if (links.classList.contains("open") &&
                !links.contains(e.target) && !toggle.contains(e.target)) {
                links.classList.remove("open");
                toggle.classList.remove("active");
            }
        });
    }

    /* ---- 阅读进度条 ---- */
    function initProgressBar() {
        var bar = document.getElementById("progressBar");
        if (!bar) return;

        var ticking = false;
        window.addEventListener("scroll", function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    var h = document.documentElement.scrollHeight - window.innerHeight;
                    bar.style.width = h > 0 ? (window.scrollY / h * 100) + "%" : "0%";
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ---- 初始化 ---- */
    async function init() {
        initProgressBar();
        initNavbar();
        initLightbox();

        var categories = await loadWorks();
        renderFilterButtons(categories);
        renderStats();
        renderGallery("all");
        initFilter();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();