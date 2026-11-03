# Histórias do Usuário — Sistema de Aluguel de Carros (v1)

| ID | Como... | Quero... | Para... | Critérios de aceitação |
| :-- | :-- | :-- | :-- | :-- |
| US01 | visitante | me cadastrar informando RG, CPF, nome, endereço, profissão, login e senha | poder usar o sistema | CPF com 11 dígitos; login único entre clientes e agentes; campos obrigatórios validados |
| US02 | cliente | informar até 3 rendimentos (entidade empregadora + valor) | comprovar minha renda na análise financeira | o botão "Adicionar" bloqueia no 3º rendimento; a renda total é calculada |
| US03 | usuário cadastrado (cliente ou agente) | entrar com login e senha | acessar as funções do meu perfil | credenciais inválidas exibem erro; páginas exigem sessão ativa |
| US04 | cliente | introduzir um pedido escolhendo automóvel e período | alugar um carro pela Internet | data final ≥ data inicial; pedido nasce com status **Pendente** |
| US05 | cliente | solicitar um contrato de crédito a um banco agente no pedido | financiar o aluguel | apenas agentes do tipo **banco** aparecem como opção |
| US06 | cliente | consultar meus pedidos e o status de cada um | acompanhar a análise | o cliente vê somente os próprios pedidos; filtro por status |
| US07 | cliente | modificar um pedido | corrigir automóvel ou datas | permitido apenas enquanto **Pendente** |
| US08 | cliente | cancelar um pedido | desistir do aluguel | permitido quando **Pendente** ou **Aprovado** |
| US09 | agente (empresa ou banco) | consultar e modificar os pedidos | ajustar pedidos antes da análise | agente vê todos os pedidos; modificação apenas se **Pendente** |
| US10 | agente | avaliar financeiramente um pedido, vendo a renda declarada do cliente, e registrar um parecer | aprovar ou reprovar o pedido | status passa a **Aprovado** ou **Reprovado**; o avaliador fica registrado |
| US11 | agente | executar o contrato de um pedido aprovado | formalizar o aluguel | gera um contrato; status passa a **Contratado** |
| US12 | agente | registrar o automóvel como propriedade do cliente, de uma empresa ou de um banco ao executar o contrato | refletir o tipo de contrato | proprietário do automóvel é atualizado; contrato guarda o crédito associado |
| US13 | agente | cadastrar, editar e remover automóveis (matrícula, ano, marca, modelo, placa) | manter a frota disponível | ano entre 1950 e o ano seguinte; placa em maiúsculas |
| US14 | agente | gerenciar os clientes cadastrados | manter os dados dos contratantes | listar, editar e excluir clientes |
