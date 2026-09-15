/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — NÚCLEO
   • Catálogo das loterias (cores, regras, calendário)
   • Camada de dados em cascata: API oficial da CAIXA (via proxy PHP)
     → APIs públicas com CORS → base diária no GitHub → histórico local
   • Cabeçalho, rodapé, modal de resultado e utilitários de formatação
   Compatível com navegadores modernos (ES2017+).
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var CFG = window.COLI_CONFIG || {};
var COLI = window.COLI = {};

/* ───────────────────────── CATÁLOGO ───────────────────────── */
/* dias: 0=Dom … 6=Sáb · hora do sorteio · min/max dezenas · pick = quantidade sorteada */
COLI.JOGOS = [
 {id:"megasena",      nome:"Mega-Sena",     emo:"🍀", c1:"#209869",c2:"#0d6b47",fg:"#fff", min:1,max:60,pick:6,  dias:[0,2,4],hora:20, gh:"mega-sena",
  desc:"A maior loteria do Brasil. Escolha de 6 a 20 números entre 60 e ganhe com 4, 5 ou 6 acertos."},
 {id:"lotofacil",     nome:"Lotofácil",     emo:"🌸", c1:"#930089",c2:"#5f0058",fg:"#fff", min:1,max:25,pick:15, dias:[0,1,2,3,4,5],hora:20, gh:"lotofacil",
  desc:"Marque de 15 a 20 números entre 25 e ganhe acertando 11, 12, 13, 14 ou 15. Sorteios de segunda a sábado."},
 {id:"quina",         nome:"Quina",         emo:"🎲", c1:"#260085",c2:"#170052",fg:"#fff", min:1,max:80,pick:5,  dias:[0,1,2,3,4,5],hora:20, gh:"quina",
  desc:"Escolha de 5 a 15 números entre 80. Ganha quem acerta 2, 3, 4 ou 5 dezenas. Sorteios de segunda a sábado."},
 {id:"lotomania",     nome:"Lotomania",     emo:"🎯", c1:"#F78100",c2:"#b35d00",fg:"#fff", min:0,max:99,pick:20, dias:[1,3,5],hora:20, gh:"lotomania",
  desc:"Marque 50 números entre 100 e ganhe acertando 20, 19, 18, 17, 16, 15 ou nenhum número."},
 {id:"duplasena",     nome:"Dupla Sena",    emo:"🎰", c1:"#A61324",c2:"#6e0b17",fg:"#fff", min:1,max:50,pick:6,  dias:[1,3,5],hora:20, gh:"dupla-sena", dupla:true,
  desc:"Um bilhete, duas chances: são dois sorteios por concurso. Escolha de 6 a 15 números entre 50."},
 {id:"timemania",     nome:"Timemania",     emo:"⚽", c1:"#00A651",c2:"#00703a",fg:"#fff", min:1,max:80,pick:7,  dias:[0,2,4],hora:20, gh:"timemania", time:true,
  desc:"Escolha 10 números entre 80 e um Time do Coração. Ganhe com 3 a 7 acertos ou acertando o time."},
 {id:"diadesorte",    nome:"Dia de Sorte",  emo:"🌞", c1:"#CB852B",c2:"#8f5c17",fg:"#fff", min:1,max:31,pick:7,  dias:[0,1,2,3,4,5],hora:20, gh:"dia-de-sorte",
  desc:"Marque de 7 a 15 números entre 31 e um Mês de Sorte. Ganhe com 4, 5, 6 ou 7 acertos."},
 {id:"maismilionaria",nome:"+Milionária",   emo:"💎", c1:"#1E2C6B",c2:"#111a42",fg:"#fff", min:1,max:50,pick:6,  dias:[0,3],hora:20, gh:"mais-milionaria", trevos:true,
  desc:"Escolha 6 números entre 50 e 2 trevos entre 6. Prêmio principal nunca inferior a R$ 10 milhões."},
 {id:"supersete",     nome:"Super Sete",    emo:"7️⃣", c1:"#8FB528",c2:"#5f7a15",fg:"#fff", min:0,max:9, pick:7,  dias:[1,3,5],hora:15, gh:"super-sete", colunas:true,
  desc:"Sete colunas, um dígito de 0 a 9 em cada. Ganhe acertando de 3 a 7 colunas."},
 {id:"loteca",        nome:"Loteca",        emo:"🏟️", c1:"#D0202E",c2:"#8f151f",fg:"#fff", min:0,max:0, pick:0,  dias:[1],hora:14, gh:null, loteca:true,
  desc:"Dê o seu palpite nos 14 jogos de futebol da rodada. Ganha quem acerta 14 ou 13 resultados."}
];
COLI.byId = function(id){ for(var i=0;i<COLI.JOGOS.length;i++) if(COLI.JOGOS[i].id===id) return COLI.JOGOS[i]; return null; };

