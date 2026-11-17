# Termo de Uso da Plataforma — RKT

Versão 2.0 · Vigência a partir de [Data de Publicação] · Atualizada em 17/11/2026

## Resumo em um minuto

- O RKT é uma plataforma para anotação em tempo real, acompanhamento e análise estatística de partidas de tênis. Ao utilizar a plataforma, você declara ter lido e aceito este Termo.
- Cada usuário atua com perfis específicos: Gestor de Clube/CT, Treinador de CT, Treinador Particular/Autônomo, Atleta, Anotador, Responsável Legal ou Espectador.
- **Centros de Treinamento (CTs):** São os Controladores dos dados dos atletas e partidas que cadastram institucionalmente. O RKT atua como Operador para viabilizar as ferramentas de anotação desportiva e como Controlador para as contas de acesso, segurança e geração de estatísticas agregadas e anonimizadas.
- **Treinadores Particulares / Autônomos:** Não realizam cadastro de atletas menores de 18 anos na plataforma (bloqueio por design). Menores de idade participam via CT ou por autocadastro familiar prévio.
- **Proteção Rigorosa de Menores:** Atletas menores de 18 anos operam sob **monotutela estrita** (1 único responsável legal ativo). Em qualquer compartilhamento externo ou feed ao vivo para espectadores, o nome de menores é **obrigatoriamente randomizado (ex.: *"Atleta #8F2A7B"* / *"Atleta #XXXXXX"*)**, impedindo reidentificação.
- Dúvidas, solicitações e atendimento de direitos: Encarregado pelo Tratamento de Dados Pessoais (DPO), pelo e-mail: **suporte@omni-sistemas.com**.

---

## 1. Aceite e Documentos Vinculados

1.1. Ao criar uma conta, ao acessar ou ao utilizar a plataforma RKT, você declara ter capacidade legal para contratar e manifesta adesão integral e irrestrita a este Termo de Uso.

1.2. Fazem parte integrante e indissociável deste Termo, devendo ser lidos conjuntamente:
- A [Política de Privacidade Geral](POLITICA_DE_PRIVACIDADE.md);
- A [Política de Privacidade para Menores](POLITICA_DE_PRIVACIDADE_MENORES.md);
- O [Termo de Consentimento dos Responsáveis](/termos/responsavel), aplicável à tutela de atletas menores de 18 anos.

1.3. O aceite das versões dos documentos é registrado de forma auditável e imutável pelo sistema (`AuditLog` e `ConsentRecord`), armazenando identificador do usuário, versão dos termos (`2.0`), hash SHA-256 do conteúdo aceito (`contentHash`), IP ofuscado e timestamp UTC para fins de prova jurídica.

---

## 2. Definições

| Termo | Significado |
| :--- | :--- |
| **Plataforma / RKT** | O aplicativo web, APIs, sites e sistemas tecnológicos operados por **BE SMART LTDA** (CNPJ nº 55.405.487/0001-84, Curitiba/PR). |
| **Centro de Treinamento (CT)** | Academia, clube, federação ou centro esportivo de tênis devidamente cadastrado na Plataforma. |
| **Gestor** | Usuário administrador que representa legalmente e gerencia as atividades de um CT na Plataforma. |
| **Treinador de Clube** | Treinador desportivo vinculado institucionalmente a um CT cadastrado. |
| **Treinador Particular / Autônomo** | Profissional de tênis que atua de forma autônoma fora da estrutura institucional de um CT. |
| **Atleta** | Praticante de tênis que disputa partidas registradas na Plataforma, com ou sem conta de acesso individual. |
| **Anotador** | Usuário credenciado responsável por registrar pontos, games, sets, comentários e notas de áudio durante uma partida. |
| **Responsável Legal** | Pai, mãe ou tutor legal civilmente responsável por atleta menor de 18 anos. |
| **Espectador** | Usuário autorizado a acompanhar lances e pontuações de uma partida em modo exclusivo de leitura. |
| **Pool de Atletas** | Funcionalidade opcional e voluntária (`poolVisible`) que permite a busca e descoberta de perfis de atletas entre clubes por código público (`athleteCode`) ou apelido (`nickname`). |

---

## 3. Elegibilidade e Condições de Uso

