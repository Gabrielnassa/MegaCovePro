#!/usr/bin/env python3
"""
Build do site Coli Loterias
───────────────────────────
1. Baixa (ou lê do cache) o histórico completo de cada loteria a partir da
   base pública mantida no GitHub (eitchtee/loterias.json — atualizada todo dia).
2. Converte para o formato compacto usado pelo site:  data/<jogo>.json
       {"jogo": "megasena", "atualizado": "...", "fonte": "...",
        "concursos": [[numero, "dd/mm/aaaa", [dezenas], extra], ...]}
3. Gera data/resumo.json (frequências, atrasos, último concurso) para a home.
4. Gera as 10 páginas estatisticas-<jogo>.html a partir do template.
5. Empacota tudo em dist/coli-loterias.zip

Uso:  python3 tools/build.py            (usa cache de 12h em tools/.cache)
      python3 tools/build.py --forcar   (baixa tudo de novo)
      python3 tools/build.py --sem-zip
"""
import json, os, re, sys, time, zipfile, datetime, urllib.request, shutil, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blog_posts

RAIZ   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE   = os.path.join(RAIZ, "site")
DATA   = os.path.join(SITE, "data")
CACHE  = os.path.join(RAIZ, "tools", ".cache")
DIST   = os.path.join(RAIZ, "dist")
GH     = "https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/"
FORCAR = "--forcar" in sys.argv
SEMZIP = "--sem-zip" in sys.argv
GTM_ID = os.environ.get("COLI_GTM_ID", "GTM-PPGQ9CP9")   # Google Tag Manager (vazio = não instala)
SITE_URL = os.environ.get("COLI_SITE_URL", "https://coliloterias.com.br/loterias/")   # endereço final do site (para canonical, sitemap e Open Graph)

JOGOS = [
 # id, nome, arquivo no GitHub, tipo, min, max, emoji, cor1, cor2, descrição
 ("megasena","Mega-Sena","mega-sena","normal",1,60,"🍀","#209869","#0d6b47",
  "A maior loteria do Brasil. Escolha de 6 a 20 números entre 60 e ganhe com 4, 5 ou 6 acertos. Sorteios às terças, quintas e domingos."),
 ("lotofacil","Lotofácil","lotofacil","normal",1,25,"🌸","#930089","#5f0058",
  "Marque de 15 a 20 números entre 25 e ganhe acertando 11, 12, 13, 14 ou 15. Sorteios de segunda a sábado."),
 ("quina","Quina","quina","normal",1,80,"🎲","#260085","#170052",
  "Escolha de 5 a 15 números entre 80. Ganha quem acerta 2, 3, 4 ou 5 dezenas. Sorteios de segunda a sábado."),
 ("diadesorte","Dia de Sorte","dia-de-sorte","normal",1,31,"🌞","#CB852B","#8f5c17",
  "Marque de 7 a 15 números entre 31 e um Mês de Sorte. Ganhe com 4, 5, 6 ou 7 acertos."),
 ("timemania","Timemania","timemania","time",1,80,"⚽","#0a6b3a","#044a26",
  "Escolha 10 números entre 80 e um Time do Coração. Ganhe com 3 a 7 acertos ou acertando o time."),
 ("duplasena","Dupla Sena","dupla-sena","dupla",1,50,"🎰","#7B4A2D","#4E2E1B",
  "Um bilhete, duas chances: são dois sorteios por concurso. Escolha de 6 a 15 números entre 50."),
 ("maismilionaria","+Milionária","mais-milionaria","trevos",1,50,"💎","#1E2C6B","#111a42",
  "Escolha 6 números entre 50 e 2 trevos entre 6. Prêmio principal nunca inferior a R$ 10 milhões."),
 ("supersete","Super Sete","super-sete","colunas",0,9,"7️⃣","#7CB342","#4F7D22",
  "Sete colunas, um dígito de 0 a 9 em cada. Ganhe acertando de 3 a 7 colunas."),
 ("lotomania","Lotomania","lotomania","normal",0,99,"🎯","#F78100","#b35d00",
  "Marque 50 números entre 100 e ganhe acertando 20, 19, 18, 17, 16, 15 ou nenhum número."),
 ("loteca","Loteca",None,"loteca",0,0,"🏟️","#D0202E","#8f151f",
  "Dê o seu palpite nos 14 jogos de futebol da rodada. Ganha quem acerta 14 ou 13 resultados."),
]

