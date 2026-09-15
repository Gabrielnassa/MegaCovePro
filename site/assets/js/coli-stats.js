/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — ESTATÍSTICAS (todos os concursos, 1º → mais recente)
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var CFG=window.COLI_CONFIG||{}, $=function(id){return document.getElementById(id);};
var ID=document.body.getAttribute("data-jogo"), J=COLI.byId(ID);
if(!J) return;
var HIST=[];            /* linhas [numero,data,[dez],extra] em ordem crescente */
var LIVE=null;          /* último resultado ao vivo (com prêmios) */
var PER=0, SORTEIO="ambos", ORD="num", DIR="desc", MOSTRA=50, BUSCA="";
var STATS=null;
var N=J.max-J.min+1;
var pad=function(v){ return J.colunas?String(v):COLI.pad2(v); };
var cor=J.c1;

/* ───────────────────────── CÁLCULOS ───────────────────────── */
function dezenasDe(r){
  if(J.dupla){ if(SORTEIO==="1") return r[2]; if(SORTEIO==="2") return r[3]||[]; return r[2].concat(r[3]||[]); }
  return r[2];
}
function calcular(rows){
  var freq=[],atraso=[],ultimaVez=[],i;
  for(i=0;i<N;i++){freq.push(0);atraso.push(rows.length);ultimaVez.push(null);}
  var paresDist={}, somas=[], somaMin=Infinity, somaMax=-Infinity, somaTot=0;
  var faixaTam = J.max<=25?5:10, faixas=[], nf=Math.ceil(N/faixaTam);
  for(i=0;i<nf;i++) faixas.push(0);
  var repetDist={}, consecTot=0, repetTot=0;
  var cols=null, colsAtraso=null, trevos=null, times=null;
  if(J.colunas){ cols=[];colsAtraso=[]; for(i=0;i<7;i++){ cols.push([0,0,0,0,0,0,0,0,0,0]); colsAtraso.push([rows.length,rows.length,rows.length,rows.length,rows.length,rows.length,rows.length,rows.length,rows.length,rows.length]); } }
  if(J.trevos){ trevos=[0,0,0,0,0,0]; }
  if(J.time){ times={}; }
  var prev=null;
  rows.forEach(function(r,idx){
    var dz=dezenasDe(r), pares=0, soma=0;
    dz.forEach(function(d){
      var k=d-J.min; if(k<0||k>=N) return;
      freq[k]++; atraso[k]=rows.length-1-idx; ultimaVez[k]=r[0];
      if(d%2===0) pares++; soma+=d;
      if(!J.colunas) faixas[Math.floor(k/faixaTam)]++;
    });
    if(J.colunas){ r[2].forEach(function(d,c){ if(c<7&&d>=0&&d<=9){ cols[c][d]++; colsAtraso[c][d]=rows.length-1-idx; } }); }
    if(J.trevos && r[3]) r[3].forEach(function(t){ if(t>=1&&t<=6) trevos[t-1]++; });
    if(J.time && r[3]) { var t=String(r[3]).trim(); if(t) times[t]=(times[t]||0)+1; }
    paresDist[pares]=(paresDist[pares]||0)+1;
    somas.push(soma); somaTot+=soma; if(soma<somaMin)somaMin=soma; if(soma>somaMax)somaMax=soma;
    if(!J.colunas){
      var s=dz.slice().sort(function(a,b){return a-b;}), cons=0;
      for(i=1;i<s.length;i++) if(s[i]===s[i-1]+1) cons++;
      consecTot+=cons;
      if(prev){ var rep=0; dz.forEach(function(d){ if(prev.indexOf(d)>-1) rep++; }); repetDist[rep]=(repetDist[rep]||0)+1; repetTot+=rep; }
    }
    prev=dz;
  });
  /* histograma de somas em ~12 faixas */
  var hist=[], nb=12, largura=Math.max(1,Math.ceil((somaMax-somaMin+1)/nb));
  for(i=0;i<nb;i++) hist.push({de:somaMin+i*largura, ate:somaMin+(i+1)*largura-1, q:0});
  somas.forEach(function(s){ var b=Math.min(nb-1,Math.floor((s-somaMin)/largura)); if(hist[b]) hist[b].q++; });
  return {total:rows.length, freq:freq, atraso:atraso, ultimaVez:ultimaVez, paresDist:paresDist, somaMin:somaMin, somaMax:somaMax,
          somaMed:rows.length?somaTot/rows.length:0, somaHist:hist, faixas:faixas, faixaTam:faixaTam, repetDist:repetDist,
          repetMed:rows.length>1?repetTot/(rows.length-1):0, consecMed:rows.length?consecTot/rows.length:0,
          cols:cols, colsAtraso:colsAtraso, trevos:trevos, times:times, porSorteio:J.dupla?(SORTEIO==="ambos"?2:1):1};
}
function recorte(){ return PER>0?HIST.slice(-PER):HIST; }

