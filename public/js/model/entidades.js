// Pacote MODEL — entidades do domínio (espelham o Diagrama de Classes)

export const StatusPedido = Object.freeze({
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  CANCELADO: 'Cancelado',
  CONTRATADO: 'Contratado',
});

export const TipoAgente = Object.freeze({ EMPRESA: 'empresa', BANCO: 'banco' });

export class Usuario {
  constructor({ id, nome = '', login = '', senha = '' } = {}) {
    this.id = id;
    this.nome = nome;
    this.login = login;
    this.senha = senha;
  }

  validar() {
    const erros = [];
    if (!this.nome) erros.push('Informe o nome.');
    if (!this.login) erros.push('Informe o login.');
    if (!this.senha) erros.push('Informe a senha.');
    return erros;
  }
}

export class Rendimento {
  constructor({ entidade = '', valor = 0 } = {}) {
    this.entidade = entidade;
    this.valor = Number(valor);
  }
}

export class Cliente extends Usuario {
  static MAX_RENDIMENTOS = 3;

  constructor(dados = {}) {
    super(dados);
    this.rg = dados.rg ?? '';
    this.cpf = (dados.cpf ?? '').replace(/\D/g, '');
    this.endereco = dados.endereco ?? '';
    this.profissao = dados.profissao ?? '';
    this.rendimentos = (dados.rendimentos ?? []).map((r) => new Rendimento(r));
  }

  get rendaTotal() {
    return this.rendimentos.reduce((soma, r) => soma + r.valor, 0);
  }

  validar() {
    const erros = super.validar();
    if (!this.rg) erros.push('Informe o RG.');
    if (this.cpf.length !== 11) erros.push('O CPF deve ter 11 dígitos.');
    if (!this.endereco) erros.push('Informe o endereço.');
    if (this.rendimentos.length > Cliente.MAX_RENDIMENTOS) {
      erros.push(`Informe no máximo ${Cliente.MAX_RENDIMENTOS} rendimentos.`);
    }
    return erros;
  }
}

export class Agente extends Usuario {
  constructor(dados = {}) {
    super(dados);
    this.tipo = dados.tipo ?? TipoAgente.EMPRESA;
    this.cnpj = dados.cnpj ?? '';
  }
}

export class Automovel {
  constructor({ id, matricula = '', ano = '', marca = '', modelo = '', placa = '', proprietarioTipo = 'empresa', proprietarioId = null } = {}) {
    this.id = id;
    this.matricula = matricula;
    this.ano = Number(ano);
    this.marca = marca;
    this.modelo = modelo;
    this.placa = placa.toUpperCase();
    this.proprietarioTipo = proprietarioTipo; // cliente | empresa | banco
    this.proprietarioId = proprietarioId;
  }

  get descricao() {
    return `${this.marca} ${this.modelo} · ${this.placa}`;
  }

  validar() {
    const erros = [];
    if (!this.matricula) erros.push('Informe a matrícula.');
    if (!this.marca || !this.modelo) erros.push('Informe marca e modelo.');
    if (!this.placa) erros.push('Informe a placa.');
    if (this.ano < 1950 || this.ano > new Date().getFullYear() + 1) erros.push('Ano inválido.');
    return erros;
  }
}

export class Pedido {
  constructor({ id, clienteId, automovelId, dataInicio = '', dataFim = '', bancoCreditoId = null, status = StatusPedido.PENDENTE, parecer = '', avaliadorId = null } = {}) {
    this.id = id;
    this.clienteId = clienteId;
    this.automovelId = automovelId;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
    this.bancoCreditoId = bancoCreditoId; // contrato de crédito (opcional)
    this.status = status;
    this.parecer = parecer;
    this.avaliadorId = avaliadorId; // agente que emitiu o parecer
  }

  podeModificar() { return this.status === StatusPedido.PENDENTE; }
  podeCancelar() { return [StatusPedido.PENDENTE, StatusPedido.APROVADO].includes(this.status); }
  podeAvaliar() { return this.status === StatusPedido.PENDENTE; }
  podeContratar() { return this.status === StatusPedido.APROVADO; }

  validar() {
    const erros = [];
    if (!this.automovelId) erros.push('Selecione um automóvel.');
    if (!this.dataInicio || !this.dataFim) erros.push('Informe o período do aluguel.');
    else if (this.dataFim < this.dataInicio) erros.push('A data final deve ser posterior à inicial.');
    return erros;
  }
}

export class Contrato {
  constructor({ id, pedidoId, proprietarioTipo, proprietarioId, bancoCreditoId = null, agenteId, data = new Date().toISOString().slice(0, 10) } = {}) {
    this.id = id;
    this.pedidoId = pedidoId;
    this.proprietarioTipo = proprietarioTipo;
    this.proprietarioId = proprietarioId;
    this.bancoCreditoId = bancoCreditoId;
    this.agenteId = agenteId;
    this.data = data;
  }
}
