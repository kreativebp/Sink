/* ══════════════════════════════════════════════════════
   SINK — script.js
   Premium Climate-Tech Landing Page
══════════════════════════════════════════════════════ */

'use strict';

/* ─── Utilities ────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const rand  = (a, b) => Math.random() * (b - a) + a;

/* ──────────────────────────────────────────────────────
   1. PARTICLE CANVAS — Hero & CTA
────────────────────────────────────────────────────── */
function initParticleCanvas(canvasId, options = {}) {
  const canvas = qs(`#${canvasId}`);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const cfg = {
    count:      options.count      ?? 90,
    color:      options.color      ?? '35, 155, 110',
    maxRadius:  options.maxRadius  ?? 2.2,
    speed:      options.speed      ?? 0.4,
    connections:options.connections ?? true,
    connDist:   options.connDist   ?? 160,
  };

  let W, H, particles = [], raf;

  /* Resize */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* Particle factory */
  function makeParticle() {
    return {
      x:   rand(0, W),
      y:   rand(0, H),
      vx:  rand(-cfg.speed, cfg.speed),
      vy:  rand(-cfg.speed * 0.6, cfg.speed * 0.6),
      r:   rand(0.5, cfg.maxRadius),
      a:   rand(0.1, 0.55),
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: cfg.count }, makeParticle);
  }

  /* Draw frame */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      /* Move */
      p.x += p.vx;
      p.y += p.vy;

      /* Wrap */
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      /* Draw dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cfg.color}, ${p.a})`;
      ctx.fill();

      /* Draw connections */
      if (cfg.connections) {
        for (let j = i + 1; j < particles.length; j++) {
          const q  = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d  = Math.sqrt(dx * dx + dy * dy);

          if (d < cfg.connDist) {
            const alpha = (1 - d / cfg.connDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${cfg.color}, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }
    }

    raf = requestAnimationFrame(draw);
  }

  /* Resize observer */
  const ro = new ResizeObserver(() => {
    resize();
  });
  ro.observe(canvas.parentElement || canvas);

  init();
  draw();

  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

/* ──────────────────────────────────────────────────────
   2. NAVIGATION
────────────────────────────────────────────────────── */
function initNav() {
  const nav    = qs('.nav');
  const burger = qs('#navBurger');
  const menu   = qs('#navMenu');

  if (!nav) return;

  /* Scroll state */
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile toggle */
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });

    /* Close on link click */
    qsa('.nav-link', menu).forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Smooth-scroll for all anchor links */
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = nav ? nav.offsetHeight : 72;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth',
      });
    });
  });
}

/* ──────────────────────────────────────────────────────
   3. SCROLL REVEAL (Intersection Observer)
────────────────────────────────────────────────────── */
function initReveal() {
  const revealEls = qsa('[class*="reveal-"]');
  if (!revealEls.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-60px 0px', threshold: 0.08 }
  );

  revealEls.forEach(el => io.observe(el));
}

/* ──────────────────────────────────────────────────────
   4. COUNTER ANIMATION
────────────────────────────────────────────────────── */
function initCounters() {
  const counters = qsa('.counter');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix ?? '';
    const duration = 1800;
    const start    = performance.now();

    /* Check for prefix (handles $ sign) */
    const wrapper = el.closest('.im-num');
    const prefix  = wrapper ? (wrapper.dataset.prefix ?? '') : '';

    function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const v = easeOut(t) * target;

      let display;
      if (target >= 100) {
        display = Math.round(v).toLocaleString();
      } else {
        display = v < 10 ? v.toFixed(1) : Math.round(v).toString();
      }

      el.textContent = display + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-80px 0px', threshold: 0.1 }
  );

  counters.forEach(c => io.observe(c));
}

/* ──────────────────────────────────────────────────────
   5. PROCESS STEP — Active highlight on scroll
────────────────────────────────────────────────────── */
function initProcessSteps() {
  const steps = qsa('.process-step');
  if (!steps.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          /* Deactivate all, activate this one */
          steps.forEach(s => s.classList.remove('ps-active'));
          entry.target.classList.add('ps-active');
        }
      });
    },
    { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
  );

  steps.forEach(s => io.observe(s));
}

