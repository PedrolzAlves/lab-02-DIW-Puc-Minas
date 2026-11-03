// Pacote CONTROLLER — CRUD de clientes
// Agentes gerenciam todos os clientes; o cliente gerencia apenas o próprio cadastro.

import { api } from '../service/api.js';
import { auth } from '../service/auth.js';
import { Cliente } from '../model/entidades.js';
import { renderNavbar, mostrarAlerta, escapar, formatar, linhaVazia } from '../view/ui.js';
import { montarFormCliente, lerFormCliente } from '../view/clienteForm.js';

const usuario = auth.exigir();
const ehAgente = usuario?.perfil === 'agente';

const tabela = document.querySelector('#tabela');
const form = document.querySelector('#form-cliente');
const modal = new bootstrap.Modal('#modal-cliente');
let clientes = [];
let editandoId = null;

if (usuario) iniciar();

function iniciar() {
  renderNavbar(usuario, 'clientes.html');

  if (ehAgente) {
    const btnNovo = document.querySelector('#btn-novo');
    btnNovo.classList.remove('d-none');
    btnNovo.addEventListener('click', () => abrirModal());
  } else {
    document.querySelector('#titulo').textContent = 'Meu cadastro';
    document.querySelector('#subtitulo').textContent = 'Seus dados de identificação e rendimentos.';
  }

  form.addEventListener('submit', salvar);
  tabela.addEventListener('click', tratarAcao);
  carregar();
}

async function carregar() {
  try {
    const dados = ehAgente ? await api.listar('clientes') : [await api.buscar('clientes', usuario.id)];
    clientes = dados.map((c) => new Cliente(c));
    renderTabela();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

function renderTabela() {
  if (!clientes.length) {
    tabela.innerHTML = linhaVazia(5, 'Nenhum cliente cadastrado.');
    return;
  }
  tabela.innerHTML = clientes.map((c) => `
    <tr>
      <td>
        <div class="fw-semibold">${escapar(c.nome)}</div>
        <div class="small text-secondary">${escapar(c.endereco)}</div>
      </td>
      <td>${formatar.cpf(c.cpf)}</td>
      <td>${escapar(c.profissao) || '—'}</td>
      <td>${formatar.moeda(c.rendaTotal)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-dark" data-acao="editar" data-id="${c.id}">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${c.id}">Excluir</button>
      </td>
    </tr>`).join('');
}

function abrirModal(cliente = null) {
  editandoId = cliente?.id ?? null;
  document.querySelector('#modal-titulo').textContent = cliente ? 'Editar cliente' : 'Novo cliente';
  document.querySelector('#erros-form').innerHTML = '';
  montarFormCliente(form.querySelector('[data-campos]'), cliente ?? {});
  modal.show();
}

async function tratarAcao(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const cliente = clientes.find((c) => String(c.id) === botao.dataset.id);

  if (botao.dataset.acao === 'editar') return abrirModal(cliente);

  const proprio = !ehAgente;
  const pergunta = proprio
    ? 'Excluir sua conta? Seus pedidos também serão removidos.'
    : `Excluir o cliente "${cliente.nome}" e seus pedidos?`;
  if (!confirm(pergunta)) return;

  try {
    await api.remover('clientes', cliente.id);
    if (proprio) return auth.sair();
    mostrarAlerta('Cliente excluído.');
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

async function salvar(evento) {
  evento.preventDefault();
  const cliente = lerFormCliente(form);
  const erros = cliente.validar();

  try {
    if (cliente.login && (await auth.loginEmUso(cliente.login, editandoId))) erros.push('Este login já está em uso.');
    if (erros.length) return mostrarAlerta(erros, 'danger', '#erros-form');

    if (editandoId) await api.atualizar('clientes', editandoId, cliente);
    else await api.criar('clientes', cliente);

    // Atualiza a sessão caso o cliente tenha editado o próprio cadastro
    if (!ehAgente) await auth.entrar(cliente.login, cliente.senha);

    modal.hide();
    mostrarAlerta(editandoId ? 'Cliente atualizado.' : 'Cliente cadastrado.');
    if (!ehAgente) renderNavbar(auth.usuario(), 'clientes.html');
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger', '#erros-form');
  }
}
