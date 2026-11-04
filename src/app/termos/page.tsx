import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export const metadata: Metadata = {
  title: 'Termos de Uso | RKT',
  description:
    'Termos de uso da plataforma RKT: elegibilidade, conta, proteção de dados, transmissão ao vivo de menores e legislação aplicável.',
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-start mb-8">
          <BrandLogo size="md" priority />
        </div>

        <h1 className="text-2xl font-bold mb-6">Termos de Uso</h1>

        <article className="prose prose-sm max-w-none">
          <p className="mb-4">
            Estes Termos de Uso regulam o acesso e a utiliza&ccedil;&atilde;o da plataforma RKT Tennis
            (doravante &quot;RKT&quot;), aplicativos, sites e servi&ccedil;os relacionados.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Aceite dos Termos</h2>
          <p className="mb-4">
            Ao criar uma conta ou utilizar o RKT, o usu&aacute;rio declara ter lido, compreendido
            e concordado integralmente com estes Termos de Uso e com a Pol&iacute;tica de Privacidade.
            O cadastro s&oacute; ser&aacute; conclu&iacute;do mediante aceite expresso das cl&aacute;usulas contratuais.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. Elegibilidade</h2>
          <p className="mb-4">
            O uso da plataforma &eacute; destinado a pessoas com capacidade legal para contratar.
            Usu&aacute;rios menores de 18 anos devem ser representados por respons&aacute;vel legal, que
            dever&aacute; conferir consentimento expl&iacute;cito para tratamento de dados e transmiss&atilde;o
            ao vivo, conforme LGPD (Lei 13.709/2018) e ECA Digital (Lei 15.211/2025).
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. Conta e Cadastro</h2>
          <p className="mb-4">
            O usu&aacute;rio &eacute; respons&aacute;vel por manter seus dados de cadastro atualizados e por
            a confidencialidade de suas credenciais de acesso. O RKT n&atilde;o se responsabiliza
            por acessos indevidos decorrentes de neglig&ecirc;ncia do usu&aacute;rio.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Prote&ccedil;&atilde;o de Dados Pessoais</h2>
          <p className="mb-4">
            O RKT trata dados pessoais em conformidade com a LGPD. O usu&aacute;rio pode a qualquer
            momento solicitar acesso, corre&ccedil;&atilde;o, anonimiza&ccedil;&atilde;o ou exporta&ccedil;&atilde;o de seus dados
            atrav&eacute;s dos canais previstos na Pol&iacute;tica de Privacidade.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Transmiss&atilde;o ao Vivo de Menores</h2>
          <p className="mb-4">
            Nomes de atletas menores de 18 anos s&oacute; ser&atilde;o exibidos em transmiss&otilde;es ao vivo
            com consentimento expresso do respons&aacute;vel legal para a finalidade
            <code>BROADCAST</code>. Sem esse consentimento, o nome ser&aacute; mascarado
            (ex.: &quot;A. S&quot;.).
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Modifica&ccedil&otilde;es dos Termos</h2>
          <p className="mb-4">
            O RKT poder&aacute; atualizar estes Termos a qualquer momento. Altera&ccedil;&otilde;es relevantes
            ser&atilde;o comunicadas aos usu&aacute;rios e o uso cont&iacute;nuo da plataforma implica aceita&ccedil;&atilde;o
            da nova vers&atilde;o.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Legisla&ccedil;&atilde;o Aplic&aacute;vel</h2>
          <p className="mb-4">
            Estes Termos s&atilde;o regidos pela legisla&ccedil;&atilde;o da Rep&uacute;blica Federativa do Brasil.
          </p>

          <p className="mt-8 text-sm text-telemetry-text-muted">
            Vers&atilde;o dos termos: 1.0 &bull; Atualizado em: 31/10/2026
          </p>
        </article>

        <div className="mt-10 pt-6 border-t border-telemetry-border/10 flex justify-between items-center">
          <Link href={"/privacidade" as any} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline text-sm font-medium">
            Pol&iacute;tica de Privacidade
          </Link>
          <Link href={"/" as any} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline text-sm font-medium">
            Voltar ao in&iacute;cio
          </Link>
        </div>
      </div>
    </main>
  );
}
