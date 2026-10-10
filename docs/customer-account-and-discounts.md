# Área de cliente e gestão de descontos

## Estado de entrega

Implementação e validação local concluídas. Sem commit, push ou deploy, conforme o pedido. A migração não foi aplicada ao schema `public` de produção. Os exemplos nas capturas são promoções e uma conta de teste num schema PostgreSQL isolado, nunca promoções comerciais publicadas.

## Área de cliente

- `/conta` mantém os formulários e ações de autenticação existentes. Após iniciar sessão, apresenta saudação com primeiro nome, avatar com inicial, quatro atalhos e a identidade visual real da loja.
- Dados e segurança ficam lado a lado no desktop e empilhados no mobile. Editar nome, apelido, telefone e morada utiliza validação no servidor; o email é apresentado e preservado.
- Alterar palavra-passe exige a palavra-passe atual e confirmação, com bcrypt. Não altera o sistema de JWT, papéis, duração dos cookies, conta principal, contas AdminUser ou a lógica de eliminação existente.
- Favoritos reutilizam o provider e os botões existentes. Sem conta, continuam no browser. Com conta, ficam em `CustomerFavorite`, associados à identidade autenticada. Os favoritos anteriores do browser são importados sem duplicação; dados de uma conta não são copiados para o armazenamento do visitante. Os produtos inativos são omitidos.
- Promoções: quatro cartões em destaque no desktop, carrossel horizontal contido no mobile e «Ver todos» com a lista completa. Fotografias, marcas e contactos vêm do catálogo e configurações reais, sem reproduzir os dados da referência visual.

## Admin

- Entrada «Descontos» na navegação e no menu Mais; `/admin/descontos` e `/api/admin/promotions` exigem acesso operacional no servidor. Clientes recebem recusa, independentemente da interface.
- Indicadores clicáveis, pesquisa por nome/marca, filtros de estado, tabela visual desktop e cartões mobile. Os indicadores referem-se aos novos registos de promoções normais; o Perfume do Dia continua no Dashboard e os descontos legados no editor de produtos.
- Criação para um ou vários frascos elegíveis: percentagem ou preço final em euros, pré-visualização do preço e percentagem equivalente, início imediato/agendado e fim opcional.
- Edição dentro da linha/cartão, ativação/desativação, fim manual e eliminação com confirmação escrita. Mensagens resultam da resposta real do servidor.
- Uma promoção normal por produto; revisões reutilizam o mesmo registo. Transações atómicas, bloqueio dos produtos e promoções e verificação de `updatedAt` rejeitam duplicados e alterações concorrentes. Uma criação múltipla inválida reverte todas as linhas.

## Preços e horários

`promotions.ts` e `promotion-select.ts` centralizam a resolução de preços. Catálogo, detalhes, homepage, conta, atualização do carrinho e checkout WhatsApp usam os mesmos candidatos:

1. Preço base do frasco, sem alteração permanente.
2. Desconto legado válido, preservado.
3. Promoção normal elegível e ativa, calculada sobre o preço base.
4. Perfume do Dia, calculado separadamente sobre o preço base.

Aplica-se o menor preço positivo, nunca uma percentagem sobre outro desconto. Empates favorecem a identificação do desconto do dia. O produto continua identificado como Perfume do Dia quando existe outra promoção melhor, mas a etiqueta não atribui incorretamente esse desconto normal ao dia.

Os decants de 5/10 ml continuam a usar a referência anterior às novas promoções e ao desconto do dia. Kits, escalões, stock, vendas históricas e a funcionalidade administrativa do Perfume do Dia não foram alterados. O modelo atual não contém uma tabela separada de variantes: cada frasco usa o seu `Product.priceInCents`; registos de kit/decant e tipos não elegíveis são recusados.

Início/fim são instantes `TIMESTAMPTZ`. O formulário e a apresentação usam `Atlantic/Azores`, independentemente do fuso do dispositivo. Horas inexistentes na mudança de primavera são recusadas; numa hora repetida de outono é escolhida, de forma explícita e determinística, a primeira ocorrência. O fim é exclusivo. A consulta calcula o estado pela hora atual, sem cron.

Consultas públicas mantêm `noStore`; as mutações revalidam homepage, catálogo, conta e Descontos. Carrinho mantém atualização periódica e ao recuperar foco/abrir; o checkout recalcula sempre no servidor. Uma página já aberta não muda visualmente a cada segundo: preços e promoções atualizam na consulta/navegação seguinte e o carrinho no seu ciclo existente de atualização.

