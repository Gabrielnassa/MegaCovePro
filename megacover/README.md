# MegaCover Pro Elite™ — versão Web (GitHub Pages)

Versão em **HTML + JavaScript puro** do MegaCover Pro Elite v1.5.0: roda direto
no navegador (computador ou celular), sem instalar Python, sem servidor e sem
banco de dados. Basta hospedar no **GitHub Pages**.

Tudo o que o programa desktop fazia, para as **9 loterias CAIXA** (Mega-Sena,
Lotofácil, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte, Super Sete e
+Milionária):

| Aba | O que faz |
|---|---|
| 🏠 Dashboard | KPIs, último resultado, consulta de concursos anteriores e gráfico de frequência |
| 📊 Estatísticas | Frequência, %, atraso atual, maior atraso e tendência (tabela ordenável) + ranking do Time do Coração / Mês da Sorte / Trevos |
| 🧩 Padrões | Pares × ímpares, somas, faixas, sequências, repetições, primos (e miolo da Lotofácil) |
| ⚡ Gerador | 4 estratégias, 8 filtros, MegaScore™ (0–100), campo extra, **MegaCover AI** (DNA das Combinações™ e Otimização Elite™), exportar Excel (CSV) / TXT / PDF (imprimir) / projeto `.megacover` |
| 🎯 Fechamentos | Volante clicável, base sugerida (quentes + atrasadas), perfis Econômico / Equilibrado / Agressivo; Super Sete com a regra oficial das colunas |
| 🎲 Simulador | Monte Carlo de 10 mil a 1 milhão de sorteios + probabilidade exata |
| ✅ Conferir | Confere seus jogos num concurso ou em todo o histórico |
| 📥 Dados | Atualizar online, adicionar concurso à mão, importar o CSV do desktop, exportar histórico, abrir projetos |

## Como publicar no GitHub (5 minutos)

1. Crie um repositório novo no GitHub (ex.: `megacover`), **público**.
2. Clique em **Add file → Upload files** e arraste **todo o conteúdo desta pasta**
   (`index.html`, `assets/`, `data/`, `atualizar_dados.py`, `.nojekyll`, `.github/`).
   > A pasta `.github` fica oculta em alguns sistemas. Se não conseguir arrastá-la,
   > tudo funciona do mesmo jeito — só não haverá a atualização automática diária
   > pelo GitHub (o botão **🔄 Atualizar** do site continua funcionando).
3. Vá em **Settings → Pages** → *Build and deployment* → **Source: Deploy from a branch**
   → Branch **main** e pasta **/ (root)** → **Save**.
4. Aguarde 1–2 minutos. O endereço aparece no topo da página de Pages:
   `https://SEU-USUARIO.github.io/megacover/`
5. (Opcional) Em **Settings → Actions → General → Workflow permissions**, marque
   **Read and write permissions** para o robô conseguir salvar os resultados novos.

## Atualização dos resultados

- **Automática (GitHub Actions):** `.github/workflows/atualizar.yml` roda todo dia,
  executa `atualizar_dados.py` e grava os concursos novos em `data/`.
  Também dá para rodar na hora em **Actions → Atualizar resultados → Run workflow**.
- **No navegador:** o botão **🔄 Atualizar TODAS** baixa os concursos novos da base
  pública [eitchtee/loterias.json](https://github.com/eitchtee/loterias.json) e os
  guarda no próprio navegador.
- **À mão:** aba 📥 Dados → *Adicionar concurso* ou *Importar CSV* (mesmo formato
  dos arquivos `dados/*.csv` do programa desktop).

## Testar no computador

Abrir o `index.html` com dois cliques funciona, mas o navegador bloqueia a leitura
de `data/` nesse modo e o site passa a baixar tudo da internet. Para testar igual
ao GitHub Pages:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Estrutura

```
index.html              página única
assets/engine.js        motor: estatísticas, gerador, MegaScore, IA, fechamentos, Monte Carlo
assets/app.js           interface (abas, gráficos, exportação)
assets/style.css        tema claro/escuro, layout para celular
assets/icon.png         ícone
data/*.json             histórico das 9 loterias  [concurso, data, [dezenas], extra]
atualizar_dados.py      atualizador (usado pelo GitHub Actions)
.github/workflows/      rotina diária de atualização
```

## Aviso legal

Ferramenta estatística e combinatória. **Não prevê resultados nem garante prêmios.**
Cada sorteio é aleatório e independente. Jogue com responsabilidade.
