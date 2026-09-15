/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — PÁGINA DE RESULTADOS
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var CFG=window.COLI_CONFIG||{}, J=COLI.JOGOS, $=function(id){return document.getElementById(id);};
var EST={};   /* id → norm exibido */

function cardHTML(j){
  var n=EST[j.id], K=COLI.cor(j);
  var hd='<div class="rc-hd" style="background:linear-gradient(135deg,'+j.c1+','+j.c2+');color:'+K.fg+'"><span class="ic">'+j.emo+'</span><span class="nm">'+COLI.esc(j.nome)+'</span><span class="cc">'+(n?"Concurso "+n.numero:"…")+'</span></div>';
  var bd, ft;
  if(!n){
    bd='<div class="rc-bd"><div class="rc-dt"><span class="skel">Sorteio de 00/00/0000</span></div><div class="rc-balls">'+'<span class="skel" style="width:100%;height:42px;display:block">&nbsp;</span>'+'</div></div>';
    ft='<div class="rc-ft"><div class="rc-next">Próximo concurso</div><div class="rc-nv"><span class="skel">R$ 00 milhões</span></div></div>';
  } else {
    var corpo=COLI.ui.htmlResultado(j,n,{bolaCls:"rball",bolaStyle:"background:linear-gradient(145deg,"+j.c1+","+j.c2+");color:"+K.fg,rateioCls:"rc-rateio"});
    corpo=corpo.replace(/class="rm-balls"/g,'class="rc-balls"').replace(/class="rm-lbl"/g,'class="rc-lbl"').replace(/class="rm-extra"/g,'class="rc-extra"').replace(/class="rm-st"/g,'class="rc-status" style="color:'+K.tx+'"');
    bd='<div class="rc-bd"><div class="rc-dt"><span>'+(n.data?"Sorteio de "+n.data+(COLI.diaSemana(n.data)?" ("+COLI.diaSemana(n.data)+")":""):"")+'</span>'+(n.local?'<span>'+COLI.esc(n.local)+'</span>':'')+'</div>'+corpo+'</div>';
    var proxData=n.proxData?COLI.parseData(n.proxData,j.hora):null; if(!proxData||proxData<new Date()) proxData=COLI.proxSorteio(j.id);
    var premio=n.premioProx>0?COLI.fmtMoedaCompacta(n.premioProx):null;
    ft='<div class="rc-ft"><div class="rc-next">Próximo concurso '+(n.proxNum||n.numero+1)+(n.acumulou&&premio?" · acumulado":"")+'</div>'
      +'<div class="rc-nv" style="color:'+K.tx+'">'+(premio||(j.loteca?"14 jogos da rodada":"Prêmio a divulgar"))+'</div>'
      +'<div class="rc-nd">Sorteio em '+(proxData?COLI.fmtData(proxData)+" ("+COLI.DSN[proxData.getDay()]+")":"—")+'</div>'
      +'<div class="rc-links"><a class="rc-bt" style="border-color:'+K.tx+';color:'+K.tx+'" href="estatisticas-'+j.id+'.html">📊 Estatísticas</a>'
      +'<a class="rc-bt" style="border-color:'+j.c1+';background:'+j.c1+';color:'+K.fg+'" href="'+COLI.esc(CFG.bolaoUrl||"#")+'" target="_blank" rel="noopener">🎟️ Bolões</a>'
      +'</div></div>';
  }
  return '<article class="rcard" id="card-'+j.id+'">'+hd+bd+ft+'</article>';
}
function render(){ $("grid").innerHTML=J.map(cardHTML).join(""); }
function renderUm(j){ var el=$("card-"+j.id); if(el) el.outerHTML=cardHTML(j); }

function atualizar(primeira){
  var band=$("band");
  if(!primeira){ band.className="res-band rb-wait"; band.textContent="Verificando novos sorteios…"; }
  COLI.api.ultimos().then(function(map){
    var ok=0, novos=0, fontes={};
    J.forEach(function(j){
      var n=map&&map[j.id]; if(!n) return;
      ok++; fontes[n.fonte]=(fontes[n.fonte]||0)+1;
      if(!EST[j.id]||n.numero>=EST[j.id].numero){ if(EST[j.id]&&n.numero>EST[j.id].numero) novos++; EST[j.id]=n; renderUm(j); }
    });
    var ag=new Date(), hh=COLI.pad2(ag.getHours())+":"+COLI.pad2(ag.getMinutes());
    if(ok===0){ band.className="res-band rb-warn"; band.innerHTML='Não foi possível conectar à CAIXA agora. Confira em <a href="https://loterias.caixa.gov.br" target="_blank" rel="noopener">loterias.caixa.gov.br</a>.'; return; }
    band.className="res-band "+(fontes.caixa||fontes.publica?"rb-ok":"rb-warn");
    band.textContent="✓ "+(novos?novos+" resultado(s) novo(s) · ":"")+"Atualizado às "+hh+" · "+ok+"/"+J.length+" loterias · fonte: "+COLI.nomeFonte(fontes.caixa?"caixa":(fontes.publica?"publica":"base"));
  }).catch(function(){ band.className="res-band rb-warn"; band.textContent="Não foi possível conectar à CAIXA agora."; });
}

document.addEventListener("DOMContentLoaded",function(){
  render();
  /* mostra na hora o que já está no histórico local enquanto a CAIXA responde */
  COLI.api.resumo().then(function(r){
    if(!r||!r.jogos) return;
    J.forEach(function(j){ if(!EST[j.id]&&r.jogos[j.id]&&r.jogos[j.id].ultimo){ EST[j.id]=COLI.normFromRow(j.id,r.jogos[j.id].ultimo); renderUm(j); } });
  });
  atualizar(true);
  setInterval(function(){ atualizar(false); }, Math.max(1,(+CFG.atualizarCadaMin||5))*60*1000);
  document.addEventListener("visibilitychange",function(){ if(!document.hidden) atualizar(false); });
});
})();
