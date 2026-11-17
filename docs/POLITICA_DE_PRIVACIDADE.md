# Política de Privacidade Geral — RKT

Versão 2.0 · Vigência a partir de [Data de Publicação] · Atualizada em 17/11/2026

## Resumo em um minuto

- O RKT é uma plataforma para anotação em tempo real, acompanhamento e análise estatística de partidas de tênis.
- Guardamos dados de cadastro da sua conta, informações de atletas (nome, CPF e data de nascimento), ações e estatísticas das partidas, comentários e, opcionalmente, notas de áudio gravadas pelo anotador.
- Não coletamos biometria, imagens, vídeos, geolocalização contínua nem dados de saúde.
- Centros de Treinamento (CTs) são os Controladores dos dados dos atletas vinculados que cadastram institucionalmente. O RKT atua como Operador para a gestão do CT e como Controlador para as contas de usuário, segurança da plataforma e geração de estatísticas agregadas e anonimizadas.
- Treinadores particulares e autônomos não realizam cadastro de atletas menores de 18 anos.
- Atletas menores de idade operam sob **monotutela estrita**: o acesso regular depende da validação prévia de 1 (um) único responsável legal, com consentimentos específicos para operação esportiva (`DATA`), transmissão pública com **anonimização obrigatória** (`BROADCAST`) e estatísticas analíticas (`STATS`).
- Em qualquer link público ou acompanhamento por espectadores, o nome de atletas menores é **obrigatoriamente randomizado** (ex.: *"Atleta #8F2A"*), impedindo rastreamento ou cruzamento com cadastros federativos.
- Para exercer seus direitos de titular ou solicitar exclusão pontual de dados, fale com nosso Encarregado pelo e-mail: suporte@omni-sistemas.com.

---

## 1. Quem somos e quais são os papéis

1.1. O RKT é operado por BE SMART LTDA, pessoa jurídica de direito privado inscrita no CNPJ sob o nº 55.405.487/0001-84, com sede na Av. República Argentina, 2773, Curitiba/PR, CEP 81480-270 (“RKT”, “nós”).

1.2. De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD), os papéis de tratamento no ecossistema RKT são definidos conforme a finalidade e a relação jurídica:

| Situação | Quem decide sobre o uso dos dados | Papel do RKT |
| :--- | :--- | :--- |
| **Cadastro de atletas institucionais e partidas por um CT** | O Centro de Treinamento / Clube (o “Detentor / Controlador”) | **Operador**: trata os dados sob as instruções do CT e nos limites do Termo de Uso da Plataforma |
| **Cadastro de atletas maiores por Treinador Particular** | O Treinador Particular (o “Detentor / Controlador”) | **Operador**: armazena e disponibiliza ferramentas técnicas de anotação desportiva |
| **Conta de usuário, segurança, credenciais e auditoria** | RKT | **Controlador**: gerencia autenticação, controle de acessos e integridade técnica |
| **Estatísticas globais e melhoria contínua da plataforma** | RKT | **Controlador**: realiza tratamento mediante **anonimização e agregação estatística** ($N \ge 10$), onde os dados deixam de ser pessoais (Art. 12 da LGPD), ou sob consentimento específico para menores |
| **Atleta autônomo (sem CT)** | RKT e o próprio atleta (ou seu responsável legal) | **Controlador**: o titular ou responsável gerencia e exerce seus direitos diretamente com o RKT |

1.3. O CT contratante é responsável por informar seus atletas, definir a base legal adequada e garantir a legitimidade da inserção dos dados na plataforma, respondendo civilmente e administrativamente por descumprimentos de suas obrigações como Controlador.

1.4. **Encarregado pelo Tratamento de Dados Pessoais (DPO):**  
- **Identificação:** Encarregado de Proteção de Dados da BE SMART LTDA  
- **Canal de Atendimento:** suporte@omni-sistemas.com  
*(Atendimento em conformidade com o art. 41 da LGPD e regulamentações da ANPD).*

---

## 2. Dados que tratamos

2.1. Tratamos as seguintes categorias de dados pessoais:

