# Simplificação do Admin — validação local, 06/10/2026

Sem deploy, commit ou push. Sem alterações a dados, schema Prisma, migrations, Supabase, Railway ou produção. As alterações anteriores da loja pública foram preservadas.

## 1. O que foi alterado

Menu simplificado, mantendo o desenho atual, tanto no desktop como no mobile:

- Principal: Dashboard, Estatísticas.
- Gestão: Stock, Produtos.
- Catálogo: Marcas, Categorias, Tipos.
- Site: Desejos, Comentários, Ver loja, Sobre Nós.

Dashboard com dois indicadores simples: Vendas hoje e Faturação hoje. Stock com secção recolhível de unidades, valor a custo e valor potencial de venda. Edição rápida com custo de compra e margem bruta automática.

Ficheiros desta alteração: `src/components/admin/admin-shell.tsx`, `src/app/admin/page.tsx`, `src/components/admin/inventory-workspace.tsx`, `src/lib/data.ts`, `src/actions/admin.ts` e remoção de `src/app/admin/clientes/page.tsx`.

## 2. Removido apenas do menu

Secção Vendas e os seus links Nova venda / Estado das vendas. Os atalhos do Dashboard, as rotas e os handlers existentes continuam disponíveis. Desejos e Comentários passaram para Site, sem alteração funcional.

## 3. Removido do código

Página `/admin/clientes`, query exclusiva `getAdminCustomersData`, revalidação dessa rota na inscrição pública e imports de ícones sem utilização. Removidas queries do resumo antigo não consumido pelo Dashboard, incluindo a contagem de CustomerAccount; não foram removidas funcionalidades de vendas.

## 4. Preservado na base de dados

Todos os modelos, tabelas, registos, relações e histórico. Auditoria em leitura às foreign keys confirmou `SiteOrder.customerAccountId → CustomerAccount` e `StockMovement.productId → Product`. Não foi criada nem executada migration.

## 5. Clientes das vendas atuais

O nome é guardado diretamente em `StockMovement.customerName`; `saleGroupId` agrupa artigos da mesma venda. Nova venda, Estado das vendas e Estatísticas não precisam de uma relação com CustomerAccount. O seletor de clientes da venda reutiliza nomes dos movimentos.

## 6. Independência da página Clientes

A listagem administrativa era independente do fluxo de vendas, mas a tabela CustomerAccount não é totalmente obsoleta: suporta inscrição explícita, login e sessões da conta pública, e preenchimento do nome no checkout. Estes usos foram preservados. O checkout atual não cria automaticamente contas nem SiteOrder; apenas prepara o WhatsApp. A inscrição pública só cria/atualiza uma conta quando o utilizador a solicita.

## 7. Vendas hoje / Faturação hoje

Fonte: movimentos SALE registados hoje, com limites do dia no fuso Atlantic/Azores. Agrupamento por saleGroupId, ou pelo id em registos antigos sem grupo. Vendas hoje conta grupos pagos, sem artigos pendentes. Faturação hoje soma quantidade × preço unitário dos artigos pagos desses grupos; ofertas não acrescentam faturação. Estados antigos nulos mantêm a interpretação existente de Pago.

É a data de registo da venda, não uma nova data de recebimento: uma venda antiga marcada como paga hoje permanece associada à sua data de criação. Os textos dos indicadores identificam vendas pagas registadas hoje. Não são usados pedidos antigos do site.

## 8. Histórico de stock

Reutilizado o histórico existente de StockMovement: data, produto, quantidade, stock anterior/final, motivo, cliente, notas e grupo da venda. A interface existente abre movimentos por produto. Decants podem mostrar stock anterior igual ao final, pois não representam a saída de um frasco completo. Não foi necessária nova tabela.

## 9. Custo, margem e valor de stock

Reutilizado Product.purchaseCostInCents e o endpoint de edição rápida existente. Margem bruta por unidade = preço de venda atual − custo de compra; não é lucro líquido. Custo não definido mostra margem indisponível, em vez de inventar lucro. Estes campos são internos; a seleção pública de produtos não inclui custo de compra.

