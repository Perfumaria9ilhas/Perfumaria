# Admin operacional — revisão local

As alterações estão locais. Não foi feito commit, push ou deploy. Rever em http://localhost:3000/admin.

## Alterações

- Dashboard com quatro indicadores clicáveis, datas dos Açores e margem bruta estimada. Custos em falta tornam o cálculo explicitamente incompleto.
- Vendas compactas: pendentes primeiro, detalhes na própria lista, pagamento e entrega reversíveis com confirmação e histórico.
- Edição rápida de stock reutilizada no Dashboard e no Stock: capacidade, preço base, quantidade, botões +/−, Guardar e Cancelar. Proteção contra gravações concorrentes e repetidas; alterações registadas com valores anteriores e novos.
- Três produtos prioritários no Dashboard e ligação para a lista de stock baixo.
- Perfume do Dia compacto, mantendo os 10% sobre o preço base e a exclusão dos decants.
- Sino com quatro categorias internas: pagamentos, entregas, stock baixo e esgotados. Stock baixo exclui esgotados para não duplicar produtos. Não foram implementados novos serviços push.
- Nova venda com pesquisa por produto/marca, capacidade e preço visíveis, total automático e proteção contra submissão repetida.
- Organização compacta em mobile e desktop, cabeçalho preto e navegação inferior existente.
- Correções de segurança comercial: mudar estados não recalcula preços históricos de decants, funciona para produtos posteriormente desativados e preserva artigos oferecidos nas vendas mistas.

## Capacidades e custos

O modelo atual tem uma capacidade de frasco por produto; os decants seguem as regras existentes e não têm um inventário independente de variantes. Não foi criada uma estrutura fictícia de variantes nem alterado o esquema da base de dados.

A capacidade de produtos sem vendas pode ser alterada. Quando existem vendas anteriores, a alteração é bloqueada para preservar o histórico; outra capacidade deve ser registada como produto distinto pelo fluxo existente.

Novas vendas guardam o custo unitário registado. O histórico usa esse custo quando existe e, como alternativa, o custo atual registado do produto; para decants, a proporção da capacidade. A margem apresentada não inclui custos de envio, embalagem ou impostos não registados.

## Ficheiros

Novos:
- `src/lib/admin-dashboard-sales.ts`
- `src/components/admin/dashboard-stock.tsx`
- `src/components/admin/quick-stock-editor.tsx`
- `scripts/verify-admin-operations.mts`
- Este relatório.

Alterados:
- `src/app/admin/page.tsx`, `src/app/admin/stock/page.tsx`, `src/app/admin/mobile.css`
- `src/components/admin/admin-shell.tsx`, `daily-perfume-card.tsx`, `inventory-workspace.tsx`, `stock-admin-table.tsx`
- `src/lib/data.ts`, `stock.ts`, `stock-server.ts`, `admin-alerts.ts`, `admin-push.ts`
- `src/app/api/admin/stock/product/[productId]/route.ts`
- `src/app/api/admin/stock/sales/route.ts`, `sales/combined/route.ts`, `decants/route.ts`
- `scripts/verify-admin-pwa.mts`, `scripts/verify-admin-pwa-business.mjs`

## Validação

- ESLint, TypeScript, build e `git diff --check`: passaram.
- Testes dos handlers reais com persistência isolada em memória: stock, frascos, decants, kits, preços, custos, estados, oferecidos, histórico, capacidade protegida, conflitos de versão e rollback por stock insuficiente.
- Testes de cálculo: grupos pagos, custos em falta, distribuição do custo dos decants e limites de datas/mês/horário de verão dos Açores.
- Verificação HTTP local autenticada: páginas Admin, cabeçalhos privados, alertas, manifest, ícones, service worker e isolamento do site público.
- Interações no browser em 320, 390, 768 e 1440 px: navegação, atalhos, detalhes de venda, pesquisa, filtros de stock, sino, edição rápida com +/− e Cancelar, seletor do Perfume do Dia e total de Nova venda (duas unidades a 45 € = 90 €).
- Reversão de estado: confirmação aberta e cancelada; o estado original permaneceu.
- Sem scroll horizontal nas vistas verificadas. Sem erros de console ou hydration na última verificação.

As gravações comerciais foram testadas em persistência isolada; não foram criadas vendas nem alterado stock real para testar. Os testes responsivos foram feitos no browser, não num iPhone físico. A sintaxe dos bloqueios PostgreSQL foi verificada numa transação sem linhas; não foi simulado um teste de carga com múltiplos clientes reais.

## Revisão sugerida

Abrir Dashboard, Estado das vendas e Stock. Experimentar os filtros, os detalhes, o painel de edição e Cancelar. A publicação fica pendente da revisão do utilizador.
