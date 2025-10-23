(function () {
  const CANVAS_ID = 'bg-canvas';
  let canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = CANVAS_ID;
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
  }

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1;

  const dots = [];
  const DOT_COUNT_BASE = 70; // scales with screen size
  const MAX_SPEED = 0.35;
  const LINK_DIST = 120;
  const MOUSE_LINK_DIST = 140;
  const MOUSE_INFLUENCE = 0.045;

  const mouse = { x: null, y: null, active: false };

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initDots();
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initDots() {
    const count = Math.floor(DOT_COUNT_BASE * (width * height) / (1280 * 720));
    dots.length = 0;
    for (let i = 0; i < Math.max(40, Math.min(140, count)); i++) {
      dots.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-MAX_SPEED, MAX_SPEED),
        vy: rand(-MAX_SPEED, MAX_SPEED),
        r: rand(1.1, 2.2)
      });
    }
  }

  function update() {
    for (const d of dots) {
      // mouse gentle influence
      if (mouse.active) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < MOUSE_LINK_DIST) {
          d.vx += (dx / dist) * MOUSE_INFLUENCE;
          d.vy += (dy / dist) * MOUSE_INFLUENCE;
        }
      }

      d.x += d.vx;
      d.y += d.vy;

      // soft bounds with bounce
      if (d.x < 0 || d.x > width) d.vx *= -1;
      if (d.y < 0 || d.y > height) d.vy *= -1;

      // clamp speed a bit
      d.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, d.vx));
      d.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, d.vy));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // link dots together
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK_DIST) {
          const alpha = 1 - dist / LINK_DIST;
          ctx.strokeStyle = `rgba(51,51,51,${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // link dots to mouse
    if (mouse.active) {
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_LINK_DIST) {
          const alpha = 1 - dist / MOUSE_LINK_DIST;
          ctx.strokeStyle = `rgba(51,51,51,${alpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
      }
    }

    // draw dots
    ctx.fillStyle = 'rgba(51,51,51,0.45)';
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let rafId = null;
  function tick() {
    update();
    draw();
    rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (rafId) return;
    resize();
    rafId = window.requestAnimationFrame(tick);
  }
  function stop() {
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Events
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.active = false; });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  // Kick off
  start();
})();