Totais usam Product.stock de todo o inventário, incluindo inativos, sem acrescentar unidades de decants vendidos. Valor a custo = stock × custo; valor potencial = stock × preço de venda atual, incluindo promoção aplicável. São valores do inventário registado, não faturação nem confirmação física das quantidades. Na consulta atual existem 136 produtos com stock positivo sem custo definido: o total a custo é identificado como incompleto.

## 10. Estatísticas e reposição

Os cálculos pedidos já existiam e foram auditados e verificados, sem reescrever gráficos: recebido, vendas pagas, ticket médio, frascos, decants individuais 5/10 ml, kits, rankings de produtos/marcas/público e comparação temporal. Rankings de frascos excluem decants. No período de 30 dias verificado: 328 vendas pagas, 10 931,70 € recebidos, 260 frascos, 28 decants individuais 5 ml, 22 de 10 ml e 54 kits.

Stock baixo e os atalhos de reposição existentes foram preservados. Não foi acrescentado um estado persistente “Marcar para encomendar”: as notas internas já permitem indicação manual e um novo estado precisaria de uma decisão sobre armazenamento e ciclo de limpeza. Não foi criado um sistema de compras.

Produtos parados a 30/60/90 dias ficam para uma segunda fase: usar stock positivo, última venda de frasco paga e custo conhecido; distinguir produtos novos de produtos antigos sem vendas e verificar datas do histórico importado. Não misturar vendas de decants com saídas de frascos nem inventar o custo do dinheiro parado.

## 11. Possível limpeza numa segunda fase

`SiteOrder` / `SiteOrderItem` e `getAdminOrdersData` são candidatos a nova auditoria antes de qualquer remoção, com preservação/exportação do histórico e verificação das relações de produto/conta. CustomerAccount não deve ser apagada enquanto a conta pública continuar ativa. CustomerSession e autenticação pública também foram preservadas. Não há autorização de remoção de dados nesta fase.

## 12. Testes e limites

- ESLint: passou.
- TypeScript (`npx tsc --noEmit` após regeneração das rotas pelo build): passou.
- Build de produção (`npm run build`): passou; rota Clientes ausente.
- `git diff --check`: passou; apenas avisos habituais de conversão LF/CRLF.
- Login Admin real por HTTP com configuração local: passou, sem exposição de credenciais.
- HTTP autenticado: Dashboard, Nova venda, Estado das vendas, Stock, Produtos, Estatísticas, Marcas, Categorias, Tipos, Desejos e Comentários devolveram 200; Clientes devolveu 404.
- Browser real: abrir/fechar menu, navegação para Dashboard/Stock/Estatísticas, atalhos Nova venda e Estado das vendas, pesquisa de vendas/stock, histórico por produto, Ver loja, abrir/fechar carrinho, datas personalizadas e Aplicar: passaram.
- Browser real: custo provisório 30 € com preço 45 € apresentou margem 15 €; Cancelar preservou o valor original. Edição rápida de 9PM a 320 px sem corte lateral.
- Dashboard e Stock a 320, 390, 768 e 1440 px: largura do documento não excedeu a viewport; inspeção visual desktop e mobile.
- Endpoint de edição rápida com os mesmos valores: resposta sem alterações; contagem de movimentos e updatedAt do produto preservados.
- Handlers reais de criação de venda e atualização de estados, com autenticação/cache e persistência simuladas em memória: frascos descontam stock; decants individuais e kits não descontam frascos; Pago/Por pagar e Entregue/Por entregar não descontam stock novamente; stock insuficiente rejeitado. Não foi registada uma venda de teste na base real nem foram alterados estados de vendas reais pela UI.
- Estatísticas: comparação independente com movimentos reais em leitura para Hoje, 7 dias, 30 dias, Este mês, Este ano e Personalizado; formatos, valores e contagens passaram, incluindo limites de horário de verão dos Açores.
- Checkout real `/api/orders`: frasco, decants 5/10 ml e faixas de preço verificadas; variante indisponível, esgotado, quantidade zero e produto inexistente rejeitados. Contagens SiteOrder/StockMovement preservadas. Nenhuma mensagem WhatsApp enviada.
- Console observado: nenhum erro JavaScript/hydration; aviso de desenvolvimento já existente sobre scroll-behavior smooth no html, fora do âmbito destas alterações.

Não equivale a testar gravações de vendas numa base isolada real: os testes que alteram vendas usam persistência em memória para preservar os dados existentes.
