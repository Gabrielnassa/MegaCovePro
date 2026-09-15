# Coli Loterias — Site completo (HTML + PHP)

Site da **Coli Loterias** com resultados ao vivo, estatísticas completas
(do 1º concurso ao mais recente) e gerador de jogos para todas as
Loterias CAIXA. Tudo se atualiza sozinho a partir da **API oficial da CAIXA**.

---

> **Guia ilustrado:** abra `PASSO-A-PASSO-WORDPRESS.html` no navegador para o passo a passo completo de publicação no WordPress, com solução de problemas e checklist.

## 1. O que tem na pasta

| Arquivo / pasta | Para que serve |
|---|---|
| `PASSO-A-PASSO-WORDPRESS.html` | Guia de publicação no WordPress (abra no navegador) |
| `index.html` | Página inicial (hero, próximos concursos, surpresinha, sobre a Coli, serviços, contato) |
| `resultados.html` | Últimos resultados de todas as loterias, com rateio de prêmios |
| `quem-somos.html` | Página institucional (história, prêmios, IA, contato) |
| `termos.html` | Termos de uso, privacidade e jogo responsável (linkados no rodapé) |
| `estatisticas-*.html` | Estatísticas de cada loteria (10 páginas) |
| `assets/js/coli-config.js` | **Único arquivo que você precisa editar** (WhatsApp, endereço, horário) |
| `assets/css/coli.css` | Visual do site |
| `assets/js/coli-core.js` | Camada de dados (API CAIXA → reservas), cabeçalho, rodapé, modal |
| `assets/js/coli-home.js`, `coli-resultados.js`, `coli-stats.js` | Lógica de cada página |
| `assets/img/logo.png` | Logo (troque pelo seu arquivo mantendo o nome) |
| `api/loterias.php` | Proxy da API oficial da CAIXA, com cache e atualização do histórico |
| `api/cache/` | Cache em disco (precisa de permissão de escrita) |
| `data/*.json` | Histórico completo de cada loteria (1º → último concurso) |
| `data/resumo.json` | Frequências e últimos resultados usados na página inicial |

---

## 2. Antes de publicar — configure o WhatsApp

Abra `assets/js/coli-config.js` e altere:

```js
whatsapp:  "551120637676",   // 55 + DDD + número, só dígitos
telefones: ["(11) 2063-7676"],
horario:   "Seg a Sex 8h às 19h · Sáb 9h às 12h",
instagram: "https://www.instagram.com/coli_loterias/",
facebook:  "https://www.facebook.com/ColiLoterias/",
```

Todos os botões "Fale conosco", "Jogar" e os jogos gerados pela
surpresinha já usam esse número.

**Prêmios entregues (página Quem somos):** no mesmo arquivo, a lista
`premios` alimenta a linha do tempo. Para incluir um prêmio novo, copie
uma linha e coloque no topo da lista:

```js
{ data: "Junho de 2026", loteria: "Mega-Sena", valor: "R$ 3 milhões",
  titulo: "Bolão premiado", texto: "Descrição curta." },
```

---

## 3. Como publicar no WordPress (hospedagem com PHP)

A forma mais simples e robusta é subir a pasta **inteira** para a
hospedagem, ao lado do WordPress. O site fica em um endereço próprio
(ex.: `seusite.com.br/loterias/`) e você cria um item de menu no
WordPress apontando para ele.

1. Abra o **Gerenciador de Arquivos** do seu painel (cPanel, Plesk,
   Hostinger, Locaweb…) ou use um programa de FTP (FileZilla).
2. Entre na pasta pública do site — normalmente `public_html/`
   (a mesma onde estão `wp-admin/`, `wp-content/`, `wp-config.php`).
3. Envie o arquivo `coli-loterias.zip` para lá e **extraia**.
   Vai aparecer a pasta `coli-loterias/`. Se quiser, renomeie para
   `loterias`.
4. Dê permissão de escrita nas pastas `api/cache/` e `data/`
   (botão direito → *Permissions* → 755; se não funcionar, 775 ou 777).
5. Acesse `https://seusite.com.br/loterias/` — pronto.
6. Para conferir o proxy, abra
   `https://seusite.com.br/loterias/api/loterias.php?acao=status`.
   Deve mostrar `"caixa_online": true` e `"cache_gravavel": true`.
7. No WordPress: **Aparência → Menus → Links personalizados**, URL
   `/loterias/`, texto "Loterias". Salve o menu.

> **Dica:** se você usa um plugin de segurança que bloqueia arquivos
> PHP fora do WordPress (ex.: regras do Wordfence/iThemes), libere a
> pasta `loterias/api/`.

### Alternativa: plugin de HTML estático
Plugins como *Static HTML Output*, *Simply Static* ou blocos "HTML
personalizado" **não** executam PHP e quebram os caminhos relativos.
Nesse caso, ainda dá para usar o site: ele cai automaticamente para as
fontes públicas de reserva (veja a seção 5), mas os valores de prêmio
podem demorar mais para aparecer. Prefira o método da pasta acima.

### Instalando na raiz (sem WordPress)
Também funciona: extraia o conteúdo da pasta `coli-loterias/`
diretamente em `public_html/`.

---

## 4. Como funciona a atualização automática

```
Navegador  →  api/loterias.php  →  servicebus2.caixa.gov.br (API oficial)
                     ↓ cache 10 min (api/cache/)
                     ↓ histórico: lê data/<jogo>.json, busca na CAIXA
                       só os concursos que faltam, salva e devolve tudo
```

* As páginas consultam a CAIXA ao abrir, a cada **5 minutos**
  (`atualizarCadaMin` no config) e sempre que a aba volta ao foco.
* O último resultado, o próximo concurso, a data e o **prêmio estimado**
  vêm direto da CAIXA — sem nada digitado à mão.
* As estatísticas usam **todos os concursos**. Quando sai um sorteio
  novo, o PHP baixa só ele, acrescenta ao arquivo `data/<jogo>.json`
  e todas as estatísticas (frequência, atrasos, pares/ímpares, somas,
  tabela completa, CSV) já saem recalculadas.
* Se o arquivo `data/` estiver antigo (por exemplo, o site ficou
  meses sem visitas), o PHP completa até 120 concursos por acesso, e
  o navegador completa o restante em seguida.

---

## 5. Se o servidor não tiver PHP

O site continua funcionando: o JavaScript tenta, nesta ordem,

1. `api/loterias.php` (API oficial da CAIXA);
2. API pública `loteriascaixa-api.vercel.app` (dados completos, com prêmios);
3. API pública `api.guidi.dev.br`;
4. Base diária no GitHub (`eitchtee/loterias.json` — só os números);
5. Histórico local `data/*.json`.

A barra de status de cada página informa qual fonte respondeu.

---

## 6. Personalização rápida

* **Cores da marca:** `assets/css/coli.css`, bloco `:root`
  (`--azul`, `--laranja`, `--navy`).
* **Cores de cada loteria:** `assets/js/coli-core.js` → `COLI.JOGOS`
  (`c1`, `c2`).
* **Dias/horário de sorteio** (contagem regressiva): `COLI.JOGOS`
  → `dias` (0 = domingo … 6 = sábado) e `hora`.
* **Logo:** substitua `assets/img/logo.png` (fundo transparente,
  ~360×115 px).

---

## 7. Requisitos

* PHP 7.4 ou superior com extensão cURL (padrão nas hospedagens).
* Servidor com saída para a internet (para chamar a API da CAIXA).
* Nenhum banco de dados, nenhuma dependência externa.
