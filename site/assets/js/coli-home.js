/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — PÁGINA INICIAL
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var CFG=window.COLI_CONFIG||{}, J=COLI.JOGOS, $=function(id){return document.getElementById(id);};
var LIVE={};        /* id → norm (último resultado ao vivo) */
var RESUMO=null;    /* data/resumo.json */

/* ───────── PILLS ───────── */
function buildPills(){
  $("pills").innerHTML=J.map(function(j){
    return '<a class="pill" style="background:linear-gradient(135deg,'+j.c1+','+j.c2+')" href="estatisticas-'+j.id+'.html">'
      +'<span class="pi">'+j.emo+'</span><span class="pt"><b>'+COLI.esc(j.nome)+'</b><span id="pv-'+j.id+'">Estatísticas ›</span></span></a>';
  }).join("");
}

/* ───────── LINHAS DE CONCURSOS ───────── */
function buildRows(){
  $("crows").innerHTML=J.map(function(j){
    var prox=COLI.proxSorteio(j.id);
    return '<div class="crow" id="row-'+j.id+'">'
      +'<button class="ctag" type="button" style="background:'+j.c1+'" data-modal="'+j.id+'" title="Ver último resultado"><span class="cico">'+j.emo+'</span><b>'+COLI.esc(j.nome)+'</b></button>'
      +'<div class="ccol"><div class="l">Próximo concurso</div><div class="v" id="rn-'+j.id+'"><span class="skel">0000</span></div></div>'
      +'<div class="ccol"><div class="l">Data do sorteio</div><div class="v" id="rd-'+j.id+'">'+(prox?COLI.fmtDataCurta(prox)+'<span class="sx">'+COLI.DSN[prox.getDay()]+'</span>':"—")+'</div></div>'
      +'<div class="ccol pz"><div class="l">Prêmio estimado</div><div class="v" id="rp-'+j.id+'" style="color:'+j.c1+'"><span class="skel">R$ 00 milhões</span></div></div>'
      +'<div class="cacts"><button class="btn btn-line sm" type="button" data-modal="'+j.id+'" style="border-color:'+j.c1+';color:'+j.c1+'">Último resultado</button>'
      +'<a class="b-st" style="background:'+j.c1+'" href="estatisticas-'+j.id+'.html" title="Estatísticas da '+COLI.esc(j.nome)+'" aria-label="Estatísticas">'+COLI.SVG.chart+'</a></div>'
      +'</div>';
  }).join("");
}
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-modal]"); if(!b) return;
  var id=b.getAttribute("data-modal"); COLI.ui.modalResultado(id, LIVE[id]||resumoNorm(id));
});
function resumoNorm(id){
  if(!RESUMO||!RESUMO.jogos||!RESUMO.jogos[id]||!RESUMO.jogos[id].ultimo) return null;
  return COLI.normFromRow(id, RESUMO.jogos[id].ultimo);
}

/* aplica dados (ao vivo ou do resumo) numa linha */
function aplicarLinha(j, n){
  var rn=$("rn-"+j.id), rd=$("rd-"+j.id), rp=$("rp-"+j.id), pv=$("pv-"+j.id);
  var proxNum = n.proxNum || (n.numero?n.numero+1:null);
  var proxData = n.proxData ? COLI.parseData(n.proxData, j.hora) : null;
  if(!proxData || proxData<new Date()) proxData=COLI.proxSorteio(j.id);
  if(rn && proxNum) rn.textContent=proxNum;
  if(rd && proxData) rd.innerHTML=COLI.fmtDataCurta(proxData)+'<span class="sx">'+COLI.DSN[proxData.getDay()]+'</span>';
  var premio = n.premioProx>0 ? COLI.fmtMoedaCompacta(n.premioProx,true) : null;
  if(rp){ if(premio) rp.textContent=premio; else if(j.loteca) rp.innerHTML='<span style="font-size:.8rem">Veja no site da CAIXA</span>'; else rp.innerHTML='<span style="font-size:.8rem;color:#8b94a3">Aguardando a CAIXA</span>'; }
  if(pv){ pv.textContent = n.premioProx>0 ? COLI.fmtMoedaCompacta(n.premioProx) : (n.numero?"Último: concurso "+n.numero:"Estatísticas ›"); }
}