| Categoria | Dados Pessoais Tratados | Origem da Coleta |
| :--- | :--- | :--- |
| **Conta de usuário** | Nome, e-mail, CPF (identificador para login), credencial criptografada (hash irreversível de senha), perfil de acesso, clube vinculado, timestamps de criação e último acesso | Do próprio titular ou do CT que emitiu o convite |
| **Cadastro de atleta** | Nome civil, CPF, data de nascimento, gênero/sexo, e-mail (opcional), clube/CT, cidade, UF, mão dominante, tipo de backhand, rankings, código público do atleta (`athleteCode`), apelido público opcional (`nickname`) e status de visibilidade no pool | Informado pelo atleta, seu responsável legal ou pelo CT |
| **Dados de partidas e telemetria desportiva** | Placar, games, sets, tiebreaks, ações técnicas do ponto (sacador, tipo de golpe, erros, winners), histórico de correções de placar, comentários textuais e notas de áudio gravadas pelo anotador | Registrado em tempo real pelos anotadores e usuários autorizados em quadra |
| **Notas de áudio** | Gravações de voz de curta duração gravadas pelo anotador para descrever jogadas ou notas técnicas do ponto | Captado pelo microfone do dispositivo do anotador durante a partida |
| **Responsáveis por menores** | Nome completo, CPF, e-mail, data de nascimento, telefone / WhatsApp com DDD, grau de parentesco e registros auditáveis de aceite e outorga de consentimento | Informado pelo responsável no processo de validação de tutela ou pré-cadastrado pelo CT |
| **Acompanhamento de partidas** | Vínculo do espectador (convite autenticado ou link público), horário de conexão e telemetria da sessão | Coletado automaticamente do dispositivo espectador |
| **Segurança e auditoria** | Endereço IP, timestamps de requisições, identificador ofuscado em tentativas de login, logs de auditoria imutáveis de ações sensíveis (criação, edição, revogação de consentimento, exclusão) | Gerado automaticamente pela infraestrutura do sistema |

2.2. **Dados Sensíveis e Biometria:** Não coletamos dados biométricos, imagens faciais, vídeos de quadra, geolocalização contínua nem dados sensíveis de saúde, convicção religiosa, filiação política ou dados genéticos. As notas de áudio capturam unicamente a voz do anotador como anotação do lance e **não são submetidas a qualquer processamento de reconhecimento biométrico vocal ou perfilamento comportamental**.

2.3. **Prevenção em Campos Livres e Notas de Áudio:** Solicitamos aos anotadores e usuários que não incluam dados médicos ou de saúde (como diagnósticos detalhados de lesões) nos comentários ou notas de voz. Caso um registro contenha informações sensíveis por equívoco, o titular ou responsável poderá requerer a **exclusão pontual da nota de áudio ou do comentário**, mantendo a integridade estritamente desportiva da pontuação da partida.

2.4. **Pool Público de Atletas:** O atleta (ou seu responsável legal, no caso de menores) poderá ativar voluntariamente a opção de visibilidade no Pool de Atletas (`poolVisible`). Esta funcionalidade permite que outros clubes ou treinadores localizem o perfil desportivo do atleta por meio do código único (`athleteCode`) ou apelido (`nickname`), sem exposição pública de documentos ou dados de contato civil.

---

## 3. Para que usamos os dados e em que base legal

3.1. O tratamento de dados pessoais no RKT é estritamente fundamentado nas hipóteses autorizativas da LGPD e nas diretrizes do **ECA Digital (Lei nº 15.211/2025)** e do **Enunciado CD/ANPD nº 1/2023**:

| Finalidade | Base Legal (LGPD) | Salvaguarda Aplicada |
| :--- | :--- | :--- |
| **Criar e administrar contas, autenticar usuários e viabilizar o uso do app** | Execução de contrato (art. 7º, V) | Senhas em hash irreversível, autenticação segura e sessões invalidadas remotamente |
| **Registrar, computar pontos e armazenar o histórico desportivo no CT** | Execução de contrato (art. 7º, V) ou Legítimo interesse (art. 7º, IX) | Isolamento rigoroso multi-tenant entre CTs; controle de perfis de acesso |
| **Tratamento de dados de atletas menores de 18 anos no CT (`DATA`)** | Consentimento específico do responsável (art. 14, § 1º) e Melhor interesse do menor (art. 14, caput) | Validação via wizard de tutela; bloqueio de operação desportiva sem autorização prévia ativa |
| **Transmissão e compartilhamento de partidas para espectadores (`BROADCAST`)** | Legítimo interesse com direito de oposição para adultos (art. 7º, IX); Consentimento específico do responsável para menores (art. 14, § 1º) | **Anonimização obrigatória para menores (`Atleta #XXXX`)** para qualquer visualizador externo, link público ou espectador |
| **Pool estatístico e aprimoramento da plataforma (`STATS`)** | Legítimo interesse sobre dados anonimizados (art. 12); Consentimento do responsável para inclusão de dados de menores | Amostra mínima de segurança ($N \ge 10$ partidas/atletas); impossibilidade de reidentificação individual |
| **Segurança cibernética, prevenção a fraudes e auditoria de ações** | Legítimo interesse (art. 7º, IX) e Cumprimento de obrigação legal (art. 7º, II) | Logs imutáveis em auditoria; limitação de taxa de requisições contra força bruta |
| **Guarda obrigatória de registros de conexão e acesso a aplicações** | Cumprimento de obrigação legal (art. 7º, II; Marco Civil da Internet, art. 15) | Retenção segura de registros de IP, data e hora pelo prazo mínimo de 6 meses |
| **Atendimento a direitos dos titulares e defesa jurídica** | Obrigação legal (art. 7º, II) e Exercício regular de direitos em processo (art. 7º, VI) | Histórico de manifestações e logs de auditoria de consentimento |

