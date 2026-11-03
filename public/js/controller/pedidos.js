// Pacote CONTROLLER — gestão de pedidos e contratos
// Cliente: introduz, modifica, consulta e cancela pedidos.
// Agente (empresa/banco): modifica, avalia e executa o contrato.

import { api } from '../service/api.js';
import { auth } from '../service/auth.js';
import { Pedido, Automovel, Contrato, StatusPedido } from '../model/entidades.js';
import { renderNavbar, mostrarAlerta, escapar, formatar, badgeStatus, linhaVazia } from '../view/ui.js';

const usuario = auth.exigir();
const ehAgente = usuario?.perfil === 'agente';

const tabela = document.querySelector('#tabela');
const filtroStatus = document.querySelector('#filtro-status');
const formPedido = document.querySelector('#form-pedido');
const formContrato = document.querySelector('#form-contrato');
const modalPedido = new bootstrap.Modal('#modal-pedido');
const modalAvaliar = new bootstrap.Modal('#modal-avaliar');
const modalContrato = new bootstrap.Modal('#modal-contrato');

const dados = { pedidos: [], automoveis: [], agentes: [], clientes: [], contratos: [] };
let pedidoAtual = null;

if (usuario) iniciar();

function iniciar() {
  renderNavbar(usuario, 'pedidos.html');

  if (ehAgente) {
    document.querySelector('#subtitulo').textContent = 'Analise, modifique e contrate os pedidos recebidos.';
  } else {
    document.querySelector('#titulo').textContent = 'Meus pedidos';
    const btnNovo = document.querySelector('#btn-novo');
    btnNovo.classList.remove('d-none');
    btnNovo.addEventListener('click', () => abrirPedido());
  }

  filtroStatus.innerHTML += Object.values(StatusPedido).map((s) => `<option>${s}</option>`).join('');
  filtroStatus.addEventListener('change', renderTabela);

  document.querySelector('#cabecalho').innerHTML = `
    <tr>
      <th>#</th>
      <th>Automóvel</th>
      ${ehAgente ? '<th>Cliente</th>' : ''}
      <th>Período</th>
      <th>Crédito</th>
      <th>Status</th>
      <th class="text-end">Ações</th>
    </tr>`;

  document.querySelector('#usarCredito').addEventListener('change', (e) => {
    document.querySelector('#bancoCreditoId').classList.toggle('d-none', !e.target.checked);
  });

  tabela.addEventListener('click', tratarAcao);
  formPedido.addEventListener('submit', salvarPedido);
  formContrato.addEventListener('submit', executarContrato);
  document.querySelectorAll('[data-decisao]').forEach((b) => b.addEventListener('click', () => avaliar(b.dataset.decisao)));

  carregar();
}

