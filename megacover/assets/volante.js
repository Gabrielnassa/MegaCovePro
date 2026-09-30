/* MegaCover Pro Elite — impressão no volante oficial.
   Tudo é desenhado em milímetros reais. Cada loteria tem um "molde" (posição
   da grade de números no volante) que o usuário calibra uma vez com o volante
   de verdade; a calibração fica salva no navegador e pode ser exportada. */
(function () {
"use strict";

/* Geometria exata dos volantes virtuais (mm, relativa ao canto superior esquerdo do recorte de 82 mm),
   medida em scans de volantes impressos e conferida com jogos conhecidos. */
/* Geometria EXATA dos volantes, em mm, com origem no canto superior esquerdo do papel (recorte).
   Escala verdadeira: medida nos scans a 300 dpi do LoteriaSoft (Mega, Quina, Dia de Sorte, Super Sete, Lotofácil)
   e nas fotos dos volantes atuais (Dupla Sena, Timemania, Lotomania e as mudanças da Lotofácil),
   conferida sobre as fotos. relogioX/topoX/colunas = centro das marcas. papel = largura × altura do volante. */
var EXATO = {"lotofacil":{"esquema":"colunaDir","colunas":[12.84,25.99,39.14,52.28,65.43],"blocos":[[45.41,49.98,54.38,58.92,63.41],[70.6,75.09,79.62,84.15,88.63],[96.04,100.58,105.06,109.59,114.08]],"relogioX":2.89,"relogio":[40.33,45.41,49.98,54.38,58.92,63.41,70.6,75.09,79.62,84.15,88.63,96.04,100.58,105.06,109.59,114.08,121.79,129.74,137.96,143.75,147.77,152.1],"topoY":40.33,"topoX":[20.42,26.75,33.16,39.49],"marca":[3.38,2.29],"linhas":5,"jogos":3,"papel":[84.0,187.83],"qtdPos":{"15":[14.26,121.79],"16":[20.76,121.79],"17":[27.26,121.79],"18":[33.76,121.79],"19":[40.26,121.79],"20":[46.76,121.79]}},"megasena":{"esquema":"linha","colunas":[13.73,20.11,26.5,32.89,39.27,45.66,52.05,58.44,64.82,71.21],"blocos":[[50.48,53.79,56.88,60.14,63.28,66.7],[75.76,78.93,82.11,85.28,88.51,91.93],[100.66,103.87,107.01,110.22,113.44,116.86]],"relogioX":3.02,"relogio":[46.04,50.48,53.79,56.88,60.14,63.28,66.7,70.17,75.76,78.93,82.11,85.28,88.51,91.93,95.37,100.66,103.87,107.01,110.22,113.44,116.86,120.25,127.75,136.97,147.39,155.89,159.03,162.25],"topoY":46.04,"topoX":[8.14,39.64,52.34],"marca":[3.64,1.53],"linhas":6,"jogos":3,"papel":[84.0,185.65],"qtdPos":{"6":[13.73,127.76],"7":[20.11,127.76],"8":[26.5,127.76],"9":[32.89,127.76],"10":[39.27,127.76],"11":[45.66,127.76],"12":[52.05,127.76],"13":[58.44,127.76],"14":[64.82,127.76],"15":[71.21,127.76]}},"quina":{"esquema":"linha","colunas":[13.52,19.91,26.29,32.67,39.05,45.43,51.82,58.2,64.58,70.96],"blocos":[[42.57,45.83,48.96,52.22,55.32,58.79,62.22,65.68],[74.15,77.41,80.55,83.76,86.94,90.37,93.84,97.23],[106.2,109.46,112.59,115.9,118.99,122.5,125.93,129.36]],"relogioX":3.02,"relogio":[38.64,42.57,45.83,48.96,52.22,55.32,58.79,62.22,65.68,68.86,74.15,77.41,80.55,83.76,86.94,90.37,93.84,97.23,100.7,106.2,109.46,112.59,115.9,118.99,122.5,125.93,129.36,132.78,139.94,148.75,157.17,163.52,167.54],"topoY":38.64,"topoX":[13.82,52.0,71.05],"marca":[3.64,1.53],"linhas":8,"jogos":3,"papel":[84.0,196.04],"qtdPos":{"5":[13.52,139.89],"6":[19.91,139.89],"7":[26.29,139.89],"8":[32.67,139.89],"9":[39.05,139.89],"10":[45.43,139.89],"11":[51.82,139.89],"12":[58.2,139.89],"13":[64.58,139.89],"14":[70.96,139.89],"15":[77.34,139.89]}},"lotomania":{"esquema":"linhaZeroFim","colunas":[14.07,20.41,26.74,33.08,39.41,45.75,52.08,58.42,64.75,71.09],"blocos":[[28.07,31.45,34.98,38.5,41.88,45.34,48.65,52.17,55.62,59.0],[72.3,75.68,79.2,82.58,85.95,89.4,92.78,96.22,99.74,103.11]],"relogioX":3.0,"relogio":[24.12,28.07,31.45,34.98,38.5,41.88,45.34,48.65,52.17,55.62,59.0,62.31,72.3,75.68,79.2,82.58,85.95,89.4,92.78,96.22,99.74,103.11,106.35,123.91,138.38,152.84],"topoY":24.3,"topoX":[20.04,26.37,58.13,64.68],"marca":[3.6,1.8],"linhas":10,"jogos":2,"papel":[84.0,181.17]},"duplasena":{"esquema":"linha","colunas":[14.12,20.49,26.86,33.23,39.6,45.97,52.33,58.7,65.07,71.44],"blocos":[[50.09,53.28,56.54,59.72,62.97],[72.66,75.91,79.15,82.4,85.64],[95.23,98.47,101.71,104.94,108.25]],"relogioX":3.0,"relogio":[45.7,50.09,53.28,56.54,59.72,62.97,66.16,72.66,75.91,79.15,82.4,85.64,88.75,95.23,98.47,101.71,104.94,108.25,111.41,119.0,122.23,132.05,142.14,152.64,156.63,160.61],"topoY":45.3,"topoX":[33.46,39.9,46.27],"marca":[3.6,1.8],"linhas":5,"jogos":3,"papel":[84.0,181.54],"qtdPos":{"6":[14.12,119.0],"7":[20.49,119.0],"8":[26.86,119.0],"9":[33.23,119.0],"10":[39.6,119.0],"11":[45.97,119.0],"12":[52.33,119.0],"13":[58.7,119.0],"14":[65.07,119.0],"15":[71.44,119.0],"16":[14.12,122.23],"17":[20.49,122.23],"18":[26.86,122.23],"19":[33.23,122.23],"20":[39.6,122.23]}},"timemania":{"esquema":"linha","colunas":[14.73,21.08,27.43,33.78,40.13,46.48,52.83,59.18,65.53,71.88],"blocos":[[24.58,28.3,31.87,35.45,39.09,42.73,46.45,50.1]],"relogioX":3.0,"relogio":[21.01,24.58,28.3,31.87,35.45,39.09,42.73,46.45,50.1,57.31,61.03,64.6,68.32,72.03,75.61,79.32,83.04,86.68,90.33,94.04,97.76,101.4,105.05,108.77,112.48,116.13,119.84,123.49,127.2,130.92,134.49,138.21,141.85,145.5,149.21,152.93,157.22,161.0,166.51],"topoY":22.21,"topoX":[27.58,40.35,46.63,71.89],"marca":[3.6,1.8],"linhas":8,"jogos":1,"papel":[84.0,184.09],"times":[{"nome":"ABC/RN","x":8.38,"y":57.31},{"nome":"Águia Marabá/PA","x":8.38,"y":61.03},{"nome":"Altos/PI","x":8.38,"y":64.6},{"nome":"Amazonas/AM","x":8.38,"y":68.32},{"nome":"América/MG","x":8.38,"y":72.03},{"nome":"América/RN","x":8.38,"y":75.61},{"nome":"Anápolis/GO","x":8.38,"y":79.32},{"nome":"Aparecidense/GO","x":8.38,"y":83.04},{"nome":"ASA/AL","x":8.38,"y":86.68},{"nome":"Athletic Club/MG","x":8.38,"y":90.33},{"nome":"Athletico/PR","x":8.38,"y":94.04},{"nome":"Atlético/GO","x":8.38,"y":97.76},{"nome":"Atlético/MG","x":8.38,"y":101.4},{"nome":"Avaí/SC","x":8.38,"y":105.05},{"nome":"Bahia/BA","x":8.38,"y":108.77},{"nome":"Barra/SC","x":8.38,"y":112.48},{"nome":"Botafogo/PB","x":8.38,"y":116.13},{"nome":"Botafogo/RJ","x":8.38,"y":119.84},{"nome":"Botafogo/SP","x":8.38,"y":123.49},{"nome":"Bragantino/SP","x":8.38,"y":127.2},{"nome":"Brasil/RS","x":8.38,"y":130.92},{"nome":"Brasiliense/DF","x":8.38,"y":134.49},{"nome":"Brusque/SC","x":8.38,"y":138.21},{"nome":"Cascavel/PR","x":8.38,"y":141.85},{"nome":"Caxias/RS","x":8.38,"y":145.5},{"nome":"Ceará/CE","x":8.38,"y":149.21},{"nome":"Chapecoense/SC","x":8.38,"y":152.93},{"nome":"Confiança/SE","x":33.78,"y":57.31},{"nome":"Corinthians/SP","x":33.78,"y":61.03},{"nome":"Coritiba/PR","x":33.78,"y":64.6},{"nome":"CRB/AL","x":33.78,"y":68.32},{"nome":"Criciúma/SC","x":33.78,"y":72.03},{"nome":"Cruzeiro/MG","x":33.78,"y":75.61},{"nome":"CSA/AL","x":33.78,"y":79.32},{"nome":"Cuiabá/MT","x":33.78,"y":83.04},{"nome":"Ferroviária/SP","x":33.78,"y":86.68},{"nome":"Ferroviário/CE","x":33.78,"y":90.33},{"nome":"Figueirense/SC","x":33.78,"y":94.04},{"nome":"Flamengo/RJ","x":33.78,"y":97.76},{"nome":"Floresta/CE","x":33.78,"y":101.4},{"nome":"Fluminense/RJ","x":33.78,"y":105.05},{"nome":"Fortaleza/CE","x":33.78,"y":108.77},{"nome":"Goiás/GO","x":33.78,"y":112.48},{"nome":"Grêmio/RS","x":33.78,"y":116.13},{"nome":"Guarani/SP","x":33.78,"y":119.84},{"nome":"Inter Limeira/SP","x":33.78,"y":123.49},{"nome":"Internacional/RS","x":33.78,"y":127.2},{"nome":"Itabaiana/SE","x":33.78,"y":130.92},{"nome":"Ituano/SP","x":33.78,"y":134.49},{"nome":"Juventude/RS","x":33.78,"y":138.21},{"nome":"Londrina/PR","x":33.78,"y":141.85},{"nome":"Manaus/AM","x":33.78,"y":145.5},{"nome":"Maranhão/MA","x":33.78,"y":149.21},{"nome":"Maringá/PR","x":33.78,"y":152.93},{"nome":"Mirassol/SP","x":59.18,"y":57.31},{"nome":"Náutico/PE","x":59.18,"y":61.03},{"nome":"Nova Iguaçu/RJ","x":59.18,"y":64.6},{"nome":"Novorizontino/SP","x":59.18,"y":68.32},{"nome":"Operário/PR","x":59.18,"y":72.03},{"nome":"Palmeiras/SP","x":59.18,"y":75.61},{"nome":"Paysandu/PA","x":59.18,"y":79.32},{"nome":"Ponte Preta/SP","x":59.18,"y":83.04},{"nome":"Porto Velho/RO","x":59.18,"y":86.68},{"nome":"Remo/PA","x":59.18,"y":90.33},{"nome":"Retrô/PE","x":59.18,"y":94.04},{"nome":"Samp Corrêa/MA","x":59.18,"y":97.76},{"nome":"Santa Cruz/PE","x":59.18,"y":101.4},{"nome":"Santos/SP","x":59.18,"y":105.05},{"nome":"São Bernardo/SP","x":59.18,"y":108.77},{"nome":"São José/RS","x":59.18,"y":112.48},{"nome":"São Paulo/SP","x":59.18,"y":116.13},{"nome":"Sousa/PB","x":59.18,"y":119.84},{"nome":"Sport/PE","x":59.18,"y":123.49},{"nome":"Tocantinópolis/TO","x":59.18,"y":127.2},{"nome":"Tombense/MG","x":59.18,"y":130.92},{"nome":"Vasco/RJ","x":59.18,"y":134.49},{"nome":"Vila Nova/GO","x":59.18,"y":138.21},{"nome":"Vitória/BA","x":59.18,"y":141.85},{"nome":"Volta Redonda/RJ","x":59.18,"y":145.5},{"nome":"Ypiranga/RS","x":59.18,"y":149.21}]},"supersete":{"esquema":"digito","colunas":[15.08,21.43,27.78,34.13,40.48,46.83,53.18],"blocos":[[41.49,45.3,49.03,52.63,56.31,60.12,63.84,67.49,71.21,74.93]],"relogioX":3.06,"relogio":[27.32,41.49,45.3,49.03,52.63,56.31,60.12,63.84,67.49,71.21,74.93,78.66,85.05,89.04,97.75,106.52,113.58,117.35,120.78],"topoY":27.32,"topoX":[15.22,27.96,40.62,53.31],"marca":[3.73,1.95],"linhas":10,"jogos":1,"papel":[84.0,145.52],"qtdPos":{"7":[8.73,85.05],"8":[15.08,85.05],"9":[21.43,85.05],"10":[27.78,85.05],"11":[34.13,85.05],"12":[40.48,85.05],"13":[46.83,85.05],"14":[53.18,85.05],"15":[8.73,89.04],"16":[15.08,89.04],"17":[21.43,89.04],"18":[27.78,89.04],"19":[34.13,89.04],"20":[40.48,89.04],"21":[46.83,89.04]}},"diadesorte":{"esquema":"diadesorte","colunas":[8.1,14.49,20.88,27.26,33.65,40.04,46.43,52.81,59.2,65.59],"blocos":[[43.19,46.75,49.88,53.13],[75.54,79.06,82.23,85.48],[107.7,111.14,114.39,117.46]],"relogioX":3.06,"relogio":[36.63,43.19,46.75,49.88,53.14,59.2,62.67,66.05,75.58,79.05,82.26,85.44,91.54,94.96,98.4,107.7,111.14,114.35,117.49,123.62,127.06,130.48,137.63,146.44,154.91,161.01,165.03],"topoY":36.63,"topoX":[8.1,26.98,33.58,39.9,65.56],"marca":[3.72,1.78],"linhas":4,"jogos":3,"papel":[84.0,188.38],"meses":[[[8.1,59.2],[20.88,59.2],[33.65,59.2],[46.43,59.2],[59.2,59.2],[71.98,59.2],[8.1,62.67],[20.88,62.67],[33.65,62.67],[46.43,62.67],[59.2,62.67],[71.98,62.67]],[[8.1,91.54],[20.88,91.54],[33.65,91.54],[46.43,91.54],[59.2,91.54],[71.98,91.54],[8.1,94.96],[20.88,94.96],[33.65,94.96],[46.43,94.96],[59.2,94.96],[71.98,94.96]],[[8.1,123.62],[20.88,123.62],[33.65,123.62],[46.43,123.62],[59.2,123.62],[71.98,123.62],[8.1,127.06],[20.88,127.06],[33.65,127.06],[46.43,127.06],[59.2,127.06],[71.98,127.06]]],"qtdPos":{"7":[8.1,137.63],"8":[14.49,137.63],"9":[20.88,137.63],"10":[27.26,137.63],"11":[33.65,137.63],"12":[40.04,137.63],"13":[46.43,137.63],"14":[52.81,137.63],"15":[59.2,137.63]}},"maismilionaria":{"esquema":"linha","deitado":true,"colunas":[12.15,17.91,23.67,29.43,35.19],"deslocX":[0,34.4,68.8,103.2],"blocos":[[33.3,35.87,38.44,41.01,43.58,46.15,48.72,51.29,53.86,56.43],[33.3,35.87,38.44,41.01,43.58,46.15,48.72,51.29,53.86,56.43],[33.3,35.87,38.44,41.01,43.58,46.15,48.72,51.29,53.86,56.43],[33.3,35.87,38.44,41.01,43.58,46.15,48.72,51.29,53.86,56.43]],"relogioX":3.94,"relogio":[22.02,33.19,36.07,38.61,41.24,43.69,46.06,48.77,51.65,53.94,56.4,65.37,71.3,77.14,90.01,92.64,100.77,103.14,106.19],"topoY":21.93,"topoX":[17.32,23.08,29.34],"marca":[3.1,1.5],"qtd":{"y":89.9,"x0":17.57,"passo":5.76,"min":6},"qtd2":{"y":92.5,"x0":17.57,"passo":5.76,"min":2},"trevos":{"linhas":[65.3,71.35],"colunas":[17.91,23.67,29.43],"marca":[3.4,2.0]},"lista":{"y":23.6,"x":[43.1,111.1],"largura":66},"extra":null,"linhas":10,"jogos":4}};
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* Moldes iniciais (aproximados). Medidas em mm a partir do canto superior
   esquerdo do volante. Calibre com o volante real antes de usar. */
function base(o) {
  var d = {largura: 82, altura: 190, jogos: 1, dirJogos: "vertical", distJogos: 60,
    x: 12, y: 42, passoX: 6.4, passoY: 5.2, ordem: "linha", zeroNoFim: false,
    marcaL: 4, marcaA: 2.4, formato: "retangulo",
    extra: null, papel: "volante", papelX: 10, papelY: 10, ajusteX: 0, ajusteY: 0,
    rotacao: 0, escalaX: 100, escalaY: 100, virar: "nao",
    /* volante virtual em A4 (sulfite): até 4 jogos por folha, com cabeçalho e marcas de relógio */
    v: {jogos: 3, porFolha: 3, orientacao: "retrato", gapV: 2, largura: 82, altura: 205, recorteX: 8, recorteY: 2.5, x: 14, y: 32, gapY: 8,
        relogioX: 5, relogioL: 3.4, relogioA: 1.8, topoN: 2, topoX: 5, topoPasso: 5, topoY: 0, relogioFim: "",
        qtdMin: 0, qtdY: 0, qtdX: 0, qtdPasso: 5.5, arquivo: "", recorte: "sim", lista: "sim"}};
  for (var k in o) d[k] = o[k];
  return d;
}
var MOLDES = {
  megasena: base({linhas: 6, colunas: 10}),
  /* Lotofácil (medido na foto do volante): colunas de 5 números correndo de cima para baixo,
     da direita para a esquerda; fileira de 6 marcas no topo; campo "quantos números" abaixo dos blocos */
  lotofacil: base({linhas: 5, colunas: 5, passoX: 13.2, passoY: 5.25, ordem: "colunaDir", marcaL: 3.6, marcaA: 2.4,
    v: {jogos: 3, porFolha: 3, orientacao: "retrato", gapV: 2, largura: 82, altura: 205, recorteX: 8, recorteY: 2.5, x: 25, y: 52, gapY: 3.8,
        relogioX: 9.5, relogioL: 2.6, relogioA: 2.2, topoN: 6, topoX: 25, topoPasso: 5.3, topoY: 45, relogioFim: "135.5,145,154.5,161,166.3,169.5,172.7",
        qtdMin: 15, qtdY: 135.5, qtdX: 15, qtdPasso: 5.5, arquivo: "", recorte: "sim", lista: "sim"}}),
  quina: base({linhas: 8, colunas: 10, passoY: 4.6}),
  lotomania: base({linhas: 10, colunas: 10, passoY: 4.4, zeroNoFim: true}),
  duplasena: base({linhas: 5, colunas: 10}),
  timemania: base({linhas: 8, colunas: 10, passoY: 4.6}),
  diadesorte: base({linhas: 4, colunas: 8, passoX: 7.2, extra: {nome: "Mês da Sorte", linhas: 3, colunas: 4, x: 14, y: 72, passoX: 14, passoY: 5.2}}),
  supersete: base({linhas: 10, colunas: 7, passoX: 8.5, passoY: 4.8, x: 14, ordem: "coluna"}),
  maismilionaria: base({linhas: 5, colunas: 10, extra: {nome: "Trevos", linhas: 1, colunas: 6, x: 20, y: 74, passoX: 7, passoY: 5.2}})
};
/* +Milionária: volante deitado (185,8 × 111,2 mm), 4 jogos lado a lado, 2 volantes por folha A4 em pé */
Object.keys(EXATO).forEach(function (k) { var e = EXATO[k]; if (e.papel && MOLDES[k]) { MOLDES[k].v.largura = e.papel[0]; MOLDES[k].v.altura = e.papel[1]; } });
(function (v) { v.largura = 185.8; v.altura = 111.2; v.recorteX = 6.9; v.recorteY = 0; v.gapV = 0; v.porFolha = 2; v.jogos = 4; })(MOLDES.maismilionaria.v);
var CAMPOS_V = [["orientacao", "Folha A4", 0, "orientacao"], ["porFolha", "Volantes por folha", 0, "porFolha"], ["gapV", "Espaço entre os volantes", 0.5], ["jogos", "Jogos por volante (1 a 4)", 1, "int"], ["arquivo", "Nome no cabeçalho (vazio = loteria e nº de apostas)", 0, "texto"],
  ["largura", "Largura do volante (recorte)", 0.5], ["altura", "Altura do volante (recorte)", 0.5],
  ["recorteX", "Recorte · da borda esquerda da folha", 0.5], ["recorteY", "Recorte · da borda de cima da folha", 0.5],
  ["x", "1º número · da esquerda do recorte", 0.1], ["y", "1º número · do topo do recorte", 0.1], ["gapY", "Espaço entre jogos", 0.5],
  ["relogioX", "Coluna de relógio · da esquerda do recorte", 0.1], ["relogioL", "Largura da marca de relógio", 0.1], ["relogioA", "Altura da marca de relógio", 0.1],
  ["topoN", "Marcas de relógio no topo (quantas)", 1, "int"], ["topoX", "1ª marca do topo · da esquerda", 0.1], ["topoPasso", "Distância entre marcas do topo", 0.1], ["topoY", "Fileira do topo · do topo (0 = automático)", 0.1],
  ["relogioFim", "Marcas de relógio abaixo dos jogos (mm, separadas por vírgula)", 0, "texto"],
  ["qtdMin", "Campo \"quantos números\": menor valor (0 = não tem)", 1, "int"], ["qtdY", "Campo quantos números · do topo", 0.1], ["qtdX", "Campo quantos números · da esquerda", 0.1], ["qtdPasso", "Distância entre as casas do campo", 0.1],
  ["recorte", "Traço vermelho de recorte", 0, "simnao"], ["lista", "Lista dos jogos e MegaCover no rodapé", 0, "simnao"]];
var CAMPOS = [
  ["Volante", [["largura", "Largura do volante", 0.5], ["altura", "Altura do volante", 0.5]]],
  ["Jogos por volante", [["jogos", "Quantos jogos cabem", 1, "int"], ["dirJogos", "Os jogos ficam", 0, "dir"], ["distJogos", "Distância entre jogos", 0.1]]],
  ["Grade de números", [["x", "Centro do 1º número · da esquerda", 0.1], ["y", "Centro do 1º número · do topo", 0.1],
    ["passoX", "Distância entre colunas", 0.05], ["passoY", "Distância entre linhas", 0.05],
    ["linhas", "Linhas", 1, "int"], ["colunas", "Colunas", 1, "int"], ["ordem", "Numeração corre", 0, "ordem"]]],
  ["Marca", [["marcaL", "Largura da marca", 0.1], ["marcaA", "Altura da marca", 0.1], ["formato", "Formato", 0, "formato"]]],
  ["Impressora", [["papel", "Papel", 0, "papel"], ["papelX", "Volante colado a (esq.)", 0.5], ["papelY", "Volante colado a (topo)", 0.5],
    ["ajusteX", "Ajuste fino horizontal", 0.1], ["ajusteY", "Ajuste fino vertical", 0.1]]],
  ["Correção de inclinação e escala", [["rotacao", "Inclinação (graus, + gira no sentido horário)", 0.1, "num"],
    ["escalaX", "Escala horizontal (%)", 0.5, "num"], ["escalaY", "Escala vertical (%)", 0.5, "num"], ["virar", "Volante entra na impressora", 0, "virar"]]]
];
var EXTRA = [["x", "Centro do 1º item · da esquerda", 0.1], ["y", "Centro do 1º item · do topo", 0.1], ["passoX", "Distância entre colunas", 0.05],
  ["passoY", "Distância entre linhas", 0.05], ["linhas", "Linhas", 1, "int"], ["colunas", "Colunas", 1, "int"]];
var OPC = {dir: [["vertical", "um abaixo do outro"], ["horizontal", "lado a lado"]],
  ordem: [["linha", "por linha (01, 02, 03… →)"], ["coluna", "por coluna (01, 02, 03… ↓)"], ["colunaDir", "por coluna, da direita para a esquerda (Lotofácil)"]],
  formato: [["retangulo", "retângulo cheio"], ["elipse", "oval cheio"], ["x", "traço (X)"]],
  papel: [["volante", "o próprio volante (alimentação manual)"], ["a4", "folha A4 com o volante colado"]],
  virar: [["nao", "com o topo para dentro (normal)"], ["sim", "de cabeça para baixo (girar 180°)"]],
  simnao: [["sim", "sim"], ["nao", "não"]],
  porFolha: [[1, "1 volante"], [2, "2 volantes"], [3, "3 volantes"]],
  orientacao: [["retrato", "em pé, volantes deitados (igual ao LoteriaSoft/NetSorte)"], ["paisagem", "deitada, volantes em pé"]]};

var $ = function (s) { return document.querySelector(s); };
function ls(k, v) {
  try {
    if (v === undefined) { var x = localStorage.getItem("mc:" + k); return x ? JSON.parse(x) : null; }
    if (v === null) localStorage.removeItem("mc:" + k); else localStorage.setItem("mc:" + k, JSON.stringify(v));
  } catch (e) { return null; }
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

var S = {lot: "megasena", jogos: [], extras: null, modo: "virtual", m: null};
function cfg() { return MC.TODAS[S.lot]; }
/* Versão dos moldes: quando muda, a calibração salva de versões antigas é descartada
   (só os ajustes da impressora são mantidos), para valores velhos não estragarem o desenho. */
var MOLDE_VERSAO = 5;
var CAMPOS_IMPRESSORA = ["ajusteX", "ajusteY", "rotacao", "escalaX", "escalaY", "virar", "papel", "papelX", "papelY"];
function molde(lot) {
  var m = clone(MOLDES[lot]), salvo = ls("vol:" + lot), k;
  if (!salvo) return m;
  if (salvo._v !== MOLDE_VERSAO) {
    CAMPOS_IMPRESSORA.forEach(function (c) { if (salvo[c] != null) m[c] = salvo[c]; });
    return m;
  }
  for (k in salvo) if (k !== "extra" && k !== "v" && k !== "_v") m[k] = salvo[k];
  if (salvo.extra && m.extra) for (k in salvo.extra) m.extra[k] = salvo.extra[k];
  if (salvo.v) for (k in salvo.v) m.v[k] = salvo.v[k];
  return m;
}
function salvar() { S.m._v = MOLDE_VERSAO; ls("vol:" + S.lot, S.m); }

/* linha e coluna da casa nº idx conforme a ordem de numeração do volante */
function linCol(m, idx) {
  if (m.ordem === "coluna") return [idx % m.linhas, Math.floor(idx / m.linhas)];
  if (m.ordem === "colunaDir") return [idx % m.linhas, m.colunas - 1 - Math.floor(idx / m.linhas)];
  return [Math.floor(idx / m.colunas), idx % m.colunas];
}
/* posição (mm) do centro de um número dentro do jogo nº j (0…) */
function ordemNumeros(c, m) {
  var l = c.dezenas.slice();
  if (m.zeroNoFim && l[0] === 0) { l.shift(); l.push(0); }
  return l;
}
function celula(m, idx, j) {
  var lc = linCol(m, idx), lin = lc[0], col = lc[1];
  var dx = m.dirJogos === "horizontal" ? j * m.distJogos : 0, dy = m.dirJogos === "vertical" ? j * m.distJogos : 0;
  return {x: m.x + col * m.passoX + dx, y: m.y + lin * m.passoY + dy};
}
function celulaExtra(m, idx, j) {
  var e = m.extra, lin = Math.floor(idx / e.colunas), col = idx % e.colunas;
  var dx = m.dirJogos === "horizontal" ? j * m.distJogos : 0, dy = m.dirJogos === "vertical" ? j * m.distJogos : 0;
  return {x: e.x + col * e.passoX + dx, y: e.y + lin * e.passoY + dy};
}
/* lista de marcas {x,y} de um jogo */
function marcasDoJogo(c, m, jogo, extra, j) {
  var out = [], ordem = ordemNumeros(c, m);
  if (c.colunar) {
    jogo.forEach(function (col, ci) {
      col.forEach(function (d) {
          out.push(celula(m, m.ordem === "linha" ? d * m.colunas + ci : ci * m.linhas + d, j));
      });
    });
  } else {
    jogo.forEach(function (d) { var i = ordem.indexOf(d); if (i >= 0) out.push(celula(m, i, j)); });
  }
  if (extra && m.extra) {
    if (c.extra_qtd > 1) String(extra).split(/[^0-9]+/).filter(Boolean).forEach(function (t) { var n = +t; if (n >= 1 && n <= 6) out.push(celulaExtra(m, n - 1, j)); });
    else if (c.chave === "diadesorte") { var mi = MESES.map(function (x) { return x.toLowerCase(); }).indexOf(String(extra).toLowerCase()); if (mi >= 0) out.push(celulaExtra(m, mi, j)); }
  }
  return out;
}
function marcaHTML(m, p) {
  var st = "left:" + (p.x - m.marcaL / 2) + "mm;top:" + (p.y - m.marcaA / 2) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + "mm";
  return '<i class="mk ' + m.formato + '" style="' + st + '"></i>';
}
/* folha de calibração: contorno do volante + todas as casas numeradas */
function reguaHTML(m) {
  var h = '<div class="regua h" style="left:6mm;top:' + (m.altura - 14) + 'mm;width:60mm"><span>0</span><span style="left:30mm">30</span><span style="left:60mm">60 mm</span></div>' +
    '<div class="regua v" style="left:6mm;top:' + (m.altura - 74) + 'mm;height:60mm"><span>60 mm</span></div>';
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (q) {
    h += '<div class="mira" style="left:' + (q[0] ? m.largura - 8 : 4) + "mm;top:" + (q[1] ? m.altura - 8 : 4) + 'mm"></div>';
  });
  return h;
}
function guiaHTML(c, m) {
  var h = reguaHTML(m), ordem = ordemNumeros(c, m), total = c.colunar ? m.linhas * m.colunas : ordem.length;
  for (var j = 0; j < m.jogos; j++) {
    for (var i = 0; i < total; i++) {
      var p = celula(m, i, j), rot = c.colunar ? linCol(m, i)[0] : c.fmt(ordem[i]);
      h += '<b class="casa" style="left:' + (p.x - m.marcaL / 2) + "mm;top:" + (p.y - m.marcaA / 2) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + rot + "</b>";
    }
    if (m.extra) {
      var n = m.extra.linhas * m.extra.colunas;
      for (i = 0; i < n; i++) {
        p = celulaExtra(m, i, j);
        var r = c.chave === "diadesorte" ? MESES[i] ? MESES[i].slice(0, 3) : "" : String(i + 1);
        h += '<b class="casa ex" style="left:' + (p.x - m.marcaL / 2) + "mm;top:" + (p.y - m.marcaA / 2) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + r + "</b>";
      }
    }
  }
  return h;
}

/* ======================= Volante virtual (A4) ======================= */
/* Reproduz o volante oficial em folha sulfite, no formato dos programas de impressão:
   recorte vermelho do tamanho do volante, cabeçalho, coluna de relógio, jogos empilhados,
   lista dos jogos e assinatura MegaCover no rodapé. Coordenadas relativas ao recorte. */
var A4 = {w: 210, h: 297}, SITE_URL = "gabrielnassa.github.io/MegaCovePro";
function alturaJogo(m) {
  var h = (m.linhas - 1) * m.passoY + m.marcaA;
  if (m.extra) h += 4 + (m.extra.linhas - 1) * m.extra.passoY + m.marcaA;
  return h;
}
function arranjoVirtual(c, m) {
  var e = EXATO[c.chave];
  var n = e ? e.jogos : Math.max(1, Math.min(4, m.v.jogos | 0));
  return {n: n, cols: 1, linhas: n, th: alturaJogo(m)};
}
function origemJogo(m, ar, j) { return {x: m.v.x, y: m.v.y + j * (ar.th + m.v.gapY)}; }
function marcasVirtual(c, m, jogo, extra, o) {
  var out = [], ordem = ordemNumeros(c, m);
  function cel(idx) { var lc = linCol(m, idx); return {x: o.x + lc[1] * m.passoX, y: o.y + lc[0] * m.passoY}; }
  if (c.colunar) jogo.forEach(function (col, ci) { col.forEach(function (d) { out.push(cel(m.ordem === "linha" ? d * m.colunas + ci : ci * m.linhas + d)); }); });
  else jogo.forEach(function (d) { var i = ordem.indexOf(d); if (i >= 0) out.push(cel(i)); });
  if (extra && m.extra) {
    var e = m.extra, ey = o.y + (m.linhas - 1) * m.passoY + m.marcaA + 4;
    function cex(idx) { return {x: o.x + (idx % e.colunas) * e.passoX, y: ey + Math.floor(idx / e.colunas) * e.passoY}; }
    if (c.extra_qtd > 1) String(extra).split(/[^0-9]+/).filter(Boolean).forEach(function (t) { var n = +t; if (n >= 1 && n <= 6) out.push(cex(n - 1)); });
    else if (c.chave === "diadesorte") { var mi = MESES.map(function (x) { return x.toLowerCase(); }).indexOf(String(extra).toLowerCase()); if (mi >= 0) out.push(cex(mi)); }
  }
  return out;
}
/* coluna de relógio: 2 marcas na linha do cabeçalho, uma por linha de cada jogo, 3 no rodapé */
function relogioHTML(c, m, ar) {
  var v = m.v, rl = {marcaL: v.relogioL, marcaA: v.relogioA, formato: "retangulo"}, h = "", j, r;
  var yCab = +v.topoY || (v.y - m.passoY * 1.6), nT = Math.max(0, v.topoN | 0);
  for (r = 0; r < nT; r++) h += marcaHTML(rl, {x: (+v.topoX || v.relogioX) + r * (+v.topoPasso || 5), y: yCab});
  for (j = 0; j < ar.n; j++) {
    var o = origemJogo(m, ar, j);
    for (r = 0; r < m.linhas; r++) h += marcaHTML(rl, {x: v.relogioX, y: o.y + r * m.passoY});
    if (m.extra) for (r = 0; r < m.extra.linhas; r++) h += marcaHTML(rl, {x: v.relogioX, y: o.y + (m.linhas - 1) * m.passoY + m.marcaA + 4 + r * m.extra.passoY});
  }
  var yFim = origemJogo(m, ar, ar.n - 1).y + ar.th;
  var extras = String(v.relogioFim || "").split(/[^0-9.]+/).filter(Boolean).map(Number);
  if (!extras.length) for (r = 0; r < 3; r++) extras.push(yFim + 6 + r * 3.2);
  extras.forEach(function (y) { h += marcaHTML(rl, {x: v.relogioX, y: y}); });
  return {html: h, yFim: Math.max.apply(null, extras.concat([yFim]))};
}
function tituloCab(c, m) {
  if (m.v.arquivo) return m.v.arquivo;
  var n = S.jogos.length || 0;
  return c.nome.toUpperCase() + (n ? " - " + n + (n === 1 ? " Aposta" : " Apostas") : "");
}
function cabecalhoHTML(c, m, ar, ini) {
  var nums = []; for (var i = 0; i < ar.n; i++) nums.push(ini + i + 1);
  return '<div class="cab-v" style="left:0;top:' + (m.v.y - m.passoY * 3.6) + "mm;width:" + m.v.largura + 'mm"><span>' + esc(tituloCab(c, m)) + "</span><b>" + nums.join("-") + "</b></div>";
}
function rodapeHTML(c, m, pg, yIni) {
  if (m.v.lista === "nao") return "";
  var linhas = [];
  var nj = EXATO[c.chave] ? EXATO[c.chave].jogos : m.v.jogos;
  for (var i = 0; i < nj; i++) {
    var j = pg.jogos[i];
    if (!j) continue;
    var ex = extraDoJogo(pg.ini + i), itens = c.colunar ? j.map(function (x) { return x.join(""); }) : j.map(c.fmt.bind(c)), POR = 20;
    for (var a = 0; a < itens.length; a += POR)
      linhas.push((a ? "        " : "Jogo " + (pg.ini + i + 1) + ": ") + itens.slice(a, a + POR).join(",") + (a + POR >= itens.length && ex ? "#" + ex : ""));
  }
  var e0 = EXATO[c.chave];
  if (e0 && e0.lista) {   /* volante deitado: lista em duas colunas entre as marcas do topo e a grade (modelo NetSorte) */
    var met = Math.ceil(linhas.length / 2), h2 = "";
    [linhas.slice(0, met), linhas.slice(met)].forEach(function (col, k) {
      h2 += '<div class="rod-v peq" style="left:' + e0.lista.x[k] + "mm;top:" + e0.lista.y + "mm;width:" + e0.lista.largura + 'mm">' + col.map(function (l) { return "<div>" + esc(l) + "</div>"; }).join("") + "</div>";
    });
    return h2;
  }
  var x0 = m.v.relogioX + m.v.relogioL + 3, largo = m.v.largura - x0 - 2, longo = linhas.some(function (l) { return l.length > 40; });
  var altura = (linhas.length + 1) * (longo ? 3 : 3.8) + 9, top = Math.min(yIni + 3, m.v.altura - altura - 2);
  var rotulo = c.colunar ? "Números:" : c.chave === "diadesorte" ? "Apostas:" : "Dezenas:";
  return '<div class="rod-v' + (longo ? " peq" : "") + '" style="left:' + x0 + "mm;top:" + top + "mm;width:" + largo + 'mm"><b>' + rotulo + "</b>" +
    linhas.map(function (l) { return "<div>" + esc(l) + "</div>"; }).join("") + '<div class="marca-v"><b>MegaCover Pro Elite</b><span>' + esc(SITE_URL) + "</span></div></div>";
}
function guiaVirtualHTML(c, m, ar) {
  var h = "", ordem = ordemNumeros(c, m), total = c.colunar ? m.linhas * m.colunas : ordem.length;
  for (var j = 0; j < ar.n; j++) {
    var o = origemJogo(m, ar, j);
    h += '<div class="bloco-v" style="left:' + (o.x - 1.2) + "mm;top:" + (o.y - 1.2) + "mm;width:" + ((m.colunas - 1) * m.passoX + m.marcaL + 2.4) + "mm;height:" + (ar.th + 2.4) + 'mm"><i>Jogo ' + (j + 1) + "</i></div>";
    for (var i = 0; i < total; i++) {
      var lc = linCol(m, i), lin = lc[0], col = lc[1];
      h += '<b class="casa" style="left:' + (o.x + col * m.passoX) + "mm;top:" + (o.y + lin * m.passoY) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + (c.colunar ? lin : c.fmt(ordem[i])) + "</b>";
    }
    if (j === 0 && m.v.qtdMin > 0) h += '<i class="rot-v" style="left:' + m.v.qtdX + "mm;top:" + (m.v.qtdY - 3.2) + 'mm">quantos números por jogo</i>';
    if (j === 0 && m.v.qtdMin > 0) for (var q = 0; q < 6; q++) h += '<b class="casa ex" style="left:' + (m.v.qtdX + q * m.v.qtdPasso) + "mm;top:" + m.v.qtdY + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + (m.v.qtdMin + q) + "</b>";
    if (m.extra) {
      var e = m.extra, ey = o.y + (m.linhas - 1) * m.passoY + m.marcaA + 4;
      for (i = 0; i < e.linhas * e.colunas; i++) h += '<b class="casa ex" style="left:' + (o.x + (i % e.colunas) * e.passoX) + "mm;top:" + (ey + Math.floor(i / e.colunas) * e.passoY) + "mm;width:" + m.marcaL + "mm;height:" + m.marcaA + 'mm">' + (c.chave === "diadesorte" ? (MESES[i] || "").slice(0, 3) : i + 1) + "</b>";
    }
  }
  return h;
}
/* Gira o conteúdo do volante 90° anti-horário sem usar transform na caixa inteira: na impressão o Chrome
   pagina pela caixa sem girar (82 × 205 mm) e quebra o desenho. Marcas viram caixas trocadas; textos giram um a um
   (caixas pequenas, sempre dentro da página). (x, y) na vertical vira (y, largura − x). */
function girarHTML(html, W) {
  return html.replace(/(class="([^"]*)" style=")left:(-?[\d.]+)(?:mm)?;top:(-?[\d.]+)(?:mm)?(;width:(-?[\d.]+)mm)?(;height:(-?[\d.]+)mm)?/g, function (t, ini, cls, L, T, _w, w, _h, h) {
    L = +L; T = +T;
    if (/\bmk\b/.test(cls)) return ini + "left:" + T + "mm;top:" + (W - L - (+w)) + "mm;width:" + h + "mm;height:" + w + "mm";
    return ini + "left:" + T + "mm;top:" + (W - L) + "mm" + (w != null ? ";width:" + w + "mm" : "") + (h != null ? ";height:" + h + "mm" : "") + ";transform:rotate(-90deg)";
  });
}
function folhasVirtual() {
  var c = cfg(), m = S.m, v = m.v, ar = arranjoVirtual(c, m), paginas = [];
  var guia = S.modo === "guiav" || !S.jogos.length, volantes = [];
  if (guia) volantes.push({guia: true, ini: 0, jogos: []});
  else {
    /* o campo "quantos números" vale para o volante inteiro: um volante só leva jogos do mesmo tamanho */
    var tam = function (j) { return qtdMarcada(c, j); }, atual = null;
    for (var i = 0; i < S.jogos.length; i++) {
      if (!atual || atual.jogos.length >= ar.n || tam(atual.jogos[0]) !== tam(S.jogos[i])) { atual = {guia: false, ini: i, jogos: []}; volantes.push(atual); }
      atual.jogos.push(S.jogos[i]);
    }
  }
  /* Folha em pé com os volantes deitados (como o LoteriaSoft/NetSorte imprime) ou deitada com os volantes em pé.
     Nunca encolhe: cabem tantos volantes de tamanho real quantos a folha permitir. */
  var natural = v.largura > v.altura;      /* +Milionária: o próprio volante é deitado */
  var deitado = !natural && v.orientacao !== "paisagem", W = A4.w, H = A4.h;
  if (!deitado && !natural) { W = A4.h; H = A4.w; }
  var espaco = (deitado || natural) ? H : W;
  var tam = natural ? v.altura : v.largura, marg = natural ? v.recorteY : v.recorteX;
  var pf = Math.max(1, Math.min(+v.porFolha || 1, Math.floor((espaco - marg + v.gapV) / (tam + v.gapV))));
  var paginas = []; for (i = 0; i < volantes.length; i += pf) paginas.push(volantes.slice(i, i + pf));
  $("#estilo-pagina").textContent = "@page{size:" + W + "mm " + H + "mm;margin:0}";
  var tr = "rotate(" + (+m.rotacao || 0) + "deg) scale(" + ((+m.escalaX || 100) / 100) + "," + ((+m.escalaY || 100) / 100) + ")";
  /* o recorte nunca sai da folha: se o volante for alto demais, encosta na borda */
  var limite = deitado ? W : H;
  var offX = (+v.recorteX || 0) + (+m.ajusteX || 0), offY = Math.max(0, Math.min(+v.recorteY || 0, limite - v.altura - 1)) + (+m.ajusteY || 0);
  function posicao(k) {
    if (natural) return "left:" + offX + "mm;top:" + (offY + k * (v.altura + v.gapV)) + "mm;transform:" + tr;
    if (!deitado) return "left:" + (offX + k * (v.largura + v.gapV)) + "mm;top:" + offY + "mm;transform:" + tr;
    /* volante deitado: a caixa já nasce girada (altura × largura); o conteúdo é girado elemento a elemento em girarHTML */
    return "left:" + offY + "mm;top:" + (offX + k * (v.largura + v.gapV)) + "mm;transform:" + tr;
  }
  function areaHTML(k, dentro) {
    var w = deitado ? v.altura : v.largura, h = deitado ? v.largura : v.altura;
    return '<div class="area' + (v.recorte === "nao" ? "" : " recorte") + (deitado ? " girado" : "") + '" style="' + posicao(k) + ";width:" + w + "mm;height:" + h + 'mm">' + (deitado ? girarHTML(dentro, v.largura) : dentro) + "</div>";
  }
  function volanteHTML(pg, k) {
    var e = EXATO[c.chave], rel, dentro;
    if (e) {
      dentro = volanteExatoHTML(e, c, m, pg) + rodapeHTML(c, m, pg, Math.max.apply(null, e.relogio) + 2);
      return areaHTML(k, dentro);
    }
    rel = relogioHTML(c, m, ar); dentro = rel.html + cabecalhoHTML(c, m, ar, pg.ini);
    if (pg.guia) dentro += guiaVirtualHTML(c, m, ar);
    else pg.jogos.forEach(function (jogo, j) {
      dentro += marcasVirtual(c, m, jogo, S.extras ? S.extras[pg.ini + j] : null, origemJogo(m, ar, j)).map(function (p) { return marcaHTML(m, {x: p.x + m.marcaL / 2, y: p.y + m.marcaA / 2}); }).join("");
    });
    if (!pg.guia && v.qtdMin > 0 && pg.jogos.length) {
      var q = pg.jogos[0].length;      /* o campo é um por volante: usa a quantidade do 1º jogo */
      dentro += marcaHTML(m, {x: v.qtdX + (q - v.qtdMin) * v.qtdPasso + m.marcaL / 2, y: v.qtdY + m.marcaA / 2});
    }
    dentro += rodapeHTML(c, m, pg, rel.yFim);
    return areaHTML(k, dentro);
  }
  return paginas.map(function (vs, k) {
    var ini = vs[0].ini + 1, fim = vs[vs.length - 1].ini + vs[vs.length - 1].jogos.length;
    var fundo = natural ? offY + vs.length * (v.altura + v.gapV) - v.gapV : deitado ? offX + vs.length * (v.largura + v.gapV) - v.gapV : offY + v.altura;
    return '<div class="folha' + (m.virar === "sim" ? " virada" : "") + '" style="width:' + W + "mm;height:" + H + "mm;--h:" + Math.min(H, Math.ceil(fundo + 3)) + 'mm">' + vs.map(volanteHTML).join("") +
      '<div class="rot-folha no-print">' + (vs[0].guia ? "Guia do volante virtual" : "Folha " + (k + 1) + " de " + paginas.length + " · " + vs.length + " volante(s) · jogos " + ini + "–" + fim) + "</div></div>";
  }).join("");
}

