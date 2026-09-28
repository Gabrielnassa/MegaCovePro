# MegaCover Pro Elite™ 2.0 — versão Web (GitHub Pages)

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

O site tem duas partes:

- **`index.html`** — página de apresentação (produto, recursos, planos, dúvidas).
- **`app.html`** — o painel com as 8 ferramentas.

## Beta hoje, assinatura amanhã

Tudo o que é comercial fica em **`assets/plano.js`**:

| Campo | Para que serve |
|---|---|
| `fase` | `"beta"` libera tudo grátis (hoje). `"assinatura"` faz os recursos PRO pedirem assinatura |
| `precoMensal`, `precoAnual`, `economiaAnual` | valores mostrados na seção Planos (deixe `null` para "Em breve") |
| `linkAssinatura` | link de pagamento (Mercado Pago, Stripe, Hotmart…) |
| `whatsapp` / `email` | ativa o botão "Entrar na lista de espera" |
| `pro` | lista dos recursos PRO (aparecem com o selo **PRO** no painel) |
| `gratis` | limites do plano gratuito quando a fase for `"assinatura"` |

> **Importante para cobrar de verdade:** o GitHub Pages só hospeda arquivos
> estáticos, então um bloqueio feito apenas no navegador pode ser burlado.
> Na hora de lançar a assinatura será preciso **login + verificação no servidor**
> (por exemplo Supabase ou Firebase para as contas e Mercado Pago/Stripe para o
> pagamento). A interface já está pronta para isso: basta trocar a função
> `assinante()` em `assets/plano.js` por essa verificação.

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

## Imprimir no volante oficial

No Gerador, o botão **Imprimir no volante** abre `volante.html`, que imprime só
as marcas, em milímetros reais, no volante da CAIXA, pronto para passar na
máquina da lotérica.

1. **Calibre uma vez:** escolha *Folha de calibração*, imprima em papel comum
   (escala 100%, margens "nenhuma"), sobreponha ao volante contra a luz e ajuste
   posição do 1º número, distância entre números, jogos por volante etc.
2. **Imprima:** volte para *Imprimir marcas*, coloque o volante na alimentação
   manual da impressora e imprima. Se a impressora não aceita papel estreito, use
   *Papel: folha A4 com o volante colado*.
3. A calibração fica salva no navegador e pode ser **exportada/importada**
   (útil para usar a mesma em outros computadores).

Os moldes iniciais são aproximados: confira sempre o primeiro volante impresso.

## Atualização dos resultados

- **Automática (GitHub Actions):** `.github/workflows/atualizar.yml` roda todo dia,
  executa `atualizar_dados.py` e grava os concursos novos em `data/` (base do GitHub
  + API em tempo real para os concursos mais recentes).
  Também dá para rodar na hora em **Actions → Atualizar resultados → Run workflow**.
- **No navegador (automática):** ao abrir o painel, e a cada 2 horas, ele busca os
  concursos novos sozinho — primeiro pela API pública que lê a CAIXA em tempo real
  (loteriascaixa-api.vercel.app, com api.guidi.dev.br de reserva) e, se falhar,
  pela base [eitchtee/loterias.json](https://github.com/eitchtee/loterias.json).
  Os concursos ficam guardados no próprio navegador. O botão **Atualizar todas**
  força a busca na hora.
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
index.html              página de apresentação (landing)
app.html                painel (as 8 ferramentas)
volante.html            impressão das marcas no volante oficial (com calibração)
assets/plano.js         fase Beta/assinatura, preços e links  ← edite aqui
assets/site.css         estilos da página de apresentação
assets/volante.js       moldes e desenho do volante em milímetros
assets/engine.js        motor: estatísticas, gerador, MegaScore, IA, fechamentos, Monte Carlo
assets/app.js           interface (abas, gráficos, exportação)
assets/style.css        design system do painel (tema claro/escuro, celular)
assets/icon.png         ícone
data/*.json             histórico das 9 loterias  [concurso, data, [dezenas], extra]
atualizar_dados.py      atualizador (usado pelo GitHub Actions)
.github/workflows/      rotina diária de atualização
```

## Aviso legal

Ferramenta estatística e combinatória. **Não prevê resultados nem garante prêmios.**
Cada sorteio é aleatório e independente. Jogue com responsabilidade.
