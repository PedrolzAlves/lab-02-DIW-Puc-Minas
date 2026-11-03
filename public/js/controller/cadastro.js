// Pacote CONTROLLER — autocadastro de cliente

import { api } from '../service/api.js';
import { auth } from '../service/auth.js';
import { mostrarAlerta } from '../view/ui.js';
import { montarFormCliente, lerFormCliente } from '../view/clienteForm.js';

const form = document.querySelector('#form-cadastro');
montarFormCliente(form.querySelector('[data-campos]'));

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const cliente = lerFormCliente(form);
  const erros = cliente.validar();

  try {
    if (cliente.login && (await auth.loginEmUso(cliente.login))) erros.push('Este login já está em uso.');
    if (erros.length) return mostrarAlerta(erros, 'danger');

    await api.criar('clientes', cliente);
    await auth.entrar(cliente.login, cliente.senha);
    location.href = 'pedidos.html';
  } catch (erro) {
    mostrarAlerta(erro.message, 'danger');
  }
});
