  // ---- Processo do cliente (fase 2 do plano) ----
  // Trilho das 6 etapas no lugar das abas, faixa do próximo passo e a gaveta
  // "Como este cliente roda". A etapa sai das mesmas regras do servidor
  // (supabase/functions/_shared/processo.ts): DNA_MINIMO aprovados, plano em
  // ordem (estratégia, linha, ideias, calendário) e o ciclo do mês.
  var DNA_MINIMO=5;
  var ETAPAS=[["briefing","Briefing","dna"],["entender","Entender","dna"],["planejar","Planejar","strategy"],["produzir","Produzir","approvals"],["publicar","Publicar","calendar"],["medir","Medir","performance"]];
  var PLANEJAR_SUBS=["strategy","editorial","ideas","research","formats"];
  var APROVADA={"APPROVED":1,"SCHEDULED":1,"PUBLISHED":1};
  function etapaDaView(v,atual){if(v==="dna")return atual===1?1:2;if(PLANEJAR_SUBS.indexOf(v)>=0)return 3;return {approvals:4,calendar:5,performance:6}[v]||0;}

  function etapasDe(id){
    var g=(state.client===id?GENERATED:DB_STATE_CACHE[id])||{},c=DB_CLIENTS[id]||{};
    var dna=g.dna||[],aprov=dna.filter(function(x){return x.status==="approved"}).length,pend=dna.length-aprov;
    var temEstr=!!g.strategy,temEdit=(g.editorial||[]).length>0,ideias=(g.ideas||[]).length;
    var todas=(g.calendar&&g.calendar.items)||[],agora=new Date(),mes=fmtD(agora).slice(0,7),hoje=fmtD(agora);
    var pecas=todas.filter(function(i){return String(i.data||"").slice(0,7)===mes});
    var temTexto=function(i){return !!(i.content||i.carousel||i.stories)};
    var aprovadas=pecas.filter(function(i){return APROVADA[i.status]}).length,vencidas=pecas.filter(function(i){return String(i.data)<=hoje});
    var publicadas=vencidas.filter(function(i){return i.status==="PUBLISHED"}).length,pubTotal=pecas.filter(function(i){return i.status==="PUBLISHED"}).length;
    var medidas=pecas.filter(function(i){return i.status==="PUBLISHED"&&i.metrics&&+i.metrics.alcance>0}).length;
    var briefingOk=!!String(c.briefing||"").trim()||dna.length>0;
    var propPend=(typeof PROPOSTAS!=="undefined"?PROPOSTAS:[]).filter(function(p){return p.client_id===id&&p.status==="pendente"}).length;
    var planoFeito=[temEstr,temEdit,ideias>0,todas.length>0];
    var aAprovar=pecas.filter(function(i){return temTexto(i)&&!APROVADA[i.status]}).length,semTexto=pecas.filter(function(i){return !temTexto(i)}).length;
    var et=[
      {n:1,feito:briefingOk?1:0,total:1,falta:briefingOk?null:"O cliente ainda não respondeu o briefing.",quem:briefingOk?null:"cliente"},
      {n:2,feito:Math.min(aprov,DNA_MINIMO),total:DNA_MINIMO,pend:pend,falta:aprov>=DNA_MINIMO?null:pend?pend+" registro"+(pend>1?"s":"")+" do DNA esperando você":"A Íris ainda não leu o briefing",quem:aprov>=DNA_MINIMO?null:pend?"voce":"agente"},
      {n:3,feito:planoFeito.filter(Boolean).length,total:4,propPend:propPend,
        falta:!temEstr?"Falta a estratégia":!temEdit?"Falta a linha editorial":!ideias?"Faltam as ideias":!planoFeito[3]?"Falta distribuir as ideias no calendário":null,
        proximo:!temEstr?"atlas":!temEdit?"bussola":!ideias?"musa":!planoFeito[3]?"cronos":null},
      {n:4,feito:aprovadas,total:pecas.length,aAprovar:aAprovar,semTexto:semTexto,falta:pecas.length&&aprovadas<pecas.length?(aAprovar?aAprovar+" peça"+(aAprovar>1?"s":"")+" para aprovar":semTexto+" peça"+(semTexto>1?"s":"")+" sem texto"):null,quem:aAprovar?"voce":semTexto?"agente":null},
      {n:5,feito:publicadas,total:vencidas.length,falta:vencidas.length>publicadas?(vencidas.length-publicadas)+" peça"+(vencidas.length-publicadas>1?"s":"")+" para marcar como publicada":null,quem:vencidas.length>publicadas?"voce":null},
      {n:6,feito:medidas,total:pubTotal,falta:pubTotal>medidas?(pubTotal-medidas)+" resultado"+(pubTotal-medidas>1?"s":"")+" para registrar":null,quem:pubTotal>medidas?"voce":null}
    ];
    if(et[2].falta)et[2].quem=propPend?"voce":"agente";
    // Conteúdo que já existe (cliente antigo, cópia offline) mantém a etapa acessível mesmo fora de ordem.
    var conteudo=[briefingOk,dna.length>0,planoFeito.some(Boolean),todas.length>0,todas.length>0,todas.length>0];
    et.forEach(function(e,i){e.temConteudo=conteudo[i];});
    var prontas=[briefingOk,aprov>=DNA_MINIMO,!et[2].falta],atual=prontas.indexOf(false)+1;
    et.forEach(function(e){e.estado="bloqueada";});
    if(atual){for(var i=0;i<atual-1;i++)et[i].estado="feita";et[atual-1].estado="atual";}
    else{for(var j=0;j<3;j++)et[j].estado="feita";for(var k=3;k<6;k++)et[k].estado=et[k].falta?"atual":et[k].total?"feita":"livre";
      atual=0;for(var m=3;m<6;m++)if(et[m].estado==="atual"&&!atual)atual=m+1;if(!atual)atual=4;}
    return {atual:atual,etapas:et};
  }

  var QUEM_LBL={voce:["Com você","voce"],cliente:["Com o cliente","cli"],agente:["Com o agente","ag"]};
  function trilhoHtml(id,v){
    var r=etapasDe(id),vendo=etapaDaView(v,r.atual),op=typeof opDo==="function"?opDo(id):{agentes:{}};
    var manual=function(n){if(op.pausado)return n>=2;return (n===3&&op.agentes&&op.agentes.pulso==="manual")||(n===4&&op.agentes&&op.agentes.estudio==="manual");};
    return '<nav class="trilho" aria-label="Etapas do cliente">'+ETAPAS.map(function(t,i){var e=r.etapas[i],n=i+1,st=e.estado;
      var marca=st==="feita"?'<span class="tr-marca feita">'+iconeUI("check-filled")+'</span>':st==="atual"?'<span class="tr-marca atual"></span>':'<span class="tr-marca bloq"></span>';
      var txt=st==="feita"?"Feita":st==="bloqueada"?"Bloqueada até a etapa anterior":st==="livre"?"Nada neste mês ainda":(e.falta||"");
      var pct=e.total?Math.round(Math.min(e.feito,e.total)/e.total*100):(st==="feita"?100:0);
      return '<button class="tr-et '+st+(vendo===n?' vendo':'')+'" data-tab-ir="'+t[2]+'" data-etapa="'+n+'"'+(st==="bloqueada"&&!e.temConteudo?' aria-disabled="true"':'')+(vendo===n?' aria-current="step"':'')+'>'+
        '<span class="tr-topo">'+marca+'<span class="tr-num">'+n+'</span><span class="tr-nome">'+t[1]+'</span></span>'+
        '<span class="tr-estado">'+esc(txt)+'</span><span class="tr-barra"><i style="width:'+pct+'%"></i></span>'+
        '<span class="tr-pe"><span>'+(e.total?e.feito+' de '+e.total:'')+'</span>'+(manual(n)?'<span class="chip warn">'+(op.pausado?'Pausado':'Manual')+'</span>':'')+'</span></button>';}).join('')+'</nav>';
  }
  function proximoPasso(id){
    var r=etapasDe(id),e=r.etapas[r.atual-1],op=typeof opDo==="function"?opDo(id):{},nome=clientName(id),srv=!!SB;
    var AG_NOME={atlas:"o Átlas",bussola:"a Bússola",musa:"a Musa",cronos:"o Cronos"},O_QUE={atlas:"a estratégia",bussola:"a linha editorial",musa:"as ideias",cronos:"o calendário"},VIEW={atlas:"strategy",bussola:"editorial",musa:"ideas",cronos:"calendar"};
    if(op.pausado)return {rot:"Cliente pausado",tit:"Nenhum agente roda sozinho para "+nome,apoio:"O que já foi aprovado continua no calendário.",quem:null,pri:["Reativar","reativar"]};
    if(r.atual===1)return {rot:"Próximo passo",tit:"Receber o briefing de "+nome,apoio:"Mande o link: o cliente responde no celular e as respostas chegam aqui.",quem:"cliente",pri:srv?["Mandar link de briefing","link"]:["Formulário de briefing","form"],sec:["Preencher aqui","preencher"]};
    if(r.atual===2)return e.pend?{rot:"Próximo passo",tit:"Aprove o Content DNA de "+nome,apoio:e.pend+" registro"+(e.pend>1?"s":"")+" esperando você. Com "+DNA_MINIMO+" aprovados, o planejamento começa sozinho.",quem:"voce",pri:["Revisar e aprovar","dna"],sec:["Analisar de novo com a Íris","iris"]}
      :{rot:"Próximo passo",tit:"A Íris lê o briefing de "+nome,apoio:"Ela sugere os registros do Content DNA para você aprovar.",quem:"agente",pri:["Analisar com a Íris","iris"]};
    if(r.atual===3){
      if(e.propPend)return {rot:"Próximo passo",tit:"Uma proposta de "+nome+" espera a sua aprovação",apoio:"Aprovando, a próxima parte do plano vem em seguida.",quem:"voce",pri:["Revisar a proposta","propostas"]};
      var ag=e.proximo;
      return srv?{rot:"Em andamento",tit:"Falta "+O_QUE[ag]+" de "+nome,apoio:"Quem faz é "+AG_NOME[ag]+", pela agenda ou pela cadeia do plano. Se não quiser esperar, peça agora.",quem:"agente",pri:["Pedir agora","rodar:"+ag],sec:["Abrir "+O_QUE[ag],"ir:"+VIEW[ag]]}
        :{rot:"Próximo passo",tit:"Montar "+O_QUE[ag]+" de "+nome,apoio:"Na cópia offline, a geração é pelo botão da própria tela.",quem:"voce",pri:["Abrir "+O_QUE[ag],"ir:"+VIEW[ag]]};
    }
    if(r.atual===4&&e.aAprovar)return {rot:"Próximo passo",tit:e.aAprovar+" peça"+(e.aAprovar>1?"s":"")+" de "+nome+" para aprovar",apoio:"Revise o texto e aprove, ou peça ajuste.",quem:"voce",pri:["Revisar as peças","ir:approvals"]};
    if(r.atual===4&&e.semTexto)return {rot:"Em andamento",tit:e.semTexto+" peça"+(e.semTexto>1?"s":"")+" do mês ainda sem texto",apoio:"O Estúdio escreve com antecedência, pela agenda.",quem:"agente",pri:srv?["Pedir ao Estúdio agora","rodar:estudio"]:["Abrir o calendário","ir:calendar"],sec:srv?["Abrir o calendário","ir:calendar"]:null};
    if(r.atual===5)return {rot:"Próximo passo",tit:e.falta.charAt(0).toUpperCase()+e.falta.slice(1),apoio:"Marque no calendário o que já foi ao ar.",quem:"voce",pri:["Abrir o calendário","ir:calendar"]};
    if(r.atual===6&&r.etapas[5].falta)return {rot:"Próximo passo",tit:r.etapas[5].falta.charAt(0).toUpperCase()+r.etapas[5].falta.slice(1),apoio:"Os números reais alimentam o planejamento do mês seguinte.",quem:"voce",pri:["Registrar resultados","ir:performance"]};
    return {rot:"Em dia",tit:"Nada esperando você em "+nome,apoio:op.agentes&&op.agentes.pulso==="manual"?"O planejamento mensal está manual: peça quando quiser.":"O próximo planejamento começa no dia "+(op.diaPlanejamento||20)+".",quem:null,pri:null,sec:["Abrir o calendário","ir:calendar"]};
  }
  function faixaHtml(id){
    var x=proximoPasso(id),q=x.quem&&QUEM_LBL[x.quem];
    return '<section class="prox-passo" aria-live="polite"><div class="pp-txt"><span class="pp-rot">'+esc(x.rot)+'</span><b>'+esc(x.tit)+'</b><span>'+esc(x.apoio)+'</span></div>'+
      (q?'<span class="chip quem-'+q[1]+'">'+q[0]+'</span>':'')+
      '<div class="pp-acoes">'+(x.sec?'<button class="btn lil" data-passo="'+x.sec[1]+'">'+esc(x.sec[0])+'</button>':'')+(x.pri?'<button class="btn pri" data-passo="'+x.pri[1]+'">'+esc(x.pri[0])+'</button>':'')+'</div><span class="pp-msg" id="ppMsg"></span></section>';
  }
  async function fazerPasso(acao,bt){
    var id=state.client,m=I("#ppMsg");
    if(acao==="link"){abrirNovoLink();return;}
    if(acao==="form"){openBriefFormModal(clientName(id));return;}
    if(acao==="preencher"){go("dna");setTimeout(function(){var t=I("#dnaBriefing");if(t){t.scrollIntoView({behavior:"smooth",block:"center"});t.focus();}},80);return;}
    if(acao==="dna"){go("dna");setTimeout(function(){var q=I("#dnaQuadro");if(q)q.scrollIntoView({behavior:"smooth",block:"start"});},80);return;}
    if(acao==="iris"){go("dna");setTimeout(function(){var b=I("#dnaRun");if(b)b.click();},80);return;}
    if(acao==="propostas"){go("propostas");return;}
    if(acao==="reativar"){await salvarOp(id,{pausado:false});toast("Cliente reativado.");go(state.view);return;}
    if(acao.indexOf("ir:")===0){go(acao.slice(3));return;}
    if(acao.indexOf("rodar:")===0){var ag=acao.slice(6);if(bt)bt.disabled=true;if(m)m.textContent="Pedindo";
      try{await chamarServidor("rodar",{cliente:id,agente:ag});toast("Pedido enviado. Acompanhe em Agentes; o resultado aparece aqui quando terminar.");if(m)m.textContent="";}
      catch(e){if(m){m.textContent=e.message;}if(bt)bt.disabled=false;}}
  }
  // Etapa bloqueada e vazia não abre: diz o que falta. Com conteúdo (cliente antigo), abre.
  function ligarTrilho(h){
    h.querySelectorAll('#cliTabs .tr-et').forEach(function(b){b.addEventListener('click',function(){
      if(b.getAttribute('aria-disabled')==="true"){var r=etapasDe(state.client),a=r.etapas[r.atual-1];toast("Esta etapa abre depois de "+ETAPAS[r.atual-1][1]+(a&&a.falta?": "+a.falta.charAt(0).toLowerCase()+a.falta.slice(1):"")+".");return;}
      go(b.getAttribute('data-tab-ir'));});});
  }
  function ligarProcesso(h){
    h.querySelectorAll('[data-passo]').forEach(function(b){b.addEventListener('click',function(){fazerPasso(b.getAttribute('data-passo'),b)})});
    var cr=I("#comoRoda");if(cr)cr.onclick=function(){abrirComoRoda(state.client)};
  }

  // Qualquer tela do cliente que grava dados (DNA, plano, peças) redesenha só o próprio
  // conteúdo; o trilho e a faixa ficam fora dele. Um observador sobre o conteúdo
  // mantém os dois em dia sem cada tela precisar lembrar de chamar.
  var procPendente=0;
  function atualizarProcesso(){
    var v=state.view,h=I("#cliHead");
    if(!h||h.hidden||!state.client||state.clientView||!abaDoCliente(v)||!isDbClient(state.client))return;
    var foco=document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#cliHead")?document.activeElement.getAttribute("data-etapa"):null;
    I("#cliTabs").innerHTML=trilhoHtml(state.client,v);I("#cliFaixa").innerHTML=faixaHtml(state.client);ligarProcesso(h);
    ligarTrilho(h);
    if(foco){var f=h.querySelector('[data-etapa="'+foco+'"]');if(f)f.focus();}
  }
  (function(){var w=document.querySelector(".wrap");if(!w||!window.MutationObserver)return;
    new MutationObserver(function(){clearTimeout(procPendente);procPendente=setTimeout(atualizarProcesso,60);}).observe(w,{childList:true,subtree:true});})();

  // ---------- Gaveta "Como este cliente roda" ----------
  var DS_CURTO=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],ORDEM_SEM=[1,2,3,4,5,6,0];
  var HOR_PADRAO={planHora:7,radarDia:1,radarHora:7,estHora:6,estDias:7};
  function selN(k,val,ops,rot){return '<select data-cr="'+k+'" aria-label="'+esc(rot)+'">'+ops.map(function(o){return '<option value="'+o[0]+'"'+(String(o[0])===String(val)?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select>';}
  var HORAS=Array.from({length:17},function(_,i){var h=i+5;return [h,h+"h"]});
  function comoRodaDe(id){
    var op=opDo(id),h=Object.assign({},HOR_PADRAO,op.horarios||{}),r=rotinaOf(id),dias=(r.diasPost&&r.diasPost.length?r.diasPost:DIAS_PADRAO[3]).slice();
    return {plano:op.agentes.pulso!=="manual",radar:op.agentes.radar!=="manual",estudio:op.agentes.estudio!=="manual",
      cliCal:op.clienteAprova!=="nada",cliPeca:op.clienteAprova==="calendario_e_pecas",semResp:!!op.semRespostaPublica,pausa:!!op.pausado,
      diaPlan:op.diaPlanejamento||20,prazo:op.prazoCliente||2,h:h,dias:dias,gravDia:+r.gravDia||1,horaPost:r.Reel||"18:30"};
  }
  function semanaDaGaveta(x){
    return '<div class="cr-semana"><div class="cr-st">A semana de '+esc(clientName(state.client))+'<small>muda enquanto você ajusta</small></div><div class="cr-g">'+ORDEM_SEM.map(function(d){
      var ev='',off=x.pausa?' off':'';
      if(x.radar&&+x.h.radarDia===d)ev+='<span class="cr-ev'+off+'"><b>'+x.h.radarHora+'h</b>Pesquisa de pautas</span>';
      if(x.estudio)ev+='<span class="cr-ev'+off+'"><b>'+x.h.estHora+'h</b>Peças escritas</span>';
      if(+x.gravDia===d)ev+='<span class="cr-ev grav"><b>Gravação</b>da semana</span>';
      if(x.dias.indexOf(d)>=0)ev+='<span class="cr-ev post"><b>'+esc(x.horaPost)+'</b>Post no ar</span>';
      return '<div class="cr-d"><span class="cr-dn">'+DS_CURTO[d]+'</span>'+ev+'</div>';}).join('')+'</div></div>'+
      (x.plano&&!x.pausa?'<p class="pp-m" style="margin:8px 0 0">E uma vez por mês: dia '+x.diaPlan+' às '+x.h.planHora+'h, o planejamento do mês seguinte.</p>':'');
  }
  function chaveHtml(k,on,t,dOn,dOff,extra,classe){
    return '<div class="cr-chave'+(on?'':' off')+(classe?' '+classe:'')+'"><div class="cr-c"><div class="cr-t" id="crt-'+k+'">'+esc(t)+'</div><div class="cr-d-txt">'+esc(on?dOn:dOff)+'</div>'+(extra&&on?'<div class="cr-extra">'+extra+'</div>':'')+'</div>'+
      '<button class="sw" role="switch" aria-checked="'+(on?'true':'false')+'" aria-labelledby="crt-'+k+'" data-crk="'+k+'"></button></div>';
  }
  function comoRodaCorpo(x){
    var hs=function(k,rot){return selN(k,x.h[k],HORAS,rot)};
    return semanaDaGaveta(x)+
      '<div class="cr-grupo">Planejamento</div>'+
      chaveHtml("plano",x.plano,"Planejamento mensal automático","O Pulso lê o mês e o Átlas propõe o plano do próximo. Vocês aprovam.","Ninguém planeja o próximo mês sozinho. Use Pedir agora na etapa Planejar.",
        'Todo dia '+selN("diaPlan",x.diaPlan,Array.from({length:28},function(_,i){return [i+1,String(i+1)]}),"Dia do planejamento")+' do mês, às '+hs("planHora","Hora do planejamento"))+
      chaveHtml("radar",x.radar,"Pesquisa semanal de pautas","O Radar traz pautas do nicho com fonte e data.","Sem pautas novas; o plano usa só o DNA e os resultados.",
        'Toda '+selN("radarDia",x.h.radarDia,[[1,"segunda"],[2,"terça"],[3,"quarta"],[4,"quinta"],[5,"sexta"],[6,"sábado"],[0,"domingo"]],"Dia da pesquisa")+' às '+hs("radarHora","Hora da pesquisa"))+
      '<div class="cr-grupo">Produção</div>'+
      chaveHtml("estudio",x.estudio,"Peças escritas com antecedência","O Estúdio escreve as peças que ainda não têm texto e manda para a aprovação de vocês.","As peças ficam sem texto até alguém pedir na etapa Produzir.",
        'Todo dia às '+hs("estHora","Hora do Estúdio")+' escreve as peças dos próximos '+selN("estDias",x.h.estDias,[[3,"3 dias"],[7,"7 dias"],[14,"14 dias"]],"Antecedência"))+
      '<div class="cr-grupo">Rotina de postagem</div><div class="cr-rot"><div class="cr-t">Dias de postar</div><div class="cr-dias">'+ORDEM_SEM.map(function(d){var on=x.dias.indexOf(d)>=0;return '<button class="cr-dia'+(on?' on':'')+'" data-crdia="'+d+'" aria-pressed="'+on+'">'+DS_CURTO[d]+'</button>'}).join('')+'</div>'+
        '<div class="cr-linha">Dia de gravação '+selN("gravDia",x.gravDia,ORDEM_SEM.map(function(d){return [d,DS_CURTO[d]]}),"Dia de gravação")+'<span>'+x.dias.length+' post'+(x.dias.length===1?'':'s')+' por semana</span></div>'+
        '<div class="cr-linha"><button class="lnk" id="crHorarios">Horário de cada formato (Reel, carrossel, stories)</button></div></div>'+
      '<div class="cr-grupo">Aprovação do cliente</div>'+
      chaveHtml("cliCal",x.cliCal,"Cliente aprova o calendário","Depois que vocês aprovam, o cliente recebe o calendário do mês.","O calendário vale com a aprovação de vocês.")+
      chaveHtml("cliPeca",x.cliPeca,"Cliente aprova cada peça","Cada peça aprovada por vocês vai para o cliente.","A peça vale com a aprovação de vocês.",'Prazo de resposta '+selN("prazo",x.prazo,[[1,"1 dia"],[2,"2 dias"],[3,"3 dias"],[5,"5 dias"]],"Prazo do cliente"))+
      chaveHtml("semResp",x.semResp,"Publicar se o cliente não responder no prazo","Passou o prazo, a peça segue com a aprovação de vocês.","A peça espera a resposta do cliente.")+
      '<div class="cr-grupo">Pausa</div>'+
      chaveHtml("pausa",x.pausa,"Pausar tudo deste cliente","Nenhum agente roda sozinho. O que já foi aprovado continua no calendário.","Os agentes seguem as regras acima.","","pausa")+
      '<div class="cr-linha" style="margin-top:16px"><button class="lnk" id="crExec">Ver o que os agentes já fizeram para este cliente</button></div>';
  }
  function abrirComoRoda(id){
    if(!id)return;var x=comoRodaDe(id);
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Como este cliente roda"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">Como '+esc(clientName(id))+' roda</div><div class="d-sub">O que acontece sozinho, quando acontece e o que espera vocês.</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div>'+
      '<div class="db" id="crCorpo"></div><div class="df"><span class="pp-m" style="margin-right:auto">Cada mudança fica registrada na ficha do cliente.</span><button class="btn" id="crCancelar">Cancelar</button><button class="btn pri" id="crSalvar">Salvar</button></div></aside>';
    var fechar=function(){closeDrawer();};
    I("#scrim").addEventListener('click',fechar);I("#dclose").addEventListener('click',fechar);I("#crCancelar").addEventListener('click',fechar);document.addEventListener('keydown',escClose);
    function desenhar(){var c=I("#crCorpo"),y=c.scrollTop;c.innerHTML=comoRodaCorpo(x);c.scrollTop=y;
      c.querySelectorAll('[data-crk]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-crk');x[k]=!x[k];if(k==="cliPeca"&&x.cliPeca)x.cliCal=true;if(k==="cliCal"&&!x.cliCal)x.cliPeca=false;desenhar();})});
      c.querySelectorAll('select[data-cr]').forEach(function(s){s.addEventListener('change',function(){var k=s.getAttribute('data-cr'),v=+s.value;if(k in HOR_PADRAO)x.h[k]=v;else x[k]=v;desenhar();})});
      c.querySelectorAll('[data-crdia]').forEach(function(b){b.addEventListener('click',function(){var d=+b.getAttribute('data-crdia'),i=x.dias.indexOf(d);if(i>=0){if(x.dias.length>1)x.dias.splice(i,1);}else x.dias.push(d);desenhar();})});
      var hr=I("#crHorarios");if(hr)hr.addEventListener('click',function(){closeDrawer();go("calendar");openCalConfig();});
      var ex=I("#crExec");if(ex)ex.addEventListener('click',function(){closeDrawer();go("operacao");});
    }
    desenhar();
    I("#crSalvar").addEventListener('click',async function(){
      var bt=this;bt.disabled=true;
      try{
        var ag=Object.assign({},opDo(id).agentes||{});ag.pulso=x.plano?"auto":"manual";ag.radar=x.radar?"auto":"manual";ag.estudio=x.estudio?"auto":"manual";
        await salvarOp(id,{agentes:ag,diaPlanejamento:x.diaPlan,horarios:x.h,clienteAprova:x.cliPeca?"calendario_e_pecas":x.cliCal?"calendario":"nada",prazoCliente:x.prazo,semRespostaPublica:x.semResp,pausado:x.pausa});
        var rec=DB_CLIENTS[id]||{},rot=Object.assign({},rotinaOf(id),{diasPost:x.dias.slice().sort(),gravDia:x.gravDia});
        await saveClientRecord(id,Object.assign({},DB_CLIENTS[id]||rec,{rotina:rot}));
        state.diasPost=null;closeDrawer();toast("Salvo. "+(x.pausa?"Cliente pausado.":"Os agentes seguem estas regras a partir de agora."));go(state.view);
      }catch(e){bt.disabled=false;toast("Não consegui salvar: "+(e.message||e));}
    });
  }
