// Pacote CONTROLLER — CRUD de automóveis (exclusivo dos agentes)

import { api } from '../service/api.js';
import { auth } from '../service/auth.js';
import { Automovel } from '../model/entidades.js';
import { renderNavbar, mostrarAlerta, escapar, linhaVazia } from '../view/ui.js';

const usuario = auth.exigir('agente');

const tabela = document.querySelector('#tabela');
const form = document.querySelector('#form-automovel');
const modal = new bootstrap.Modal('#modal-automovel');
let automoveis = [];
let proprietarios = [];
let editandoId = null;

if (usuario) iniciar();

function iniciar() {
  renderNavbar(usuario, 'automoveis.html');
  document.querySelector('#btn-novo').addEventListener('click', () => abrirModal());
  tabela.addEventListener('click', tratarAcao);
  form.addEventListener('submit', salvar);
  carregar();
}

async function carregar() {
  try {
    const [carros, agentes, clientes] = await Promise.all([
      api.listar('automoveis'),
      api.listar('agentes'),
      api.listar('clientes'),
    ]);
    automoveis = carros.map((a) => new Automovel(a));
    proprietarios = [
      ...agentes.map((a) => ({ tipo: a.tipo, id: a.id, nome: a.nome })),
      ...clientes.map((c) => ({ tipo: 'cliente', id: c.id, nome: c.nome })),
    ];
    renderTabela();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

function nomeProprietario(tipo, id) {
  const dono = proprietarios.find((p) => p.tipo === tipo && String(p.id) === String(id));
  return dono ? `${dono.nome} (${tipo})` : '—';
}

function renderTabela() {
  if (!automoveis.length) {
    tabela.innerHTML = linhaVazia(6, 'Nenhum automóvel cadastrado.');
    return;
  }
  tabela.innerHTML = automoveis.map((a) => `
    <tr>
      <td>${escapar(a.matricula)}</td>
      <td class="font-monospace">${escapar(a.placa)}</td>
      <td>${escapar(a.marca)} ${escapar(a.modelo)}</td>
      <td>${a.ano}</td>
      <td>${escapar(nomeProprietario(a.proprietarioTipo, a.proprietarioId))}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-dark" data-acao="editar" data-id="${a.id}">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${a.id}">Excluir</button>
      </td>
    </tr>`).join('');
}

function abrirModal(automovel = null) {
  editandoId = automovel?.id ?? null;
  document.querySelector('#modal-titulo').textContent = automovel ? 'Editar automóvel' : 'Novo automóvel';
  document.querySelector('#erros-form').innerHTML = '';

  const grupos = [['empresa', 'Empresas'], ['banco', 'Bancos'], ['cliente', 'Clientes']];
  form.proprietario.innerHTML = grupos.map(([tipo, rotulo]) => `
    <optgroup label="${rotulo}">
      ${proprietarios.filter((p) => p.tipo === tipo)
        .map((p) => `<option value="${p.tipo}:${p.id}">${escapar(p.nome)}</option>`).join('')}
    </optgroup>`).join('');

  ['matricula', 'placa', 'marca', 'modelo', 'ano'].forEach((campo) => {
    form[campo].value = automovel?.[campo] ?? '';
  });
  form.proprietario.value = automovel
    ? `${automovel.proprietarioTipo}:${automovel.proprietarioId}`
    : `${usuario.tipo}:${usuario.id}`;

  modal.show();
}

async function tratarAcao(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const automovel = automoveis.find((a) => String(a.id) === botao.dataset.id);

  if (botao.dataset.acao === 'editar') return abrirModal(automovel);
  if (!confirm(`Excluir ${automovel.descricao}?`)) return;

  try {
    await api.remover('automoveis', automovel.id);
    mostrarAlerta('Automóvel excluído.');
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

async function salvar(evento) {
  evento.preventDefault();
  const [proprietarioTipo, proprietarioId] = form.proprietario.value.split(':');
  const automovel = new Automovel({
    matricula: form.matricula.value.trim(),
    placa: form.placa.value.trim(),
    marca: form.marca.value.trim(),
    modelo: form.modelo.value.trim(),
    ano: form.ano.value,
    proprietarioTipo,
    proprietarioId: Number(proprietarioId),
  });

  const erros = automovel.validar();
  if (erros.length) return mostrarAlerta(erros, 'danger', '#erros-form');

  try {
    if (editandoId) await api.atualizar('automoveis', editandoId, automovel);
    else await api.criar('automoveis', automovel);
    modal.hide();
    mostrarAlerta(editandoId ? 'Automóvel atualizado.' : 'Automóvel cadastrado.');
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger', '#erros-form');
  }
}