def baixar(nome):
    os.makedirs(CACHE, exist_ok=True)
    f = os.path.join(CACHE, nome + ".json")
    if not FORCAR and os.path.isfile(f) and time.time() - os.path.getmtime(f) < 12 * 3600:
        return json.load(open(f, encoding="utf-8"))
    url = GH + nome + ".json"
    print("  ↓", url)
    req = urllib.request.Request(url, headers={"User-Agent": "ColiLoterias-build"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
    json.loads(raw)  # valida
    open(f, "wb").write(raw)
    return json.loads(raw)

def converter(jid, tipo, lista):
    rows, vistos = [], set()
    for x in sorted(lista, key=lambda x: x["concurso"]):
        n = int(x["concurso"])
        if n in vistos: continue
        dez = x.get("resultado") or x.get("resultado_1") or []
        dez = [int(d) for d in dez]
        if not dez: continue
        row = [n, x.get("data", ""), dez]
        if tipo == "dupla":  row.append([int(d) for d in (x.get("resultado_2") or [])])
        if tipo == "trevos": row.append([int(d) for d in (x.get("trevos") or [])])
        if tipo == "time":   row.append(str(x.get("time_do_coracao") or "").strip())
        rows.append(row); vistos.add(n)
    return rows

def resumo_jogo(j, rows):
    jid, nome, _, tipo, mn, mx, *_ = j
    N = mx - mn + 1
    freq = [0] * N; atraso = [len(rows)] * N
    cols = [[0] * 10 for _ in range(7)] if tipo == "colunas" else None
    cols_atraso = [[len(rows)] * 10 for _ in range(7)] if tipo == "colunas" else None
    trevos = [0] * 6 if tipo == "trevos" else None
    for idx, r in enumerate(rows):
        dz = r[2] + (r[3] if tipo == "dupla" else [])
        for d in dz:
            k = d - mn
            if 0 <= k < N:
                freq[k] += 1; atraso[k] = len(rows) - 1 - idx
        if cols is not None:
            for c, d in enumerate(r[2][:7]):
                if 0 <= d <= 9: cols[c][d] += 1; cols_atraso[c][d] = len(rows) - 1 - idx
        if trevos is not None:
            for t in r[3]:
                if 1 <= t <= 6: trevos[t - 1] += 1
    out = {"total": len(rows), "primeiro": rows[0][:2] if rows else None, "ultimo": rows[-1] if rows else None,
           "freq": freq, "atraso": atraso}
    if cols is not None: out["cols"] = cols; out["colsAtraso"] = cols_atraso
    if trevos is not None: out["trevos"] = trevos
    return out

def gerar_blog():
    """Gera blog.html, blog-<slug>.html, data/blog.json, sitemap.xml e robots.txt."""
    print("Gerando blog…")
    cores = {j[0]: (j[6], j[7]) for j in JOGOS}
    tpl_post = open(os.path.join(RAIZ, "tools", "template-post.html"), encoding="utf-8").read()
    tpl_blog = open(os.path.join(RAIZ, "tools", "template-blog.html"), encoding="utf-8").read()
    ini = datetime.date.fromisoformat(blog_posts.DATA_INICIO)
    lista, cards, urls = [], [], []
    def esc(s): return html.escape(s, quote=True)
    for i, p in enumerate(blog_posts.POSTS):
        data = ini + datetime.timedelta(days=i * blog_posts.INTERVALO_DIAS)
        data_iso = data.isoformat()
        data_br = f"{data.day} de {['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][data.month-1]} de {data.year}"
        texto = re.sub(r"<[^>]+>", " ", p["corpo"] + " ".join(q + " " + a for q, a in p["faq"]))
        leitura = max(2, round(len(texto.split()) / 200))
        emo, cor = cores.get(p["loteria"], ("📰", "#1435a8"))
        url = SITE_URL + f"blog-{p['slug']}.html"
        faq_html = "\n".join(f'<details itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"><summary itemprop="name">{esc(q)}</summary><div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><p itemprop="text">{esc(a)}</p></div></details>' for q, a in p["faq"])
        fontes = " · ".join(f'<a href="{esc(u)}" target="_blank" rel="noopener nofollow">{esc(u.replace("https://",""))}</a>' for u in p["fontes"])
        side = ""
        if p["loteria"]:
            nome = next(j[1] for j in JOGOS if j[0] == p["loteria"])
            side = f'<div class="scard" style="border-top:5px solid {cor}"><h3>{emo} {esc(nome)}</h3><p>Frequência, atrasos e todos os concursos da {esc(nome)}, do 1º ao mais recente.</p><a class="btn btn-line" href="estatisticas-{p["loteria"]}.html">Ver estatísticas</a></div>'
        jsonld = [
            {"@context": "https://schema.org", "@type": "Article", "headline": p["titulo"], "description": p["descricao"], "datePublished": data_iso, "dateModified": data_iso,
             "author": {"@type": "Organization", "name": blog_posts.AUTOR, "url": SITE_URL}, "publisher": {"@type": "Organization", "name": "Coli Loterias", "logo": {"@type": "ImageObject", "url": SITE_URL + "assets/img/logo.png"}},
             "mainEntityOfPage": url, "image": SITE_URL + "assets/img/logo.png", "articleSection": p["categoria"], "inLanguage": "pt-BR", "isAccessibleForFree": True},
            {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]},
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Início", "item": SITE_URL},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE_URL + "blog.html"},
                {"@type": "ListItem", "position": 3, "name": p["titulo"], "item": url}]},
        ]
        page = (tpl_post.replace("{{TITULO}}", esc(p["titulo"])).replace("{{DESCRICAO}}", esc(p["descricao"])).replace("{{AUTOR}}", esc(blog_posts.AUTOR))
                .replace("{{URL}}", url).replace("{{SITE_URL}}", SITE_URL).replace("{{DATA_ISO}}", data_iso).replace("{{DATA_BR}}", data_br)
                .replace("{{CATEGORIA}}", esc(p["categoria"])).replace("{{LEITURA}}", str(leitura)).replace("{{RESUMO}}", esc(p["resumo"]))
                .replace("{{CORPO}}", p["corpo"].strip()).replace("{{FAQ_HTML}}", faq_html).replace("{{FONTES}}", fontes)
                .replace("{{JSONLD}}", json.dumps(jsonld, ensure_ascii=False)).replace("{{SLUG}}", p["slug"]).replace("{{COR}}", cor).replace("{{EMO}}", emo)
                .replace("{{SIDE_LOTERIA}}", side))
        open(os.path.join(SITE, f"blog-{p['slug']}.html"), "w", encoding="utf-8").write(page)
        lista.append({"slug": p["slug"], "titulo": p["titulo"], "descricao": p["descricao"], "categoria": p["categoria"], "loteria": p["loteria"], "data": data_iso, "leitura": leitura})
        urls.append((url, data_iso))
        print(f"  ✓ blog-{p['slug']}.html  ({data_iso})")
    with open(os.path.join(DATA, "blog.json"), "w", encoding="utf-8") as f:
        json.dump({"gerado": datetime.date.today().isoformat(), "intervaloDias": blog_posts.INTERVALO_DIAS, "posts": lista}, f, ensure_ascii=False, separators=(",", ":"))
    cats = sorted({p["categoria"] for p in blog_posts.POSTS})
    cats_html = "".join(f'<button data-c="{esc(c)}" type="button">{esc(c)}</button>' for c in cats)
    jsonld_blog = {"@context": "https://schema.org", "@type": "Blog", "name": "Blog da Coli Loterias", "url": SITE_URL + "blog.html", "publisher": {"@type": "Organization", "name": "Coli Loterias"}, "inLanguage": "pt-BR"}
    open(os.path.join(SITE, "blog.html"), "w", encoding="utf-8").write(tpl_blog.replace("{{SITE_URL}}", SITE_URL).replace("{{CATS}}", cats_html).replace("{{CARDS}}", "").replace("{{JSONLD}}", json.dumps(jsonld_blog, ensure_ascii=False)))
    # sitemap + robots
    hoje = datetime.date.today().isoformat()
    fixas = ["", "resultados.html", "quem-somos.html", "blog.html", "termos.html"] + [f"estatisticas-{j[0]}.html" for j in JOGOS]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for f_ in fixas: sm.append(f"  <url><loc>{SITE_URL}{f_}</loc><lastmod>{hoje}</lastmod><changefreq>{'daily' if f_ in ('', 'resultados.html') or f_.startswith('estatisticas') else 'monthly'}</changefreq></url>")
    for u, d in urls:
        if d <= hoje: sm.append(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod><changefreq>monthly</changefreq></url>")
    sm.append("</urlset>")
    open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm))
    open(os.path.join(SITE, "robots.txt"), "w", encoding="utf-8").write(f"User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {SITE_URL}sitemap.xml\n")
    print(f"  ✓ blog.html, data/blog.json, sitemap.xml ({len([1 for _, d in urls if d <= hoje])} matérias publicadas até hoje)")