/* ───────────────────────── RENDERIZAÇÃO ───────────────────────── */
function heat(v,mn,mx){ var t=(mx===mn)?1:(v-mn)/(mx-mn); return {bg:mix("#eef1f6",cor,Math.pow(t,1.2)), fg:t>.55?"#fff":"#1b2438"}; }
function mix(a,b,t){
  var pa=hex(a),pb=hex(b); var r=Math.round(pa[0]+(pb[0]-pa[0])*t),g=Math.round(pa[1]+(pb[1]-pa[1])*t),bl=Math.round(pa[2]+(pb[2]-pa[2])*t);
  return "rgb("+r+","+g+","+bl+")";
}
function hex(h){ h=h.replace("#",""); if(h.length===3) h=h.split("").map(function(c){return c+c;}).join(""); var n=parseInt(h,16); return [n>>16&255,n>>8&255,n&255]; }

function renderCabecalho(){
  var s=STATS, tot=HIST.length;
  $("k-total").textContent=COLI.fmtInt(tot);
  if(tot){
    $("k-primeiro").innerHTML=HIST[0][0]+' <small style="font-size:.7rem;font-weight:700;opacity:.8">'+COLI.esc(HIST[0][1])+'</small>';
    $("k-ultimo").innerHTML=HIST[tot-1][0]+' <small style="font-size:.7rem;font-weight:700;opacity:.8">'+COLI.esc(HIST[tot-1][1])+'</small>';
  }
  var ult = LIVE && HIST.length && LIVE.numero>=HIST[tot-1][0] ? LIVE : (tot?COLI.normFromRow(ID,HIST[tot-1]):null);
  if(ult){
    $("l-num").textContent="Concurso "+ult.numero+(ult.data?" · "+ult.data:"");
    var h=COLI.ui.htmlResultado(J,ult,{bolaCls:"rball",bolaStyle:"background:linear-gradient(145deg,"+J.c1+","+J.c2+")",rateio:false})
      .replace(/class="rm-balls"/g,'class="rc-balls"').replace(/class="rm-lbl"/g,'class="rc-lbl"').replace(/class="rm-extra"/g,'class="rc-extra"').replace(/class="rm-st"/g,'class="rc-status" style="color:'+J.c1+'"');
    $("l-body").innerHTML=h;
    var proxData=ult.proxData?COLI.parseData(ult.proxData,J.hora):null; if(!proxData||proxData<new Date()) proxData=COLI.proxSorteio(ID);
    var premio=ult.premioProx>0?COLI.fmtMoedaCompacta(ult.premioProx):null;
    $("l-next").innerHTML='<span>Próximo: concurso <b>'+(ult.proxNum||ult.numero+1)+'</b>'+(proxData?' · '+COLI.fmtData(proxData)+' ('+COLI.DSN[proxData.getDay()]+')':'')+'</span>'+(premio?'<span>Prêmio estimado <b style="color:'+J.c1+'">'+premio+'</b></span>':'');
  }
}
function renderGrid(){
  var s=STATS, mn=Math.min.apply(null,s.freq), mx=Math.max.apply(null,s.freq);
  var idx=[]; for(var i=0;i<N;i++) idx.push(i);
  if(ORD==="freq") idx.sort(function(a,b){return s.freq[b]-s.freq[a]||a-b;});
  else if(ORD==="atraso") idx.sort(function(a,b){return s.atraso[b]-s.atraso[a]||a-b;});
  var top=idx.slice().sort(function(a,b){return s.freq[b]-s.freq[a];}).slice(0,Math.min(10,Math.max(3,Math.floor(N/3))));
  var g=$("numgrid"); g.className="numgrid"+(N<=10?" c5":(N<=31?" c8":""));
  $("legend-bar").style.setProperty("--gc",cor);
  $("legend-bar").parentElement.lastChild.textContent=" Top "+top.length;
  g.innerHTML=idx.map(function(k){
    var h=heat(s.freq[k],mn,mx);
    return '<div class="ng'+(top.indexOf(k)>-1?" top":"")+'" style="background:'+h.bg+';color:'+h.fg+'" title="'+pad(k+J.min)+': sorteado '+COLI.fmtInt(s.freq[k])+'× · atraso '+s.atraso[k]+' concurso(s)'+(s.ultimaVez[k]?' · última vez no concurso '+s.ultimaVez[k]:'')+'"><b>'+pad(k+J.min)+'</b><span>'+COLI.fmtInt(s.freq[k])+'×</span></div>';
  }).join("");
  $("freq-sub").textContent=(PER?"Últimos "+COLI.fmtInt(s.total):"Todos os "+COLI.fmtInt(s.total))+" concursos"+(J.dupla?" ("+(SORTEIO==="ambos"?"1º e 2º sorteios":"só o "+SORTEIO+"º sorteio")+")":"")+" · média de "+(s.total?(s.freq.reduce(function(a,b){return a+b;},0)/N).toFixed(1).replace(".",","):0)+" sorteios por número. Passe o mouse para ver o atraso atual.";
}
function rankHTML(itens){ return itens.map(function(o){ return '<div class="rk"><div class="dn" style="background:'+(o.cor||cor)+'">'+o.n+'</div><div class="dl"><b>'+o.b+'</b><span>'+o.s+'</span></div></div>'; }).join(""); }
function renderRanks(){
  var s=STATS, idx=[]; for(var i=0;i<N;i++) idx.push(i);
  var hot=idx.slice().sort(function(a,b){return s.freq[b]-s.freq[a]||a-b;}).slice(0,10);
  var cold=idx.slice().sort(function(a,b){return s.freq[a]-s.freq[b]||a-b;}).slice(0,10);
  var late=idx.slice().sort(function(a,b){return s.atraso[b]-s.atraso[a]||a-b;}).slice(0,10);
  var pct=function(f){ if(!s.total) return ""; return J.colunas?((f/(s.total*7))*100).toFixed(1).replace(".",",")+"% das colunas":((f/s.total)*100).toFixed(1).replace(".",",")+"% dos concursos"; };
  $("rank-hot").innerHTML=rankHTML(hot.map(function(k){return {n:pad(k+J.min),b:COLI.fmtInt(s.freq[k])+" vezes",s:pct(s.freq[k])};}));
  $("rank-cold").innerHTML=rankHTML(cold.map(function(k){return {n:pad(k+J.min),b:COLI.fmtInt(s.freq[k])+" vezes",s:pct(s.freq[k]),cor:"#5b6572"};}));
  $("rank-late").innerHTML=rankHTML(late.map(function(k){return {n:pad(k+J.min),b:s.atraso[k]+" concursos",s:s.ultimaVez[k]?"última vez no "+s.ultimaVez[k]:"nunca sorteado",cor:"#8b94a3"};}));
  var ult=HIST.length?HIST[HIST.length-1]:null;
  if(ult){
    var dz=J.dupla?ult[2].concat(SORTEIO==="ambos"?(ult[3]||[]):[]):ult[2];
    if(J.dupla&&SORTEIO==="2") dz=ult[3]||[];
    var media=s.freq.reduce(function(a,b){return a+b;},0)/N;
    $("rank-last").innerHTML=rankHTML(dz.map(function(d,ci){ var k=d-J.min; var f=(J.colunas?s.cols[ci][d]:s.freq[k])||0; return {n:pad(d),b:COLI.fmtInt(f)+" vezes",s:J.colunas?"coluna "+(ci+1):(f>=media?"acima da média":"abaixo da média")}; }));
  }
}
function barsHTML(itens,mx,fmt){ return itens.map(function(o){ return '<div class="bar"><span class="bl" title="'+COLI.esc(o.l)+'">'+COLI.esc(o.l)+'</span><span class="bt"><i style="width:'+(mx?Math.max(1,o.v/mx*100):0)+'%;background:'+cor+'"></i></span><span class="bv">'+(fmt?fmt(o.v):COLI.fmtInt(o.v))+'</span></div>'; }).join(""); }
function renderPadroes(){
  var s=STATS, tot=s.total||1, k;
  var pick=J.dupla?(SORTEIO==="ambos"?12:6):J.pick;
  /* pares/ímpares */
  var keys=Object.keys(s.paresDist).map(Number).sort(function(a,b){return a-b;});
  var maisComum=keys.slice().sort(function(a,b){return s.paresDist[b]-s.paresDist[a];})[0];
  var mediaPares=keys.reduce(function(a,k){return a+k*s.paresDist[k];},0)/tot;
  $("pares-kpis").innerHTML='<div class="mk"><b>'+mediaPares.toFixed(1).replace(".",",")+'</b><span>média de pares</span></div><div class="mk"><b>'+(pick-mediaPares).toFixed(1).replace(".",",")+'</b><span>média de ímpares</span></div><div class="mk"><b>'+maisComum+'×'+(pick-maisComum)+'</b><span>combinação mais comum</span></div><div class="mk"><b>'+((s.paresDist[maisComum]||0)/tot*100).toFixed(0)+'%</b><span>dos concursos</span></div>';
  var mxP=Math.max.apply(null,keys.map(function(k){return s.paresDist[k];}));
  $("pares-bars").innerHTML=barsHTML(keys.map(function(k){return {l:k+" pares / "+(pick-k)+" ímpares",v:s.paresDist[k]};}),mxP,function(v){return COLI.fmtInt(v)+" ("+(v/tot*100).toFixed(1).replace(".",",")+"%)";});
  /* soma */
  var faixaTop=s.somaHist.slice().sort(function(a,b){return b.q-a.q;})[0]||{de:0,ate:0,q:0};
  $("soma-kpis").innerHTML='<div class="mk"><b>'+COLI.fmtInt(Math.round(s.somaMed))+'</b><span>soma média</span></div><div class="mk"><b>'+COLI.fmtInt(s.somaMin)+'</b><span>menor soma</span></div><div class="mk"><b>'+COLI.fmtInt(s.somaMax)+'</b><span>maior soma</span></div><div class="mk"><b>'+faixaTop.de+'–'+faixaTop.ate+'</b><span>faixa mais frequente</span></div>';
  var mxH=Math.max.apply(null,s.somaHist.map(function(h){return h.q;}))||1;
  $("soma-hist").innerHTML=s.somaHist.map(function(h){ return '<div class="hb" title="Soma entre '+h.de+' e '+h.ate+': '+COLI.fmtInt(h.q)+' concursos"><i style="height:'+(h.q/mxH*100)+'%;background:'+cor+'"></i><span>'+h.de+'</span></div>'; }).join("");
  /* faixas */
  if(J.colunas){ $("sec-faixas").hidden=true; $("sec-repet").hidden=true; }
  else{
    var totalDez=s.faixas.reduce(function(a,b){return a+b;},0)||1, mxF=Math.max.apply(null,s.faixas)||1;
    $("faixas-bars").innerHTML=barsHTML(s.faixas.map(function(v,i){ var de=J.min+i*s.faixaTam, ate=Math.min(J.max,de+s.faixaTam-1); return {l:pad(de)+" a "+pad(ate),v:v}; }),mxF,function(v){return (v/totalDez*100).toFixed(1).replace(".",",")+"%";});
    /* repetições */
    var rk=Object.keys(s.repetDist).map(Number).sort(function(a,b){return a-b;}), mxR=Math.max.apply(null,rk.map(function(k){return s.repetDist[k];}))||1;
    $("repet-kpis").innerHTML='<div class="mk"><b>'+s.repetMed.toFixed(2).replace(".",",")+'</b><span>repetidos do anterior (média)</span></div><div class="mk"><b>'+s.consecMed.toFixed(2).replace(".",",")+'</b><span>pares consecutivos (média)</span></div><div class="mk"><b>'+((s.repetDist[0]||0)/Math.max(1,tot-1)*100).toFixed(0)+'%</b><span>concursos sem repetição</span></div><div class="mk"><b>'+pick+'</b><span>dezenas por concurso</span></div>';
    $("repet-bars").innerHTML=barsHTML(rk.map(function(k){return {l:k+" repetido"+(k===1?"":"s"),v:s.repetDist[k]};}),mxR);
  }
  /* especiais */
  if(J.colunas){
    $("sec-colunas").hidden=false;
    $("cols7").innerHTML=s.cols.map(function(col,c){
      var mx=Math.max.apply(null,col)||1;
      return '<div class="col7"><h4>Coluna '+(c+1)+'</h4>'+col.map(function(v,d){ return '<div class="d"><b>'+d+'</b><span class="bt"><i style="width:'+(v/mx*100)+'%;background:'+cor+'"></i></span><span>'+v+'</span></div>'; }).join("")+'</div>';
    }).join("");
  }
  if(J.trevos){
    $("sec-trevos").hidden=false;
    $("rank-trevos").innerHTML=rankHTML(s.trevos.map(function(v,i){return {n:"🍀"+(i+1),b:COLI.fmtInt(v)+" vezes",s:(v/tot*100).toFixed(1).replace(".",",")+"% dos concursos",cor:"#166534"};}));
  }
  if(J.time){
    $("sec-times").hidden=false;
    var ts=Object.keys(s.times).sort(function(a,b){return s.times[b]-s.times[a];}).slice(0,15), mxT=ts.length?s.times[ts[0]]:1;
    $("times-bars").innerHTML=barsHTML(ts.map(function(t){return {l:t,v:s.times[t]};}),mxT);
  }
}
function renderTabela(reset){
  if(reset) MOSTRA=50;
  var cols=['<th>Concurso</th><th>Data</th><th>'+(J.colunas?"Colunas 1 a 7":(J.dupla?"1º sorteio":"Dezenas"))+'</th>'];
  if(J.dupla) cols.push('<th>2º sorteio</th>'); if(J.trevos) cols.push('<th>Trevos</th>'); if(J.time) cols.push('<th>Time do Coração</th>');
  $("tbl-head").innerHTML='<tr>'+cols.join("")+'</tr>';
  var q=BUSCA.trim().toLowerCase(), lista=HIST;
  if(q){
    var isNum=/^\d+$/.test(q);
    lista=HIST.filter(function(r){
      if(isNum){ var n=+q; if(String(r[0]).indexOf(q)===0) return true; if(q.length<=2 && r[2].indexOf(n)>-1) return true; if(J.dupla&&q.length<=2&&(r[3]||[]).indexOf(n)>-1) return true; return false; }
      if(r[1].indexOf(q)>-1) return true;
      if(J.time && r[3] && String(r[3]).toLowerCase().indexOf(q)>-1) return true;
      return false;
    });
  }
  var ordenada=DIR==="desc"?lista.slice().reverse():lista;
  var vis=ordenada.slice(0,MOSTRA);
  var ultimo=HIST.length?HIST[HIST.length-1][0]:0;
  $("tbl-body").innerHTML=vis.length?vis.map(function(r){
    var tds='<td class="n">'+r[0]+(r[0]===ultimo?' <span class="novo" style="background:'+cor+';color:#fff">último</span>':'')+'</td><td class="d">'+COLI.esc(r[1])+' <small style="color:#8b94a3">'+COLI.diaSemana(r[1])+'</small></td>'
      +'<td><span class="mb">'+r[2].map(function(d){return '<i style="background:'+cor+'">'+pad(d)+'</i>';}).join("")+'</span></td>';
    if(J.dupla) tds+='<td><span class="mb">'+(r[3]||[]).map(function(d){return '<i class="s2" style="background:'+cor+'">'+pad(d)+'</i>';}).join("")+'</span></td>';
    if(J.trevos) tds+='<td><span class="mb">'+(r[3]||[]).map(function(d){return '<i style="background:#166534">'+d+'</i>';}).join("")+'</span></td>';
    if(J.time) tds+='<td>'+COLI.esc(r[3]||"")+'</td>';
    return '<tr>'+tds+'</tr>';
  }).join(""):'<tr><td colspan="'+cols.length+'" class="empty">Nenhum concurso encontrado.</td></tr>';
  $("tbl-info").textContent="Exibindo "+COLI.fmtInt(vis.length)+" de "+COLI.fmtInt(lista.length)+" concursos"+(q?" (filtro: “"+BUSCA+"”)":"");
  $("btn-mais").hidden=vis.length>=lista.length;
}
function renderTudo(){
  STATS=calcular(recorte());
  renderCabecalho(); renderGrid(); renderRanks(); renderPadroes(); renderTabela(true);
}

