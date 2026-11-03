// Pacote SERVICE — autenticação e sessão do usuário

import { api } from './api.js';

const CHAVE = 'aluguel.sessao';

export const auth = {
  async entrar(login, senha) {
    const perfis = [['clientes', 'cliente'], ['agentes', 'agente']];
    for (const [recurso, perfil] of perfis) {
      const [usuario] = await api.listar(recurso, { login, senha });
      if (usuario) {
        const sessao = { id: usuario.id, nome: usuario.nome, perfil, tipo: usuario.tipo ?? 'cliente' };
        sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
        return sessao;
      }
    }
    throw new Error('Login ou senha inválidos.');
  },

  usuario() {
    try { return JSON.parse(sessionStorage.getItem(CHAVE)); } catch { return null; }
  },

  sair() {
    sessionStorage.removeItem(CHAVE);
    location.href = 'index.html';
  },

  // Garante que há alguém logado (e, opcionalmente, com o perfil exigido)
  exigir(...perfis) {
    const usuario = this.usuario();
    if (!usuario) {
      location.replace('index.html');
      return null;
    }
    if (perfis.length && !perfis.includes(usuario.perfil)) {
      location.replace('pedidos.html');
      return null;
    }
    return usuario;
  },

  async loginEmUso(login, ignorarClienteId = null) {
    const [clientes, agentes] = await Promise.all([
      api.listar('clientes', { login }),
      api.listar('agentes', { login }),
    ]);
    return agentes.length > 0 || clientes.some((c) => c.id !== ignorarClienteId);
  },
};
