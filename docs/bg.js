// Animated constellation background: drifting nodes linked by faint lines, reacting softly to the mouse.
(function () {
  const c = document.getElementById("bg");
  const lite = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 760px)").matches;
  if (lite) document.documentElement.classList.add("lite");
  if (!c || lite || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in")); return; }
  const ctx = c.getContext("2d");
  let w, h, dpr, pts = [], mouse = { x: -1e4, y: -1e4 };
  const COLORS = ["0,200,255", "124,92,255", "0,255,178"];
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    const n = Math.round(Math.min(90, (innerWidth * innerHeight) / 16000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25 * dpr, vy: (Math.random() - .5) * .25 * dpr,
      r: (Math.random() * 1.6 + .6) * dpr, c: COLORS[(Math.random() * COLORS.length) | 0],
    }));
  }
  addEventListener("resize", resize);
  addEventListener("mousemove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
  const LINK = 140;
  function frame() {
    ctx.clearRect(0, 0, w, h);
    const link = LINK * dpr;
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, md = Math.hypot(dx, dy);
      if (md < 160 * dpr) { p.x += dx / md * .6; p.y += dy / md * .6; }
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = `rgba(${a.c},${(1 - d / link) * .22})`;
          ctx.lineWidth = dpr * .8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${a.c},.7)`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  resize(); frame();
  // Scroll reveal
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: .12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  setTimeout(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in")), 2500);
})();
