# Login premium por email e palavra-passe

A página /conta mantém o cabeçalho real, fotografia existente, creme/dourado, mostrar/ocultar palavra-passe e um formulário por ecrã com alternância imediata entre login, registo e recuperação. Nome, apelido, email, telefone, morada e confirmação mantêm as validações existentes. O login e registo reutilizam as ações e sessões atuais.

Autenticação social removida antes da publicação: botões, separador, associação à conta, endpoints /api/auth/[provider]/start e callback, configuração de fornecedores, modelos sociais, openid-client e oauth4webapi. As dependências partilhadas, incluindo jose para sessões, permanecem.

## Recuperação por Resend

Configurar RESEND_API_KEY e AUTH_EMAIL_FROM (remetente verificado) no Railway. CUSTOMER_AUTH_ORIGIN é opcional, usa a origem pública configurada por omissão e exige HTTPS em produção. Sem configuração de email, a interface oferece o contacto real da loja; não simula envio.

/api/auth/recovery mantém validação de origem, resposta genérica para impedir enumeração, limites persistentes por IP/email, tokens aleatórios de 256 bits guardados apenas como hash, expiração de 15 minutos, uso único, confirmação, bcrypt custo 12, revogação de sessões e auditoria atómicas. Só recupera contas CUSTOMER ativas com palavra-passe; não altera contas administrativas. A página impede envio do token via referrer.

## Migração

Antes desta revisão, consulta direta ao histórico public._prisma_migrations confirmou que 20261010120000_customer_social_auth não estava aplicada, e nenhuma das novas tabelas existia na base persistente. O schema temporário da fase anterior já tinha sido removido. Por isso, a migração inédita foi revista antes da publicação e mantém apenas CustomerPasswordReset e CustomerAuthThrottle, com RLS e sem acesso PUBLIC. O nome original foi conservado para identificar a revisão solicitada. Nenhuma migração anteriormente aplicada foi alterada. Não existem DROP, TRUNCATE ou operações de alteração de dados nesta migração.

## Validação

TypeScript, ESLint, build, diff check, testes de recuperação com PostgreSQL isolado e transporte Resend simulado, testes existentes de autenticação/permissões e regressão comercial. Recuperação verifica assinatura do hash, uso único, expiração, auditoria, versão da sessão, recusa de administradores, enumeração, limites, origem e confirmação. Não equivale a email real entregue: configuração Resend ainda necessária. Testes de negócio usam persistência isolada e preservam dados reais.