async function carregar() {
  try {
    const filtroPedidos = ehAgente ? {} : { clienteId: usuario.id };
    const [pedidos, automoveis, agentes, clientes, contratos] = await Promise.all([
      api.listar('pedidos', filtroPedidos),
      api.listar('automoveis'),
      api.listar('agentes'),
      ehAgente ? api.listar('clientes') : Promise.resolve([]),
      api.listar('contratos'),
    ]);
    dados.pedidos = pedidos.map((p) => new Pedido(p)).sort((a, b) => b.id - a.id);
    dados.automoveis = automoveis.map((a) => new Automovel(a));
    Object.assign(dados, { agentes, clientes, contratos });
    renderTabela();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

// ---------- Consultas auxiliares ----------
const acharPorId = (lista, id) => lista.find((item) => String(item.id) === String(id));
const nomeAgente = (id) => acharPorId(dados.agentes, id)?.nome ?? '—';
const nomeCliente = (id) => acharPorId(dados.clientes, id)?.nome ?? '—';
const descricaoAutomovel = (id) => acharPorId(dados.automoveis, id)?.descricao ?? 'Automóvel removido';

function nomeProprietario(tipo, id) {
  return tipo === 'cliente' ? (ehAgente ? nomeCliente(id) : usuario.nome) : nomeAgente(id);
}

// ---------- Listagem ----------
function renderTabela() {
  const colunas = ehAgente ? 7 : 6;
  const lista = dados.pedidos.filter((p) => !filtroStatus.value || p.status === filtroStatus.value);

  if (!lista.length) {
    tabela.innerHTML = linhaVazia(colunas, ehAgente ? 'Nenhum pedido encontrado.' : 'Você ainda não fez nenhum pedido.');
    return;
  }

  tabela.innerHTML = lista.map((p) => `
    <tr>
      <td class="text-secondary">${p.id}</td>
      <td>${escapar(descricaoAutomovel(p.automovelId))}</td>
      ${ehAgente ? `<td>${escapar(nomeCliente(p.clienteId))}</td>` : ''}
      <td class="text-nowrap">${formatar.data(p.dataInicio)} – ${formatar.data(p.dataFim)}</td>
      <td>${p.bancoCreditoId ? escapar(nomeAgente(p.bancoCreditoId)) : '<span class="text-secondary">—</span>'}</td>
      <td>
        ${badgeStatus(p.status)}
        ${detalheStatus(p)}
      </td>
      <td class="text-end text-nowrap">${botoesAcao(p)}</td>
    </tr>`).join('');
}

function detalheStatus(p) {
  if (p.status === StatusPedido.CONTRATADO) {
    const contrato = dados.contratos.find((c) => String(c.pedidoId) === String(p.id));
    if (contrato) {
      return `<div class="small text-secondary mt-1">Propriedade: ${escapar(nomeProprietario(contrato.proprietarioTipo, contrato.proprietarioId))}</div>`;
    }
  }
  if (p.parecer) return `<div class="small text-secondary mt-1">${escapar(p.parecer)}</div>`;
  return '';
}

function botoesAcao(p) {
  const botao = (acao, texto, estilo = 'outline-dark') =>
    `<button class="btn btn-sm btn-${estilo}" data-acao="${acao}" data-id="${p.id}">${texto}</button>`;
  const botoes = [];

  if (p.podeModificar()) botoes.push(botao('modificar', ehAgente ? 'Modificar' : 'Editar'));
  if (ehAgente) {
    if (p.podeAvaliar()) botoes.push(botao('avaliar', 'Avaliar', 'dark'));
    if (p.podeContratar()) botoes.push(botao('contratar', 'Contratar', 'dark'));
  } else if (p.podeCancelar()) {
    botoes.push(botao('cancelar', 'Cancelar', 'outline-danger'));
  }
  return botoes.join(' ') || '<span class="small text-secondary">—</span>';
}

function tratarAcao(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const pedido = acharPorId(dados.pedidos, botao.dataset.id);
  const acoes = { modificar: abrirPedido, avaliar: abrirAvaliacao, contratar: abrirContrato, cancelar: cancelar };
  acoes[botao.dataset.acao](pedido);
}

// ---------- Criar / modificar ----------
function abrirPedido(pedido = null) {
  pedidoAtual = pedido;
  document.querySelector('#pedido-titulo').textContent = pedido ? `Modificar pedido #${pedido.id}` : 'Novo pedido';
  document.querySelector('#erros-pedido').innerHTML = '';

  formPedido.automovelId.innerHTML = '<option value="">Selecione…</option>' + dados.automoveis
    .map((a) => `<option value="${a.id}">${escapar(a.descricao)} (${a.ano})</option>`).join('');
  formPedido.bancoCreditoId.innerHTML = dados.agentes
    .filter((a) => a.tipo === 'banco')
    .map((b) => `<option value="${b.id}">${escapar(b.nome)}</option>`).join('');

  formPedido.automovelId.value = pedido?.automovelId ?? '';
  formPedido.dataInicio.value = pedido?.dataInicio ?? '';
  formPedido.dataFim.value = pedido?.dataFim ?? '';

  const usaCredito = Boolean(pedido?.bancoCreditoId);
  document.querySelector('#usarCredito').checked = usaCredito;
  formPedido.bancoCreditoId.classList.toggle('d-none', !usaCredito);
  if (usaCredito) formPedido.bancoCreditoId.value = pedido.bancoCreditoId;

  modalPedido.show();
}

async function salvarPedido(evento) {
  evento.preventDefault();
  const usaCredito = document.querySelector('#usarCredito').checked;
  const pedido = new Pedido({
    ...pedidoAtual,
    clienteId: pedidoAtual?.clienteId ?? usuario.id,
    automovelId: Number(formPedido.automovelId.value) || null,
    dataInicio: formPedido.dataInicio.value,
    dataFim: formPedido.dataFim.value,
    bancoCreditoId: usaCredito ? Number(formPedido.bancoCreditoId.value) : null,
  });

  const erros = pedido.validar();
  if (usaCredito && !pedido.bancoCreditoId) erros.push('Selecione o banco do contrato de crédito.');
  if (erros.length) return mostrarAlerta(erros, 'danger', '#erros-pedido');

  try {
    if (pedidoAtual) await api.atualizar('pedidos', pedidoAtual.id, pedido);
    else await api.criar('pedidos', pedido);
    modalPedido.hide();
    mostrarAlerta(pedidoAtual ? 'Pedido atualizado.' : 'Pedido enviado para análise.');
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger', '#erros-pedido');
  }
}

// ---------- Cancelar (cliente) ----------
async function cancelar(pedido) {
  if (!confirm(`Cancelar o pedido #${pedido.id}?`)) return;
  try {
    await api.atualizar('pedidos', pedido.id, { status: StatusPedido.CANCELADO });
    mostrarAlerta('Pedido cancelado.');
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

// ---------- Avaliar (agente) ----------
function abrirAvaliacao(pedido) {
  pedidoAtual = pedido;
  const cliente = acharPorId(dados.clientes, pedido.clienteId);
  const renda = (cliente?.rendimentos ?? []).reduce((s, r) => s + Number(r.valor), 0);
  const item = (rotulo, valor) => `<dt class="col-5 fw-normal text-secondary">${rotulo}</dt><dd class="col-7 mb-1">${escapar(valor)}</dd>`;

  document.querySelector('#avaliar-resumo').innerHTML = [
    item('Cliente', cliente?.nome ?? '—'),
    item('Profissão', cliente?.profissao || '—'),
    item('Renda declarada', formatar.moeda(renda)),
    item('Automóvel', descricaoAutomovel(pedido.automovelId)),
    item('Período', `${formatar.data(pedido.dataInicio)} – ${formatar.data(pedido.dataFim)}`),
    item('Crédito', pedido.bancoCreditoId ? nomeAgente(pedido.bancoCreditoId) : 'Não solicitado'),
  ].join('');
  document.querySelector('#parecer').value = '';
  modalAvaliar.show();
}

async function avaliar(decisao) {
  try {
    await api.atualizar('pedidos', pedidoAtual.id, {
      status: decisao,
      parecer: document.querySelector('#parecer').value.trim(),
      avaliadorId: usuario.id,
    });
    modalAvaliar.hide();
    mostrarAlerta(`Pedido #${pedidoAtual.id} ${decisao.toLowerCase()}.`);
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}

// ---------- Executar contrato (agente) ----------
function abrirContrato(pedido) {
  pedidoAtual = pedido;
  document.querySelector('#contrato-info').textContent =
    `Pedido #${pedido.id} · ${descricaoAutomovel(pedido.automovelId)}` +
    (pedido.bancoCreditoId ? ` · Crédito concedido por ${nomeAgente(pedido.bancoCreditoId)}` : '');

  const opcao = (tipo, id, nome) => `<option value="${tipo}:${id}">${escapar(nome)}</option>`;
  document.querySelector('#proprietario').innerHTML = `
    <optgroup label="Cliente">${opcao('cliente', pedido.clienteId, nomeCliente(pedido.clienteId))}</optgroup>
    <optgroup label="Empresas">${dados.agentes.filter((a) => a.tipo === 'empresa').map((a) => opcao('empresa', a.id, a.nome)).join('')}</optgroup>
    <optgroup label="Bancos">${dados.agentes.filter((a) => a.tipo === 'banco').map((a) => opcao('banco', a.id, a.nome)).join('')}</optgroup>`;
  modalContrato.show();
}

async function executarContrato(evento) {
  evento.preventDefault();
  const [proprietarioTipo, id] = document.querySelector('#proprietario').value.split(':');
  const contrato = new Contrato({
    pedidoId: pedidoAtual.id,
    proprietarioTipo,
    proprietarioId: Number(id),
    bancoCreditoId: pedidoAtual.bancoCreditoId,
    agenteId: usuario.id,
  });

  try {
    await api.criar('contratos', contrato);
    await api.atualizar('pedidos', pedidoAtual.id, { status: StatusPedido.CONTRATADO });
    await api.atualizar('automoveis', pedidoAtual.automovelId, { proprietarioTipo, proprietarioId: Number(id) });
    modalContrato.hide();
    mostrarAlerta(`Contrato do pedido #${pedidoAtual.id} executado.`);
    carregar();
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
}
