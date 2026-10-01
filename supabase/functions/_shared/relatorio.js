// Relatórios do servidor: CSV (Pro e Elite), PDF simples (Pro) e PDF completo (Elite).
// Os textos falam em organizar jogos e custo; nunca em aumentar chance de ganhar.
import { jsPDF } from "npm:jspdf@2.5.1";
import { MC, R } from "./base.js";

export function custoJogo(cfg, jogo, extra) {
  const base = (R.precoApostaCaixa || {})[cfg.chave];
  if (base == null) return null;
  if (cfg.colunar) return base * MC.custoSS(jogo);
  let mult = MC.util.comb(jogo.length, cfg.aposta_min);
  if (cfg.chave === "maismilionaria") {
    const t = String(extra || "").split(/[^0-9]+/).filter(Boolean).length || 2;
    mult *= MC.util.comb(t, 2);
  }
  return Math.round(base * mult * 100) / 100;
}
const txt = (cfg, j) => cfg.colunar ? j.map((c) => c.join("")).join(" | ") : j.map((d) => cfg.fmt(d)).join(" ");
const reais = (v) => v == null ? "—" : "R$ " + v.toFixed(2).replace(".", ",");

export function csv(cfg, jogos, extras) {
  const linhas = [["Jogo", "Dezenas", "Quantidade", "Custo estimado (R$)"].concat(cfg.extra_nome ? [cfg.extra_nome] : [])];
  jogos.forEach((j, i) => {
    const c = custoJogo(cfg, j, extras && extras[i]);
    linhas.push([i + 1, txt(cfg, j), cfg.colunar ? MC.custoSS(j) : j.length, c == null ? "" : c.toFixed(2).replace(".", ",")]
      .concat(cfg.extra_nome ? [extras && extras[i] || ""] : []));
  });
  return "﻿" + linhas.map((l) => l.map((x) => /[;"\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(";")).join("\r\n");
}

/* tipo: "simples" (lista de jogos) | "completo" (análise, gráfico e custo) */
export function pdf(cfg, jogos, extras, tipo, cs) {
  const d = new jsPDF({unit: "mm", format: "a4"}), W = 210, M = 15;
  let y = 18;
  const linha = (h) => { y += h; if (y > 280) { d.addPage(); y = 18; } };
  d.setFont("helvetica", "bold"); d.setFontSize(16); d.text(`MegaCover · ${cfg.nome}`, M, y);
  d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(110);
  linha(6); d.text(`Relatório ${tipo === "completo" ? "completo" : "simples"} · ${jogos.length} jogo(s) · gerado em ${new Date().toLocaleString("pt-BR", {timeZone: R.fuso})}`, M, y);
  d.setTextColor(0); linha(8);

  const ctx = tipo === "completo" && cs && cs.length && !cfg.colunar ? MC.contexto(cs, cfg) : null;
  let total = 0, temCusto = true;
  d.setFont("helvetica", "bold"); d.setFontSize(10);
  d.text("#", M, y); d.text("Dezenas", M + 10, y);
  if (tipo === "completo") { d.text("Soma", 140, y); d.text("P/I", 156, y); d.text("Score", 170, y); d.text("Custo", 186, y); }
  d.setFont("helvetica", "normal"); linha(5);
  jogos.forEach((j, i) => {
    const t = txt(cfg, j) + (extras && extras[i] ? "  #" + extras[i] : "");
    const partes = d.splitTextToSize(t, tipo === "completo" ? 120 : 180);
    d.text(String(i + 1), M, y); d.text(partes, M + 10, y);
    if (tipo === "completo") {
      const c = custoJogo(cfg, j, extras && extras[i]);
      if (c == null) temCusto = false; else total += c;
      if (!cfg.colunar) {
        const pi = MC.paresImpares(j);
        d.text(String(MC.soma(j)), 140, y); d.text(pi[0] + "/" + pi[1], 156, y);
        if (ctx) d.text(String(MC.megascore(j, cfg, ctx)), 170, y);
      }
      d.text(reais(c), 186, y);
    }
    linha(Math.max(5, partes.length * 4.5));
  });

  if (tipo === "completo") {
    linha(4);
    d.setFont("helvetica", "bold"); d.setFontSize(11); d.text("Custo do conjunto", M, y); linha(6);
    d.setFont("helvetica", "normal"); d.setFontSize(10);
    d.text(temCusto ? `Total estimado: ${reais(total)} (${jogos.length} aposta(s), preços de referência da CAIXA).` : "Custo indisponível para esta loteria.", M, y); linha(5);
    d.setFontSize(8.5); d.setTextColor(110);
    d.text("Confira o valor na lotérica: a CAIXA pode reajustar os preços. Use o custo para organizar seus jogos dentro do seu orçamento.", M, y);
    d.setTextColor(0); linha(9);

    if (!cfg.colunar) {
      // frequência das dezenas dentro do conjunto (gráfico de barras)
      const cont = {}; jogos.forEach((j) => j.forEach((x) => { cont[x] = (cont[x] || 0) + 1; }));
      const ds = cfg.dezenas, mx = Math.max(1, ...ds.map((x) => cont[x] || 0));
      if (y > 210) { d.addPage(); y = 18; }
      d.setFont("helvetica", "bold"); d.setFontSize(11); d.text("Uso de cada dezena no seu conjunto", M, y); linha(4);
      const H = 40, bw = (W - 2 * M) / ds.length, y0 = y + H;
      ds.forEach((x, i) => {
        const h = (cont[x] || 0) / mx * H;
        d.setFillColor(cont[x] ? 176 : 225, cont[x] ? 132 : 225, cont[x] ? 44 : 225);
        d.rect(M + i * bw + 0.2, y0 - Math.max(h, 0.4), Math.max(bw - 0.4, 0.3), Math.max(h, 0.4), "F");
      });
      d.setFontSize(6); d.setTextColor(110);
      ds.forEach((x, i) => { if (ds.length <= 31 || i % 5 === 0) d.text(cfg.fmt(x), M + i * bw + bw / 2, y0 + 3, {align: "center"}); });
      d.setTextColor(0); y = y0 + 8;
      const usadas = ds.filter((x) => cont[x]).length;
      d.setFontSize(10); d.setFont("helvetica", "normal");
      d.text(`Cobertura: ${usadas} de ${ds.length} dezenas aparecem no conjunto.`, M, y); linha(5);
      if (ctx) {
        const med = jogos.reduce((a, j) => a + MC.megascore(j, cfg, ctx), 0) / jogos.length;
        d.text(`MegaScore médio: ${med.toFixed(1).replace(".", ",")} (equilíbrio estatístico do jogo, não é probabilidade de prêmio).`, M, y); linha(5);
      }
    }
  }
  linha(6); d.setFontSize(8); d.setTextColor(120);
  d.text(d.splitTextToSize("O MegaCover é uma ferramenta estatística para organizar seus jogos e reduzir o custo das apostas. Não prevê resultados nem garante prêmios: cada sorteio é aleatório e independente. Proibido para menores de 18 anos.", W - 2 * M), M, y);
  return new Uint8Array(d.output("arraybuffer"));
}