/* ───────────────────────── GERADOR ───────────────────────── */
var GMODE="hot";
function weightedPick(w,k){
  var idx=w.map(function(_,i){return i;}),out=[];
  for(var c=0;c<k&&idx.length;c++){
    var sum=0;for(var i=0;i<idx.length;i++)sum+=w[idx[i]];
    var r=Math.random()*sum,acc=0,ch=idx.length-1;
    for(var q=0;q<idx.length;q++){acc+=w[idx[q]];if(r<=acc){ch=q;break;}}
    out.push(idx[ch]);idx.splice(ch,1);
  }
  return out;
}
function pesos(vals,modo){
  var mx=Math.max.apply(null,vals)||1, mn=Math.min.apply(null,vals);
  return vals.map(function(v){ if(modo==="hot") return Math.pow((v-mn)/(mx-mn||1),2)+.02; if(modo==="cold") return Math.pow((mx-v)/(mx-mn||1),2)+.02; return 1; });
}
function gerar(){
  var s=STATS; if(!s) return;
  var picks=[], desc, trevos=[];
  if(J.colunas){
    for(var c=0;c<7;c++){ var w=GMODE==="late"?pesos(s.colsAtraso[c],"hot"):pesos(s.cols[c],GMODE==="mix"?"rnd":GMODE); picks.push(weightedPick(w,1)[0]); }
    $("g-balls").innerHTML=picks.map(function(x,i){return '<div class="sp-ball" style="background:'+cor+';animation-delay:'+(i*.04)+'s" title="Coluna '+(i+1)+'">'+x+'</div>';}).join("");
    desc=picks.map(function(x,i){return "Col"+(i+1)+": "+x;}).join(" | ");
  } else {
    var base;
    if(GMODE==="hot"||GMODE==="cold") base=pesos(s.freq,GMODE);
    else if(GMODE==="late") base=pesos(s.atraso,"hot");
    else if(GMODE==="mix"){
      var ord=s.freq.map(function(f,i){return {i:i,f:f};}).sort(function(a,b){return b.f-a.f;});
      var metade=Math.ceil(J.pick/2), quentes=ord.slice(0,Math.max(J.pick,Math.floor(N/3))).map(function(o){return o.i;}), s1=[];
      while(s1.length<metade&&quentes.length) s1.push(quentes.splice(Math.floor(Math.random()*quentes.length),1)[0]);
      var resto=[]; for(var q=0;q<N;q++) if(s1.indexOf(q)<0) resto.push(q);
      while(s1.length<J.pick&&resto.length) s1.push(resto.splice(Math.floor(Math.random()*resto.length),1)[0]);
      picks=s1;
    } else { base=[]; for(var z=0;z<N;z++) base.push(1); }
    if(!picks.length) picks=weightedPick(base,J.pick);
    picks=picks.map(function(i){return i+J.min;}).sort(function(a,b){return a-b;});
    $("g-balls").innerHTML=picks.map(function(x,i){return '<div class="sp-ball" style="background:'+cor+';animation-delay:'+(i*.04)+'s">'+pad(x)+'</div>';}).join("");
    if(J.trevos){ trevos=weightedPick(pesos(s.trevos,GMODE==="cold"?"cold":(GMODE==="hot"?"hot":"rnd")),2).map(function(i){return i+1;}).sort(); $("g-trevos").innerHTML=trevos.map(function(x){return '<div class="sp-trevo">🍀'+x+'</div>';}).join(""); }
    desc=picks.map(pad).join(", ")+(trevos.length?"\n🍀 Trevos: "+trevos.join(" e "):"");
  }
  var mt={hot:"números mais sorteados",cold:"números menos sorteados",late:"números mais atrasados",mix:"jogo equilibrado",rnd:"totalmente aleatório"}[GMODE];
  $("g-hint").textContent=J.nome+" · baseado em "+COLI.fmtInt(s.total)+" concursos · "+mt;
  var wa=$("g-wa"); wa.href=COLI.waURL("Olá! Gerei um jogo da "+J.nome+" no site da "+(CFG.nome||"Coli Loterias")+":\n\n🎲 "+desc+"\n\nQuero jogar esse jogo!"); wa.classList.add("show");
}