/* ───────────────────────── UTILITÁRIOS ───────────────────────── */
var DSN  = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];
var DFULL= ["DOMINGO","SEGUNDA-FEIRA","TERÇA-FEIRA","QUARTA-FEIRA","QUINTA-FEIRA","SEXTA-FEIRA","SÁBADO"];
COLI.DSN=DSN; COLI.DFULL=DFULL;
COLI.pad2 = function(x){ x=String(x); return x.length<2?"0"+x:x; };
COLI.esc = function(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };

/* "dd/mm/aaaa" ou "aaaa-mm-dd" → Date (na hora do sorteio) */
COLI.parseData = function(s, hora){
  if(!s) return null;
  if(s instanceof Date) return s;
  s=String(s).trim().slice(0,10);
  var p;
  if(s.indexOf("/")>-1){ p=s.split("/"); return new Date(+p[2],+p[1]-1,+p[0],hora==null?20:hora,0,0); }
  if(s.indexOf("-")>-1){ p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2],hora==null?20:hora,0,0); }
  return null;
};
COLI.fmtData = function(s){                 /* → "dd/mm/aaaa" */
  var d=COLI.parseData(s); if(!d||isNaN(d)) return s||"";
  return COLI.pad2(d.getDate())+"/"+COLI.pad2(d.getMonth()+1)+"/"+d.getFullYear();
};
COLI.fmtDataCurta = function(s){            /* → "dd/mm" */
  var d=COLI.parseData(s); if(!d||isNaN(d)) return s||"";
  return COLI.pad2(d.getDate())+"/"+COLI.pad2(d.getMonth()+1);
};
COLI.diaSemana = function(s){ var d=COLI.parseData(s); return (d&&!isNaN(d))?DSN[d.getDay()]:""; };
COLI.diaSemanaFull = function(s){ var d=COLI.parseData(s); return (d&&!isNaN(d))?DFULL[d.getDay()]:""; };

COLI.fmtInt = function(v){ return (+v||0).toLocaleString("pt-BR"); };
COLI.fmtMoeda = function(v){                 /* R$ 1.234.567,89 */
  v=+v||0; return "R$ "+v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
};
COLI.fmtMoedaCompacta = function(v, caixaAlta){  /* R$ 41 milhões */
  v=+v||0; if(v<=0) return null;
  var s;
  if(v>=1e9) s="R$ "+(v/1e9).toLocaleString("pt-BR",{maximumFractionDigits:1})+(v>=2e9?" bilhões":" bilhão");
  else if(v>=1e6) s="R$ "+(v/1e6).toLocaleString("pt-BR",{maximumFractionDigits:1})+(v>=2e6?" milhões":" milhão");
  else if(v>=1e3) s="R$ "+Math.round(v/1e3).toLocaleString("pt-BR")+" mil";
  else s="R$ "+v.toLocaleString("pt-BR");
  return caixaAlta?s.toUpperCase():s;
};

/* próximo sorteio pelo calendário da loteria */
COLI.proxSorteio = function(id, apos){
  var j=COLI.byId(id); if(!j) return null;
  var now=apos||new Date();
  for(var i=0;i<15;i++){
    var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,j.hora,0,0);
    if(j.dias.indexOf(d.getDay())>-1 && d>now) return d;
  }
  return null;
};

COLI.waURL = function(msg){ return "https://wa.me/"+(CFG.whatsapp||"")+"?text="+encodeURIComponent(msg||"Olá! Vim pelo site da "+(CFG.nome||"Coli Loterias")+"!"); };

/* ───────────────────────── REDE ───────────────────────── */
function getJSON(url, ms){
  return new Promise(function(res, rej){
    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var t = setTimeout(function(){ if(ctrl) ctrl.abort(); rej(new Error("timeout")); }, ms||8000);
    fetch(url, {signal: ctrl?ctrl.signal:undefined, cache:"no-store", credentials:"omit"})
      .then(function(r){ if(!r.ok) throw new Error("http "+r.status); return r.json(); })
      .then(function(j){ clearTimeout(t); res(j); })
      .catch(function(e){ clearTimeout(t); rej(e); });
  });
}
COLI.getJSON = getJSON;
function tentar(fontes){                     /* tenta uma lista de funções → Promise, na ordem */
  var i=0;
  return new Promise(function(res){
    (function prox(){
      if(i>=fontes.length){ res(null); return; }
      var f=fontes[i++];
      Promise.resolve().then(f).then(function(v){ if(v) res(v); else prox(); }).catch(function(){ prox(); });
    })();
  });
}
var LS = {
  get:function(k){ try{ var v=JSON.parse(localStorage.getItem("coli:"+k)); if(v && v.t && (Date.now()-v.t)<v.ttl) return v.v; }catch(e){} return null; },
  set:function(k,v,ttlMs){ try{ localStorage.setItem("coli:"+k, JSON.stringify({t:Date.now(),ttl:ttlMs,v:v})); }catch(e){} }
};
var TTL = Math.max(1,(+CFG.atualizarCadaMin||5))*60*1000;
var API = CFG.api || "api/loterias.php";
var DATA= CFG.dataDir || "data/";
var PUB1= "https://loteriascaixa-api.vercel.app/api/";
var PUB2= "https://api.guidi.dev.br/loteria/";
var GH  = "https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/";
var GH_CACHE={};

