// Pacote VIEW — construção dinâmica das páginas (componentes reutilizáveis)

import { auth } from '../service/auth.js';

export function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export const formatar = {
  moeda: (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  data: (iso) => (iso ? iso.split('-').reverse().join('/') : '—'),
  cpf: (c) => String(c).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
};

export function badgeStatus(status) {
  return `<span class="status status-${escapar(status).toLowerCase()}">${escapar(status)}</span>`;
}

export function renderNavbar(usuario, paginaAtiva) {
  const links = usuario.perfil === 'agente'
    ? [['pedidos.html', 'Pedidos'], ['clientes.html', 'Clientes'], ['automoveis.html', 'Automóveis']]
    : [['pedidos.html', 'Meus pedidos'], ['clientes.html', 'Meu cadastro']];

  const perfil = usuario.perfil === 'agente' ? (usuario.tipo === 'banco' ? 'Banco' : 'Empresa') : 'Cliente';

  document.querySelector('#navbar').innerHTML = `
    <nav class="navbar navbar-expand-md bg-white border-bottom">
      <div class="container">
        <a class="navbar-brand" href="pedidos.html">Aluga<span class="text-accent">Car</span></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menu">
          <ul class="navbar-nav me-auto">
            ${links.map(([href, texto]) => `
              <li class="nav-item">
                <a class="nav-link ${href === paginaAtiva ? 'active' : ''}" href="${href}">${texto}</a>
              </li>`).join('')}
          </ul>
          <div class="d-flex align-items-center gap-3">
            <span class="small text-secondary">${escapar(usuario.nome)} · ${perfil}</span>
            <button class="btn btn-sm btn-outline-dark" id="btn-sair">Sair</button>
          </div>
        </div>
      </div>
    </nav>`;

  document.querySelector('#btn-sair').addEventListener('click', () => auth.sair());
}

export function mostrarAlerta(mensagem, tipo = 'success', alvo = '#alertas') {
  const area = document.querySelector(alvo);
  const mensagens = Array.isArray(mensagem) ? mensagem : [mensagem];
  area.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${mensagens.map(escapar).join('<br>')}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>`;
  if (tipo === 'success') setTimeout(() => area.querySelector('.alert')?.remove(), 3000);
}

export function linhaVazia(colunas, texto) {
  return `<tr><td colspan="${colunas}" class="text-center text-secondary py-5">${texto}</td></tr>`;
}