/* ───────────────────────── CSV ───────────────────────── */
function baixarCSV(){
  var linhas=["concurso;data;"+(J.colunas?"col1;col2;col3;col4;col5;col6;col7":"dezenas")+(J.dupla?";segundo_sorteio":"")+(J.trevos?";trevos":"")+(J.time?";time_do_coracao":"")];
  HIST.forEach(function(r){
    var l=r[0]+";"+r[1]+";"+(J.colunas?r[2].join(";"):r[2].map(pad).join(" "));
    if(J.dupla) l+=";"+(r[3]||[]).map(pad).join(" "); if(J.trevos) l+=";"+(r[3]||[]).join(" "); if(J.time) l+=";"+String(r[3]||"").replace(/;/g,",");
    linhas.push(l);
  });
  var blob=new Blob(["﻿"+linhas.join("\r\n")],{type:"text/csv;charset=utf-8"});
  var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="coli-"+ID+"-todos-os-concursos.csv"; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
}

/* ───────────────────────── ATUALIZAÇÃO AUTOMÁTICA ───────────────────────── */
function verificarNovos(){
  COLI.api.ultimo(ID).then(function(n){
    if(!n) return;
    var ult=HIST.length?HIST[HIST.length-1][0]:0;
    if(n.numero>ult){
      var faltam=[]; for(var k=ult+1;k<n.numero&&faltam.length<60;k++) faltam.push(k);
      var seq=Promise.resolve();
      faltam.forEach(function(num){ seq=seq.then(function(){ return COLI.api.concurso(ID,num).then(function(c){ var r=c&&COLI.rowFromNorm(ID,c); if(r&&r[2].length) HIST.push(r); }); }); });
      seq.then(function(){
        var r=COLI.rowFromNorm(ID,n); if(r&&r[2].length) HIST.push(r);
        HIST.sort(function(a,b){return a[0]-b[0];});
        LIVE=n; renderTudo(); status("Novo sorteio! Concurso "+n.numero+" adicionado às "+hora());
      });
    } else if(n.numero===ult && (!LIVE || LIVE.numero<n.numero || (n.premioProx&&!LIVE.premioProx))){ LIVE=n; renderCabecalho(); }
  });
}
function hora(){ var d=new Date(); return COLI.pad2(d.getHours())+":"+COLI.pad2(d.getMinutes()); }
function status(t,tipo){ COLI.ui.statusBar($("status"),tipo||"",t); }

