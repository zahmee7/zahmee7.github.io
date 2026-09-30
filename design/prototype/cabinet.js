/* Cabinet prototype. Phase 1 rebuilds it in Astro.
   Opening a project replaces the page: the paper file covers the whole screen, like entering a new page.
   Style 1 (the page pulled up) is the approved motion. Styles 2 and 3 are kept only for comparison (?motion=2, ?motion=3).
   Query options: ?lang=en, ?slow=5 (slow motion), ?reduce=1 (reduced-motion path), ?touch=1 and ?bar=0 (used by view.html). */

const { gsap, CustomEase } = window;
gsap.registerPlugin(CustomEase);
CustomEase.create("paper", "0.2,0.7,0.2,1");
CustomEase.create("settle", "0.3,1.35,0.5,1");
CustomEase.create("paperIn", "0.4,0,0.8,0.3");
CustomEase.create("paperInOut", "0.65,0,0.35,1");

const q = new URLSearchParams(location.search);
const root = document.documentElement;
const lang = root.lang;
const slow = Math.max(1, Number(q.get("slow")) || 1);
gsap.globalTimeline.timeScale(1 / slow);
const MOTION = ["1", "2", "3"].includes(q.get("motion")) ? q.get("motion") : "1";

const reduced = () => root.classList.contains("force-reduce") || matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = () => matchMedia("(max-width: 899px)").matches;
const hoverable = () => q.get("touch") !== "1" && matchMedia("(hover: hover)").matches;
const toDigits = (s) => (lang === "ar" ? String(s).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]) : String(s));
const pad = (n) => toDigits(String(n).padStart(2, "0"));
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/* Motion values, seconds */
const T = { lift: 0.22, content: 0.45, stagger: 0.07, fade: 0.15 };

/* ---------- Content ---------- */
const [projects, site] = await Promise.all([
  fetch("../../content/projects.json").then((r) => r.json()),
  fetch("../../content/site.json").then((r) => r.json()),
]);
const t = site[lang];
const other = lang === "ar" ? "en" : "ar";
const list = [...projects].sort((a, b) => a.order - b.order);
const openList = list.filter((p) => p.mvp);
const byId = Object.fromEntries(list.map((p) => [p.id, p]));
const get = (path) => path.split(".").reduce((o, k) => o?.[k], t);

/* Prototype-only line for buttons whose target is built in a later phase */
const LATER = lang === "ar" ? "هذا الجزء يُبنى في مرحلة لاحقة." : "This part is built in a later phase.";

document.title = t.meta.title;
$$("[data-t]").forEach((el) => { el.textContent = get(el.dataset.t); });
$("#nav-card").href = site.links.card;
const langLink = $("#nav-lang");
const otherUrl = new URL(location.href); otherUrl.searchParams.set("lang", other);
langLink.href = otherUrl.pathname + otherUrl.search;
langLink.textContent = t.nav.langShort;
langLink.lang = other; langLink.hreflang = other;
langLink.setAttribute("aria-label", t.nav.langLabel);
$("#nav").setAttribute("aria-label", t.name);
$("#closing-card").href = site.links.card;
$("#drawer").setAttribute("aria-label", t.drawer.label);
$("#hint").textContent = hoverable() ? t.drawer.hint : t.drawer.hintTouch;
$(".film__play").setAttribute("aria-label", t.file.playFilm);
$(".film__tiles").innerHTML = Array.from({ length: 14 }, (_, i) => `<i class="film__tile" style="--t:${i % 7 + Math.floor(i / 7)}"></i>`).join("");

/* ---------- Drawer ---------- */
$("#stack").innerHTML = list.map((p, i) => {
  const c = p[lang];
  const locked = !p.mvp;
  return `<li class="folder" data-id="${p.id}" ${locked ? "data-locked" : ""} style="--i:${i}; --slot:${i}; --tone:${p.tone}">
    <div class="folder__sheet">
      <button class="folder__tab" type="button" id="tab-${p.id}" aria-describedby="desc-${p.id}"
        ${locked ? 'aria-disabled="true"' : 'aria-controls="file" aria-expanded="false" aria-haspopup="dialog"'}>
        <span class="folder__num">${pad(p.order)}</span><span class="folder__short">${c.short}</span>${locked ? '<svg class="folder__lock" aria-hidden="true"><use href="#i-lock"/></svg>' : ""}
      </button>
      <p class="sr-only" id="desc-${p.id}">${c.title}. ${locked ? t.drawer.locked : c.summary}</p>
      ${locked ? `<span class="stamp" aria-hidden="true">${t.drawer.locked}</span>` : ""}
    </div>
  </li>`;
}).join("");