/* ───────────────────────── NORMALIZAÇÃO ─────────────────────────
   Devolve sempre o mesmo objeto, qualquer que seja a fonte:
   {numero, data, dezenas[], dezenas2[], trevos[], time, mes, acumulou,
    ganhadores, rateio[{faixa,ganhadores,valor}], proxNum, proxData,
    premioProx, arrecadado, local, jogos[], fonte}                       */
function arrStr(a){ if(!a) return []; if(!Array.isArray(a)) a=[a]; return a.map(function(x){ return String(x).trim(); }).filter(function(x){return x!=="";}); }
COLI.norm = function(d, fonte){
  if(!d) return null;
  if(Array.isArray(d)) d=d[0];
  if(!d || typeof d!=="object") return null;
  var n = d.numero || d.concurso || d.numeroConcurso || null;
  if(!n) return null;
  var dez = d.listaDezenas || d.dezenas || d.resultado || d.resultado_1 || d.dezenasSorteadasOrdemSorteio || [];
  var dez2= d.listaDezenasSegundoSorteio || d.dezenas2 || d.dezenasSegundoSorteio || d.resultado_2 || [];
  var trev= d.trevosSorteados || d.trevos || [];
  var time= d.nomeTimeCoracaoMesSorte || d.timeCoracao || d.time_do_coracao || d.timeDoCoracao || null;
  var mes = d.mesSorte || d.mes_da_sorte || null;
  if(time && /^(JANEIRO|FEVEREIRO|MARÇO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)$/i.test(time)){ mes=time; time=null; }
  var rateioRaw = d.listaRateioPremio || d.premiacoes || d.rateio || [];
  var rateio = rateioRaw.map(function(r){
    return { faixa: r.descricaoFaixa || r.descricao || r.faixa || r.nome || "",
             ganhadores: +(r.numeroDeGanhadores!=null?r.numeroDeGanhadores:(r.ganhadores!=null?r.ganhadores:(r.vencedores||0)))||0,
             valor: +(r.valorPremio!=null?r.valorPremio:(r.valor!=null?r.valor:(r.premio||0)))||0 };
  });
  var g = null;
  if(rateio.length) g=rateio[0].ganhadores;
  else if(d.ganhadores!=null) g=+d.ganhadores;
  var acum = (d.acumulado!=null)?!!d.acumulado:(d.acumulou!=null?!!d.acumulou:(g==null?null:g===0));
  var jogos = d.listaResultadoEquipeEsportiva || d.jogos || d.listaJogos || null;
  var premioProx = +(d.valorEstimadoProximoConcurso || d.premioEstimado || d.valorEstimado || d.estimativaPremio || 0) || 0;
  return {
    numero:+n,
    data: COLI.fmtData(d.dataApuracao || d.data || d.dataSorteio || d.data_sorteio || ""),
    dezenas: arrStr(dez), dezenas2: arrStr(dez2), trevos: arrStr(trev),
    time: time||null, mes: mes||null,
    acumulou: acum, ganhadores: g, rateio: rateio,
    proxNum: +(d.numeroConcursoProximo || d.proximoConcurso || (+n+1)),
    proxData: COLI.fmtData(d.dataProximoConcurso || d.data_proximo || ""),
    premioProx: premioProx,
    acumuladoProx: +(d.valorAcumuladoProximoConcurso||0)||0,
    arrecadado: +(d.valorArrecadado||0)||0,
    local: d.localSorteio ? (d.localSorteio+(d.nomeMunicipioUFSorteio?" – "+d.nomeMunicipioUFSorteio:"")) : (d.local||""),
    jogos: jogos, fonte: fonte||"?"
  };
};
/* linha compacta do histórico: [numero,"dd/mm/aaaa",[dezenas],extra] */
COLI.rowFromNorm = function(id, n){
  var j=COLI.byId(id); if(!n||!j) return null;
  var dz=n.dezenas.map(function(x){return +x;});
  var row=[n.numero, n.data, dz];
  if(j.dupla) row.push(n.dezenas2.map(function(x){return +x;}));
  else if(j.trevos) row.push(n.trevos.map(function(x){return +x;}));
  else if(j.time) row.push(n.time||"");
  return row;
};
COLI.normFromRow = function(id, r){
  var j=COLI.byId(id); if(!r) return null;
  var n={numero:r[0],data:r[1],dezenas:r[2].map(function(x){return j.colunas?String(x):COLI.pad2(x);}),dezenas2:[],trevos:[],time:null,mes:null,
         acumulou:null,ganhadores:null,rateio:[],proxNum:r[0]+1,proxData:"",premioProx:0,arrecadado:0,local:"",jogos:null,fonte:"historico"};
  if(j.dupla && r[3]) n.dezenas2=r[3].map(COLI.pad2);
  if(j.trevos && r[3]) n.trevos=r[3].map(String);
  if(j.time && r[3]) n.time=r[3];
  return n;
};