/* ───────────────────────── LOTECA ───────────────────────── */
function iniciarLoteca(){
  $("st-conteudo").hidden=true; $("st-loteca").hidden=false; $("kpis").hidden=true;
  COLI.api.ultimo(ID).then(function(n){
    if(!n){ $("loteca-body").innerHTML='<div class="empty">Não foi possível carregar o resultado agora.</div>'; status("Sem conexão com a CAIXA","warn"); return; }
    LIVE=n;
    $("l-num").textContent="Concurso "+n.numero+(n.data?" · "+n.data:"");
    var h=COLI.ui.htmlResultado(J,n,{rateio:false}).replace(/class="rm-extra"/g,'class="rc-extra"').replace(/class="rm-st"/g,'class="rc-status" style="color:'+J.c1+'"');
    $("l-body").innerHTML=h;
    var proxData=n.proxData?COLI.parseData(n.proxData,J.hora):null; if(!proxData||proxData<new Date()) proxData=COLI.proxSorteio(ID);
    $("l-next").innerHTML='<span>Próximo: concurso <b>'+(n.proxNum||n.numero+1)+'</b>'+(proxData?' · '+COLI.fmtData(proxData):'')+'</span>'+(n.premioProx>0?'<span>Prêmio estimado <b style="color:'+J.c1+'">'+COLI.fmtMoedaCompacta(n.premioProx)+'</b></span>':'');
    $("loteca-body").innerHTML='<p style="font-weight:800;color:#5b6572;margin-bottom:10px">Concurso '+n.numero+(n.data?" · apuração em "+n.data:"")+'</p>'+COLI.ui.htmlResultado(J,n,{rateioCls:"rc-rateio"}).replace(/class="rm-extra"/g,'class="rc-extra"').replace(/class="rm-st"/g,'class="rc-status" style="color:'+J.c1+'"');
    status("Atualizado com a "+COLI.nomeFonte(n.fonte)+" às "+hora());
  });
  $("btn-modal") && ($("btn-modal").onclick=function(){ COLI.ui.modalResultado(ID,LIVE); });
}

