  // ---- Dashboard: a carteira inteira no mesmo desenho do processo do cliente ----
  // Lê o estado de cada cliente (mesmo cálculo de etapa do trilho, etapasDe) e
  // mostra: números do topo, carteira por etapa, tabela de clientes, próximas
  // publicações e, no painel publicado, a atividade dos agentes e o gasto.
  var DASH_CARREGANDO=false;
  function dashClientes(){return CLIENTS.filter(function(c){return isDbClient(c.id)});}
  function dashAdmin(id){return typeof adminOf==="function"?adminOf(DB_CLIENTS[id]||{}):{ativo:true};}
  function miniTrilho(r){
    return '<span class="mini-tr" aria-label="Etapa '+r.atual+' de 6">'+r.etapas.map(function(e,i){return '<i class="'+e.estado+(r.atual===i+1&&e.estado==="atual"?' agora':'')+'" title="'+esc(ETAPAS[i][1])+'"></i>'}).join('')+'</span>';
  }
  function proxPub(id){
    var g=DB_STATE_CACHE[id]||{},hoje=fmtD(new Date());
    var it=((g.calendar&&g.calendar.items)||[]).filter(function(i){return String(i.data)>=hoje&&i.status!=="PUBLISHED"}).sort(function(a,b){return String(a.data).localeCompare(b.data)})[0];
    return it?{quando:quando(it),titulo:pecaTitulo(it)}:null;
  }
  function automacao(id){var op=typeof opDo==="function"?opDo(id):{agentes:{}};if(op.pausado)return ["Pausado","warn"];var man=["pulso","radar","estudio"].filter(function(a){return op.agentes&&op.agentes[a]==="manual"}).length;return man===0?["Automático","act"]:man===3?["Manual",""]:["Parcial","warn"];}

  async function renderDashboard(){
    var el=I("#dashboard");if(!el)return;
    var clis=dashClientes();
    if(!clis.length){el.innerHTML=vazioQuadro("Nenhum cliente ainda.","Cadastre o primeiro cliente e mande o link do briefing. O dashboard mostra a carteira inteira assim que houver clientes.",'<button class="btn pri" id="dashNovo">Novo cliente</button>');var n=I("#dashNovo");if(n)n.addEventListener('click',openNewClientModal);return;}
    var faltam=clis.filter(function(c){return !DB_STATE_CACHE[c.id]});
    if(faltam.length){
      if(!el.innerHTML)el.innerHTML='<div class="ag-carregando">Carregando a carteira</div>';
      if(!DASH_CARREGANDO){DASH_CARREGANDO=true;Promise.all(faltam.map(function(c){return loadDbClientState(c.id)})).then(function(){DASH_CARREGANDO=false;if(state.view==="dashboard")renderDashboard();});}
      return;
    }
    var hoje=fmtD(new Date()),mes=hoje.slice(0,7);
    var linhas=clis.map(function(c){var r=etapasDe(c.id),a=dashAdmin(c.id),x=proximoPasso(c.id),g=DB_STATE_CACHE[c.id]||{},it=((g.calendar&&g.calendar.items)||[]).filter(function(i){return String(i.data||"").slice(0,7)===mes});
      return {c:c,r:r,ativo:a.ativo!==false,x:x,pecas:it.length,aprov:it.filter(function(i){return APROVADA[i.status]}).length,pub:it.filter(function(i){return i.status==="PUBLISHED"}).length,prox:proxPub(c.id),auto:automacao(c.id)};});
    var ativos=linhas.filter(function(l){return l.ativo});
    var comVoce=ativos.filter(function(l){return l.x.quem==="voce"}).length,comCliente=ativos.filter(function(l){return l.x.quem==="cliente"}).length;
    var pecas=ativos.reduce(function(s,l){return s+l.pecas},0),aprov=ativos.reduce(function(s,l){return s+l.aprov},0),pub=ativos.reduce(function(s,l){return s+l.pub},0);
    var pausados=ativos.filter(function(l){return l.auto[0]==="Pausado"}).length;
    var pct=function(a,b){return b?Math.round(a/b*100):0};
    var h='<div class="stat-cards quatro">'+
      kpiCard("Clientes ativos",String(ativos.length),(pausados?pausados+' pausado'+(pausados>1?'s':'')+', ':'')+(linhas.length-ativos.length?(linhas.length-ativos.length)+' inativo'+(linhas.length-ativos.length>1?'s':''):'todos em operação'))+
      kpiCard("Esperando vocês",String(comVoce),comCliente?comCliente+' esperando o cliente':'nada esperando o cliente')+
      kpiCard("Peças aprovadas no mês",aprov+'<small class="st-de"> de '+pecas+'</small>','<span class="tr-barra largo"><i style="width:'+pct(aprov,pecas)+'%"></i></span>')+
      kpiCard("Publicadas no mês",pub+'<small class="st-de"> de '+pecas+'</small>','<span class="tr-barra largo"><i style="width:'+pct(pub,pecas)+'%"></i></span>')+'</div>';
    // carteira por etapa
    h+=quadro("Carteira por etapa","Onde cada cliente está no processo e o que falta. Clique para abrir a etapa dele.",'',
      '<div class="kanban">'+ETAPAS.map(function(t,i){var n=i+1,col=ativos.filter(function(l){return l.r.atual===n});
        return '<div class="kb-col"><div class="kb-h"><span class="kb-n">'+n+'</span>'+t[1]+'<span class="kb-c">'+col.length+'</span></div>'+
          (col.length?col.map(function(l){var q=l.x.quem&&QUEM_LBL[l.x.quem];return '<button class="kb-card" data-dash-cli="'+esc(l.c.id)+'" data-dash-ir="'+(ETAPAS[l.r.atual-1][2])+'"><span class="kb-t"><span class="av-cli pequeno" style="background:'+avc(l.c.av||0)+'">'+esc(String(l.c.name||"?").charAt(0))+'</span><b>'+esc(l.c.name)+'</b></span><span class="kb-f">'+esc(l.x.tit)+'</span>'+(q?'<span class="chip quem-'+q[1]+'">'+q[0]+'</span>':'')+'</button>'}).join(''):'<span class="kb-vazio">Ninguém aqui</span>')+'</div>';}).join('')+'</div>');
    // tabela de clientes
    h+=quadro("Clientes","Próximo passo de cada um, com quem está a bola e como anda o mês.",'<button class="btn" data-dash-lista>Abrir a lista de clientes</button>',
      '<div class="tabela"><table><thead><tr><th>Cliente</th><th>Etapa</th><th>Próximo passo</th><th>Peças do mês</th><th>Próxima publicação</th><th>Automação</th></tr></thead><tbody>'+
      linhas.map(function(l){var q=l.x.quem&&QUEM_LBL[l.x.quem];
        return '<tr data-dash-cli="'+esc(l.c.id)+'" data-dash-ir="'+ETAPAS[l.r.atual-1][2]+'"'+(l.ativo?'':' class="apagada"')+'><td><div class="cel-cli"><span class="av-cli" style="background:'+avc(l.c.av||0)+'">'+esc(String(l.c.name||"?").charAt(0))+'</span><span><b>'+esc(l.c.name)+'</b><small>'+esc(l.c.niche||"")+'</small></span></div></td>'+
          '<td>'+miniTrilho(l.r)+'<small>'+l.r.atual+'. '+ETAPAS[l.r.atual-1][1]+'</small></td>'+
          '<td class="e-reg"><b class="cel-t">'+esc(l.x.tit)+'</b>'+(q?'<small><span class="chip quem-'+q[1]+'">'+q[0]+'</span></small>':'')+'</td>'+
          '<td class="tnum">'+(l.pecas?'<span class="tr-barra largo"><i style="width:'+pct(l.aprov,l.pecas)+'%"></i></span><small>'+l.aprov+' de '+l.pecas+' aprovadas, '+l.pub+' no ar</small>':'<small>sem peças no mês</small>')+'</td>'+
          '<td>'+(l.prox?'<b class="cel-t">'+esc(l.prox.quando)+'</b><small>'+esc(String(l.prox.titulo||"").slice(0,48))+'</small>':'<small>nada agendado</small>')+'</td>'+
          '<td><span class="chip '+l.auto[1]+'">'+l.auto[0]+'</span></td></tr>';}).join('')+'</tbody></table></div>');
    // próximas publicações + agentes
    var ate=fmtD(new Date(Date.now()+14*864e5)),pubs=[];
    ativos.forEach(function(l){var g=DB_STATE_CACHE[l.c.id]||{};((g.calendar&&g.calendar.items)||[]).forEach(function(it){if(String(it.data)>=hoje&&String(it.data)<=ate)pubs.push({l:l,it:it});});});
    pubs.sort(function(a,b){return (a.it.data+itemHora(a.it)).localeCompare(b.it.data+itemHora(b.it))});
    var pubsHtml=pubs.length?pubs.slice(0,12).map(function(p){return '<div class="linha dash-pub" data-dash-cli="'+esc(p.l.c.id)+'" data-dash-ir="calendar"><span class="dash-cor" style="background:'+avc(p.l.c.av||0)+'"></span><div class="l-main"><b>'+esc(pecaTitulo(p.it))+'</b><small>'+esc(quando(p.it))+', '+esc(p.l.c.name)+'</small></div><span class="chip '+(ST_CHIP[p.it.status]||"")+'">'+esc(stLabel(p.it.status))+'</span></div>'}).join('')+(pubs.length>12?'<p class="pp-m" style="margin-top:12px">E mais '+(pubs.length-12)+' no Calendário.</p>':''):'<div class="vazio">Nada nos próximos 14 dias.</div>';
    h+='<div class="grid cols-2 q-par">'+quadro("Próximos 14 dias",pubs.length+' publicaç'+(pubs.length===1?'ão':'ões')+' de todos os clientes.','<button class="btn" data-dash-agenda>Calendário</button>',pubsHtml)+
      '<div id="dashAgentes">'+(SB?quadro("Agentes","Carregando a atividade.",'',''):quadro("Agentes","A atividade e o gasto dos agentes aparecem no painel publicado, com login da equipe.",'',''))+'</div></div>';
    el.innerHTML=h;
    el.querySelectorAll('[data-dash-cli]').forEach(function(x){x.addEventListener('click',function(){var id=x.getAttribute('data-dash-cli');setClient(id);go(x.getAttribute('data-dash-ir')||"dna");});});
    var dl=el.querySelector('[data-dash-lista]');if(dl)dl.addEventListener('click',function(){go("clients")});
    var da=el.querySelector('[data-dash-agenda]');if(da)da.addEventListener('click',function(){go("agenda")});
    if(SB)dashAgentes();
  }
  async function dashAgentes(){
    var box=I("#dashAgentes");if(!box)return;
    try{
      var est=await chamarServidor("estado");
      var runs=((await SB.c.from("agent_runs").select("agente,client_id,status,custo_usd,started_at").order("started_at",{ascending:false}).limit(8)).data)||[];
      var gasto=Number(est.gasto||0),teto=Number(est.orcamento||0);
      box.innerHTML=quadro("Agentes",est.chave?'Servidor ligado, modelo '+esc(est.modelo||""):'Sem chave da Anthropic no servidor.','<button class="btn" data-dash-ag>Ver tudo</button>',
        '<div class="dash-gasto"><span>Gasto do mês</span><b class="tnum">US$ '+gasto.toFixed(2)+'</b><small>de US$ '+teto.toFixed(0)+'</small></div><span class="tr-barra largo"><i style="width:'+(teto?Math.min(100,gasto/teto*100):0)+'%"></i></span>'+
        (runs.length?runs.map(function(r){var st=ST_RUN[r.status]||["",r.status];return '<div class="linha"><div class="l-main"><b>'+esc((AG_INFO[r.agente]||[r.agente])[0])+(r.client_id?', '+esc(clientName(r.client_id)):'')+'</b><small>'+esc(quandoTs(r.started_at))+'</small></div><span class="chip '+st[0]+'">'+esc(st[1])+'</span></div>'}).join(''):'<div class="vazio" style="margin-top:12px">Nenhuma execução ainda.</div>'));
      var b=box.querySelector('[data-dash-ag]');if(b)b.addEventListener('click',function(){go("agents")});
    }catch(e){box.innerHTML=quadro("Agentes","Não consegui ler a atividade agora.",'','');}
  }
