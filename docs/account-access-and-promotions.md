# Contas, acessos e promoções — 9 outubro 2026

## Infraestrutura e migração

A autenticação existente é própria: Prisma/PostgreSQL no Railway e cookies JWT HttpOnly separados para Admin e cliente. Não existe Supabase ativo nem API pública de acesso direto à base de dados. Reutilizam-se `CustomerAccount`, `AdminUser` e as credenciais Railway; não foi criada outra diretoria de utilizadores.

A migração `20261009090000_account_access` é aditiva. Acrescenta papel/estado/versão de sessão/último acesso/pedido de eliminação, a identidade de segurança e o histórico de auditoria. Mantém as contas, encomendas, produtos e movimentos existentes. As contas públicas começam como Cliente ativo. Os antigos `AdminUser` ficam inativos: anteriormente apenas a identidade configurada podia entrar no Admin, pelo que ativar estes antigos passwords silenciosamente concederia novos acessos.

O principal mantém o identificador de sessão **`configured-admin`** já usado em produção. `AccountSecurity` fixa esse identificador com constraints e trigger imutável. Não se decide o papel superior a partir de emails, campos de formulário ou metadados do cliente. As datas do principal não eram armazenadas pelo mecanismo Railway; a interface apresenta “Não disponível”.

RLS está ativa nas tabelas de autenticação/segurança/auditoria e os privilégios PUBLIC foram retirados. Não há papel de browser autorizado. A ligação privada existente usa o proprietário PostgreSQL, que passa pelas políticas RLS como proprietário; os triggers também validam alterações sensíveis nessa ligação. Operações sensíveis exigem contexto de ator definido exclusivamente dentro da transação do servidor. Isto não pretende impedir o proprietário do serviço, com credenciais de infraestrutura, de administrar diretamente o próprio PostgreSQL.

## Acessos e segurança

- Superadmin: único principal Railway, protegido, gestão de utilizadores.
- Administrador: áreas operacionais existentes; sem gestão de utilizadores, papéis superiores ou configurações de infraestrutura.
- Cliente: própria conta e catálogo; sem acesso administrativo.

`/admin/utilizadores` e `/api/admin/users` verificam Superadmin no servidor. Os restantes endpoints/ações operacionais continuam a verificar Admin. A navegação mostra Utilizadores em Mais e na barra lateral apenas ao Superadmin; esconder o link não substitui autorização.

Em cada pedido autenticado, o servidor consulta o estado e papel atuais. Mudanças de papel/estado incrementam a versão de sessão, invalidando imediatamente tokens já emitidos. O Superadmin não pode ser alterado, desativado, despromovido ou eliminado pelo painel/API. Não existe papel SUPERADMIN atribuível na enum de contas.

As operações têm validação estrita de dados, origem, confirmação, bloqueio de linha, verificação de concorrência por `updatedAt` e auditoria atómica. O histórico é append-only. A separação entre identidade, papel e estado permite acrescentar capacidades operacionais específicas posteriormente, sem colocar permissões em metadados editáveis.

O registo passou de upsert para criação exclusiva: registar um email existente já não substitui o password e os dados dessa conta.

## Eliminação e dados comerciais

O cliente pode solicitar eliminação; o pedido não elimina nem desativa automaticamente a conta. O Superadmin consulta o pedido, pode arquivá-lo, desativar ou eliminar com confirmação explícita **ELIMINAR**.

A eliminação usa a operação nativa da autenticação existente, dentro de transação. Verifica a conta/versão e trata as relações: anonimiza nome e contactos dos `SiteOrder` ligados por identificador, remove a antiga mensagem livre WhatsApp e subscrições push dessa identidade, e elimina a conta. A FK passa a null; referências, datas, valores, artigos e movimentos comerciais permanecem. A auditoria continua disponível mesmo depois da eliminação.

Os nomes livres das vendas manuais não são identidades autenticadas e não são eliminados por correspondência de nome/email. Necessidades de revisão desses textos devem ser tratadas separadamente, para evitar alterar registos de outra pessoa. Não foram criadas regras de eliminação automática de documentos contabilísticos.

## Promoções

“A minha conta → Descontos e promoções” usa `getCatalogData`, `getSalePriceInCents` e o ProductCard existente. O catálogo já exclui produtos inativos e aplica o Perfume do Dia sem acumulação, mantendo o preço de referência dos decants. A conta apenas seleciona preços promocionais positivos inferiores ao preço normal. Mostra fotografia, marca/nome, ambos os preços, percentagem e ligação ao produto. Sem promoções apresenta estado vazio.

Não foram criados descontos separados, datas de expiração fictícias, alterações no carrinho/checkout WhatsApp ou novos preços de decants. A validade acompanha exatamente o catálogo atual: uma promoção removida deixa de aparecer na próxima consulta. Não existe um modelo de expiração por data no catálogo atual.

## Validações

- 24 migrações aplicadas com sucesso num esquema PostgreSQL temporário isolado; apenas contas fictícias e cópia do catálogo público.
- `scripts/verify-account-access.mjs`: logins dos três níveis, negação de API, promoção/despromoção, revogação de tokens, desativação/reativação, origem, principal protegido, trigger contra elevação indevida, auditoria imutável, pedidos de eliminação idempotentes e concorrência.
- Caminho real de eliminação executado em dados fictícios dentro de rollback obrigatório: valores/artigos preservados e PII anonimizada, sem persistir qualquer eliminação.
- Promoções válidas/invalidas/inativas/removidas, Perfume do Dia sem acumulação e preços dos decants preservados.
- HTTP real: tentativa de registo duplicado rejeitada, password/perfil/papel originais preservados; APIs negadas sem sessão.
- Navegador: pesquisa e filtros, detalhes, principal sem ações de alteração, confirmação de eliminação bloqueada sem texto, cancelar/fechar sem overlay residual, Mais → Utilizadores, login cliente, promoções e abertura do produto; 320/390/768 px e desktop.
- Regressões de vendas/stock/decants: `scripts/verify-admin-pwa-business.mjs`, sem escrita comercial real.
- TypeScript, ESLint, build e `git diff --check`.

Durante testes locais houve falhas transitórias na ligação ao proxy público Railway; o mesmo teste passou após repetir a ligação. Não eram erros de JavaScript/hydration. A verificação de produção deve confirmar novamente os caminhos publicados.

## Reversão

Antes de reverter infraestrutura, preservar backup PostgreSQL e auditoria. A primeira opção é desativar/reverter a interface nova mantendo a migração aditiva, os dados e as verificações de autorização atuais. Não remover colunas/tabelas de auditoria nem reativar contas antigas por seed. Um rollback integral para uma versão anterior deve primeiro desativar todos os administradores adicionais (com auditoria), terminar as suas sessões e preservar a correção do registo duplicado; não voltar a uma autenticação que ignore estado/versão de sessão enquanto essas contas existem.

Não há remoção automática de estruturas nem SQL destrutivo de rollback de produção. O esquema temporário de testes é descartável e é removido depois da validação, sem tocar no schema público.