3.1. **Capacidade Civil:** A utilização das funcionalidades operacionais da Plataforma é destinada a pessoas naturais plenamente capazes ou a pessoas jurídicas regularmente constituídas.

3.2. **Participação de Menores:** Atletas menores de 18 anos participam estritamente como titulares de ficha desportiva, dependendo de autorização prévia, expressa e soberana de seu responsável legal para ativação de conta ou acompanhamento, nos moldes do **ECA Digital (Lei nº 15.211/2025)** e do Art. 14 da LGPD.

3.3. **Cadastro Institucional do CT:** O Gestor declara possuir poderes de representação estatutária para vincular o CT a este Termo, respondendo por dados verdadeiros prestados sobre a entidade e seu corpo técnico.

3.4. **Atuação do Treinador Autônomo:** O treinador autônomo atua como pessoa física em nome próprio e responde pessoalmente pela veracidade de suas atividades desportivas, **sendo expressamente vedada a coleta ou cadastro direto de atletas menores de idade por este perfil**.

---

## 4. Conta, Credenciais e Segurança

4.1. **Identificação e Login:** O acesso à conta é pessoal e intransferível. O CPF é utilizado como chave primária de identificação unívoca para prevenir duplicidades cadastrais.

4.2. **Credenciais Temporárias e Senhas:** Senhas são armazenadas exclusivamente através de funções de hash criptográfico irreversível e de alta entropia. Senhas provisórias geradas pelo sistema para ativação de contas são aleatórias, seguras (mínimo de 12 caracteres) e entregues de forma privada ao titular por link de ativação, devendo ser alteradas no primeiro acesso.

4.3. **Dever de Guarda e Notificação:** O usuário é o único responsável pela guarda de sua senha. Qualquer suspeita de comprometimento de credenciais deve ser comunicada imediatamente ao RKT para invalidação preventiva da sessão (`sessionVersion`).

---

## 5. Perfis de Acesso e Isolamento de Dados

5.1. A Plataforma opera sob controle rigoroso de acesso baseado em funções (RBAC) e arquitetura *multi-tenant*, garantindo que os dados de um CT permaneçam estritamente isolados de outras agremiações e de treinadores autônomos:

| Perfil | Escopo de Acesso | Limitações Estritas |
| :--- | :--- | :--- |
| **Gestor de CT** | Administra atletas e treinadores vinculados ao seu CT; visualiza e anota todas as partidas de sua agremiação. | Restrito estritamente à entidade esportiva que gerencia. |
| **Treinador de CT** | Visualiza e anota partidas de atletas de sua turma ou onde possua vínculo desportivo ativo. | Sem acesso a turmas ou dados desportivos de outros CTs. |
| **Treinador Autônomo** | Cadastra e anota partidas exclusivamente para atletas adultos que acompanhe de forma particular. | **Bloqueio por design:** Não cadastra atletas menores de 18 anos. |
| **Atleta** | Acompanha seu próprio histórico desportivo, relatórios de evolução e telemetria de pontos. | Não edita notas técnicas de terceiros; atleta menor opera com proteção parental. |
| **Anotador** | Registra pontos, comentários lícitos e notas técnicas de áudio em partidas autorizadas. | Não altera configurações cadastrais de clubes ou atletas. |
| **Responsável Legal** | Fiscaliza partidas do dependente menor, gerencia consentimentos e acessa o painel parental (`/responsavel`). | Monotutela estrita: 1 único responsável ativo por menor. |
| **Espectador** | Acompanha telemetria e pontuação de partidas mediante link ou convite autorizado. | Modo estrito de leitura; nomes de menores exibidos compulsoriamente como `Atleta #XXXXXX`. |

---

## 6. Papéis de Tratamento e Governança perante a LGPD

6.1. **Papel de Controlador do CT:** O Centro de Treinamento é o Controlador dos dados de atletas vinculados institucionalmente e partidas que cadastra, cabendo-lhe definir as finalidades e garantir base legal legítima perante os atletas e seus responsáveis.

6.2. **Papel de Operador do RKT:** O RKT atua na qualidade de Operador técnico para os dados gerenciados pelo CT, tratando-os sob as instruções contratuais estabelecidas neste Termo e no Termo de Uso. O RKT atua como Controlador autônomo exclusivamente para a segurança das contas, auditoria de acesso e geração de modelos estatísticos analíticos agregados e anonimizados.

