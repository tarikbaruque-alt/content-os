  // ---- Calendário geral (aba própria na coluna esquerda) ----
  // Todas as peças de todos os clientes num mês, como no Notion: grade do mês
  // ou semana, cor por cliente, arrastar a peça para outro dia e clicar para
  // abrir. As peças vêm do mesmo banco do calendário de cada cliente.
  var AG_ITENS=null,AG_CARREGANDO=false,AG_DIAS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  var AG_ST={"PLANNED":"planejada","IN PRODUCTION":"produzindo","REVIEW":"revisão","WAITING APPROVAL":"aprovar","APPROVED":"aprovada","SCHEDULED":"agendada","PUBLISHED":"publicada"};
  function agInicioMes(d){return new Date(d.getFullYear(),d.getMonth(),1);}
  function agSegunda(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
  function agCor(cid){var c=CLIENTS.filter(function(x){return x.id===cid})[0];return avc(c?c.av:0);}
  function agEditavel(){return !!CAP.db&&!state.clientView;}
  function agClientes(){return Object.keys(DB_CLIENTS).map(function(id){return {id:id,nome:clientName(id)}}).sort(function(a,b){return a.nome.localeCompare(b.nome)});}
  function agDoCache(){
    var out=[];
    agClientes().forEach(function(c){var g=DB_STATE_CACHE[c.id];if(g)(g.calendar.items||[]).forEach(function(it){if(isIsoDate(it.data))out.push({cid:c.id,it:it});});});
    return out;
  }
  async function agCarregar(){
    if(AG_CARREGANDO)return;AG_CARREGANDO=true;
    var out=[];
    for(var c of agClientes()){
      var g=DB_STATE_CACHE[c.id];
      if(g){(g.calendar.items||[]).forEach(function(it){if(isIsoDate(it.data))out.push({cid:c.id,it:it});});continue;}
      try{var snap=await dbItemsCol("cos_calendar",c.id).get();snap.docs.forEach(function(d){var it=d.data();if(it&&isIsoDate(it.data))out.push({cid:c.id,it:it});});}catch(e){}
    }
    AG_ITENS=out;AG_CARREGANDO=false;
    if(state.view==="agenda")renderAgendaGeral();
  }
  function agVisiveis(){
    var f=state.agFiltro;
    return (AG_ITENS||[]).filter(function(o){return !f||f.indexOf(o.cid)>=0}).sort(function(a,b){return (a.it.data+itemHora(a.it)).localeCompare(b.it.data+itemHora(b.it))});
  }
  function agPorDia(){var m={};agVisiveis().forEach(function(o){(m[o.it.data]=m[o.it.data]||[]).push(o)});return m;}
  function agEvHtml(o,cheio){
    var it=o.it,x=it.idea||{},pub=it.status==="PUBLISHED";
    return '<div class="ag-ev'+(pub?' pub':'')+(cheio?' cheio':'')+'" data-ag-cli="'+esc(o.cid)+'" data-ag-id="'+esc(it.id)+'"'+(agEditavel()?' draggable="true"':'')+' style="--c:'+agCor(o.cid)+'" title="'+esc(pecaTitulo(it)+", "+clientName(o.cid))+'">'+
      '<span class="ag-ev-t">'+esc(pecaTitulo(it))+'</span>'+
      '<span class="ag-ev-m">'+(cheio?esc(itemHora(it))+' · ':'')+esc(clientName(o.cid))+(cheio?' · '+esc(surfLbl(x.surface)):'')+'</span>'+
      (cheio?'<span class="chip '+(ST_CHIP[it.status]||"")+'">'+esc(AG_ST[it.status]||stLabel(it.status))+'</span>':'')+'</div>';
  }
  function agTitulo(ref,modo){
    if(modo==="semana"){var ini=agSegunda(ref),fim=new Date(ini);fim.setDate(ini.getDate()+6);
      return ini.getDate()+(ini.getMonth()!==fim.getMonth()?' de '+MESES_LONGOS[ini.getMonth()]:'')+' a '+fim.getDate()+' de '+MESES_LONGOS[fim.getMonth()]+' '+fim.getFullYear();}
    var n=MESES_LONGOS[ref.getMonth()];return n.charAt(0).toUpperCase()+n.slice(1)+' '+ref.getFullYear();
  }
  function renderAgendaGeral(dir){
    var el=I("#agendaGeral");if(!el)return;
    // A peça arrastada some no redesenho e o dragend pode não chegar: o estado de arrasto zera aqui.
    el.classList.remove("arrastando-algo");
    if(!Object.keys(DB_CLIENTS).length){el.innerHTML=vazioQuadro("Nenhum cliente ainda.","Cadastre um cliente e monte o calendário dele. As peças de todos os clientes aparecem juntas aqui.",'<button class="btn pri" data-ag-ir="clients">Ir para Clientes</button>');agLigar(el);return;}
    if(!AG_ITENS){el.innerHTML='<div class="ag-carregando">Carregando as peças dos clientes</div>';agCarregar();return;}
    var modo=state.agModo||"mes",ref=state.agRef?new Date(state.agRef):new Date(),hoje=fmtD(new Date()),porDia=agPorDia();
    var h='<div class="ag-topo"><div class="ag-nav"><h2 class="ag-mes">'+esc(agTitulo(ref,modo))+'</h2>'+
      '<button class="icon-btn sm ag-seta ant" data-ag-passo="-1" aria-label="Anterior">'+iconeUI("seta-cima")+'</button><button class="icon-btn sm ag-seta prox" data-ag-passo="1" aria-label="Próximo">'+iconeUI("seta-cima")+'</button>'+
      '<button class="btn" data-ag-hoje>Hoje</button></div>'+
      '<div class="subtabs"><button class="sub'+(modo==="mes"?' on':'')+'" data-ag-modo="mes">Mês</button><button class="sub'+(modo==="semana"?' on':'')+'" data-ag-modo="semana">Semana</button></div></div>';
    var clis=agClientes();
    if(clis.length>1)h+='<div class="ag-filtro">'+clis.map(function(c){var on=!state.agFiltro||state.agFiltro.indexOf(c.id)>=0;return '<button class="ag-cli'+(on?' on':'')+'" data-ag-cli-f="'+esc(c.id)+'" style="--c:'+agCor(c.id)+'"><i></i>'+esc(c.nome)+'</button>'}).join('')+'</div>';
    var anim=dir?' ag-anim'+(dir>0?'-d':'-e'):'';
    h+='<div class="ag-grade '+(modo==="semana"?'semana':'mes')+anim+'"><div class="ag-cab">'+AG_DIAS.map(function(d,i){return '<div'+(i>4?' class="fds"':'')+'>'+d+'</div>'}).join('')+'</div><div class="ag-dias">';
    var ini=modo==="semana"?agSegunda(ref):agSegunda(agInicioMes(ref)),n=modo==="semana"?7:42,mes=ref.getMonth();
    if(modo==="mes"){var ult=new Date(ref.getFullYear(),mes+1,0);var fimGrade=new Date(ini);fimGrade.setDate(ini.getDate()+35);if(fimGrade>ult)n=35;}
    for(var i=0;i<n;i++){
      var d=new Date(ini);d.setDate(ini.getDate()+i);var iso=fmtD(d),evs=porDia[iso]||[],fora=modo==="mes"&&d.getMonth()!==mes,sel=state.agDia===iso;
      var lim=modo==="semana"?99:3;
      h+='<div class="ag-dia'+(fora?' fora':'')+(iso===hoje?' hoje':'')+(i%7>4?' fds':'')+(sel?' sel':'')+'" data-ag-dia="'+iso+'">'+
        '<div class="ag-num"><span>'+(d.getDate()===1&&modo==="mes"?d.getDate()+' '+MESES_LONGOS[d.getMonth()].slice(0,3):d.getDate())+'</span>'+(evs.length?'<i class="ag-conta">'+evs.length+'</i>':'')+'</div>'+
        '<div class="ag-evs">'+evs.slice(0,lim).map(function(o){return agEvHtml(o,modo==="semana")}).join('')+
        (evs.length>lim?'<button class="ag-mais" data-ag-mais="'+iso+'">mais '+(evs.length-lim)+'</button>':'')+'</div>'+
        '<div class="ag-pontos">'+evs.slice(0,4).map(function(o){return '<i style="background:'+agCor(o.cid)+'"></i>'}).join('')+'</div></div>';
    }
    h+='</div></div>';
    // Lista do dia escolhido: no celular a grade só mostra pontos, e é aqui que se lê.
    var diaSel=state.agDia&&porDia[state.agDia]?state.agDia:null;
    h+='<div class="ag-lista-dia"'+(diaSel?'':' hidden')+'>'+(diaSel?'<div class="bt">'+esc(dataBR(diaSel))+'</div>'+porDia[diaSel].map(function(o){return agEvHtml(o,true)}).join(''):'')+'</div>';
    if(!(AG_ITENS||[]).length)h+='<p class="pp-m" style="margin-top:16px">Nenhuma peça com data ainda. Quando o Cronos distribuir as ideias de um cliente, elas aparecem aqui.</p>';
    el.innerHTML=h;agLigar(el);
  }
  function agLigar(el){
    el.querySelectorAll('[data-ag-ir]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-ag-ir'))})});
    el.querySelectorAll('[data-ag-passo]').forEach(function(b){b.addEventListener('click',function(){
      var p=+b.getAttribute('data-ag-passo'),ref=state.agRef?new Date(state.agRef):new Date();
      if((state.agModo||"mes")==="semana")ref.setDate(ref.getDate()+7*p);else ref=new Date(ref.getFullYear(),ref.getMonth()+p,1);
      state.agRef=ref.getTime();state.agDia=null;renderAgendaGeral(p);})});
    var hj=el.querySelector('[data-ag-hoje]');if(hj)hj.addEventListener('click',function(){var velho=state.agRef;state.agRef=null;state.agDia=fmtD(new Date());renderAgendaGeral(velho&&velho<Date.now()?1:velho?-1:0);});
    el.querySelectorAll('[data-ag-modo]').forEach(function(b){b.addEventListener('click',function(){state.agModo=b.getAttribute('data-ag-modo');renderAgendaGeral();})});
    el.querySelectorAll('[data-ag-cli-f]').forEach(function(b){b.addEventListener('click',function(){
      var id=b.getAttribute('data-ag-cli-f'),todos=agClientes().map(function(c){return c.id}),f=state.agFiltro?state.agFiltro.slice():todos.slice(),i=f.indexOf(id);
      if(i>=0)f.splice(i,1);else f.push(id);
      state.agFiltro=f.length===todos.length||!f.length?null:f;renderAgendaGeral();})});
    el.querySelectorAll('.ag-ev').forEach(function(ev){
      ev.addEventListener('click',function(e){e.stopPropagation();agAbrir(ev.getAttribute('data-ag-cli'),ev.getAttribute('data-ag-id'));});
      ev.addEventListener('dragstart',function(e){e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",ev.getAttribute('data-ag-cli')+"|"+ev.getAttribute('data-ag-id'));ev.classList.add('arrastando');el.classList.add('arrastando-algo');});
      ev.addEventListener('dragend',function(){ev.classList.remove('arrastando');el.classList.remove('arrastando-algo');el.querySelectorAll('.ag-dia.alvo').forEach(function(d){d.classList.remove('alvo')});});
    });
    el.querySelectorAll('.ag-dia').forEach(function(dia){
      dia.addEventListener('click',function(){state.agDia=state.agDia===dia.getAttribute('data-ag-dia')?null:dia.getAttribute('data-ag-dia');renderAgendaGeral();});
      if(!agEditavel())return;
      dia.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect="move";dia.classList.add('alvo');});
      dia.addEventListener('dragleave',function(e){if(!dia.contains(e.relatedTarget))dia.classList.remove('alvo');});
      dia.addEventListener('drop',function(e){e.preventDefault();dia.classList.remove('alvo');var v=(e.dataTransfer.getData("text/plain")||"").split("|");if(v.length===2)agMover(v[0],v[1],dia.getAttribute('data-ag-dia'));});
    });
    el.querySelectorAll('[data-ag-mais]').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();state.agDia=b.getAttribute('data-ag-mais');renderAgendaGeral();var l=el.querySelector('.ag-lista-dia');if(l)l.scrollIntoView({behavior:"smooth",block:"nearest"});})});
  }
  async function agMover(cid,id,novaData){
    var o=(AG_ITENS||[]).filter(function(x){return x.cid===cid&&x.it.id===id})[0];if(!o||o.it.data===novaData)return;
    var antiga=o.it.data;o.it.data=novaData;
    var g=DB_STATE_CACHE[cid];if(g)(g.calendar.items||[]).forEach(function(it){if(it.id===id)it.data=novaData;});
    renderAgendaGeral();
    try{await dbItemsCol("cos_calendar",cid).doc(id).update({data:novaData});toast(pecaTitulo(o.it)+" foi para "+dataBR(novaData)+".");}
    catch(e){o.it.data=antiga;if(g)(g.calendar.items||[]).forEach(function(it){if(it.id===id)it.data=antiga;});renderAgendaGeral();toast("Não consegui mover a peça. Tente de novo.");}
  }
  // Abrir uma peça de qualquer cliente: carrega o cliente, abre a mesma gaveta do calendário dele.
  async function agAbrir(cid,id){
    if(state.client!==cid){state.client=cid;GENERATED=await loadDbClientState(cid);setClient(cid);}
    var itens=(GENERATED&&GENERATED.calendar&&GENERATED.calendar.items)||[],idx=-1;
    itens.forEach(function(it,i){if(it.id===id)idx=i;});
    if(idx<0)return;
    openGenerated(idx);
    var ov=I("#overlay");if(!ov||ov._agObs)return;
    ov._agObs=new MutationObserver(function(){if(!ov.children.length&&state.view==="agenda"){AG_ITENS=agDoCache().length||!AG_ITENS?agMesclar():AG_ITENS;renderAgendaGeral();}});
    ov._agObs.observe(ov,{childList:true});
  }
  // Depois de editar na gaveta, o cache do cliente tem a versão nova: troca só as peças dele.
  function agMesclar(){
    var doCache=agDoCache(),comCache={};doCache.forEach(function(o){comCache[o.cid]=1});
    return doCache.concat((AG_ITENS||[]).filter(function(o){return !comCache[o.cid]}));
  }