/* ───────────────────────── FONTES ───────────────────────── */
function ghLista(id){
  var j=COLI.byId(id); if(!j||!j.gh) return Promise.resolve(null);
  if(GH_CACHE[id]) return Promise.resolve(GH_CACHE[id]);
  return getJSON(GH+j.gh+".json", 15000).then(function(l){ if(!Array.isArray(l)||!l.length) return null; GH_CACHE[id]=l; return l; });
}
function ghUltimo(id){
  return ghLista(id).then(function(l){
    if(!l) return null; var u=l[0];
    for(var i=1;i<l.length;i++) if(l[i].concurso>u.concurso) u=l[i];
    return COLI.norm(u,"base");
  });
}
function ghConcurso(id,num){
  return ghLista(id).then(function(l){
    if(!l) return null;
    for(var i=l.length-1;i>=0;i--) if(l[i].concurso===num) return COLI.norm(l[i],"base");
    return null;
  });
}

COLI.api = {
  /* último resultado de uma loteria */
  ultimo: function(id){
    var c=LS.get("ultimo:"+id); if(c) return Promise.resolve(c);
    return tentar([
      function(){ return getJSON(API+"?jogo="+id, 9000).then(function(d){ return COLI.norm(d,"caixa"); }); },
      function(){ return getJSON(PUB1+id+"/latest", 7000).then(function(d){ return COLI.norm(d,"publica"); }); },
      function(){ return getJSON(PUB2+id+"/ultimo", 7000).then(function(d){ return COLI.norm(d,"publica"); }); },
      function(){ return ghUltimo(id); }
    ]).then(function(n){ if(n) LS.set("ultimo:"+id,n,TTL); return n; });
  },
  /* todos os últimos de uma vez (1 requisição quando há PHP) → {id: norm} */
  ultimos: function(){
    var c=LS.get("ultimos"); if(c) return Promise.resolve(c);
    return getJSON(API+"?acao=ultimos", 15000).then(function(d){
      var out={}, ok=0;
      COLI.JOGOS.forEach(function(j){ var n=COLI.norm(d&&d[j.id],"caixa"); if(n){ out[j.id]=n; ok++; } });
      if(!ok) throw new Error("vazio");
      return out;
    }).catch(function(){
      return Promise.all(COLI.JOGOS.map(function(j){ return COLI.api.ultimo(j.id); })).then(function(arr){
        var out={}; arr.forEach(function(n,i){ if(n) out[COLI.JOGOS[i].id]=n; }); return out;
      });
    }).then(function(out){
      var ok=Object.keys(out).length;
      if(ok){ LS.set("ultimos",out,TTL); Object.keys(out).forEach(function(k){ LS.set("ultimo:"+k,out[k],TTL); }); }
      return out;
    });
  },
  /* um concurso específico */
  concurso: function(id,num){
    var c=LS.get("conc:"+id+":"+num); if(c) return Promise.resolve(c);
    return tentar([
      function(){ return getJSON(API+"?jogo="+id+"&concurso="+num, 9000).then(function(d){ return COLI.norm(d,"caixa"); }); },
      function(){ return getJSON(PUB1+id+"/"+num, 7000).then(function(d){ return COLI.norm(d,"publica"); }); },
      function(){ return ghConcurso(id,num); }
    ]).then(function(n){ if(n && n.numero===num){ LS.set("conc:"+id+":"+num,n,30*864e5); return n; } return null; });
  },
  /* histórico completo (1º concurso → mais recente), sempre completando o que faltar */
  historico: function(id, onProgress){
    var j=COLI.byId(id); if(!j) return Promise.resolve(null);
    function completar(base){
      if(!base||!Array.isArray(base.concursos)) return null;
      base.concursos.sort(function(a,b){return a[0]-b[0];});
      var ult = base.concursos.length ? base.concursos[base.concursos.length-1][0] : 0;
      return COLI.api.ultimo(id).then(function(n){
        base.ultimoAoVivo = n||null;
        if(!n || n.numero<=ult) return base;
        var faltam=[]; for(var k=ult+1;k<=n.numero && faltam.length<80;k++) faltam.push(k);
        if(onProgress) onProgress("Buscando "+faltam.length+" concurso(s) novo(s) na CAIXA…");
        var seq=Promise.resolve(), novos=[];
        faltam.forEach(function(num){
          seq=seq.then(function(){
            if(num===n.numero) { novos.push(COLI.rowFromNorm(id,n)); return; }
            return COLI.api.concurso(id,num).then(function(c){ if(c) novos.push(COLI.rowFromNorm(id,c)); });
          });
        });
        return seq.then(function(){
          var tem={}; base.concursos.forEach(function(r){tem[r[0]]=1;});
          novos.forEach(function(r){ if(r && !tem[r[0]] && r[2].length){ base.concursos.push(r); tem[r[0]]=1; } });
          base.concursos.sort(function(a,b){return a[0]-b[0];});
          base.fonte=(base.fonte||"")+"+ao vivo";
          return base;
        });
      });
    }
    return tentar([
      function(){ return getJSON(API+"?jogo="+id+"&historico=1", 25000).then(function(b){ return (b&&b.concursos&&b.concursos.length)?b:null; }); },
      function(){ return getJSON(DATA+id+".json", 25000).then(function(b){ return (b&&b.concursos&&b.concursos.length)?b:null; }); },
      function(){ return ghLista(id).then(function(l){ if(!l) return null; return {jogo:id,fonte:"base",concursos:l.map(function(x){return COLI.rowFromNorm(id,COLI.norm(x,"base"));}).filter(Boolean)}; }); }
    ]).then(completar);
  },
  /* resumo pré-calculado (frequências, últimos) — usado na home */
  resumo: function(){ return getJSON(DATA+"resumo.json", 12000).catch(function(){ return null; }); }
};

