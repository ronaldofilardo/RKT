# Architecture & Clean Code Standards

## Regras Fundamentais
1. **Coesão e Modularidade**: Funções e arquivos focados em uma única responsabilidade. Mantenha arquivos concisos (< 150 linhas por componente/utilitário quando possível).
2. **Defesa nas Bordas**: Validação rigorosa na entrada de dados (usar Zod para formulários e requisições HTTP).
3. **Tratamento de Exceções Previsível**: Nunca silencie erros em blocos `catch` vazios. Sempre retorne mensagens legíveis e logue erros com contexto.
4. **Respeito ao Histórico e Comentários**: Preserve comentários funcionais e docstrings existentes.
5. **Economia de Tokens**: Utilize comandos `rtk` em vez de comandos puros verbosos para garantir respostas ágeis dos agentes.
