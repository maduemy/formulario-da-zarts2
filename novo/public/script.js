const ZARTS = {
  whatsapp: "5588996792440",
  apiUrl: "/api/pedido", // se o servidor ficar em outro domínio: "https://seu-servidor.com/api/pedido"
  instagram: "",
  mensagemPadrao: "Olá! Vim pelo site da Zart's e gostaria de mais informações."
};
(function () {
  "use strict";
  const root = document.documentElement;
  const themeButtons = document.querySelectorAll("[data-theme-toggle]");
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeButtons.forEach(function (btn) {
      btn.setAttribute("aria-label", theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro");
      btn.setAttribute("title", theme === "dark" ? "Modo claro" : "Modo escuro");
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0a0c" : "#fafafa");
  }
  applyTheme(root.getAttribute("data-theme") || "dark");
  themeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("zarts-theme", next); } catch (e) {}
    });
  });
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");
  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }
  const header = document.querySelector(".cabeca");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
    const top = document.querySelector(".back-top-fab");
    if (top) top.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const sectionLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  if ("IntersectionObserver" in window && sectionLinks.length) {
    const map = new Map();
    sectionLinks.forEach(function (a) {
      const sec = document.querySelector(a.getAttribute("href"));
      if (sec) map.set(sec, a);
    });
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          sectionLinks.forEach(function (l) { l.classList.remove("active"); });
          const link = map.get(en.target);
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach(function (_, sec) { spy.observe(sec); });
  }
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }
  document.querySelectorAll("[data-whats]").forEach(function (a) {
    const msg = a.getAttribute("data-whats") || ZARTS.mensagemPadrao;
    a.href = "https://wa.me/" + ZARTS.whatsapp + "?text=" + encodeURIComponent(msg);
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("[data-social='instagram']").forEach(function (a) {
    if (ZARTS.instagram) {
      if (a.tagName === "A") { a.href = ZARTS.instagram; a.target = "_blank"; a.rel = "noopener"; }
    } else {
      a.hidden = true;
    }
  });
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();