6.3. **Obrigações do Centro de Treinamento:** O CT se compromete a:
- Cadastrar apenas atletas que possuam vínculo efetivo desportivo com a agremiação;
- Informar formalmente os atletas e responsáveis sobre a utilização do RKT e disponibilizar as Políticas de Privacidade aplicáveis;
- Atestar a conferência de documentos oficiais no cadastramento presencial de menores de idade, informando o contato de WhatsApp/telefone verídico do responsável;
- Abster-se terminantemente de inserir dados de saúde (diagnósticos médicos de lesões) em campos abertos de anotação;
- Atender com presteza e repassar ao RKT eventuais requisições de titulares de dados;
- Revogar imediatamente o acesso de treinadores ou funcionários desvinculados do CT.

6.4. **Saída do Atleta e Integridade Desportiva:** Ao término do vínculo entre atleta e CT, os registros e pontos das partidas disputadas permanecem arquivados na base do clube e na plataforma, garantindo a integridade dos históricos esportivos dos adversários. Em caso de solicitação de eliminação por atleta ou responsável, aplica-se **anonimização irreversível dos dados civis**, preservando a pontuação técnica neutra da partida.

6.5. **Responsabilidade e Regresso:** O CT e os treinadores respondem diretamente por danos materiais, morais ou sanções administrativas decorrentes de inserção de dados ilegítimos, falsos ou não autorizados na Plataforma, assegurado ao RKT direito de regresso integral.

---

## 7. Proteção Especial de Menores de 18 Anos (ECA Digital)

7.1. O cadastro e a operação desportiva de atletas menores de 18 anos são subordinados ao **ECA Digital (Lei nº 15.211/2025)** e ao Art. 14 da LGPD.

7.2. **Tríade de Autorizações do Responsável Legal:**
1. **`DATA` (Obrigatória):** Gestão desportiva, registro de pontos e acompanhamento técnico pelo CT;
2. **`BROADCAST` (Opcional):** Transmissão e compartilhamento ao vivo com o público externo, **sob a salvaguarda inegociável de anonimização obrigatória do nome (`Atleta #XXXXXX`)**;
3. **`STATS` (Opcional):** Inclusão em métricas e modelos comparativos da plataforma, sob a salvaguarda de amostra mínima de segurança ($N \ge 10$).

7.3. **Prazos do Convite e Travas:** Se o responsável legal não validar o convite de tutela (`GuardianInvite`) em até 72 horas, o menor permanece impossibilitado de ser escalado para novas partidas. Sem validação em até 30 dias, os dados pré-cadastrais são permanentemente anonimizados ou expurgados.

7.4. **Regra de Continuidade da Partida:** Se um consentimento for revogado enquanto uma partida estiver em quadra, o cômputo dos pontos daquele jogo é levado até o final para não lesar o adversário, ativando imediatamente a anonimização visual para espectadores e bloqueando novos agendamentos.

---

## 8. Regras de Conteúdo, Anotação e Notas de Áudio

8.1. **Fidelidade Técnica:** Os anotadores devem registrar a pontuação com estrita boa-fé e veracidade. Todas as edições e correções de placar ficam catalogadas em trilha de auditoria auditável (`MatchScoreEdit`).

8.2. **Notas de Áudio e Comentários:** O recurso de gravação de voz destina-se exclusivamente a apontamentos táticos e desportivos de curta duração.
- É expressamente vedado gravar conversas de terceiros, proferir ofensas, calúnias, discriminações ou capturar áudios de conteúdo sensível.
- Notas de áudio **nunca são disponibilizadas para links públicos ou espectadores**.
- É garantido ao atleta e ao responsável legal o direito de pleitear a **exclusão isolada de notas de áudio ou comentários (`clearAudioNote`)**, preservando-se os pontos disputados.

8.3. **Licença de Uso de Dados Técnicos:** O usuário outorga à Plataforma licença gratuita, não exclusiva e irrevogável para processar os dados técnicos das partidas para as finalidades de operação, cálculo de rankings e elaboração de estatísticas agregadas nos termos da Política de Privacidade.