/* ───────────────────────── INTERFACE COMUM ───────────────────────── */
var SVG_WA='<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.1 15 3.7 13.5 3.7 12c0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8.2-8.3 8.2z"/></svg>';
COLI.SVG = {
  wa: SVG_WA,
  chart:'<svg viewBox="0 0 24 24"><path d="M4 20h3v-9H4v9zm6.5 0h3V4h-3v16zm6.5 0h3v-6h-3v6z"/></svg>',
  trophy:'<svg viewBox="0 0 24 24"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H6l-3 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/></svg>',
  stats:'<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-6"/></svg>',
  dice:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="16" cy="8" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="8" cy="16" r="1.4" fill="currentColor"/><circle cx="16" cy="16" r="1.4" fill="currentColor"/></svg>'
};

function renderHeader(){
  var el=document.getElementById("coli-header"); if(!el) return;
  var page=document.body.getAttribute("data-page")||"";
  var jogoAtual=document.body.getAttribute("data-jogo")||"";
  var dd=COLI.JOGOS.map(function(j){
    return '<a href="estatisticas-'+j.id+'.html"'+(j.id===jogoAtual?' style="color:var(--azul);background:var(--azul-claro)"':'')+'><span class="dot" style="background:'+j.c1+'"></span>'+j.emo+' '+COLI.esc(j.nome)+'</a>';
  }).join("");
  el.className="hdr";
  el.innerHTML='<div class="wrap">'
    +'<a class="brand" href="index.html" aria-label="'+COLI.esc(CFG.nome||"Coli Loterias")+'"><img src="assets/img/logo.png" alt="'+COLI.esc(CFG.nome||"Coli Loterias")+'"></a>'
    +'<nav class="nav" id="nav" aria-label="Menu principal">'
      +'<div><a class="top'+(page==="home"?" on":"")+'" href="index.html">Início</a></div>'
      +'<div><a class="top'+(page==="resultados"?" on":"")+'" href="resultados.html">Resultados</a></div>'
      +'<div class="has-dd"><button class="top'+(page==="estatisticas"?" on":"")+'" type="button" aria-haspopup="true">Estatísticas <span class="car">▾</span></button><div class="dd">'+dd+'</div></div>'
      +'<div><a class="top" href="index.html#surpresinha">Monte seu jogo</a></div>'
      +'<div><a class="top'+(page==="quem-somos"?" on":"")+'" href="quem-somos.html">Quem somos</a></div>'
      +'<div><a class="top" href="'+COLI.esc(CFG.bolaoUrl||"#")+'" target="_blank" rel="noopener">Bolões</a></div>'
    +'</nav>'
    +'<div style="display:flex;align-items:center;gap:8px">'
      +'<a class="btn-wa-hd" href="'+COLI.waURL()+'" target="_blank" rel="noopener">'+SVG_WA+' Fale conosco</a>'
      +'<button class="hbg" id="hbg" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button>'
    +'</div></div>';
  var hb=document.getElementById("hbg"), nav=document.getElementById("nav");
  hb.addEventListener("click",function(){ var o=nav.classList.toggle("open"); hb.classList.toggle("on",o); hb.setAttribute("aria-expanded",o?"true":"false"); document.body.style.overflow=o?"hidden":""; });
  el.querySelector(".has-dd>button").addEventListener("click",function(e){ e.preventDefault(); this.parentElement.classList.toggle("mopen"); });
}
function renderFooter(){
  var el=document.getElementById("coli-footer"); if(!el) return;
  var ano=new Date().getFullYear();
  var links=COLI.JOGOS.map(function(j){ return '<li><a href="estatisticas-'+j.id+'.html">'+j.emo+' '+COLI.esc(j.nome)+'</a></li>'; });
  var metade=Math.ceil(links.length/2);
  el.className="foot";
  el.innerHTML='<div class="wrap">'
    +'<div class="foot-grid">'
      +'<div><img src="assets/img/logo.png" alt="'+COLI.esc(CFG.nome||"")+'">'
        +(CFG.slogan?'<p style="color:var(--txt);font-weight:800;margin-bottom:6px">'+COLI.esc(CFG.slogan)+'</p>':'')
        +'<p>📍 <a href="'+COLI.esc(CFG.mapsUrl||"#")+'" target="_blank" rel="noopener" style="color:var(--txt2)">'+COLI.esc(CFG.endereco||"")+'</a></p>'
        +(CFG.telefones&&CFG.telefones.length?'<p>📞 '+CFG.telefones.map(function(t){return '<a href="tel:+55'+String(t).replace(/\D/g,"")+'" style="color:var(--azul)">'+COLI.esc(t)+'</a>';}).join(" · ")+'</p>':'')
        +(CFG.horario?'<p>🕒 '+COLI.esc(CFG.horario)+'</p>':'')
        +'<p style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-wa" href="'+COLI.waURL()+'" target="_blank" rel="noopener">'+SVG_WA+' WhatsApp</a>'
        +(CFG.instagram?'<a class="btn btn-ghost" href="'+COLI.esc(CFG.instagram)+'" target="_blank" rel="noopener">Instagram</a>':'')
        +(CFG.facebook?'<a class="btn btn-ghost" href="'+COLI.esc(CFG.facebook)+'" target="_blank" rel="noopener">Facebook</a>':'')+'</p></div>'
      +'<div><h4>Estatísticas</h4><ul>'+links.slice(0,metade).join("")+'</ul></div>'
      +'<div><h4>&nbsp;</h4><ul>'+links.slice(metade).join("")+'</ul></div>'
      +'<div><h4>Navegação</h4><ul><li><a href="index.html">Início</a></li><li><a href="resultados.html">Últimos resultados</a></li><li><a href="index.html#surpresinha">Monte seu jogo</a></li><li><a href="quem-somos.html">Quem somos</a></li><li><a href="index.html#contato">Contato</a></li>'
        +'<li><a href="'+COLI.esc(CFG.bolaoUrl||"#")+'" target="_blank" rel="noopener">Bolões da CAIXA</a></li><li><a href="https://loterias.caixa.gov.br" target="_blank" rel="noopener">Site oficial das Loterias</a></li></ul></div>'
    +'</div>'
    +'<div class="foot-bt"><span>© '+ano+' '+COLI.esc(CFG.nome||"Coli Loterias")+(CFG.fundacao?' · desde '+CFG.fundacao:'')+'. Todos os direitos reservados.</span>'
    +'<span>Resultados oficiais divulgados pela <a href="https://loterias.caixa.gov.br" target="_blank" rel="noopener">CAIXA</a>. Em caso de divergência, vale o resultado oficial. Jogue com responsabilidade · proibido para menores de 18 anos.</span></div>'
    +'</div>';
  if(!document.getElementById("wa-float")){
    var f=document.createElement("a"); f.id="wa-float"; f.className="wa-float"; f.href=COLI.waURL(); f.target="_blank"; f.rel="noopener"; f.setAttribute("aria-label","Falar no WhatsApp"); f.innerHTML=SVG_WA;
    document.body.appendChild(f);
  }
}

