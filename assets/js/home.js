"use strict";

document.documentElement.classList.add("js");

const analyticsElements = document.querySelectorAll("[data-analytics-event]");
const sendAnalyticsEvent = (element) => {
  if (typeof window.gtag !== "function") return;
  const eventName = element.dataset.analyticsEvent;
  const parameters = {};
  [...element.attributes].forEach((attribute) => {
    const prefix = "data-analytics-";
    if (!attribute.name.startsWith(prefix) || attribute.name === `${prefix}event`) return;
    parameters[attribute.name.slice(prefix.length).replaceAll("-", "_")] = attribute.value;
  });
  window.gtag("event", eventName, parameters);
};
analyticsElements.forEach((element) => element.addEventListener("click", () => sendAnalyticsEvent(element)));

const header = document.querySelector("[data-header]");
const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const closeMenu = () => {
  if (!menuButton || !mobileMenu) return;
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
};
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  mobileMenu?.classList.toggle("is-open", !open);
  mobileMenu?.setAttribute("aria-hidden", String(open));
  document.body.classList.toggle("menu-open", !open);
  if (typeof window.gtag === "function" && !open) window.gtag("event", "mobile_menu_open", { page_type: "home" });
});
mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const fab = document.querySelector("[data-contact-fab]");
const fabButton = document.querySelector("[data-contact-fab-button]");
const setFab = (open) => {
  fab?.classList.toggle("is-open", open);
  fabButton?.setAttribute("aria-expanded", String(open));
};
fabButton?.addEventListener("click", () => {
  const open = fabButton.getAttribute("aria-expanded") === "true";
  setFab(!open);
  if (!open && typeof window.gtag === "function") window.gtag("event", "contact_fab_open", { page_type: "home", page_language: document.documentElement.lang });
});
document.addEventListener("click", (event) => {
  if (fab && !fab.contains(event.target)) setFab(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { setFab(false); closeMenu(); }
});

const projectTrack = document.querySelector("[data-project-track]");
document.querySelectorAll("[data-carousel-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!projectTrack) return;
    const direction = Number(button.dataset.carouselDirection || 1);
    projectTrack.scrollBy({ left: projectTrack.clientWidth * .78 * direction, behavior: "smooth" });
    if (typeof window.gtag === "function") window.gtag("event", "portfolio_carousel_click", { direction: direction > 0 ? "next" : "previous", page_language: document.documentElement.lang });
  });
});

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: .12 });
  reveals.forEach((element) => revealObserver.observe(element));
} else reveals.forEach((element) => element.classList.add("is-visible"));

const sections = document.querySelectorAll("[data-section-name]");
if ("IntersectionObserver" in window && typeof window.gtag === "function") {
  const seen = new Set();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !seen.has(entry.target)) {
        seen.add(entry.target);
        window.gtag("event", "section_view", { section_name: entry.target.dataset.sectionName, page_type: "home", page_language: document.documentElement.lang });
      }
    });
  }, { threshold: .45 });
  sections.forEach((section) => sectionObserver.observe(section));
}

const scrollMarks = [25, 50, 75, 90];
const firedMarks = new Set();
let ticking = false;
const trackScrollDepth = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  const depth = Math.round((window.scrollY / max) * 100);
  scrollMarks.forEach((mark) => {
    if (depth >= mark && !firedMarks.has(mark)) {
      firedMarks.add(mark);
      if (typeof window.gtag === "function") window.gtag("event", "scroll_depth", { percent: mark, page_type: "home", page_language: document.documentElement.lang });
    }
  });
  ticking = false;
};
window.addEventListener("scroll", () => {
  if (!ticking) { window.requestAnimationFrame(trackScrollDepth); ticking = true; }
}, { passive: true });

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
