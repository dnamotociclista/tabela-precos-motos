# Tabela de preços de motos (DNA Motociclista)

Coleta semanal dos preços sugeridos nos sites das fabricantes. O GitHub Actions roda `collect.mjs`, grava `data/*.json` e gera `meta.json`, que a página https://dnamotociclista.com.br/tabela-de-precos/ lê.

Travas: coleta vazia ou com menos de 60% dos modelos mantém o dado anterior. Variação de preço acima de 25% só é aceita se se repetir em 2 coletas seguidas.
