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
import json, os, re, sys, time, zipfile, datetime, urllib.request, shutil

RAIZ   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE   = os.path.join(RAIZ, "site")
DATA   = os.path.join(SITE, "data")
CACHE  = os.path.join(RAIZ, "tools", ".cache")
DIST   = os.path.join(RAIZ, "dist")
GH     = "https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/"
FORCAR = "--forcar" in sys.argv
SEMZIP = "--sem-zip" in sys.argv

JOGOS = [
 # id, nome, arquivo no GitHub, tipo, min, max, emoji, cor1, cor2, descrição
 ("megasena","Mega-Sena","mega-sena","normal",1,60,"🍀","#209869","#0d6b47",
  "A maior loteria do Brasil. Escolha de 6 a 20 números entre 60 e ganhe com 4, 5 ou 6 acertos. Sorteios às terças, quintas e domingos."),
 ("lotofacil","Lotofácil","lotofacil","normal",1,25,"🌸","#930089","#5f0058",
  "Marque de 15 a 20 números entre 25 e ganhe acertando 11, 12, 13, 14 ou 15. Sorteios de segunda a sábado."),
 ("quina","Quina","quina","normal",1,80,"🎲","#260085","#170052",
  "Escolha de 5 a 15 números entre 80. Ganha quem acerta 2, 3, 4 ou 5 dezenas. Sorteios de segunda a sábado."),
 ("lotomania","Lotomania","lotomania","normal",0,99,"🎯","#F78100","#b35d00",
  "Marque 50 números entre 100 e ganhe acertando 20, 19, 18, 17, 16, 15 ou nenhum número."),
 ("duplasena","Dupla Sena","dupla-sena","dupla",1,50,"🎰","#A61324","#6e0b17",
  "Um bilhete, duas chances: são dois sorteios por concurso. Escolha de 6 a 15 números entre 50."),
 ("timemania","Timemania","timemania","time",1,80,"⚽","#0a6b3a","#044a26",
  "Escolha 10 números entre 80 e um Time do Coração. Ganhe com 3 a 7 acertos ou acertando o time."),
 ("diadesorte","Dia de Sorte","dia-de-sorte","normal",1,31,"🌞","#CB852B","#8f5c17",
  "Marque de 7 a 15 números entre 31 e um Mês de Sorte. Ganhe com 4, 5, 6 ou 7 acertos."),
 ("maismilionaria","+Milionária","mais-milionaria","trevos",1,50,"💎","#1E2C6B","#111a42",
  "Escolha 6 números entre 50 e 2 trevos entre 6. Prêmio principal nunca inferior a R$ 10 milhões."),
 ("supersete","Super Sete","super-sete","colunas",0,9,"7️⃣","#8FB528","#5f7a15",
  "Sete colunas, um dígito de 0 a 9 em cada. Ganhe acertando de 3 a 7 colunas."),
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
