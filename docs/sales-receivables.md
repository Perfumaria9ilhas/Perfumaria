# Vendas, recebimentos e entregas

Dashboard e Vendas partilham o painel de pendências por cliente. Os grupos de vendas existentes continuam a identificar as vendas; não é criada uma segunda venda quando entra um pagamento.

## Persistência

- `SaleAccount`: saldo inicial por artigo, obtido dos estados existentes apenas quando a venda passa a ser gerida pelo novo registo. Não cria recibos retroativos.
- `SaleAccountItem`: referências protegidas aos movimentos originais. Uma venda com histórico financeiro não pode perder os seus artigos por eliminação de produto/movimento.
- `SaleAccountEvent`: recebimentos, anulações, correções explícitas de saldo antigo e quantidades entregues. Cada lançamento guarda a conta responsável, data efetiva e data de registo.
- A migração `20261016120000_sale_accounts` apenas cria estruturas novas, inicialmente vazias. Não altera custos, vendas ou stock existentes. Não foi aplicada em produção durante a implementação.

As operações usam uma transação, bloqueio por venda, verificação da versão e identificador único do pedido. Repetir um pedido confirmado devolve o resultado anterior. Dois administradores não conseguem confirmar alterações concorrentes sobre a mesma versão.

As anulações são novos lançamentos negativos ligados ao pagamento original. Não há edição nem eliminação de pagamentos pela API. Corrigir um valor recebido implica anular o lançamento e registar o valor correto. Corrigir um estado antigo é uma operação separada, com motivo obrigatório, que não representa entrada ou saída de dinheiro.

Um recebimento não atribuído a um artigo reduz apenas o saldo da venda. Os valores individuais não são automaticamente distribuídos. A quantidade de artigos com pagamento pendente identifica linhas com saldo, não uma distribuição inventada do dinheiro pelas unidades.

## Relatórios

- Valor vendido e gráficos comerciais: data da venda, preços históricos, incluindo vendas por pagar e excluindo ofertas.
- Total recebido: pagamentos com data conhecida, menos anulações na data destas.
- Por receber no relatório de período: saldo atual das vendas registadas nesse período. No Dashboard, o saldo inclui todas as vendas.
- Estados antigos pagos sem data de recebimento mantêm o seu saldo e são apresentados separadamente; não entram artificialmente no dinheiro recebido num dia específico.
- A fórmula de margem e os custos históricos são preservados. O relatório identifica a margem estimada das vendas, independentemente do momento do recebimento.
- As datas e limites de período usam `Atlantic/Azores`.

## Limites explícitos

O sistema antigo identifica clientes pelo nome, sem identificador de cliente obrigatório na venda. O agrupamento normaliza espaços e maiúsculas/minúsculas. Pessoas com nomes iguais podem aparecer juntas, mas os pagamentos permanecem sempre separados por venda. Não são feitas associações por semelhança de nomes.

Uma venda com movimentos financeiros permite corrigir nome/origem, com auditoria, mas fica protegida contra eliminação e substituição dos seus artigos. Os pagamentos e entregas são corrigidos pelos controlos próprios. Uma troca comercial de produto depois de receber dinheiro exigiria um fluxo próprio de devolução/troca, que não é simulado neste trabalho.

Os dados são atualizados após cada ação, ao regressar à janela e a cada 20 segundos enquanto esta estiver visível. Existe também o botão Atualizar.

## Verificação

`scripts/verify-sale-accounts.ts` exige uma base com schema isolado `account_test_*`. Testa pagamentos parciais, idempotência, concorrência, anulações, entregas, saldos antigos, kits/decants, proteção dos movimentos e reconciliação financeira.

`scripts/verify-statistics.ts` faz uma reconciliação de leitura por seis períodos, incluindo os limites de datas dos Açores. A validação de browser usa exclusivamente contas e vendas de teste, nos tamanhos 320, 390, 768 e 1440 px.

Publicar exige autorização e execução da migração aditiva antes de servir o novo código. Nenhum commit, push ou deploy foi feito durante esta implementação.
