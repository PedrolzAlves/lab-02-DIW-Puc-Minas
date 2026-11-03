// Pacote SERVICE — comunicação com o JSON Server via Fetch API

const BASE_URL = 'http://localhost:3000';

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE_URL}/${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  if (!resposta.ok) throw new Error(`Falha na requisição (${resposta.status}).`);
  return resposta.json();
}

export const api = {
  listar: (recurso, filtros = {}) => requisitar(`${recurso}?${new URLSearchParams(filtros)}`),
  buscar: (recurso, id) => requisitar(`${recurso}/${id}`),
  criar: (recurso, dados) => requisitar(recurso, { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (recurso, id, dados) => requisitar(`${recurso}/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  remover: (recurso, id) => requisitar(`${recurso}/${id}`, { method: 'DELETE' }),
};