def inserir_gtm():
    """Instala o Google Tag Manager em todas as páginas: script no topo do <head>
    (logo após o charset) e <noscript> imediatamente após a abertura do <body>."""
    if not GTM_ID: return
    head = ('<!-- Google Tag Manager -->\n'
            "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n"
            "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n"
            "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n"
            "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n"
            "})(window,document,'script','dataLayer','" + GTM_ID + "');</script>\n"
            '<!-- End Google Tag Manager -->')
    body = ('<!-- Google Tag Manager (noscript) -->\n'
            '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID + '"\n'
            'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n'
            '<!-- End Google Tag Manager (noscript) -->')
    re_head = re.compile(r'\n?<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->', re.S)
    re_body = re.compile(r'\n?<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->', re.S)
    n = 0
    for fn in sorted(os.listdir(SITE)):
        if not fn.endswith(".html"): continue
        fp = os.path.join(SITE, fn)
        html = open(fp, encoding="utf-8").read()
        novo = re_body.sub("", re_head.sub("", html))          # remove instalação anterior (idempotente)
        m = re.search(r'<meta charset="[^"]+">', novo, re.I)
        if m: novo = novo[:m.end()] + "\n" + head + novo[m.end():]
        else:  novo = re.sub(r'(<head[^>]*>)', lambda k: k.group(1) + "\n" + head, novo, count=1, flags=re.I)
        novo = re.sub(r'(<body[^>]*>)', lambda k: k.group(1) + "\n" + body, novo, count=1, flags=re.I)
        if novo != html:
            open(fp, "w", encoding="utf-8").write(novo); n += 1
    print(f"  ✓ Google Tag Manager {GTM_ID} ({n} páginas)")

