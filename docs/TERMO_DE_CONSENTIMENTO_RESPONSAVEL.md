# Termo de Consentimento do Responsável Legal — RKT

Versão 2.0 · Vigência a partir de [Data de Publicação] · Atualizada em 17/11/2026

Este Termo formaliza o consentimento específico, destacado e informado emitido pelo pai, pela mãe ou pelo tutor legal para o tratamento de dados pessoais de atleta menor de 18 anos na plataforma RKT, em estrito cumprimento ao **Art. 14, § 1º, da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)**, ao **ECA Digital (Lei nº 15.211/2025)** e às diretrizes do **Enunciado CD/ANPD nº 1/2023**.

Os campos entre chaves duplas `{{...}}` são preenchidos dinamicamente pela Plataforma no ato da emissão ou visualização do comprovante eletrônico de aceite.

---

## 1. Identificação das Partes e Tutela Civil

| Campo | Dado Cadastrado |
| :--- | :--- |
| **Atleta Menor — Nome Completo** | {{menor_nome}} |
| **Atleta Menor — CPF** | {{menor_cpf}} |
| **Atleta Menor — Data de Nascimento** | {{menor_nascimento}} |
| **Responsável Legal — Nome Completo** | {{responsavel_nome}} |
| **Responsável Legal — CPF** | {{responsavel_cpf}} |
| **Responsável Legal — Data de Nascimento** | {{responsavel_nascimento}} |
| **Responsável Legal — Grau de Parentesco** | {{responsavel_parentesco}} |
| **Responsável Legal — Telefone / WhatsApp** | {{responsavel_telefone}} |
| **Responsável Legal — E-mail** | {{responsavel_email}} |
| **Centro de Treinamento Vinculado (CT)** | {{detentor_nome}} |
| **Data e Hora UTC do Aceite** | {{data_hora_aceite}} |
| **Hash SHA-256 do Comprovante** | {{content_hash}} |
| **Versão Homologada deste Termo** | 2.0 |

1.1. **Controladoria Conjunta:** O tratamento dos dados desportivos no RKT opera sob regime de controladoria conjunta entre a operadora tecnológica da Plataforma (**BE SMART LTDA**, CNPJ nº 55.405.487/0001-84, Curitiba/PR) e o **Centro de Treinamento (CT)**, que atua na gestão esportiva local, alocação de turmas e conferência presencial preliminar de documentos.

1.2. **Regra de Monotutela Estrita:** O sistema admite **exatamente 1 (um) único responsável legal ativo** por atleta menor. Apenas o responsável vinculado tem poderes civis na Plataforma para autorizar, modificar ou revogar permissões do dependente.

---

## 2. A Tríade de Autorizações do Responsável Legal

O consentimento parental no RKT é estruturado de forma granular em **3 (três) autorizações distintas e auditáveis**:

### Autorização 1 — Gestão Desportiva e Operação no CT (`DATA`) [Obrigatória]
- **Finalidade:** Permite a criação do perfil esportivo do atleta menor, inclusão nas listas de treino do CT, anotação técnica de pontos de partidas e cálculo de rankings desportivos internos.
- **Caráter Obrigatório:** Sem esta autorização, o menor não pode ser cadastrado ou participar de partidas operadas pelo sistema.
- **Revogação:** Pode ser revogada a qualquer tempo. A revogação bloqueia a participação em novos jogos. Em caso de revogação durante partida em andamento, os pontos do jogo atual continuam sendo registrados até o encerramento do match para preservação da integridade do adversário, aplicando-se de imediato o mascaramento externo do menor.

### Autorização 2 — Transmissão e Compartilhamento de Partidas (`BROADCAST`) [Opcional]
- **Finalidade:** Autoriza o acompanhamento em tempo real dos lances e placares das partidas do menor por terceiros (familiares, amigos e torcida) via link público ou QR code.
- **Salvaguarda de Anonimização Obrigatória (`Atleta #XXXXXX`):** Em qualquer feed ao vivo, convite ou link público, **o nome civil do atleta menor é compulsoriamente substituído por um pseudônimo aleatório e estável por partida (ex.: *"Atleta #8F2A7B"* / *"Atleta #XXXXXX"*)**. Nenhum visualizador externo tem acesso ao nome verdadeiro, documentos, e-mail, telefone ou notas de áudio da criança.
- **Caráter Opcional:** A recusa não impede o atleta de treinar ou jogar normalmente no CT.

### Autorização 3 — Pool Estatístico da Plataforma (`STATS`) [Opcional]
- **Finalidade:** Autoriza a inclusão das ações de jogo do atleta em modelos analíticos e comparativos técnicos de desempenho desportivo agregados por categoria e tipo de piso.
- **Salvaguarda de Amostra Mínima ($N \ge 10$):** Nenhum dado é computado ou exibido em grupos inferiores a 10 jogos ou atletas, impedindo qualquer risco de reidentificação individual.
- **Vedações:** Não há perfilamento de consumo, publicidade direcionada nem decisões automatizadas de efeito excludente.

