# Admin mobile PWA — 9 Ilhas Admin

Implementação validada localmente. A publicação aplica a migração de subscrições através do processo de arranque existente. Web Push exige configuração VAPID no servidor e autorização por dispositivo.

## O que foi reutilizado

AdminShell, Dashboard e dados reais de vendas, StockAdminTable, InventoryWorkspace, InventoryDialog, editor de produtos, filtros das Estatísticas, autenticação e rotas administrativas atuais. O checkout WhatsApp e a criação de vendas não foram alterados.

## Alterações

- Apenas até 1023 px: cabeçalho preto, identidade dourada, cinco atalhos inferiores, safe areas, cartões compactos e resumo operacional. O desktop mantém o menu, estrutura e estilos anteriores.
- Mais apresenta apenas módulos existentes, incluindo o histórico de stock por produto. Definições acrescenta instalação e preferências push, com ligação às definições atuais da loja.
- Vendas mobile: primeiro pagamento ou entrega pendente; depois data decrescente. Pesquisa, filtros e botões persistentes existentes mantidos.
- Sino com alertas reais agregados de pagamento, entrega e stock baixo. Atualiza ao voltar à página, após alterações e a cada minuto. A API exige sessão administrativa.
- Manifest, ícones PNG/SVG e Apple touch icon. Abertura em /admin com autenticação, standalone e viewport com safe areas.
- Service worker sem caches de páginas/dados privados. Sem ligação apresenta apenas uma mensagem genérica, sem dados. Cabeçalhos privados no-store no Admin/API. O site público não recebe o manifest nem a navegação administrativa.

## Ativar push numa futura publicação autorizada

1. Gerar um par VAPID uma vez com `npx web-push generate-vapid-keys`. Guardar a chave privada exclusivamente nas variáveis seguras do servidor; não inserir no código nem em variáveis NEXT_PUBLIC.
2. Configurar no serviço Railway: ADMIN_VAPID_PUBLIC_KEY, ADMIN_VAPID_PRIVATE_KEY e ADMIN_VAPID_SUBJECT (mailto: de contacto válido).
3. Aplicar a migração Prisma 20261008193000_admin_push_subscriptions no processo de publicação já existente, depois de autorizado. Cria apenas AdminPushSubscription e índices; não altera tabelas de vendas, stock ou produtos.
4. Publicar sobre HTTPS. No dispositivo, abrir Definições e tocar Ativar notificações. Escolher categorias, guardar e enviar um teste.

Não existe novo fornecedor pago nem agendamento obrigatório: o servidor usa Web Push/VAPID e agenda envios após operações reais bem-sucedidas de vendas/stock/produtos. Alterações externas diretas à base de dados não acionam automaticamente esses eventos. A infraestrutura e a nova tabela utilizam os recursos e custos normais do alojamento/base de dados atuais. Não foi aplicado qualquer serviço, segredo ou migração à produção nesta fase.

Subscrições pertencem ao administrador autenticado. A API verifica origem, proprietário e endpoints permitidos; preferências são por dispositivo. O envio usa payload genérico sem nomes, artigos ou valores, deduplicação persistente, limpeza de endpoints expirados e limite para testes. Falhas no push não impedem gravar vendas/stock. Sem chaves/tabela, Definições explica que falta configuração e não solicita permissão.

## Instalar no iPhone

Safari → abrir /admin e iniciar sessão → Partilhar → Adicionar ao ecrã principal → confirmar 9 Ilhas Admin. Abrir pelo novo ícone. Para push: iOS 16.4 ou posterior, aplicação instalada e permissão concedida após tocar Ativar notificações. Internet continua necessária. A instalação e receção reais num iPhone físico ainda precisam de confirmação após publicação/configuração.

## Validação

ESLint, TypeScript, build de produção e git diff --check. HTTP em desenvolvimento e no build local: manifest/ícones/service worker, autenticação, rotas, alertas e cabeçalhos privados no-store em produção. Navegação real, pesquisa, filtros, datas e Aplicar, abertura/cancelamento de edição e histórico; larguras 320, 390, 430, 768 e 1440 px. Desktop com navegação anterior, sem barra inferior. Sem erros JavaScript no browser do build local. Foi observada uma falha transitória de ligação à base de dados no servidor; a API de alertas devolve erro 503 controlado e a interface informa a falha; desenvolvimento apresentou avisos de imagens e scroll suave já existentes.

Handlers reais de vendas, alteração de pagamento/entrega e edição de stock testados com persistência isolada em memória: dedução de frascos, separação de decants/kits, validação de stock, custos, criação de histórico e gravação sem alterações. Handlers reais de push testados com transporte e persistência isolados: autenticação, propriedade, origem/SSRF, preferências, deduplicação, teste limitado e remoção de subscrições expiradas. Não foram criadas vendas, alterados stocks reais ou enviadas notificações reais.

Comandos reproduzíveis:

- `npx tsx scripts/verify-admin-pwa.mts` (servidor local a correr; PWA_TEST_URL permite apontar para o build local).
- `node scripts/verify-admin-pwa-business.mjs`
- `node scripts/verify-admin-pwa-push.mjs`

Para preview de produção local usar `npx next start -p 3001` após build. Não usar o comando de arranque do deploy para testes, pois pode aplicar migrações.

## Ficheiros

- `docs/admin-pwa.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `prisma/migrations/20261008193000_admin_push_subscriptions/migration.sql`
- `prisma/schema.prisma`
- `public/admin-pwa/apple-touch-icon.png`
- `public/admin-pwa/icon-192.png`
- `public/admin-pwa/icon-512.png`
- `public/admin-pwa/icon.svg`
- `public/admin/sw.js`
- `scripts/verify-admin-pwa-business.mjs`
- `scripts/verify-admin-pwa-push.mjs`
- `scripts/verify-admin-pwa.mts`
- `src/actions/admin.ts`
- `src/app/admin/definicoes/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/mais/page.tsx`
- `src/app/admin/manifest.webmanifest/route.ts`
- `src/app/admin/mobile.css`
- `src/app/admin/page.tsx`
- `src/app/admin/stock/page.tsx`
- `src/app/api/admin/alerts/route.ts`
- `src/app/api/admin/push/dispatch/route.ts`
- `src/app/api/admin/push/route.ts`
- `src/app/api/admin/stock/decants/route.ts`
- `src/app/api/admin/stock/import/commit/route.ts`
- `src/app/api/admin/stock/product/[productId]/movements/route.ts`
- `src/app/api/admin/stock/product/[productId]/route.ts`
- `src/app/api/admin/stock/sales/combined/route.ts`
- `src/app/api/admin/stock/sales/route.ts`
- `src/components/admin/admin-notifications.tsx`
- `src/components/admin/admin-push-settings.tsx`
- `src/components/admin/admin-pwa.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/components/admin/inventory-dialog.tsx`
- `src/components/admin/inventory-workspace.tsx`
- `src/components/admin/stock-admin-table.tsx`
- `src/lib/admin-alerts.ts`
- `src/lib/admin-push-validation.ts`
- `src/lib/admin-push.ts`
- `src/lib/admin-sales-sort.ts`
