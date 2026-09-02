"use strict";

const whatsappCtas = document.querySelectorAll("[data-whatsapp-cta]");

whatsappCtas.forEach((whatsappCta) => {
  const whatsappNumber = whatsappCta.dataset.whatsappNumber.replace(/\D/g, "");
  const whatsappMessage = whatsappCta.dataset.whatsappMessage || "";
  const hasValidWhatsappNumber = /^\d{10,15}$/.test(whatsappNumber);

  if (hasValidWhatsappNumber) {
    whatsappCta.disabled = false;
    whatsappCta.addEventListener("click", () => {
      const whatsappUrl = new URL(`https://wa.me/${whatsappNumber}`);
      whatsappUrl.searchParams.set("text", whatsappMessage);
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    });
  }
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
