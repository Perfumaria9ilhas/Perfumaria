import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "Política de Privacidade",
  description:
    "Saiba como a Perfumaria 9 Ilhas recolhe, utiliza e protege os dados pessoais dos seus clientes e visitantes.",
  path: "/politica-de-privacidade",
});

const sectionClassName =
  "rounded-[1.75rem] border border-[color:var(--line)] bg-white p-6 shadow-sm md:p-8";

export default async function PoliticaDePrivacidadePage() {
  const settings = await getStoreSettings();
  const contactEmail = settings.contactEmail || "perfumaria9ilhas@hotmail.com";

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-4 lg:px-5 lg:py-6">
      <section className="rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f6efe4)] p-6 shadow-sm md:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--gold)]">
          Privacidade e dados pessoais
        </p>
        <h1 className="mt-3 break-words text-4xl text-[color:var(--ink)] md:text-5xl">
          Política de Privacidade
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
          Esta política explica, de forma simples, como a Perfumaria 9 Ilhas trata os dados
          pessoais de quem visita o site, cria uma conta, deixa uma avaliação, faz uma encomenda
          ou entra em contacto connosco.
        </p>
        <p className="mt-3 text-sm text-slate-500">Última atualização: 26 de setembro de 2026.</p>
      </section>

      <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">1. Responsável pelo tratamento</h2>
          <p className="mt-3">
            A Perfumaria 9 Ilhas é responsável pelo tratamento dos dados descritos nesta política.
            A loja está localizada em {settings.location}. Para questões sobre privacidade ou para
            exercer os seus direitos, pode contactar-nos através do email{" "}
            <Link className="font-semibold text-[color:var(--atlantic)] underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </Link>{" "}
            ou pelo WhatsApp +{settings.whatsappNumber}.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">2. Dados que podemos recolher</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Conta de cliente:</strong> nome, apelido, email, telefone, morada e palavra-passe
              protegida através de uma representação criptográfica.
            </li>
            <li>
              <strong>Encomendas:</strong> produtos, quantidades, valores, estado da encomenda e,
              quando existe uma conta autenticada, os respetivos dados de contacto e entrega.
            </li>
            <li>
              <strong>Contactos:</strong> dados e conteúdo que nos envia voluntariamente por WhatsApp,
              email ou outros canais indicados no site.
            </li>
            <li>
              <strong>Avaliações:</strong> nome, classificação e comentário. As avaliações aprovadas
              podem ficar visíveis publicamente no site.
            </li>
            <li>
              <strong>Dados técnicos e de utilização:</strong> páginas visitadas, dispositivo,
              navegador, origem da visita, parâmetros de campanha e outros identificadores técnicos
              disponibilizados pelas ferramentas de análise utilizadas.
            </li>
          </ul>
          <p className="mt-3">
            O site não recolhe dados de cartões bancários. A confirmação da encomenda e a combinação
            do método de pagamento são feitas diretamente com o cliente.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">3. Para que utilizamos os dados</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Criar e gerir contas de cliente e sessões autenticadas.</li>
            <li>Registar, preparar, acompanhar e entregar encomendas.</li>
            <li>Responder a pedidos de informação, reservas e contactos.</li>
            <li>Publicar e gerir avaliações enviadas pelos clientes.</li>
            <li>Manter o site seguro e perceber, de forma estatística, como é utilizado.</li>
            <li>Medir campanhas, quando as respetivas ferramentas estiverem configuradas e ativas.</li>
          </ul>
          <p className="mt-3">
            Estes tratamentos baseiam-se, conforme o caso, na execução de medidas pré-contratuais ou
            de um contrato, no cumprimento de obrigações legais, no interesse legítimo em gerir e
            proteger a loja ou no consentimento, quando este for legalmente necessário.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">4. Encomendas e contacto por WhatsApp</h2>
          <p className="mt-3">
            Ao finalizar uma encomenda, o site cria um resumo com os produtos, quantidades e total e
            abre o WhatsApp com essa mensagem. O cliente completa voluntariamente os dados necessários,
            como o nome, a ilha e o método de entrega. As reservas de produtos também abrem o WhatsApp
            com o nome e o tamanho do produto pretendido.
          </p>
          <p className="mt-3">
            A utilização do WhatsApp implica o tratamento de dados pela Meta/WhatsApp de acordo com as
            respetivas políticas. A Perfumaria 9 Ilhas apenas utiliza a informação recebida para responder,
            confirmar disponibilidade e tratar a encomenda ou reserva.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">5. Cookies e tecnologias semelhantes</h2>
          <p className="mt-3">O site utiliza ou pode utilizar as seguintes tecnologias:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Cookies de sessão:</strong> permitem manter o acesso à conta de cliente e à área
              administrativa. São cookies técnicos, protegidos contra acesso por JavaScript, e têm uma
              duração limitada.
            </li>
            <li>
              <strong>Armazenamento local do navegador:</strong> guarda o carrinho. Depois da respetiva
              autorização, pode também guardar a última data em que uma visita foi contabilizada e,
              quando existam, parâmetros de campanha.
            </li>
            <li>
              <strong>Google Analytics 4:</strong> é utilizado para medir visitas e utilização do site.
              A Google pode tratar identificadores técnicos e colocar cookies ou tecnologias semelhantes.
            </li>
            <li>
              <strong>Meta Pixel:</strong> o site contém integração com o Meta Pixel, que funciona apenas
              quando estiver configurado e ativo. Nesse caso, pode medir visualizações, contactos,
              adições ao carrinho e início da finalização, bem como associar parâmetros de campanha.
            </li>
          </ul>
          <p className="mt-3">
            Na primeira visita pode aceitar todos, rejeitar as tecnologias não essenciais ou escolher
            separadamente as categorias <strong>Necessários</strong>, <strong>Análise e estatísticas</strong>
            e <strong>Publicidade</strong>. Os necessários mantêm o carrinho, as sessões e a própria
            preferência de cookies e estão sempre ativos. O Google Analytics 4 e o contador interno só
            são ativados com autorização para análise; o Meta Pixel, os eventos Meta e a atribuição de
            campanhas só são ativados com autorização para publicidade.
          </p>
          <p className="mt-3">
            A escolha é guardada durante seis meses. Pode alterá-la a qualquer momento através de
            “Definições de cookies” no rodapé. Ao retirar uma autorização, o site bloqueia os eventos
            posteriores e procura apagar os cookies e dados locais não essenciais relacionados com essa
            categoria. Também pode gerir ou bloquear cookies nas definições do navegador; bloquear
            cookies técnicos pode impedir o funcionamento do início de sessão.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">6. Partilha de dados</h2>
          <p className="mt-3">
            Os dados apenas são partilhados quando necessário para prestar o serviço, cumprir obrigações
            legais ou operar o site. Isto pode incluir fornecedores de alojamento e infraestrutura técnica,
            Google para análise, Meta/WhatsApp para comunicações e medição quando ativa, e transportadores,
            como os CTT, quando o cliente escolhe envio.
          </p>
          <p className="mt-3">
            Alguns destes fornecedores podem tratar dados fora do Espaço Económico Europeu, aplicando os
            mecanismos de proteção previstos na legislação e nas respetivas políticas de privacidade.
            A Perfumaria 9 Ilhas não vende dados pessoais.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">7. Conservação e segurança</h2>
          <p className="mt-3">
            Conservamos os dados apenas durante o tempo necessário para as finalidades indicadas e para
            cumprir obrigações legais, fiscais, contabilísticas ou de defesa de direitos. Os dados da conta
            são mantidos enquanto a conta estiver ativa ou forem necessários; as encomendas durante os
            prazos legalmente aplicáveis; e as avaliações até serem removidas ou deixar de ser necessária
            a sua publicação.
          </p>
          <p className="mt-3">
            Aplicamos medidas técnicas e organizativas adequadas, incluindo palavras-passe armazenadas de
            forma criptograficamente protegida e cookies de sessão com proteção contra acesso por scripts.
            Nenhum sistema é totalmente isento de risco, mas procuramos limitar o acesso aos dados ao que
            é necessário.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">8. Os seus direitos</h2>
          <p className="mt-3">
            Nos termos da legislação aplicável, pode pedir acesso, retificação, apagamento, limitação do
            tratamento, portabilidade ou opor-se ao tratamento. Pode também retirar o consentimento a
            qualquer momento, quando o tratamento depender dele, sem afetar a utilização anterior.
          </p>
          <p className="mt-3">
            Para exercer estes direitos, contacte-nos através de{" "}
            <Link className="font-semibold text-[color:var(--atlantic)] underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </Link>
            . Poderemos pedir informação necessária para confirmar a identidade do titular. Tem ainda o
            direito de apresentar reclamação à{" "}
            <Link
              className="font-semibold text-[color:var(--atlantic)] underline"
              href="https://www.cnpd.pt/"
              target="_blank"
              rel="noreferrer"
            >
              Comissão Nacional de Proteção de Dados
            </Link>
            .
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-2xl text-[color:var(--ink)]">9. Alterações a esta política</h2>
          <p className="mt-3">
            Esta política pode ser atualizada para refletir alterações legais ou no funcionamento do site.
            A versão mais recente estará sempre disponível nesta página, com a respetiva data de atualização.
          </p>
        </section>
      </div>
    </main>
  );
}