/* ======================= Volante virtual EXATO (geometria medida) ======================= */
function celulaExato(e, n, g) {
  var C = e.colunas.length, Rn = e.linhas, rows = e.blocos[g], r, c, idx;
  if (e.esquema === "colunaDir") { idx = n - 1; c = C - 1 - Math.floor(idx / Rn); r = idx % Rn; }
  else if (e.esquema === "linhaZeroFim") { idx = n >= 1 ? n - 1 : Rn * C - 1; r = Math.floor(idx / C); c = idx % C; }
  else if (e.esquema === "diadesorte") { if (n === 31) { r = 3; c = 0; } else { r = Math.floor((n - 1) / 10); c = (n - 1) % 10; } }
  else { idx = n - 1; r = Math.floor(idx / C); c = idx % C; }
  if (r == null || r >= rows.length || c < 0 || c >= C) return null;
  return {x: e.colunas[c] + (e.deslocX ? e.deslocX[g] : 0), y: rows[r]};
}
function trevosExato(e, extra, g) {
  var out = [], dx = e.deslocX ? e.deslocX[g] : 0;
  String(extra == null ? "" : extra).split(/[^0-9]+/).filter(Boolean).forEach(function (t) {
    var n = +t; if (n >= 1 && n <= 6) out.push({x: e.trevos.colunas[(n - 1) % 3] + dx, y: e.trevos.linhas[Math.floor((n - 1) / 3)]});
  });
  return out;
}
function semAcento(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim(); }
/* extra do jogo: o do Gerador ou, se faltar, o escolhido na página */
function extraDoJogo(i) { var x = S.extras && S.extras[i]; return x && x !== "—" ? x : (S.extraFixo || ""); }
function mesIndice(x) {
  var t = semAcento(x); if (!t) return -1;
  for (var i = 0; i < 12; i++) { var n = semAcento(MESES[i]); if (t === n || t === n.slice(0, 3)) return i; }
  return -1;
}
function timeDoVolante(e, x) {
  var t = semAcento(x); if (!t || !e.times) return null;
  for (var i = 0; i < e.times.length; i++) if (semAcento(e.times[i].nome) === t) return e.times[i];
  var sem = t.split("/")[0];
  for (i = 0; i < e.times.length; i++) if (semAcento(e.times[i].nome).split("/")[0] === sem) return e.times[i];
  return null;
}
function qtdMarcada(c, jogo) { return c.colunar ? jogo.reduce(function (a, col) { return a + col.length; }, 0) : jogo.length; }
function marcasExato(e, c, jogo, g) {
  var out = [];
  if (e.esquema === "digito") jogo.forEach(function (col, ci) { col.forEach(function (d) { if (e.blocos[g][d] != null) out.push({x: e.colunas[ci], y: e.blocos[g][d]}); }); });
  else jogo.forEach(function (n) { var p = celulaExato(e, n, g); if (p) out.push(p); });
  return out;
}
function volanteExatoHTML(e, c, m, pg) {
  var mk = {marcaL: e.marca[0], marcaA: e.marca[1], formato: "retangulo"}, h = "", i;
  e.relogio.forEach(function (y) { h += marcaHTML(mk, {x: e.relogioX, y: y}); });
  e.topoX.forEach(function (x) { h += marcaHTML(mk, {x: x, y: e.topoY}); });
  var nums = []; for (i = 0; i < (pg.guia ? e.jogos : Math.max(1, pg.jogos.length)); i++) nums.push(pg.ini + i + 1);
  h += '<div class="cab-v" style="left:0;top:1.2mm;width:' + m.v.largura + 'mm"><span>' + esc(tituloCab(c, m)) + "</span><b>" + nums.join("-") + "</b>" + (e.lista ? "<span>MegaCover Pro Elite · " + esc(SITE_URL) + "</span>" : "") + "</div>";
  if (pg.guia) {
    for (var g = 0; g < e.jogos; g++) {
      if (e.esquema === "digito") {
        for (var ci = 0; ci < e.colunas.length; ci++) for (var d = 0; d < e.blocos[g].length; d++)
          h += '<b class="casa" style="left:' + (e.colunas[ci] - mk.marcaL / 2) + "mm;top:" + (e.blocos[g][d] - mk.marcaA / 2) + "mm;width:" + mk.marcaL + "mm;height:" + mk.marcaA + 'mm">' + d + "</b>";
      } else {
        var total = e.esquema === "linhaZeroFim" ? 100 : c.universo;
        for (var n = e.esquema === "linhaZeroFim" ? 0 : 1; n <= (e.esquema === "linhaZeroFim" ? 99 : total); n++) {
          var p = celulaExato(e, n, g); if (!p) continue;
          h += '<b class="casa" style="left:' + (p.x - mk.marcaL / 2) + "mm;top:" + (p.y - mk.marcaA / 2) + "mm;width:" + mk.marcaL + "mm;height:" + mk.marcaA + 'mm">' + c.fmt(n) + "</b>";
        }
      }
    }
    if (e.trevos) for (var g2 = 0; g2 < e.jogos; g2++) for (var t = 1; t <= 6; t++) {
      var pt = trevosExato(e, String(t), g2)[0];
      h += '<b class="casa ex" style="left:' + (pt.x - e.trevos.marca[0] / 2) + "mm;top:" + (pt.y - e.trevos.marca[1] / 2) + "mm;width:" + e.trevos.marca[0] + "mm;height:" + e.trevos.marca[1] + 'mm">' + t + "</b>";
    }
    if (e.qtd) for (i = 0; i < 6; i++) h += '<b class="casa ex" style="left:' + (e.qtd.x0 + i * e.qtd.passo - mk.marcaL / 2) + "mm;top:" + (e.qtd.y - mk.marcaA / 2) + "mm;width:" + mk.marcaL + "mm;height:" + mk.marcaA + 'mm">' + (e.qtd.min + i) + "</b>";
    if (e.qtd2) for (i = 0; i < 5; i++) h += '<b class="casa ex" style="left:' + (e.qtd2.x0 + i * e.qtd2.passo - mk.marcaL / 2) + "mm;top:" + (e.qtd2.y - mk.marcaA / 2) + "mm;width:" + mk.marcaL + "mm;height:" + mk.marcaA + 'mm">' + (e.qtd2.min + i) + "</b>";
    function casaEx(x, y, rot) { return '<b class="casa ex" style="left:' + (x - mk.marcaL / 2) + "mm;top:" + (y - mk.marcaA / 2) + "mm;width:" + mk.marcaL + "mm;height:" + mk.marcaA + 'mm">' + rot + "</b>"; }
    if (e.qtdPos) Object.keys(e.qtdPos).forEach(function (q) { h += casaEx(e.qtdPos[q][0], e.qtdPos[q][1], q); });
    if (e.meses) e.meses.forEach(function (gm) { gm.forEach(function (pt, mi) { h += casaEx(pt[0], pt[1], MESES[mi].slice(0, 3)); }); });
    if (e.times) e.times.forEach(function (tm) { h += casaEx(tm.x, tm.y, esc(tm.nome.slice(0, 3))); });
  } else {
    var mkT = e.trevos ? {marcaL: e.trevos.marca[0], marcaA: e.trevos.marca[1], formato: "retangulo"} : null;
    pg.jogos.forEach(function (jogo, g) {
      marcasExato(e, c, jogo, g).forEach(function (p) { h += marcaHTML(mk, p); });
      if (mkT && S.extras) trevosExato(e, S.extras[pg.ini + g], g).forEach(function (p) { h += marcaHTML(mkT, p); });
    });
    pg.jogos.forEach(function (jogo, g) {
      if (e.meses) { var mi = mesIndice(extraDoJogo(pg.ini + g)); if (mi >= 0 && e.meses[g]) h += marcaHTML(mk, {x: e.meses[g][mi][0], y: e.meses[g][mi][1]}); }
    });
    if (e.times && pg.jogos.length) { var tm = timeDoVolante(e, extraDoJogo(pg.ini)); if (tm) h += marcaHTML(mk, {x: tm.x, y: tm.y}); }
    if (e.qtdPos && pg.jogos.length) { var qp = e.qtdPos[String(qtdMarcada(c, pg.jogos[0]))]; if (qp) h += marcaHTML(mk, {x: qp[0], y: qp[1]}); }
    if (e.qtd && pg.jogos.length) {
      var q = pg.jogos[0].length, k = q - e.qtd.min;
      if (k >= 0 && k < 10) h += marcaHTML(mk, {x: e.qtd.x0 + k * e.qtd.passo, y: e.qtd.y});
    }
    if (e.qtd2 && pg.jogos.length && S.extras) {
      var nt = String(S.extras[pg.ini] || "").split(/[^0-9]+/).filter(Boolean).length, k2 = nt - e.qtd2.min;
      if (k2 >= 0 && k2 < 10) h += marcaHTML(mk, {x: e.qtd2.x0 + k2 * e.qtd2.passo, y: e.qtd2.y});
    }
  }
  return h;
}