3.2. **Compromisso de Não Comercialização:** O RKT não vende, não aluga, não compartilha dados pessoais com corretores de dados (*data brokers*) e não utiliza informações da plataforma para publicidade comportamental de terceiros.

3.3. **Decisões Automatizadas:** A plataforma gera estatísticas puramente desportivas a partir dos pontos anotados em quadra. Não realizamos tomadas de decisão unicamente automatizadas que produzam efeitos jurídicos ou que afetem de forma relevante os direitos dos titulares (Art. 20 da LGPD).

---

## 4. Compartilhamento e Acesso a Dados

4.1. **Círculo Restrito do CT e Usuários Autorizados:** Os dados de partidas e treinos são acessíveis exclusivamente aos gestores e treinadores com vínculo ativo com o atleta no CT, além dos próprios atletas em quadra.

4.2. **Espectadores e Links Públicos de Partida:** Usuários que acompanham partidas ao vivo via link ou QR code visualizam apenas placar, games e telemetria da partida.
- **Proteção Absoluta de Menores:** O nome civil de qualquer atleta menor de idade é **obrigatoriamente substituído por um pseudônimo aleatório e estável por partida (ex.: "Atleta #8F2A")**.
- CPF, e-mail, telefones e notas de áudio **nunca** são transmitidos ou disponibilizados para espectadores ou links compartilhados.

4.3. **Acesso do Suporte Operacional:** O acesso da equipe técnica do RKT a dados sob custódia de CTs é de exceção, submetido a aprovação prévia, justificado formalmente e registrado em log de auditoria imutável (`SupportAccessRequest`).

4.4. **Provedores de Infraestrutura e Subprocessadores:** Operamos com infraestrutura moderna de nível empresarial:
- **Vercel Inc.:** Hospedagem e execução da aplicação web.
- **Neon Inc.:** Banco de dados relacional gerenciado (servidores localizados na região de São Paulo/Brasil, onde residem os dados estruturados e os binários de notas de áudio).
- **Serviços de E-mail e Mensageria de Serviço:** Provedores de infraestrutura em nuvem contratados estritamente para entrega de e-mails transacionais e notificações essenciais de serviço (como confirmação de conta, recuperação de senha e avisos de tutela parental aos responsáveis), vedado qualquer uso para marketing ou compartilhamento não autorizado.

4.5. **Requisições de Autoridades:** Compartilharemos dados pessoais estritamente quando compelidos por lei, decisão judicial ou ordem formal de autoridade pública competente, no limite estrito do que for exigido.

---

## 5. Transferência Internacional de Dados

5.1. Determinados serviços de infraestrutura técnica em nuvem (como a plataforma Vercel) podem processar dados ou rotear tráfego em servidores localizados fora do território brasileiro.

5.2. Toda transferência internacional observa rigorosamente o Art. 33 da LGPD e as normas da ANPD (Resolução CD/ANPD nº 19/2024), mediante a celebração de acordos de tratamento de dados (*Data Processing Agreements*) contendo cláusulas-padrão contratuais ou garantias equivalentes de segurança e confidencialidade.

---

## 6. Retenção e Ciclo de Vida dos Dados

6.1. Retemos os dados pessoais apenas pelo período necessário para atingir as finalidades para as quais foram coletados ou para satisfazer exigências legais e regulatórias:

| Categoria do Dado | Período de Retenção | Destinação ao Fim do Período |
| :--- | :--- | :--- |
| **Conta de usuário** | Enquanto ativa; até 30 dias após solicitação de encerramento | Anonimização irreversível dos dados civis |
| **Histórico desportivo de partidas** | Permanente na base do CT para fins desportivos e integridade do adversário | Ao se desvincular ou solicitar exclusão, os dados civis do atleta são anonimizados; os dados dos jogos e pontos do adversário permanecem preservados de forma neutra |
| **Notas de áudio de partidas** | Vinculadas à partida correspondente | O titular ou anotador pode solicitar a exclusão pontual da nota a qualquer tempo |
| **Logs de acesso à aplicação** | 6 meses, no mínimo (Marco Civil da Internet, art. 15) | Expurgo automático programado |
| **Tentativas de login (IP e identificador)** | 90 dias | Expurgo seguro para análise de segurança |
| **Registros de tutela e consentimento de menores** | Até que o titular complete 18 anos, acrescido de 5 (cinco) anos | Arquivo para cumprimento de obrigação legal e comprovação de regularidade |
| **Cadastro provisório de menor sem validação** | Convite expira em 72 horas; uso bloqueado em 72h e dados cadastrais excluídos/anonimizados em 30 dias se não houver validação | Eliminação e expurgo definitivo da base |
| **Cópias de segurança (backups)** | Até 90 dias após geração do backup rotativo | Sobrescrita automática |

6.2. **Anonimização Irreversível:** Ao atender a pedidos de eliminação ou ao término dos prazos, os dados civis (nome, CPF, contatos) são anonimizados nos termos do Art. 16 da LGPD, impedindo que o titular seja reidentificado, mas garantindo que o histórico estatístico das partidas dos adversários não seja corrompido.

---

## 7. Seus Direitos como Titular de Dados

7.1. Em conformidade com o Art. 18 da LGPD, você (ou seu responsável legal) pode requerer a qualquer momento:
1. **Confirmação e Acesso:** Saber se tratamos seus dados e solicitar cópia dos mesmos;
2. **Correção:** Retificar dados incompletos, inexatos ou desatualizados;
3. **Anonimização, Bloqueio ou Eliminação:** De dados excessivos, desnecessários ou tratados em desconformidade com a LGPD;
4. **Portabilidade:** Obter relatório estruturado dos seus dados desportivos para migração para outro clube ou plataforma;
5. **Eliminação de Dados com Consentimento:** Excluir dados tratados exclusivamente com base no seu consentimento prévio;
6. **Exclusão Pontual de Mídias/Anotações:** Solicitar a remoção isolada de notas de áudio ou comentários sem anulação da partida;
7. **Informação sobre Compartilhamento:** Esclarecimentos sobre os terceiros e fornecedores com quem compartilhamos dados;
8. **Informação sobre Não Consentimento e Revogação:** Consequências de recusar consentimentos opcionais e facilidade de revogação.

7.2. **Canal e Procedimento:**  
- Os direitos podem ser exercidos diretamente pelas configurações da conta no aplicativo ou via requerimento ao Encarregado pelo e-mail: **suporte@omni-sistemas.com**.
- O atendimento é inteiramente gratuito. Poderemos solicitar documentação comprobatória básica para confirmar a identidade do requerente antes de divulgar dados sensíveis.

7.3. **Prazos de Atendimento:** Confirmamos a existência de tratamento em formato simplificado de forma imediata, e fornecemos declaração completa e conclusiva em até 15 (quinze) dias (ou nos prazos aplicáveis a Agentes de Pequeno Porte previstos pela ANPD).

7.4. **Dados Vinculados a Centros de Treinamento:** Quando a solicitação envolver dados sob o controle primário de um CT (ex.: relatórios internos de desempenho do clube), informaremos o Controlador responsável e colaboraremos para a efetivação dos direitos.

7.5. **Peticionamento à ANPD:** Você tem o direito de apresentar requerimentos perante a Autoridade Nacional de Proteção de Dados (ANPD) caso entenda que o tratamento viola a legislação.

---

## 8. Governança e Proteção Rigorosa de Menores (ECA Digital)

8.1. **Princípio do Melhor Interesse:** Todo o tratamento de dados de menores de 18 anos no RKT subordina-se à proteção integral e ao melhor interesse da criança e do adolescente (Art. 14 da LGPD e ECA Digital — Lei nº 15.211/2025).

8.2. **Regra de Monotutela Estrita:**  
- Cada atleta menor possui **exatamente 1 (um) único responsável legal ativo** na plataforma, eliminando conflitos de autorização concorrentes.
- O cadastro provisório de um menor por CT gera um convite seguro (`GuardianInvite`) com validade de 72 horas para que o responsável formalize o vínculo.