/* ───────── ATUALIZAÇÃO AO VIVO ───────── */
var atualizando=false;
function atualizar(){
  if(atualizando) return; atualizando=true;
  COLI.ui.statusBar($("status"),"wait","Consultando a CAIXA…");
  COLI.api.ultimos().then(function(map){
    var ok=0, fontes={};
    J.forEach(function(j){
      var n=map&&map[j.id]; if(!n) return;
      LIVE[j.id]=n; ok++; fontes[n.fonte]=(fontes[n.fonte]||0)+1;
      aplicarLinha(j,n);
    });
    var ag=new Date(), hh=COLI.pad2(ag.getHours())+":"+COLI.pad2(ag.getMinutes());
    if(ok===J.length && fontes.caixa) COLI.ui.statusBar($("status"),"","Atualizado com a CAIXA às "+hh);
    else if(ok>0) COLI.ui.statusBar($("status"),fontes.base&&!fontes.caixa&&!fontes.publica?"warn":"", "Atualizado às "+hh+" · "+ok+"/"+J.length+" loterias"+(fontes.base?" · prêmios indisponíveis na fonte de reserva":""));
    else COLI.ui.statusBar($("status"),"warn","Sem conexão com a CAIXA agora — exibindo dados salvos");
    renderHero(true);
    atualizando=false;
  }).catch(function(){ COLI.ui.statusBar($("status"),"warn","Sem conexão com a CAIXA agora — exibindo dados salvos"); atualizando=false; });
}

