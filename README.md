# Ajuste fino — Novo Atleta

A categoria por idade agora exibe somente a relação simples entre categoria e faixa etária, sem o texto redundante “Categoria de pertencimento”.

A seção Ranking foi refinada para apresentar o título e o subtítulo na mesma linha, a idade em destaque e cada ranking ativo com checkbox, nome, classe, posição e Remover em uma linha compacta. Campos condicionais, como categoria e posição juvenil, permanecem preservados.

Aplicação em `C:\\apps\\RKT`:

```powershell
Expand-Archive -LiteralPath .\\rkt-ranking-fine-layout.zip -DestinationPath . -Force
Remove-Item -LiteralPath .\\.next -Recurse -Force -ErrorAction SilentlyContinue
pnpm run dev
```