/* ======================= PDF em milímetros exatos =======================
   Lê as folhas já desenhadas (marcas e textos em mm) e gera um PDF vetorial. É o caminho certo no
   celular: o Safari do iPhone acrescenta margens e cabeçalho ao imprimir a página e encolhe a folha,
   o que tiraria as marcas do lugar. O PDF impresso em 100% sai igual ao desenho. */
function mmStyle(el, k) { var v = parseFloat(el.style[k]); return isNaN(v) ? 0 : v; }
function gerarPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) { alert("Gerador de PDF não carregou. Recarregue a página."); return null; }
  var fs = $("#folhas"), zAntes = fs.style.getPropertyValue("--z");
  fs.style.setProperty("--z", 1);                       /* mede sem o zoom da prévia */
  var PX = 25.4 / 96, doc = null, folhas = fs.querySelectorAll(".folha");
  try {
    Array.prototype.forEach.call(folhas, function (folha, fi) {
      var W = mmStyle(folha, "width"), H = mmStyle(folha, "height");
      if (!doc) doc = new window.jspdf.jsPDF({unit: "mm", format: [W, H], orientation: W > H ? "landscape" : "portrait", compress: true});
      else doc.addPage([W, H], W > H ? "landscape" : "portrait");
      Array.prototype.forEach.call(folha.querySelectorAll(".area"), function (area) {
        var ax = mmStyle(area, "left"), ay = mmStyle(area, "top"), aw = mmStyle(area, "width"), ah = mmStyle(area, "height");
        if (area.classList.contains("recorte")) { doc.setDrawColor(221, 34, 34); doc.setLineWidth(0.2); doc.setLineDashPattern([1, 1], 0); doc.rect(ax, ay, aw, ah); doc.setLineDashPattern([], 0); }
        Array.prototype.forEach.call(area.children, function (el) {
          var L = mmStyle(el, "left"), T = mmStyle(el, "top");
          if (el.classList.contains("mk")) { doc.setFillColor(0, 0, 0); doc.rect(ax + L, ay + T, mmStyle(el, "width"), mmStyle(el, "height"), "F"); return; }
          if (el.classList.contains("no-print")) return;
          var rot = /rotate\(-90deg\)/.test(el.style.transform);
          function ponto(xl, yl) { return rot ? {x: ax + L + yl, y: ay + T - xl} : {x: ax + L + xl, y: ay + T + yl}; }
          var folhasEl = el.querySelectorAll("*"), leafs = [];
          if (!folhasEl.length) leafs.push(el);
          else Array.prototype.forEach.call(folhasEl, function (c) { if (!c.children.length && c.textContent.trim()) leafs.push(c); });
          /* caixas com borda (guia): contorno */
          if (el.classList.contains("casa") || el.classList.contains("bloco-v")) {
            var cs0 = getComputedStyle(el), cor = el.classList.contains("casa") ? (el.classList.contains("ex") ? [143, 106, 28] : [31, 95, 191]) : [217, 198, 90];
            doc.setDrawColor(cor[0], cor[1], cor[2]); doc.setLineWidth(0.25);
            var bw = mmStyle(el, "width") || el.offsetWidth * PX, bh = mmStyle(el, "height") || el.offsetHeight * PX;
            if (rot) doc.rect(ax + L, ay + T - bw, bh, bw); else doc.rect(ax + L, ay + T, bw, bh);
          }
          leafs.forEach(function (c) {
            var txt = c.textContent.trim(); if (!txt) return;
            var cs = getComputedStyle(c), fpx = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 600;
            var x0 = 0, y0 = 0, n = c; while (n && n !== el) { x0 += n.offsetLeft; y0 += n.offsetTop; n = n.offsetParent; }
            var bw2 = c.offsetWidth * PX, bh2 = c.offsetHeight * PX; x0 *= PX; y0 *= PX;
            doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(fpx * 0.75); doc.setTextColor(0, 0, 0);
            var tw = doc.getTextWidth(txt), lh = parseFloat(cs.lineHeight) * PX || fpx * PX * 1.2, nl = Math.max(1, Math.round(bh2 / lh));
            if (nl > 1) return;                       /* textos longos quebrados não existem no molde (rodapé usa nowrap) */
            var xl = x0 + (cs.textAlign === "center" ? (bw2 - tw) / 2 : cs.textAlign === "right" ? bw2 - tw : 0);
            var yb = y0 + (bh2 - fpx * PX) / 2 + fpx * PX * 0.78;
            var pt = ponto(xl, yb);
            doc.text(txt, pt.x, pt.y, rot ? {angle: 90} : undefined);
          });
        });
      });
    });
  } finally { fs.style.setProperty("--z", zAntes); }
  return doc;
}
window.MC_PDF = gerarPDF;   /* usado pelos testes automáticos */
function nomePDF() { return "MegaCover-" + cfg().chave + "-" + (S.jogos.length || 0) + "-jogos.pdf"; }
var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function baixarPDF() {
  var doc = gerarPDF(); if (!doc) return;
  if (IOS) { var url = doc.output("bloburl"); window.open(url, "_blank") || (location.href = url); }
  else doc.save(nomePDF());
}