8.3. **Tríade de Autorizações do Responsável:**
- **Autorização 1 — Gestão Desportiva (`DATA` — Obrigatória):** Necessária para a criação do perfil do atleta, alocação em turmas e anotação técnica de jogos no CT.
- **Autorização 2 — Transmissão e Compartilhamento (`BROADCAST` — Opcional):** Permite o acompanhamento externo da partida, **com a garantia pétrea de anonimização do nome civil para qualquer terceiro (`Atleta #XXXX`)**.
- **Autorização 3 — Estatísticas Agregadas (`STATS` — Opcional):** Autoriza o cômputo dos dados em médias analíticas regionais com corte mínimo de segurança ($N \ge 10$), sem exposição individual.

8.4. **Bloqueio por Design para Treinadores Autônomos:** Treinadores particulares sem personalidade jurídica institucional de CT não possuem prerrogativa para assumir tutela cadastral de menores. Atletas menores treinam de forma particular mediante autocadastro familiar prévio com gate parental ativo.

8.5. **Regra Desportiva de Continuidade da Partida:** Em caso de revogação de consentimento durante o andamento de um jogo, os pontos da partida em disputa continuam sendo registrados até a finalização do match para preservar o resultado do adversário, aplicando-se de pronto o mascaramento visual do menor e bloqueando novas partidas futuras.

8.6. **Emancipação Automática aos 18 Anos:** No instante em que o jovem atinge a maioridade civil, a tutela parental é automaticamente convertida (`EMANCIPATED`), e o atleta passa a ser o único titular de seus consentimentos e direitos de gestão civil da conta.

---

## 9. Segurança da Informação e Gestão de Incidentes

9.1. Implementamos medidas técnicas e organizacionais rigorosas para proteção dos dados:
- Armazenamento de senhas e tokens de redefinição exclusivamente com funções de hash criptográfico irreversível e de alta entropia;
- Isolamento lógico e multi-tenant restrito entre clubes e centros de treinamento;
- Proteção contra ataques de força bruta e controle de rate limiting em rotas de autenticação;
- Registro auditável e imutável de todas as ações de concessão e revogação de consentimentos em conformidade probatória (`AuditLog`);
- Controle de acesso baseado em funções estritas (RBAC).

9.2. **Notificação de Incidentes:** Em conformidade com o Art. 48 da LGPD e com a Resolução CD/ANPD nº 15/2024, qualquer incidente de segurança relevante que possa acarretar risco ou dano aos titulares será comunicado à Autoridade Nacional de Proteção de Dados (ANPD) e aos usuários afetados no prazo regulamentar aplicável (em até 3 dias úteis a contar do conhecimento do evento).

---

## 10. Cookies e Armazenamento Local

10.1. **Cookies Estritamente Necessários:** Utilizamos cookies e tokens locais temporários estritamente necessários para viabilizar a autenticação segura do usuário, manter a sessão ativa e garantir proteção contra ataques de falsificação de requisições (CSRF).

10.2. **Armazenamento Offline (IndexedDB / LocalStorage):** Para viabilizar a anotação contínua de partidas mesmo em quadras com oscilação ou ausência de sinal de internet, armazenamos localmente no navegador do anotador a fila de pontos temporária para sincronização posterior com os servidores.

10.3. **Ausência de Rastreamento Publicitário:** Não utilizamos cookies analíticos invasivos de terceiros nem cookies de rastreamento para fins de propaganda comportamental.

---

## 11. Atualizações desta Política

11.1. Esta Política poderá ser atualizada periodicamente para acompanhar aprimoramentos de segurança, evolução das funcionalidades ou novas diretrizes regulatórias da ANPD.

11.2. As versões anteriores serão devidamente catalogadas e arquivadas. Quando houver alterações substanciais ou mudanças nas finalidades de tratamento, notificaremos os usuários por aviso destacado no aplicativo ou e-mail, colhendo novo consentimento quando legalmente exigido.

---

## 12. Legislação Aplicável e Foro

12.1. Este documento é interpretado e regido pelas leis da República Federativa do Brasil, em especial pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018), pelo Marco Civil da Internet (Lei nº 12.965/2014) e pelo ECA Digital (Lei nº 15.211/2025).

12.2. Fica eleito o foro da Comarca de Curitiba, Estado do Paraná, para dirimir quaisquer controvérsias oriundas desta Política, ressalvado o direito de o titular optar pelo foro do seu domicílio nos termos da legislação de defesa do consumidor.