/* ───────────────────────── INÍCIO ───────────────────────── */
document.addEventListener("DOMContentLoaded",function(){
  if(J.loteca){ iniciarLoteca(); setInterval(iniciarLoteca, Math.max(1,(+CFG.atualizarCadaMin||5))*60*1000); return; }
  if(J.dupla) $("sorteio-seg").hidden=false;
  $("periodo").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; this.querySelectorAll("button").forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); PER=+b.getAttribute("data-n"); renderTudo(); });
  $("sorteio-seg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; this.querySelectorAll("button").forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); SORTEIO=b.getAttribute("data-s"); renderTudo(); });
  $("ord-seg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; this.querySelectorAll("button").forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); ORD=b.getAttribute("data-o"); renderGrid(); });
  document.querySelector(".tbl-tools .seg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; this.querySelectorAll("button").forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); DIR=b.getAttribute("data-d"); renderTabela(true); });
  var tmr; $("busca").addEventListener("input",function(){ clearTimeout(tmr); var v=this.value; tmr=setTimeout(function(){ BUSCA=v; renderTabela(true); },200); });
  $("btn-mais").addEventListener("click",function(){ MOSTRA+=100; renderTabela(false); });
  $("btn-csv").addEventListener("click",baixarCSV);
  $("btn-modal").addEventListener("click",function(){ COLI.ui.modalResultado(ID,LIVE); });
  $("g-modes").addEventListener("click",function(e){ var b=e.target.closest(".sp-mode"); if(!b) return; this.querySelectorAll(".sp-mode").forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); GMODE=b.getAttribute("data-m"); gerar(); });
  $("g-gen").addEventListener("click",gerar); $("g-again").addEventListener("click",gerar);

  status("Carregando histórico completo…","wait");
  COLI.api.historico(ID,function(msg){ status(msg,"wait"); }).then(function(base){
    if(!base||!base.concursos||!base.concursos.length){ status("Não foi possível carregar o histórico agora. Tente novamente em instantes.","warn"); $("tbl-body").innerHTML='<tr><td colspan="6" class="empty">Histórico indisponível.</td></tr>'; return; }
    HIST=base.concursos.filter(function(r){return r&&r[2]&&r[2].length;});
    LIVE=(base.ultimoAoVivo&&typeof base.ultimoAoVivo==="object")?base.ultimoAoVivo:null;
    renderTudo();
    var ult=HIST[HIST.length-1][0];
    if(LIVE&&LIVE.numero>ult) status("Histórico até o concurso "+ult+" · novo concurso "+LIVE.numero+" sendo incorporado…","warn");
    else if(LIVE) status(COLI.fmtInt(HIST.length)+" concursos, do 1º ao "+ult+" · conferido com a "+COLI.nomeFonte(LIVE.fonte)+" às "+hora());
    else status(COLI.fmtInt(HIST.length)+" concursos, do 1º ao "+ult+" · sem conexão com a CAIXA agora","warn");
    if(!LIVE) verificarNovos();
    setInterval(verificarNovos, Math.max(1,(+CFG.atualizarCadaMin||5))*60*1000);
    document.addEventListener("visibilitychange",function(){ if(!document.hidden) verificarNovos(); });
  });
});
})();