def carimbar_versao():
    """Acrescenta ?v=<hash> aos CSS/JS/manifest/ícones referenciados em todas as páginas.
    Assim o navegador (e o cache da hospedagem) baixa a versão nova depois de cada upload,
    em vez de continuar usando um coli-core.js/coli.css antigo."""
    import hashlib
    h = hashlib.sha1()
    for sub in ("assets/css", "assets/js"):
        d = os.path.join(SITE, sub)
        for fn in sorted(os.listdir(d)):
            if fn.endswith((".css", ".js")):
                h.update(open(os.path.join(d, fn), "rb").read())
    for fn in ("manifest.webmanifest", "assets/img/apple-touch-icon.png", "assets/img/icon-192.png", "assets/img/icon-512.png", "assets/img/favicon.svg"):
        fp = os.path.join(SITE, fn)
        if os.path.exists(fp): h.update(open(fp, "rb").read())
    v = h.hexdigest()[:10]
    pat = re.compile(r'((?:href|src)=")((?:assets/(?:css|js)/[^"?]+\.(?:css|js))|manifest\.webmanifest)(?:\?v=[0-9a-f]+)?"')
    # ícones ficam sem ?v= (o iOS e o Android buscam pelo caminho exato)
    limpa = re.compile(r'((?:href|src)="(?:assets/img/[^"?]+\.(?:svg|png)|apple-touch-icon(?:-precomposed)?\.png))\?v=[0-9a-f]+"')
    n = 0
    for fn in sorted(os.listdir(SITE)):
        if not fn.endswith(".html"): continue
        fp = os.path.join(SITE, fn)
        html = open(fp, encoding="utf-8").read()
        novo = limpa.sub(r'\1"', pat.sub(lambda m: m.group(1) + m.group(2) + "?v=" + v + '"', html))
        if novo != html:
            open(fp, "w", encoding="utf-8").write(novo); n += 1
    # o manifest também aponta para os ícones
    mp = os.path.join(SITE, "manifest.webmanifest")
    if os.path.exists(mp):
        m = open(mp, encoding="utf-8").read()
        m2 = re.sub(r'("src":\s*")([^"?]+)(?:\?v=[0-9a-f]+)?"', lambda k: k.group(1) + k.group(2) + '"', m)
        if m2 != m: open(mp, "w", encoding="utf-8").write(m2)
    print(f"  ✓ versão dos arquivos: {v} ({n} páginas atualizadas)")

