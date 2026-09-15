/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — CONFIGURAÇÃO
   ► Este é o ÚNICO arquivo que você precisa editar.
   ═══════════════════════════════════════════════════════════════ */
window.COLI_CONFIG = {

  /* WhatsApp da lotérica: 55 + DDD + número (somente dígitos) */
  whatsapp: "5511999999999",

  /* Dados exibidos no rodapé */
  nome:     "Coli Loterias",
  endereco: "Rua Agostinho Gomes, 1770 – Ipiranga, São Paulo/SP",
  horario:  "Seg a Sex 8h às 19h · Sáb 8h às 14h",
  instagram:"",                 /* ex.: "https://instagram.com/coliloterias" (deixe "" para ocultar) */

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
