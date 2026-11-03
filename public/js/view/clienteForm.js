// Pacote VIEW — formulário de cliente (reutilizado no cadastro e no CRUD)

import { Cliente } from '../model/entidades.js';
import { escapar } from './ui.js';

export function montarFormCliente(container, cliente = {}) {
  const campo = (nome, rotulo, tipo = 'text', col = 'col-md-6') => `
    <div class="${col}">
      <label class="form-label" for="f-${nome}">${rotulo}</label>
      <input class="form-control" id="f-${nome}" name="${nome}" type="${tipo}" value="${escapar(cliente[nome])}" required>
    </div>`;

  container.innerHTML = `
    <div class="row g-3">
      ${campo('nome', 'Nome completo', 'text', 'col-12')}
      ${campo('rg', 'RG')}
      ${campo('cpf', 'CPF (somente números)')}
      ${campo('endereco', 'Endereço', 'text', 'col-12')}
      ${campo('profissao', 'Profissão', 'text', 'col-12')}
      ${campo('login', 'Login')}
      ${campo('senha', 'Senha', 'password')}
    </div>

    <div class="d-flex justify-content-between align-items-center mt-4 mb-2">
      <span class="form-label mb-0">Rendimentos <small class="text-secondary">(máx. ${Cliente.MAX_RENDIMENTOS})</small></span>
      <button type="button" class="btn btn-sm btn-outline-dark" data-add-rendimento>Adicionar</button>
    </div>
    <div data-rendimentos></div>`;

  const lista = container.querySelector('[data-rendimentos]');
  const btnAdicionar = container.querySelector('[data-add-rendimento]');
  const atualizarBotao = () => {
    btnAdicionar.disabled = lista.children.length >= Cliente.MAX_RENDIMENTOS;
  };

  const adicionarLinha = (r = {}) => {
    const linha = document.createElement('div');
    linha.className = 'row g-2 mb-2 align-items-center';
    linha.innerHTML = `
      <div class="col-7"><input class="form-control" placeholder="Entidade empregadora" data-entidade value="${escapar(r.entidade)}" required></div>
      <div class="col-4"><input class="form-control" type="number" min="0" step="0.01" placeholder="R$" data-valor value="${escapar(r.valor)}" required></div>
      <div class="col-1 text-end"><button type="button" class="btn-close" aria-label="Remover"></button></div>`;
    linha.querySelector('.btn-close').addEventListener('click', () => {
      linha.remove();
      atualizarBotao();
    });
    lista.append(linha);
    atualizarBotao();
  };

  btnAdicionar.addEventListener('click', () => adicionarLinha());
  (cliente.rendimentos ?? []).forEach(adicionarLinha);
}

export function lerFormCliente(container) {
  const valor = (nome) => container.querySelector(`[name="${nome}"]`).value.trim();
  const rendimentos = [...container.querySelectorAll('[data-rendimentos] > div')].map((linha) => ({
    entidade: linha.querySelector('[data-entidade]').value.trim(),
    valor: linha.querySelector('[data-valor]').value,
  }));

  return new Cliente({
    nome: valor('nome'),
    rg: valor('rg'),
    cpf: valor('cpf'),
    endereco: valor('endereco'),
    profissao: valor('profissao'),
    login: valor('login'),
    senha: valor('senha'),
    rendimentos,
  });
}
