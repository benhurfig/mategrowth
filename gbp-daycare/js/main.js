"use strict";

const analyticsElements = document.querySelectorAll("[data-analytics-event]");

const sendAnalyticsEvent = (element) => {
  if (typeof window.gtag !== "function") {
    return;
  }

  const eventName = element.dataset.analyticsEvent;
  const parameters = {};

  [...element.attributes].forEach((attribute) => {
    const prefix = "data-analytics-";

    if (!attribute.name.startsWith(prefix) || attribute.name === `${prefix}event`) {
      return;
    }

    const parameterName = attribute.name
      .slice(prefix.length)
      .replaceAll("-", "_");

    parameters[parameterName] = attribute.value;
  });

  window.gtag("event", eventName, parameters);
};

analyticsElements.forEach((element) => {
  element.addEventListener("click", () => sendAnalyticsEvent(element));
});

const faqAccordion = document.querySelector("[data-faq-accordion]");

if (faqAccordion) {
  const faqButtons = [...faqAccordion.querySelectorAll(".faq-item__question")];

  const setFaqState = (button, isOpen) => {
    const answer = document.getElementById(button.getAttribute("aria-controls"));

    if (!answer) {
      return;
    }

    button.setAttribute("aria-expanded", String(isOpen));
    answer.hidden = !isOpen;
  };

  faqAccordion.classList.add("faq__accordion--enhanced");

  faqButtons.forEach((button, index) => {
    setFaqState(button, index === 0);

    button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("aria-expanded") !== "true";

      faqButtons.forEach((item) => setFaqState(item, false));

      if (shouldOpen) {
        setFaqState(button, true);
      }
    });

    button.addEventListener("keydown", (event) => {
      let nextIndex;

      if (event.key === "ArrowDown") {
        nextIndex = (index + 1) % faqButtons.length;
      } else if (event.key === "ArrowUp") {
        nextIndex = (index - 1 + faqButtons.length) % faqButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = faqButtons.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      faqButtons[nextIndex].focus();
    });
  });
}

const currentYear = document.querySelector("[data-current-year]");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

document.documentElement.classList.add("js");
