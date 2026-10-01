/* MegaCover Pro Elite — interpretação das regras comerciais (assets/regras.json).
   O MESMO arquivo roda no servidor (Supabase Edge Functions, Deno) e no site: o servidor decide,
   o site só usa para mostrar textos e avisos. Nenhuma regra fica espalhada pelo código: tudo o que
   muda por plano vem de regras.json e passa por aqui. */
(function (root) {
"use strict";

function planos(R) { return R.planos.slice().sort(function (a, b) { return a.nivel - b.nivel; }); }
function plano(R, id) { for (var i = 0; i < R.planos.length; i++) if (R.planos[i].id === id) return R.planos[i]; return null; }
function limites(R, id) { return R.limites[id] || R.limites.gratis; }

/* Avaliação de cada recurso. valor = o que a pessoa está pedindo (ex.: nº de jogos, nome da loteria). */
var TESTES = {
  loteria: function (L, v) { return L.loterias === "todas" || L.loterias.indexOf(v) >= 0; },
  geradorJogos: function (L, v) { return L.geradorMaxJogos == null || v <= L.geradorMaxJogos; },
  geradorPonderado: function (L) { return !!L.geradorPonderado; },
  conferencia: function (L) { return !!L.conferencia; },
  historicoCompleto: function (L) { return L.historicoConcursos == null; },
  estatisticasCompletas: function (L) { return L.estatisticas === "completas"; },
  graficos: function (L) { return !!L.graficos; },
  filtros: function (L) { return !!L.filtros; },
  fechamentoPronto: function (L, v, R) { return L.fechamentosProntos === "todos" || (R.fechamentosExemplo || []).indexOf(v) >= 0; },
  fechamentoPersonalizado: function (L) { return !!L.fechamentoPersonalizado; },
  jogosSalvos: function (L, v) { return L.jogosSalvos == null || v < L.jogosSalvos; },
  otimizador: function (L) { return L.otimizadoresPorDia > 0; },
  monteCarlo: function (L) { return L.monteCarloPorDia > 0; },
  relatorioPdf: function (L, v) { return v === "completo" ? L.relatorioPdf === "completo" : L.relatorioPdf !== "nao"; },
  exportar: function (L) { return !!L.exportar; },
  avisoEmail: function (L) { return !!L.avisoEmail; },
  suporteEmail: function (L) { return L.suporte !== "faq"; },
  volante: function (L) { return L.volante !== false; }
};
var NOMES = {
  loteria: "Todas as 9 loterias", geradorJogos: "Gerador sem limite de jogos", geradorPonderado: "Gerador ponderado pelo histórico",
  conferencia: "Conferência de jogos", historicoCompleto: "Histórico completo de resultados", estatisticasCompletas: "Estatísticas completas",
  graficos: "Gráficos", filtros: "Filtros de soma, pares, repetidas e sequências", fechamentoPronto: "Todos os fechamentos prontos",
  fechamentoPersonalizado: "Fechamento personalizado", jogosSalvos: "Jogos salvos ilimitados", otimizador: "Algoritmo genético e simulated annealing",
  monteCarlo: "Simulação Monte Carlo", relatorioPdf: "Relatórios em PDF", exportar: "Exportar Excel/CSV", avisoEmail: "Aviso de resultado por e-mail",
  suporteEmail: "Suporte por e-mail", volante: "Volante virtual"
};

/* Pode usar? Devolve {ok, recurso, nome, planoMinimo} — planoMinimo = plano mais barato que libera. */
function pode(R, planoId, recurso, valor) {
  var t = TESTES[recurso]; if (!t) throw new Error("Recurso desconhecido: " + recurso);
  var ok = !!t(limites(R, planoId), valor, R), min = null;
  if (!ok) { var ps = planos(R); for (var i = 0; i < ps.length; i++) if (t(limites(R, ps[i].id), valor, R)) { min = ps[i]; break; } }
  return {ok: ok, recurso: recurso, nome: NOMES[recurso] || recurso, planoMinimo: min ? {id: min.id, nome: min.nome} : null};
}
/* Limite diário (otimizadores e Monte Carlo): número, ou 0 = não tem. */
function limiteDiario(R, planoId, recurso) {
  var L = limites(R, planoId);
  return recurso === "otimizador" ? (L.otimizadoresPorDia || 0) : recurso === "monteCarlo" ? (L.monteCarloPorDia || 0) : 0;
}

/* ---------- preços e cupons ---------- */
function preco(R, planoId, ciclo, forma) {
  var p = plano(R, planoId); if (!p || !p.precos || !p.precos[ciclo]) return null;
  var v = p.precos[ciclo][forma === "pix" ? "pix" : "cartao"];
  return v == null ? null : v;
}
/* cupom = linha da tabela cupons. Devolve {valor, original, desconto} ou {erro}. */
function aplicarCupom(R, planoId, ciclo, forma, cupom, agora) {
  var base = preco(R, planoId, ciclo, forma);
  if (base == null) return {erro: "Plano ou ciclo inválido."};
  if (!cupom) return {valor: base, original: base, desconto: 0};
  agora = agora || new Date();
  if (!cupom.ativo) return {erro: "Cupom inativo."};
  if (cupom.plano !== planoId || cupom.ciclo !== ciclo) return {erro: "Este cupom vale para o plano " + cupom.plano + " " + cupom.ciclo + "."};
  if (cupom.forma && cupom.forma !== forma) return {erro: "Este cupom vale só no " + (cupom.forma === "pix" ? "Pix" : "cartão") + "."};
  if (cupom.valido_ate && new Date(cupom.valido_ate) < agora) return {erro: "Cupom expirado."};
  if (cupom.max_usos != null && cupom.usos >= cupom.max_usos) return {erro: "Cupom esgotado."};
  var v = cupom.preco != null ? Number(cupom.preco) : Math.round(base * (100 - Number(cupom.desconto_pct))) / 100;
  v = Math.max(0, Math.min(base, v));
  return {valor: Math.round(v * 100) / 100, original: base, desconto: Math.round((base - v) * 100) / 100};
}
function reais(v) { return v == null ? "" : "R$ " + Number(v).toFixed(2).replace(".", ","); }
function porMes(v, ciclo) { return ciclo === "anual" ? Math.round(v / 12 * 100) / 100 : v; }

/* ---------- textos (comparação, avisos) ---------- */
function texto(R, chave, v) {
  var T = R.textos || {};
  if (chave === "loterias") return v === "todas" ? "Todas as 9" : v.map(function (x) { return x === "megasena" ? "Mega-Sena" : x === "lotofacil" ? "Lotofácil" : x; }).join(" e ");
  if (chave === "geradorMaxJogos") return v == null ? "Ilimitado" : "Até " + v + " jogos por vez";
  if (chave === "historicoConcursos") return v == null ? "Completo" : "Últimos " + v + " concursos";
  if (chave === "jogosSalvos") return v == null ? "Ilimitado" : "Até " + v;
  if (chave === "otimizadoresPorDia" || chave === "monteCarloPorDia") return v ? "Até " + v + " execuções/dia" : "—";
  if (chave === "sessoes") return String(v);
  if (chave === "suporte") return (R.suporte[v] || {}).rotulo || v;
  if (T[chave] && T[chave][v] != null) return T[chave][v];
  if (v === true) return "✓"; if (v === false) return "—";
  return String(v);
}
function comparacao(R) {
  var ps = planos(R);
  return R.comparacao.map(function (c) {
    return {rotulo: c.rotulo, chave: c.chave, valores: ps.map(function (p) { return texto(R, c.chave, limites(R, p.id)[c.chave]); })};
  });
}
/* O que a pessoa perde ao passar de um plano para outro (ex.: fim do teste Elite → Grátis). */
function perdas(R, de, para) {
  var A = limites(R, de), B = limites(R, para), out = [];
  R.comparacao.forEach(function (c) {
    var a = texto(R, c.chave, A[c.chave]), b = texto(R, c.chave, B[c.chave]);
    if (a !== b) out.push({rotulo: c.rotulo, antes: a, depois: b});
  });
  return out;
}

var API = {planos: planos, plano: plano, limites: limites, pode: pode, limiteDiario: limiteDiario, preco: preco,
  aplicarCupom: aplicarCupom, reais: reais, porMes: porMes, texto: texto, comparacao: comparacao, perdas: perdas, RECURSOS: Object.keys(TESTES)};
if (typeof module !== "undefined" && module.exports) module.exports = API;
else root.MC_PERM = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
