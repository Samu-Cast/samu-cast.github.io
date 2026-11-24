// Hero animation: a cascade of bits flies in from the right, assembles the name,
// then keeps streaming and bursts on impact with the letters.
// First-party, no dependencies, no network, no DOM string sinks (Trusted Types safe).
(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const name = hero && hero.querySelector('.name');
  const lines = name ? name.querySelectorAll('.name__line') : [];
  if (!hero || !name || lines.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  name.classList.add('name--pending');
  canvas.className = 'bits';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  const BONE = '#ece8e2';
  const RED = '#e3122b';
  const ASH = 'rgba(170, 164, 157, 0.85)';
  const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", monospace';

  let W = 0, H = 0, dpr = 1;
  let mask = null, maskW = 0, maskH = 0;
  let bandTop = 0, bandBottom = 0, cell = 10;
  let formers = [], formEnd = 0;
  let streams = [], sparks = [];
  let phase = 'form';            // form -> settle -> stream
  let clock = 0, settleStart = 0, spawnAcc = 0;
  let last = 0, rafId = 0, visible = true;

  const rand = (a, b) => a + Math.random() * (b - a);
  const bit = () => (Math.random() < 0.5 ? '0' : '1');
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function measure() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw the name off-screen exactly where the real text sits, then read it back as a mask.
    maskW = Math.ceil(W); maskH = Math.ceil(H);
    const off = document.createElement('canvas');
    off.width = maskW; off.height = maskH;
    const o = off.getContext('2d', { willReadFrequently: true });
    let fontSize = 0;
    bandTop = Infinity; bandBottom = 0;

    lines.forEach((el, i) => {
      const lr = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      fontSize = parseFloat(cs.fontSize);
      o.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      o.textBaseline = 'alphabetic';
      const m = o.measureText(el.textContent);
      const asc = m.fontBoundingBoxAscent || fontSize * 0.8;
      const desc = m.fontBoundingBoxDescent || fontSize * 0.2;
      const x = lr.left - r.left;
      const y = lr.top - r.top + (lr.height - (asc + desc)) / 2 + asc;
      o.fillStyle = i === 0 ? '#ff0000' : '#00ff00';   // channel = which line
      o.fillText(el.textContent, x, y);
      bandTop = Math.min(bandTop, lr.top - r.top);
      bandBottom = Math.max(bandBottom, lr.bottom - r.top);
    });

    const data = o.getImageData(0, 0, maskW, maskH).data;
    mask = new Uint8Array(maskW * maskH);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
      if (data[p + 3] > 110) mask[i] = data[p] > data[p + 1] ? 1 : 2;
    }

    const step = Math.max(4, Math.round(fontSize / 15));
    cell = Math.round(step * 1.45);
    return step;
  }

  function hit(x, y) {
    const xi = x | 0, yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= maskW || yi >= maskH) return 0;
    return mask[yi * maskW + xi];
  }

  function buildFormation(step) {
    formers = [];
    formEnd = 0;
    for (let y = Math.floor(bandTop); y < bandBottom; y += step) {
      for (let x = 0; x < maskW; x += step) {
        const c = hit(x + step / 2, y + step / 2);
        if (!c) continue;
        const delay = rand(0, 0.9);
        const dur = 0.8 + (1 - x / W) * 0.9 + rand(0, 0.25);
        formEnd = Math.max(formEnd, delay + dur);
        formers.push({
          tx: x + step / 2, ty: y + step / 2,
          x0: W + rand(10, W * 0.45), y0: y + rand(-H * 0.18, H * 0.18),
          delay, dur, color: c === 1 ? BONE : RED, ch: bit(), flip: rand(0, 0.08),
        });
      }
    }
  }

  function explode(x, y, c) {
    const n = 10 + ((Math.random() * 8) | 0);
    for (let i = 0; i < n; i++) {
      const a = rand(-1.9, 1.9);            // mostly bouncing back to the right
      const v = rand(110, 360);
      sparks.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: rand(0.35, 0.8), age: 0, size: rand(2, 4),
        color: Math.random() < 0.6 ? (c === 1 ? BONE : RED) : RED,
        ch: Math.random() < 0.3 ? bit() : null,
      });
    }
    sparks.push({ x, y, ring: true, age: 0, life: 0.32, color: c === 1 ? BONE : RED });
  }

  function update(dt) {
    clock += dt;

    if (phase === 'form' && clock > formEnd + 0.1) {
      phase = 'settle';
      settleStart = clock;
      name.classList.add('name--formed');
    }
    if (phase === 'settle' && clock - settleStart > 0.5) {
      phase = 'stream';
      formers = [];
    }

    if (phase !== 'form') {
      const rate = Math.min(26, Math.max(7, W / 55));
      spawnAcc += dt * rate;
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        streams.push({
          x: W + cell, y: rand(bandTop + cell * 0.5, bandBottom - cell * 0.5),
          vx: -rand(240, 520), ch: bit(), flip: rand(0, 0.1),
        });
      }
    }

    for (let i = streams.length - 1; i >= 0; i--) {
      const s = streams[i];
      s.x += s.vx * dt;
      s.flip -= dt;
      if (s.flip < 0) { s.ch = bit(); s.flip = rand(0.05, 0.14); }
      const c = hit(s.x - cell * 0.3, s.y);
      if (c) { explode(s.x, s.y, c); streams.splice(i, 1); }
      else if (s.x < -cell) streams.splice(i, 1);
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.age += dt;
      if (p.age >= p.life) { sparks.splice(i, 1); continue; }
      if (!p.ring) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (formers.length) {
      const fade = phase === 'settle' ? Math.max(0, 1 - (clock - settleStart) / 0.5) : 1;
      ctx.font = `600 ${cell}px ${MONO}`;
      for (const f of formers) {
        const t = (clock - f.delay) / f.dur;
        if (t <= 0) continue;
        const e = easeOut(Math.min(1, t));
        if (t < 1) { f.flip -= 1 / 60; if (f.flip < 0) { f.ch = bit(); f.flip = 0.07; } }
        ctx.globalAlpha = fade * Math.min(1, t * 3);
        ctx.fillStyle = f.color;
        ctx.fillText(f.ch, f.x0 + (f.tx - f.x0) * e, f.y0 + (f.ty - f.y0) * e);
      }
    }

    ctx.globalAlpha = 1;
    ctx.font = `500 ${cell}px ${MONO}`;
    ctx.fillStyle = ASH;
    for (const s of streams) ctx.fillText(s.ch, s.x, s.y);

    for (const p of sparks) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = k;
      if (p.ring) {
        const r = cell * (0.4 + (1 - k) * 2.2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2);
      } else if (p.ch) {
        ctx.fillStyle = p.color;
        ctx.font = `500 ${Math.round(cell * 0.6)}px ${MONO}`;
        ctx.fillText(p.ch, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    rafId = visible ? requestAnimationFrame(frame) : 0;
  }

  function start() {
    if (rafId) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stopForGood() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    visible = false;
    canvas.remove();
    name.classList.add('name--formed');
  }

  // Pause when the hero is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(hero);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!canvas.isConnected) return;
      measure();
      streams = []; sparks = [];
      if (phase === 'form') { formers = []; phase = 'stream'; name.classList.add('name--formed'); }
    }, 150);
  });

  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', (e) => { if (e.matches) stopForGood(); });

  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('400 100px Anton'), document.fonts.ready]).catch(() => {})
    : Promise.resolve();

  fontsReady.then(() => {
    const step = measure();
    buildFormation(step);
    if (!formers.length) { stopForGood(); return; }
    start();
  });
})();