/* ───────── MODAL DE RESULTADO (reutilizado por várias páginas) ───────── */
function ensureModal(){
  var m=document.getElementById("rmodal"); if(m) return m;
  m=document.createElement("div"); m.id="rmodal"; m.className="modal"; m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true");
  m.innerHTML='<div class="modal-box" id="rm-box"><button class="modal-x" id="rm-x" aria-label="Fechar">✕</button><div class="rm-title" id="rm-title"></div><div class="rm-sub" id="rm-sub"></div><div id="rm-body"></div><div class="rm-foot" id="rm-foot"></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click",function(e){ if(e.target===m) COLI.ui.fecharModal(); });
  document.getElementById("rm-x").addEventListener("click",COLI.ui.fecharModal);
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") COLI.ui.fecharModal(); });
  return m;
}
COLI.ui = {
  fecharModal: function(){ var m=document.getElementById("rmodal"); if(m){ m.classList.remove("open"); document.body.style.overflow=""; } },
  bolas: function(arr, cls){ return (arr||[]).map(function(x){ return '<div class="'+(cls||"rm-ball")+'">'+COLI.esc(x)+'</div>'; }).join(""); },
  /* HTML do bloco de resultado (bolas + extras + status + rateio) */
  htmlResultado: function(j, n, opts){
    opts=opts||{};
    var h="";
    var bolaCls=opts.bolaCls||"rm-ball";
    var bolaStyle=opts.bolaStyle||"";
    function bolas(a){ return (a||[]).map(function(x){ return '<div class="'+bolaCls+'" style="'+bolaStyle+'">'+COLI.esc(x)+'</div>'; }).join(""); }
    if(j.loteca){
      h+=COLI.ui.htmlLoteca(n);
    } else if(n.dezenas2 && n.dezenas2.length){
      h+='<div class="rm-lbl">1º sorteio</div><div class="rm-balls">'+bolas(n.dezenas)+'</div><div class="rm-lbl">2º sorteio</div><div class="rm-balls">'+bolas(n.dezenas2)+'</div>';
    } else if(n.dezenas && n.dezenas.length){
      h+='<div class="rm-balls">'+bolas(n.dezenas)+'</div>';
      if(j.colunas) h+='<div class="rm-extra" style="opacity:.75">Colunas 1 a 7, da esquerda para a direita</div>';
    } else {
      h+='<div class="rm-extra">Números não disponíveis no momento.</div>';
    }
    if(n.trevos && n.trevos.length) h+='<div class="rm-extra">🍀 Trevos: '+n.trevos.join(" e ")+'</div>';
    if(n.time) h+='<div class="rm-extra">⚽ Time do Coração: '+COLI.esc(n.time)+'</div>';
    if(n.mes)  h+='<div class="rm-extra">📅 Mês de Sorte: '+COLI.esc(n.mes)+'</div>';
    if(n.ganhadores===0 || n.acumulou===true) h+='<div class="rm-st">ACUMULOU!</div>';
    else if(n.ganhadores>0) h+='<div class="rm-st">🏆 '+COLI.fmtInt(n.ganhadores)+(n.ganhadores===1?" GANHADOR":" GANHADORES")+'</div>';
    if(n.rateio && n.rateio.length && opts.rateio!==false){
      h+='<table class="'+(opts.rateioCls||"rm-tbl")+'"><thead><tr><th>Faixa</th><th>Ganhadores</th><th>Prêmio</th></tr></thead><tbody>';
      n.rateio.forEach(function(r){ h+='<tr><td>'+COLI.esc(r.faixa)+'</td><td>'+COLI.fmtInt(r.ganhadores)+'</td><td>'+(r.valor>0?COLI.fmtMoeda(r.valor):"—")+'</td></tr>'; });
      h+='</tbody></table>';
    }
    return h;
  },
  htmlLoteca: function(n){
    var jogos=n.jogos;
    if(!jogos||!jogos.length) return '<div class="rm-extra">Veja os 14 jogos da rodada no site oficial.</div>';
    /* Tenta descobrir os campos da API da CAIXA de forma tolerante */
    function pick(o,re){ for(var k in o){ if(re.test(k)) return o[k]; } return undefined; }
    var porJogo={};
    jogos.forEach(function(t){
      var nj = t.nuJogo!=null?t.nuJogo:(t.numeroJogo!=null?t.numeroJogo:pick(t,/jogo/i));
      if(nj==null) return;
      porJogo[nj]=porJogo[nj]||[];
      porJogo[nj].push({time:t.nomeTime||t.noTime||pick(t,/time|equipe/i)||"", gols:t.nuGols!=null?t.nuGols:(t.nuGolsTime!=null?t.nuGolsTime:pick(t,/gol/i)), ordem:t.nuSequencial!=null?t.nuSequencial:(t.icTimeColuna!=null?t.icTimeColuna:pick(t,/sequen|ordem|coluna/i))});
    });
    var keys=Object.keys(porJogo).sort(function(a,b){return a-b;});
    if(!keys.length) return '<div class="rm-extra">Veja os 14 jogos da rodada no site oficial.</div>';
    var h='<table class="loteca-tbl"><tbody>';
    keys.forEach(function(k){
      var p=porJogo[k].sort(function(a,b){return (a.ordem>b.ordem)?1:-1;});
      var a=p[0]||{}, b=p[1]||{};
      var ga=+a.gols, gb=+b.gols, tem=!isNaN(ga)&&!isNaN(gb)&&a.gols!=null&&b.gols!=null;
      h+='<tr><td class="n">'+k+'</td><td class="'+(tem&&ga>gb?"win":"")+'">'+COLI.esc(a.time)+'</td><td class="g">'+(tem?ga:"")+'</td><td class="g">×</td><td class="g">'+(tem?gb:"")+'</td><td class="'+(tem&&gb>ga?"win":"")+'">'+COLI.esc(b.time)+'</td></tr>';
    });
    return h+'</tbody></table>';
  },
  /* abre o modal do último resultado da loteria */
  modalResultado: function(id, dadosPrevios){
    var j=COLI.byId(id); if(!j) return;
    var m=ensureModal();
    var box=document.getElementById("rm-box"); box.style.background="linear-gradient(160deg,"+j.c1+","+j.c2+")";
    document.getElementById("rm-title").textContent=j.emo+" "+j.nome;
    document.getElementById("rm-sub").textContent="Carregando último resultado…";
    document.getElementById("rm-body").innerHTML='<div class="rm-balls"><span class="skel" style="width:220px;height:40px">&nbsp;</span></div>';
    document.getElementById("rm-foot").innerHTML='<a href="estatisticas-'+j.id+'.html">📊 Ver estatísticas completas</a><a href="https://loterias.caixa.gov.br" target="_blank" rel="noopener">Site oficial da CAIXA →</a>';
    m.classList.add("open"); document.body.style.overflow="hidden";
    var mostrado=0;
    function pintar(n){
      if(!n || n.numero<mostrado) return; mostrado=n.numero;
      document.getElementById("rm-title").textContent=j.emo+" "+j.nome+" · Concurso "+n.numero;
      document.getElementById("rm-sub").textContent=(n.data?"Sorteio de "+n.data+(COLI.diaSemana(n.data)?" ("+COLI.diaSemana(n.data)+")":""):"")+(n.local?" · "+n.local:"");
      document.getElementById("rm-body").innerHTML=COLI.ui.htmlResultado(j,n);
    }
    if(dadosPrevios) pintar(dadosPrevios);
    COLI.api.ultimo(id).then(function(n){
      if(n) pintar(n);
      else if(!dadosPrevios){ document.getElementById("rm-sub").textContent=""; document.getElementById("rm-body").innerHTML='<div class="rm-extra">Não foi possível carregar o resultado agora. Confira no site oficial.</div>'; }
    });
  },
  statusBar: function(el, tipo, txt){ if(!el) return; el.className="status-bar "+(tipo||""); el.innerHTML='<span class="live-dot"></span> '+COLI.esc(txt); }
};
COLI.nomeFonte = function(f){ return {caixa:"API oficial da CAIXA",publica:"API pública das Loterias",base:"base diária (sem valores de prêmio)",historico:"histórico local"}[f]||f; };


