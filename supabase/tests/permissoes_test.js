// Testa as regras contra a tabela de recursos combinada (deno test).
import "../functions/_shared/permissoes.js";
import R from "../functions/_shared/regras.json" with { type: "json" };
const P = globalThis.MC_PERM;
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg + ": esperado " + JSON.stringify(b) + ", veio " + JSON.stringify(a)); }

Deno.test("tabela de recursos por plano", () => {
  const casos = [
    // recurso, valor, grátis, pro, elite
    ["loteria", "megasena", true, true, true], ["loteria", "lotofacil", true, true, true], ["loteria", "quina", false, true, true],
    ["geradorJogos", 10, true, true, true], ["geradorJogos", 11, false, true, true],
    ["geradorPonderado", null, false, true, true], ["conferencia", null, true, true, true],
    ["historicoCompleto", null, false, true, true], ["estatisticasCompletas", null, false, true, true],
    ["graficos", null, false, true, true], ["filtros", null, false, true, true],
    ["fechamentoPronto", "megasena-9-quadra", true, true, true], ["fechamentoPronto", "megasena-12-quadra", false, true, true], ["fechamentoPronto", "lotofacil-16-13", true, true, true],
    ["fechamentoPersonalizado", null, false, true, true],
    ["jogosSalvos", 19, true, true, true], ["jogosSalvos", 20, false, true, true],
    ["otimizador", null, false, false, true], ["monteCarlo", null, false, false, true],
    ["relatorioPdf", "simples", false, true, true], ["relatorioPdf", "completo", false, false, true],
    ["exportar", null, false, true, true], ["avisoEmail", null, false, true, true], ["suporteEmail", null, false, true, true],
  ];
  for (const [rec, v, g, p, e] of casos) eq(["gratis", "pro", "elite"].map(pl => P.pode(R, pl, rec, v).ok), [g, p, e], rec + " " + v);
  eq(P.pode(R, "gratis", "monteCarlo").planoMinimo.id, "elite", "plano mínimo do Monte Carlo");
  eq(P.pode(R, "gratis", "loteria", "quina").planoMinimo.id, "pro", "plano mínimo da Quina");
  eq([P.limiteDiario(R, "elite", "otimizador"), P.limiteDiario(R, "elite", "monteCarlo"), P.limiteDiario(R, "pro", "otimizador")], [20, 10, 0], "limites diários");
  eq(["gratis", "pro", "elite"].map(p => P.limites(R, p).sessoes), [1, 1, 2], "sessões");
});

Deno.test("preços e cupons", () => {
  eq([P.preco(R, "pro", "mensal", "cartao"), P.preco(R, "pro", "anual", "cartao"), P.preco(R, "pro", "anual", "pix")], [9.9, 99, 89.9], "preços Pro");
  eq([P.preco(R, "elite", "mensal", "pix"), P.preco(R, "elite", "anual", "cartao"), P.preco(R, "elite", "anual", "pix")], [19.9, 199, 179.9], "preços Elite");
  eq(P.preco(R, "gratis", "mensal", "cartao"), null, "grátis não tem preço");
  const lot = {codigo: "LOTERICA", plano: "pro", ciclo: "anual", forma: null, preco: 79, ativo: true, usos: 0, max_usos: null};
  eq(P.aplicarCupom(R, "pro", "anual", "cartao", lot).valor, 79, "cupom preço fixo");
  eq(P.aplicarCupom(R, "pro", "anual", "pix", lot).valor, 79, "cupom vale no Pix");
  eq(!!P.aplicarCupom(R, "pro", "mensal", "cartao", lot).erro, true, "cupom do anual recusado no mensal");
  eq(!!P.aplicarCupom(R, "pro", "anual", "cartao", {...lot, valido_ate: "2020-01-01"}).erro, true, "cupom expirado");
  eq(!!P.aplicarCupom(R, "pro", "anual", "cartao", {...lot, max_usos: 5, usos: 5}).erro, true, "cupom esgotado");
  eq(P.aplicarCupom(R, "elite", "mensal", "cartao", {codigo: "X", plano: "elite", ciclo: "mensal", desconto_pct: 50, ativo: true, usos: 0}).valor, 9.95, "cupom percentual");
  eq(P.porMes(99, "anual"), 8.25, "anual por mês");
});

Deno.test("comparação e perdas do fim do teste", () => {
  const c = P.comparacao(R);
  eq(c.length, R.comparacao.length, "linhas da comparação");
  eq(c.find(l => l.chave === "monteCarloPorDia").valores, ["—", "—", "Até 10 execuções/dia"], "Monte Carlo na comparação");
  const perdas = P.perdas(R, "elite", "gratis");
  if (perdas.length < 10) throw new Error("perdas do teste incompletas: " + perdas.length);
});
