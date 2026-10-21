"use strict";

document.documentElement.classList.add("js");

const projectTrack = document.querySelector("[data-project-track]");
document.querySelectorAll("[data-carousel-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!projectTrack) return;
    const direction = Number(button.dataset.carouselDirection || 1);
    projectTrack.scrollBy({ left: projectTrack.clientWidth * .78 * direction, behavior: "smooth" });
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


const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
