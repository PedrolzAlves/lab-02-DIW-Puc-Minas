// Pacote CONTROLLER — tela de login

import { auth } from '../service/auth.js';
import { mostrarAlerta } from '../view/ui.js';

if (auth.usuario()) location.replace('pedidos.html');

document.querySelector('#form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const login = evento.target.login.value.trim();
  const senha = evento.target.senha.value;

  if (!login || !senha) return mostrarAlerta('Preencha login e senha.', 'warning');

  try {
    await auth.entrar(login, senha);
    location.href = 'pedidos.html';
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
});