const drawer = $("#drawer");
const hint = $("#hint");
const caption = $("#caption");
const showCaption = (folder) => {
  if (current) return;
  const p = byId[folder.dataset.id]; const c = p[lang];
  $(".drawer__caption-title", caption).textContent = c.title;
  $(".drawer__caption-text", caption).textContent = p.mvp ? c.summary : t.drawer.locked;
  hint.hidden = true; caption.hidden = false;
};
const hideCaption = () => { hint.hidden = false; caption.hidden = true; };

$$(".folder").forEach((folder) => {
  folder.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") showCaption(folder); });
  folder.addEventListener("pointerleave", hideCaption);
  folder.addEventListener("focusin", () => showCaption(folder));
  folder.addEventListener("focusout", hideCaption);
  // The whole folder face acts as the tab
  $(".folder__sheet", folder).addEventListener("click", (e) => {
    if (folder.hasAttribute("data-locked")) { toast(t.drawer.locked); return; }
    e.preventDefault();
    openFile(folder);
  });
});

/* ---------- Toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-proto]");
  if (!el) return;
  e.preventDefault();
  toast(LATER);
});

/* ---------- The open file (a full page) ---------- */
const dialog = $("#file");
const leaf = $(".leaf");
const lid = $(".lid");
const grow = $(".grow");
const heading = $("#file-title");
const risers = () => $$("[data-rise]", dialog);

let current = null;   // { folder, p }
let busy = false;
let pendingClose = false;

function fill(p) {
  const c = p[lang];
  const index = list.indexOf(p) + 1;
  $(".leaf__folio").textContent = `${t.hero.kicker} · ${pad(index)} / ${pad(list.length)}`;
  $(".file__tag").textContent = c.tag;
  heading.textContent = c.title;
  $(".story").innerHTML = ["context", "did", "result"].map((k, i) => `
    <section class="story__block" data-rise>
      <h3 class="story__label">${t.file.story[i]}</h3>
      <p class="story__text">${c[k]}</p>
    </section>`).join("");
  $("#demo-btn span").textContent = c.demoLabel;
  $(".download__label").textContent = c.downloadLabel;
  $(".download__kind").textContent = (p.downloads[0]?.kind || "").toUpperCase();
  $(".lid__kicker").textContent = t.hero.kicker;
  $(".lid__num").textContent = pad(p.order);
  $(".lid__title").textContent = c.title;
  $(".lid__name").textContent = `${t.name} · ${t.role}`;
  dialog.style.setProperty("--cover-tone", p.tone);
  const k = openList.indexOf(p);
  setDisabled($("#prev"), k <= 0);
  setDisabled($("#next"), k >= openList.length - 1);
}
function setDisabled(btn, off) {
  if (off) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled");
}

const focusTitle = () => heading.focus({ preventScroll: true });
const sheetOf = (folder) => $(".folder__sheet", folder);
/* The part of the folder that shows above the drawer front, lifted, as a transform from the full screen */
function folderBox(folder, lift) {
  const s = sheetOf(folder).getBoundingClientRect();
  const top = s.top - lift;
  const frontTop = $(".drawer__front").getBoundingClientRect().top;
  const h = Math.max(44, frontTop - top);
  return { x: s.left, y: top, scaleX: s.width / innerWidth, scaleY: h / innerHeight };
}
function sizeGrow() {
  Object.assign(grow.style, { width: `${innerWidth}px`, height: `${innerHeight}px` });
}

