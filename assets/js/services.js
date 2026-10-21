'use strict';

const fab = document.querySelector('.contact-fab');
const button = document.querySelector('.fab-button');
if (fab && button) {
  button.addEventListener('click', () => fab.classList.toggle('open'));
}