---

## 9. Pool Público de Atletas (Opt-in)

9.1. A participação no Pool Global de Atletas é estritamente voluntária e opera por **opt-in explícito (`poolVisible`)**, mantendo-se oculta por padrão (*privacy by default*).

9.2. Uma vez ativado pelo atleta maior ou pelo responsável legal de menor, o perfil esportivo passa a ser localizável por outros CTs e treinadores através do código público (`athleteCode`) ou apelido (`nickname`), sem exposição pública de documentos civis (CPF), dados de contato ou endereço.

---

## 10. Condutas Proibidas

10.1. É terminantemente proibido:
- Praticar engenharia reversa, descompilação, *scraping* ou extração automatizada de dados em massa da Plataforma;
- Tentar violar barreiras de segurança, burlar gates de tutela ou injetar códigos maliciosos;
- Cadastrar dados civis falsificados ou forjar parentesco legal em relação a atletas menores;
- Utilizar informações de atletas ou partidas para fins comerciais, publicitários ou de apostas não autorizadas;
- Praticar assédio, ofensas ou intimidações contra qualquer usuário ou atleta.

10.2. A infração sujeita o infrator ao encerramento sumário de sua conta, cancelamento de acessos do CT e responsabilização civil e criminal.

---

## 11. Condições de Disponibilidade e Planos Comerciais

11.1. O RKT emprega melhores práticas para assegurar alta disponibilidade da infraestrutura. A Plataforma disponibiliza tecnologia de contingência offline no navegador para garantir que anotações em quadras sem sinal sejam sincronizadas com segurança quando restabelecida a conexão.

11.2. **Fase de Lançamento e Condições Comerciais:** Os serviços operam atualmente nas condições estabelecidas na adesão institucional inicial. Quaisquer implementações de novos módulos pagos, planos de assinatura ou taxas de serviço serão informadas previamente com clareza aos CTs e usuários, não havendo cobranças surpresa ou retroativas (Art. 51 do CDC).

---

## 12. Propriedade Intelectual

12.1. O software RKT, código-fonte, arquitetura, marcas, logotipos, telas, design system e algoritmos são de titularidade exclusiva da **BE SMART LTDA**, protegidos pela Lei de Software (Lei nº 9.609/1998) e pela Lei de Direitos Autorais (Lei nº 9.610/1998). É concedida ao usuário licença temporária, revogável e não transferível para fruição do serviço nos estritos termos deste instrumento.

---

## 13. Suspensão, Encerramento e Rescisão

13.1. O usuário pode requerer o encerramento de sua conta a qualquer momento pelas configurações do sistema.

13.2. O RKT reserva-se o direito de suspender ou rescindir preventivamente o acesso de qualquer usuário ou CT em caso de suspeita fundada de fraude, violação das normas do ECA Digital, quebra de segurança ou inadimplemento contratual grave.

---

## 14. Atualizações deste Termo

14.1. Este Termo poderá sofrer revisões periódicas para aprimoramento de recursos, adequação técnica ou cumprimento de novas normas regulatórias.

14.2. Alterações substanciais serão comunicadas aos usuários por aviso em destaque na Plataforma ou notificação de serviço, colhendo-se novo aceite para a versão atualizada antes da liberação do próximo acesso.

---

## 15. Legislação Aplicável e Foro de Eleição

15.1. Este Termo de Uso é interpretado e regido pelas leis da República Federativa do Brasil, em especial pela Lei nº 12.965/2014 (Marco Civil da Internet), pelo Decreto nº 8.771/2016, pela Lei nº 13.709/2018 (LGPD) e pela Lei nº 15.211/2025 (ECA Digital).

15.2. Fica eleito o foro da **Comarca de Curitiba, Estado do Paraná**, como o competente para dirimir quaisquer litígios decorrentes deste Termo, sem prejuízo da aplicação do foro protetivo do domicílio do consumidor quando cabível.

15.3. **Canais de Atendimento e Encarregado:**  
- **Suporte Geral e Atendimento:** **suporte@omni-sistemas.com**  
- **Encarregado pelo Tratamento de Dados Pessoais (DPO):** **suporte@omni-sistemas.com**
