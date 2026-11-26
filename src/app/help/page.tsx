import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { perfilSlugForArea } from '@/core/help/help-perfil.logic';

/**
 * Landing da Central de Ajuda: redireciona para o conteúdo do perfil ativo,
 * resolvido pelos headers de `x-active-area` setados pelo middleware.
 * ADMIN/SUPORTE não têm conteúdo próprio e caem em `/dashboard`
 * (o roteamento de legado do middleware os leva à home da área).
 */
export default async function HelpLandingPage() {
  const requestHeaders = await headers();
  const area = requestHeaders.get('x-active-area');
  const slug = perfilSlugForArea(area);
  if (slug) redirect(`/help/${slug}`);
  redirect('/dashboard');
}