---

## 3. Dados Coletados e Tratados

3.1. **Ficha do Menor:** Nome civil completo, CPF, data de nascimento, gênero/sexo, clube/CT vinculado, cidade, UF, mão dominante (destro ou canhoto), tipo de backhand, rankings e código público do atleta (`athleteCode`).

3.2. **Ações Desportivas da Partida:** Placar, games, sets, tiebreaks, ações técnicas do ponto (sacador, tipo de golpe, erros, winners), histórico de correções de placar, comentários textuais e notas de áudio gravadas pelo anotador em quadra.

3.3. **Dados do Responsável:** Nome civil, CPF, data de nascimento, telefone/WhatsApp com DDD, e-mail e grau de parentesco comprovado.

3.4. **Não Coleta de Dados Sensíveis:** O RKT **não coleta biometria facial ou vocal, imagens em vídeo de quadra, geolocalização contínua nem dados médicos de saúde**.

3.5. **Proteção sobre Notas de Áudio:** O recurso de áudio destina-se apenas a notas técnicas curtas do anotador sobre os lances do jogo. Os áudios são guardados de forma restrita, **nunca são transmitidos a espectadores** e o responsável possui o direito expresso de requerer a **exclusão isolada de notas de áudio ou comentários (`clearAudioNote`)** a qualquer tempo.

---

## 4. Retenção de Dados e Guarda Probatória

4.1. **Histórico Esportivo:** Mantido na base de dados para histórico esportivo do CT. Em caso de desligamento ou requerimento de eliminação, aplica-se **anonimização irreversível** aos dados civis do jovem, mantendo-se os pontos técnicos da partida preservados de forma neutra para o adversário.

4.2. **Registros Técnicos de Consentimento:** Em cumprimento a obrigações legais e regulatórias perante a ANPD, os registros eletrônicos comprobatórios de outorga de consentimento (`ConsentRecord`, `ConsentEvent` e `AuditLog`) são arquivados até que o titular complete 18 anos, acrescido do prazo prescricional de 5 (cinco) anos.

---

## 5. Emancipação Automática aos 18 Anos

5.1. No dia em que o atleta completa 18 anos (`birthDate >= 18`), a tutela parental na Plataforma é automaticamente extinta (`status = EMANCIPATED`).

5.2. O acesso de gestão parental é desvinculado, e o atleta passa a ser o único titular de sua conta, sendo direcionado no acesso seguinte para assumir diretamente a administração civil de seus dados e autorizações.

---

## 6. Declaração Formal de Aceite do Responsável Legal

Ao assinar eletronicamente este Termo no fluxo de validação da Plataforma, o Responsável Legal atesta sob as penas da lei:

- [X] **Declaração de Tutela:** Declaro sob as penas da lei que sou pai, mãe ou tutor legal civil do atleta menor identificado na Seção 1, que possuo plena capacidade civil e que as informações prestadas são verdadeiras.
- [X] **Conhecimento das Políticas:** Li, compreendi e concordo integralmente com o [Termo de Uso da Plataforma](TERMOS_DE_USO.md), a [Política de Privacidade Geral](POLITICA_DE_PRIVACIDADE.md) e a [Política de Privacidade para Menores](POLITICA_DE_PRIVACIDADE_MENORES.md).
- [X] **Consentimento `DATA` (Obrigatório):** Outorgo consentimento específico para o tratamento dos dados civis e desportivos do atleta menor para fins de gestão e operação de treinos e jogos no CT.
- [ ] **Autorização `BROADCAST` (Opcional):** [ ] Autorizo / [ ] Não autorizo a transmissão ao vivo das partidas do menor com a garantia pétrea de substituição do nome civil por pseudônimo aleatório (`Atleta #XXXXXX`).
- [ ] **Autorização `STATS` (Opcional):** [ ] Autorizo / [ ] Não autorizo o cômputo dos dados desportivos no pool analítico agregado da Plataforma com salvaguarda de amostra mínima ($N \ge 10$).

---

## 7. Canais de Atendimento e Foro

7.1. Para revogação de consentimentos, retificação cadastral, exclusão pontual de áudios ou exercício de direitos do Art. 18 da LGPD, o responsável poderá utilizar o painel autenticado (`/responsavel`) ou contatar diretamente o Encarregado pelo Tratamento de Dados Pessoais (DPO):
- **Canal do Encarregado (DPO):** **suporte@omni-sistemas.com**

7.2. Fica eleito o foro da **Comarca de Curitiba, Estado do Paraná**, como o competente para dirimir quaisquer litígios decorrentes deste Termo de Consentimento, ressalvado o domicílio do consumidor.
