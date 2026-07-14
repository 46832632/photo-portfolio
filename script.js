/* ===== Dark Editorial Photography Portfolio - Script ===== */
(function () {
  'use strict';

  // --- State ---
  const state = {
    photos: [],
    filtered: [],
    currentCategory: '全部',
    currentYear: '全部',
    viewerIndex: -1,
  };

  // --- DOM refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    gallery: $('#galleryGrid'),
    filterTabs: $('#filterTabs'),
    yearSelect: $('#yearSelect'),
    viewer: $('#viewer'),
    viewerImg: $('#viewerImg'),
    viewerYear: $('#viewerYear'),
    viewerCat: $('#viewerCat'),
    viewerId: $('#viewerId'),
    viewerCounter: $('#viewerCounter'),
    coverScroll: $('#coverScroll'),
  };

  // --- Data Loading ---
  async function loadPhotos() {
    try {
      const resp = await fetch('photos.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      state.photos = data.photos.filter(p => p.visible !== false);
      return true;
    } catch (e) {
      console.error('Failed to load photos:', e);
      return false;
    }
  }

  // --- Category Mapping ---
  const CAT_ORDER = ['全部', '自然', '人像', '街拍', '建筑', '旅行'];
  const CAT_LABELS = { '自然': '自然', '人像': '人像', '街拍': '街拍', '建筑': '建筑', '旅行': '旅行' };

  function getCategoryLabel(cat) {
    return CAT_LABELS[cat] || cat;
  }

  // --- Filter ---
  function applyFilter() {
    let result = [...state.photos];

    if (state.currentCategory !== '全部') {
      result = result.filter(p => p.category === state.currentCategory);
    }

    if (state.currentYear !== '全部') {
      result = result.filter(p => String(p.year) === state.currentYear);
    }

    state.filtered = result;
    renderGallery();
    updateFilterCounts();
  }

  function setCategory(cat) {
    state.currentCategory = cat;
    $$('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.cat === cat);
    });
    applyFilter();
  }

  function setYear(year) {
    state.currentYear = year;
    dom.yearSelect.value = year;
    applyFilter();
  }

  // --- Filter Bar ---
  function buildFilterBar() {
    // Category tabs
    dom.filterTabs.innerHTML = '';
    CAT_ORDER.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-tab' + (cat === '全部' ? ' active' : '');
      btn.dataset.cat = cat;
      btn.innerHTML = `${cat}<span class="filter-count"></span>`;
      btn.addEventListener('click', () => setCategory(cat));
      dom.filterTabs.appendChild(btn);
    });

    // Year select
    const years = new Set(state.photos.map(p => p.year));
    const sortedYears = [...years].sort((a, b) => b - a);
    dom.yearSelect.innerHTML = '<option value="全部">按年份</option>';
    sortedYears.forEach(y => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      dom.yearSelect.appendChild(opt);
    });
    dom.yearSelect.addEventListener('change', (e) => setYear(e.target.value));

    updateFilterCounts();
  }

  function updateFilterCounts() {
    $$('.filter-tab').forEach(tab => {
      const cat = tab.dataset.cat;
      const countEl = tab.querySelector('.filter-count');
      if (!countEl) return;
      const count = cat === '全部'
        ? state.photos.length
        : state.photos.filter(p => p.category === cat).length;
      countEl.textContent = `(${count})`;
    });
  }

  // --- Gallery Render ---
  function renderGallery() {
    dom.gallery.innerHTML = '';

    if (state.filtered.length === 0) {
      dom.gallery.innerHTML = `
        <div class="empty-state">
          <p>暂无此类作品</p>
        </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    state.filtered.forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.dataset.index = idx;

      const globalIdx = state.photos.indexOf(photo);
      const idNum = String(globalIdx + 1).padStart(3, '0');

      card.innerHTML = `
        <div class="placeholder"></div>
        <img src="${photo.src}" alt="${photo.title}" loading="lazy"
             onload="this.classList.add('loaded'); this.previousElementSibling.remove();"
             onerror="this.previousElementSibling.remove();">
        <span class="photo-id">#${idNum}</span>
        <div class="photo-info">
          <div class="photo-year">${photo.year} · ${getCategoryLabel(photo.category)}</div>
          <div class="photo-cat">${photo.title}</div>
        </div>`;

      card.addEventListener('click', () => openViewer(idx));
      fragment.appendChild(card);
    });

    dom.gallery.appendChild(fragment);
  }

  // --- Immersive Viewer ---
  function openViewer(index) {
    state.viewerIndex = index;
    updateViewerContent();
    dom.viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    dom.viewer.classList.remove('active');
    document.body.style.overflow = '';
    state.viewerIndex = -1;
  }

  function updateViewerContent() {
    const photo = state.filtered[state.viewerIndex];
    if (!photo) return;

    const globalIdx = state.photos.indexOf(photo);
    const idNum = String(globalIdx + 1).padStart(3, '0');

    dom.viewerImg.src = photo.src;
    dom.viewerImg.alt = photo.title;
    dom.viewerYear.textContent = `${photo.year} · ${getCategoryLabel(photo.category)}`;
    dom.viewerCat.textContent = photo.title;
    dom.viewerId.textContent = `#${idNum}`;
    dom.viewerCounter.textContent = `${state.viewerIndex + 1} / ${state.filtered.length}`;
  }

  function viewerNext() {
    if (state.viewerIndex < state.filtered.length - 1) {
      state.viewerIndex++;
      updateViewerContent();
    }
  }

  function viewerPrev() {
    if (state.viewerIndex > 0) {
      state.viewerIndex--;
      updateViewerContent();
    }
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Viewer close
    $('#viewerClose').addEventListener('click', closeViewer);
    dom.viewer.addEventListener('click', (e) => {
      if (e.target === dom.viewer) closeViewer();
    });

    // Viewer nav buttons
    $('#viewerPrev').addEventListener('click', (e) => { e.stopPropagation(); viewerPrev(); });
    $('#viewerNext').addEventListener('click', (e) => { e.stopPropagation(); viewerNext(); });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!dom.viewer.classList.contains('active')) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') viewerPrev();
      if (e.key === 'ArrowRight') viewerNext();
    });

    // Touch swipe in viewer
    let touchStartX = 0;
    dom.viewer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    dom.viewer.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) viewerNext();
        else viewerPrev();
      }
    }, { passive: true });

    // Cover scroll hint
    if (dom.coverScroll) {
      dom.coverScroll.addEventListener('click', () => {
        document.querySelector('.filter-bar').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // --- Init ---
  async function init() {
    const ok = await loadPhotos();
    if (!ok) {
      dom.gallery.innerHTML = '<div class="loading-spinner">加载失败，请刷新重试</div>';
      return;
    }

    buildFilterBar();
    applyFilter();
    bindEvents();
  }

  // --- Expose for inline onload handler ---
  window.photoPortfolio = { init };
})();