/* ======================= Desenho ======================= */
function folhas() {
  if (S.modo === "virtual" || S.modo === "guiav") return folhasVirtual();
  var c = cfg(), m = S.m, porFolha = Math.max(1, m.jogos | 0), paginas = [];
  if (S.modo === "guia" || !S.jogos.length) paginas.push({guia: true, jogos: []});
  else for (var i = 0; i < S.jogos.length; i += porFolha) paginas.push({guia: false, ini: i, jogos: S.jogos.slice(i, i + porFolha)});
  var a4 = m.papel === "a4", W = a4 ? 210 : m.largura, H = a4 ? 297 : m.altura;
  var offX = (a4 ? m.papelX : 0) + (+m.ajusteX || 0), offY = (a4 ? m.papelY : 0) + (+m.ajusteY || 0);
  $("#estilo-pagina").textContent = "@page{size:" + W + "mm " + H + "mm;margin:0}";
  return paginas.map(function (pg, k) {
    var dentro = pg.guia ? guiaHTML(c, m) : pg.jogos.map(function (jogo, j) {
      return marcasDoJogo(c, m, jogo, S.extras ? S.extras[pg.ini + j] : null, j).map(function (p) { return marcaHTML(m, p); }).join("");
    }).join("");
    var contorno = pg.guia ? '<div class="contorno" style="width:' + m.largura + "mm;height:" + m.altura + 'mm"><span>' + esc(c.nome) + " · " + m.largura + " × " + m.altura + " mm · calibração</span></div>" : "";
    var tr = "rotate(" + (+m.rotacao || 0) + "deg) scale(" + ((+m.escalaX || 100) / 100) + "," + ((+m.escalaY || 100) / 100) + ")";
    return '<div class="folha' + (m.virar === "sim" ? " virada" : "") + '" style="width:' + W + "mm;height:" + H + 'mm"><div class="area" style="left:' + offX + "mm;top:" + offY + "mm;width:" + m.largura + "mm;height:" + m.altura + "mm;transform:" + tr + '">' + contorno + dentro + "</div>" +
      '<div class="rot-folha no-print">' + (pg.guia ? "Folha de calibração" : "Volante " + (k + 1) + " de " + paginas.length + " · jogos " + (pg.ini + 1) + "–" + (pg.ini + pg.jogos.length)) + "</div></div>";
  }).join("");
}
function desenhar() {
  $("#folhas").innerHTML = folhas(); avisoExtra();
  var n = $("#folhas").children.length;
  var virt = S.modo === "virtual" || S.modo === "guiav", ar = virt ? arranjoVirtual(cfg(), S.m) : null;
  $("#resumo").innerHTML = S.modo === "guia" ? "Folha de calibração: imprima em papel comum e compare com o volante contra a luz."
    : S.modo === "guiav" ? "Guia do volante virtual: mostra onde cada número cai no recorte (" + ar.n + " jogos por volante)."
    : virt ? (S.jogos.length ? "<b>" + S.jogos.length + "</b> jogo(s) · <b>" + $("#folhas").querySelectorAll(".area").length + "</b> volante(s) em <b>" + n + "</b> folha(s) A4 · " + ar.n + " jogos por volante." : "Nenhum jogo carregado — gere jogos no painel ou cole abaixo.")
    : S.jogos.length ? "<b>" + S.jogos.length + "</b> jogo(s) em <b>" + n + "</b> volante(s) · " + S.m.jogos + " por volante." : "Nenhum jogo carregado — gere jogos no painel ou cole abaixo.";
  escala();
}
function escala() {
  var box = $("#previa"), f = $("#folhas"); if (!box || !f.firstElementChild) return;
  var w = f.firstElementChild.getBoundingClientRect().width / (parseFloat(f.style.getPropertyValue("--z")) || 1);
  var z = Math.min(1.6, (box.clientWidth - 24) / w);
  f.style.setProperty("--z", z);
}