const STYLES = {
  /* 1 · The page is pulled up from the bottom of the screen and covers the cabinet */
  1: {
    open(folder) {
      gsap.set(leaf, { y: innerHeight });
      gsap.timeline({ onComplete: opened })
        .to(sheetOf(folder), { y: -14, duration: 0.16, ease: "paper" }, 0)
        .to(sheetOf(folder), { y: 0, duration: 0.3, ease: "paper" }, 0.16)
        .to(leaf, { y: 0, duration: 0.72, ease: "paper" }, 0.1)
        .to(risers(), { autoAlpha: 1, y: 0, duration: T.content, ease: "paper", stagger: T.stagger }, 0.5)
        .add(focusTitle, 0.82);
    },
    close(folder, done) {
      gsap.timeline({ onComplete: done })
        .to(leaf, { y: innerHeight, duration: 0.5, ease: "paperIn" }, 0);
    },
  },

  /* 2 · The closed file is pulled up with its cover on, then the cover lifts away */
  2: {
    open(folder) {
      gsap.set(lid, { autoAlpha: 1, rotationX: 0, transformOrigin: "50% 0%", transformPerspective: mobile() ? 1400 : 2600 });
      gsap.set(leaf, { y: innerHeight });
      gsap.timeline({ onComplete: opened })
        .to(sheetOf(folder), { y: -14, duration: 0.16, ease: "paper" }, 0)
        .to(sheetOf(folder), { y: 0, duration: 0.3, ease: "paper" }, 0.16)
        .to(leaf, { y: 0, duration: 0.68, ease: "paper" }, 0.1)
        .to(lid, { rotationX: -180, duration: 0.75, ease: "paperInOut" }, 0.9)   // lifts up and away
        .to(risers(), { autoAlpha: 1, y: 0, duration: T.content, ease: "paper", stagger: T.stagger }, 1.2)
        .set(lid, { autoAlpha: 0 }, 1.65)
        .add(focusTitle, 1.6);
    },
    close(folder, done) {
      gsap.set(lid, { autoAlpha: 1, rotationX: -180, transformOrigin: "50% 0%", transformPerspective: mobile() ? 1400 : 2600 });
      gsap.timeline({ onComplete: done })
        .to(risers(), { autoAlpha: 0, duration: T.fade }, 0)
        .to(lid, { rotationX: 0, duration: 0.55, ease: "paperInOut" }, 0.05)
        .to(leaf, { y: innerHeight, duration: 0.5, ease: "paperIn" }, 0.62);
    },
  },

  /* 3 · The folder rises out of the drawer and grows until it is the whole page */
  3: {
    open(folder) {
      const lift = mobile() ? 14 : 24;
      sizeGrow();
      gsap.set(grow, { autoAlpha: 0, transformOrigin: "0 0", ...folderBox(folder, lift) });
      gsap.set(leaf, { autoAlpha: 0 });
      gsap.timeline({ onComplete: opened })
        .to(sheetOf(folder), { y: -lift, duration: T.lift, ease: "settle" }, 0)
        .set(grow, { autoAlpha: 1 }, T.lift)
        .to(grow, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.66, ease: "paperInOut" }, T.lift)
        .set(sheetOf(folder), { y: 0 }, T.lift + 0.1)
        .to(leaf, { autoAlpha: 1, duration: 0.24, ease: "paper" }, T.lift + 0.6)
        .set(grow, { autoAlpha: 0 }, T.lift + 0.9)
        .to(risers(), { autoAlpha: 1, y: 0, duration: T.content, ease: "paper", stagger: T.stagger }, T.lift + 0.66)
        .add(focusTitle, T.lift + 0.95);
    },
    close(folder, done) {
      const lift = mobile() ? 14 : 24;
      const box = folderBox(folder, lift);
      sizeGrow();
      gsap.set(grow, { autoAlpha: 1, transformOrigin: "0 0", x: 0, y: 0, scaleX: 1, scaleY: 1 });
      gsap.timeline({ onComplete: done })
        .to(risers(), { autoAlpha: 0, duration: T.fade }, 0)
        .to(leaf, { autoAlpha: 0, duration: 0.2 }, 0.1)
        .set(sheetOf(folder), { y: -lift }, 0.3)
        .to(grow, { ...box, duration: 0.56, ease: "paperInOut" }, 0.3)
        .set(grow, { autoAlpha: 0 }, 0.86)
        .to(sheetOf(folder), { y: 0, duration: T.lift, ease: "paper" }, 0.86);
    },
  },
};

function openFile(folder) {
  if (busy || current) return;
  const p = byId[folder.dataset.id];
  busy = true;
  hideCaption();
  fill(p);
  current = { folder, p };
  $(".folder__tab", folder).setAttribute("aria-expanded", "true");
  history.pushState({ file: p.id }, "");

  gsap.set(risers(), { autoAlpha: 0, y: 14 });
  gsap.set([lid, grow], { autoAlpha: 0 });
  gsap.set(leaf, { clearProps: "transform", autoAlpha: 1 });
  dialog.showModal();
  dialog.scrollTop = 0;
  drawer.dataset.open = ""; folder.dataset.active = "";

  if (reduced()) {
    gsap.set(risers(), { autoAlpha: 1, y: 0 });
    gsap.fromTo(leaf, { autoAlpha: 0 }, { autoAlpha: 1, duration: T.fade, onComplete: () => { focusTitle(); opened(); } });
    return;
  }
  STYLES[MOTION].open(folder);
}

