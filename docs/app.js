(function () {
  const projects = window.PROJECTS || [];
  const grid = document.getElementById("grid");
  const filters = document.getElementById("filters");
  const canHover = window.matchMedia("(hover: hover)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    kids.forEach((c) => c && n.appendChild(c));
    return n;
  }

  function card(p, inFeatured) {
    const media = el("div", { class: "media" + (p.vertical ? " vertical" : "") });
    if (p.vertical) {
      const bd = el("div", { class: "backdrop" });
      bd.style.backgroundImage = `url(${p.poster})`;
      media.appendChild(bd);
    }
    media.appendChild(el("img", { src: p.poster, alt: p.title, loading: "lazy" }));
    const vid = el("video", { muted: "", loop: "", playsinline: "", preload: "none", disablepictureinpicture: "" });
    vid.muted = true;
    vid.dataset.src = p.loop;
    media.appendChild(vid);
    media.appendChild(el("span", { class: "badge", text: label(p.cat) }));
    media.appendChild(el("span", { class: "play", "aria-hidden": "true", text: "▶" }));

    const meta = [p.company, p.year].filter(Boolean).join(" · ");
    const body = el("div", { class: "card-body" },
      el("h3", { text: p.title }),
      el("p", { text: p.kicker }),
      meta ? el("p", { class: "meta", text: meta }) : null);

    const c = el("button", { class: "card" + (inFeatured && p === projects.find((x) => x.featured) ? " big" : "") + (p.vertical ? " tall" : ""), type: "button", "data-cat": p.cat, "aria-label": `Open ${p.title}` }, media, body);
    const play = () => { if (!vid.src) vid.src = vid.dataset.src; vid.play().then(() => c.classList.add("playing")).catch(() => {}); };
    const stop = () => { vid.pause(); c.classList.remove("playing"); };
    if (canHover) { c.addEventListener("mouseenter", play); c.addEventListener("mouseleave", stop); }
    c.addEventListener("click", () => open(p));
    return c;
  }

  function label(cat) { return (window.CATEGORIES.find(([k]) => k === cat) || [, ""])[1]; }

  // Layout: a featured row, then one section per genre. Filters show a single genre.
  const GENRE_ORDER = ["booth", "xr", "multi", "games"];
  function section(title, list, featured) {
    const g = el("div", { class: "grid" + (featured ? " featured" : "") });
    list.forEach((p) => g.appendChild(card(p, featured)));
    return el("div", { class: "genre" }, title ? el("h3", { class: "genre-title" }, document.createTextNode(title), el("span", { class: "genre-count", text: `${list.length} projects` })) : null, g);
  }
  function render(key) {
    grid.innerHTML = "";
    if (key === "all") {
      grid.appendChild(section("Featured", projects.filter((p) => p.featured), true));
      GENRE_ORDER.forEach((c) => grid.appendChild(section(label(c), projects.filter((p) => p.cat === c && !p.featured), false)));
    } else {
      grid.appendChild(section(null, projects.filter((p) => p.cat === key), false));
    }
    observeCards();
  }
  window.CATEGORIES.forEach(([key, name], i) => {
    const b = el("button", { type: "button", role: "tab", "aria-selected": i === 0 ? "true" : "false", text: name });
    b.addEventListener("click", () => {
      filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
      render(key);
    });
    filters.appendChild(b);
  });

  // Touch devices: no autoplaying previews (smooth scrolling, saves mobile data). Tap a card to watch.
  function observeCards() {}
  const hint = document.getElementById("work-hint");
  if (hint && !canHover) hint.textContent = "Tap any project to watch the full video with sound.";
  render("all");

  // Case-study videos play when visible
  if ("IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.4 });
    document.querySelectorAll("video[data-autoplay]").forEach((v) => io2.observe(v));
  }

  // Modal
  const modal = document.getElementById("modal");
  const mMedia = document.getElementById("m-media");
  let current = -1;
  function open(p) {
    current = projects.indexOf(p);
    mMedia.innerHTML = "";
    mMedia.className = "m-media" + (p.vertical && (!p.full || p.full.type !== "youtube") ? " vertical" : "");
    if (p.full && p.full.type === "youtube") {
      mMedia.appendChild(el("iframe", { src: `https://www.youtube-nocookie.com/embed/${p.full.id}?autoplay=1&rel=0`, title: p.title, allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: "" }));
    } else {
      const v = el("video", { controls: "", autoplay: "", playsinline: "", poster: p.poster });
      v.src = p.full ? p.full.src : p.loop;
      if (!p.full) { v.muted = true; v.loop = true; }
      mMedia.appendChild(v);
    }
    document.getElementById("m-tag").textContent = [p.company, p.year].filter(Boolean).join(" · ") || label(p.cat);
    document.getElementById("m-title").textContent = p.title;
    document.getElementById("m-kicker").textContent = p.kicker;
    document.getElementById("m-summary").textContent = p.summary;
    const ul = document.getElementById("m-features");
    ul.innerHTML = "";
    p.features.forEach((f) => ul.appendChild(el("li", { text: f })));
    const links = document.getElementById("m-links");
    links.innerHTML = "";
    if (p.full && p.full.type === "youtube") links.appendChild(el("a", { class: "btn btn-ghost", href: `https://www.youtube.com/watch?v=${p.full.id}`, target: "_blank", rel: "noopener", text: "Watch on YouTube" }));
    if (p.link) links.appendChild(el("a", { class: "btn btn-ghost", href: p.link[1], target: "_blank", rel: "noopener", text: p.link[0] }));
    if (!modal.open) modal.showModal();
  }
  function close() { mMedia.innerHTML = ""; modal.close(); }
  function step(d) { if (current < 0) return; open(projects[(current + d + projects.length) % projects.length]); }
  document.getElementById("m-prev").addEventListener("click", () => step(-1));
  document.getElementById("m-next").addEventListener("click", () => step(1));
  document.addEventListener("keydown", (e) => { if (!modal.open) return; if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
  document.getElementById("m-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  modal.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
})();

// Animated stat counters + back-to-top button
(function () {
  const els = document.querySelectorAll("[data-count]");
  const run = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1400;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * e) + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .6 });
    els.forEach((el) => io.observe(el));
  }
  const top = document.querySelector(".to-top");
  addEventListener("scroll", () => top && top.classList.toggle("show", scrollY > 900), { passive: true });
})();

// If the browser blocks autoplay (e.g. iPhone Low Power Mode), swap decorative videos for their still poster image.
(function () {
  document.querySelectorAll(".hero-video, .case-media video").forEach((v) => {
    const fallback = () => {
      const img = document.createElement("img");
      img.src = v.getAttribute("poster"); img.alt = ""; img.className = v.className; img.setAttribute("aria-hidden", "true");
      if (v.classList.contains("hero-video")) Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", opacity: ".42" });
      else Object.assign(img.style, { width: "100%", borderRadius: "16px", border: "1px solid var(--line)" });
      v.replaceWith(img);
    };
    if (v.classList.contains("hero-video")) {
      const p = v.play();
      if (p && p.catch) p.catch(fallback);
    } else {
      v.addEventListener("error", fallback);
    }
  });
})();
