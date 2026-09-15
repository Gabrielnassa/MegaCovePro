/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — CONFIGURAÇÃO
   ► Este é o ÚNICO arquivo que você precisa editar.
   ═══════════════════════════════════════════════════════════════ */
window.COLI_CONFIG = {

  /* WhatsApp da lotérica: 55 + DDD + número (somente dígitos).
     WhatsApp da loja. */
  whatsapp: "551120637676",

  /* Dados da lotérica */
  nome:      "Coli Loterias",
  razaoSocial: "Coli Loterias Ltda",
  cnpj:      "55.311.112/0001-55",
  slogan:    "Com a sorte na palma da mão",
  endereco:  "Rua Agostinho Gomes, 1770 – Ipiranga, São Paulo/SP – CEP 04206-000",
  telefones: ["(11) 2061-8868", "(11) 2271-2828"],
  horario:   "Seg a Sex 8h às 19h · Sáb 8h às 14h",   /* ajuste se necessário */
  fundacao:  1986,
  mapsUrl:   "https://www.google.com/maps/search/?api=1&query=Coli+Loterias+Rua+Agostinho+Gomes+1770+Ipiranga+S%C3%A3o+Paulo",
  instagram: "https://www.instagram.com/coli_loterias/",
  facebook:  "https://www.facebook.com/ColiLoterias/",
  youtube:   "https://www.youtube.com/@coli_loterias",

  /* ═══ PRÊMIOS ENTREGUES (linha do tempo da página "Quem somos") ═══
     Para adicionar um prêmio novo, copie uma linha e coloque no TOPO da lista.
     Campos: data (texto livre), loteria, valor, titulo e texto (opcional).   */
  premios: [
    { data: "Abril de 2025", loteria: "Dupla Sena de Páscoa", valor: "R$ 25 milhões",
      titulo: "Bolão premiado na Dupla de Páscoa",
      texto: "A Coli entregou R$ 25 milhões no concurso especial da Dupla Sena de Páscoa 2025." }
    /* , { data: "Mês de 2026", loteria: "Mega-Sena", valor: "R$ 1 milhão", titulo: "…", texto: "…" } */
  ],

  /* Link dos bolões oficiais da CAIXA (Marketplace) */
  bolaoUrl: "https://www.loteriasonline.caixa.gov.br/silce-web/#/bolao-caixa/2894",

  /* Caminho do proxy PHP (relativo à pasta onde o site foi instalado).
     Ele consulta a API oficial da CAIXA no servidor e guarda cache.
     Se o servidor não tiver PHP, o site usa as fontes públicas de reserva. */
  api: "api/loterias.php",

  /* Pasta com o histórico completo dos concursos (arquivos .json) */
  dataDir: "data/",

  /* Pergunta "Você tem 18 anos ou mais?" ao abrir o site (lembra por 30 dias) */
  verificarIdade: true,

  /* De quantos em quantos minutos a página consulta novos resultados */
  atualizarCadaMin: 5
};