/* ──────────────────────────────────────────────────────
   6. HERO CANVAS — Ocean bioluminescent particles
────────────────────────────────────────────────────── */
function initHeroCanvas() {
  const canvas = qs('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let raf;

  const PARTICLE_COUNT = window.innerWidth < 768 ? 55 : 110;
  const COLORS = [
    [35, 155, 110],   // green
    [13,  59, 102],   // deep ocean
    [92, 191,  58],   // light green
    [8,   19,  31],   // dark navy
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeParticle() {
    const color = COLORS[Math.floor(rand(0, COLORS.length))];
    return {
      x:     rand(0, W),
      y:     rand(0, H),
      vx:    rand(-0.35, 0.35),
      vy:    rand(-0.2,  0.2),
      r:     rand(0.8, 2.4),
      baseA: rand(0.08, 0.45),
      a:     0,
      color,
      phase: rand(0, Math.PI * 2),
      freq:  rand(0.003, 0.008),
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
  }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* Background deep gradient */
    const bg = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.5, H * 0.5, W * 0.85);
    bg.addColorStop(0, 'rgba(13,59,102,0.25)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      /* Pulse opacity */
      p.a = p.baseA * (0.7 + 0.3 * Math.sin(ts * p.freq + p.phase));

      /* Mouse repulsion */
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14400) {   // 120px radius
        const d   = Math.sqrt(d2);
        const f   = (120 - d) / 120 * 0.015;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }

      /* Velocity damping */
      p.vx *= 0.99;
      p.vy *= 0.99;

      /* Cap speed */
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > 1.2) { p.vx /= spd / 1.2; p.vy /= spd / 1.2; }

      /* Move */
      p.x += p.vx;
      p.y += p.vy;

      /* Wrap */
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      /* Glow effect */
      const [r, g, b] = p.color;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      glow.addColorStop(0, `rgba(${r},${g},${b},${p.a})`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      /* Dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.a * 2.5})`;
      ctx.fill();

      /* Connections */
      for (let j = i + 1; j < particles.length; j++) {
        const q  = particles[j];
        const cx = p.x - q.x;
        const cy = p.y - q.y;
        const cd = Math.sqrt(cx * cx + cy * cy);
        if (cd < 140) {
          const alpha = (1 - cd / 140) * 0.1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(35,155,110,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(draw);
  }

  /* Mouse tracking */
  const hero = canvas.closest('.hero');
  if (hero) {
    hero.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || canvas);

  init();
  raf = requestAnimationFrame(draw);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

/* ──────────────────────────────────────────────────────
   7. CTA MINI CANVAS — subtle moving particles
────────────────────────────────────────────────────── */
function initCtaCanvas() {
  initParticleCanvas('ctaCanvas', {
    count:       50,
    color:       '35, 155, 110',
    maxRadius:   1.8,
    speed:       0.25,
    connections: true,
    connDist:    130,
  });
}

/* ──────────────────────────────────────────────────────
   8. CIRCULAR DIAGRAM — rotate on scroll proximity
────────────────────────────────────────────────────── */
function initCircularDiagram() {
  const diag = qs('.process-diagram');
  if (!diag) return;

  const arc = qs('.circ-arc', diag);
  if (!arc) return;

  /* Highlight nodes as corresponding step becomes active */
  const steps = qsa('.process-step');
  const nodes = qsa('.circ-node');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const step    = entry.target;
        const idx     = steps.indexOf(step);
        const nodeNum = idx + 1;

        nodes.forEach(n => {
          const active = parseInt(n.dataset?.node ?? 0) === nodeNum;
          n.style.opacity = active ? '1' : '0.5';
          n.style.transform = active ? 'scale(1.2)' : 'scale(1)';
          n.style.transition = 'opacity 0.4s, transform 0.4s';
        });
      });
    },
    { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
  );

  steps.forEach(s => io.observe(s));
}

/* ──────────────────────────────────────────────────────
   9. TECH CARD — staggered entrance
────────────────────────────────────────────────────── */
function initTechCards() {
  const cards = qsa('.tech-card, .app-card');
  cards.forEach((card, i) => {
    if (!card.style.getPropertyValue('--delay')) {
      card.style.setProperty('--delay', `${i * 0.06}s`);
    }
  });
}

/* ──────────────────────────────────────────────────────
   10. PARALLAX — subtle on hero content
────────────────────────────────────────────────────── */
function initParallax() {
  const hero = qs('.hero');
  if (!hero) return;

  const content = qs('.hero-content', hero);
  if (!content) return;

  let lastY = 0;

  function onScroll() {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 1) return;
    lastY = y;

    /* Only apply while hero is visible */
    if (y > window.innerHeight) return;

    const factor = y * 0.25;
    content.style.transform = `translateY(${factor}px)`;
    content.style.opacity   = 1 - y / (window.innerHeight * 0.6);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ──────────────────────────────────────────────────────
   11. IMPACT CATEGORY BORDER ANIMATION
────────────────────────────────────────────────────── */
function initImpactCats() {
  const cats = qsa('.impact-cat');
  cats.forEach((cat, i) => {
    if (!cat.style.getPropertyValue('--delay')) {
      cat.style.setProperty('--delay', `${i * 0.1}s`);
    }
  });
}

/* ──────────────────────────────────────────────────────
   12. STAT CARDS — counter-like entrance numbers
────────────────────────────────────────────────────── */
function initStatCards() {
  const cards = qsa('.stat-card');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-60px', threshold: 0.15 }
  );
  cards.forEach((c, i) => {
    c.classList.add('reveal-up');
    c.style.setProperty('--delay', `${i * 0.07}s`);
    io.observe(c);
  });
}

/* ──────────────────────────────────────────────────────
   13. TIMELINE CONNECTOR FILL
────────────────────────────────────────────────────── */
function initTimeline() {
  const tlItems = qsa('.tl-item');
  if (!tlItems.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-80px', threshold: 0.1 }
  );

  tlItems.forEach(item => io.observe(item));
}

/* ──────────────────────────────────────────────────────
   INIT ALL
────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Prefer reduced-motion: skip heavy animations */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initNav();
  initReveal();
  initCounters();
  initProcessSteps();
  initTechCards();
  initImpactCats();
  initTimeline();

  if (!reducedMotion) {
    initHeroCanvas();
    initCtaCanvas();
    initParallax();
    initCircularDiagram();
  }

  /* Log */
  console.log('%cSINK — Powered by Nature. Driven by Circularity.', [
    'color: #239B6E',
    'font-family: sans-serif',
    'font-size: 14px',
    'font-weight: 700',
    'padding: 8px 0',
  ].join(';'));
});

/* ──────────────────────────────────────────────────────
   WINDOW LOAD — ensure fonts rendered before canvas
────────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  /* Force hero canvas resize after fonts load */
  const heroCanvas = qs('#heroCanvas');
  if (heroCanvas) {
    heroCanvas.width  = heroCanvas.offsetWidth;
    heroCanvas.height = heroCanvas.offsetHeight;
  }
});
