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
    const vid = el("video", { muted: "", loop: "", playsinline: "", preload: "none" });
    vid.muted = true;
    vid.dataset.src = p.loop;
    media.appendChild(vid);
    media.appendChild(el("span", { class: "badge", text: label(p.cat) }));

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
    return el("div", { class: "genre" }, title ? el("h3", { class: "genre-title", text: `${title} · ${list.length}` }) : null, g);
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

  // Touch devices: play loops when cards scroll into view
  const io = !canHover && "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target.querySelector("video");
    if (e.isIntersecting && e.intersectionRatio > 0.6) { if (!v.src) v.src = v.dataset.src; v.play().then(() => e.target.classList.add("playing")).catch(() => {}); }
    else { v.pause(); e.target.classList.remove("playing"); }
  }), { threshold: [0, 0.6] }) : null;
  function observeCards() { if (io) grid.querySelectorAll(".card").forEach((c) => io.observe(c)); }
  render("all");

  // Case-study videos play when visible
  if ("IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.4 });
    document.querySelectorAll("video[data-autoplay]").forEach((v) => io2.observe(v));
  }

  // Modal
  const modal = document.getElementById("modal");
  const mMedia = document.getElementById("m-media");
  function open(p) {
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
    modal.showModal();
  }
  function close() { mMedia.innerHTML = ""; modal.close(); }
  document.getElementById("m-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  modal.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
})();
