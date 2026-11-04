import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export const metadata: Metadata = {
  title: 'Política de Privacidade | RKT',
  description:
    'Política de privacidade do RKT em conformidade com a LGPD: dados coletados, finalidades, direitos do titular, segurança e retenção.',
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-start mb-8">
          <BrandLogo size="md" priority />
        </div>

        <h1 className="text-2xl font-bold mb-6">Pol&iacute;tica de Privacidade</h1>

        <article className="prose prose-sm max-w-none">
          <p className="mb-4">
            Esta Pol&iacute;tica de Privacidade explica como o RKT coleta, usa, armazena e
            protege os dados pessoais de seus usu&aacute;rios, em conformidade com a LGPD
            (Lei 13.709/2018) e a ECA Digital (Lei 15.211/2025).
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Dados Coletados</h2>
          <p className="mb-4">
            Coletamos dados de cadastro (nome, e-mail, CPF, data de nascimento), dados de
            perfil esportivo (clube, ranking, partidas disputadas) e dados de uso da plataforma
            (endere&ccedil;o IP, logs de acesso, dispositivos).
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. Dados de Menores</h2>
          <p className="mb-4">
            Dados de menores de 18 anos s&atilde;o coletados apenas com consentimento do respons&aacute;vel
            legal. Nomes de menores s&atilde;o mascarados em exibi&ccedil;&otilde;es p&uacute;blicas salvo consentimento
            expl&iacute;cito para transmiss&atilde;o (&lt;code&gt;BROADCAST&lt;/code&gt;).
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. Finalidades</h2>
          <p className="mb-4">
            Os dados s&atilde;o utilizados para: (i) cria&ccedil;&atilde;o e gest&atilde;o de conta; (ii) agendamento e
            anota&ccedil;&atilde;o de partidas; (iii) acompanhamento ao vivo com consentimento; (iv)
            suporte e comunica&ccedil;&atilde;o com o usu&aacute;rio.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Compartilhamento</h2>
          <p className="mb-4">
            Dados de advers&aacute;rios em partidas s&atilde;o compartilhados apenas no contexto da
            partida disputada, com dados de contato e documentos minimizados. N&atilde;o vendemos
            dados pessoais a terceiros.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Seus Direitos (Art. 18 LGPD)</h2>
          <p className="mb-4">
            Voc&ecirc; pode a qualquer momento solicitar: confirma&ccedil;&atilde;o da exist&ecirc;ncia de dados,
            acesso, corre&ccedil;&atilde;o, anonimiza&ccedil;&atilde;o, bloqueio, elimina&ccedil;&atilde;o e portabilidade de seus
            dados. Use os canais de privacidade da plataforma para exercer esses direitos.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Seguran&ccedil;a</h2>
          <p className="mb-4">
            Adotamos medidas t&eacute;cnicas e administrativas adequadas para proteger seus dados
            contra acessos n&atilde;o autorizados, destrui&ccedil;&atilde;o, perda ou altera&ccedil;&atilde;o.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Reten&ccedil;&atilde;o</h2>
          <p className="mb-4">
            Dados s&atilde;o retidos enquanto necess&aacute;rios para as finalidades descritas ou para
            cumprir obriga&ccedil;&otilde;es legais. Ap&oacute;s o encerramento da conta, dados civis s&atilde;o
            anonimizados preservando o hist&oacute;rico esportivo.
          </p>

          <p className="mt-8 text-sm text-telemetry-text-muted">
            Vers&atilde;o da pol&iacute;tica: 1.0 &bull; Atualizado em: 31/10/2026
          </p>
        </article>

        <div className="mt-10 pt-6 border-t border-telemetry-border/10 flex justify-between items-center">
          <Link href={"/termos" as any} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline text-sm font-medium">
            Termos de Uso
          </Link>
          <Link href={"/" as any} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline text-sm font-medium">
            Voltar ao in&iacute;cio
          </Link>
        </div>
      </div>
    </main>
  );
}