/* ───────── HERO ROTATIVO + CONTAGEM ───────── */
var heroIdx=0, heroTimer=null, heroPause=false, CD_TARGET=null;
function tick(){
  if(!CD_TARGET) return;
  var t=CD_TARGET-new Date(); if(t<0){ t=0; }
  var d=Math.floor(t/864e5),h=Math.floor(t%864e5/36e5),m=Math.floor(t%36e5/6e4),s=Math.floor(t%6e4/1e3);
  $("cd-d").textContent=COLI.pad2(d);$("cd-h").textContent=COLI.pad2(h);$("cd-m").textContent=COLI.pad2(m);$("cd-s").textContent=COLI.pad2(s);
}
setInterval(tick,1000);
function renderHero(semFade){
  var j=J[heroIdx]; if(!j) return;
  var n=LIVE[j.id]||null;
  var wrap=$("hero-fade"); if(!semFade&&wrap) wrap.style.opacity="0";
  setTimeout(function(){
    var hero=$("hero");
    hero.style.setProperty("--hb1",j.c1); hero.style.setProperty("--hb2",j.c2); hero.style.setProperty("--hc",j.c1==="#1E2C6B"?"#8fa2ff":j.c1);
    hero.style.setProperty("--glow",hexA(j.c1,.22));
    $("h-emoji").textContent=j.emo; $("h-nome").textContent=j.nome.toUpperCase(); $("h-nome").style.color=luz(j.c1);
    var p=n?n.premioProx:0, pv;
    if(p>=1e9) pv='<small>R$ </small>'+(p/1e9).toLocaleString("pt-BR",{maximumFractionDigits:1})+' <small>'+(p>=2e9?'BILHÕES':'BILHÃO')+'</small>';
    else if(p>=1e6) pv='<small>R$ </small>'+(p/1e6).toLocaleString("pt-BR",{maximumFractionDigits:1})+' <small>'+(p>=2e6?'MILHÕES':'MILHÃO')+'</small>';
    else if(p>0) pv='<small>R$ </small>'+Math.round(p/1e3).toLocaleString("pt-BR")+' <small>MIL</small>';
    else pv=j.loteca?'<small style="font-size:1.6rem">14 jogos da rodada</small>':'<small style="font-size:1.6rem">'+(n?'Prêmio a divulgar':'Consultando…')+'</small>';
    $("h-prize").innerHTML=pv;
    $("h-lbl").textContent=(n&&n.acumulou&&p>0)?"Prêmio acumulado":"Prêmio estimado";
    var proxNum=n?(n.proxNum||n.numero+1):null;
    var ult=n||resumoNorm(j.id);
    $("h-conc").innerHTML=(proxNum?'Concurso <b>'+proxNum+'</b>':'&nbsp;')+(ult&&ult.dezenas&&ult.dezenas.length?' · último ('+ult.numero+'): <b>'+ult.dezenas.join(" ")+'</b>':'');
    $("h-link").href="estatisticas-"+j.id+".html";
    $("h-ver").setAttribute("data-modal",j.id);
    var alvo=n&&n.proxData?COLI.parseData(n.proxData,j.hora):null;
    if(!alvo||alvo<=new Date()) alvo=COLI.proxSorteio(j.id);
    if(alvo){ $("cd-date").textContent=COLI.fmtDataCurta(alvo); $("cd-day").textContent=COLI.DFULL[alvo.getDay()]+" · "+COLI.pad2(alvo.getHours())+"h"; CD_TARGET=alvo; tick(); }
    drawDots();
    if(wrap) wrap.style.opacity="1";
  }, semFade?0:150);
}
function hexA(hex,a){ var h=hex.replace("#",""); if(h.length===3) h=h.split("").map(function(c){return c+c;}).join(""); var n=parseInt(h,16); return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"; }
function luz(hex){ /* versão clara da cor para o texto sobre fundo escuro */
  var h=hex.replace("#",""); var n=parseInt(h,16), r=n>>16&255,g=n>>8&255,b=n&255;
  var f=function(c){ return Math.round(c+(255-c)*.55); }; return "rgb("+f(r)+","+f(g)+","+f(b)+")";
}
function drawDots(){
  $("hero-dots").innerHTML=J.map(function(j,i){
    return '<button class="hdot'+(i===heroIdx?" on":"")+'" type="button" role="tab" aria-selected="'+(i===heroIdx)+'" title="'+COLI.esc(j.nome)+'" data-hero="'+i+'"'+(i===heroIdx?' style="background:'+luz(j.c1)+'"':'')+'></button>';
  }).join("");
}
$("hero-dots").addEventListener("click",function(e){ var b=e.target.closest("[data-hero]"); if(!b) return; heroIdx=+b.getAttribute("data-hero"); renderHero(); restartHero(); });
function restartHero(){ if(heroTimer) clearInterval(heroTimer); heroTimer=setInterval(function(){ if(heroPause) return; heroIdx=(heroIdx+1)%J.length; renderHero(); },4000); }
$("hero").addEventListener("mouseenter",function(){heroPause=true;}); $("hero").addEventListener("mouseleave",function(){heroPause=false;});

/* ───────── NÚMEROS EM DESTAQUE (sidebar) ───────── */
function renderDestaques(id){
  var j=COLI.byId(id), r=RESUMO&&RESUMO.jogos&&RESUMO.jogos[id]; if(!j||!r||!r.freq) return;
  var idx=r.freq.map(function(f,i){return i;});
  var hot=idx.slice().sort(function(a,b){return r.freq[b]-r.freq[a];}).slice(0,2);
  var late=(r.atraso||[]).map(function(a,i){return i;}).sort(function(a,b){return r.atraso[b]-r.atraso[a];}).slice(0,2);
  var pad=function(i){ return j.colunas?String(i+j.min):COLI.pad2(i+j.min); };
  $("dest-sub").textContent=j.nome+" · "+COLI.fmtInt(r.total)+" concursos analisados";
  $("dest-grid").innerHTML=hot.map(function(i){ return '<div class="dest hot"><div class="dn" style="background:'+j.c1+'">'+pad(i)+'</div><div class="dl"><b>Mais sorteado</b><span>Saiu '+COLI.fmtInt(r.freq[i])+' vezes</span></div></div>'; }).join("")
    +late.map(function(i){ return '<div class="dest cold"><div class="dn" style="background:#5b6572">'+pad(i)+'</div><div class="dl"><b>Mais atrasado</b><span>Há '+COLI.fmtInt(r.atraso[i])+' concursos</span></div></div>'; }).join("");
  $("dest-link").href="estatisticas-"+id+".html";
}

/* ───────── SURPRESINHA ───────── */
var SP_MODE="hot";
var SP_JOGOS=J.filter(function(j){return !j.loteca;});
$("sp-game").innerHTML=SP_JOGOS.map(function(j){ return '<option value="'+j.id+'"'+(j.id==="megasena"?" selected":"")+'>'+j.emo+' '+COLI.esc(j.nome)+' — '+(j.colunas?"1 dígito por coluna":j.pick+" números")+'</option>'; }).join("");
$("sp-modes").addEventListener("click",function(e){ var b=e.target.closest(".sp-mode"); if(!b) return; document.querySelectorAll(".sp-mode").forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); SP_MODE=b.getAttribute("data-m"); gerar(); });
$("sp-gen").addEventListener("click",gerar); $("sp-again").addEventListener("click",gerar); $("sp-game").addEventListener("change",gerar);

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
function pesos(vals, modo){
  var mx=Math.max.apply(null,vals)||1, mn=Math.min.apply(null,vals);
  return vals.map(function(v){
    if(modo==="hot")  return Math.pow((v-mn)/(mx-mn||1),2)+.02;
    if(modo==="cold") return Math.pow((mx-v)/(mx-mn||1),2)+.02;
    return 1;
  });
}
function gerar(){
  var id=$("sp-game").value, j=COLI.byId(id); if(!j) return;
  var r=RESUMO&&RESUMO.jogos&&RESUMO.jogos[id];
  var picks=[], desc;
  var modo=SP_MODE; if(!r && modo!=="rnd"){ modo="rnd"; }
  if(j.colunas){
    for(var c=0;c<7;c++){
      var col=(r&&r.cols&&r.cols[c])||[1,1,1,1,1,1,1,1,1,1];
      var w = modo==="late" ? pesos((r&&r.colsAtraso&&r.colsAtraso[c])||col,"hot") : pesos(col, modo==="mix"?"rnd":modo);
      picks.push(weightedPick(w,1)[0]);
    }
    $("sp-balls").innerHTML=picks.map(function(x,i){ return '<div class="sp-ball" style="background:'+j.c1+';animation-delay:'+(i*.04)+'s" title="Coluna '+(i+1)+'">'+x+'</div>'; }).join("");
    $("sp-trevos").innerHTML="";
    desc=picks.map(function(x,i){return "Col"+(i+1)+": "+x;}).join(" | ");
  } else {
    var n=j.max-j.min+1, base;
    if(modo==="hot"||modo==="cold") base=pesos(r.freq,modo);
    else if(modo==="late") base=pesos(r.atraso,"hot");
    else if(modo==="mix"){
      var ord=r.freq.map(function(f,i){return {i:i,f:f};}).sort(function(a,b){return b.f-a.f;});
      var metade=Math.ceil(j.pick/2), quentes=ord.slice(0,Math.max(j.pick,Math.floor(n/3))).map(function(o){return o.i;});
      var s1=[]; while(s1.length<metade&&quentes.length) s1.push(quentes.splice(Math.floor(Math.random()*quentes.length),1)[0]);
      var resto=[]; for(var q=0;q<n;q++) if(s1.indexOf(q)<0) resto.push(q);
      while(s1.length<j.pick&&resto.length) s1.push(resto.splice(Math.floor(Math.random()*resto.length),1)[0]);
      picks=s1;
    } else { base=[]; for(var z=0;z<n;z++) base.push(1); }
    if(!picks.length) picks=weightedPick(base,j.pick);
    picks=picks.map(function(i){return i+j.min;}).sort(function(a,b){return a-b;});
    var pad=function(x){ return COLI.pad2(x); };
    $("sp-balls").innerHTML=picks.map(function(x,i){ return '<div class="sp-ball" style="background:'+j.c1+';animation-delay:'+(i*.04)+'s">'+pad(x)+'</div>'; }).join("");
    var trevos=[];
    if(j.trevos){
      var tw=(r&&r.trevos&&r.trevos.length===6)?pesos(r.trevos,modo==="cold"?"cold":(modo==="hot"?"hot":"rnd")):[1,1,1,1,1,1];
      trevos=weightedPick(tw,2).map(function(i){return i+1;}).sort();
      $("sp-trevos").innerHTML=trevos.map(function(x){return '<div class="sp-trevo">🍀'+x+'</div>';}).join("");
    } else $("sp-trevos").innerHTML="";
    desc=picks.map(pad).join(", ")+(trevos.length?"\n🍀 Trevos: "+trevos.join(" e "):"");
  }
  var mt={hot:"números mais sorteados",cold:"números menos sorteados",late:"números mais atrasados",mix:"jogo equilibrado",rnd:"totalmente aleatório"}[modo];
  $("sp-hint").textContent=j.nome+" · "+(r?"baseado em "+COLI.fmtInt(r.total)+" concursos · ":"")+mt+(SP_MODE!==modo?" (estatísticas indisponíveis agora)":"");
  var msg="Olá! Gerei um jogo da "+j.nome+" no site da "+(CFG.nome||"Coli Loterias")+":\n\n🎲 "+desc+"\n\nQuero jogar esse jogo!";
  var wa=$("sp-wa"); wa.href=COLI.waURL(msg); wa.classList.add("show");
}

/* ───────── INÍCIO ───────── */
document.addEventListener("DOMContentLoaded",function(){
  $("side-bolao").href=CFG.bolaoUrl||"#";
  buildPills(); buildRows(); renderHero(true); restartHero();
  COLI.api.resumo().then(function(r){
    RESUMO=r;
    if(r&&r.jogos){
      J.forEach(function(j){ if(!LIVE[j.id]&&r.jogos[j.id]&&r.jogos[j.id].ultimo){ var n=COLI.normFromRow(j.id,r.jogos[j.id].ultimo); n.premioProx=0; aplicarLinha(j,n); } });
      renderDestaques("megasena");
      var di=0, ids=J.filter(function(j){return r.jogos[j.id]&&r.jogos[j.id].freq;}).map(function(j){return j.id;});
      setInterval(function(){ di=(di+1)%ids.length; renderDestaques(ids[di]); }, 9000);
    }
  });
  atualizar();
  setInterval(atualizar, Math.max(1,(+CFG.atualizarCadaMin||5))*60*1000);
  /* ao voltar para a aba, confere se saiu resultado novo */
  document.addEventListener("visibilitychange",function(){ if(!document.hidden) atualizar(); });
});
})();