/* ───────── VERIFICAÇÃO DE IDADE (+18) ───────── */
function renderAgeGate(){
  if(CFG.verificarIdade===false) return;
  try{ var ok=JSON.parse(localStorage.getItem("coli:idade18")||"null"); if(ok && ok.t && (Date.now()-ok.t)<(30*864e5)) return; }catch(e){}
  var g=document.createElement("div"); g.className="idade"; g.id="idade"; g.setAttribute("role","dialog"); g.setAttribute("aria-modal","true"); g.setAttribute("aria-labelledby","idade-h");
  g.innerHTML='<div class="idade-box" id="idade-box">'
    +'<img src="assets/img/logo.png" alt="'+COLI.esc(CFG.nome||"Coli Loterias")+'">'
    +'<div class="idade-sim"><div class="n18">18+</div><h2 id="idade-h">Você tem 18 anos ou mais?</h2>'
    +'<p>As Loterias CAIXA são exclusivas para maiores de idade. Para acessar o site da '+COLI.esc(CFG.nome||"Coli Loterias")+', confirme que você tem 18 anos ou mais.</p>'
    +'<div class="idade-btns"><button class="btn btn-laranja" type="button" id="idade-ok">Sim, tenho 18 anos ou mais</button><button class="btn btn-ghost" type="button" id="idade-nao">Não tenho</button></div>'
    +'<small>Jogue com responsabilidade. Proibido para menores de 18 anos (Lei 13.756/2018).</small></div>'
    +'<div class="idade-nao"><div class="n18" style="background:#e6eaf1;color:#5b6572">🔒</div><h2>Acesso restrito</h2>'
    +'<p>Este site é destinado apenas a maiores de 18 anos. Obrigado pela compreensão.</p>'
    +'<div class="idade-btns"><a class="btn btn-azul" href="https://www.google.com.br">Sair do site</a><button class="btn btn-ghost" type="button" id="idade-voltar">Voltar</button></div></div>'
    +'</div>';
  document.body.appendChild(g); document.body.style.overflow="hidden";
  document.getElementById("idade-ok").addEventListener("click",function(){
    try{ localStorage.setItem("coli:idade18",JSON.stringify({t:Date.now()})); }catch(e){}
    g.remove(); document.body.style.overflow="";
  });
  document.getElementById("idade-nao").addEventListener("click",function(){ document.getElementById("idade-box").classList.add("negado"); });
  document.getElementById("idade-voltar").addEventListener("click",function(){ document.getElementById("idade-box").classList.remove("negado"); });
  setTimeout(function(){ var b=document.getElementById("idade-ok"); if(b) b.focus(); },50);
}

document.addEventListener("DOMContentLoaded",function(){ renderHeader(); renderFooter(); renderAgeGate(); });
})();