function opened() {
  busy = false;
  if (pendingClose) { pendingClose = false; closeFile(); }
}

function finishClose(folder) {
  dialog.close();
  gsap.set(leaf, { clearProps: "transform", autoAlpha: 1 });
  gsap.set([lid, grow], { autoAlpha: 0 });
  delete drawer.dataset.open; delete folder.dataset.active;
  const tab = $(".folder__tab", folder);
  tab.setAttribute("aria-expanded", "false");
  tab.focus({ preventScroll: true });
  current = null; busy = false;
}

function closeFile() {
  if (!current) return;
  if (busy) { pendingClose = true; return; }
  busy = true;
  const { folder } = current;
  const done = () => finishClose(folder);
  if (reduced()) { gsap.to(leaf, { autoAlpha: 0, duration: T.fade, onComplete: done }); return; }
  dialog.scrollTop = 0;
  STYLES[MOTION].close(folder, done);
}

/* Close from the UI goes through history, so the browser and Android back gesture behave the same */
function requestClose() {
  if (history.state?.file) history.back(); else closeFile();
}
addEventListener("popstate", () => { if (current) closeFile(); });
$("#close").addEventListener("click", requestClose);
dialog.addEventListener("cancel", (e) => { e.preventDefault(); requestClose(); });

/* Previous / next inside the open file */
function go(step) {
  if (!current || busy) return;
  const k = openList.indexOf(current.p) + step;
  if (k < 0 || k >= openList.length) return;
  const p = openList[k];
  const folder = $(`.folder[data-id="${p.id}"]`);
  busy = true;
  gsap.to(risers(), {
    autoAlpha: 0, y: -6, duration: T.fade,
    onComplete: () => {
      delete current.folder.dataset.active;
      $(".folder__tab", current.folder).setAttribute("aria-expanded", "false");
      folder.dataset.active = "";
      $(".folder__tab", folder).setAttribute("aria-expanded", "true");
      current = { folder, p };
      fill(p);
      history.replaceState({ file: p.id }, "");
      dialog.scrollTop = 0;
      gsap.fromTo(risers(), { autoAlpha: 0, y: 14 }, {
        autoAlpha: 1, y: 0, duration: T.content, ease: "paper", stagger: T.stagger / 2,
        onComplete: () => { focusTitle(); opened(); },   // opened() also runs a close that was asked for meanwhile
      });
    },
  });
}
$("#prev").addEventListener("click", (e) => { if (!e.currentTarget.hasAttribute("aria-disabled")) go(-1); });
$("#next").addEventListener("click", (e) => { if (!e.currentTarget.hasAttribute("aria-disabled")) go(1); });

/* ---------- Entrance ---------- */
if (root.classList.contains("is-entering")) setTimeout(() => root.classList.remove("is-entering"), 1800);

/* ---------- Prototype toolbar (hidden with ?bar=0, view.html has its own) ---------- */
if (q.get("bar") === "0") $(".proto-bar").style.display = "none";
if (q.get("touch") === "1") { root.style.scrollbarWidth = "none"; root.style.scrollbarGutter = "auto"; dialog.style.scrollbarWidth = "none"; }   // phones use overlay scrollbars
const link = (params) => {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries(params)) (v == null ? u.searchParams.delete(k) : u.searchParams.set(k, v));
  return u.pathname + u.search;
};
const pbLang = $("#pb-lang"); pbLang.href = link({ lang: other }); pbLang.textContent = lang === "ar" ? "English" : "العربية";
const pbSlow = $("#pb-slow"); pbSlow.href = link({ slow: slow > 1 ? null : 5 }); pbSlow.textContent = slow > 1 ? "سرعة عادية" : "حركة بطيئة"; pbSlow.setAttribute("aria-pressed", String(slow > 1));
const isForced = root.classList.contains("force-reduce");
const pbReduce = $("#pb-reduce"); pbReduce.href = link({ reduce: isForced ? null : 1 }); pbReduce.textContent = "تقليل الحركة"; pbReduce.setAttribute("aria-pressed", String(isForced));
$("#pb-view").href = `view.html?device=desktop&motion=${MOTION}&lang=${lang}`;
$$("[data-motion]").forEach((a) => {
  a.href = link({ motion: a.dataset.motion });
  a.setAttribute("aria-pressed", String(a.dataset.motion === MOTION));
});
$("#pb-replay").addEventListener("click", () => { try { sessionStorage.removeItem("entered"); } catch (e) {} location.reload(); });
