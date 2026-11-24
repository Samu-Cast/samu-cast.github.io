// Small centered scroll indicator for the horizontal rows.
// Replaces the native scrollbar; it can be dragged or clicked to scroll.
// Without JavaScript the native (thin) scrollbar is used instead.
(() => {
  'use strict';

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const MIN_THUMB = 0.22;   // thumb never smaller than 22% of the track

  document.querySelectorAll('.rail').forEach((rail) => {
    const bar = document.createElement('div');
    const thumb = document.createElement('div');
    bar.className = 'rail-bar';
    thumb.className = 'rail-bar__thumb';
    bar.setAttribute('aria-hidden', 'true');
    bar.append(thumb);
    rail.after(bar);
    rail.classList.add('rail--js');

    let thumbFrac = 1;

    function update() {
      const max = rail.scrollWidth - rail.clientWidth;
      bar.hidden = max <= 24;   // nothing meaningful to scroll
      if (bar.hidden) return;
      thumbFrac = Math.max(MIN_THUMB, rail.clientWidth / rail.scrollWidth);
      const p = clamp(rail.scrollLeft / max);
      thumb.style.width = `${thumbFrac * 100}%`;
      thumb.style.transform = `translateX(${(p * (1 - thumbFrac) / thumbFrac) * 100}%)`;
    }

    function seek(clientX) {
      const r = bar.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const p = clamp((x - thumbFrac / 2) / (1 - thumbFrac));
      rail.scrollLeft = p * (rail.scrollWidth - rail.clientWidth);
    }

    let dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      rail.classList.add('rail--dragging');
      seek(e.clientX);
      e.preventDefault();
    });
    bar.addEventListener('pointermove', (e) => { if (dragging) seek(e.clientX); });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('rail--dragging');
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);

    rail.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(rail);
    window.addEventListener('resize', update);
    update();
  });
})();