## Migração e segurança

Migração aditiva: `20261010090000_product_promotions`.

Novas estruturas: `ProductPromotion`, `PromotionAudit` e `CustomerFavorite`, enums e índices. Não modifica contas, preços base, stock, vendas nem dados comerciais anteriores. Restrições SQL protegem valores/datas e unicidade por produto. A eliminação de um produto, através da funcionalidade existente, remove a sua promoção e favoritos por integridade referencial; o histórico promocional é preservado sem FK destrutiva.

As três tabelas têm RLS e não concedem acesso ao papel PUBLIC; o backend privado existente mantém a ligação proprietária. Auditoria promocional é append-only, protegida por trigger contra update/delete, e guarda ator/antes/depois dentro da transação. Não foi criada outra infraestrutura de autenticação. Operações novas validam origem pelo helper já existente, incluindo os hosts públicos exatos atrás do proxy Railway.

Quando for autorizado publicar, `prisma migrate deploy` aplica a migração antes de iniciar a nova versão, através do comando de arranque existente. Para rollback da aplicação, pode manter as tabelas aditivas: os preços base e descontos legados permanecem intactos. Exportar e preservar promoções/auditoria/favoritos antes de qualquer remoção futura das novas tabelas; não executar rollback destrutivo.

## Ficheiros principais

- `src/components/store/customer-account.tsx`, `src/app/(site)/conta/page.tsx` e `account.css`: nova conta e formulários.
- `src/components/providers/favorites-provider.tsx`, layout público e APIs `/api/account/favorites`, `/api/account/profile`: persistência e operações pessoais.
- `src/components/admin/promotion-manager.tsx`, página `/admin/descontos`, CSS, AdminShell e Mais: gestão administrativa.
- `src/lib/promotions.ts`, `promotion-management.ts`, `promotion-select.ts`, `daily-perfume.ts`, `data.ts`, `format.ts` e `types.ts`: cálculo, consulta, integridade e validação.
- APIs de carrinho/checkout e componentes de catálogo, cartão e banner do dia: preço e etiqueta coerentes.
- Schema Prisma, migração, `scripts/verify-promotions-account.mjs` e ajuste do teste existente de desconto mínimo.

## Validações executadas

- TypeScript, ESLint sem erros, build Next.js e `git diff --check`.
- PostgreSQL real isolado com todas as migrações, catálogo/imagens copiados apenas para testes e identidades sintéticas. Nenhuma promoção ou conta fictícia introduzida no schema público.
- Criação, edição, agendamento, ativação/desativação, fim, eliminação confirmada, unicidade, concorrência e rollback de criação múltipla; auditoria imutável.
- Horários de inverno/verão nos Açores, data inválida, hora inexistente e hora repetida; promoção expirada/inativa inelegível omitida do cálculo.
- Preço real igual em catálogo, API de carrinho e mensagem WhatsApp; conflitos/empates com Perfume do Dia; preços de referência dos decants preservados.
- Favoritos persistentes e idempotentes, origem inválida recusada, edição pessoal e verificação da palavra-passe atual.
- Teste anterior dos três níveis de acesso, recusa de clientes, proteção da conta principal, revogação imediata e eliminação/anonymização de contas sintéticas com rollback.
- Regressões existentes de stock, vendas, kits, preços históricos, alterações inline e estado de pagamento/entrega.
- Browser: conta e Descontos a 320/390/768/1280 px, sem overflow horizontal; favoritos, editar/guardar dados, Ver todos, criar/editar preço fixo, desativar/reativar/terminar, cancelar confirmação de eliminação e fechar overlays. O formulário de palavra-passe foi validado pelo handler real em teste isolado; nenhuma credencial real foi alterada pelo browser.

Limitações mantidas: sem novas promoções comerciais em produção, sem alteração de email através da conta, sem descontos novos para kits/decants e sem catálogo artificial. A alteração continua por publicar, mediante autorização.

Verificação final: capturas desktop/mobile atualizadas, sem erros de consola na última sessão. Durante a sessão prolongada ocorreram falhas transitórias de ligação PostgreSQL (P1001); os pedidos seguintes concluíram com sucesso. As imagens em falta no catálogo de teste foram copiadas para esse ambiente e confirmadas na captura final. O servidor de testes foi encerrado e o schema temporário removido; a contagem de contas, administradores, pedidos e produtos do schema público manteve-se igual antes/depois da limpeza. A migração de produção continua por aplicar.
