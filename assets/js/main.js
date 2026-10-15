/* =========================================================
   Nordbau Projektentwicklung – Effekte & Bedienung
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js", "ready");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Intro-Vorhang (nur beim ersten Seitenaufruf) ---------- */
  var seenIntro = false;
  try {
    seenIntro = sessionStorage.getItem("nb-intro") === "1";
    sessionStorage.setItem("nb-intro", "1");
  } catch (e) { /* privater Modus o. Ä. – Intro trotzdem zeigen */ }

  function finishIntro() { root.classList.add("loaded"); }
  if (seenIntro || reduceMotion) {
    root.classList.add("no-loader");
    finishIntro();
  } else {
    var introDone = false;
    var go = function () {
      if (introDone) return;
      introDone = true;
      setTimeout(finishIntro, 700);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go);
    setTimeout(go, 1800); // spätestens dann weiter, auch wenn Bilder noch laden
  }

  /* ---------- Header: Hintergrund beim Scrollen, ausblenden beim Runterscrollen ---------- */
  var header = document.querySelector("[data-header]");
  var lastY = window.scrollY;
  function updateHeader() {
    var y = window.scrollY;
    if (!header) return;
    header.classList.toggle("is-scrolled", y > 24);
    if (!document.body.classList.contains("menu-open")) {
      header.classList.toggle("is-hidden", y > lastY && y > 480);
    }
    lastY = y;
  }

  /* ---------- Mobiles Menü ---------- */
  var burger = document.querySelector("[data-burger]");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    if (open) menu.removeAttribute("inert"); else menu.setAttribute("inert", "");
    menu.setAttribute("aria-hidden", String(!open));
    if (header) header.classList.remove("is-hidden");
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) setMenu(false);
    });
  }
  document.querySelectorAll("[data-acc]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".m-acc");
      var open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Dropdown „Leistungen“ (Desktop, auch per Tastatur/Touch) ---------- */
  document.querySelectorAll("[data-drop]").forEach(function (btn) {
    var wrap = btn.closest(".nav-drop");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = !wrap.classList.contains("is-open");
      wrap.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setMenu(false);
    document.querySelectorAll(".nav-drop.is-open").forEach(function (w) {
      w.classList.remove("is-open");
      var b = w.querySelector("[data-drop]");
      if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); }
    });
  });

  /* ---------- Überschriften in Wörter zerlegen (für die Einblendung) ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            w.className = "w";
            var wi = document.createElement("span");
            wi.className = "wi";
            wi.style.setProperty("--i", i++);
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    })(el);
  });

  /* ---------- Gestaffelte Verzögerung für Kinder-Elemente ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (parent) {
    var step = parseInt(parent.getAttribute("data-stagger"), 10) || 90;
    Array.prototype.forEach.call(parent.children, function (child, idx) {
      child.style.setProperty("--d", idx * step + "ms");
    });
  });

  /* ---------- Einblenden beim Scrollen ---------- */
  var revealEls = document.querySelectorAll("[data-reveal], [data-split]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Hochzählende Zahlen ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 2000;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) {
      el.textContent = "0" + (el.getAttribute("data-suffix") || "");
      cio.observe(el);
    });
  }

  /* ---------- Lichtkegel, der der Maus auf Karten folgt ---------- */
  document.querySelectorAll("[data-spot]").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- Parallax & Fortschrittslinie im Ablauf ---------- */
  var parallaxEls = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var stepLists = Array.prototype.slice.call(document.querySelectorAll("[data-steps]"));
  var ticking = false;

  function onFrame() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      var offset = (r.top + r.height / 2 - vh / 2) * -speed;
      el.style.setProperty("--py", offset.toFixed(1) + "px");
    });
    stepLists.forEach(function (list) {
      var r = list.getBoundingClientRect();
      var mark = vh * 0.62;
      var p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
      list.style.setProperty("--progress", p.toFixed(3));
      list.querySelectorAll(".step").forEach(function (step) {
        step.classList.toggle("is-done", step.getBoundingClientRect().top < mark);
      });
    });
    updateHeader();
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onFrame); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", onFrame);
  onFrame();

  /* ---------- Kundenstimmen-Slider ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function (car) {
    var slides = car.querySelectorAll(".slide");
    var count = car.querySelector("[data-carousel-count]");
    var idx = 0;
    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle("is-active", k === idx);
        s.setAttribute("aria-hidden", String(k !== idx));
      });
      if (count) count.textContent = idx + 1 + " / " + slides.length;
    }
    var prev = car.querySelector("[data-prev]");
    var next = car.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    show(0);
  });

  /* ---------- Google Maps erst nach Klick laden (Datenschutz) ---------- */
  document.querySelectorAll("[data-map-load]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".map-card");
      var iframe = document.createElement("iframe");
      iframe.src = card.getAttribute("data-map-src");
      iframe.title = "Karte: Standort Nordbau Projektentwicklung";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      var consent = card.querySelector(".map-consent");
      if (consent) consent.remove();
      card.appendChild(iframe);
    });
  });

  /* ---------- Kontaktformular ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var next = form.querySelector('input[name="_next"]');
    if (next) {
      try { next.value = new URL("danke.html", window.location.href).href; } catch (e) { /* ältere Browser */ }
    }
    var fileInput = form.querySelector('input[type="file"]');
    var fileList = form.querySelector("[data-file-list]");
    var zone = form.querySelector(".dropzone");
    if (fileInput && fileList) {
      fileInput.addEventListener("change", function () {
        var names = Array.prototype.map.call(fileInput.files, function (f) { return f.name; });
        fileList.textContent = names.length ? names.join(", ") : "";
      });
    }
    if (zone) {
      ["dragenter", "dragover"].forEach(function (ev) {
        zone.addEventListener(ev, function () { zone.classList.add("is-drag"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        zone.addEventListener(ev, function () { zone.classList.remove("is-drag"); });
      });
    }
  }
})();
