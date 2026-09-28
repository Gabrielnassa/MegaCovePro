#!/usr/bin/env python3
"""MegaCover Pro Elite (Web) — atualiza os arquivos data/*.json.

Baixa o histórico completo das 9 loterias da base pública
eitchtee/loterias.json (GitHub) e mescla com o que já existe em data/.
Só usa a biblioteca padrão do Python. Roda sozinho pelo GitHub Actions
(.github/workflows/atualizar.yml), mas também pode ser rodado à mão:

    python3 atualizar_dados.py
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

RAIZ = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(RAIZ, "data")
GH = "https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/"
# fontes com o Mês da Sorte (a base do GitHub não traz esse campo)
APIS_MES = ["https://loteriascaixa-api.vercel.app/api/diadesorte/{n}",
            "https://servicebus2.caixa.gov.br/portaldeloterias/api/diadesorte/{n}",
            "https://api.guidi.dev.br/loteria/diadesorte/{n}"]
MAX_MESES_POR_RODADA = 400
# APIs que leem a CAIXA em tempo real: cobrem os concursos que a base do GitHub ainda não tem
APIS = ["https://loteriascaixa-api.vercel.app/api/{id}/{n}", "https://api.guidi.dev.br/loteria/{id}/{n}"]
MAX_API_POR_RODADA = 60

# id, arquivo no GitHub, tipo do campo extra
JOGOS = [
    ("megasena", "mega-sena", None),
    ("lotofacil", "lotofacil", None),
    ("quina", "quina", None),
    ("lotomania", "lotomania", None),
    ("duplasena", "dupla-sena", "dupla"),
    ("timemania", "timemania", "time"),
    ("diadesorte", "dia-de-sorte", "mes"),
    ("supersete", "super-sete", None),
    ("maismilionaria", "mais-milionaria", "trevos"),
]


def baixar(nome):
    req = urllib.request.Request(GH + nome + ".json",
                                 headers={"User-Agent": "MegaCoverWeb"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())


def api_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        j = json.loads(r.read())
    return j[0] if isinstance(j, list) and j else j


def api_row(jid, tipo, j):
    """Converte a resposta de uma API no formato das linhas de data/."""
    if not isinstance(j, dict):
        return None
    n = int(j.get("concurso") or j.get("numero") or 0)
    dez = [int(x) for x in (j.get("dezenas") or j.get("listaDezenas") or [])]
    if not n or not dez:
        return None
    data = str(j.get("data") or j.get("dataApuracao") or "")[:10]
    if len(data) == 10 and data[4] == "-":
        data = "/".join(reversed(data.split("-")))
    ncols = 7 if jid == "supersete" else {"megasena": 6, "lotofacil": 15, "quina": 5, "lotomania": 20,
                                           "duplasena": 6, "timemania": 7, "diadesorte": 7, "maismilionaria": 6}[jid]
    row = [n, data, dez[:ncols]]
    if tipo == "dupla":
        row.append([int(x) for x in (j.get("dezenas2") or j.get("listaDezenasSegundoSorteio") or dez[ncols:])])
    elif tipo == "trevos":
        row.append([int(x) for x in (j.get("trevos") or j.get("trevosSorteados") or [])])
    elif tipo == "time":
        row.append(str(j.get("timeCoracao") or j.get("nomeTimeCoracaoMesSorte") or "").strip())
    elif tipo == "mes":
        row.append(str(j.get("mesSorte") or j.get("nomeTimeCoracaoMesSorte") or "").strip().capitalize())
    return row


def api_concurso(jid, tipo, n):
    for i, url in enumerate(APIS):
        alvo = ("ultimo" if i == 1 else "latest") if n == "latest" else n
        try:
            row = api_row(jid, tipo, api_json(url.format(id=jid, n=alvo)))
            if row:
                return row
        except Exception:
            continue
    return None


def completar_pela_api(jid, tipo, atuais):
    """Baixa pela API os concursos mais novos que a base do GitHub ainda não trouxe."""
    ult = api_concurso(jid, tipo, "latest")
    if not ult:
        print(f"    API indisponível para {jid}")
        return
    local = max(atuais) if atuais else 0
    novos = 0
    for n in range(local + 1, ult[0]):
        if novos >= MAX_API_POR_RODADA:
            break
        row = api_concurso(jid, tipo, n)
        if row:
            atuais[n] = row
            novos += 1
    if ult[0] > local:
        atuais[ult[0]] = ult
        novos += 1
    if novos:
        print(f"    +{novos} concurso(s) pela API (até o {ult[0]})")


def mes_online(n):
    """Mês da Sorte do concurso n, tentando cada API; None se nenhuma responder."""
    for url in APIS_MES:
        try:
            req = urllib.request.Request(url.format(n=n), headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                j = json.loads(r.read())
            if isinstance(j, list):
                j = j[0] if j else {}
            mes = str(j.get("mesSorte") or j.get("nomeTimeCoracaoMesSorte") or "").strip()
            if mes:
                return mes.capitalize()
        except Exception:
            continue
    return None


def completar_meses(atuais):
    """Preenche o Mês da Sorte dos concursos que ainda estão sem ele."""
    faltam = [n for n in sorted(atuais, reverse=True)
              if len(atuais[n]) < 4 or not atuais[n][3]][:MAX_MESES_POR_RODADA]
    ok = falhas = 0
    for n in faltam:
        mes = mes_online(n)
        if mes:
            atuais[n] = atuais[n][:3] + [mes]
            ok += 1
        else:
            falhas += 1
            if falhas >= 5:   # fontes fora do ar: tenta de novo na próxima rodada
                break
    if faltam:
        print(f"    Mês da Sorte: {ok} preenchido(s), {len(faltam) - ok} pendente(s)")


def extra_de(x, tipo):
    if tipo == "dupla":
        return [int(d) for d in (x.get("resultado_2") or [])]
    if tipo == "trevos":
        return [int(d) for d in (x.get("trevos") or [])]
    if tipo == "time":
        return str(x.get("time_do_coracao") or "").strip()
    if tipo == "mes":
        return str(x.get("mes_da_sorte") or x.get("mesSorte") or "").strip()
    return None


def carregar(jid):
    f = os.path.join(DATA, jid + ".json")
    if not os.path.isfile(f):
        return {}
    d = json.load(open(f, encoding="utf-8"))
    return {r[0]: r for r in d.get("concursos", [])}


def main():
    os.makedirs(DATA, exist_ok=True)
    for jid, gh, tipo in JOGOS:
        atuais = carregar(jid)
        try:
            lista = baixar(gh)
        except Exception as e:  # base do GitHub fora: segue só com a API
            print(f"  ! {jid}: GitHub indisponível ({e})")
            lista = []
        for x in lista:
            try:
                n = int(x["concurso"])
            except Exception:
                continue
            dez = [int(d) for d in (x.get("resultado") or x.get("resultado_1") or [])]
            if not dez:
                continue
            row = [n, x.get("data", ""), dez]
            if tipo:
                ex = extra_de(x, tipo)
                antigo = atuais.get(n)
                if not ex and antigo and len(antigo) > 3:
                    ex = antigo[3]          # não perde um extra que já tínhamos
                row.append(ex if ex is not None else "")
            atuais[n] = row
        completar_pela_api(jid, tipo, atuais)
        if tipo == "mes":
            completar_meses(atuais)
        rows = [atuais[k] for k in sorted(atuais)]
        out = {"jogo": jid,
               "atualizado": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "concursos": rows}
        with open(os.path.join(DATA, jid + ".json"), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  ✓ {jid}: {len(rows)} concursos (último {rows[-1][0] if rows else '-'})")


if __name__ == "__main__":
    main()
