/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — CONFIGURAÇÃO
   ► Este é o ÚNICO arquivo que você precisa editar.
   ═══════════════════════════════════════════════════════════════ */
window.COLI_CONFIG = {

  /* WhatsApp da lotérica: 55 + DDD + número (somente dígitos).
     ⚠ CONFIRME este número antes de publicar. */
  whatsapp: "551120618868",

  /* Dados da lotérica */
  nome:      "Coli Loterias",
  slogan:    "Com a sorte na palma da mão",
  endereco:  "Rua Agostinho Gomes, 1770 – Ipiranga, São Paulo/SP – CEP 04206-000",
  telefones: ["(11) 2061-8868", "(11) 2271-2828"],
  horario:   "Seg a Sex 8h às 19h · Sáb 8h às 14h",   /* ajuste se necessário */
  fundacao:  1986,
  mapsUrl:   "https://www.google.com/maps/search/?api=1&query=Coli+Loterias+Rua+Agostinho+Gomes+1770+Ipiranga+S%C3%A3o+Paulo",
  instagram: "https://www.instagram.com/coli_loterias/",
  facebook:  "https://www.facebook.com/ColiLoterias/",

  /* Link dos bolões oficiais da CAIXA (Marketplace) */
  bolaoUrl: "https://www.loteriasonline.caixa.gov.br/silce-web/#/bolao-caixa/2894",

  /* Caminho do proxy PHP (relativo à pasta onde o site foi instalado).
     Ele consulta a API oficial da CAIXA no servidor e guarda cache.
     Se o servidor não tiver PHP, o site usa as fontes públicas de reserva. */
  api: "api/loterias.php",

  /* Pasta com o histórico completo dos concursos (arquivos .json) */
  dataDir: "data/",

  /* De quantos em quantos minutos a página consulta novos resultados */
  atualizarCadaMin: 5
};