/* ======================= Controles ======================= */
function campo(chave, rot, passo, tipo, alvo) {
  var obj = alvo === "extra" ? S.m.extra : alvo === "v" ? S.m.v : S.m, v = obj[chave], id = "c-" + (alvo || "m") + "-" + chave;
  if (tipo === "texto") return '<label class="campo"><span class="rot">' + rot + '</span><input type="text" id="' + id + '" data-k="' + chave + '" data-a="' + (alvo || "") + '" value="' + esc(v) + '" maxlength="40"></label>';
  if (tipo && OPC[tipo]) return '<label class="campo"><span class="rot">' + rot + '</span><select id="' + id + '" data-k="' + chave + '" data-a="' + (alvo || "") + '">' +
    OPC[tipo].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>";
  return '<label class="campo"><span class="rot">' + rot + (tipo === "int" || tipo === "num" ? "" : " <small>mm</small>") + '</span><input type="number" id="' + id + '" data-k="' + chave + '" data-a="' + (alvo || "") + '" step="' + passo + '" value="' + v + '"' + (tipo === "int" ? ' min="1"' : "") + "></label>";
}
/* Só os ajustes que valem para o volante virtual: impressora (ajuste fino, inclinação, escala) e a folha A4. */
var CAMPOS_AJUSTE = [
  ["Impressora", [["ajusteX", "Ajuste fino horizontal", 0.1], ["ajusteY", "Ajuste fino vertical", 0.1],
    ["rotacao", "Inclinação (graus, + gira no sentido horário)", 0.1, "num"], ["escalaX", "Escala horizontal (%)", 0.5, "num"], ["escalaY", "Escala vertical (%)", 0.5, "num"]]]
];
function montarControles() {
  var c = cfg(), h = "";
  CAMPOS_AJUSTE.forEach(function (g) {
    h += "<fieldset><legend>" + g[0] + '</legend><div class="form">' + g[1].map(function (f) { return campo(f[0], f[1], f[2], f[3]); }).join("") + "</div></fieldset>";
  });
  var exato = !!EXATO[c.chave], soV = ["orientacao", "porFolha", "gapV", "arquivo", "largura", "altura", "recorteX", "recorteY", "recorte", "lista"];
  h += '<fieldset><legend>Volante virtual (folha A4)</legend>' + (exato ? '<p class="dica" style="margin:4px 0 10px">Geometria <b>medida</b> em scans de volantes impressos e conferida com jogos conhecidos: as posições dos números são fixas. Ajustes de impressora (inclinação, escala, ajuste fino) continuam valendo.</p>' : "") +
    '<div class="form">' + CAMPOS_V.filter(function (f) { return !exato || soV.indexOf(f[0]) >= 0; }).map(function (f) { return campo(f[0], f[1], f[2], f[3], "v"); }).join("") + "</div></fieldset>";
  $("#controles").innerHTML = h;
  $("#controles").oninput = function (e) {
    var t = e.target; if (!t.dataset.k && t.id !== "c-zero") return;
    if (t.id === "c-zero") S.m.zeroNoFim = t.checked;
    else {
      var obj = t.dataset.a === "extra" ? S.m.extra : t.dataset.a === "v" ? S.m.v : S.m, txt = t.tagName === "SELECT" || t.type === "text";
      var v = txt ? t.value : parseFloat(String(t.value).replace(",", "."));
      if (!txt && isNaN(v)) return;
      obj[t.dataset.k] = v;
      if (t.dataset.k === "papel") { salvar(); montarControles(); desenhar(); return; }
    }
    salvar(); desenhar();
  };
}
function lerTexto(txt) {
  var c = cfg();
  return txt.split(/\n+/).map(function (l) { return l.replace(/\[.*?\]/g, "").trim(); }).filter(Boolean).map(function (l) {
    if (c.colunar) {
      var cols = l.indexOf("|") >= 0 ? l.split("|") : l.replace(/[^0-9]/g, "").split("");
      cols = cols.map(function (x) { return x.replace(/[^0-9]/g, "").split("").map(Number); });
      return cols.length === 7 && cols.every(function (x) { return x.length; }) ? cols : null;
    }
    var ns = l.split(/[^0-9]+/).filter(Boolean).map(Number).filter(function (d) { return d >= c.inicio && d <= c.universo; });
    ns = Array.from(new Set(ns)).sort(function (a, b) { return a - b; });
    return ns.length ? ns : null;
  }).filter(Boolean);
}
function textoJogos() {
  var c = cfg();
  return S.jogos.map(function (j) { return c.colunar ? j.map(function (x) { return x.join(""); }).join(" | ") : j.map(c.fmt.bind(c)).join(" "); }).join("\n");
}
/* Mês da Sorte (Dia de Sorte) e Time do Coração (Timemania): usado quando o jogo não traz o seu */
function montarExtra() {
  var box = $("#extra-box"); if (!box) return;
  var e = EXATO[S.lot], ops = null, rot = "";
  if (e && e.meses) { ops = MESES; rot = "Mês da Sorte"; }
  else if (e && e.times) { ops = e.times.map(function (t) { return t.nome; }); rot = "Time do Coração"; }
  S.extraFixo = "";
  if (!ops) { box.innerHTML = ""; return; }
  var salvo = ls("extra:" + S.lot) || "";
  box.innerHTML = '<label class="campo" style="margin-top:12px"><span class="rot">' + rot + ' <small>(quando o jogo não trouxer um)</small></span><select id="extra-fixo"><option value="">— não marcar —</option>' +
    ops.map(function (o) { return '<option' + (o === salvo ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select></label>" + '<p class="dica" id="extra-aviso" style="margin:8px 0 0"></p>';
  S.extraFixo = salvo;
  $("#extra-fixo").onchange = function () { S.extraFixo = this.value; ls("extra:" + S.lot, this.value); desenhar(); };
}
function avisoExtra() {
  var el = $("#extra-aviso"), e = EXATO[S.lot]; if (!el || !e) return;
  var falta = 0;
  S.jogos.forEach(function (j, i) {
    var x = extraDoJogo(i);
    if (e.meses && mesIndice(x) < 0) falta++;
    if (e.times && !timeDoVolante(e, x)) falta++;
  });
  el.innerHTML = falta ? "<b>" + falta + "</b> jogo(s) sem " + (e.meses ? "mês" : "time") + " reconhecido: escolha acima para marcar no volante." : "";
}
function trocarLoteria(lot, manterJogos) {
  S.lot = lot; S.m = molde(lot);
  if (!manterJogos) { S.jogos = []; S.extras = null; }
  document.documentElement.style.setProperty("--cor-lot", cfg().cor);
  $("#txt").value = textoJogos();
  montarExtra(); montarControles(); desenhar();
}

function iniciar() {
  try { var t = ls("tema"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
  $("#lot").innerHTML = MC.ORDEM.map(function (l) { return '<option value="' + l.chave + '">' + l.nome + "</option>"; }).join("");
  var p = ls("imprimir");
  if (p && MC.TODAS[p.lot]) { S.jogos = p.jogos || []; S.extras = p.extras || null; S.lot = p.lot; }
  $("#lot").value = S.lot;
  var q = new URLSearchParams(location.search);
  S.modo = q.get("modo") || ls("vol-modo") || "virtual";
  if (S.modo !== "virtual" && S.modo !== "guiav") S.modo = "virtual";   /* só o volante virtual: modos antigos (volante oficial) foram retirados */
  $("#modo").value = S.modo;
  trocarLoteria(S.lot, true);
  $("#lot").onchange = function () { trocarLoteria(this.value, false); };
  $("#modo").onchange = function () { S.modo = this.value; ls("vol-modo", S.modo); desenhar(); };
  $("#txt").oninput = function () { S.jogos = lerTexto(this.value); S.extras = null; desenhar(); };
  $("#bt-pdf").onclick = function () {
    if (S.modo !== "guiav" && !S.jogos.length) { alert("Nenhum jogo para imprimir."); return; }
    baixarPDF();
  };
  $("#bt-imprimir").onclick = function () {
    if (S.modo !== "guia" && S.modo !== "guiav" && !S.jogos.length) { alert("Nenhum jogo para imprimir."); return; }
    if (IOS) { baixarPDF(); return; }      /* no iPhone/iPad a impressão da página encolhe a folha: vai pelo PDF */
    window.print();
  };
  $("#bt-padrao").onclick = function () {
    if (!confirm("Voltar a calibração da " + cfg().nome + " para os valores iniciais?")) return;
    ls("vol:" + S.lot, null); S.m = molde(S.lot); montarControles(); desenhar();
  };
  $("#bt-exportar").onclick = function () {
    var todos = {}; MC.ORDEM.forEach(function (l) { todos[l.chave] = molde(l.chave); });
    var b = new Blob([JSON.stringify({app: "MegaCover", tipo: "calibracao-volante", moldes: todos}, null, 1)], {type: "application/json"}), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "megacover-calibracao-volantes.json"; document.body.appendChild(a); a.click(); a.remove();
  };
  $("#arq-cal").onchange = function () {
    var f = this.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result); if (!d.moldes) throw 0;
        Object.keys(d.moldes).forEach(function (k) { if (MOLDES[k]) ls("vol:" + k, d.moldes[k]); });
        S.m = molde(S.lot); montarControles(); desenhar(); alert("Calibração importada.");
      } catch (e) { alert("Arquivo de calibração inválido."); }
    };
    rd.readAsText(f);
  };
  window.addEventListener("resize", escala);
  /* veio do Gerador: já abre a janela de impressão com o molde pronto */
  if (q.get("imprimir") === "1" && S.jogos.length) {
    history.replaceState(null, "", "volante.html");
    if (IOS) $("#aviso-ios").hidden = false;
    else setTimeout(function () { window.print(); }, 600);
  }
}
iniciar();
})();
