'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
const form = document.getElementById('lead-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.getElementById('form-message');
  if (!form.reportValidity()) { status.textContent = 'Confira os campos obrigatórios antes de continuar.'; return; }
  const data = new FormData(form);
  const clean = (key) => String(data.get(key) || '').trim().replace(/[\r\n]+/g, ' ').slice(0,120);
  const lines = [
    'Olá! Conheci o Método Vagas Cheias pela landing page da MateGrowth.',
    '',
    'Meu nome: ' + clean('nome'),
    'Daycare: ' + clean('daycare'),
    'Cidade/estado: ' + clean('cidade'),
    'Tipo: ' + clean('tipo'),
    'Vagas abertas: ' + clean('vagas'),
    'Quando quero começar: ' + clean('inicio'),
    '',
    'Gostaria de conversar sobre a implantação e a gestão semanal.'
  ];
  const url = 'https://wa.me/17746156579?text=' + encodeURIComponent(lines.join('\n'));
  status.textContent = 'Mensagem preparada. Confirme o envio no WhatsApp para entrar em contato.';
  window.location.href = url;
});