def main():
    os.makedirs(DATA, exist_ok=True)
    agora = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    resumo = {"atualizado": agora, "jogos": {}}
    print("Baixando e convertendo históricos…")
    for j in JOGOS:
        jid, nome, gh, tipo, mn, mx, *_ = j
        if not gh:
            continue
        rows = converter(jid, tipo, baixar(gh))
        base = {"jogo": jid, "nome": nome, "atualizado": agora, "fonte": "github:eitchtee/loterias.json", "concursos": rows}
        with open(os.path.join(DATA, jid + ".json"), "w", encoding="utf-8") as f:
            json.dump(base, f, ensure_ascii=False, separators=(",", ":"))
        resumo["jogos"][jid] = resumo_jogo(j, rows)
        print(f"  ✓ {nome:<13} {len(rows):>5} concursos  (1 → {rows[-1][0]}, último em {rows[-1][1]})")
    with open(os.path.join(DATA, "resumo.json"), "w", encoding="utf-8") as f:
        json.dump(resumo, f, ensure_ascii=False, separators=(",", ":"))

    print("Gerando páginas de estatísticas…")
    tpl = open(os.path.join(RAIZ, "tools", "template-estatisticas.html"), encoding="utf-8").read()
    for j in JOGOS:
        jid, nome, gh, tipo, mn, mx, emo, c1, c2, desc = j
        html = (tpl.replace("{{ID}}", jid).replace("{{NOME}}", nome).replace("{{EMO}}", emo)
                   .replace("{{COR}}", c1).replace("{{COR2}}", c2).replace("{{DESC}}", desc))
        open(os.path.join(SITE, f"estatisticas-{jid}.html"), "w", encoding="utf-8").write(html)
        print(f"  ✓ estatisticas-{jid}.html")

    gerar_blog()
    inserir_gtm()
    carimbar_versao()

    if SEMZIP:
        return
    os.makedirs(DIST, exist_ok=True)
    zpath = os.path.join(DIST, "coli-loterias.zip")
    if os.path.exists(zpath): os.remove(zpath)
    print("Empacotando", zpath)
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for root, dirs, files in os.walk(SITE):
            dirs[:] = [d for d in dirs if d not in (".git",)]
            rel_root = os.path.relpath(root, SITE)
            # garante que a pasta de cache vazia entre no zip
            if rel_root != ".":
                zi = zipfile.ZipInfo(("coli-loterias/" + rel_root).rstrip("/") + "/"); z.writestr(zi, "")
            for fn in sorted(files):
                if fn.endswith((".tmp",)) or (rel_root.startswith(os.path.join("api", "cache")) and fn != ".htaccess"):
                    continue
                p = os.path.join(root, fn)
                z.write(p, "coli-loterias/" + os.path.normpath(os.path.join(rel_root, fn)).replace(os.sep, "/"))
    print(f"  ✓ {os.path.getsize(zpath)/1024/1024:.1f} MB")

if __name__ == "__main__":
    main()
